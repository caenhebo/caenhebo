import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { strigaApiRequest } from '@/lib/striga'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        strigaUserId: true,
        emailVerified: true,
        phoneVerified: true
      }
    })

    if (!user || !user.strigaUserId) {
      return NextResponse.json({
        exists: false,
        message: 'No Striga user found'
      })
    }

    // Get user details from Striga
    console.log('[Check Striga User] Checking user:', user.strigaUserId)
    
    try {
      const strigaUser = await strigaApiRequest<any>(`/user/${user.strigaUserId}`, {
        method: 'GET'
      })
      
      console.log('[Check Striga User] Striga response:', strigaUser)
      
      // Check verification status from Striga
      // In Striga response, KYC.emailVerified and KYC.mobileVerified show the status
      const emailVerified = strigaUser.KYC?.emailVerified === true
      const mobileVerified = strigaUser.KYC?.mobileVerified === true
      
      // Update our database with Striga's verification status
      if (emailVerified !== user.emailVerified || mobileVerified !== user.phoneVerified) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            emailVerified: emailVerified ? new Date() : null,
            phoneVerified: mobileVerified
          }
        })
      }
      
      return NextResponse.json({
        exists: true,
        strigaUserId: user.strigaUserId,
        emailVerified,
        mobileVerified,
        kycStatus: strigaUser.KYC?.status || 'NOT_STARTED',
        strigaUser: strigaUser // Include full response for debugging
      })
    } catch (error) {
      console.error('[Check Striga User] Error fetching from Striga:', error)
      // User might not exist in Striga
      return NextResponse.json({
        exists: false,
        strigaUserId: user.strigaUserId,
        message: 'User not found in Striga'
      })
    }
  } catch (error) {
    console.error('[Check Striga User] Failed:', error)
    return NextResponse.json(
      { error: 'Failed to check Striga user status' },
      { status: 500 }
    )
  }
}