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

    // For now, we'll track signatures in the status history and set purchaseAgreementSigned
    // when both parties have signed (we'll check the history)
    
    // Check if the other party has already signed by looking at status history
    const existingSignatures = await prisma.transactionStatusHistory.findMany({
      where: {
        transactionId: transactionId,
        notes: {
          contains: 'signed the Promissory Purchase & Sale Agreement'
        }
      }
    })
    
    const otherPartyRole = isBuyer ? 'Seller' : 'Buyer'
    const otherPartySigned = existingSignatures.some(h => 
      h.notes?.includes(`${otherPartyRole} signed`)
    )
    
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
    
    // If both parties have now signed, update purchaseAgreementSigned
    let updatedTransaction
    if (otherPartySigned) {
      updatedTransaction = await prisma.transaction.update({
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

      // TODO: Send notification emails to both parties
    } else {
      updatedTransaction = await prisma.transaction.findUnique({
        where: { id: transactionId }
      })
    }
    
    // Check current signature status from history
    const allSignatures = await prisma.transactionStatusHistory.findMany({
      where: {
        transactionId: transactionId,
        notes: {
          contains: 'signed the Promissory Purchase & Sale Agreement'
        }
      }
    })
    
    const buyerSigned = allSignatures.some(h => h.notes?.includes('Buyer signed'))
    const sellerSigned = allSignatures.some(h => h.notes?.includes('Seller signed'))

    return NextResponse.json({
      success: true,
      message: 'Agreement signed successfully',
      buyerSigned: buyerSigned,
      sellerSigned: sellerSigned,
      bothSigned: updatedTransaction?.purchaseAgreementSigned || false
    })

  } catch (error) {
    console.error('Error signing promissory agreement:', error)
    return NextResponse.json(
      { error: 'Failed to sign agreement' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}