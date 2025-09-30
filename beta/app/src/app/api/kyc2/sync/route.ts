import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { strigaApiRequest } from '@/lib/striga'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('[KYC2 Sync] Force syncing KYC2 status for user:', session.user.id)

    // Get user with Striga ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        strigaUserId: true,
        kycStatus: true,
        kyc2Status: true,
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
        currentStatus: user.kyc2Status
      }, { status: 400 })
    }

    // Fetch current status from Striga
    console.log('[KYC2 Sync] Fetching user from Striga for ID:', user.strigaUserId)

    const strigaUser = await strigaApiRequest<any>(`/user/${user.strigaUserId}`, {
      method: 'GET'
    })

    console.log('[KYC2 Sync] Striga user response:', {
      strigaUserId: user.strigaUserId,
      KYC: strigaUser.KYC,
      kycStatus: strigaUser.KYC?.status,
      KYC2: strigaUser.KYC2,
      kyc2Status: strigaUser.KYC2?.status,
      // Check for enhanced KYC or Tier 2 in the response
      enhancedKYC: strigaUser.enhancedKYC,
      tier2Status: strigaUser.tier2Status
    })

    // Get KYC2 status from various possible locations in the response
    // Striga might use different fields for KYC2
    let strigaKyc2Status = null

    // Check multiple possible locations for KYC2 status
    if (strigaUser.KYC2?.status) {
      strigaKyc2Status = strigaUser.KYC2.status
    } else if (strigaUser.enhancedKYC?.status) {
      strigaKyc2Status = strigaUser.enhancedKYC.status
    } else if (strigaUser.tier2Status) {
      strigaKyc2Status = strigaUser.tier2Status
    } else if (strigaUser.KYC?.tier === 2 || strigaUser.KYC?.level === 2) {
      // Sometimes KYC2 is indicated by tier/level in the main KYC object
      strigaKyc2Status = strigaUser.KYC.status
    } else if (strigaUser.KYC?.status === 'APPROVED' && strigaUser.KYC?.enhanced === true) {
      // Or by an enhanced flag
      strigaKyc2Status = 'APPROVED'
    }

    // Also check if the entire KYC object indicates Tier 2
    // In some cases, Striga uses the same KYC object but with different levels
    if (!strigaKyc2Status && strigaUser.KYC) {
      // Check if user has completed enhanced verification
      const hasEnhancedDocs = strigaUser.KYC.documentsVerified === true ||
                             strigaUser.KYC.identityVerified === true ||
                             strigaUser.KYC.addressVerified === true

      // If Tier 1 is approved and has enhanced docs, consider it Tier 2 approved
      if (strigaUser.KYC.status === 'APPROVED' && hasEnhancedDocs) {
        strigaKyc2Status = 'APPROVED'
        console.log('[KYC2 Sync] Detected Tier 2 from enhanced documents')
      }
    }

    console.log('[KYC2 Sync] Parsed KYC2 status:', {
      strigaKyc2Status,
      currentDbStatus: user.kyc2Status,
      fullKYCObject: strigaUser.KYC
    })

    // Map Striga KYC2 status to our internal status
    let mappedStatus = user.kyc2Status
    if (strigaKyc2Status === 'APPROVED' || strigaKyc2Status === 'PASSED') {
      mappedStatus = 'PASSED'
    } else if (strigaKyc2Status === 'REJECTED' || strigaKyc2Status === 'FAILED') {
      mappedStatus = 'REJECTED'
    } else if (strigaKyc2Status === 'IN_REVIEW' || strigaKyc2Status === 'PENDING') {
      mappedStatus = 'INITIATED'
    } else if (strigaKyc2Status === 'NOT_STARTED') {
      mappedStatus = 'PENDING'
    }

    // Check if update is needed
    const needsUpdate = mappedStatus !== user.kyc2Status

    if (needsUpdate) {
      console.log('[KYC2 Sync] Updating database with new KYC2 status:', {
        oldStatus: user.kyc2Status,
        newStatus: mappedStatus
      })

      await prisma.user.update({
        where: { id: user.id },
        data: {
          kyc2Status: mappedStatus
        }
      })

      return NextResponse.json({
        success: true,
        message: 'KYC2 status updated',
        previousStatus: user.kyc2Status,
        currentStatus: mappedStatus,
        strigaStatus: strigaKyc2Status,
        strigaResponse: {
          KYC: strigaUser.KYC,
          KYC2: strigaUser.KYC2,
          enhancedKYC: strigaUser.enhancedKYC,
          tier2Status: strigaUser.tier2Status
        }
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'KYC2 status already up to date',
        currentStatus: mappedStatus,
        strigaStatus: strigaKyc2Status,
        strigaResponse: {
          KYC: strigaUser.KYC,
          KYC2: strigaUser.KYC2,
          enhancedKYC: strigaUser.enhancedKYC,
          tier2Status: strigaUser.tier2Status
        }
      })
    }

  } catch (error) {
    console.error('[KYC2 Sync] Failed to sync KYC2 status:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync KYC2 status',
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
        kyc2Status: true,
        strigaUserId: true,
        emailVerified: true,
        phoneVerified: true
      }
    })

    return NextResponse.json({
      email: user?.email,
      kycStatus: user?.kycStatus,
      kyc2Status: user?.kyc2Status,
      strigaUserId: user?.strigaUserId,
      emailVerified: !!user?.emailVerified,
      phoneVerified: user?.phoneVerified
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 })
  }
}