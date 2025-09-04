import * as dotenv from 'dotenv'
import * as path from 'path'
import { prisma } from '../src/lib/prisma'

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Import after env vars are loaded
import { strigaApiRequest } from '../src/lib/striga'

async function findStrigaUsers() {
  console.log('🔍 Searching for existing users in Striga...\n')
  
  try {
    // Get local users
    const localUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        strigaUserId: true,
        kycStatus: true
      }
    })
    
    console.log(`Found ${localUsers.length} users in local database:\n`)
    
    // Try different approaches to find users
    for (const user of localUsers) {
      console.log(`📧 Checking: ${user.email}`)
      
      try {
        // Approach 1: Try to get user by email (this might not work but let's try)
        // According to Striga docs, we might need to use a search endpoint
        
        // Let's try to create a minimal test user to see the response
        if (user.email === 'seller@test.com' && !user.strigaUserId) {
          console.log('   Creating test user in Striga...')
          
          const testUserData = {
            firstName: user.firstName || 'Test',
            lastName: user.lastName || 'Seller',
            email: user.email,
            mobile: {
              countryCode: '+351',
              number: '912345678' // Portuguese test number
            },
            dateOfBirth: {
              year: 1990,
              month: 1,
              day: 1
            },
            address: {
              addressLine1: 'Test Street 123',
              city: 'Lisbon',
              postalCode: '1000-001',
              country: 'PT'
            }
          }
          
          try {
            const response = await strigaApiRequest<any>('/user/create', {
              method: 'POST',
              body: JSON.stringify(testUserData)
            })
            
            console.log('   ✅ User created in Striga!')
            console.log('   User ID:', response.userId)
            console.log('   Status:', response.status)
            
            // Update local database
            await prisma.user.update({
              where: { id: user.id },
              data: { 
                strigaUserId: response.userId,
                phoneNumber: '+351912345678'
              }
            })
            
            console.log('   ✅ Updated local database')
            
          } catch (error: any) {
            if (error.message.includes('already exists')) {
              console.log('   ℹ️  User already exists in Striga')
              
              // Try to find the user ID another way
              // Since we can't search by email directly, we might need to:
              // 1. List all users and filter
              // 2. Use a webhook to get the userId
              // 3. Contact Striga support for the existing userId
              
              console.log('   ⚠️  Cannot determine Striga userId - manual intervention needed')
            } else {
              console.log('   ❌ Error:', error.message)
            }
          }
        } else if (user.strigaUserId) {
          // If we have a strigaUserId, verify it exists
          console.log(`   Checking Striga user: ${user.strigaUserId}`)
          
          try {
            const strigaUser = await strigaApiRequest<any>(`/user/${user.strigaUserId}`, {
              method: 'GET'
            })
            
            console.log('   ✅ User found in Striga')
            console.log('   KYC Status:', strigaUser.KYC?.status || 'NOT_STARTED')
            console.log('   Email Verified:', strigaUser.emailVerified)
            console.log('   Mobile Verified:', strigaUser.mobileVerified)
            
          } catch (error: any) {
            console.log('   ❌ User not found in Striga')
          }
        } else {
          console.log('   ⏭️  Skipping (no strigaUserId)')
        }
        
      } catch (error: any) {
        console.error(`   Error: ${error.message}`)
      }
      
      console.log('')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findStrigaUsers().catch(console.error)