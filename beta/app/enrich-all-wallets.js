const crypto = require('crypto')
const https = require('https')
const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()
const STRIGA_API_KEY = process.env.STRIGA_API_KEY
const STRIGA_SECRET = process.env.STRIGA_API_SECRET || process.env.STRIGA_SECRET
const STRIGA_BASE_URL = (process.env.STRIGA_API_URL || process.env.STRIGA_BASE_URL || 'https://www.sandbox.striga.com/api/v1').replace(/^https?:\/\//, '').replace(/\/api\/v1$/, '')

function strigaApiRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const body = options.body || '{}'
    const timestamp = Date.now().toString()
    const method = options.method || 'POST'

    const hmac = crypto.createHmac('sha256', STRIGA_SECRET)
    hmac.update(timestamp)
    hmac.update(method)
    hmac.update(endpoint)

    const contentHash = crypto.createHash('md5')
    contentHash.update(body)
    hmac.update(contentHash.digest('hex'))

    const signature = hmac.digest('hex')
    const authHeader = `HMAC ${timestamp}:${signature}`

    const reqOptions = {
      hostname: STRIGA_BASE_URL,
      path: `/api/v1${endpoint}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'authorization': authHeader,
        'api-key': STRIGA_API_KEY,
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 10000
    }

    const req = https.request(reqOptions, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(new Error('Invalid JSON: ' + data.substring(0, 200)))
        }
      })
    })

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    req.write(body)
    req.end()
  })
}

async function enrichAllWallets() {
  console.log('🚀 Enriching ALL crypto wallets with blockchain addresses\n')

  const wallets = await prisma.wallet.findMany({
    where: {
      currency: { in: ['BTC', 'ETH', 'USDT', 'USDC'] },
      OR: [
        { address: null },
        { address: '' }
      ]
    },
    include: {
      user: {
        select: {
          email: true,
          strigaUserId: true
        }
      }
    }
  })

  console.log(`Found ${wallets.length} wallets without addresses\n`)

  for (const wallet of wallets) {
    console.log(`📍 ${wallet.currency} - ${wallet.user.email}`)

    try {
      const response = await strigaApiRequest('/wallets/account/enrich', {
        method: 'POST',
        body: JSON.stringify({
          userId: wallet.user.strigaUserId,
          accountId: wallet.strigaWalletId
        })
      })

      let address = null
      if (response.blockchainDepositAddress) {
        address = response.blockchainDepositAddress
      } else if (response.blockchainNetworks && response.blockchainNetworks.length > 0) {
        address = response.blockchainNetworks[0].blockchainDepositAddress
      }

      if (address) {
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: { address: address }
        })
        console.log(`   ✅ ${address}\n`)
      } else {
        console.log(`   ⚠️  No address in response\n`)
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error) {
      console.log(`   ❌ ${error.message}\n`)
    }
  }

  console.log('\n✅ Done! Showing all crypto wallets:\n')

  const allWallets = await prisma.wallet.findMany({
    where: {
      currency: { in: ['BTC', 'ETH', 'USDT', 'USDC'] }
    },
    include: {
      user: {
        select: { email: true }
      }
    },
    orderBy: [
      { user: { email: 'asc' } },
      { currency: 'asc' }
    ]
  })

  console.log('Currency | Email              | Address')
  console.log('---------|--------------------|-----------------------------------------')
  for (const w of allWallets) {
    const email = w.user.email.padEnd(18)
    const addr = w.address || '(empty)'
    console.log(`${w.currency.padEnd(8)} | ${email} | ${addr}`)
  }

  await prisma.$disconnect()
}

enrichAllWallets().catch(console.error)