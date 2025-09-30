const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')
const prisma = new PrismaClient()

const STRIGA_API_KEY = process.env.STRIGA_API_KEY
const STRIGA_SECRET = process.env.STRIGA_API_SECRET
const STRIGA_BASE_URL = process.env.STRIGA_API_URL || 'https://www.sandbox.striga.com/api/v1'

async function strigaApiRequest(endpoint, options = {}) {
  const timestamp = Date.now().toString()
  const method = options.method || 'GET'
  const body = options.body || '{}'

  const hmac = crypto.createHmac('sha256', STRIGA_SECRET)
  hmac.update(timestamp)
  hmac.update(method)
  hmac.update(endpoint)

  const contentHash = crypto.createHash('md5')
  contentHash.update(body)
  hmac.update(contentHash.digest('hex'))

  const signature = hmac.digest('hex')
  const authHeader = `HMAC ${timestamp}:${signature}`

  const response = await fetch(`${STRIGA_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'authorization': authHeader,
      'api-key': STRIGA_API_KEY,
      'Content-Type': 'application/json',
    }
  })

  if (!response.ok) {
    throw new Error(`Striga API error: ${response.status}`)
  }

  return response.json()
}

async function main() {
  console.log('🔄 Syncing wallets from Striga...\n')

  const users = await prisma.user.findMany({
    where: {
      kycStatus: 'PASSED',
      strigaUserId: { not: null }
    }
  })

  console.log(`Found ${users.length} users\n`)

  for (const user of users) {
    console.log(`📝 ${user.email}`)

    try {
      const endDate = Date.now()
      const startDate = endDate - (365 * 24 * 60 * 60 * 1000)

      const data = await strigaApiRequest('/wallets/get/all', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.strigaUserId,
          startDate: startDate,
          endDate: endDate,
          page: 1
        })
      })

      if (data.wallets && data.wallets.length > 0) {
        console.log(`   Found ${data.wallets.length} wallets in Striga`)

        for (const wallet of data.wallets) {
          // Each wallet has accounts object with currencies
          if (wallet.accounts) {
            const currencies = Object.keys(wallet.accounts)
            console.log(`   Processing ${currencies.length} currency accounts`)

            for (const currency of currencies) {
              const account = wallet.accounts[currency]

              const existing = await prisma.wallet.findFirst({
                where: {
                  userId: user.id,
                  currency: currency
                }
              })

              if (!existing) {
                await prisma.wallet.create({
                  data: {
                    userId: user.id,
                    strigaWalletId: account.accountId,
                    currency: currency,
                    address: account.blockchainDepositAddress || null,
                    balance: parseFloat(account.availableBalance?.amount || '0')
                  }
                })
                console.log(`   ✅ Created ${currency} wallet`)
              } else {
                console.log(`   ⏭️  ${currency} already exists`)
              }
            }
          }
        }
      } else {
        console.log(`   ⚠️  No wallets found in Striga`)
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`)
    }

    await new Promise(resolve => setTimeout(resolve, 300))
  }

  const total = await prisma.wallet.count()
  console.log(`\n✅ Sync complete! Total wallets in DB: ${total}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())