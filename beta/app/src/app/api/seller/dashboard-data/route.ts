import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { strigaApiRequest } from '@/lib/striga'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SELLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all data in parallel
    const [user, properties, transactions, kycData] = await Promise.all([
      // Get user data
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          kycStatus: true,
          kyc2Status: true,
          emailVerified: true,
          phoneVerified: true,
          strigaUserId: true
        }
      }),
      
      // Get properties with counts
      prisma.property.findMany({
        where: { sellerId: session.user.id },
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
      }),
      
      // Get transactions
      prisma.transaction.findMany({
        where: { 
          property: {
            sellerId: session.user.id
          }
        },
        select: {
          id: true,
          status: true,
          offerPrice: true,
          createdAt: true
        }
      }),
      
      // Skip Striga check if KYC is already PASSED to avoid slow API calls
      (async () => {
        const userData = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { strigaUserId: true, kycStatus: true }
        })
        
        // Only check Striga if KYC is not already PASSED
        if (userData?.strigaUserId && userData.kycStatus !== 'PASSED') {
          try {
            // Use the correct endpoint: /user/{userId}
            const strigaUser = await strigaApiRequest(`/user/${userData.strigaUserId}`, {
              method: 'GET'
            }) as any
            
            if (strigaUser) {
              const strigaKycStatus = strigaUser?.KYC?.status
              console.log('[Dashboard] Striga KYC status:', strigaKycStatus, 'Current DB status:', userData.kycStatus)
              
              // Map Striga status to our status
              let mappedStatus = userData.kycStatus
              if (strigaKycStatus === 'APPROVED' && userData.kycStatus !== 'PASSED') {
                mappedStatus = 'PASSED'
                // Update database
                await prisma.user.update({
                  where: { id: session.user.id },
                  data: { kycStatus: 'PASSED' }
                })
                console.log('[Dashboard] Updated KYC status to PASSED')
              } else if (strigaKycStatus === 'REJECTED' && userData.kycStatus !== 'REJECTED') {
                mappedStatus = 'REJECTED'
                await prisma.user.update({
                  where: { id: session.user.id },
                  data: { kycStatus: 'REJECTED' }
                })
                console.log('[Dashboard] Updated KYC status to REJECTED')
              } else if (strigaKycStatus === 'IN_REVIEW' && userData.kycStatus !== 'INITIATED') {
                mappedStatus = 'INITIATED'
                await prisma.user.update({
                  where: { id: session.user.id },
                  data: { kycStatus: 'INITIATED' }
                })
                console.log('[Dashboard] Updated KYC status to INITIATED')
              }
              
              return mappedStatus
            }
          } catch (error) {
            console.error('Error fetching Striga KYC status:', error)
          }
        }
        return userData?.kycStatus || 'PENDING'
      })()
    ])

    // Calculate stats
    const propertyStats = {
      listedProperties: properties.length,
      pendingOffers: properties.reduce((sum, p) => sum + p._count.transactions, 0),
      activeBuyers: properties.reduce((sum, p) => sum + p._count.interests, 0),
      propertiesSold: properties.filter(p => p._count.transactions > 0).length
    }

    const transactionStats = {
      totalOffers: transactions.length,
      activeTransactions: transactions.filter(t => 
        ['OFFER', 'NEGOTIATION', 'AGREEMENT', 'ESCROW', 'CLOSING'].includes(t.status)
      ).length,
      completedSales: transactions.filter(t => t.status === 'COMPLETED').length
    }

    // Format properties for response
    const formattedProperties = properties.map(property => ({
      id: property.id,
      code: property.code,
      title: property.title,
      city: property.city,
      state: property.state,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      price: property.price.toString(),
      listingStatus: 'ACTIVE',
      complianceStatus: property.complianceStatus,
      finalApprovalStatus: property.finalApprovalStatus,
      isVisible: property.isVisible,
      interestCount: property._count.interests,
      transactionCount: property._count.transactions
    }))

    // Check if user has wallets (only if KYC passed)
    let hasWallets = false
    if (kycData === 'PASSED') {
      const walletCount = await prisma.wallet.count({
        where: { userId: session.user.id }
      })
      hasWallets = walletCount > 0
    }

    // Count properties that need KYC2 for visibility
    const propertiesNeedingKyc2 = properties.filter(p =>
      p.finalApprovalStatus === 'APPROVED' && !p.isVisible
    ).length

    return NextResponse.json({
      kycStatus: kycData,
      kyc2Status: user?.kyc2Status || 'PENDING',
      propertyStats,
      transactionStats,
      properties: formattedProperties.slice(0, 5), // Return only first 5 for dashboard
      totalProperties: properties.length,
      propertiesNeedingKyc2,
      hasWallets,
      user: {
        emailVerified: user?.emailVerified || false,
        phoneVerified: user?.phoneVerified || false
      }
    })

  } catch (error) {
    console.error('Dashboard data error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}