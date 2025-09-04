import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { strigaApiRequest } from '@/lib/striga'
import { createIbanIfNeeded } from '@/lib/auto-create-iban'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('[KYC Sync] Force syncing KYC status for user:', session.user.id)
    
    // Get user with Striga ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        strigaUserId: true,
        kycStatus: true,
        emailVerified: true,
        phoneVerified: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.strigaUserId) {
      return NextResponse.json({ 
        error: 'No Striga account found',
        currentStatus: user.kycStatus 
      }, { status: 400 })
    }

    // Fetch current status from Striga - KYC is part of user object
    console.log('[KYC Sync] Fetching user from Striga for ID:', user.strigaUserId)
    
    const strigaUser = await strigaApiRequest<any>(`/user/${user.strigaUserId}`, {
      method: 'GET'
    })
    
    console.log('[KYC Sync] Striga user response:', {
      strigaUserId: user.strigaUserId,
      emailVerified: strigaUser.emailVerified,
      mobileVerified: strigaUser.mobileVerified,
      KYC: strigaUser.KYC,
      kycStatus: strigaUser.KYC?.status
    })
    
    // Get verification status - check both top-level and KYC object
    const strigaEmailVerified = strigaUser.emailVerified === true || strigaUser.KYC?.emailVerified === true
    const strigaMobileVerified = strigaUser.mobileVerified === true || strigaUser.KYC?.mobileVerified === true
    
    // Get KYC status from the KYC object
    const strigaKycStatus = strigaUser.KYC?.status
    
    console.log('[KYC Sync] Parsed status:', {
      strigaKycStatus,
      strigaEmailVerified,
      strigaMobileVerified,
      currentDbStatus: user.kycStatus
    })
    
    // Map Striga KYC status to our internal status
    let mappedStatus = user.kycStatus
    if (strigaKycStatus === 'APPROVED') {
      mappedStatus = 'PASSED'
    } else if (strigaKycStatus === 'REJECTED' || strigaKycStatus === 'FAILED') {
      mappedStatus = 'REJECTED'
    } else if (strigaKycStatus === 'IN_REVIEW' || strigaKycStatus === 'PENDING') {
      mappedStatus = 'INITIATED'
    } else if (strigaKycStatus === 'NOT_STARTED') {
      mappedStatus = 'PENDING'
    }
    
    // Check if update is needed
    const needsUpdate = mappedStatus !== user.kycStatus || 
                       strigaEmailVerified !== !!user.emailVerified ||
                       strigaMobileVerified !== user.phoneVerified
    
    if (needsUpdate) {
      console.log('[KYC Sync] Updating database with new status:', {
        oldStatus: user.kycStatus,
        newStatus: mappedStatus,
        oldEmailVerified: !!user.emailVerified,
        newEmailVerified: strigaEmailVerified,
        oldPhoneVerified: user.phoneVerified,
        newPhoneVerified: strigaMobileVerified
      })
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          kycStatus: mappedStatus,
          emailVerified: strigaEmailVerified ? (user.emailVerified || new Date()) : null,
          phoneVerified: strigaMobileVerified
        }
      })
      
      // If KYC just got approved, create IBAN automatically
      if (user.kycStatus !== 'PASSED' && mappedStatus === 'PASSED') {
        console.log('[KYC Sync] KYC approved! Creating IBAN automatically...')
        try {
          await createIbanIfNeeded(user.id)
          console.log('[KYC Sync] IBAN created successfully')
        } catch (error) {
          console.error('[KYC Sync] Failed to create IBAN:', error)
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'KYC status updated',
        previousStatus: user.kycStatus,
        currentStatus: mappedStatus,
        strigaStatus: strigaKycStatus,
        emailVerified: strigaEmailVerified,
        phoneVerified: strigaMobileVerified,
        ibanCreated: mappedStatus === 'PASSED' && user.kycStatus !== 'PASSED'
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'KYC status already up to date',
        currentStatus: mappedStatus,
        strigaStatus: strigaKycStatus,
        emailVerified: strigaEmailVerified,
        phoneVerified: strigaMobileVerified
      })
    }
    
  } catch (error) {
    console.error('[KYC Sync] Failed to sync KYC status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sync KYC status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check current status without updating
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        kycStatus: true,
        strigaUserId: true,
        emailVerified: true,
        phoneVerified: true
      }
    })

    return NextResponse.json({
      email: user?.email,
      kycStatus: user?.kycStatus,
      strigaUserId: user?.strigaUserId,
      emailVerified: !!user?.emailVerified,
      phoneVerified: user?.phoneVerified
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 })
  }
}