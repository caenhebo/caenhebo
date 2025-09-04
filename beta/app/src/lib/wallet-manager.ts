import { PrismaClient } from '@prisma/client'
import { createWallet, createDigitalIban } from './striga'

const prisma = new PrismaClient()

interface WalletCreationResult {
  success: boolean
  created: string[]
  failed: string[]
  errors: { currency: string; error: string }[]
}

/**
 * Ensures all required wallets exist for a user based on their role and KYC status
 */
export async function ensureUserWallets(userId: string): Promise<WalletCreationResult> {
  const result: WalletCreationResult = {
    success: false,
    created: [],
    failed: [],
    errors: []
  }

  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallets: true, digitalIbans: true }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Only create wallets for KYC-approved users with Striga ID
    if (user.kycStatus !== 'PASSED' || !user.strigaUserId) {
      console.log(`User ${user.email} not eligible for wallets:`, {
        kycStatus: user.kycStatus,
        hasStrigaId: !!user.strigaUserId
      })
      return result
    }

    // Define required currencies based on role
    const requiredCurrencies = ['BTC', 'ETH', 'BNB', 'USDT']
    if (user.role === 'SELLER') {
      requiredCurrencies.push('EUR') // Sellers also need EUR wallet
    }

    // Check and create missing wallets
    const existingCurrencies = user.wallets.map(w => w.currency)
    const missingCurrencies = requiredCurrencies.filter(c => !existingCurrencies.includes(c))

    console.log(`User ${user.email} missing wallets for: ${missingCurrencies.join(', ') || 'none'}`)

    for (const currency of missingCurrencies) {
      try {
        // Call Striga API to create wallet
        const walletData = await createWallet(user.strigaUserId, currency)
        
        // Save to database (webhook will update later with full details)
        await prisma.wallet.create({
          data: {
            userId: user.id,
            strigaWalletId: walletData.walletId || `pending-${currency}-${Date.now()}`,
            currency: currency,
            address: walletData.address || null,
            balance: 0
          }
        })

        result.created.push(currency)
        console.log(`✅ Created ${currency} wallet for ${user.email}`)

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        result.failed.push(currency)
        result.errors.push({ currency, error: errorMsg })
        console.error(`❌ Failed to create ${currency} wallet for ${user.email}:`, errorMsg)
      }
    }

    // Create digital IBAN for sellers if missing
    if (user.role === 'SELLER' && user.digitalIbans.length === 0) {
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

        console.log(`✅ Created digital IBAN for seller ${user.email}`)
      } catch (error) {
        console.error(`❌ Failed to create IBAN for ${user.email}:`, error)
      }
    }

    result.success = result.created.length > 0 || missingCurrencies.length === 0

    // Log the final state
    const finalWalletCount = await prisma.wallet.count({
      where: { userId: user.id }
    })
    console.log(`User ${user.email} now has ${finalWalletCount} wallets`)

  } catch (error) {
    console.error('Error ensuring user wallets:', error)
    result.errors.push({ 
      currency: 'general', 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  return result
}

/**
 * Checks all KYC-approved users and creates missing wallets
 */
export async function checkAndCreateMissingWallets() {
  console.log('🔍 Checking for users with missing wallets...')
  
  try {
    // Find all KYC-approved users
    const kycApprovedUsers = await prisma.user.findMany({
      where: {
        kycStatus: 'PASSED',
        strigaUserId: { not: null }
      },
      include: {
        wallets: true
      }
    })

    console.log(`Found ${kycApprovedUsers.length} KYC-approved users`)

    let usersFixed = 0
    let walletsCreated = 0

    for (const user of kycApprovedUsers) {
      // Define expected wallet count
      const expectedCount = user.role === 'SELLER' ? 5 : 4 // Sellers need EUR wallet too
      
      if (user.wallets.length < expectedCount) {
        console.log(`\n📝 User ${user.email} has ${user.wallets.length}/${expectedCount} wallets`)
        
        const result = await ensureUserWallets(user.id)
        
        if (result.created.length > 0) {
          usersFixed++
          walletsCreated += result.created.length
          console.log(`✅ Created ${result.created.length} wallets for ${user.email}`)
        }
        
        // Small delay between users
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    console.log(`\n✅ Wallet check completed!`)
    console.log(`- Users fixed: ${usersFixed}`)
    console.log(`- Wallets created: ${walletsCreated}`)

  } catch (error) {
    console.error('Error checking wallets:', error)
  }
}

/**
 * Creates a notification for the user about wallet creation
 */
export async function notifyWalletCreation(userId: string, walletsCreated: string[]) {
  try {
    await prisma.notification.create({
      data: {
        userId: userId,
        title: 'Wallets Created Successfully',
        message: `Your ${walletsCreated.join(', ')} wallets have been created and are ready to use.`,
        type: 'WALLET_CREATED'
      }
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
  }
}