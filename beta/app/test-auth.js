const fetch = require('node-fetch');

async function testAuth() {
  const BASE_URL = 'http://localhost:3018';
  
  // First, get CSRF token
  console.log('1. Getting CSRF token...');
  const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfResponse.json();
  console.log('CSRF Token:', csrfData.csrfToken);
  
  // Get cookies
  const cookies = csrfResponse.headers.raw()['set-cookie'];
  const cookieString = cookies ? cookies.join('; ') : '';
  
  // Now try to login
  console.log('\n2. Attempting login...');
  const loginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieString
    },
    body: new URLSearchParams({
      email: 'f@pachoman.com',
      password: 'C@rlos2025',
      csrfToken: csrfData.csrfToken,
      callbackUrl: `${BASE_URL}/admin`,
      json: 'true'
    }),
    redirect: 'manual'
  });
  
  console.log('Login Status:', loginResponse.status);
  
  const loginBody = await loginResponse.text();
  console.log('Login Response:', loginBody);
  
  // Check session
  const sessionCookies = loginResponse.headers.raw()['set-cookie'];
  if (sessionCookies) {
    console.log('\n3. Checking session...');
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: {
        'Cookie': sessionCookies.join('; ')
      }
    });
    
    const session = await sessionResponse.json();
    console.log('Session:', JSON.stringify(session, null, 2));
  }
}

testAuth().catch(console.error);
