const fetch = require('node-fetch');

async function testDashboardHTML() {
  const BASE_URL = 'http://localhost:3019';
  console.log('Fetching Seller Dashboard HTML...\n');

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
    
    // Fetch dashboard HTML
    const dashboardRes = await fetch(`${BASE_URL}/seller/dashboard`, {
      headers: {
        'Cookie': sessionCookies.join('; ')
      }
    });
    
    const html = await dashboardRes.text();
    
    // Check for the buttons in HTML
    const hasBankingButton = html.includes('View Banking Details');
    const hasPaymentButton = html.includes('View Payment Account');
    const hasWalletButton = html.includes('View Crypto Wallets');
    
    console.log('Button presence in HTML:');
    console.log('✓ View Banking Details:', hasBankingButton ? 'FOUND' : 'NOT FOUND');
    console.log('✓ View Payment Account:', hasPaymentButton ? 'FOUND' : 'NOT FOUND');
    console.log('✓ View Crypto Wallets:', hasWalletButton ? 'FOUND' : 'NOT FOUND');
    
    // Also check for the sections
    const hasBankingSection = html.includes('banking-section');
    const hasIbanSection = html.includes('iban-section');
    const hasWalletSection = html.includes('wallet-section');
    
    console.log('\nSection anchors in HTML:');
    console.log('✓ Banking section anchor:', hasBankingSection ? 'FOUND' : 'NOT FOUND');
    console.log('✓ IBAN section anchor:', hasIbanSection ? 'FOUND' : 'NOT FOUND');
    console.log('✓ Wallet section anchor:', hasWalletSection ? 'FOUND' : 'NOT FOUND');
    
    // Check if Financial Accounts card exists
    const hasFinancialCard = html.includes('Financial Accounts');
    console.log('\n✓ Financial Accounts card:', hasFinancialCard ? 'FOUND' : 'NOT FOUND');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testDashboardHTML();
