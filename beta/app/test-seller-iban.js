const fetch = require('node-fetch');

async function testSellerIban() {
  const BASE_URL = 'http://localhost:3019';
  console.log('Testing Seller IBAN Display...\n');

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

    // Step 3: Check dashboard data to verify KYC status
    console.log('3. Checking seller dashboard data...');
    const dashboardRes = await fetch(`${BASE_URL}/api/seller/dashboard-data`, {
      headers: {
        'Cookie': sessionCookies.join('; ')
      }
    });
    
    const dashboardData = await dashboardRes.json();
    console.log('KYC Status:', dashboardData.kycStatus);
    console.log('Has Wallets:', dashboardData.hasWallets, '\n');

    // Step 4: Check IBAN endpoint
    console.log('4. Fetching IBAN data...');
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
        console.log('Account details retrieved successfully!');
      } else {
        console.log('⚠ No IBAN found for seller');
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

testSellerIban();
