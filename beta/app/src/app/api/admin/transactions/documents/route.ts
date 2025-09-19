import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all documents from transactions with full details
    const documents = await prisma.document.findMany({
      where: {
        transactionId: { not: null }
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        transaction: {
          include: {
            property: {
              select: {
                code: true,
                title: true,
                address: true,
                city: true
              }
            },
            buyer: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            seller: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    })

    // Format the documents with all related information
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      transactionId: doc.transactionId,
      type: doc.documentType,
      filename: doc.filename,
      originalName: doc.originalName,
      url: doc.fileUrl,
      uploadedAt: doc.uploadedAt,
      uploadedBy: doc.user
        ? `${doc.user.firstName || ''} ${doc.user.lastName || ''} (${doc.user.email})`.trim()
        : 'Unknown',
      property: doc.transaction ? {
        code: doc.transaction.property.code,
        title: doc.transaction.property.title,
        address: doc.transaction.property.address,
        city: doc.transaction.property.city
      } : null,
      buyer: doc.transaction ? {
        firstName: doc.transaction.buyer.firstName,
        lastName: doc.transaction.buyer.lastName,
        email: doc.transaction.buyer.email
      } : null,
      seller: doc.transaction ? {
        firstName: doc.transaction.seller.firstName,
        lastName: doc.transaction.seller.lastName,
        email: doc.transaction.seller.email
      } : null,
      transactionStatus: doc.transaction?.status || 'UNKNOWN'
    }))

    return NextResponse.json({
      documents: formattedDocuments,
      total: formattedDocuments.length
    })

  } catch (error) {
    console.error('Failed to fetch transaction documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction documents' },
      { status: 500 }
    )
  }
}