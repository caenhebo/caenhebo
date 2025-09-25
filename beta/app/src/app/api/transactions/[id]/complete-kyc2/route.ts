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
        { error: 'You are not authorized to complete KYC2 for this transaction' },
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

    // Check if already verified
    if (role === 'buyer' && transaction.buyerKyc2Verified) {
      return NextResponse.json(
        { error: 'Buyer has already completed KYC2 verification' },
        { status: 400 }
      )
    }

    if (role === 'seller' && transaction.sellerKyc2Verified) {
      return NextResponse.json(
        { error: 'Seller has already completed KYC2 verification' },
        { status: 400 }
      )
    }

    // Update KYC2 verification status
    const updateData: any = {}
    if (role === 'buyer') {
      updateData.buyerKyc2Verified = true
      updateData.buyerKyc2VerifiedAt = new Date()

      // Update buyer's KYC2 status in user table
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          kyc2Status: 'PASSED',
          kyc2CompletedAt: new Date()
        }
      })
    } else {
      updateData.sellerKyc2Verified = true
      updateData.sellerKyc2VerifiedAt = new Date()

      // Update seller's KYC2 status in user table
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          kyc2Status: 'PASSED',
          kyc2CompletedAt: new Date()
        }
      })

      // Make all approved properties visible now that seller has KYC2
      await prisma.property.updateMany({
        where: {
          sellerId: session.user.id,
          finalApprovalStatus: 'APPROVED',
          isVisible: false
        },
        data: {
          isVisible: true
        }
      })
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData
    })

    // Check if both have completed KYC2
    const bothVerified = (role === 'buyer' ? true : updatedTransaction.buyerKyc2Verified) &&
                        (role === 'seller' ? true : updatedTransaction.sellerKyc2Verified)

    // If both verified, advance to FUND_PROTECTION stage
    if (bothVerified) {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'FUND_PROTECTION',
          fundProtectionDate: new Date()
        }
      })

      // Create status history
      await prisma.transactionStatusHistory.create({
        data: {
          transactionId: transactionId,
          fromStatus: 'KYC2_VERIFICATION',
          toStatus: 'FUND_PROTECTION',
          changedBy: session.user.id,
          notes: 'Both parties completed KYC2 verification - advancing to fund protection'
        }
      })
    }

    // Create notification for the other party
    const otherPartyId = role === 'buyer' ? transaction.sellerId : transaction.buyerId
    const verifierName = session.user.email

    await prisma.notification.create({
      data: {
        userId: otherPartyId,
        type: 'KYC_STATUS_CHANGE',
        title: bothVerified ? 'KYC2 Verification Complete' : 'KYC2 Verification Progress',
        message: bothVerified
          ? `Both parties have completed KYC2 verification. Funds are now protected!`
          : `${verifierName} has completed KYC2 verification for transaction ${transaction.id.slice(-8)}`,
        transactionId: transactionId,
        data: {
          transactionId: transactionId,
          action: 'kyc2_completed',
          verifierRole: role,
          bothVerified: bothVerified
        }
      }
    })

    return NextResponse.json({
      success: true,
      buyerVerified: role === 'buyer' ? true : updatedTransaction.buyerKyc2Verified,
      sellerVerified: role === 'seller' ? true : updatedTransaction.sellerKyc2Verified,
      bothVerified: bothVerified,
      newStatus: bothVerified ? 'FUND_PROTECTION' : 'KYC2_VERIFICATION',
      message: bothVerified
        ? 'Both parties have completed KYC2 verification! Transaction advanced to Fund Protection.'
        : 'KYC2 verification completed successfully. Waiting for the other party.'
    })

  } catch (error) {
    console.error('Error completing KYC2:', error)
    return NextResponse.json(
      { error: 'Failed to complete KYC2 verification' },
      { status: 500 }
    )
  }
}