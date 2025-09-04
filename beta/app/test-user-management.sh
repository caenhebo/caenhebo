#!/bin/bash

echo "🧪 Testing User Management API"
echo "=============================="

# Create a simple Node.js script to test with authentication
cat > test-api.js << 'EOF'
const fetch = require('node-fetch');

async function testUserManagement() {
  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginRes = await fetch('http://localhost:3018/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'f@pachoman.com',
        password: 'C@rlos2025',
        redirect: false
      })
    });
    
    const cookies = loginRes.headers.raw()['set-cookie'];
    const sessionCookie = cookies.find(c => c.includes('next-auth.session-token'));
    
    if (!sessionCookie) {
      console.error('Failed to login');
      return;
    }
    
    console.log('✅ Login successful');
    
    // Step 2: Fetch users
    console.log('\n2. Fetching users...');
    const usersRes = await fetch('http://localhost:3018/api/admin/users', {
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    if (!usersRes.ok) {
      console.error(`Failed to fetch users: ${usersRes.status}`);
      console.error(await usersRes.text());
      return;
    }
    
    const data = await usersRes.json();
    console.log('✅ Users fetched successfully');
    console.log(`Total users: ${data.users.length}`);
    
    // Display users
    console.log('\nUser List:');
    console.log('==========');
    data.users.forEach(user => {
      console.log(`\n${user.email} (${user.role})`);
      console.log(`  Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log(`  KYC: ${user.kycStatus}`);
      if (user._count) {
        if (user._count.sellerProperties > 0) {
          console.log(`  Properties: ${user._count.sellerProperties}`);
        }
        const totalTx = (user._count.buyerTransactions || 0) + (user._count.sellerTransactions || 0);
        if (totalTx > 0) {
          console.log(`  Transactions: ${totalTx}`);
        }
        if (user._count.wallets > 0) {
          console.log(`  Wallets: ${user._count.wallets}`);
        }
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testUserManagement();
EOF

# Install node-fetch if needed
npm list node-fetch >/dev/null 2>&1 || npm install node-fetch@2 --no-save >/dev/null 2>&1

# Run the test
node test-api.js

# Cleanup
rm test-api.js

echo -e "\n=============================="
echo "Test Complete!"