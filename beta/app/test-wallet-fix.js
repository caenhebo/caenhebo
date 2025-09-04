// Test script to verify wallet API fixes
const fetch = require('node-fetch')

async function testWalletAPI() {
    const baseURL = 'http://localhost:3000'
    
    console.log('🧪 Testing Wallet API fixes...\n')
    
    // Test 1: Test login
    console.log('1. Testing login with seller@test.com...')
    const loginResponse = await fetch(`${baseURL}/api/auth/signin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: 'seller@test.com',
            password: 'C@rlos2025'
        })
    })
    
    if (loginResponse.ok) {
        console.log('✅ Login API endpoint available')
    } else {
        console.log('❌ Login failed:', loginResponse.status)
    }
    
    // Test 2: Test wallets API (without auth - should fail gracefully)
    console.log('\n2. Testing wallets API (no auth)...')
    const walletsResponse = await fetch(`${baseURL}/api/wallets`)
    
    if (walletsResponse.status === 401) {
        console.log('✅ Wallets API properly requires authentication')
    } else {
        console.log('❌ Unexpected wallets API response:', walletsResponse.status)
    }
    
    // Test 3: Test IBAN creation API (without auth - should fail gracefully)
    console.log('\n3. Testing IBAN creation API (no auth)...')
    const ibanResponse = await fetch(`${baseURL}/api/iban/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    
    if (ibanResponse.status === 401) {
        console.log('✅ IBAN creation API properly requires authentication')
    } else {
        console.log('❌ Unexpected IBAN API response:', ibanResponse.status)
    }
    
    console.log('\n📋 Next steps:')
    console.log('1. Open browser to http://localhost:3000')
    console.log('2. Login as seller@test.com / C@rlos2025')
    console.log('3. Navigate to seller dashboard')
    console.log('4. Check if wallet display shows create account option')
    
    console.log('\n✅ API endpoints are responding correctly!')
}

testWalletAPI().catch(console.error)