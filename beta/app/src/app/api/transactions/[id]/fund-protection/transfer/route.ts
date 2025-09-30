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
        buyer: {
          select: { id: true, wallets: true }
        },
        seller: {
          select: { id: true, wallets: true }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Verify user is buyer
    if (session.user.id !== transaction.buyerId) {
      return NextResponse.json({ error: 'Only buyer can transfer funds' }, { status: 403 })
    }

    // Find the CRYPTO_TRANSFER step
    const transferStep = transaction.fundProtectionSteps.find(s => s.stepType === 'CRYPTO_TRANSFER')

    if (!transferStep) {
      return NextResponse.json({ error: 'Transfer step not found' }, { status: 404 })
    }

    if (transferStep.status !== 'PENDING') {
      return NextResponse.json({ error: 'Transfer already completed' }, { status: 400 })
    }

    // Get wallet details
    const buyerWallet = transaction.buyer.wallets.find(w => w.strigaWalletId === transferStep.fromWalletId)
    const sellerWallet = transaction.seller.wallets.find(w => w.strigaWalletId === transferStep.toWalletId)

    if (!buyerWallet || !sellerWallet) {
      return NextResponse.json({ error: 'Wallets not found' }, { status: 404 })
    }

    // Call Striga API to transfer crypto from buyer wallet to seller wallet
    const transferData = await strigaApiRequest<any>('/wallets/send/internal', {
      method: 'POST',
      body: JSON.stringify({
        sourceWalletId: buyerWallet.strigaWalletId,
        destinationWalletId: sellerWallet.strigaWalletId,
        currency: transferStep.currency,
        amount: transferStep.amount?.toString(),
        note: `Transaction ${transactionId.slice(0, 8)} - Property purchase payment`
      })
    })

    // Update the step with transaction hash and mark as completed
    await prisma.fundProtectionStep.update({
      where: { id: transferStep.id },
      data: {
        status: 'COMPLETED',
        txHash: transferData.transactionId || transferData.id,
        completedAt: new Date()
      }
    })

    // Check if this was the last buyer step - if so, activate next seller step
    const nextStep = await prisma.fundProtectionStep.findFirst({
      where: {
        transactionId,
        stepNumber: { gt: transferStep.stepNumber }
      },
      orderBy: { stepNumber: 'asc' }
    })

    // Create notification for seller
    await prisma.notification.create({
      data: {
        userId: transaction.sellerId,
        type: 'TRANSACTION_UPDATE',
        title: 'Digital Assets Received',
        message: `You have received digital assets for transaction ${transactionId.slice(0, 8)}. Click to convert to EUR.`,
        link: `/transactions/${transactionId}`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Transfer completed successfully',
      transactionId: transferData.transactionId || transferData.id,
      nextStep: nextStep ? {
        stepNumber: nextStep.stepNumber,
        description: nextStep.description,
        userType: nextStep.userType
      } : null
    })

  } catch (error: any) {
    console.error('Crypto transfer error:', error)
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