import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

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

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        buyer: { include: { wallets: true } },
        fundProtectionSteps: { orderBy: { stepNumber: 'asc' } }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (session.user.id !== transaction.buyerId) {
      return NextResponse.json({ error: 'Only buyer can perform this action' }, { status: 403 })
    }

    // Find the test deposit step
    const testDepositStep = transaction.fundProtectionSteps.find(
      s => s.stepType === 'CRYPTO_TEST_DEPOSIT' && s.status === 'PENDING'
    )

    if (!testDepositStep) {
      return NextResponse.json({ error: 'Test deposit step not found or already completed' }, { status: 400 })
    }

    // Get the buyer's wallet for this currency
    const buyerWallet = transaction.buyer.wallets.find(
      w => w.currency === testDepositStep.currency
    )

    if (!buyerWallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 400 })
    }

    // Check if wallet has sufficient balance (supports simulation mode)
    try {
      const { checkWalletBalance, addSimulationWarning } = await import('@/lib/simulation')

      const requiredAmount = parseFloat(testDepositStep.amount?.toString() || '0')
      const balanceCheck = await checkWalletBalance(
        testDepositStep.currency || 'BTC',
        requiredAmount,
        buyerWallet.strigaWalletId
      )

      if (!balanceCheck.sufficient) {
        return NextResponse.json({
          error: `Insufficient balance. You have ${balanceCheck.available} ${testDepositStep.currency}, but need ${requiredAmount} ${testDepositStep.currency}`,
          currentBalance: balanceCheck.available,
          requiredAmount: requiredAmount
        }, { status: 400 })
      }

      // Mark test deposit as completed
      await prisma.fundProtectionStep.update({
        where: { id: testDepositStep.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })

      // Create notification for seller
      await prisma.notification.create({
        data: {
          userId: transaction.sellerId,
          type: 'TRANSACTION_STATUS_CHANGE',
          title: 'Test Deposit Successful',
          message: `Buyer completed test deposit of ${requiredAmount} ${testDepositStep.currency}`,
          transactionId: transactionId
        }
      })

      return NextResponse.json(addSimulationWarning({
        success: true,
        message: 'Test deposit verified successfully!',
        balance: balanceCheck.available
      }))

    } catch (error) {
      console.error('Test deposit verification error:', error)
      return NextResponse.json({
        error: 'Failed to verify deposit with Striga API'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Test deposit error:', error)
    return NextResponse.json(
      { error: 'Failed to process test deposit' },
      { status: 500 }
    )
  }
}