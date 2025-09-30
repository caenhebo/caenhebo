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

    // Get transaction with current fund protection steps
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
            wallets: true,
            digitalIbans: true,
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
      return NextResponse.json({ error: 'Only seller can convert funds' }, { status: 403 })
    }

    // Find the CRYPTO_CONVERT step
    const convertStep = transaction.fundProtectionSteps.find(s => s.stepType === 'CRYPTO_CONVERT')

    if (!convertStep) {
      return NextResponse.json({ error: 'Convert step not found' }, { status: 404 })
    }

    if (convertStep.status !== 'PENDING') {
      return NextResponse.json({ error: 'Conversion already completed' }, { status: 400 })
    }

    // Get seller's crypto wallet
    const sellerWallet = transaction.seller.wallets.find(w => w.strigaWalletId === convertStep.fromWalletId)

    if (!sellerWallet) {
      return NextResponse.json({ error: 'Seller wallet not found' }, { status: 404 })
    }

    // Get seller's Digital IBAN
    const digitalIban = transaction.seller.digitalIbans[0]
    if (!digitalIban) {
      return NextResponse.json({ error: 'Digital IBAN not found' }, { status: 404 })
    }

    // Step 1: Convert crypto to EUR using Striga
    // Note: Striga typically uses their exchange service for this
    const conversionData = await strigaApiRequest<any>('/exchange/convert', {
      method: 'POST',
      body: JSON.stringify({
        userId: transaction.seller.strigaUserId,
        sourceWalletId: sellerWallet.strigaWalletId,
        sourceCurrency: convertStep.currency,
        destinationCurrency: 'EUR',
        amount: convertStep.amount?.toString(),
        destinationIBAN: digitalIban.iban
      })
    })

    // Update the conversion step
    await prisma.fundProtectionStep.update({
      where: { id: convertStep.id },
      data: {
        status: 'COMPLETED',
        txHash: conversionData.conversionId || conversionData.transactionId,
        completedAt: new Date()
      }
    })

    // Update seller's digital IBAN balance (if tracking in DB)
    // Note: In production, you'd fetch actual balance from Striga

    return NextResponse.json({
      success: true,
      message: 'Conversion completed successfully',
      eurAmount: conversionData.destinationAmount,
      conversionRate: conversionData.rate,
      conversionId: conversionData.conversionId || conversionData.transactionId
    })

  } catch (error: any) {
    console.error('Crypto conversion error:', error)
    return NextResponse.json(
      {
        error: 'Conversion failed',
        details: error.message,
        strigaError: error.strigaCode || null
      },
      { status: 500 }
    )
  }
}