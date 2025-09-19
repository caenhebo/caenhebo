const fetch = require('node-fetch');

async function testCreateSellerIban() {
  const BASE_URL = 'http://localhost:3019';
  console.log('Testing Seller IBAN Creation...\n');

  try {
    // Step 1: Get CSRF token
    console.log('1. Getting CSRF token...');
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    const { csrfToken } = await csrfRes.json();
    const cookies = csrfRes.headers.raw()['set-cookie'];
    console.log('✓ CSRF token obtained\n');

    // Step 2: Login as seller
    console.log('2. Logging in as seller@test.com...');
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
    
    if (loginRes.status !== 302) {
      console.error('Login failed:', loginRes.status);
      return;
    }
    
    const sessionCookies = loginRes.headers.raw()['set-cookie'];
    console.log('✓ Logged in successfully\n');

    // Step 3: Create IBAN
    console.log('3. Creating IBAN for seller...');
    const createRes = await fetch(`${BASE_URL}/api/iban/create`, {
      method: 'POST',
      headers: {
        'Cookie': sessionCookies.join('; ')
      }
    });
    
    if (createRes.ok) {
      const ibanData = await createRes.json();
      console.log('✓ IBAN Created Successfully!');
      console.log('IBAN:', ibanData.iban);
      console.log('Bank:', ibanData.bankName);
      console.log('Account Number:', ibanData.accountNumber);
      
      // Step 4: Verify by fetching again
      console.log('\n4. Verifying IBAN is saved...');
      const verifyRes = await fetch(`${BASE_URL}/api/user/iban`, {
        headers: {
          'Cookie': sessionCookies.join('; ')
        }
      });
      
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        if (verifyData.iban) {
          console.log('✓ IBAN verified in database!');
          console.log('IBAN:', verifyData.iban);
        } else {
          console.log('⚠ IBAN not found after creation');
        }
      }
    } else {
      console.error('IBAN creation failed:', createRes.status);
      const error = await createRes.text();
      console.error('Error:', error);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testCreateSellerIban();
