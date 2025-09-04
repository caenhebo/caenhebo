import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user to check role and KYC status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.kycStatus !== 'PASSED') {
      return NextResponse.json(
        { error: 'KYC verification required to search properties' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const city = searchParams.get('city')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const bedrooms = searchParams.get('bedrooms')
    const bathrooms = searchParams.get('bathrooms')
    const propertyType = searchParams.get('propertyType')

    // Build where clause for property search
    let whereClause: any = {
      complianceStatus: 'APPROVED' // Only show approved properties to buyers
    }

    // Search by property code (exact match)
    if (code) {
      whereClause.code = code.toUpperCase()
    } else {
      // Apply other filters only if not searching by code
      if (city) {
        whereClause.city = {
          contains: city,
          mode: 'insensitive'
        }
      }

      if (minPrice || maxPrice) {
        whereClause.price = {}
        if (minPrice) {
          whereClause.price.gte = parseFloat(minPrice)
        }
        if (maxPrice) {
          whereClause.price.lte = parseFloat(maxPrice)
        }
      }

      if (bedrooms) {
        whereClause.bedrooms = {
          gte: parseInt(bedrooms)
        }
      }

      if (bathrooms) {
        whereClause.bathrooms = {
          gte: parseInt(bathrooms)
        }
      }
    }

    const properties = await prisma.property.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit results to prevent large response
      include: {
        _count: {
          select: {
            interests: true,
            transactions: true
          }
        }
      }
    })

    const formattedProperties = properties.map(property => ({
      id: property.id,
      code: property.code,
      title: property.title,
      description: property.description,
      address: property.address,
      city: property.city,
      state: property.state,
      postalCode: property.postalCode,
      country: property.country,
      price: property.price.toString(),
      area: property.area,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      complianceStatus: property.complianceStatus,
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
      interestCount: property._count.interests,
      transactionCount: property._count.transactions,
      sellerId: property.sellerId // Include for transaction purposes but don't expose seller details
    }))

    // Check if user has already expressed interest in these properties
    let propertiesWithInterest = formattedProperties
    if (user.role === 'BUYER') {
      const userInterests = await prisma.propertyInterest.findMany({
        where: {
          buyerId: session.user.id,
          propertyId: {
            in: properties.map(p => p.id)
          }
        }
      })

      const interestMap = new Map(userInterests.map(i => [i.propertyId, true]))
      
      propertiesWithInterest = formattedProperties.map(property => ({
        ...property,
        hasUserInterest: interestMap.has(property.id) || false
      }))
    }

    return NextResponse.json({
      properties: propertiesWithInterest,
      total: propertiesWithInterest.length,
      searchCriteria: {
        code,
        city,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        propertyType
      }
    })

  } catch (error) {
    console.error('Property search error:', error)
    return NextResponse.json(
      { error: 'Failed to search properties' },
      { status: 500 }
    )
  }
}