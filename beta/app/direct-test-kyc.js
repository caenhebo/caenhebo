// Direct test of KYC status logic
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testKycStatusLogic() {
  try {
    // Get buyer@test.com user
    const user = await prisma.user.findUnique({
      where: { email: 'buyer@test.com' },
      select: {
        id: true,
        email: true,
        strigaUserId: true,
        emailVerified: true,
        phoneVerified: true,
        kycStatus: true
      }
    });

    console.log('\n=== Database Values ===');
    console.log('Email:', user.email);
    console.log('Striga User ID:', user.strigaUserId);
    console.log('Email Verified:', user.emailVerified);
    console.log('Phone Verified:', user.phoneVerified);
    console.log('Phone Verified Type:', typeof user.phoneVerified);
    console.log('KYC Status:', user.kycStatus);

    console.log('\n=== Testing Stage Logic ===');
    
    // Test the exact logic from the route
    let phoneVerified = user.phoneVerified;
    let emailVerified = user.emailVerified;
    
    console.log('phoneVerified value:', phoneVerified);
    console.log('phoneVerified type:', typeof phoneVerified);
    console.log('!phoneVerified:', !phoneVerified);
    console.log('phoneVerified === true:', phoneVerified === true);
    console.log('phoneVerified === 1:', phoneVerified === 1);
    
    // Test the fix
    const isPhoneVerified = phoneVerified === true || phoneVerified === 1;
    console.log('isPhoneVerified (with fix):', isPhoneVerified);
    
    // Stage determination
    let stage;
    const isEmailVerified = !!emailVerified;
    
    if (!user.strigaUserId) {
      stage = 'form';
    } else if (!isEmailVerified) {
      stage = 'email_verification';
    } else if (!isPhoneVerified) {
      stage = 'mobile_verification';
    } else if (user.kycStatus === 'PASSED') {
      stage = 'kyc_passed';
    } else if (user.kycStatus === 'REJECTED') {
      stage = 'kyc_rejected';
    } else if (user.kycStatus === 'INITIATED') {
      stage = 'kyc_initiated';
    } else {
      stage = 'kyc_ready';
    }
    
    console.log('\n=== Result ===');
    console.log('Determined Stage:', stage);
    console.log('Should be kyc_ready?', isEmailVerified && isPhoneVerified && user.kycStatus === 'PENDING');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testKycStatusLogic();