import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// Define valid stage progressions
const STAGE_PROGRESSIONS: { [key: string]: string } = {
  'OFFER': 'NEGOTIATION',
  'NEGOTIATION': 'AGREEMENT',
  'AGREEMENT': 'FUND_PROTECTION',  // Skip KYC2 - it's done before transactions
  'FUND_PROTECTION': 'CLOSING',
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

    // Check if user is involved in the transaction or is admin
    const isAdmin = session.user.role === 'ADMIN'
    const isBuyer = transaction.buyerId === session.user.id
    const isSeller = transaction.sellerId === session.user.id

    if (!isBuyer && !isSeller && !isAdmin) {
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

    if (nextStatus === 'FUND_PROTECTION') {
      // Check promissory/agreement signatures
      if (!transaction.buyerSignedPromissory || !transaction.sellerSignedPromissory) {
        return NextResponse.json(
          { error: 'Both buyer and seller must sign the agreement to advance to Fund Protection' },
          { status: 400 }
        )
      }

      // Check that both parties have KYC2 (pre-requirement)
      const transactionWithKyc = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          buyer: true,
          seller: true
        }
      })

      if (transactionWithKyc!.buyer.kyc2Status !== 'PASSED' ||
          transactionWithKyc!.seller.kyc2Status !== 'PASSED') {
        return NextResponse.json(
          { error: 'Both buyer and seller must have KYC Tier 2 approved to advance to Fund Protection' },
          { status: 400 }
        )
      }

      // Escrow/Fund Protection details can be provided or use transaction agreed price
      if (!escrowDetails) {
        escrowDetails = {
          totalAmount: transaction.agreedPrice || transaction.offerPrice,
          escrowProvider: 'Caenhebo Fund Protection Service'
        }
      } else if (!escrowDetails.totalAmount) {
        escrowDetails.totalAmount = transaction.agreedPrice || transaction.offerPrice
      }
    }

    // Start transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update transaction status
      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: nextStatus as any,
          ...(nextStatus === 'FUND_PROTECTION' && { fundProtectionDate: new Date() }),
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
  }
}