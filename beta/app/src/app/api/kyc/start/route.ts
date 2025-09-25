import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { initiateKYC } from '@/lib/striga'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Parse request body to get tier
    const body = await req.json()
    const { tier = 1 } = body

    // Get user with Striga ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        strigaUserId: true,
        kycStatus: true,
        kyc2Status: true,
        emailVerified: true,
        phoneVerified: true
      }
    })

    if (!user || !user.strigaUserId) {
      return NextResponse.json(
        { error: 'User not registered with Striga. Please complete registration first.' },
        { status: 400 }
      )
    }

    // Check if email and mobile are verified
    if (!user.emailVerified || !user.phoneVerified) {
      return NextResponse.json(
        { error: 'Please verify your email and mobile number before starting KYC.' },
        { status: 400 }
      )
    }

    // Handle Tier 2 KYC
    if (tier === 2) {
      // Check if Tier 1 is completed
      if (user.kycStatus !== 'PASSED') {
        return NextResponse.json(
          { error: 'Please complete Tier 1 verification before starting Tier 2.' },
          { status: 400 }
        )
      }

      if (user.kyc2Status === 'PASSED') {
        return NextResponse.json(
          { error: 'KYC Tier 2 already completed' },
          { status: 400 }
        )
      }

      // Start KYC Tier 2 process with Striga
      const { kycUrl, sessionId, token } = await initiateKYC(user.strigaUserId, 2)

      // Update user KYC2 status
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          kyc2Status: 'INITIATED',
          kyc2SessionId: sessionId
        }
      })

      return NextResponse.json({
        success: true,
        kycUrl,
        sessionId,
        token,
        tier: 2
      })
    }

    // Handle Tier 1 KYC (default)
    if (user.kycStatus === 'PASSED') {
      return NextResponse.json(
        { error: 'KYC Tier 1 already completed' },
        { status: 400 }
      )
    }

    // Start KYC Tier 1 process with Striga
    const { kycUrl, sessionId, token } = await initiateKYC(user.strigaUserId, 1)

    // Update user KYC status
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        kycStatus: 'INITIATED',
        kycSessionId: sessionId
      }
    })

    return NextResponse.json({
      success: true,
      kycUrl,
      sessionId,
      token,
      tier: 1
    })
  } catch (error) {
    console.error('Failed to start KYC:', error)
    return NextResponse.json(
      { error: 'Failed to start KYC process' },
      { status: 500 }
    )
  }
}