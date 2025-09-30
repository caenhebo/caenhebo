import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(
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
        fundProtectionSteps: {
          orderBy: { stepNumber: 'asc' }
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            wallets: true
          }
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            wallets: true,
            digitalIbans: true,
            bankAccount: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Verify user is buyer, seller, or admin
    const isAdmin = session.user.role === 'ADMIN'
    const isBuyer = session.user.id === transaction.buyerId
    const isSeller = session.user.id === transaction.sellerId

    if (!isAdmin && !isBuyer && !isSeller) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Find current active step
    const currentStep = transaction.fundProtectionSteps.find(s => s.status === 'PENDING')
    const completedSteps = transaction.fundProtectionSteps.filter(s => s.status === 'COMPLETED').length
    const totalSteps = transaction.fundProtectionSteps.length

    // Determine if current user needs to take action
    const needsUserAction = currentStep && (
      (currentStep.userType === 'BUYER' && isBuyer) ||
      (currentStep.userType === 'SELLER' && isSeller)
    )

    // Check if simulation mode is enabled
    const simulationMode = process.env.ENABLE_SIMULATION_MODE === 'true'

    return NextResponse.json({
      transactionId,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      simulationMode,
      transaction: {
        agreedPrice: transaction.agreedPrice?.toString() || transaction.offerPrice.toString(),
        offerPrice: transaction.offerPrice.toString(),
        cryptoPercentage: transaction.cryptoPercentage,
        fiatPercentage: transaction.fiatPercentage
      },
      steps: transaction.fundProtectionSteps.map(step => ({
        id: step.id,
        stepNumber: step.stepNumber,
        stepType: step.stepType,
        description: step.description,
        userType: step.userType,
        status: step.status,
        amount: step.amount?.toString(),
        currency: step.currency,
        fromWalletId: step.fromWalletId,
        toWalletId: step.toWalletId,
        txHash: step.txHash,
        proofUrl: step.proofUrl,
        completedAt: step.completedAt,
        createdAt: step.createdAt
      })),
      uploadedProof: transaction.fundProtectionSteps.find(s => s.stepType === 'FIAT_UPLOAD' && s.proofUrl)?.proofUrl || null,
      currentStep: currentStep ? {
        stepNumber: currentStep.stepNumber,
        description: currentStep.description,
        userType: currentStep.userType,
        stepType: currentStep.stepType,
        amount: currentStep.amount?.toString(),
        currency: currentStep.currency,
        toWalletId: currentStep.toWalletId
      } : null,
      progress: {
        completed: completedSteps,
        total: totalSteps,
        percentage: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
      },
      needsUserAction,
      userRole: isBuyer ? 'BUYER' : isSeller ? 'SELLER' : 'ADMIN',
      buyerWallets: transaction.buyer.wallets,
      sellerWallets: transaction.seller.wallets,
      sellerIban: transaction.seller.digitalIbans[0],
      sellerBankDetails: transaction.seller.digitalIbans[0] ? {
        iban: transaction.seller.digitalIbans[0].iban,
        bankName: transaction.seller.digitalIbans[0].bankName || 'Digital IBAN',
        accountHolderName: `${transaction.seller.firstName} ${transaction.seller.lastName}`
      } : transaction.seller.bankAccount ? {
        iban: transaction.seller.bankAccount.iban,
        bankName: transaction.seller.bankAccount.bankName,
        accountHolderName: transaction.seller.bankAccount.accountHolderName
      } : null
    })

  } catch (error) {
    console.error('Fund protection status error:', error)
    return NextResponse.json(
      { error: 'Failed to get fund protection status' },
      { status: 500 }
    )
  }
}