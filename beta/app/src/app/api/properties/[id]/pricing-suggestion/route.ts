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

    const propertyId = params.id

    // Get the property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        seller: true
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Get buyer's transaction history
    const buyerHistory = await prisma.transaction.findMany({
      where: { 
        buyerId: session.user.id,
        status: 'COMPLETED'
      },
      select: {
        offerPrice: true,
        agreedPrice: true,
        property: {
          select: {
            price: true,
            area: true,
            bedrooms: true,
            city: true
          }
        }
      }
    })

    // Get recent similar property transactions
    const similarTransactions = await prisma.transaction.findMany({
      where: {
        status: 'COMPLETED',
        property: {
          city: property.city,
          bedrooms: property.bedrooms ? {
            gte: (property.bedrooms - 1),
            lte: (property.bedrooms + 1)
          } : undefined,
          area: property.area ? {
            gte: property.area * 0.8,
            lte: property.area * 1.2
          } : undefined
        }
      },
      select: {
        agreedPrice: true,
        property: {
          select: {
            price: true,
            area: true,
            bedrooms: true
          }
        }
      },
      orderBy: {
        completionDate: 'desc'
      },
      take: 10
    })

    // Get all offers on this property
    const propertyOffers = await prisma.transaction.findMany({
      where: {
        propertyId: propertyId,
        status: {
          in: ['OFFER', 'NEGOTIATION', 'AGREEMENT', 'ESCROW', 'CLOSING', 'COMPLETED']
        }
      },
      select: {
        offerPrice: true,
        agreedPrice: true,
        status: true,
        createdAt: true
      }
    })

    // Calculate pricing suggestions
    const listPrice = parseFloat(property.price)
    
    // Calculate average discount from similar properties
    let avgDiscount = 0.05 // Default 5% discount
    if (similarTransactions.length > 0) {
      const discounts = similarTransactions
        .filter(t => t.agreedPrice)
        .map(t => {
          const originalPrice = parseFloat(t.property.price)
          const agreedPrice = parseFloat(t.agreedPrice.toString())
          return (originalPrice - agreedPrice) / originalPrice
        })
      
      if (discounts.length > 0) {
        avgDiscount = discounts.reduce((a, b) => a + b, 0) / discounts.length
      }
    }

    // Calculate buyer's typical offer pattern
    let buyerPattern = 0.95 // Default to 95% of asking
    if (buyerHistory.length > 0) {
      const offerRatios = buyerHistory.map(t => {
        const listPrice = parseFloat(t.property.price)
        const offerPrice = parseFloat(t.offerPrice.toString())
        return offerPrice / listPrice
      })
      buyerPattern = offerRatios.reduce((a, b) => a + b, 0) / offerRatios.length
    }

    // Market conditions factor (simplified - in reality would use more data)
    const marketHeat = propertyOffers.length > 3 ? 1.02 : 1.0 // Hot market = higher prices

    // Calculate suggestions
    const conservativeOffer = listPrice * 0.90 * marketHeat
    const competitiveOffer = listPrice * (1 - avgDiscount) * marketHeat
    const aggressiveOffer = listPrice * buyerPattern * marketHeat

    // Get price per square meter insights
    const pricePerSqm = property.area ? listPrice / property.area : null
    const avgPricePerSqm = similarTransactions.length > 0 && property.area
      ? similarTransactions
          .filter(t => t.property.area && t.agreedPrice)
          .map(t => parseFloat(t.agreedPrice.toString()) / t.property.area!)
          .reduce((a, b) => a + b, 0) / similarTransactions.length
      : null

    return NextResponse.json({
      property: {
        id: property.id,
        code: property.code,
        listPrice: listPrice,
        pricePerSqm: pricePerSqm
      },
      marketAnalysis: {
        similarPropertiesAnalyzed: similarTransactions.length,
        averageDiscount: Math.round(avgDiscount * 100),
        currentOffers: propertyOffers.length,
        marketCondition: propertyOffers.length > 3 ? 'hot' : propertyOffers.length > 1 ? 'active' : 'normal',
        avgPricePerSqm: avgPricePerSqm
      },
      buyerProfile: {
        previousPurchases: buyerHistory.length,
        typicalOfferRatio: Math.round(buyerPattern * 100),
        isExperiencedBuyer: buyerHistory.length > 2
      },
      pricingSuggestions: {
        conservative: {
          amount: Math.round(conservativeOffer),
          description: 'Safe starting offer, leaves room for negotiation',
          percentOfAsking: 90
        },
        competitive: {
          amount: Math.round(competitiveOffer),
          description: 'Based on market averages for similar properties',
          percentOfAsking: Math.round((competitiveOffer / listPrice) * 100)
        },
        aggressive: {
          amount: Math.round(aggressiveOffer),
          description: 'Strong offer based on your buying pattern',
          percentOfAsking: Math.round((aggressiveOffer / listPrice) * 100)
        }
      },
      insights: [
        propertyOffers.length > 2 
          ? `This property has ${propertyOffers.length} offers - consider a competitive bid`
          : 'Limited competition on this property - you have negotiation leverage',
        
        avgPricePerSqm && pricePerSqm && avgPricePerSqm < pricePerSqm
          ? `Property is priced ${Math.round(((pricePerSqm - avgPricePerSqm) / avgPricePerSqm) * 100)}% above area average per m²`
          : 'Property is competitively priced for the area',
          
        buyerHistory.length > 0
          ? `Based on your history, you typically offer ${Math.round(buyerPattern * 100)}% of asking price`
          : 'Make your first offer count - research the market carefully'
      ]
    })

  } catch (error) {
    console.error('Pricing suggestion error:', error)
    return NextResponse.json(
      { error: 'Failed to generate pricing suggestion' },
      { status: 500 }
    )
  }
}