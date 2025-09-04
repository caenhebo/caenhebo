const fetch = require('node-fetch');

async function testMainLogin() {
  const BASE_URL = 'http://localhost:3018';
  
  console.log('Testing main signin page...\n');
  
  // Get CSRF
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrf = await csrfRes.json();
  const cookies = csrfRes.headers.raw()['set-cookie'];
  
  // Login as admin
  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies.join('; ')
    },
    body: new URLSearchParams({
      email: 'f@pachoman.com',
      password: 'C@rlos2025',
      csrfToken: csrf.csrfToken,
      json: 'true'
    }),
    redirect: 'manual'
  });
  
  const loginCookies = loginRes.headers.raw()['set-cookie'];
  
  // Check session
  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { 'Cookie': loginCookies.join('; ') }
  });
  
  const session = await sessionRes.json();
  console.log('✅ Login successful!');
  console.log('User:', session.user.email);
  console.log('Role:', session.user.role);
  console.log('Should redirect to:', session.user.role === 'ADMIN' ? '/admin' : '/dashboard');
}

testMainLogin().catch(console.error);
