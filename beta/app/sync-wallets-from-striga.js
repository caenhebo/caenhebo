const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Import Striga functions
const { strigaApiRequest } = require('./src/lib/striga.ts')

async function syncWalletsFromStriga() {
  console.log('🔄 Starting wallet sync from Striga...\n')

  try {
    // Get all users with Striga ID and KYC PASSED
    const users = await prisma.user.findMany({
      where: {
        kycStatus: 'PASSED',
        strigaUserId: { not: null }
      },
      include: {
        wallets: true,
        digitalIbans: true
      }
    })

    console.log(`Found ${users.length} users with KYC PASSED and Striga ID\n`)

    for (const user of users) {
      console.log(`\n📝 Processing ${user.email} (${user.strigaUserId})`)
      console.log(`   Current wallets in DB: ${user.wallets.length}`)

      try {
        // Fetch wallets from Striga
        const strigaWallets = await strigaApiRequest(`/wallets/get/${user.strigaUserId}`, {
          method: 'GET'
        })

        console.log(`   Wallets in Striga: ${strigaWallets.wallets?.length || 0}`)

        if (strigaWallets.wallets && strigaWallets.wallets.length > 0) {
          let created = 0
          let updated = 0

          for (const strigaWallet of strigaWallets.wallets) {
            const currency = strigaWallet.currency
            const walletId = strigaWallet.id
            const address = strigaWallet.blockchainDepositAddress || strigaWallet.address
            const balance = parseFloat(strigaWallet.availableBalance?.amount || '0')

            // Check if wallet exists in our DB
            const existingWallet = await prisma.wallet.findUnique({
              where: {
                userId_currency: {
                  userId: user.id,
                  currency: currency
                }
              }
            })

            if (existingWallet) {
              // Update existing wallet
              await prisma.wallet.update({
                where: { id: existingWallet.id },
                data: {
                  strigaWalletId: walletId,
                  address: address,
                  balance: balance,
                  lastSyncAt: new Date()
                }
              })
              updated++
              console.log(`   ✅ Updated ${currency} wallet`)
            } else {
              // Create new wallet
              await prisma.wallet.create({
                data: {
                  userId: user.id,
                  strigaWalletId: walletId,
                  currency: currency,
                  address: address,
                  balance: balance,
                  lastSyncAt: new Date()
                }
              })
              created++
              console.log(`   ✅ Created ${currency} wallet`)
            }
          }

          console.log(`   Summary: ${created} created, ${updated} updated`)
        }

        // Fetch IBANs from Striga for sellers
        if (user.role === 'SELLER') {
          try {
            const strigaIbans = await strigaApiRequest(`/iban/get/${user.strigaUserId}`, {
              method: 'GET'
            })

            if (strigaIbans.ibans && strigaIbans.ibans.length > 0) {
              for (const strigaIban of strigaIbans.ibans) {
                // Check if IBAN exists in our DB
                const existingIban = await prisma.digitalIban.findFirst({
                  where: {
                    userId: user.id,
                    iban: strigaIban.iban
                  }
                })

                if (!existingIban) {
                  await prisma.digitalIban.create({
                    data: {
                      userId: user.id,
                      iban: strigaIban.iban,
                      bankName: strigaIban.bankName || 'Striga',
                      accountNumber: strigaIban.accountNumber || strigaIban.iban,
                      active: strigaIban.status === 'ACTIVE'
                    }
                  })
                  console.log(`   ✅ Created Digital IBAN: ${strigaIban.iban}`)
                }
              }
            }
          } catch (ibanError) {
            console.log(`   ⚠️  No IBANs found or error fetching IBANs`)
          }
        }

      } catch (error) {
        console.error(`   ❌ Error fetching Striga data for ${user.email}:`, error.message)
      }

      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    console.log('\n\n✅ Wallet sync completed!')

    // Show final stats
    const totalWallets = await prisma.wallet.count()
    const totalIbans = await prisma.digitalIban.count()
    console.log(`\n📊 Database Stats:`)
    console.log(`   Total wallets: ${totalWallets}`)
    console.log(`   Total IBANs: ${totalIbans}`)

  } catch (error) {
    console.error('❌ Fatal error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

syncWalletsFromStriga()