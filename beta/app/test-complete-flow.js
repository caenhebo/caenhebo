// Using built-in fetch in Node.js 18+

async function testCompleteFlow() {
  console.log('🧪 Testing complete authentication and wallet flow...');
  
  const baseURL = 'http://localhost:3004';
  
  try {
    // 1. Test signin endpoint
    console.log('1. 🔐 Testing signin...');
    const signinResponse = await fetch(`${baseURL}/api/auth/signin/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'seller@test.com',
        password: 'C@rlos2025'
      })
    });
    
    console.log(`Signin response: ${signinResponse.status} ${signinResponse.statusText}`);
    
    if (signinResponse.ok) {
      const signinData = await signinResponse.text();
      console.log('✅ Signin successful');
    } else {
      console.log('❌ Signin failed');
    }
    
    // 2. Check if app is accessible
    console.log('\n2. 🌐 Testing app accessibility...');
    const appResponse = await fetch(`${baseURL}/seller/dashboard`);
    console.log(`Dashboard response: ${appResponse.status} ${appResponse.statusText}`);
    
    if (appResponse.status === 200) {
      console.log('✅ App is accessible');
    } else {
      console.log(`❌ App returned ${appResponse.status}`);
    }
    
    // 3. Test unauthorized API call (expected to fail)
    console.log('\n3. 🚫 Testing unauthorized API call...');
    const unauthorizedResponse = await fetch(`${baseURL}/api/wallets`);
    const unauthorizedData = await unauthorizedResponse.text();
    
    console.log(`Unauthorized API response: ${unauthorizedResponse.status}`);
    console.log(`Response: ${unauthorizedData}`);
    
    if (unauthorizedResponse.status === 401) {
      console.log('✅ Unauthorized request properly rejected');
    } else {
      console.log('❌ Unexpected response for unauthorized request');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteFlow().catch(console.error);