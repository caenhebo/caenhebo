const fetch = require('node-fetch');

async function testAnotherSeller() {
  const BASE_URL = 'http://localhost:3019';
  console.log('Testing IBAN functionality with another seller (s@s.com)...\n');

  try {
    // Login as another seller
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
        email: 's@s.com',
        password: 'C@rlos2025',
        csrfToken: csrfToken,
        json: true
      }),
      redirect: 'manual'
    });
    
    if (loginRes.status !== 302) {
      console.error('Login failed for s@s.com');
      return;
    }
    
    const sessionCookies = loginRes.headers.raw()['set-cookie'];
    console.log('✓ Logged in as s@s.com\n');

    // Check current IBAN status
    console.log('Checking IBAN status...');
    const ibanRes = await fetch(`${BASE_URL}/api/user/iban`, {
      headers: {
        'Cookie': sessionCookies.join('; ')
      }
    });
    
    const ibanData = await ibanRes.json();
    
    if (!ibanData.iban) {
      console.log('No IBAN found. UI will show "Create EUR Payment Account" button.\n');
      console.log('Creating IBAN...');
      
      const createRes = await fetch(`${BASE_URL}/api/iban/create`, {
        method: 'POST',
        headers: {
          'Cookie': sessionCookies.join('; ')
        }
      });
      
      if (createRes.ok) {
        const newIban = await createRes.json();
        console.log('\n✅ IBAN Created for s@s.com:');
        console.log('IBAN:', newIban.iban);
        console.log('Bank:', newIban.bankName);
      }
    } else {
      console.log('✅ IBAN already exists for s@s.com:');
      console.log('IBAN:', ibanData.iban);
      console.log('Bank:', ibanData.bankName);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAnotherSeller();
