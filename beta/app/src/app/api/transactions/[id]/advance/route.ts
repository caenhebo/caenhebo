import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Define valid stage progressions
const STAGE_PROGRESSIONS: { [key: string]: string } = {
  'OFFER': 'NEGOTIATION',
  'NEGOTIATION': 'AGREEMENT',
  'AGREEMENT': 'ESCROW',
  'ESCROW': 'CLOSING',
  'CLOSING': 'COMPLETED'
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const transactionId = params.id
    const body = await request.json()
    const { notes, escrowDetails } = body

    // Find the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        property: true,
        buyer: true,
        seller: true,
        escrowDetails: true
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
        transaction.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to advance this transaction' },
        { status: 403 }
      )
    }

    // Check if transaction can be advanced
    if (!STAGE_PROGRESSIONS[transaction.status]) {
      return NextResponse.json(
        { error: 'Transaction cannot be advanced from its current status' },
        { status: 400 }
      )
    }

    const nextStatus = STAGE_PROGRESSIONS[transaction.status]

    // Validate requirements for each stage
    if (nextStatus === 'AGREEMENT' && !transaction.agreedPrice) {
      return NextResponse.json(
        { error: 'Cannot advance to Agreement without an agreed price' },
        { status: 400 }
      )
    }

    if (nextStatus === 'ESCROW') {
      // Check Stage 3 requirements
      const transactionWithDocs = await prisma.transaction.findUnique({
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

      const hasRepDoc = transactionWithDocs!.documents.some(
        doc => doc.documentType === 'REPRESENTATION_DOCUMENT'
      )
      const hasMedAgreement = transactionWithDocs!.documents.some(
        doc => doc.documentType === 'MEDIATION_AGREEMENT'
      )

      if (!hasRepDoc || !hasMedAgreement) {
        return NextResponse.json(
          { error: 'Both representation document and mediation agreement are required to advance to Escrow' },
          { status: 400 }
        )
      }

      if (!transactionWithDocs!.buyerHasRep || !transactionWithDocs!.sellerHasRep) {
        return NextResponse.json(
          { error: 'Both buyer and seller must confirm representation to advance to Escrow' },
          { status: 400 }
        )
      }

      if (!transactionWithDocs!.mediationSigned) {
        return NextResponse.json(
          { error: 'Mediation agreement must be signed to advance to Escrow' },
          { status: 400 }
        )
      }

      if (!escrowDetails || !escrowDetails.totalAmount) {
        return NextResponse.json(
          { error: 'Escrow details with total amount are required to advance to Escrow' },
          { status: 400 }
        )
      }
    }

    // Start transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update transaction status
      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: nextStatus as any,
          ...(nextStatus === 'ESCROW' && { escrowDate: new Date() }),
          ...(nextStatus === 'COMPLETED' && { completionDate: new Date() })
        },
        include: {
          property: true,
          buyer: true,
          seller: true,
          escrowDetails: true
        }
      })

      // Create status history
      await tx.transactionStatusHistory.create({
        data: {
          transactionId: transactionId,
          fromStatus: transaction.status,
          toStatus: nextStatus as any,
          changedBy: session.user.id,
          notes: notes || `Advanced to ${nextStatus}`
        }
      })

      // Create or update escrow details if advancing to ESCROW
      if (nextStatus === 'ESCROW' && escrowDetails) {
        if (transaction.escrowDetails) {
          await tx.escrowDetails.update({
            where: { transactionId: transactionId },
            data: {
              totalAmount: parseFloat(escrowDetails.totalAmount),
              initialDeposit: escrowDetails.initialDeposit ? parseFloat(escrowDetails.initialDeposit) : null,
              finalPayment: escrowDetails.finalPayment ? parseFloat(escrowDetails.finalPayment) : null,
              escrowProvider: escrowDetails.escrowProvider || null,
              releaseConditions: escrowDetails.releaseConditions || null
            }
          })
        } else {
          await tx.escrowDetails.create({
            data: {
              transactionId: transactionId,
              totalAmount: parseFloat(escrowDetails.totalAmount),
              initialDeposit: escrowDetails.initialDeposit ? parseFloat(escrowDetails.initialDeposit) : null,
              finalPayment: escrowDetails.finalPayment ? parseFloat(escrowDetails.finalPayment) : null,
              escrowProvider: escrowDetails.escrowProvider || null,
              releaseConditions: escrowDetails.releaseConditions || null
            }
          })
        }
      }

      return updatedTransaction
    })

    // TODO: Send notifications to both parties about status change

    return NextResponse.json({
      success: true,
      transaction: {
        id: result.id,
        status: result.status,
        offerPrice: result.offerPrice.toString(),
        agreedPrice: result.agreedPrice?.toString() || null,
        proposalDate: result.proposalDate?.toISOString() || null,
        acceptanceDate: result.acceptanceDate?.toISOString() || null,
        escrowDate: result.escrowDate?.toISOString() || null,
        completionDate: result.completionDate?.toISOString() || null,
        property: result.property,
        buyer: result.buyer,
        seller: result.seller,
        escrowDetails: result.escrowDetails ? {
          totalAmount: result.escrowDetails.totalAmount.toString(),
          initialDeposit: result.escrowDetails.initialDeposit?.toString() || null,
          finalPayment: result.escrowDetails.finalPayment?.toString() || null,
          escrowProvider: result.escrowDetails.escrowProvider,
          releaseConditions: result.escrowDetails.releaseConditions,
          fundsReceived: result.escrowDetails.fundsReceived,
          fundsReleased: result.escrowDetails.fundsReleased
        } : null
      }
    })

  } catch (error) {
    console.error('Transaction advance error:', error)
    return NextResponse.json(
      { error: 'Failed to advance transaction' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}