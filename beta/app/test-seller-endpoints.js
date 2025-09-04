const fetch = require('node-fetch')

async function testSellerEndpoints() {
  // First, authenticate as seller
  console.log('1. Authenticating as seller...')
  const csrfResponse = await fetch('http://localhost:3018/api/auth/csrf')
  const csrfData = await csrfResponse.json()
  
  const cookies = csrfResponse.headers.raw()['set-cookie']
  const cookieString = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : ''
  
  const loginResponse = await fetch('http://localhost:3018/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieString
    },
    body: new URLSearchParams({
      email: 'seller@test.com',
      password: 'C@rlos2025',
      csrfToken: csrfData.csrfToken,
      json: 'true'
    }),
    redirect: 'manual'
  })
  
  const loginCookies = loginResponse.headers.raw()['set-cookie']
  if (!loginCookies) {
    console.error('No session cookies received')
    return
  }
  const sessionCookie = loginCookies.map(c => c.split(';')[0]).join('; ')
  console.log('Authenticated successfully')
  
  // Test transactions endpoint
  console.log('\n2. Testing transactions endpoint...')
  const transactionsResponse = await fetch('http://localhost:3018/api/transactions?propertyId=cmes83mpl0000h2uhlkdr0aij', {
    headers: { 'Cookie': sessionCookie }
  })
  
  console.log('Transactions status:', transactionsResponse.status)
  if (transactionsResponse.ok) {
    const data = await transactionsResponse.json()
    console.log('Transactions data:', JSON.stringify(data, null, 2))
  } else {
    const error = await transactionsResponse.text()
    console.log('Transactions error:', error)
  }
  
  // Test upload endpoint
  console.log('\n3. Testing documents upload endpoint...')
  const uploadResponse = await fetch('http://localhost:3018/api/properties/cmes83mpl0000h2uhlkdr0aij/documents/upload', {
    headers: { 'Cookie': sessionCookie }
  })
  
  console.log('Upload endpoint status:', uploadResponse.status)
  if (uploadResponse.ok) {
    const data = await uploadResponse.json()
    console.log('Upload data:', JSON.stringify(data, null, 2))
  } else {
    const error = await uploadResponse.text()
    console.log('Upload error:', error)
  }
}

testSellerEndpoints().catch(console.error)