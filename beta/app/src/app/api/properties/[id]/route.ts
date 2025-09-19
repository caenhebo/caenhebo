import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET /api/properties/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            interests: true,
            transactions: true
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to view detailed info
    const isOwner = property.sellerId === session.user.id
    const isBuyer = session.user.role === 'BUYER'
    const isAdmin = session.user.role === 'ADMIN'

    // For sellers, only return their own properties with full details
    if (!isOwner && !isBuyer && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Format response based on user role
    const response = {
      property: {
        ...property,
        interestCount: property._count.interests,
        transactionCount: property._count.transactions,
        _count: undefined
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching property:', error)
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    )
  }
}

// PATCH /api/properties/[id]
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if property exists and user owns it
    const property = await prisma.property.findUnique({
      where: { id: params.id }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    if (property.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Update property - only include fields that exist in the schema
    const updatedProperty = await prisma.property.update({
      where: { id: params.id },
      data: {
        ...(body.hasOwnProperty('title') && { title: body.title }),
        ...(body.hasOwnProperty('description') && { description: body.description }),
        ...(body.hasOwnProperty('price') && { price: body.price }),
        ...(body.hasOwnProperty('bedrooms') && { bedrooms: body.bedrooms }),
        ...(body.hasOwnProperty('bathrooms') && { bathrooms: body.bathrooms }),
        ...(body.hasOwnProperty('area') && { area: body.area }),
        ...(body.hasOwnProperty('address') && { address: body.address }),
        ...(body.hasOwnProperty('city') && { city: body.city }),
        ...(body.hasOwnProperty('state') && { state: body.state }),
        ...(body.hasOwnProperty('postalCode') && { postalCode: body.postalCode }),
        ...(body.hasOwnProperty('country') && { country: body.country }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ property: updatedProperty })
  } catch (error) {
    console.error('Error updating property:', error)
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    )
  }
}

// DELETE /api/properties/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if property exists and user owns it
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            transactions: true
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    if (property.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Don't allow deletion if there are active transactions
    if (property._count.transactions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete property with active transactions' },
        { status: 400 }
      )
    }

    // Delete property
    await prisma.property.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting property:', error)
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    )
  }
}