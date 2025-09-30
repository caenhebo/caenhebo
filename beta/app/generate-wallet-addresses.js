const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')
const https = require('https')

const prisma = new PrismaClient()

const STRIGA_API_KEY = process.env.STRIGA_API_KEY
const STRIGA_SECRET = process.env.STRIGA_SECRET
const STRIGA_BASE_URL = 'https://backend.striga.com'

function strigaApiRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const body = options.body || '{}'
    const signature = crypto.createHmac('sha256', STRIGA_SECRET).update(body).digest('hex')
    
    const reqOptions = {
      hostname: 'backend.striga.com',
      path: endpoint,
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': STRIGA_API_KEY,
        'signature': signature,
        'Content-Length': Buffer.byteLength(body)
      }
    }

    const req = https.request(reqOptions, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(new Error('Invalid JSON response'))
        }
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function generateAddresses() {
  console.log('🔍 Finding wallets without addresses...\n')
  
  const walletsWithoutAddress = await prisma.wallet.findMany({
    where: {
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

  console.log(`Found ${walletsWithoutAddress.length} wallets without addresses\n`)

  for (const wallet of walletsWithoutAddress) {
    try {
      console.log(`📍 Generating ${wallet.currency} address for ${wallet.user.email}...`)
      
      const response = await strigaApiRequest('/wallets/enrich/address/initiate', {
        method: 'POST',
        body: JSON.stringify({
          userId: wallet.user.strigaUserId,
          accountId: wallet.strigaWalletId
        })
      })

      if (response.address) {
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: { address: response.address }
        })
        console.log(`   ✅ Generated: ${response.address}\n`)
      } else {
        console.log(`   ⚠️  Response:`, JSON.stringify(response, null, 2), '\n')
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`)
    }
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('✅ Done!')
  await prisma.$disconnect()
}

generateAddresses().catch(console.error)
