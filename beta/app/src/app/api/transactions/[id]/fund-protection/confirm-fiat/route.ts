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

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        fundProtectionSteps: {
          where: { status: 'PENDING' },
          orderBy: { stepNumber: 'asc' }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Verify user is seller
    if (session.user.id !== transaction.sellerId) {
      return NextResponse.json({ error: 'Only seller can confirm fiat receipt' }, { status: 403 })
    }

    // Find the FIAT_CONFIRM step
    const confirmStep = transaction.fundProtectionSteps.find(s => s.stepType === 'FIAT_CONFIRM')

    if (!confirmStep) {
      return NextResponse.json({ error: 'Fiat confirmation step not found' }, { status: 404 })
    }

    if (confirmStep.status !== 'PENDING') {
      return NextResponse.json({ error: 'Already confirmed' }, { status: 400 })
    }

    // Mark as completed
    await prisma.fundProtectionStep.update({
      where: { id: confirmStep.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    // Check if all steps complete
    const allSteps = await prisma.fundProtectionStep.findMany({
      where: { transactionId }
    })

    const allComplete = allSteps.every(s => s.status === 'COMPLETED')

    if (allComplete) {
      // Advance to CLOSING
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'CLOSING' }
      })

      await prisma.transactionStatusHistory.create({
        data: {
          transactionId,
          fromStatus: 'FUND_PROTECTION',
          toStatus: 'CLOSING',
          changedBy: session.user.id,
          notes: 'Fiat payment confirmed - all fund protection complete'
        }
      })

      // Notify buyer
      await prisma.notification.create({
        data: {
          userId: transaction.buyerId,
          type: 'TRANSACTION_UPDATE',
          title: 'Payment Confirmed',
          message: 'Seller confirmed receipt of payment. Transaction moving to closing.',
          link: `/transactions/${transactionId}`
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Fiat receipt confirmed',
      allStepsComplete: allComplete,
      nextStatus: allComplete ? 'CLOSING' : 'FUND_PROTECTION'
    })

  } catch (error: any) {
    console.error('Fiat confirmation error:', error)
    return NextResponse.json(
      { error: 'Confirmation failed', details: error.message },
      { status: 500 }
    )
  }
}