import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { createWallet, createDigitalIban } from '@/lib/striga'


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user with Striga info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { wallets: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.strigaUserId) {
      return NextResponse.json(
        { error: 'User not registered with Striga' },
        { status: 400 }
      )
    }

    if (user.kycStatus !== 'PASSED') {
      return NextResponse.json(
        { error: 'KYC verification must be completed first' },
        { status: 400 }
      )
    }

    const currencies = ['BTC', 'ETH', 'BNB', 'USDT']
    const existingCurrencies = user.wallets.map(w => w.currency)
    const missingCurrencies = currencies.filter(c => !existingCurrencies.includes(c))
    
    const results = {
      created: [],
      existing: existingCurrencies,
      errors: []
    }

    // Create missing wallets
    for (const currency of missingCurrencies) {
      try {
        // Create wallet via Striga API
        const walletData = await createWallet(user.strigaUserId, currency)
        
        results.created.push({
          currency,
          walletId: walletData.walletId
        })

        // Create wallet record immediately (webhook will update if needed)
        if (walletData.walletId) {
          await prisma.wallet.upsert({
            where: {
              userId_currency: {
                userId: user.id,
                currency: currency
              }
            },
            update: {
              strigaWalletId: walletData.walletId,
              address: walletData.address || null,
              lastSyncAt: new Date()
            },
            create: {
              userId: user.id,
              strigaWalletId: walletData.walletId,
              currency: currency,
              address: walletData.address || null,
              balance: 0
            }
          })
        }
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 300))
        
      } catch (error) {
        console.error(`Failed to create ${currency} wallet:`, error)
        results.errors.push({
          currency,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Create digital IBAN for sellers if missing
    if (user.role === 'SELLER') {
      const hasIban = await prisma.digitalIban.findFirst({
        where: {
          userId: user.id,
          active: true
        }
      })
      
      if (!hasIban) {
        try {
          const ibanData = await createDigitalIban(user.strigaUserId)
          
          await prisma.digitalIban.create({
            data: {
              userId: user.id,
              iban: ibanData.iban,
              bankName: ibanData.bankName,
              accountNumber: ibanData.accountNumber,
              active: true
            }
          })
          
          results.iban = {
            created: true,
            iban: ibanData.iban
          }
        } catch (error) {
          console.error('Failed to create digital IBAN:', error)
          results.ibanError = error instanceof Error ? error.message : 'Unknown error'
        }
      } else {
        results.iban = {
          existing: true,
          iban: hasIban.iban
        }
      }
    }

    return NextResponse.json({
      message: 'Wallet sync completed',
      results
    })

  } catch (error) {
    console.error('Wallet sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync wallets' },
      { status: 500 }
    )
  }
}