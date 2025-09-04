import { prisma } from '../src/lib/prisma'
import { strigaApiRequest } from '../src/lib/striga'

// Script to sync Striga users with local database
async function syncStrigaUsers() {
  console.log('🔄 Starting Striga user sync...')
  
  try {
    // Get all users from local database
    const localUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        strigaUserId: true,
        kycStatus: true,
        emailVerified: true,
        phoneVerified: true
      }
    })
    
    console.log(`Found ${localUsers.length} users in local database`)
    
    // For each user, check if they exist in Striga
    for (const user of localUsers) {
      console.log(`\n📧 Checking user: ${user.email}`)
      
      try {
        // Search for user by email in Striga
        const searchResponse = await strigaApiRequest<{
          data: any[],
          total: number
        }>('/users', {
          method: 'POST',
          body: JSON.stringify({
            filter: {
              email: user.email
            },
            page: 1,
            limit: 10
          })
        })
        
        if (searchResponse.total > 0) {
          const strigaUser = searchResponse.data[0]
          console.log(`✅ Found in Striga: ${strigaUser.userId}`)
          console.log(`   KYC Status: ${strigaUser.KYC?.status || 'NOT_STARTED'}`)
          console.log(`   Email Verified: ${strigaUser.emailVerified}`)
          console.log(`   Phone Verified: ${strigaUser.mobileVerified}`)
          
          // Update local database with Striga data
          const updates: any = {}
          
          // Update strigaUserId if missing
          if (!user.strigaUserId && strigaUser.userId) {
            updates.strigaUserId = strigaUser.userId
          }
          
          // Map Striga KYC status to our status
          if (strigaUser.KYC?.status) {
            let mappedStatus = 'PENDING'
            if (strigaUser.KYC.status === 'APPROVED') {
              mappedStatus = 'PASSED'
            } else if (strigaUser.KYC.status === 'REJECTED' || strigaUser.KYC.status === 'FAILED') {
              mappedStatus = 'REJECTED'
            } else if (strigaUser.KYC.status === 'IN_REVIEW' || strigaUser.KYC.status === 'PENDING') {
              mappedStatus = 'INITIATED'
            }
            
            if (mappedStatus !== user.kycStatus) {
              updates.kycStatus = mappedStatus
            }
          }
          
          // Update verification status
          if (strigaUser.emailVerified && !user.emailVerified) {
            updates.emailVerified = new Date()
          }
          
          if (strigaUser.mobileVerified !== user.phoneVerified) {
            updates.phoneVerified = strigaUser.mobileVerified
          }
          
          // Apply updates if any
          if (Object.keys(updates).length > 0) {
            console.log(`📝 Updating local user with:`, updates)
            await prisma.user.update({
              where: { id: user.id },
              data: updates
            })
          } else {
            console.log(`✓ Local user already in sync`)
          }
          
        } else {
          console.log(`❌ Not found in Striga`)
          
          // If user has strigaUserId but not found, it might be wrong
          if (user.strigaUserId) {
            console.log(`⚠️  User has strigaUserId ${user.strigaUserId} but not found in Striga!`)
          }
        }
      } catch (error: any) {
        console.error(`Error checking user ${user.email}:`, error.message)
      }
    }
    
    console.log('\n✅ Sync completed!')
    
  } catch (error) {
    console.error('Sync failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the sync
syncStrigaUsers().catch(console.error)