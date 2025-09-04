import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET - Get list of buyers with document access
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

    // Verify property ownership
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: { sellerId: true }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    if (property.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get all document access permissions for this property
    const accessList = await prisma.documentAccess.findMany({
      where: { 
        propertyId: params.id,
        revoked: false
      },
      include: {
        buyer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { grantedAt: 'desc' }
    })

    return NextResponse.json({ accessList })
  } catch (error) {
    console.error('Failed to fetch document access:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document access' },
      { status: 500 }
    )
  }
}

// POST - Grant document access to a buyer
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

    const body = await request.json()
    const { buyerEmail, message, expiresInDays } = body

    if (!buyerEmail) {
      return NextResponse.json(
        { error: 'Buyer email is required' },
        { status: 400 }
      )
    }

    // Verify property ownership
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: { 
        sellerId: true,
        code: true,
        title: true
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
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Find buyer by email
    const buyer = await prisma.user.findUnique({
      where: { email: buyerEmail },
      select: { id: true, role: true, firstName: true, lastName: true }
    })

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer not found' },
        { status: 404 }
      )
    }

    if (buyer.role !== 'BUYER') {
      return NextResponse.json(
        { error: 'User is not a buyer' },
        { status: 400 }
      )
    }

    // Check if access already exists
    const existingAccess = await prisma.documentAccess.findUnique({
      where: {
        propertyId_buyerId: {
          propertyId: params.id,
          buyerId: buyer.id
        }
      }
    })

    if (existingAccess && !existingAccess.revoked) {
      return NextResponse.json(
        { error: 'Buyer already has document access' },
        { status: 400 }
      )
    }

    // Calculate expiration date if specified
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null

    // Create or update document access
    const documentAccess = await prisma.documentAccess.upsert({
      where: {
        propertyId_buyerId: {
          propertyId: params.id,
          buyerId: buyer.id
        }
      },
      update: {
        revoked: false,
        revokedAt: null,
        message,
        expiresAt,
        grantedAt: new Date()
      },
      create: {
        propertyId: params.id,
        buyerId: buyer.id,
        grantedBy: session.user.id,
        message,
        expiresAt
      }
    })

    // Create notification for buyer
    await prisma.notification.create({
      data: {
        userId: buyer.id,
        title: 'Document Access Granted',
        message: `You've been granted access to documents for property ${property.code} - ${property.title}`,
        type: 'DOCUMENT_ACCESS'
      }
    })

    return NextResponse.json({
      success: true,
      documentAccess: {
        ...documentAccess,
        buyer: {
          id: buyer.id,
          firstName: buyer.firstName,
          lastName: buyer.lastName,
          email: buyerEmail
        }
      }
    })
  } catch (error) {
    console.error('Failed to grant document access:', error)
    return NextResponse.json(
      { error: 'Failed to grant document access' },
      { status: 500 }
    )
  }
}

// DELETE - Revoke document access
export async function DELETE(
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

    const { searchParams } = new URL(request.url)
    const buyerId = searchParams.get('buyerId')

    if (!buyerId) {
      return NextResponse.json(
        { error: 'Buyer ID is required' },
        { status: 400 }
      )
    }

    // Verify property ownership
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: { sellerId: true, code: true, title: true }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    if (property.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Revoke access
    const documentAccess = await prisma.documentAccess.updateMany({
      where: {
        propertyId: params.id,
        buyerId: buyerId
      },
      data: {
        revoked: true,
        revokedAt: new Date()
      }
    })

    if (documentAccess.count === 0) {
      return NextResponse.json(
        { error: 'Document access not found' },
        { status: 404 }
      )
    }

    // Create notification for buyer
    await prisma.notification.create({
      data: {
        userId: buyerId,
        title: 'Document Access Revoked',
        message: `Your access to documents for property ${property.code} - ${property.title} has been revoked`,
        type: 'DOCUMENT_ACCESS'
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to revoke document access:', error)
    return NextResponse.json(
      { error: 'Failed to revoke document access' },
      { status: 500 }
    )
  }
}