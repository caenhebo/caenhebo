const fetch = require('node-fetch');

async function testLogin() {
  try {
    // Step 1: Get CSRF token
    console.log('Getting CSRF token...');
    const csrfRes = await fetch('http://localhost:3019/api/auth/csrf');
    const csrfText = await csrfRes.text();

    if (!csrfRes.ok) {
      console.log('CSRF failed:', csrfRes.status, csrfText);
      return;
    }

    const csrfData = JSON.parse(csrfText);
    const cookies = csrfRes.headers.raw()['set-cookie'] || [];
    console.log('✅ Got CSRF token');

    // Step 2: Login
    console.log('Attempting login...');
    const loginRes = await fetch('http://localhost:3019/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; ')
      },
      body: JSON.stringify({
        email: 'f@pachoman.com',
        password: 'C@rlos2025',
        csrfToken: csrfData.csrfToken,
        json: true
      }),
      redirect: 'manual'
    });

    console.log('Login response status:', loginRes.status);

    if (loginRes.status === 302) {
      console.log('✅ Login successful!');
      const sessionCookies = loginRes.headers.raw()['set-cookie'] || [];

      // Test session
      const sessionRes = await fetch('http://localhost:3019/api/auth/session', {
        headers: { 'Cookie': sessionCookies.join('; ') }
      });

      const sessionData = await sessionRes.json();
      console.log('Session user:', sessionData.user?.email || 'No user');
    } else {
      const responseText = await loginRes.text();
      console.log('❌ Login failed:', responseText);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();