import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { notifyNewOffer } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is a buyer and KYC is approved
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'BUYER') {
      return NextResponse.json(
        { error: 'Only buyers can make offers on properties' },
        { status: 403 }
      )
    }

    if (user.kycStatus !== 'PASSED') {
      return NextResponse.json(
        { error: 'KYC verification required to make offers' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { propertyId, offerPrice, message, terms, paymentMethod, cryptoPercentage, fiatPercentage } = body

    if (!propertyId || !offerPrice) {
      return NextResponse.json(
        { error: 'Property ID and offer price are required' },
        { status: 400 }
      )
    }

    // Validate payment method
    if (!paymentMethod || !['FIAT', 'CRYPTO', 'HYBRID'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Valid payment method is required (FIAT, CRYPTO, or HYBRID)' },
        { status: 400 }
      )
    }

    // Validate percentages for hybrid payment
    if (paymentMethod === 'HYBRID') {
      if (cryptoPercentage == null || fiatPercentage == null) {
        return NextResponse.json(
          { error: 'Crypto and fiat percentages are required for hybrid payment' },
          { status: 400 }
        )
      }
      
      if (cryptoPercentage + fiatPercentage !== 100) {
        return NextResponse.json(
          { error: 'Crypto and fiat percentages must sum to 100' },
          { status: 400 }
        )
      }
      
      if (cryptoPercentage < 0 || cryptoPercentage > 100 || fiatPercentage < 0 || fiatPercentage > 100) {
        return NextResponse.json(
          { error: 'Percentages must be between 0 and 100' },
          { status: 400 }
        )
      }
    }

    // Validate offer price is positive
    if (parseFloat(offerPrice) <= 0) {
      return NextResponse.json(
        { error: 'Offer price must be greater than zero' },
        { status: 400 }
      )
    }

    // Verify property exists and is approved
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    if (property.complianceStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Can only make offers on approved properties' },
        { status: 400 }
      )
    }

    // Check if buyer is the seller (prevent self-offers)
    if (property.sellerId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot make an offer on your own property' },
        { status: 400 }
      )
    }

    // Check if there's already an active transaction for this property-buyer combination
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        propertyId: propertyId,
        buyerId: session.user.id,
        status: {
          in: ['OFFER', 'NEGOTIATION', 'AGREEMENT', 'KYC2_VERIFICATION', 'FUND_PROTECTION', 'CLOSING']
        }
      }
    })

    if (existingTransaction) {
      return NextResponse.json(
        { error: 'You already have an active offer/transaction on this property' },
        { status: 409 }
      )
    }

    // Create the transaction/offer
    const transaction = await prisma.transaction.create({
      data: {
        propertyId: propertyId,
        buyerId: session.user.id,
        sellerId: property.sellerId,
        status: 'OFFER',
        offerPrice: parseFloat(offerPrice),
        offerMessage: message || null,
        offerTerms: terms || null,
        proposalDate: new Date(),
        paymentMethod: paymentMethod,
        cryptoPercentage: paymentMethod === 'HYBRID' ? cryptoPercentage : null,
        fiatPercentage: paymentMethod === 'HYBRID' ? fiatPercentage : null
      },
      include: {
        property: {
          select: {
            id: true,
            code: true,
            title: true,
            address: true,
            price: true
          }
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Create initial status history entry
    await prisma.transactionStatusHistory.create({
      data: {
        transactionId: transaction.id,
        fromStatus: null,
        toStatus: 'OFFER',
        changedBy: session.user.id,
        notes: 'Initial offer created'
      }
    })

    // Send notification to seller about new offer
    try {
      await notifyNewOffer(
        property.sellerId,
        `${transaction.buyer.firstName} ${transaction.buyer.lastName}`,
        transaction.property.title,
        parseFloat(offerPrice),
        transaction.id,
        transaction.propertyId,
        {
          id: transaction.property.id,
          code: transaction.property.code,
          title: transaction.property.title,
          address: transaction.property.address,
          price: transaction.property.price.toString()
        }
      )
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError)
      // Don't fail the transaction if notification fails
    }
    
    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        propertyId: transaction.propertyId,
        buyerId: transaction.buyerId,
        sellerId: transaction.sellerId,
        status: transaction.status,
        offerPrice: transaction.offerPrice.toString(),
        offerMessage: transaction.offerMessage,
        offerTerms: transaction.offerTerms,
        proposalDate: transaction.proposalDate?.toISOString(),
        createdAt: transaction.createdAt.toISOString(),
        property: transaction.property,
        buyer: transaction.buyer,
        seller: transaction.seller
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create offer error:', error)
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    )
  } finally {
  }
}