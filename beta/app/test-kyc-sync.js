const crypto = require('crypto');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

// Striga configuration
const STRIGA_BASE_URL = process.env.STRIGA_BASE_URL || 'https://www.sandbox.striga.com/api/v1';
const STRIGA_API_KEY = process.env.STRIGA_API_KEY;
const STRIGA_API_SECRET = process.env.STRIGA_API_SECRET || process.env.STRIGA_SECRET;

// buyer@test.com's Striga User ID
const BUYER_STRIGA_ID = '8d356d73-0905-40c1-900d-59f7a75d55b5';

async function makeStrigaRequest(endpoint, method = 'GET', body = null) {
  const timestamp = Date.now().toString();
  const bodyStr = body ? JSON.stringify(body) : '{}';
  
  // Create HMAC signature
  const hmac = crypto.createHmac('sha256', STRIGA_API_SECRET);
  hmac.update(timestamp);
  hmac.update(method);
  hmac.update(endpoint); // Without /api/v1 prefix
  
  // Create MD5 hash of body
  const contentHash = crypto.createHash('md5');
  contentHash.update(bodyStr);
  hmac.update(contentHash.digest('hex'));
  
  const signature = hmac.digest('hex');
  const authHeader = `HMAC ${timestamp}:${signature}`;
  
  const url = `${STRIGA_BASE_URL}${endpoint}`;
  console.log(`\nMaking request to: ${url}`);
  
  const response = await fetch(url, {
    method,
    headers: {
      'authorization': authHeader,
      'api-key': STRIGA_API_KEY,
      'Content-Type': 'application/json'
    },
    body: method !== 'GET' ? bodyStr : undefined
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

async function testKycSync() {
  console.log('Testing KYC Sync for buyer@test.com');
  console.log('=====================================\n');
  
  console.log('Environment:');
  console.log('API Key:', STRIGA_API_KEY ? '✓ Set' : '✗ Missing');
  console.log('API Secret:', STRIGA_API_SECRET ? '✓ Set' : '✗ Missing');
  console.log('Base URL:', STRIGA_BASE_URL);
  
  if (!STRIGA_API_KEY || !STRIGA_API_SECRET) {
    console.error('\n❌ Missing Striga credentials. Please check .env.local');
    return;
  }
  
  try {
    // Test 1: Get user by ID
    console.log('\n📋 Test 1: Fetching user by ID');
    const userResult = await makeStrigaRequest(`/user/${BUYER_STRIGA_ID}`, 'GET');
    console.log('Status:', userResult.status);
    console.log('Response:', JSON.stringify(userResult.data, null, 2));
    
    if (userResult.data.KYC) {
      console.log('\n✅ KYC Information:');
      console.log('- Status:', userResult.data.KYC.status);
      console.log('- Email Verified:', userResult.data.KYC.emailVerified);
      console.log('- Mobile Verified:', userResult.data.KYC.mobileVerified);
    }
    
    // Test 2: Try to get user by email (to verify endpoint exists)
    console.log('\n📋 Test 2: Fetching user by email');
    const emailResult = await makeStrigaRequest('/user/get-by-email', 'POST', {
      email: 'buyer@test.com'
    });
    console.log('Status:', emailResult.status);
    console.log('Response:', JSON.stringify(emailResult.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

testKycSync();