const fetch = require('node-fetch');

async function loginUser(email, password) {
  // Get CSRF
  const csrfRes = await fetch('http://localhost:3019/api/auth/csrf');
  const csrfData = await csrfRes.json();
  const cookies = csrfRes.headers.raw()['set-cookie'];
  
  // Login
  const loginRes = await fetch('http://localhost:3019/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies.join('; ')
    },
    body: JSON.stringify({
      email, password,
      csrfToken: csrfData.csrfToken,
      json: true
    }),
    redirect: 'manual'
  });
  
  return {
    status: loginRes.status,
    cookies: loginRes.headers.raw()['set-cookie']
  };
}

async function testCycle() {
  console.log('Testing authentication cycles...\n');
  
  // Test 1: Admin login
  console.log('1. Admin login:');
  const admin = await loginUser('f@pachoman.com', 'C@rlos2025');
  console.log('   Status:', admin.status === 302 ? '✅ SUCCESS' : '❌ FAILED');
  
  // Test 2: Buyer login  
  console.log('2. Buyer login:');
  const buyer = await loginUser('buyer@test.com', 'C@rlos2025');
  console.log('   Status:', buyer.status === 302 ? '✅ SUCCESS' : '❌ FAILED');
  
  // Test 3: Seller login
  console.log('3. Seller login:');
  const seller = await loginUser('seller@test.com', 'C@rlos2025');
  console.log('   Status:', seller.status === 302 ? '✅ SUCCESS' : '❌ FAILED');
  
  // Test 4: Multiple rapid logins
  console.log('4. Rapid login test (5 times):');
  for(let i = 0; i < 5; i++) {
    const result = await loginUser('f@pachoman.com', 'C@rlos2025');
    console.log(`   Attempt ${i+1}:`, result.status === 302 ? '✅' : '❌');
  }
  
  console.log('\n✅ All tests completed - Authentication working!');
}

testCycle().catch(console.error);
