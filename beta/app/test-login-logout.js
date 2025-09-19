const test = async () => {
  console.log('Testing login-logout cycle...\n');
  
  // Get CSRF token
  const csrfRes = await fetch('http://localhost:3019/api/auth/csrf');
  const { csrfToken } = await csrfRes.json();
  
  // Test 1: Admin login
  console.log('1. Admin login test...');
  const loginRes = await fetch('http://localhost:3019/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfRes.headers.get('set-cookie')
    },
    body: new URLSearchParams({
      email: 'f@pachoman.com',
      password: 'C@rlos2025',
      csrfToken: csrfToken
    })
  });
  console.log('   Status:', loginRes.status === 302 ? '✅ SUCCESS' : '❌ FAILED');
  
  // Test 2: Check session
  console.log('2. Check session...');
  const sessionRes = await fetch('http://localhost:3019/api/auth/session', {
    headers: { 'Cookie': loginRes.headers.get('set-cookie') }
  });
  const session = await sessionRes.json();
  console.log('   User:', session.user ? `✅ ${session.user.email}` : '❌ No session');
  
  // Test 3: Logout
  console.log('3. Logout test...');
  const logoutRes = await fetch('http://localhost:3019/api/auth/signout', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': loginRes.headers.get('set-cookie')
    },
    body: new URLSearchParams({ csrfToken })
  });
  console.log('   Status:', logoutRes.status === 200 || logoutRes.status === 302 ? '✅ SUCCESS' : '❌ FAILED');
  
  // Test 4: Try login again as buyer
  console.log('4. Buyer login after logout...');
  const buyerRes = await fetch('http://localhost:3019/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      email: 'buyer@example.com',
      password: 'C@rlos2025',
      csrfToken: csrfToken
    })
  });
  console.log('   Status:', buyerRes.status === 302 ? '✅ SUCCESS' : '❌ FAILED');
  
  console.log('\n✅ All tests completed');
};

test().catch(console.error);
