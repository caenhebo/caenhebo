const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3018';

async function testLogin(email, password, role) {
  console.log(`\nTesting ${role} login: ${email}`);
  console.log('=' .repeat(50));
  
  try {
    // Test login
    const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: email,
        password: password,
        csrfToken: '', // Normally would get this from session
        callbackUrl: `${BASE_URL}/${role.toLowerCase()}/dashboard`,
        json: 'true',
      }),
      redirect: 'manual',
    });

    const cookies = response.headers.raw()['set-cookie'];
    const hasSessionCookie = cookies && cookies.some(c => c.includes('next-auth.session-token'));
    
    if (hasSessionCookie) {
      console.log(`✅ Login successful for ${email}`);
      
      // Extract session cookie
      const sessionCookie = cookies.find(c => c.includes('next-auth.session-token'));
      
      // Test accessing dashboard
      const dashboardResponse = await fetch(`${BASE_URL}/${role.toLowerCase()}/dashboard`, {
        headers: {
          'Cookie': sessionCookie,
        },
      });
      
      if (dashboardResponse.ok) {
        console.log(`✅ Dashboard accessible for ${role}`);
      } else {
        console.log(`❌ Dashboard not accessible: ${dashboardResponse.status}`);
      }
      
      // Test API endpoint
      const apiResponse = await fetch(`${BASE_URL}/api/auth/session`, {
        headers: {
          'Cookie': sessionCookie,
        },
      });
      
      if (apiResponse.ok) {
        const session = await apiResponse.json();
        console.log(`✅ Session API working:`, {
          userId: session.user?.id,
          email: session.user?.email,
          role: session.user?.role,
        });
      } else {
        console.log(`❌ Session API failed: ${apiResponse.status}`);
      }
      
    } else {
      const body = await response.text();
      console.log(`❌ Login failed for ${email}`);
      console.log('Response:', body.substring(0, 200));
    }
    
  } catch (error) {
    console.log(`❌ Error testing ${email}: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Beta Login Tests');
  console.log('=' .repeat(50));
  
  // Test all three users
  await testLogin('f@pachoman.com', 'C@rlos2025', 'ADMIN');
  await testLogin('seller@test.com', 'C@rlos2025', 'SELLER');
  await testLogin('buyer@test.com', 'C@rlos2025', 'BUYER');
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ All login tests completed');
  console.log('\nApplication is ready at http://95.179.170.56:3018');
  console.log('\nTest Users:');
  console.log('  Admin:  f@pachoman.com / C@rlos2025');
  console.log('  Seller: seller@test.com / C@rlos2025');
  console.log('  Buyer:  buyer@test.com / C@rlos2025');
}

runTests().catch(console.error);