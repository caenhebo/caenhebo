#!/usr/bin/env node

const { spawn } = require('child_process');

async function testWalletEndpoints() {
  console.log('🔍 Testing Caenhebo Wallet Display Issues...\n');

  // Test 1: Check if the wallets API is working
  console.log('1. Testing /api/wallets endpoint...');
  try {
    const response = await fetch('http://localhost:3004/api/wallets', {
      headers: {
        'Cookie': 'next-auth.session-token=test-session' // We need to simulate auth
      }
    });
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Wallets API responding');
      console.log('   Primary wallet:', data.primaryWallet?.currency || 'none');
      console.log('   All wallets count:', data.wallets?.length || 0);
    } else {
      const error = await response.text();
      console.log('   ❌ Wallets API error:', error);
    }
  } catch (error) {
    console.log('   ❌ Network error:', error.message);
  }

  // Test 2: Check the enrich endpoint
  console.log('\n2. Testing /api/wallets/enrich endpoint...');
  try {
    const response = await fetch('http://localhost:3004/api/wallets/enrich', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-session'
      },
      body: JSON.stringify({
        accountId: 'mock-eur-account-test'
      })
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Enrich API responding');
      console.log('   Banking details:', data.bankingDetails ? 'present' : 'missing');
    } else {
      const error = await response.text();
      console.log('   ❌ Enrich API error:', error);
    }
  } catch (error) {
    console.log('   ❌ Network error:', error.message);
  }

  // Test 3: Check the app structure
  console.log('\n3. Checking app structure...');
  console.log('   App running on: http://localhost:3004');
  console.log('   Expected endpoints:');
  console.log('     - GET  /api/wallets (get user wallets)');
  console.log('     - POST /api/wallets/enrich (get banking details)');
  
  console.log('\n📋 Issues to fix:');
  console.log('   1. Banking details not showing when "Show banking details" clicked');
  console.log('   2. No "Show wallet address" button for crypto wallets');
  console.log('   3. Wallet addresses may not be displaying properly');
  
  console.log('\n🔧 Next steps:');
  console.log('   1. Fix the enrich API endpoint authentication');
  console.log('   2. Add "Show wallet address" toggle for crypto wallets');
  console.log('   3. Ensure proper accountId is passed to enrich API');
}

testWalletEndpoints().catch(console.error);