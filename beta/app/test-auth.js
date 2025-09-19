const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAuth() {
  try {
    const email = 'buyer@test.com';
    const password = 'C@rlos2025';
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      kycStatus: user.kycStatus
    });
    
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValid);
    
    if (isValid) {
      console.log('Auth should succeed with:', {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        kycStatus: user.kycStatus,
        strigaUserId: user.strigaUserId,
        paymentPreference: user.paymentPreference,
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
