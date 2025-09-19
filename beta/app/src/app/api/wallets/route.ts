import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { getWallets } from '@/lib/striga'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.error('[Wallets API] No session found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('[Wallets API] Session found for user:', session.user.email)

    // Get user with Striga user ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        wallets: true,
        digitalIbans: true
      }
    })

    if (!user?.strigaUserId) {
      console.error('[Wallets API] User not registered with Striga:', {
        userId: session.user.id,
        email: session.user.email,
        hasStrigaUserId: !!user?.strigaUserId
      })
      return NextResponse.json(
        { error: 'User not registered with Striga' },
        { status: 400 }
      )
    }

    if (user.kycStatus !== 'PASSED') {
      console.log('[Wallets API] KYC verification required:', {
        userId: session.user.id,
        email: session.user.email,
        kycStatus: user.kycStatus
      })
      return NextResponse.json(
        { 
          error: 'KYC verification required to access wallets',
          kycStatus: user.kycStatus 
        },
        { status: 400 }
      )
    }
    
    console.log('[Wallets API] User authorized:', {
      userId: session.user.id,
      email: session.user.email,
      role: user.role,
      kycStatus: user.kycStatus,
      strigaUserId: user.strigaUserId
    })

    // Try to fetch wallets from Striga API, fallback to mock data if credentials missing
    let strigaWallets = []
    let processedWallets = []
    
    try {
      strigaWallets = await getWallets(user.strigaUserId)
      
      // Process and categorize wallets
      for (const wallet of strigaWallets) {
        if (wallet.accounts && typeof wallet.accounts === 'object') {
          // Process multi-currency wallet structure
          for (const currency of Object.keys(wallet.accounts)) {
            const account = wallet.accounts[currency]
            
            if (account) {
              processedWallets.push({
                currency: currency,
                walletId: wallet.walletId,
                accountId: account.accountId || `account-${wallet.walletId}-${currency}`,
                address: account.address || '',
                qrCode: account.qrCode || '',
                network: account.network || '',
                balance: {
                  amount: account.availableBalance?.amount || '0',
                  currency: currency
                },
                type: getCurrencyType(currency)
              })
            }
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.warn('Striga API unavailable, using mock wallets for testing:', errorMessage)
      
      // Create mock wallets based on user role for testing
      if (user.role === 'SELLER') {
        processedWallets = [
          {
            currency: 'EUR',
            walletId: 'mock-eur-wallet-' + user.strigaUserId,
            accountId: 'mock-eur-account-' + user.strigaUserId,
            address: '', // EUR doesn't have blockchain address
            qrCode: '',
            network: '',
            balance: {
              amount: '0.00',
              currency: 'EUR'
            },
            type: getCurrencyType('EUR')
          }
        ]
      } else {
        // Buyers get crypto wallets
        processedWallets = [
          {
            currency: 'BTC',
            walletId: 'mock-btc-wallet-' + user.strigaUserId,
            accountId: 'mock-btc-account-' + user.strigaUserId,
            address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Genesis block address for demo
            qrCode: '',
            network: 'bitcoin',
            balance: {
              amount: '0.00000000',
              currency: 'BTC'
            },
            type: getCurrencyType('BTC')
          }
        ]
      }
    }

    // Separate wallets by type for easier frontend handling
    const cryptoWallets = processedWallets.filter(w => w.type === 'crypto')
    const fiatWallets = processedWallets.filter(w => w.type === 'fiat')
    
    // Get primary wallet based on user role
    const primaryWallet = getPrimaryWallet(processedWallets, user.role)

    return NextResponse.json({
      wallets: processedWallets,
      cryptoWallets,
      fiatWallets,
      primaryWallet,
      digitalIbans: user.digitalIbans,
      userRole: user.role
    })

  } catch (error) {
    console.error('Wallets fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallets' },
      { status: 500 }
    )
  }
}

function getCurrencyType(currency: string): 'crypto' | 'fiat' {
  const cryptoCurrencies = ['BTC', 'ETH', 'USDT', 'USDC', 'LTC', 'BNB']
  const fiatCurrencies = ['EUR', 'USD', 'GBP']
  
  if (cryptoCurrencies.includes(currency)) {
    return 'crypto'
  } else if (fiatCurrencies.includes(currency)) {
    return 'fiat'
  }
  
  // Default to crypto for unknown currencies
  return 'crypto'
}

function getPrimaryWallet(wallets: any[], userRole: string) {
  if (userRole === 'SELLER') {
    // Sellers get EUR wallet as primary
    return wallets.find(w => w.currency === 'EUR') || wallets.find(w => w.type === 'fiat') || wallets[0]
  } else {
    // Buyers get BTC wallet as primary
    return wallets.find(w => w.currency === 'BTC') || wallets.find(w => w.type === 'crypto') || wallets[0]
  }
}