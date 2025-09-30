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
    const { rating, review } = await request.json()

    // Validate rating (1-5 stars)
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5 stars' },
        { status: 400 }
      )
    }

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
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Check transaction is in CLOSING stage
    if (transaction.status !== 'CLOSING') {
      return NextResponse.json(
        { error: 'Transaction must be in CLOSING stage to confirm completion' },
        { status: 400 }
      )
    }

    // Verify user is buyer or seller
    const isBuyer = session.user.id === transaction.buyerId
    const isSeller = session.user.id === transaction.sellerId

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if user already confirmed
    if (isBuyer && transaction.buyerConfirmedComplete) {
      return NextResponse.json(
        { error: 'You have already confirmed completion' },
        { status: 400 }
      )
    }

    if (isSeller && transaction.sellerConfirmedComplete) {
      return NextResponse.json(
        { error: 'You have already confirmed completion' },
        { status: 400 }
      )
    }

    // Update transaction with confirmation and rating
    const updateData: any = {}

    if (isBuyer) {
      updateData.buyerConfirmedComplete = true
      updateData.buyerConfirmedCompleteAt = new Date()
      updateData.buyerRating = rating
      updateData.buyerReview = review || null
    }

    if (isSeller) {
      updateData.sellerConfirmedComplete = true
      updateData.sellerConfirmedCompleteAt = new Date()
      updateData.sellerRating = rating
      updateData.sellerReview = review || null
    }

    // Check if both parties have now confirmed
    const bothConfirmed =
      (isBuyer ? true : transaction.sellerConfirmedComplete) &&
      (isSeller ? true : transaction.buyerConfirmedComplete)

    if (bothConfirmed) {
      updateData.status = 'COMPLETED'
      updateData.completionDate = new Date()
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData
    })

    // Create status history entry if advanced to COMPLETED
    if (bothConfirmed) {
      await prisma.transactionStatusHistory.create({
        data: {
          transactionId,
          fromStatus: 'CLOSING',
          toStatus: 'COMPLETED',
          notes: 'Both parties confirmed completion and left ratings'
        }
      })

      // Create notifications for both parties
      await prisma.notification.create({
        data: {
          userId: transaction.buyerId,
          type: 'TRANSACTION_STATUS_CHANGE',
          title: 'Transaction Completed! 🎉',
          message: `Congratulations! The transaction for ${transaction.property.title} has been completed successfully.`,
          transactionId
        }
      })

      await prisma.notification.create({
        data: {
          userId: transaction.sellerId,
          type: 'TRANSACTION_STATUS_CHANGE',
          title: 'Transaction Completed! 🎉',
          message: `Congratulations! The transaction for ${transaction.property.title} has been completed successfully.`,
          transactionId
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: bothConfirmed
        ? 'Transaction completed successfully!'
        : 'Your confirmation has been recorded. Waiting for the other party.',
      transaction: {
        id: updatedTransaction.id,
        status: updatedTransaction.status,
        buyerConfirmedComplete: updatedTransaction.buyerConfirmedComplete,
        sellerConfirmedComplete: updatedTransaction.sellerConfirmedComplete,
        completionDate: updatedTransaction.completionDate
      }
    })
  } catch (error) {
    console.error('Transaction completion error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm completion' },
      { status: 500 }
    )
  }
}