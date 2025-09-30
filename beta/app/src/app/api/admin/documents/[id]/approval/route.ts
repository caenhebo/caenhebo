import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { status, comment } = body

    if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id }
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    const updatedDocument = await prisma.document.update({
      where: { id: params.id },
      data: {
        adminApprovalStatus: status,
        adminComment: comment || null,
        adminReviewedAt: new Date(),
        adminReviewedBy: session.user.id,
        verified: status === 'APPROVED'
      },
      include: {
        property: true
      }
    })

    // Create notification for the seller
    if (document.propertyId && updatedDocument.property) {
      await prisma.notification.create({
        data: {
          userId: updatedDocument.property.sellerId,
          type: 'DOCUMENT_UPLOADED',
          title: `Document ${status.toLowerCase()}`,
          message: `Your ${getDocumentName(document.documentType)} has been ${status.toLowerCase()}${comment ? `: ${comment}` : ''}`,
          propertyId: document.propertyId
        }
      })
    }

    return NextResponse.json({
      success: true,
      document: updatedDocument
    })
  } catch (error) {
    console.error('Error updating document approval:', error)
    return NextResponse.json(
      { error: 'Failed to update document approval' },
      { status: 500 }
    )
  }
}

function getDocumentName(type: string): string {
  const names: Record<string, string> = {
    COMPLIANCE_DECLARATION: 'Compliance Declaration',
    OWNER_AUTHORIZATION: 'Owner Authorization',
    PERSONAL_ID: 'Personal ID',
    ENERGY_CERTIFICATE: 'Energy Certificate',
    USAGE_LICENSE: 'Usage License',
    LAND_REGISTRY: 'Land Registry Certificate',
    TAX_REGISTER: 'Tax Register',
    FLOOR_PLAN: 'Floor Plan',
    TITLE_DEED: 'Title Deed',
    PHOTO: 'Photo',
    OTHER: 'Document'
  }
  return names[type] || 'Document'
}