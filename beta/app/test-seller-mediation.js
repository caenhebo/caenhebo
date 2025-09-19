const fetch = require('node-fetch');

async function testSellerMediationSigning() {
  const BASE_URL = 'http://localhost:3019';
  
  try {
    // Get CSRF token
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    const { csrfToken } = await csrfRes.json();
    const cookies = csrfRes.headers.raw()['set-cookie'];

    // Login as seller
    const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; ')
      },
      body: JSON.stringify({
        email: 'seller@test.com',
        password: 'C@rlos2025',
        csrfToken: csrfToken,
        json: true
      }),
      redirect: 'manual'
    });
    
    const sessionCookies = loginRes.headers.raw()['set-cookie'];
    console.log('✓ Logged in as seller@test.com');

    // Test signing mediation agreement as seller
    console.log('\nSigning mediation agreement as SELLER...');
    const signRes = await fetch(`${BASE_URL}/api/transactions/cmfqt4sef0001h2r1ph4j43vn/sign-mediation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookies.join('; ')
      },
      body: JSON.stringify({
        role: 'seller'
      })
    });

    if (signRes.ok) {
      const data = await signRes.json();
      console.log('✅ SELLER SUCCESSFULLY SIGNED MEDIATION!');
      console.log('Response:', JSON.stringify(data, null, 2));
      
      if (data.bothSigned) {
        console.log('\n🎉 BOTH PARTIES HAVE NOW SIGNED THE MEDIATION AGREEMENT!');
      }
    } else {
      const error = await signRes.text();
      console.log('❌ SELLER SIGNING FAILED:', signRes.status);
      console.log('Error:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSellerMediationSigning();
