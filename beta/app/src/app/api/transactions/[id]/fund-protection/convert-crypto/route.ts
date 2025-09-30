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
        buyer: { include: { wallets: true, digitalIbans: true } },
        fundProtectionSteps: { orderBy: { stepNumber: 'asc' } }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (session.user.id !== transaction.buyerId) {
      return NextResponse.json({ error: 'Only buyer can perform this action' }, { status: 403 })
    }

    // Find the conversion step
    const conversionStep = transaction.fundProtectionSteps.find(
      s => s.stepType === 'CRYPTO_CONVERT_BUYER' && s.status === 'PENDING'
    )

    if (!conversionStep) {
      return NextResponse.json({ error: 'Conversion step not found or already completed' }, { status: 400 })
    }

    // Check that previous steps are completed
    const testDepositStep = transaction.fundProtectionSteps.find(s => s.stepType === 'CRYPTO_TEST_DEPOSIT')
    const fullDepositStep = transaction.fundProtectionSteps.find(s => s.stepType === 'CRYPTO_DEPOSIT')

    if (testDepositStep?.status !== 'COMPLETED' || fullDepositStep?.status !== 'COMPLETED') {
      return NextResponse.json({
        error: 'Please complete both deposit steps before converting'
      }, { status: 400 })
    }

    const buyerWallet = transaction.buyer.wallets.find(
      w => w.currency === conversionStep.currency
    )

    const buyerIban = transaction.buyer.digitalIbans?.[0]

    if (!buyerWallet || !buyerIban) {
      return NextResponse.json({ error: 'Wallet or IBAN not found' }, { status: 400 })
    }

    try {
      const { convertCryptoToEur, addSimulationWarning } = await import('@/lib/simulation')

      // Convert crypto to EUR (supports simulation mode)
      const conversionResponse = await convertCryptoToEur(
        transaction.buyer.strigaUserId || '',
        buyerWallet.strigaWalletId || '',
        buyerIban.strigaAccountId || '',
        parseFloat(conversionStep.amount?.toString() || '0'),
        conversionStep.currency || 'BTC'
      )

      console.log('✅ Crypto conversion successful:', conversionResponse)

      // Mark conversion step as completed
      await prisma.fundProtectionStep.update({
        where: { id: conversionStep.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          txHash: conversionResponse.exchangeId || conversionResponse.id
        }
      })

      // Update buyer's vIBAN balance in database
      await prisma.digitalIban.update({
        where: { id: buyerIban.id },
        data: {
          balance: {
            increment: conversionResponse.destinationAmount
          }
        }
      })

      // Create notification
      await prisma.notification.create({
        data: {
          userId: transaction.sellerId,
          type: 'TRANSACTION_STATUS_CHANGE',
          title: 'Buyer Converted Crypto to EUR',
          message: `Buyer converted ${conversionStep.amount} ${conversionStep.currency} to EUR`,
          transactionId: transactionId
        }
      })

      return NextResponse.json(addSimulationWarning({
        success: true,
        message: 'Conversion successful!',
        exchangeId: conversionResponse.exchangeId,
        eurAmount: conversionResponse.destinationAmount
      }))

    } catch (error) {
      console.error('Crypto conversion error:', error)
      return NextResponse.json({
        error: `Failed to convert crypto: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Convert crypto error:', error)
    return NextResponse.json(
      { error: 'Failed to process conversion' },
      { status: 500 }
    )
  }
}