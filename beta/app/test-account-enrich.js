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
      }
    }

    console.log(`\n🔹 ${method} https://${reqOptions.hostname}${reqOptions.path}`)
    console.log(`🔹 Body:`, JSON.parse(body))

    const req = https.request(reqOptions, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        console.log(`\n📥 Status: ${res.statusCode}`)
        try {
          const jsonData = JSON.parse(data)
          console.log(JSON.stringify(jsonData, null, 2))
          resolve(jsonData)
        } catch (e) {
          console.log('Response:', data)
          reject(new Error('Invalid JSON: ' + data.substring(0, 200)))
        }
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function enrichAccount() {
  console.log('🧪 Testing Account Enrich API - Striga Sandbox\n')

  const testUserId = '8d356d73-0905-40c1-900d-59f7a75d55b5' // buyer@test.com
  const btcAccountId = '3225bfd1ec6384ddee90e80d01665235' // BTC wallet ID

  console.log(`📍 User: buyer@test.com`)
  console.log(`📍 Striga User ID: ${testUserId}`)
  console.log(`📍 BTC Account ID: ${btcAccountId}`)

  try {
    console.log(`\n1️⃣ Enriching BTC account with blockchain deposit address...`)

    const response = await strigaApiRequest('/wallets/account/enrich', {
      method: 'POST',
      body: JSON.stringify({
        userId: testUserId,
        accountId: btcAccountId
      })
    })

    console.log('\n✅ Account enriched successfully!')

    // Check for blockchain address in response
    if (response.blockchainDepositAddress) {
      console.log(`\n🎉 BTC DEPOSIT ADDRESS: ${response.blockchainDepositAddress}`)
    } else if (response.blockchainNetworks && response.blockchainNetworks.length > 0) {
      console.log(`\n🎉 Blockchain Networks:`)
      response.blockchainNetworks.forEach(network => {
        console.log(`   - ${network.name}: ${network.blockchainDepositAddress}`)
      })
    } else {
      console.log('\n⚠️  No blockchain address in response. Full response above.')
    }

  } catch (error) {
    console.log('\n❌ Enrichment failed')
    console.log('Error:', error.message)
  }
}

enrichAccount()