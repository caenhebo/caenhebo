import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { strigaApiRequest } from '@/lib/striga'
import { ensureUserWallets } from '@/lib/wallet-manager'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  // Check if user is admin
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    )
  }

  const results = []

  try {
    // Get all users from local database
    const localUsers = await prisma.user.findMany({
      where: {
        role: { not: 'ADMIN' } // Don't sync admin users
      },
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

    console.log(`[Admin Sync] Found ${localUsers.length} users to check`)

    // For each user, try to find them in Striga
    for (const user of localUsers) {
      try {
        // If user already has strigaUserId, fetch their current status
        if (user.strigaUserId) {
          console.log(`[Admin Sync] Checking user ${user.email} with ID ${user.strigaUserId}`)
          
          try {
            const strigaUser = await strigaApiRequest<any>(`/user/${user.strigaUserId}`, {
              method: 'GET'
            })
            
            // Map Striga KYC status to our status
            let mappedStatus = user.kycStatus
            if (strigaUser.KYC?.status === 'APPROVED') {
              mappedStatus = 'PASSED'
            } else if (strigaUser.KYC?.status === 'REJECTED' || strigaUser.KYC?.status === 'FAILED') {
              mappedStatus = 'REJECTED'
            } else if (strigaUser.KYC?.status === 'IN_REVIEW' || strigaUser.KYC?.status === 'PENDING') {
              mappedStatus = 'INITIATED'
            }
            
            // Update local database
            await prisma.user.update({
              where: { id: user.id },
              data: {
                kycStatus: mappedStatus,
                emailVerified: strigaUser.emailVerified ? new Date() : null,
                phoneVerified: strigaUser.mobileVerified || false
              }
            })
            
            results.push({
              email: user.email,
              success: true,
              message: 'Successfully synced with Striga',
              details: {
                strigaUserId: user.strigaUserId,
                kycStatus: mappedStatus,
                emailVerified: strigaUser.emailVerified,
                phoneVerified: strigaUser.mobileVerified
              }
            })
          } catch (error: any) {
            console.error(`[Admin Sync] Error fetching user ${user.strigaUserId}:`, error.message)
            results.push({
              email: user.email,
              success: false,
              message: 'User ID exists but not found in Striga',
              details: { strigaUserId: user.strigaUserId }
            })
          }
        } else {
          // User doesn't have strigaUserId - try to find by email using the correct endpoint
          console.log(`[Admin Sync] Searching for user ${user.email} in Striga`)
          
          try {
            const strigaUser = await strigaApiRequest<any>('/user/get-by-email', {
              method: 'POST',
              body: JSON.stringify({ email: user.email })
            })
            
            console.log(`[Admin Sync] Found user ${user.email} in Striga:`, strigaUser.userId)
            
            // Map Striga KYC status to our status
            let mappedStatus = 'PENDING'  // Default to PENDING (valid enum value)
            if (strigaUser.KYC?.status === 'APPROVED') {
              mappedStatus = 'PASSED'
            } else if (strigaUser.KYC?.status === 'REJECTED' || strigaUser.KYC?.status === 'FAILED') {
              mappedStatus = 'REJECTED'
            } else if (strigaUser.KYC?.status === 'IN_REVIEW' || strigaUser.KYC?.status === 'PENDING') {
              mappedStatus = 'INITIATED'
            }
            
            // Update local database with the found Striga user ID and status
            await prisma.user.update({
              where: { id: user.id },
              data: {
                strigaUserId: strigaUser.userId,
                kycStatus: mappedStatus,
                emailVerified: strigaUser.KYC?.emailVerified ? new Date() : null,
                phoneVerified: strigaUser.KYC?.mobileVerified || false
              }
            })
            
            // If KYC was just approved, ensure wallets are created
            if (mappedStatus === 'PASSED' && user.kycStatus !== 'PASSED') {
              console.log(`[Admin Sync] KYC newly approved for ${user.email}, creating wallets...`)
              const walletResult = await ensureUserWallets(user.id)
              if (walletResult.created.length > 0) {
                console.log(`[Admin Sync] Created ${walletResult.created.length} wallets for ${user.email}`)
              }
            }
            
            results.push({
              email: user.email,
              success: true,
              message: 'Successfully found and synced user from Striga',
              details: {
                strigaUserId: strigaUser.userId,
                kycStatus: mappedStatus,
                emailVerified: strigaUser.KYC?.emailVerified,
                phoneVerified: strigaUser.KYC?.mobileVerified,
                kycTier: strigaUser.KYC?.currentTier
              }
            })
          } catch (error: any) {
            console.error(`[Admin Sync] User ${user.email} not found in Striga:`, error.message)
            
            if (error.statusCode === 404 || error.message.includes('404')) {
              results.push({
                email: user.email,
                success: false,
                message: 'User not on Striga DB',
                details: { info: 'This user needs to complete the registration process in Striga first' }
              })
            } else {
              results.push({
                email: user.email,
                success: false,
                message: 'Error connecting to Striga',
                details: { error: error.message }
              })
            }
          }
        }
      } catch (error: any) {
        console.error(`[Admin Sync] Error processing user ${user.email}:`, error.message)
        results.push({
          email: user.email,
          success: false,
          message: `Error: ${error.message}`,
          details: {}
        })
      }
    }

    // Log sync summary
    const successCount = results.filter(r => r.success).length
    const totalCount = results.length
    console.log(`[Admin Sync] Completed: ${successCount}/${totalCount} users synced successfully`)

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error) {
    console.error('[Admin Sync] Fatal error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error },
      { status: 500 }
    )
  }
}