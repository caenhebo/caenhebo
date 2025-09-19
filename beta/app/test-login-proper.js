async function testLogin() {
  const fetch = require('node-fetch');
  
  // Step 1: Get CSRF token
  const csrfRes = await fetch('http://localhost:3019/api/auth/csrf');
  const csrfData = await csrfRes.json();
  const cookies = csrfRes.headers.raw()['set-cookie'];
  
  console.log('CSRF Token:', csrfData.csrfToken);
  
  // Step 2: Login with proper CSRF
  const loginRes = await fetch('http://localhost:3019/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies ? cookies.join('; ') : ''
    },
    body: JSON.stringify({
      email: 'f@pachoman.com',
      password: 'C@rlos2025',
      csrfToken: csrfData.csrfToken,
      json: true
    }),
    redirect: 'manual'
  });
  
  console.log('Login Status:', loginRes.status);
  console.log('Login Headers:', loginRes.headers.raw());
  
  // Step 3: Check session
  const sessionCookies = loginRes.headers.raw()['set-cookie'];
  const sessionRes = await fetch('http://localhost:3019/api/auth/session', {
    headers: {
      'Cookie': sessionCookies ? sessionCookies.join('; ') : cookies.join('; ')
    }
  });
  
  const session = await sessionRes.json();
  console.log('Session:', session);
}

testLogin().catch(console.error);
