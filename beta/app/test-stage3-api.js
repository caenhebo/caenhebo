const BASE_URL = 'http://95.179.170.56:3019';

async function testStage3() {
  // Login as seller
  const loginResp = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'seller@test.com',
      password: 'C@rlos2025'
    })
  });
  
  console.log('Login response:', loginResp.status);
  
  // Get Stage 3 status
  const stage3Resp = await fetch(`${BASE_URL}/api/transactions/cmfc9mufr0003h2yziizuctcf/stage3`);
  
  const data = await stage3Resp.json();
  console.log('\nStage 3 API Response:');
  console.log(JSON.stringify(data, null, 2));
}

testStage3().catch(console.error);