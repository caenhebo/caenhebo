import { prisma } from '../src/lib/prisma'

// Manual sync script - update these values with what you see in Striga dashboard
const STRIGA_USERS = [
  {
    email: 'seller@test.com',
    strigaUserId: '', // TODO: Add the Striga User ID from dashboard
    kycStatus: 'PENDING', // TODO: Update with actual status (PENDING, INITIATED, PASSED, REJECTED)
    emailVerified: false,
    phoneVerified: false
  },
  {
    email: 'buyer@test.com', 
    strigaUserId: '', // TODO: Add the Striga User ID from dashboard
    kycStatus: 'PENDING', // TODO: Update with actual status
    emailVerified: false,
    phoneVerified: false
  }
  // Add more users as needed
]

async function manualSyncUsers() {
  console.log('🔄 Manual sync of Striga users...\n')
  
  for (const strigaUser of STRIGA_USERS) {
    if (!strigaUser.strigaUserId) {
      console.log(`⏭️  Skipping ${strigaUser.email} - no Striga User ID provided`)
      continue
    }
    
    try {
      // Find user in local database
      const localUser = await prisma.user.findUnique({
        where: { email: strigaUser.email }
      })
      
      if (!localUser) {
        console.log(`❌ User ${strigaUser.email} not found in local database`)
        continue
      }
      
      // Update user with Striga data
      const updated = await prisma.user.update({
        where: { email: strigaUser.email },
        data: {
          strigaUserId: strigaUser.strigaUserId,
          kycStatus: strigaUser.kycStatus,
          emailVerified: strigaUser.emailVerified ? new Date() : null,
          phoneVerified: strigaUser.phoneVerified
        }
      })
      
      console.log(`✅ Updated ${strigaUser.email}:`)
      console.log(`   Striga User ID: ${updated.strigaUserId}`)
      console.log(`   KYC Status: ${updated.kycStatus}`)
      console.log(`   Email Verified: ${!!updated.emailVerified}`)
      console.log(`   Phone Verified: ${updated.phoneVerified}`)
      
    } catch (error) {
      console.error(`❌ Error updating ${strigaUser.email}:`, error)
    }
  }
  
  console.log('\n✅ Manual sync completed!')
  await prisma.$disconnect()
}

// Instructions
console.log('📋 INSTRUCTIONS:')
console.log('1. Open the Striga dashboard')
console.log('2. Find each user and copy their User ID')
console.log('3. Update the STRIGA_USERS array above with:')
console.log('   - strigaUserId: The ID from Striga dashboard')
console.log('   - kycStatus: Their actual KYC status')
console.log('   - emailVerified: true/false')
console.log('   - phoneVerified: true/false')
console.log('4. Run this script again\n')

// Only run if user IDs are provided
const hasUserIds = STRIGA_USERS.some(u => u.strigaUserId)
if (hasUserIds) {
  manualSyncUsers().catch(console.error)
} else {
  console.log('⚠️  Please add Striga User IDs before running the sync')
}