const fetch = require('node-fetch');

async function testPropertyAPI() {
  console.log('Testing Property API...\n');
  
  // First, login to get a session
  console.log('1. Logging in...');
  const loginResponse = await fetch('http://localhost:3018/api/auth/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'seller@test.com',
      password: 'password123'
    })
  });
  
  const cookies = loginResponse.headers.raw()['set-cookie'];
  const sessionCookie = cookies?.find(c => c.includes('next-auth.session-token'));
  
  if (!sessionCookie) {
    console.error('Failed to get session cookie');
    return;
  }
  
  console.log('✓ Login successful\n');
  
  // Test the property API
  console.log('2. Testing property API...');
  const propertyId = 'cmes83mpl0000h2uhlkdr0aij';
  
  try {
    const response = await fetch(`http://localhost:3018/api/properties/${propertyId}`, {
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    console.log(`Response status: ${response.status}`);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✓ Property API is working correctly!');
      console.log(`Property title: ${data.property?.title}`);
    } else {
      console.log('\n✗ Property API returned an error');
    }
  } catch (error) {
    console.error('Error calling property API:', error);
  }
}

testPropertyAPI().catch(console.error);