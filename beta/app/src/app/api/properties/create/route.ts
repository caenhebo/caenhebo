import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is a seller and KYC is approved
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== 'SELLER') {
      return NextResponse.json(
        { error: 'Only sellers can list properties' },
        { status: 403 }
      )
    }

    if (user.kycStatus !== 'PASSED') {
      return NextResponse.json(
        { error: 'KYC verification required to list properties' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      address,
      city,
      state,
      postalCode,
      country = 'Portugal',
      price,
      area,
      bedrooms,
      bathrooms
    } = body

    // Validate required fields
    if (!title || !address || !city || !postalCode || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: title, address, city, postalCode, price' },
        { status: 400 }
      )
    }

    // Validate price is positive
    if (parseFloat(price) <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      )
    }

    // Generate unique property code
    const year = new Date().getFullYear()
    const propertyCount = await prisma.property.count()
    const propertyCode = `CAE-${year}-${(propertyCount + 1).toString().padStart(4, '0')}`

    // Create property
    const property = await prisma.property.create({
      data: {
        code: propertyCode,
        title,
        description,
        address,
        city,
        state,
        postalCode,
        country,
        price: parseFloat(price),
        area: area ? parseFloat(area) : null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        sellerId: session.user.id,
        complianceStatus: 'PENDING'
      }
    })

    return NextResponse.json({
      property: {
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
        createdAt: property.createdAt.toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Property creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    )
  }
}