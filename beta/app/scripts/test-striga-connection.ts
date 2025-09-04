import * as dotenv from 'dotenv'
import * as path from 'path'
import * as crypto from 'crypto'

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Simple test to verify Striga connection works
async function testStrigaConnection() {
  console.log('🔧 Testing Striga API Connection...\n')
  
  // Check environment variables
  const apiKey = process.env.STRIGA_API_KEY
  const apiSecret = process.env.STRIGA_API_SECRET
  const baseUrl = process.env.STRIGA_BASE_URL || 'https://www.sandbox.striga.com/api/v1'
  
  console.log('Environment Variables:')
  console.log('- API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING')
  console.log('- API Secret:', apiSecret ? `${apiSecret.substring(0, 10)}...` : 'MISSING')
  console.log('- Base URL:', baseUrl)
  
  if (!apiKey || !apiSecret) {
    console.error('\n❌ Missing required environment variables!')
    return
  }
  
  try {
    // Test with the ping endpoint first
    const endpoint = '/ping'
    const method = 'GET'
    const timestamp = Date.now().toString()
    const body = '{}'
    
    // Create HMAC signature
    const hmac = crypto.createHmac('sha256', apiSecret)
    hmac.update(timestamp)
    hmac.update(method)
    hmac.update(endpoint)
    
    // Create MD5 hash of body
    const contentHash = crypto.createHash('md5')
    contentHash.update(body)
    hmac.update(contentHash.digest('hex'))
    
    const signature = hmac.digest('hex')
    const authHeader = `HMAC ${timestamp}:${signature}`
    
    console.log('\n📡 Testing /ping endpoint...')
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: method,
      headers: {
        'authorization': authHeader,
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Response Status:', response.status)
    const responseText = await response.text()
    console.log('Response:', responseText)
    
    if (response.ok) {
      console.log('\n✅ Striga API connection successful!')
      
      // Now try to get users
      console.log('\n📋 Attempting to list users...')
      const usersEndpoint = '/users'
      const usersMethod = 'GET'
      const usersTimestamp = Date.now().toString()
      
      const usersHmac = crypto.createHmac('sha256', apiSecret)
      usersHmac.update(usersTimestamp)
      usersHmac.update(usersMethod)
      usersHmac.update(usersEndpoint)
      
      const usersContentHash = crypto.createHash('md5')
      usersContentHash.update('{}')
      usersHmac.update(usersContentHash.digest('hex'))
      
      const usersSignature = usersHmac.digest('hex')
      const usersAuthHeader = `HMAC ${usersTimestamp}:${usersSignature}`
      
      const usersResponse = await fetch(`${baseUrl}${usersEndpoint}`, {
        method: usersMethod,
        headers: {
          'authorization': usersAuthHeader,
          'api-key': apiKey,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Users Response Status:', usersResponse.status)
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        console.log('Total users found:', usersData.total || 0)
        
        if (usersData.data && usersData.data.length > 0) {
          console.log('\nFirst few users:')
          usersData.data.slice(0, 3).forEach((user: any) => {
            console.log(`- ${user.email} (${user.userId})`)
          })
        }
      } else {
        const errorText = await usersResponse.text()
        console.error('Failed to get users:', errorText)
      }
      
    } else {
      console.error('\n❌ Striga API connection failed!')
      console.error('Error:', responseText)
    }
    
  } catch (error) {
    console.error('\n❌ Connection error:', error)
  }
}

testStrigaConnection().catch(console.error)