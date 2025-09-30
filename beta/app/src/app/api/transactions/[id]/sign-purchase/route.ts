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
      where: { id: transactionId }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Verify user is buyer or seller
    const isBuyer = session.user.id === transaction.buyerId
    const isSeller = session.user.id === transaction.sellerId

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    }

    if (isBuyer) {
      if (transaction.buyerSignedPurchase) {
        return NextResponse.json(
          { error: 'You have already signed the purchase agreement' },
          { status: 400 }
        )
      }
      updateData.buyerSignedPurchase = true
      updateData.buyerSignedPurchaseAt = new Date()
    }

    if (isSeller) {
      if (transaction.sellerSignedPurchase) {
        return NextResponse.json(
          { error: 'You have already signed the purchase agreement' },
          { status: 400 }
        )
      }
      updateData.sellerSignedPurchase = true
      updateData.sellerSignedPurchaseAt = new Date()
    }

    // Check if both parties have now signed
    const bothSigned =
      (isBuyer ? true : transaction.buyerSignedPurchase) &&
      (isSeller ? true : transaction.sellerSignedPurchase)

    if (bothSigned) {
      updateData.purchaseAgreementSigned = true
      updateData.purchaseAgreementSignedAt = new Date()
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData
    })

    // Create notification for the other party
    const otherUserId = isBuyer ? transaction.sellerId : transaction.buyerId
    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'TRANSACTION_STATUS_CHANGE',
        title: 'Purchase Agreement Signed',
        message: `The ${isBuyer ? 'buyer' : 'seller'} has signed the purchase agreement.`,
        transactionId
      }
    })

    return NextResponse.json({
      success: true,
      buyerSigned: updatedTransaction.buyerSignedPurchase,
      sellerSigned: updatedTransaction.sellerSignedPurchase,
      bothSigned
    })

  } catch (error) {
    console.error('Sign purchase agreement error:', error)
    return NextResponse.json(
      { error: 'Failed to sign purchase agreement' },
      { status: 500 }
    )
  }
}
