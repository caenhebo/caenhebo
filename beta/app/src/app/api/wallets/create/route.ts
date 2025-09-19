import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { createWallet } from '@/lib/striga'


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { currency } = await request.json()

    if (!currency) {
      return NextResponse.json(
        { error: 'Currency is required' },
        { status: 400 }
      )
    }

    // Get user with Striga user ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.strigaUserId) {
      return NextResponse.json(
        { error: 'User not registered with Striga' },
        { status: 400 }
      )
    }

    if (user.kycStatus !== 'PASSED') {
      return NextResponse.json(
        { error: 'KYC verification required' },
        { status: 400 }
      )
    }

    // Check if wallet already exists
    const existingWallet = await prisma.wallet.findUnique({
      where: {
        userId_currency: {
          userId: user.id,
          currency: currency
        }
      }
    })

    if (existingWallet) {
      return NextResponse.json(
        { error: 'Wallet already exists for this currency' },
        { status: 400 }
      )
    }

    // Create wallet via Striga API
    const walletData = await createWallet(user.strigaUserId, currency)

    // The actual wallet record will be created via webhook
    // when Striga confirms the wallet creation

    return NextResponse.json({
      message: 'Wallet creation initiated',
      currency: currency,
      walletId: walletData.walletId
    })

  } catch (error) {
    console.error('Wallet creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create wallet' },
      { status: 500 }
    )
  }
}