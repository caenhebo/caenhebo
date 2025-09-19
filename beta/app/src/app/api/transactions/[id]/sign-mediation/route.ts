import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

interface Params {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: transactionId } = await params
    const body = await request.json()
    const { role } = body

    if (!role || !['buyer', 'seller'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Verify the user is part of this transaction
    const isBuyer = transaction.buyerId === session.user.id
    const isSeller = transaction.sellerId === session.user.id

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: 'You are not authorized to sign this mediation agreement' },
        { status: 403 }
      )
    }

    // Verify the role matches
    if ((role === 'buyer' && !isBuyer) || (role === 'seller' && !isSeller)) {
      return NextResponse.json(
        { error: 'Role mismatch' },
        { status: 400 }
      )
    }

    // Check if already signed
    if (role === 'buyer' && transaction.buyerSignedMediation) {
      return NextResponse.json(
        { error: 'You have already signed the mediation agreement' },
        { status: 400 }
      )
    }

    if (role === 'seller' && transaction.sellerSignedMediation) {
      return NextResponse.json(
        { error: 'You have already signed the mediation agreement' },
        { status: 400 }
      )
    }

    // Update the signature status
    const updateData: any = {}
    if (role === 'buyer') {
      updateData.buyerSignedMediation = true
      updateData.buyerSignedMediationAt = new Date()
    } else {
      updateData.sellerSignedMediation = true
      updateData.sellerSignedMediationAt = new Date()
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData
    })

    // Check if both have signed
    const bothSigned = (role === 'buyer' ? true : updatedTransaction.buyerSignedMediation) &&
                      (role === 'seller' ? true : updatedTransaction.sellerSignedMediation)

    // Create notification for the other party
    const otherPartyId = role === 'buyer' ? transaction.sellerId : transaction.buyerId
    const signerName = session.user.email

    await prisma.notification.create({
      data: {
        userId: otherPartyId,
        type: 'TRANSACTION_STATUS_CHANGE',
        title: bothSigned ? 'Mediation Agreement Complete' : 'Mediation Agreement Signed',
        message: bothSigned
          ? `Both parties have signed the mediation agreement for transaction ${transaction.id.slice(-8)}`
          : `${signerName} has signed the mediation agreement for transaction ${transaction.id.slice(-8)}`,
        transactionId: transactionId,
        data: {
          transactionId: transactionId,
          action: 'mediation_signed',
          signerRole: role,
          bothSigned: bothSigned
        }
      }
    })

    return NextResponse.json({
      success: true,
      buyerSigned: role === 'buyer' ? true : updatedTransaction.buyerSignedMediation,
      sellerSigned: role === 'seller' ? true : updatedTransaction.sellerSignedMediation,
      bothSigned: bothSigned,
      message: bothSigned
        ? 'Both parties have signed the mediation agreement!'
        : 'Mediation agreement signed successfully. Waiting for the other party.'
    })

  } catch (error) {
    console.error('Error signing mediation agreement:', error)
    return NextResponse.json(
      { error: 'Failed to sign mediation agreement' },
      { status: 500 }
    )
  }
}