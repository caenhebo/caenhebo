import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { ensureUserWallets } from '@/lib/wallet-manager'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  // Check if user is admin
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    )
  }

  try {
    // Get all users with their wallet information
    const users = await prisma.user.findMany({
      where: {
        role: { not: 'ADMIN' }
      },
      include: {
        wallets: true,
        digitalIbans: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Process user data for monitoring
    const monitorData = users.map(user => {
      const expectedWalletCount = user.role === 'SELLER' ? 5 : 4
      const hasAllWallets = user.wallets.length >= expectedWalletCount
      const missingCurrencies = getMissingCurrencies(user)
      const hasIban = user.role === 'SELLER' ? user.digitalIbans.length > 0 : true
      
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        kycStatus: user.kycStatus,
        strigaUserId: user.strigaUserId,
        walletCount: user.wallets.length,
        expectedWalletCount,
        hasAllWallets,
        missingCurrencies,
        hasIban,
        needsWallets: !hasAllWallets || (!hasIban && user.role === 'SELLER'),
        wallets: user.wallets.map(w => ({
          currency: w.currency,
          balance: w.balance,
          strigaWalletId: w.strigaWalletId
        })),
        digitalIbans: user.digitalIbans.map(i => ({
          iban: i.iban,
          bankName: i.bankName,
          active: i.active
        }))
      }
    })

    // Summary statistics
    const stats = {
      totalUsers: users.length,
      kycApprovedUsers: users.filter(u => u.kycStatus === 'PASSED').length,
      usersWithCompleteWallets: monitorData.filter(u => u.hasAllWallets && u.hasIban).length,
      usersNeedingWallets: monitorData.filter(u => u.needsWallets && u.kycStatus === 'PASSED').length,
      totalWallets: users.reduce((sum, user) => sum + user.wallets.length, 0)
    }

    return NextResponse.json({
      stats,
      users: monitorData
    })

  } catch (error) {
    console.error('Wallet monitor error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet data' },
      { status: 500 }
    )
  }
}

// Refresh wallets for a specific user
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  // Check if user is admin
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    )
  }

  try {
    const { userId, action } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify user exists and is eligible
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.kycStatus !== 'PASSED' || !user.strigaUserId) {
      return NextResponse.json(
        { error: 'User not eligible for wallet creation (KYC not passed or no Striga ID)' },
        { status: 400 }
      )
    }

    if (action === 'refresh') {
      // Create missing wallets for the user
      const result = await ensureUserWallets(userId)
      
      return NextResponse.json({
        success: true,
        message: `Wallet refresh completed for ${user.email}`,
        result
      })
    } else if (action === 'refresh-all') {
      // Refresh wallets for all eligible users
      const eligibleUsers = await prisma.user.findMany({
        where: {
          kycStatus: 'PASSED',
          strigaUserId: { not: null },
          role: { not: 'ADMIN' }
        }
      })

      const results = []
      for (const eligibleUser of eligibleUsers) {
        try {
          const result = await ensureUserWallets(eligibleUser.id)
          if (result.created.length > 0 || result.success) {
            results.push({
              userId: eligibleUser.id,
              email: eligibleUser.email,
              ...result
            })
          }
        } catch (error) {
          console.error(`Failed to refresh wallets for ${eligibleUser.email}:`, error)
        }
      }

      return NextResponse.json({
        success: true,
        message: `Wallet refresh completed for ${results.length} users`,
        results
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "refresh" or "refresh-all"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Wallet refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh wallets' },
      { status: 500 }
    )
  }
}

function getMissingCurrencies(user: any) {
  const requiredCurrencies = ['BTC', 'ETH', 'BNB', 'USDT']
  if (user.role === 'SELLER') {
    requiredCurrencies.push('EUR')
  }
  
  const existingCurrencies = user.wallets.map((w: any) => w.currency)
  return requiredCurrencies.filter(c => !existingCurrencies.includes(c))
}