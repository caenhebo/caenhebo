import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

interface Params {
  params: Promise<{
    path: string[]
  }>
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    const { path: pathSegments } = await params
    
    if (!pathSegments || pathSegments.length < 3) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      )
    }

    // Handle both /uploads/properties/id/filename and /api/uploads/properties/id/filename
    const type = pathSegments[0]
    const entityId = pathSegments[1]
    const filename = pathSegments.slice(2).join('/')
    
    if (!['properties', 'transactions'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      )
    }

    // Find the document in database to verify permissions
    const document = await prisma.document.findFirst({
      where: {
        filename,
        ...(type === 'properties' ? { propertyId: entityId } : { transactionId: entityId })
      },
      include: {
        property: true,
        transaction: true
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: 'File not found' },
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
        { error: 'You do not have permission to view this file' },
        { status: 403 }
      )
    }

    // Read and serve the file
    const filePath = path.join(UPLOAD_DIR, type, entityId, filename)
    
    try {
      const fileBuffer = await readFile(filePath)
      
      // Set appropriate headers
      const headers = new Headers({
        'Content-Type': document.mimeType,
        'Content-Length': document.fileSize.toString(),
        'Content-Disposition': `inline; filename="${document.originalName || document.filename}"`,
        'Cache-Control': 'private, max-age=3600'
      })
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers
      })
      
    } catch (error) {
      console.error('Error reading file:', error)
      return NextResponse.json(
        { error: 'File not accessible' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}