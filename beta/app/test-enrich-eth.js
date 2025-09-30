const crypto = require('crypto')
const https = require('https')
require('dotenv').config()

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
      timeout: 10000 // 10 second timeout
    }

    console.log(`🔹 ${method} https://${reqOptions.hostname}${reqOptions.path}`)

    const req = https.request(reqOptions, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        console.log(`📥 Status: ${res.statusCode}`)
        try {
          const jsonData = JSON.parse(data)
          console.log(JSON.stringify(jsonData, null, 2))
          resolve(jsonData)
        } catch (e) {
          console.log('Response (not JSON):', data.substring(0, 500))
          reject(new Error('Invalid JSON'))
        }
      })
    })

    req.on('error', (err) => {
      console.log('❌ Request error:', err.message)
      reject(err)
    })

    req.on('timeout', () => {
      req.destroy()
      console.log('❌ Request timeout after 10 seconds')
      reject(new Error('Request timeout'))
    })

    req.write(body)
    req.end()
  })
}

async function enrichETH() {
  console.log('🧪 Enriching ETH Wallet - Buyer\n')

  const buyerUserId = '8d356d73-0905-40c1-900d-59f7a75d55b5'
  const buyerEthWalletId = 'aa1a9703000b7c00a5a0dc8015d68fe4'

  console.log(`Buyer: ${buyerUserId}`)
  console.log(`ETH Wallet: ${buyerEthWalletId}\n`)

  try {
    const response = await strigaApiRequest('/wallets/account/enrich', {
      method: 'POST',
      body: JSON.stringify({
        userId: buyerUserId,
        accountId: buyerEthWalletId
      })
    })

    console.log('\n✅ Enrichment completed')

    if (response.blockchainDepositAddress) {
      console.log(`\n🎉 ETH Address: ${response.blockchainDepositAddress}`)
    } else if (response.blockchainNetworks && response.blockchainNetworks.length > 0) {
      console.log(`\n🎉 Blockchain Networks:`)
      response.blockchainNetworks.forEach(n => {
        console.log(`   ${n.name}: ${n.blockchainDepositAddress}`)
      })
    } else {
      console.log('\n⚠️  No address in response')
    }

  } catch (error) {
    console.log('\n❌ Enrichment failed:', error.message)
  }

  // Also try seller
  console.log('\n\n🧪 Enriching ETH Wallet - Seller\n')

  const sellerUserId = 'b3d32c24-4c4f-4db2-9873-04eb0987fa37'
  const sellerEthWalletId = 'bab9cd9f06c56c9f73040cbf1c18de5f'

  console.log(`Seller: ${sellerUserId}`)
  console.log(`ETH Wallet: ${sellerEthWalletId}\n`)

  try {
    const response = await strigaApiRequest('/wallets/account/enrich', {
      method: 'POST',
      body: JSON.stringify({
        userId: sellerUserId,
        accountId: sellerEthWalletId
      })
    })

    console.log('\n✅ Enrichment completed')

    if (response.blockchainDepositAddress) {
      console.log(`\n🎉 ETH Address: ${response.blockchainDepositAddress}`)
    } else if (response.blockchainNetworks && response.blockchainNetworks.length > 0) {
      console.log(`\n🎉 Blockchain Networks:`)
      response.blockchainNetworks.forEach(n => {
        console.log(`   ${n.name}: ${n.blockchainDepositAddress}`)
      })
    }

  } catch (error) {
    console.log('\n❌ Enrichment failed:', error.message)
  }
}

enrichETH()