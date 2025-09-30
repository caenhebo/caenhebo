import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { strigaApiRequest } from '@/lib/striga'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transactionId = params.id

    // Get transaction with fund protection steps
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        fundProtectionSteps: {
          where: { status: 'PENDING' },
          orderBy: { stepNumber: 'asc' }
        },
        seller: {
          select: {
            id: true,
            digitalIbans: true,
            bankAccount: true,
            strigaUserId: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Verify user is seller
    if (session.user.id !== transaction.sellerId) {
      return NextResponse.json({ error: 'Only seller can transfer to bank' }, { status: 403 })
    }

    // Find the IBAN_TRANSFER step
    const transferStep = transaction.fundProtectionSteps.find(s => s.stepType === 'IBAN_TRANSFER')

    if (!transferStep) {
      return NextResponse.json({ error: 'Bank transfer step not found' }, { status: 404 })
    }

    if (transferStep.status !== 'PENDING') {
      return NextResponse.json({ error: 'Transfer already completed' }, { status: 400 })
    }

    // Get seller's Digital IBAN (source)
    const digitalIban = transaction.seller.digitalIbans[0]
    if (!digitalIban) {
      return NextResponse.json({ error: 'Digital IBAN not found' }, { status: 404 })
    }

    // Get seller's personal bank account (destination)
    const personalBank = transaction.seller.bankAccount
    if (!personalBank) {
      return NextResponse.json({ error: 'Personal bank account not configured' }, { status: 404 })
    }

    // Call Striga API to transfer from Digital IBAN to personal bank
    const transferData = await strigaApiRequest<any>('/iban/send', {
      method: 'POST',
      body: JSON.stringify({
        userId: transaction.seller.strigaUserId,
        sourceIBAN: digitalIban.iban,
        destinationIBAN: personalBank.iban,
        amount: transferStep.amount?.toString(),
        currency: 'EUR',
        reference: `Property sale ${transactionId.slice(0, 8)}`
      })
    })

    // Update the step
    await prisma.fundProtectionStep.update({
      where: { id: transferStep.id },
      data: {
        status: 'COMPLETED',
        txHash: transferData.transactionId || transferData.transferId,
        completedAt: new Date()
      }
    })

    // Check if all fund protection steps are complete
    const allSteps = await prisma.fundProtectionStep.findMany({
      where: { transactionId }
    })

    const allComplete = allSteps.every(s => s.status === 'COMPLETED')

    if (allComplete) {
      // Advance transaction to CLOSING stage
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'CLOSING' }
      })

      // Create status history
      await prisma.transactionStatusHistory.create({
        data: {
          transactionId,
          fromStatus: 'FUND_PROTECTION',
          toStatus: 'CLOSING',
          changedBy: session.user.id,
          notes: 'All fund protection steps completed'
        }
      })

      // Notify both parties
      await prisma.notification.createMany({
        data: [
          {
            userId: transaction.buyerId,
            type: 'TRANSACTION_UPDATE',
            title: 'Payment Complete',
            message: 'Your payment has been successfully processed. Transaction moving to closing.',
            link: `/transactions/${transactionId}`
          },
          {
            userId: transaction.sellerId,
            type: 'TRANSACTION_UPDATE',
            title: 'Funds Received',
            message: 'Funds have been transferred to your bank account. Transaction moving to closing.',
            link: `/transactions/${transactionId}`
          }
        ]
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Bank transfer completed successfully',
      transferId: transferData.transactionId || transferData.transferId,
      allStepsComplete: allComplete,
      nextStatus: allComplete ? 'CLOSING' : 'FUND_PROTECTION'
    })

  } catch (error: any) {
    console.error('Bank transfer error:', error)
    return NextResponse.json(
      {
        error: 'Transfer failed',
        details: error.message,
        strigaError: error.strigaCode || null
      },
      { status: 500 }
    )
  }
}