import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { strigaApiRequest } from '@/lib/striga'
import { createIbanIfNeeded } from '@/lib/auto-create-iban'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('[KYC Status] Checking status for user:', session.user.id)
    
    // Get user with all KYC-related fields
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        strigaUserId: true,
        emailVerified: true,
        phoneVerified: true,
        kycStatus: true,
        kycSessionId: true,
        profile: {
          select: {
            dateOfBirth: true,
            address: true,
            addressLine2: true,
            city: true,
            postalCode: true,
            country: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let actualKycStatus = user.kycStatus
    let emailVerified = user.emailVerified
    let phoneVerified = user.phoneVerified

    console.log('[KYC Status] Initial values from DB:', {
      emailVerified,
      phoneVerified,
      phoneVerifiedType: typeof phoneVerified,
      kycStatus: actualKycStatus
    })

    // If user has Striga ID, fetch live status from Striga
    if (user.strigaUserId) {
      try {
        console.log('[KYC Status] Fetching live status from Striga for user:', user.strigaUserId)
        
        // Get user details which includes KYC status
        const strigaUser = await strigaApiRequest<any>(`/user/${user.strigaUserId}`, {
          method: 'GET'
        })
        
        console.log('[KYC Status] Striga response:', {
          strigaUserId: user.strigaUserId,
          emailVerified: strigaUser.emailVerified,
          mobileVerified: strigaUser.mobileVerified,
          KYC: strigaUser.KYC,
          kycStatus: strigaUser.KYC?.status
        })
        
        // Get live verification status from Striga
        const strigaEmailVerified = strigaUser.emailVerified === true || strigaUser.KYC?.emailVerified === true
        const strigaMobileVerified = strigaUser.mobileVerified === true || strigaUser.KYC?.mobileVerified === true
        const strigaKycStatus = strigaUser.KYC?.status
        
        // Map Striga KYC status to our internal status
        let mappedStatus = user.kycStatus
        if (strigaKycStatus === 'APPROVED') {
          mappedStatus = 'PASSED'
        } else if (strigaKycStatus === 'REJECTED' || strigaKycStatus === 'FAILED') {
          mappedStatus = 'REJECTED'
        } else if (strigaKycStatus === 'IN_REVIEW' || strigaKycStatus === 'PENDING') {
          mappedStatus = 'INITIATED'
        } else if (strigaKycStatus === 'NOT_STARTED') {
          mappedStatus = 'PENDING' // Map NOT_STARTED to PENDING
        }
        
        // Update our database if status has changed
        if (mappedStatus !== user.kycStatus || 
            strigaEmailVerified !== !!user.emailVerified ||
            strigaMobileVerified !== user.phoneVerified) {
          
          console.log('[KYC Status] Updating local status from Striga:', {
            oldKycStatus: user.kycStatus,
            newKycStatus: mappedStatus,
            oldEmailVerified: !!user.emailVerified,
            newEmailVerified: strigaEmailVerified,
            oldPhoneVerified: user.phoneVerified,
            newPhoneVerified: strigaMobileVerified
          })
          
          await prisma.user.update({
            where: { id: user.id },
            data: {
              kycStatus: mappedStatus,
              emailVerified: strigaEmailVerified ? new Date() : null,
              phoneVerified: strigaMobileVerified
            }
          })
          
          // If KYC just got approved, create IBAN automatically
          if (user.kycStatus !== 'PASSED' && mappedStatus === 'PASSED') {
            console.log('[KYC Status] KYC approved, creating IBAN automatically')
            await createIbanIfNeeded(user.id)
          }
        }
        
        // Use the live status for response
        actualKycStatus = mappedStatus
        emailVerified = strigaEmailVerified ? new Date() : null
        phoneVerified = strigaMobileVerified
        
        console.log('[KYC Status] After Striga sync:', {
          actualKycStatus,
          emailVerified: !!emailVerified,
          phoneVerified,
          phoneVerifiedType: typeof phoneVerified,
          strigaMobileVerified
        })
      } catch (error) {
        console.error('[KYC Status] Failed to fetch from Striga:', error)
        // Continue with local status if Striga fetch fails
      }
    }

    // Determine the current stage based on user status
    let stage: 'form' | 'email_verification' | 'mobile_verification' | 'kyc_ready' | 'kyc_initiated' | 'kyc_passed' | 'kyc_rejected'
    
    // Ensure proper boolean evaluation for verification status
    const isEmailVerified = !!emailVerified
    const isPhoneVerified = phoneVerified === true || phoneVerified === 1
    
    if (!user.strigaUserId) {
      stage = 'form' // Need to fill the form
    } else if (!isEmailVerified) {
      stage = 'email_verification' // Need to verify email
    } else if (!isPhoneVerified) {
      stage = 'mobile_verification' // Need to verify mobile
    } else if (actualKycStatus === 'PASSED') {
      stage = 'kyc_passed' // Already completed and approved
    } else if (actualKycStatus === 'REJECTED') {
      stage = 'kyc_rejected' // KYC was rejected
    } else if (actualKycStatus === 'INITIATED') {
      stage = 'kyc_initiated' // KYC in progress
    } else {
      stage = 'kyc_ready' // Ready to start KYC
    }

    // Prepare form data if available
    const formData = user.profile ? {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      dateOfBirth: user.profile.dateOfBirth?.toISOString().split('T')[0] || '',
      address: {
        addressLine1: user.profile.address || '',
        addressLine2: user.profile.addressLine2 || '',
        city: user.profile.city || '',
        postalCode: user.profile.postalCode || '',
        country: user.profile.country || 'PT'
      }
    } : null

    console.log('[KYC Status] Final response data:', {
      stage,
      emailVerified: !!emailVerified,
      phoneVerified,
      phoneVerifiedType: typeof phoneVerified,
      phoneVerifiedValue: phoneVerified,
      phoneVerifiedBoolean: !!phoneVerified,
      userPhoneVerified: user.phoneVerified,
      stageLogic: {
        hasStrigaUserId: !!user.strigaUserId,
        emailVerifiedCheck: !!emailVerified,
        phoneVerifiedCheck: !!phoneVerified,
        notPhoneVerified: !phoneVerified
      }
    })

    return NextResponse.json({
      stage,
      strigaUserId: user.strigaUserId,
      emailVerified: !!emailVerified,
      phoneVerified,
      kycStatus: actualKycStatus,
      kycSessionId: user.kycSessionId,
      formData
    })
  } catch (error) {
    console.error('[KYC Status] Failed to get status:', error)
    return NextResponse.json(
      { error: 'Failed to get KYC status' },
      { status: 500 }
    )
  }
}

// Webhook endpoint to update KYC status from Striga
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate webhook signature if configured
    // const signature = req.headers.get('x-striga-signature')
    // if (!verifyWebhookSignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }
    
    const { userId, kycStatus, rejectionReason } = body
    
    // Map Striga KYC status to our status
    let mappedStatus: 'PENDING' | 'INITIATED' | 'PASSED' | 'REJECTED' = 'PENDING'
    if (kycStatus === 'APPROVED') {
      mappedStatus = 'PASSED'
    } else if (kycStatus === 'REJECTED' || kycStatus === 'FAILED') {
      mappedStatus = 'REJECTED'
    } else if (kycStatus === 'PENDING' || kycStatus === 'IN_REVIEW') {
      mappedStatus = 'INITIATED'
    } else if (kycStatus === 'NOT_STARTED') {
      mappedStatus = 'PENDING' // Map NOT_STARTED to PENDING
    }
    
    // Get the previous status before updating
    const previousUser = await prisma.user.findUnique({
      where: { strigaUserId: userId },
      select: { kycStatus: true }
    })
    
    // Update user KYC status
    const user = await prisma.user.update({
      where: { strigaUserId: userId },
      data: { 
        kycStatus: mappedStatus
      },
      select: {
        id: true,
        email: true,
        kycStatus: true
      }
    })
    
    // If KYC just got approved, create IBAN automatically
    if (previousUser?.kycStatus !== 'PASSED' && mappedStatus === 'PASSED') {
      console.log('[KYC Webhook] KYC approved, creating IBAN automatically for user:', user.id)
      await createIbanIfNeeded(user.id)
    }
    
    // If rejected, send email notification
    if (mappedStatus === 'REJECTED') {
      // TODO: Implement email notification
      console.log(`KYC rejected for user ${user.email}. Reason: ${rejectionReason}`)
    }
    
    return NextResponse.json({
      success: true,
      kycStatus: user.kycStatus
    })
  } catch (error) {
    console.error('Failed to update KYC status:', error)
    return NextResponse.json(
      { error: 'Failed to update KYC status' },
      { status: 500 }
    )
  }
}