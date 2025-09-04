import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { strigaApiRequest } from '@/lib/striga'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get user with Striga ID
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        strigaUserId: true,
        email: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // No need to check for strigaUserId - we can search by email

    // Fetch latest data from Striga using the same approach as the working sync
    try {
      let strigaUser = null
      
      // Try to fetch by strigaUserId first if available
      if (user.strigaUserId) {
        console.log(`[User Sync] Checking user ${user.email} with ID ${user.strigaUserId}`)
        try {
          strigaUser = await strigaApiRequest<any>(`/user/${user.strigaUserId}`, {
            method: 'GET'
          })
        } catch (error: any) {
          console.error(`[User Sync] Error fetching by ID ${user.strigaUserId}:`, error.message)
          // User ID exists but not found in Striga, will try by email next
        }
      }
      
      // If no user found by ID or no strigaUserId, search by email
      if (!strigaUser) {
        console.log(`[User Sync] Searching for user ${user.email} in Striga by email`)
        try {
          strigaUser = await strigaApiRequest<any>('/user/get-by-email', {
            method: 'POST',
            body: JSON.stringify({ email: user.email })
          })
          console.log(`[User Sync] Found user ${user.email} in Striga:`, strigaUser.userId)
        } catch (emailError: any) {
          console.error(`[User Sync] User ${user.email} not found in Striga:`, emailError.message)
          
          if (emailError.statusCode === 404 || emailError.message?.includes('404')) {
            return NextResponse.json({ 
              error: 'User not found in Striga', 
              details: 'This user needs to complete the registration process in Striga first' 
            }, { status: 404 })
          }
          throw emailError
        }
      }
      
      // Map Striga KYC status to our status
      let mappedStatus = 'PENDING' // Default to PENDING (valid enum value)
      if (strigaUser.KYC?.status === 'APPROVED') {
        mappedStatus = 'PASSED'
      } else if (strigaUser.KYC?.status === 'REJECTED' || strigaUser.KYC?.status === 'FAILED') {
        mappedStatus = 'REJECTED'
      } else if (strigaUser.KYC?.status === 'IN_REVIEW' || strigaUser.KYC?.status === 'PENDING') {
        mappedStatus = 'INITIATED'
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          strigaUserId: strigaUser.userId,
          kycStatus: mappedStatus,
          emailVerified: strigaUser.KYC?.emailVerified ? new Date() : null,
          phoneVerified: strigaUser.KYC?.mobileVerified || false,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ 
        success: true, 
        user: updatedUser,
        message: 'User synced with Striga successfully',
        details: {
          strigaUserId: strigaUser.userId,
          kycStatus: mappedStatus,
          emailVerified: strigaUser.KYC?.emailVerified,
          phoneVerified: strigaUser.KYC?.mobileVerified,
          kycTier: strigaUser.KYC?.currentTier
        }
      })
    } catch (strigaError: any) {
      console.error('Striga API error:', strigaError)
      
      if (strigaError.statusCode === 404 || strigaError.message?.includes('404')) {
        return NextResponse.json({ 
          error: 'User not found in Striga', 
          details: 'This user needs to complete the registration process in Striga first' 
        }, { status: 404 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to sync with Striga', 
        details: strigaError.message 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error syncing Striga user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}