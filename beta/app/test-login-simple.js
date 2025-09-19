const test = async () => {
  // Test admin login
  const res = await fetch('http://localhost:3019/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'f@pachoman.com',
      password: 'C@rlos2025',
      redirect: false
    })
  });
  
  const data = await res.json();
  console.log('Admin login test:', res.status === 200 ? '✅ SUCCESS' : '❌ FAILED');
  if (res.status !== 200) console.log('Response:', data);
  
  process.exit(res.status === 200 ? 0 : 1);
};

test().catch(console.error);
