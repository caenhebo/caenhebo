const bcrypt = require('bcryptjs');

const passwordList = [
  'C@rlos2025',
  'password123',
  'Password123',
  'test123',
  'admin123'
];

const hashFromDb = '$2b$10$oPbG2uOFBF0d3mchF5wEneHi9W4jTYsnZoWEGO/FvNQdajq6cP.Um';

console.log('Testing passwords against hash from database:');
console.log('Hash:', hashFromDb);
console.log('---');

async function testPasswords() {
  for (const password of passwordList) {
    const isValid = await bcrypt.compare(password, hashFromDb);
    console.log(`Password "${password}": ${isValid ? '✅ MATCH' : '❌ NO MATCH'}`);
  }
}

testPasswords().then(() => {
  console.log('\nTest complete');
});