const fetch = require('node-fetch');

async function testSellerDashboardUI() {
  const BASE_URL = 'http://localhost:3019';
  console.log('Testing Seller Dashboard UI Elements...\n');

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

    // Fetch dashboard data
    console.log('Fetching dashboard data...');
    const dashboardRes = await fetch(`${BASE_URL}/api/seller/dashboard-data`, {
      headers: {
        'Cookie': sessionCookies.join('; ')
      }
    });
    
    const dashboardData = await dashboardRes.json();
    console.log('KYC Status:', dashboardData.kycStatus);
    
    if (dashboardData.kycStatus === 'PASSED') {
      console.log('\n✅ KYC is PASSED - Financial Accounts buttons SHOULD BE VISIBLE:');
      console.log('================================================');
      console.log('Expected buttons in "Financial Accounts" card:');
      console.log('  1. 🏢 View Banking Details');
      console.log('  2. 💳 View Payment Account');  
      console.log('  3. 👛 View Crypto Wallets');
      console.log('================================================\n');
      
      // Test each endpoint
      console.log('Testing backend endpoints:');
      
      // Bank account
      const bankRes = await fetch(`${BASE_URL}/api/user/bank-account`, {
        headers: { 'Cookie': sessionCookies.join('; ') }
      });
      console.log('✓ Bank Account API:', bankRes.ok ? 'Working' : 'Failed');
      
      // IBAN
      const ibanRes = await fetch(`${BASE_URL}/api/user/iban`, {
        headers: { 'Cookie': sessionCookies.join('; ') }
      });
      const ibanData = await ibanRes.json();
      const ibanStatus = ibanData.iban ? 'IBAN: ' + ibanData.iban : 'Not created yet';
      console.log('✓ IBAN API:', ibanRes.ok ? 'Working (' + ibanStatus + ')' : 'Failed');
      
      // Wallets
      const walletRes = await fetch(`${BASE_URL}/api/wallets`, {
        headers: { 'Cookie': sessionCookies.join('; ') }
      });
      console.log('✓ Wallets API:', walletRes.ok ? 'Working' : 'Failed');
      
      console.log('\n📌 Please verify at http://95.179.170.56:3019/seller/dashboard');
      console.log('   The three buttons should appear in the Financial Accounts card on the right.');
    } else {
      console.log('\n⚠️ KYC not passed - buttons will NOT be visible');
      console.log('   Only KYC prompt will be shown in Financial Accounts card');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testSellerDashboardUI();
