const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function restorePasswords() {
  // Hash the original password
  const hashedPassword = await bcrypt.hash('C@rlos2025', 10);
  
  console.log('Restoring original passwords...');
  
  // Update buyer@test.com
  await prisma.user.update({
    where: { email: 'buyer@test.com' },
    data: { password: hashedPassword }
  });
  
  // Update seller@test.com
  await prisma.user.update({
    where: { email: 'seller@test.com' },
    data: { password: hashedPassword }
  });
  
  console.log('✓ Passwords restored to original');
  console.log('  Email: buyer@test.com, Password: C@rlos2025');
  console.log('  Email: seller@test.com, Password: C@rlos2025');
}

restorePasswords()
  .catch(console.error)
  .finally(() => prisma.$disconnect());