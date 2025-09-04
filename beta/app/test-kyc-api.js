const fetch = require('node-fetch');

async function testKycStatus() {
  console.log('Testing KYC Status API for buyer@test.com');
  console.log('=========================================\n');
  
  try {
    // First, login as buyer@test.com
    console.log('1. Logging in as buyer@test.com...');
    const loginResponse = await fetch('http://localhost:3018/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'buyer@test.com',
        password: 'C@rlos2025'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginResponse.ok) {
      console.log('\nTrying with alternate password...');
      const altLoginResponse = await fetch('http://localhost:3018/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'buyer@test.com',
          password: 'password123'
        })
      });
      
      const altLoginData = await altLoginResponse.json();
      console.log('Alternate login response:', altLoginData);
      
      if (!altLoginResponse.ok) {
        console.error('❌ Login failed');
        return;
      }
    }
    
    // Extract session cookie
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('\n2. Session cookies:', cookies ? 'Received' : 'Not received');
    
    // Test KYC status endpoint
    console.log('\n3. Testing KYC status endpoint...');
    const statusResponse = await fetch('http://localhost:3018/api/kyc/status', {
      headers: {
        'Cookie': cookies || ''
      }
    });
    
    const statusData = await statusResponse.json();
    console.log('Status response:', JSON.stringify(statusData, null, 2));
    
    if (statusResponse.ok) {
      console.log('\n✅ KYC Status API is working!');
      console.log('Current stage:', statusData.stage);
      console.log('KYC Status:', statusData.kycStatus);
      console.log('Email Verified:', statusData.emailVerified);
      console.log('Phone Verified:', statusData.phoneVerified);
      console.log('Striga User ID:', statusData.strigaUserId);
    } else {
      console.error('\n❌ KYC Status API failed:', statusData);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

testKycStatus();