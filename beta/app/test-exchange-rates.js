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
      timeout: 10000
    }

    console.log(`\n🔹 ${method} https://${reqOptions.hostname}${reqOptions.path}`)
    if (body !== '{}') {
      console.log(`🔹 Body:`, JSON.parse(body))
    }

    const req = https.request(reqOptions, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        console.log(`\n📥 Status: ${res.statusCode}`)
        try {
          const jsonData = JSON.parse(data)
          resolve(jsonData)
        } catch (e) {
          console.log('Response:', data.substring(0, 500))
          reject(new Error('Invalid JSON'))
        }
      })
    })

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Timeout'))
    })

    req.write(body)
    req.end()
  })
}

async function testExchangeRates() {
  console.log('🧪 Testing Striga Exchange Rates API\n')

  try {
    // Try without body
    console.log('1️⃣ Trying GET /trade/rates with no body...')
    const rates1 = await strigaApiRequest('/trade/rates', { method: 'GET' })
    console.log(JSON.stringify(rates1, null, 2))

  } catch (error) {
    console.log('❌', error.message)
  }

  try {
    // Try POST with empty body
    console.log('\n2️⃣ Trying POST /trade/rates with empty body...')
    const rates2 = await strigaApiRequest('/trade/rates', { method: 'POST' })
    console.log(JSON.stringify(rates2, null, 2))

  } catch (error) {
    console.log('❌', error.message)
  }

  try {
    // Try with specific pair
    console.log('\n3️⃣ Trying POST /trade/rates with specific pairs...')
    const rates3 = await strigaApiRequest('/trade/rates', {
      method: 'POST',
      body: JSON.stringify({
        sourceCurrency: 'BTC',
        targetCurrency: 'EUR'
      })
    })
    console.log(JSON.stringify(rates3, null, 2))

  } catch (error) {
    console.log('❌', error.message)
  }

  // Calculate example
  const eurAmount = 500 // €500
  console.log(`\n\n💡 Example: Convert €${eurAmount} to BTC/ETH/USDC`)
}

testExchangeRates()