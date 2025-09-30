import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const transactionId = params.id
    const body = await request.json()
    const { role } = body

    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        buyer: true,
        seller: true,
        property: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Verify user is part of the transaction
    const isBuyer = transaction.buyerId === session.user.id
    const isSeller = transaction.sellerId === session.user.id

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: 'You are not authorized to sign this agreement' },
        { status: 403 }
      )
    }

    // Verify transaction is in AGREEMENT status
    if (transaction.status !== 'AGREEMENT') {
      return NextResponse.json(
        { error: 'Agreement can only be signed when transaction is in AGREEMENT status' },
        { status: 400 }
      )
    }

    // Verify the role matches
    if ((role === 'buyer' && !isBuyer) || (role === 'seller' && !isSeller)) {
      return NextResponse.json(
        { error: 'Role mismatch' },
        { status: 400 }
      )
    }

    // Update the appropriate signature field
    const updateData: any = {}
    if (role === 'buyer') {
      updateData.buyerSignedPromissory = true
      updateData.buyerSignedPromissoryAt = new Date()
    } else if (role === 'seller') {
      updateData.sellerSignedPromissory = true
      updateData.sellerSignedPromissoryAt = new Date()
    }

    // Update the transaction with the signature
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData
    })

    // Create status history entry for this signature
    await prisma.transactionStatusHistory.create({
      data: {
        transactionId: transactionId,
        fromStatus: 'AGREEMENT',
        toStatus: 'AGREEMENT',
        changedBy: session.user.id,
        notes: `${role === 'buyer' ? 'Buyer' : 'Seller'} signed the Promissory Purchase & Sale Agreement`
      }
    })

    // Check if both parties have now signed
    const bothSigned = updatedTransaction.buyerSignedPromissory && updatedTransaction.sellerSignedPromissory

    // If both parties have signed, update purchaseAgreementSigned
    if (bothSigned && !updatedTransaction.purchaseAgreementSigned) {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          purchaseAgreementSigned: true
        }
      })

      // Create status history entry
      await prisma.transactionStatusHistory.create({
        data: {
          transactionId: transactionId,
          fromStatus: 'AGREEMENT',
          toStatus: 'AGREEMENT',
          changedBy: session.user.id,
          notes: 'Both parties have signed the Promissory Purchase & Sale Agreement - Agreement is now fully executed'
        }
      })

      // Auto-advance to FUND_PROTECTION and initialize steps
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'FUND_PROTECTION' }
      })

      await prisma.transactionStatusHistory.create({
        data: {
          transactionId: transactionId,
          fromStatus: 'AGREEMENT',
          toStatus: 'FUND_PROTECTION',
          changedBy: session.user.id,
          notes: 'Auto-advanced to Fund Protection after both signatures'
        }
      })

      // DO NOT auto-initialize fund protection steps
      // Buyer must choose currency first via the UI
    }

    // Get the latest transaction state after potential auto-advance
    const finalTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        status: true,
        buyerSignedPromissory: true,
        sellerSignedPromissory: true,
        purchaseAgreementSigned: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Agreement signed successfully',
      buyerSigned: finalTransaction?.buyerSignedPromissory || false,
      sellerSigned: finalTransaction?.sellerSignedPromissory || false,
      bothSigned: finalTransaction?.purchaseAgreementSigned || false,
      newStatus: finalTransaction?.status,
      autoAdvanced: bothSigned
    })

  } catch (error) {
    console.error('Error signing promissory agreement:', error)
    return NextResponse.json(
      { error: 'Failed to sign agreement' },
      { status: 500 }
    )
  }
}