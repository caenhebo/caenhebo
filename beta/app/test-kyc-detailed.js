const fetch = require('node-fetch');

async function testKycStatus() {
  console.log('Testing KYC Status - Detailed Debug');
  console.log('====================================\n');
  
  try {
    // 1. Get CSRF token
    const csrfRes = await fetch('http://localhost:3018/api/auth/csrf');
    const { csrfToken } = await csrfRes.json();
    
    // 2. Login as buyer@test.com
    console.log('Logging in as buyer@test.com...');
    const loginData = new URLSearchParams({
      email: 'buyer@test.com',
      password: 'C@rlos2025',
      csrfToken: csrfToken,
      json: 'true'
    });
    
    const loginRes = await fetch('http://localhost:3018/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: loginData.toString(),
      redirect: 'manual'
    });
    
    // Get session cookie
    const cookies = loginRes.headers.raw()['set-cookie'];
    const sessionCookie = cookies ? cookies.join('; ') : '';
    
    console.log('Login status:', loginRes.status);
    console.log('Has session cookie:', !!sessionCookie);
    
    // 3. Check session
    const sessionRes = await fetch('http://localhost:3018/api/auth/session', {
      headers: { 'Cookie': sessionCookie }
    });
    const session = await sessionRes.json();
    console.log('\nSession data:', JSON.stringify(session, null, 2));
    
    // 4. Get KYC status
    console.log('\nFetching KYC status...');
    const kycRes = await fetch('http://localhost:3018/api/kyc/status', {
      headers: { 'Cookie': sessionCookie }
    });
    
    const kycData = await kycRes.json();
    console.log('\nKYC Status Response:', JSON.stringify(kycData, null, 2));
    
    // Analyze the response
    console.log('\n--- Analysis ---');
    console.log('Stage:', kycData.stage);
    console.log('Email Verified:', kycData.emailVerified);
    console.log('Phone Verified:', kycData.phoneVerified);
    console.log('Phone Verified Type:', typeof kycData.phoneVerified);
    
    if (kycData.stage === 'mobile_verification' && kycData.phoneVerified === true) {
      console.log('\n⚠️  ISSUE DETECTED: Phone is verified but stage is still mobile_verification!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testKycStatus();