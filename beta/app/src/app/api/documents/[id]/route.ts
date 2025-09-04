import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

interface Params {
  params: Promise<{
    id: string
  }>
}

// Delete a document
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    const { id: documentId } = await params
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // Find the document with related transaction/property data
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        property: true,
        transaction: true
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Check permissions: Only document uploader or admin can delete
    // For property documents: Also allow property owner
    // For transaction documents: Also allow transaction parties
    let canDelete = false
    
    if (session.user.role === 'ADMIN' || document.userId === session.user.id) {
      canDelete = true
    } else if (document.property && document.property.sellerId === session.user.id) {
      canDelete = true
    } else if (document.transaction && 
               (document.transaction.buyerId === session.user.id || 
                document.transaction.sellerId === session.user.id)) {
      canDelete = true
    }

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this document' },
        { status: 403 }
      )
    }

    // Delete file from filesystem
    try {
      let filePath: string
      if (document.propertyId) {
        filePath = path.join(UPLOAD_DIR, 'properties', document.propertyId, document.filename)
      } else if (document.transactionId) {
        filePath = path.join(UPLOAD_DIR, 'transactions', document.transactionId, document.filename)
      } else {
        throw new Error('Document has no associated property or transaction')
      }
      
      await unlink(filePath)
    } catch (error) {
      console.error('Error deleting file from filesystem:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete document record from database
    await prisma.document.delete({
      where: { id: documentId }
    })

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get document details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    const { id: documentId } = await params
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // Find the document with related data
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        property: true,
        transaction: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Check view permissions
    let canView = false
    
    if (session.user.role === 'ADMIN') {
      canView = true
    } else if (document.property) {
      // Property documents: Owner or interested buyers
      if (document.property.sellerId === session.user.id) {
        canView = true
      } else if (session.user.role === 'BUYER') {
        const hasInterest = await prisma.propertyInterest.findUnique({
          where: {
            propertyId_buyerId: {
              propertyId: document.property.id,
              buyerId: session.user.id
            }
          }
        })
        canView = !!hasInterest
      }
    } else if (document.transaction) {
      // Transaction documents: Only transaction parties
      canView = document.transaction.buyerId === session.user.id || 
                document.transaction.sellerId === session.user.id
    }

    if (!canView) {
      return NextResponse.json(
        { error: 'You do not have permission to view this document' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        type: document.type,
        filename: document.filename,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        url: document.url,
        title: document.title,
        description: document.description,
        createdAt: document.createdAt,
        uploader: document.user,
        propertyId: document.propertyId,
        transactionId: document.transactionId
      }
    })

  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}