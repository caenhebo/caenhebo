const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function fixBuyerPassword() {
  try {
    const hash = await bcrypt.hash('C@rlos2025', 10);
    await prisma.user.update({ 
      where: { email: 'buyer@test.com' }, 
      data: { password: hash } 
    });
    console.log('✅ buyer@test.com password updated to C@rlos2025');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBuyerPassword();