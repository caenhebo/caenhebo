const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function restoreAllPasswords() {
  // Hash the original password
  const hashedPassword = await bcrypt.hash('C@rlos2025', 10);
  
  console.log('Restoring ALL user passwords to C@rlos2025...');
  
  // Update ALL test users including admin
  const users = [
    'buyer@test.com',
    'seller@test.com',
    'admin@test.com',
    'f@pachoman.com'  // Admin user from CLAUDE.md
  ];
  
  for (const email of users) {
    try {
      await prisma.user.update({
        where: { email: email },
        data: { password: hashedPassword }
      });
      console.log(`✓ Updated: ${email}`);
    } catch (e) {
      console.log(`- User ${email} not found or already correct`);
    }
  }
  
  console.log('\n✓ All passwords restored to C@rlos2025');
}

restoreAllPasswords()
  .catch(console.error)
  .finally(() => prisma.$disconnect());