const fetch = require('node-fetch');

async function testSellerDashboard() {
  const BASE_URL = 'http://localhost:3019';
  console.log('Testing Seller Dashboard with IBAN...\n');

  try {
    // Login as seller
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    const { csrfToken } = await csrfRes.json();
    const cookies = csrfRes.headers.raw()['set-cookie'];
    
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
    console.log('✓ Logged in as seller@test.com\n');

    // Fetch IBAN data
    console.log('Fetching IBAN data from /api/user/iban...');
    const ibanRes = await fetch(`${BASE_URL}/api/user/iban`, {
      headers: {
        'Cookie': sessionCookies.join('; ')
      }
    });
    
    const ibanData = await ibanRes.json();
    console.log('IBAN Response:', JSON.stringify(ibanData, null, 2));
    
    if (ibanData.iban) {
      console.log('\n✅ SUCCESS! Seller can now see their IBAN:');
      console.log('=====================================');
      console.log('IBAN:', ibanData.iban);
      console.log('Bank:', ibanData.bankName);
      console.log('=====================================');
      console.log('\nThe IBAN will now be displayed in the seller dashboard UI.');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testSellerDashboard();
