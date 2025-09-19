import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface Params {
  params: Promise<{
    id: string
  }>
}

// GET: Check Stage 3 requirements status
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: transactionId } = await params

    // Get transaction with documents
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        documents: {
          where: {
            documentType: {
              in: ['REPRESENTATION_DOCUMENT', 'MEDIATION_AGREEMENT']
            }
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check if user is involved in the transaction
    if (transaction.buyerId !== session.user.id && 
        transaction.sellerId !== session.user.id &&
        session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to view this transaction' },
        { status: 403 }
      )
    }

    // Check for required documents
    const hasRepresentationDoc = transaction.documents.some(
      doc => doc.documentType === 'REPRESENTATION_DOCUMENT'
    )
    const hasMediationAgreement = transaction.documents.some(
      doc => doc.documentType === 'MEDIATION_AGREEMENT'
    )

    // Check if both parties have confirmed
    const buyerConfirmed = transaction.buyerHasRep || false
    const sellerConfirmed = transaction.sellerHasRep || false
    const mediationSigned = transaction.mediationSigned || false

    const stage3Complete = hasRepresentationDoc && 
                          hasMediationAgreement && 
                          buyerConfirmed && 
                          sellerConfirmed && 
                          mediationSigned

    return NextResponse.json({
      success: true,
      status: {
        hasRepresentationDoc,
        hasMediationAgreement,
        buyerConfirmed,
        sellerConfirmed,
        mediationSigned,
        stage3Complete,
        canAdvanceToEscrow: stage3Complete && transaction.status === 'AGREEMENT'
      },
      documents: transaction.documents
    })

  } catch (error) {
    console.error('Stage 3 status error:', error)
    return NextResponse.json(
      { error: 'Failed to check Stage 3 status' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST: Update Stage 3 confirmations
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: transactionId } = await params
    const body = await request.json()
    const { action, documentType, documentId } = body

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        buyer: true,
        seller: true,
        property: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check if user is involved in the transaction
    const isBuyer = transaction.buyerId === session.user.id
    const isSeller = transaction.sellerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to update this transaction' },
        { status: 403 }
      )
    }

    // Handle different actions
    switch (action) {
      case 'CONFIRM_REPRESENTATION':
        if (isBuyer) {
          await prisma.transaction.update({
            where: { id: transactionId },
            data: { buyerHasRep: true }
          })
        } else if (isSeller) {
          await prisma.transaction.update({
            where: { id: transactionId },
            data: { sellerHasRep: true }
          })
        }
        break

      case 'SIGN_MEDIATION':
        if (isBuyer || isSeller) {
          await prisma.transaction.update({
            where: { id: transactionId },
            data: { mediationSigned: true }
          })
        }
        break

      case 'UPLOAD_DOCUMENT':
        // This is handled by the documents upload route
        // but we can track it here if needed
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Create status history entry
    await prisma.transactionStatusHistory.create({
      data: {
        transactionId: transactionId,
        fromStatus: transaction.status,
        toStatus: transaction.status,
        changedBy: session.user.id,
        notes: `Stage 3 update: ${action}`
      }
    })

    // Check if all Stage 3 requirements are met
    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        documents: {
          where: {
            documentType: {
              in: ['REPRESENTATION_DOCUMENT', 'MEDIATION_AGREEMENT']
            }
          }
        }
      }
    })

    const hasRepDoc = updatedTransaction!.documents.some(
      doc => doc.documentType === 'REPRESENTATION_DOCUMENT'
    )
    const hasMedAgreement = updatedTransaction!.documents.some(
      doc => doc.documentType === 'MEDIATION_AGREEMENT'
    )

    const allRequirementsMet = 
      hasRepDoc && 
      hasMedAgreement && 
      updatedTransaction!.buyerHasRep && 
      updatedTransaction!.sellerHasRep && 
      updatedTransaction!.mediationSigned

    return NextResponse.json({
      success: true,
      message: 'Stage 3 updated successfully',
      stage3Complete: allRequirementsMet,
      transaction: {
        id: updatedTransaction!.id,
        buyerHasRep: updatedTransaction!.buyerHasRep,
        sellerHasRep: updatedTransaction!.sellerHasRep,
        mediationSigned: updatedTransaction!.mediationSigned
      }
    })

  } catch (error) {
    console.error('Stage 3 update error:', error)
    return NextResponse.json(
      { error: 'Failed to update Stage 3' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}