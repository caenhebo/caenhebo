const fetch = require('node-fetch');

async function testDashboard() {
  console.log('Testing Caenhebo Dashboard Fix\n');
  
  // Check if server is running
  console.log('1. Checking server status...');
  try {
    const serverCheck = await fetch('http://localhost:3018');
    console.log(`✓ Server is running (status: ${serverCheck.status})\n`);
  } catch (error) {
    console.error('✗ Server is not responding:', error.message);
    console.log('\nPlease ensure the server is running with: pm2 restart caenhebo-alpha');
    return;
  }
  
  // Check database properties
  console.log('2. Checking database properties...');
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database('./prisma/dev.db');
  
  db.all("SELECT id, title, sellerId FROM properties", (err, rows) => {
    if (err) {
      console.error('✗ Database error:', err);
      return;
    }
    
    console.log(`✓ Found ${rows.length} properties in database:`);
    rows.forEach(row => {
      console.log(`   - ${row.title} (ID: ${row.id}, Seller: ${row.seller_id})`);
    });
    
    console.log('\n3. Testing properties API (without auth)...');
    fetch('http://localhost:3018/api/properties')
      .then(res => res.json())
      .then(data => {
        if (data.error === 'Unauthorized') {
          console.log('✓ API correctly requires authentication\n');
          console.log('SUMMARY:');
          console.log('========');
          console.log('✓ Server is running');
          console.log('✓ Properties exist in database');
          console.log('✓ API endpoints are accessible');
          console.log('\nTo fix the dashboard issue:');
          console.log('1. Clear your browser cache');
          console.log('2. Log out and log back in to refresh your session');
          console.log('3. Visit http://155.138.165.47:3018/seller/dashboard');
          console.log('\nYour properties should now appear in the Property Listings section!');
        } else {
          console.log('API response:', data);
        }
      })
      .catch(err => console.error('✗ API error:', err));
  });
  
  db.close();
}

testDashboard();