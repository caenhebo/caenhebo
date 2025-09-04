const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function verifyLogin() {
  console.log('Verifying login credentials for seller@test.com\n');
  
  try {
    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: 'seller@test.com' }
    });
    
    if (!user) {
      console.error('❌ User seller@test.com not found!');
      return;
    }
    
    console.log('✅ User found:', user.email);
    console.log('   Role:', user.role);
    console.log('   Name:', user.firstName, user.lastName);
    
    // Test passwords
    const passwords = ['C@rlos2025', 'password123'];
    
    for (const password of passwords) {
      const isValid = await bcrypt.compare(password, user.password);
      console.log(`\nPassword "${password}":`, isValid ? '✅ VALID' : '❌ INVALID');
    }
    
    // Show what the hash should be
    console.log('\nGenerating correct hash for C@rlos2025...');
    const correctHash = await bcrypt.hash('C@rlos2025', 10);
    console.log('Hash:', correctHash);
    
    // Force update the password to ensure it's correct
    console.log('\nForce updating password to C@rlos2025...');
    await prisma.user.update({
      where: { email: 'seller@test.com' },
      data: { password: correctHash }
    });
    
    console.log('✅ Password updated successfully!');
    console.log('\nYou can now login with:');
    console.log('Email: seller@test.com');
    console.log('Password: C@rlos2025');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyLogin();