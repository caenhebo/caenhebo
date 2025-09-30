const crypto = require('crypto')
const https = require('https')
require('dotenv').config()

const STRIGA_API_KEY = process.env.STRIGA_API_KEY
const STRIGA_SECRET = process.env.STRIGA_API_SECRET || process.env.STRIGA_SECRET
const STRIGA_BASE_URL = (process.env.STRIGA_API_URL || process.env.STRIGA_BASE_URL || 'https://www.sandbox.striga.com/api/v1').replace(/^https?:\/\//, '').replace(/\/api\/v1$/, '')

function strigaApiRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const body = options.body || '{}'

    // Create HMAC signature
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

    console.log(`\n🔹 Making request to: https://${reqOptions.hostname}${reqOptions.path}`)
    console.log(`🔹 Method: ${method}`)
    console.log(`🔹 Body:`, JSON.parse(body))

    const req = https.request(reqOptions, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        console.log(`\n📥 Response Status: ${res.statusCode}`)
        console.log(`📥 Response Body:`, data)
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(new Error('Invalid JSON response: ' + data))
        }
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function testAddressGeneration() {
  console.log('🧪 Testing Striga Blockchain Address Generation\n')
  console.log(`📍 API Base URL: https://${STRIGA_BASE_URL}/api/v1`)
  console.log(`📍 Has API Key: ${!!STRIGA_API_KEY}`)
  console.log(`📍 Has Secret: ${!!STRIGA_SECRET}`)

  // Use test user data
  const testUserId = 'a48f23ee-16b8-465b-86fd-ec7a3b24f9b8' // buyer@test.com Striga ID
  const testAccountId = '3225bfd1ec6384ddee90e80d01665235' // buyer's BTC wallet

  console.log(`\n👤 Test User ID: ${testUserId}`)
  console.log(`💼 Test Wallet ID: ${testAccountId}`)

  try {
    console.log(`\n1️⃣ Testing /wallets/enrich/address/initiate endpoint...`)
    const response = await strigaApiRequest('/wallets/enrich/address/initiate', {
      method: 'POST',
      body: JSON.stringify({
        userId: testUserId,
        accountId: testAccountId
      })
    })

    console.log('\n✅ SUCCESS!')
    console.log('Generated Address:', response.address)
    console.log('Full Response:', JSON.stringify(response, null, 2))

  } catch (error) {
    console.log('\n❌ FAILED')
    console.log('Error:', error.message)

    // Try alternative endpoint
    console.log(`\n2️⃣ Trying alternative endpoint /account/enrich...`)
    try {
      const response2 = await strigaApiRequest('/account/enrich', {
        method: 'POST',
        body: JSON.stringify({
          accountId: testAccountId
        })
      })

      console.log('\n✅ Alternative endpoint SUCCESS!')
      console.log('Full Response:', JSON.stringify(response2, null, 2))
    } catch (error2) {
      console.log('\n❌ Alternative endpoint also FAILED')
      console.log('Error:', error2.message)

      // Try getting wallet details
      console.log(`\n3️⃣ Trying to get wallet details with /wallets/get...`)
      try {
        const response3 = await strigaApiRequest('/wallets/get', {
          method: 'POST',
          body: JSON.stringify({
            userId: testUserId,
            accountId: testAccountId
          })
        })

        console.log('\n✅ Wallet details retrieved!')
        console.log('Wallet Data:', JSON.stringify(response3, null, 2))

        if (response3.linkedBankAccount) {
          console.log('\n💡 This wallet has linkedBankAccount (EUR/IBAN wallet)')
          console.log('   Blockchain addresses are only for crypto wallets (BTC, ETH, etc.)')
        }

      } catch (error3) {
        console.log('\n❌ Could not get wallet details')
        console.log('Error:', error3.message)
      }
    }
  }
}

testAddressGeneration().catch(console.error)