const fetch = require('node-fetch')

async function testBuyerInterests() {
  // First, authenticate
  const loginResponse = await fetch('http://localhost:3018/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      email: 'buyer@test.com',
      password: 'C@rlos2025',
      json: 'true',
      redirect: 'false'
    }),
    redirect: 'manual'
  })

  console.log('Login response status:', loginResponse.status)
  
  // Get cookies from response
  const cookies = loginResponse.headers.raw()['set-cookie']
  if (!cookies) {
    console.error('No cookies received from login')
    return
  }

  const sessionCookie = cookies
    .map(cookie => cookie.split(';')[0])
    .join('; ')

  console.log('Session cookie obtained')

  // Now test the interests endpoint
  const interestsResponse = await fetch('http://localhost:3018/api/buyer/interests', {
    headers: {
      'Cookie': sessionCookie
    }
  })

  console.log('Interests endpoint status:', interestsResponse.status)
  
  if (interestsResponse.ok) {
    const data = await interestsResponse.json()
    console.log('Interests data:', JSON.stringify(data, null, 2))
  } else {
    const error = await interestsResponse.text()
    console.error('Error response:', error)
  }
}

testBuyerInterests().catch(console.error)