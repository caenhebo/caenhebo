const fetch = require('node-fetch');

async function testAdminSession() {
  try {
    // Get CSRF token
    const csrfRes = await fetch('http://localhost:3019/api/auth/csrf');
    const { csrfToken } = await csrfRes.json();
    const cookies = csrfRes.headers.raw()['set-cookie'];

    // Login as admin
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
    console.log('Login status:', loginRes.status === 302 ? '✅ Logged in' : '❌ Failed');

    // Check session
    const sessionRes = await fetch('http://localhost:3019/api/auth/session', {
      headers: { 'Cookie': sessionCookies.join('; ') }
    });

    const session = await sessionRes.json();
    console.log('\n📋 SESSION DATA:');
    console.log('User ID:', session.user?.id);
    console.log('Email:', session.user?.email);
    console.log('Name:', session.user?.name);
    console.log('Role:', session.user?.role);

    // Try to access the transaction
    const transRes = await fetch('http://localhost:3019/api/transactions/cmfccc4by0001h2tkygk4j2mh', {
      headers: { 'Cookie': sessionCookies.join('; ') }
    });

    console.log('\nTransaction access status:', transRes.status);

    if (transRes.ok) {
      const data = await transRes.json();
      console.log('✅ Can access transaction!');
      console.log('Transaction ID:', data.transaction?.id);
      console.log('Property:', data.transaction?.property?.title);
    } else {
      const error = await transRes.json();
      console.log('❌ Cannot access:', error.error);

      // Debug - let's see what the API is checking
      console.log('\n🔍 DEBUG INFO:');
      console.log('Session user role from API:', session.user?.role);
      console.log('Expected: ADMIN');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAdminSession();