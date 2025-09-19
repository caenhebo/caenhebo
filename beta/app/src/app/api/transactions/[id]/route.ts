import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(
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

    // Find the transaction with all related data
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        property: {
          select: {
            id: true,
            code: true,
            title: true,
            description: true,
            address: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            price: true,
            area: true,
            bedrooms: true,
            bathrooms: true,
            complianceStatus: true,
            createdAt: true
          }
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        counterOffers: {
          orderBy: { createdAt: 'desc' }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        },
        escrowDetails: true,
        documents: {
          select: {
            id: true,
            documentType: true,
            filename: true,
            originalName: true,
            title: true,
            description: true,
            signed: true,
            signedAt: true,
            createdAt: true
          }
        },
        payments: {
          select: {
            id: true,
            type: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check if user is involved in the transaction or is admin
    const isAdmin = session.user.role === 'ADMIN'
    const isBuyer = transaction.buyerId === session.user.id
    const isSeller = transaction.sellerId === session.user.id

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json(
        { error: 'You are not authorized to view this transaction' },
        { status: 403 }
      )
    }

    // Format the response
    const formattedTransaction = {
      id: transaction.id,
      propertyId: transaction.propertyId,
      status: transaction.status,
      offerPrice: transaction.offerPrice.toString(),
      agreedPrice: transaction.agreedPrice?.toString() || null,
      offerMessage: transaction.offerMessage,
      offerTerms: transaction.offerTerms,
      
      // Dates
      proposalDate: transaction.proposalDate?.toISOString() || null,
      acceptanceDate: transaction.acceptanceDate?.toISOString() || null,
      escrowDate: transaction.escrowDate?.toISOString() || null,
      completionDate: transaction.completionDate?.toISOString() || null,
      deadlineDate: transaction.deadlineDate?.toISOString() || null,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      
      // Representation
      buyerHasRep: transaction.buyerHasRep,
      sellerHasRep: transaction.sellerHasRep,
      
      // Agreements
      mediationSigned: transaction.mediationSigned,
      purchaseAgreementSigned: transaction.purchaseAgreementSigned,
      buyerSignedPromissory: transaction.buyerSignedPromissory,
      sellerSignedPromissory: transaction.sellerSignedPromissory,
      buyerSignedMediation: transaction.buyerSignedMediation,
      sellerSignedMediation: transaction.sellerSignedMediation,
      
      // Payment information
      paymentMethod: transaction.paymentMethod,
      cryptoPercentage: transaction.cryptoPercentage,
      fiatPercentage: transaction.fiatPercentage,
      
      // Relations
      property: transaction.property,
      buyer: transaction.buyer,
      seller: transaction.seller,
      
      // User's role
      userRole: transaction.buyerId === session.user.id ? 'buyer' : 'seller',
      
      // Counter offers
      counterOffers: transaction.counterOffers.map(co => ({
        id: co.id,
        price: co.price.toString(),
        message: co.message,
        terms: co.terms,
        fromBuyer: co.fromBuyer,
        accepted: co.accepted,
        rejected: co.rejected,
        createdAt: co.createdAt.toISOString()
      })),
      
      // Status history
      statusHistory: transaction.statusHistory.map(sh => ({
        id: sh.id,
        fromStatus: sh.fromStatus,
        toStatus: sh.toStatus,
        changedBy: sh.changedBy,
        notes: sh.notes,
        createdAt: sh.createdAt.toISOString()
      })),
      
      // Escrow details
      escrowDetails: transaction.escrowDetails ? {
        id: transaction.escrowDetails.id,
        escrowAccountId: transaction.escrowDetails.escrowAccountId,
        escrowProvider: transaction.escrowDetails.escrowProvider,
        totalAmount: transaction.escrowDetails.totalAmount.toString(),
        initialDeposit: transaction.escrowDetails.initialDeposit?.toString() || null,
        finalPayment: transaction.escrowDetails.finalPayment?.toString() || null,
        releaseConditions: transaction.escrowDetails.releaseConditions,
        fundsReceived: transaction.escrowDetails.fundsReceived,
        fundsReleased: transaction.escrowDetails.fundsReleased,
        fundingDate: transaction.escrowDetails.fundingDate?.toISOString() || null,
        releaseDate: transaction.escrowDetails.releaseDate?.toISOString() || null
      } : null,
      
      // Documents
      documents: transaction.documents,
      
      // Payments
      payments: transaction.payments.map(p => ({
        id: p.id,
        type: p.type,
        amount: p.amount.toString(),
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt.toISOString()
      }))
    }

    return NextResponse.json({
      success: true,
      transaction: formattedTransaction
    })

  } catch (error) {
    console.error('Transaction detail fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction details' },
      { status: 500 }
    )
  }
}