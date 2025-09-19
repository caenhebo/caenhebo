const fetch = require('node-fetch');

async function testTransactionsAPI() {
  // First login
  const csrfRes = await fetch('http://localhost:3019/api/auth/csrf');
  const { csrfToken } = await csrfRes.json();
  const cookies = csrfRes.headers.raw()['set-cookie'];
  
  const loginRes = await fetch('http://localhost:3019/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies.join('; ')
    },
    body: JSON.stringify({
      email: 'f@pachoman.com',
      password: 'C@rlos2025',
      csrfToken: csrfToken,
      json: true
    }),
    redirect: 'manual'
  });
  
  const sessionCookies = loginRes.headers.raw()['set-cookie'];
  console.log('Login status:', loginRes.status === 302 ? '✅' : '❌');
  
  // Test transactions API
  const transRes = await fetch('http://localhost:3019/api/transactions', {
    headers: { 'Cookie': sessionCookies.join('; ') }
  });
  
  console.log('Transactions API status:', transRes.status);
  
  if (transRes.ok) {
    const data = await transRes.json();
    console.log('✅ API working! Found', data.transactions?.length || 0, 'transactions');
  } else {
    const error = await transRes.text();
    console.log('❌ API failed:', error);
  }
}

testTransactionsAPI().catch(console.error);
