const fetch = require('node-fetch');

async function testMediationSigning() {
  const BASE_URL = 'http://localhost:3019';
  
  try {
    // Get CSRF token
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    const { csrfToken } = await csrfRes.json();
    const cookies = csrfRes.headers.raw()['set-cookie'];

    // Login as buyer
    const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; ')
      },
      body: JSON.stringify({
        email: 'buyer@test.com',
        password: 'C@rlos2025',
        csrfToken: csrfToken,
        json: true
      }),
      redirect: 'manual'
    });
    
    const sessionCookies = loginRes.headers.raw()['set-cookie'];
    console.log('✓ Logged in as buyer@test.com');

    // Test signing mediation agreement
    console.log('\nTesting mediation agreement signing...');
    const signRes = await fetch(`${BASE_URL}/api/transactions/cmfqt4sef0001h2r1ph4j43vn/sign-mediation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookies.join('; ')
      },
      body: JSON.stringify({
        role: 'buyer'
      })
    });

    if (signRes.ok) {
      const data = await signRes.json();
      console.log('✅ MEDIATION SIGNING WORKS!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const error = await signRes.text();
      console.log('❌ SIGNING FAILED:', signRes.status);
      console.log('Error:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMediationSigning();
