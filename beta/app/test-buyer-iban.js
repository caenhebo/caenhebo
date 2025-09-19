const fetch = require('node-fetch');

async function testBuyerIban() {
  const BASE_URL = 'http://localhost:3019';
  console.log('Testing Buyer IBAN Display...\n');

  try {
    // Step 1: Get CSRF token
    console.log('1. Getting CSRF token...');
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    const { csrfToken } = await csrfRes.json();
    const cookies = csrfRes.headers.raw()['set-cookie'];
    console.log('✓ CSRF token obtained\n');

    // Step 2: Login as buyer
    console.log('2. Logging in as buyer@test.com...');
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
    
    if (loginRes.status !== 302) {
      console.error('Login failed:', loginRes.status);
      return;
    }
    
    const sessionCookies = loginRes.headers.raw()['set-cookie'];
    console.log('✓ Logged in successfully\n');

    // Step 3: Check IBAN endpoint
    console.log('3. Fetching IBAN data...');
    const ibanRes = await fetch(`${BASE_URL}/api/user/iban`, {
      headers: {
        'Cookie': sessionCookies.join('; ')
      }
    });
    
    if (ibanRes.ok) {
      const ibanData = await ibanRes.json();
      if (ibanData.iban) {
        console.log('✓ IBAN Found!');
        console.log('IBAN:', ibanData.iban);
        console.log('BIC:', ibanData.bic);
        console.log('Account Holder:', ibanData.accountHolderName);
        console.log('Bank:', ibanData.bankName);
      } else {
        console.log('⚠ No IBAN found for buyer');
        console.log('Response:', JSON.stringify(ibanData, null, 2));
      }
    } else {
      console.error('IBAN fetch failed:', ibanRes.status);
      const error = await ibanRes.text();
      console.error('Error:', error);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testBuyerIban();
