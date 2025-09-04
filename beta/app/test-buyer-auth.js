const fetch = require('node-fetch')

async function testWithProperAuth() {
  // Login and get session
  console.log('1. Logging in as buyer@test.com...')
  const loginResponse = await fetch('http://localhost:3018/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      email: 'buyer@test.com',
      password: 'C@rlos2025',
      json: 'true'
    })
  })

  const loginData = await loginResponse.json()
  console.log('Login response:', loginData)
  
  // Get session cookie
  const cookies = loginResponse.headers.raw()['set-cookie']
  if (!cookies) {
    console.error('No cookies received')
    return
  }

  const sessionCookie = cookies
    .map(cookie => cookie.split(';')[0])
    .join('; ')

  // Test session endpoint first
  console.log('\n2. Testing session endpoint...')
  const sessionResponse = await fetch('http://localhost:3018/api/auth/session', {
    headers: {
      'Cookie': sessionCookie
    }
  })
  
  const sessionData = await sessionResponse.json()
  console.log('Session data:', JSON.stringify(sessionData, null, 2))

  // Now test interests endpoint
  console.log('\n3. Testing interests endpoint...')
  const interestsResponse = await fetch('http://localhost:3018/api/buyer/interests', {
    headers: {
      'Cookie': sessionCookie,
      'Content-Type': 'application/json'
    }
  })

  console.log('Interests status:', interestsResponse.status)
  console.log('Response headers:', interestsResponse.headers.raw())
  
  const responseText = await interestsResponse.text()
  console.log('Response body:', responseText)
  
  try {
    const data = JSON.parse(responseText)
    console.log('Parsed data:', JSON.stringify(data, null, 2))
  } catch (e) {
    console.log('Could not parse as JSON')
  }
}

testWithProperAuth().catch(console.error)