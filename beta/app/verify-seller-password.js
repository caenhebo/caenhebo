const bcrypt = require('bcryptjs');

const hash = '$2b$10$oPbG2uOFBF0d3mchF5wEneHi9W4jTYsnZoWEGO/FvNQdajq6cP.Um';
const password = 'C@rlos2025';

console.log('Verifying seller@test.com password...');
bcrypt.compare(password, hash, (err, result) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Password "C@rlos2025" matches hash:', result);
  }
});
