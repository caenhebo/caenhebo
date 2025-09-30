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

async function test() {
  const testUserId = '8d356d73-0905-40c1-900d-59f7a75d55b5' // buyer@test.com CORRECT ID

  console.log('🧪 Fetching ALL wallets for buyer@test.com')
  console.log(`User ID: ${testUserId}\n`)

  try {
    const endDate = Date.now()
    const startDate = endDate - (365 * 24 * 60 * 60 * 1000)

    const response = await strigaApiRequest('/wallets/get/all', {
      method: 'POST',
      body: JSON.stringify({
        userId: testUserId,
        startDate: startDate,
        endDate: endDate,
        page: 1
      })
    })

    console.log('\n\n✅ Wallet data retrieved!')
    console.log('Number of wallets:', response.wallets?.length || 0)

    if (response.wallets && response.wallets.length > 0) {
      console.log('\n📊 Looking for BTC wallet details:')
      const btcWallet = response.wallets.find(w =>
        w.accounts && w.accounts.BTC
      )

      if (btcWallet) {
        console.log('\n💰 BTC Wallet Found:')
        console.log(JSON.stringify(btcWallet, null, 2))

        if (btcWallet.accounts.BTC.address) {
          console.log('\n✅ BTC ADDRESS EXISTS:', btcWallet.accounts.BTC.address)
        } else {
          console.log('\n❌ NO BTC ADDRESS in wallet data')
          console.log('Available fields:', Object.keys(btcWallet.accounts.BTC))
        }
      }
    }

  } catch (error) {
    console.log('\n❌ FAILED:', error.message)
  }
}

test()