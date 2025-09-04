const fetch = require('node-fetch')

async function testNextAuthLogin() {
  console.log('Testing NextAuth login flow...')
  
  // First get CSRF token
  const csrfResponse = await fetch('http://localhost:3018/api/auth/csrf')
  const csrfData = await csrfResponse.json()
  console.log('CSRF Token obtained:', csrfData.csrfToken)
  
  const cookies = csrfResponse.headers.raw()['set-cookie']
  const cookieString = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : ''
  
  // Now login using NextAuth credentials
  const loginResponse = await fetch('http://localhost:3018/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieString
    },
    body: new URLSearchParams({
      email: 'buyer@test.com',
      password: 'C@rlos2025',
      csrfToken: csrfData.csrfToken,
      json: 'true'
    }),
    redirect: 'manual'
  })
  
  console.log('Login status:', loginResponse.status)
  console.log('Login headers:', loginResponse.headers.raw())
  
  // Get new cookies including session
  const loginCookies = loginResponse.headers.raw()['set-cookie']
  if (loginCookies) {
    const sessionCookie = loginCookies.map(c => c.split(';')[0]).join('; ')
    console.log('Session cookies obtained')
    
    // Test session endpoint
    const sessionResponse = await fetch('http://localhost:3018/api/auth/session', {
      headers: { 'Cookie': sessionCookie }
    })
    
    const sessionData = await sessionResponse.json()
    console.log('Session data:', JSON.stringify(sessionData, null, 2))
    
    // Test interests endpoint
    const interestsResponse = await fetch('http://localhost:3018/api/buyer/interests', {
      headers: { 'Cookie': sessionCookie }
    })
    
    console.log('Interests endpoint status:', interestsResponse.status)
    
    if (interestsResponse.ok) {
      const data = await interestsResponse.json()
      console.log('Interests data:', JSON.stringify(data, null, 2))
    } else {
      const errorText = await interestsResponse.text()
      console.log('Error:', errorText)
    }
  } else {
    console.log('No session cookies received')
    const bodyText = await loginResponse.text()
    console.log('Response body:', bodyText)
  }
}

testNextAuthLogin().catch(console.error)