#!/usr/bin/env node

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3019';

async function testStage3() {
  console.log('Testing Stage 3 API after fixes...\n');

  // First, login as buyer
  console.log('1. Logging in as buyer@test.com...');
  const loginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      email: 'buyer@test.com',
      password: 'password123',
      csrfToken: 'test',
      json: 'true'
    })
  });

  if (!loginResponse.ok) {
    console.error('Login failed:', loginResponse.status);
    return;
  }

  const cookies = loginResponse.headers.get('set-cookie');
  console.log('Login successful, got cookies\n');

  // Extract session cookie
  const sessionCookie = cookies ? cookies.split(';')[0] : '';

  // Test Stage 3 endpoint
  console.log('2. Testing Stage 3 endpoint...');
  const stage3Response = await fetch(`${BASE_URL}/api/transactions/cmfc9mufr0003h2yziizuctcf/stage3`, {
    headers: {
      'Cookie': sessionCookie
    }
  });

  console.log('Stage 3 Response Status:', stage3Response.status);
  
  if (stage3Response.ok) {
    const data = await stage3Response.json();
    console.log('\nStage 3 Data received:');
    console.log('- Success:', data.success);
    if (data.status) {
      console.log('- Has Representation Doc:', data.status.hasRepresentationDoc);
      console.log('- Has Mediation Agreement:', data.status.hasMediationAgreement);
      console.log('- Buyer Confirmed:', data.status.buyerConfirmed);
      console.log('- Seller Confirmed:', data.status.sellerConfirmed);
      console.log('- Mediation Signed:', data.status.mediationSigned);
      console.log('- Stage 3 Complete:', data.status.stage3Complete);
    }
    console.log('- Documents count:', data.documents ? data.documents.length : 0);
  } else {
    const error = await stage3Response.text();
    console.error('Stage 3 request failed:', error);
  }
}

testStage3().catch(console.error);