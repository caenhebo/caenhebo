const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePasswords() {
  try {
    // First, backup current users
    console.log('Fetching current users...');
    const seller = await prisma.user.findUnique({ where: { email: 'seller@test.com' } });
    const buyer = await prisma.user.findUnique({ where: { email: 'buyer@test.com' } });
    
    if (!seller || !buyer) {
      console.error('Test users not found!');
      return;
    }
    
    console.log('Current users found:');
    console.log('- seller@test.com:', seller.firstName, seller.lastName);
    console.log('- buyer@test.com:', buyer.firstName, buyer.lastName);
    
    // Hash the new password
    const newPassword = 'C@rlos2025';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log('\nUpdating passwords to: C@rlos2025');
    
    // Update seller password
    await prisma.user.update({
      where: { email: 'seller@test.com' },
      data: { password: hashedPassword }
    });
    console.log('✓ Updated seller@test.com password');
    
    // Update buyer password
    await prisma.user.update({
      where: { email: 'buyer@test.com' },
      data: { password: hashedPassword }
    });
    console.log('✓ Updated buyer@test.com password');
    
    console.log('\n✅ Password updates completed successfully!');
    console.log('\nNew credentials:');
    console.log('- seller@test.com / C@rlos2025');
    console.log('- buyer@test.com / C@rlos2025');
    
  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePasswords();