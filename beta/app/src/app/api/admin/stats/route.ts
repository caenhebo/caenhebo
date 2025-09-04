import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all statistics in parallel
    const [
      totalUsers,
      usersByRole,
      kycStats,
      propertyStats,
      transactionStats,
      walletStats,
      documentAccessStats,
      recentActivity
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      }),
      
      // KYC statistics
      prisma.user.groupBy({
        by: ['kycStatus'],
        _count: true
      }),
      
      // Property statistics
      Promise.all([
        prisma.property.count(),
        prisma.property.groupBy({
          by: ['complianceStatus'],
          _count: true
        }),
        prisma.property.aggregate({
          _sum: {
            price: true
          },
          _avg: {
            price: true
          }
        })
      ]),
      
      // Transaction statistics  
      Promise.all([
        prisma.transaction.count(),
        prisma.transaction.groupBy({
          by: ['status'],
          _count: true
        }),
        prisma.transaction.aggregate({
          _sum: {
            offerPrice: true,
            agreedPrice: true
          }
        })
      ]),
      
      // Wallet statistics
      Promise.all([
        prisma.wallet.count(),
        prisma.wallet.groupBy({
          by: ['currency'],
          _count: true
        })
      ]),
      
      // Document access statistics
      Promise.all([
        prisma.documentAccess.count(),
        prisma.documentAccess.count({
          where: { revoked: false }
        })
      ]),
      
      // Recent activity (last 7 days)
      Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        prisma.property.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        prisma.transaction.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ])
    ])

    // Process the data
    const roleStats = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count
      return acc
    }, {} as Record<string, number>)

    const kycStatusStats = kycStats.reduce((acc, item) => {
      acc[item.kycStatus] = item._count
      return acc
    }, {} as Record<string, number>)

    const [totalProperties, propertyStatusGroups, propertyAggregates] = propertyStats
    const propertyStatusStats = propertyStatusGroups.reduce((acc, item) => {
      acc[item.complianceStatus] = item._count
      return acc
    }, {} as Record<string, number>)

    const [totalTransactions, transactionStatusGroups, transactionAggregates] = transactionStats
    const transactionStatusStats = transactionStatusGroups.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>)

    const [totalWallets, walletCurrencyGroups] = walletStats
    const walletCurrencyStats = walletCurrencyGroups.reduce((acc, item) => {
      acc[item.currency] = item._count
      return acc
    }, {} as Record<string, number>)

    const [totalDocumentAccess, activeDocumentAccess] = documentAccessStats
    const [newUsersLastWeek, newPropertiesLastWeek, newTransactionsLastWeek] = recentActivity

    return NextResponse.json({
      users: {
        total: totalUsers,
        byRole: roleStats,
        buyers: roleStats.BUYER || 0,
        sellers: roleStats.SELLER || 0,
        admins: roleStats.ADMIN || 0
      },
      kyc: {
        total: totalUsers,
        byStatus: kycStatusStats,
        pending: kycStatusStats.PENDING || 0,
        initiated: kycStatusStats.INITIATED || 0,
        passed: kycStatusStats.PASSED || 0,
        rejected: kycStatusStats.REJECTED || 0
      },
      properties: {
        total: totalProperties,
        byStatus: propertyStatusStats,
        pending: propertyStatusStats.PENDING || 0,
        approved: propertyStatusStats.APPROVED || 0,
        rejected: propertyStatusStats.REJECTED || 0,
        totalValue: Number(propertyAggregates._sum.price || 0),
        averagePrice: Number(propertyAggregates._avg.price || 0)
      },
      transactions: {
        total: totalTransactions,
        byStatus: transactionStatusStats,
        active: (transactionStatusStats.OFFER || 0) + 
                (transactionStatusStats.COUNTER_OFFER || 0) + 
                (transactionStatusStats.ACCEPTED || 0) +
                (transactionStatusStats.DOCUMENTS || 0) +
                (transactionStatusStats.ESCROW || 0),
        completed: transactionStatusStats.COMPLETED || 0,
        failed: transactionStatusStats.FAILED || 0,
        totalOfferVolume: Number(transactionAggregates._sum.offerPrice || 0),
        totalAgreedVolume: Number(transactionAggregates._sum.agreedPrice || 0)
      },
      wallets: {
        total: totalWallets,
        byCurrency: walletCurrencyStats
      },
      documentAccess: {
        total: totalDocumentAccess,
        active: activeDocumentAccess
      },
      recentActivity: {
        newUsers: newUsersLastWeek,
        newProperties: newPropertiesLastWeek,
        newTransactions: newTransactionsLastWeek
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Failed to fetch admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}