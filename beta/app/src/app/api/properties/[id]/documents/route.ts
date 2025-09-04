import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if property exists and user owns it
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: { sellerId: true }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Check access permissions
    const isOwner = property.sellerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'
    
    if (!isOwner && !isAdmin) {
      // Check if buyer has been granted access
      const hasAccess = await prisma.documentAccess.findFirst({
        where: {
          propertyId: params.id,
          buyerId: session.user.id,
          revoked: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        }
      })

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied - You need permission from the seller to view documents' },
          { status: 403 }
        )
      }
    }

    // Fetch documents for this property
    const documents = await prisma.document.findMany({
      where: { 
        propertyId: params.id 
      },
      orderBy: { 
        createdAt: 'desc' 
      }
    })

    // Format documents for response
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      type: doc.documentType,
      filename: doc.filename,
      originalName: doc.originalName || doc.filename,
      fileUrl: doc.fileUrl,
      size: doc.fileSize,
      mimeType: doc.mimeType,
      createdAt: doc.uploadedAt.toISOString(),
      verified: doc.verified,
      description: doc.description
    }))

    return NextResponse.json({
      documents: formattedDocuments,
      total: formattedDocuments.length
    })

  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}