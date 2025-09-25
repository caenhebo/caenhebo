import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let properties = []

    if (user.role === 'SELLER') {
      // Return seller's own properties
      const sellerProperties = await prisma.property.findMany({
        where: { sellerId: session.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          documents: true,
          seller: {
            select: {
              kyc2Status: true
            }
          },
          _count: {
            select: {
              interests: true,
              transactions: true
            }
          }
        }
      })

      properties = sellerProperties.map(property => ({
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
        listingStatus: 'ACTIVE', // Default to ACTIVE as there's no listingStatus in schema
        complianceStatus: property.complianceStatus,
        complianceNotes: property.complianceNotes,
        valuationPrice: property.valuationPrice?.toString(),
        documents: property.documents,
        interviewDate: property.interviewDate,
        interviewStatus: property.interviewStatus,
        interviewNotes: property.interviewNotes,
        finalApprovalStatus: property.finalApprovalStatus,
        isVisible: property.isVisible,
        visibilityStatus: property.finalApprovalStatus === 'APPROVED' && !property.isVisible
          ? 'Approved but not visible - Complete KYC Level 2 to make visible'
          : property.isVisible
          ? 'Visible to buyers'
          : 'Not visible',
        requiresKyc2: property.finalApprovalStatus === 'APPROVED' && !property.isVisible,
        createdAt: property.createdAt.toISOString(),
        updatedAt: property.updatedAt.toISOString(),
        interestCount: property._count.interests,
        transactionCount: property._count.transactions
      }))
    } else if (user.role === 'ADMIN') {
      // Return all properties for admin
      const allProperties = await prisma.property.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          documents: true,
          _count: {
            select: {
              interests: true,
              transactions: true
            }
          }
        }
      })

      properties = allProperties.map(property => ({
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
        listingStatus: 'ACTIVE', // Default to ACTIVE as there's no listingStatus in schema
        complianceStatus: property.complianceStatus,
        complianceNotes: property.complianceNotes,
        valuationPrice: property.valuationPrice?.toString(),
        sellerId: property.sellerId,
        documents: property.documents,
        interviewDate: property.interviewDate,
        interviewStatus: property.interviewStatus,
        interviewNotes: property.interviewNotes,
        finalApprovalStatus: property.finalApprovalStatus,
        isVisible: property.isVisible,
        createdAt: property.createdAt.toISOString(),
        updatedAt: property.updatedAt.toISOString(),
        interestCount: property._count.interests,
        transactionCount: property._count.transactions
      }))
    } else {
      // Buyers should use the search endpoint instead
      return NextResponse.json(
        { error: 'Buyers should use the search endpoint to find properties' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      properties,
      total: properties.length,
      userRole: user.role
    })

  } catch (error) {
    console.error('Properties fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}