import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET - Check if current user has document access
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

    // Check if user is the property owner
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

    // Property owners always have access
    if (property.sellerId === session.user.id) {
      return NextResponse.json({ 
        hasAccess: true,
        reason: 'owner'
      })
    }

    // Check if buyer has been granted access
    const documentAccess = await prisma.documentAccess.findUnique({
      where: {
        propertyId_buyerId: {
          propertyId: params.id,
          buyerId: session.user.id
        }
      }
    })

    // Check various conditions
    if (!documentAccess) {
      return NextResponse.json({ 
        hasAccess: false,
        reason: 'no_permission'
      })
    }

    if (documentAccess.revoked) {
      return NextResponse.json({ 
        hasAccess: false,
        reason: 'revoked'
      })
    }

    if (documentAccess.expiresAt && documentAccess.expiresAt < new Date()) {
      return NextResponse.json({ 
        hasAccess: false,
        reason: 'expired'
      })
    }

    return NextResponse.json({ 
      hasAccess: true,
      reason: 'granted',
      grantedAt: documentAccess.grantedAt,
      expiresAt: documentAccess.expiresAt,
      message: documentAccess.message
    })

  } catch (error) {
    console.error('Failed to check document access:', error)
    return NextResponse.json(
      { error: 'Failed to check document access' },
      { status: 500 }
    )
  }
}