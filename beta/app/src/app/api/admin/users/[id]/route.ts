import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { strigaApiRequest } from '@/lib/striga'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // First, get basic user data
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        wallets: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get related data separately to avoid complex includes
    const [sellerProperties, buyerTransactions, sellerTransactions, propertyInterests] = await Promise.all([
      // Get seller properties if user is a seller
      user.role === 'SELLER' ? prisma.property.findMany({
        where: { sellerId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              transactions: true,
              interests: true,
              documents: true
            }
          }
        }
      }) : Promise.resolve([]),
      
      // Get buyer transactions
      prisma.transaction.findMany({
        where: { buyerId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              country: true
            }
          }
        }
      }),
      
      // Get seller transactions
      user.role === 'SELLER' ? prisma.transaction.findMany({
        where: { 
          property: {
            sellerId: id
          }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              country: true
            }
          },
          buyer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }) : Promise.resolve([]),
      
      // Get property interests
      user.role === 'BUYER' ? prisma.propertyInterest.findMany({
        where: { buyerId: id },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              country: true,
              price: true
            }
          }
        }
      }) : Promise.resolve([])
    ])

    // Fetch Striga data if user has Striga ID
    let strigaData = null
    let strigaWallets = null
    
    if (user.strigaUserId) {
      try {
        // Fetch user data from Striga
        strigaData = await strigaApiRequest('/users/get', {
          method: 'POST',
          body: JSON.stringify({
            userId: user.strigaUserId
          })
        }) as any
        
        // Fetch wallets from Striga
        try {
          strigaWallets = await strigaApiRequest('/wallets/get/all', {
            method: 'POST',
            body: JSON.stringify({
              userId: user.strigaUserId,
              startDate: Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60, // 1 year ago
              endDate: Math.floor(Date.now() / 1000),
              page: 1
            })
          }) as any
        } catch (walletError) {
          console.error('Error fetching Striga wallets:', walletError)
        }
      } catch (error) {
        console.error('Error fetching Striga data:', error)
        // Continue without Striga data
      }
    }

    // Combine all data
    const userWithRelations = {
      ...user,
      sellerProperties,
      buyerTransactions,
      sellerTransactions,
      propertyInterests,
      strigaData,
      strigaWallets
    }

    return NextResponse.json({ user: userWithRelations })
  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}