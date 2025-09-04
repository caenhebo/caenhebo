import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

interface Params {
  params: Promise<{
    id: string
  }>
}

// Download a document
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
        transaction: true
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
        { error: 'You do not have permission to download this document' },
        { status: 403 }
      )
    }

    // Read file from filesystem
    let filePath: string
    if (document.propertyId) {
      filePath = path.join(UPLOAD_DIR, 'properties', document.propertyId, document.filename)
    } else if (document.transactionId) {
      filePath = path.join(UPLOAD_DIR, 'transactions', document.transactionId, document.filename)
    } else {
      throw new Error('Document has no associated property or transaction')
    }
    
    try {
      const fileBuffer = await readFile(filePath)
      
      // Set appropriate headers for file download
      const headers = new Headers()
      headers.set('Content-Type', document.mimeType)
      headers.set('Content-Disposition', `attachment; filename="${document.originalName || document.filename}"`)
      headers.set('Content-Length', document.fileSize.toString())
      
      return new NextResponse(fileBuffer, { headers })
    } catch (error) {
      console.error('Error reading file:', error)
      return NextResponse.json(
        { error: 'File not found on server' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Error downloading document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}