const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixTestUsers() {
  // Hash the standard test password
  const hashedPassword = await bcrypt.hash('testpassword123', 10);
  
  console.log('Updating test user passwords...');
  
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
  
  console.log('✓ Test user passwords updated');
  console.log('  Email: buyer@test.com, Password: testpassword123');
  console.log('  Email: seller@test.com, Password: testpassword123');
}

fixTestUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());