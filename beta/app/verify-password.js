const bcrypt = require('bcryptjs');

const passwords = ['C@rlos2025', 'password123', 'buyer123'];
const hash = '$2b$10$yAjrYfFk2BQ2fyfg2Hmpjee.aoCNJhBSfSQjH9S0mj7E7zP7BQyAO'; // buyer@test.com hash

async function checkPasswords() {
  for (const password of passwords) {
    const isValid = await bcrypt.compare(password, hash);
    console.log(`Password "${password}": ${isValid ? '✓ VALID' : '✗ Invalid'}`);
  }
}

checkPasswords();