const fetch = require('node-fetch');

async function testPropertyUpdate() {
  // First get CSRF and login as seller
  const csrfRes = await fetch('http://localhost:3019/api/auth/csrf');
  const { csrfToken } = await csrfRes.json();
  const cookies = csrfRes.headers.raw()['set-cookie'];
  
  // Login as seller
  const loginRes = await fetch('http://localhost:3019/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies.join('; ')
    },
    body: JSON.stringify({
      email: 'seller@test.com',
      password: 'C@rlos2025',
      csrfToken: csrfToken,
      json: true
    }),
    redirect: 'manual'
  });
  
  const sessionCookies = loginRes.headers.raw()['set-cookie'] || cookies;
  console.log('Login status:', loginRes.status === 302 ? '✅ Logged in as seller' : '❌ Login failed');
  
  // Get seller's properties
  const propsRes = await fetch('http://localhost:3019/api/properties', {
    headers: { 'Cookie': sessionCookies.join('; ') }
  });
  const propsData = await propsRes.json();
  
  if (!propsData.properties || propsData.properties.length === 0) {
    console.log('No properties found for seller');
    return;
  }
  
  const property = propsData.properties[0];
  console.log('\nTesting update for property:', property.id);
  console.log('Current bedrooms:', property.bedrooms);
  console.log('Current bathrooms:', property.bathrooms);
  
  // Update property
  const updateRes = await fetch(`http://localhost:3019/api/properties/${property.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookies.join('; ')
    },
    body: JSON.stringify({
      bedrooms: 5,
      bathrooms: 3,
      description: 'Updated description - now with more rooms!'
    })
  });
  
  if (updateRes.ok) {
    const updated = await updateRes.json();
    console.log('\n✅ Property updated successfully!');
    console.log('New bedrooms:', updated.property.bedrooms);
    console.log('New bathrooms:', updated.property.bathrooms);
    console.log('New description:', updated.property.description);
  } else {
    const error = await updateRes.text();
    console.log('❌ Update failed:', error);
  }
}

testPropertyUpdate().catch(console.error);
