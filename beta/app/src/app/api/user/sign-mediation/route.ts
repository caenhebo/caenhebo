import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has completed KYC2
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        kyc2Status: true,
        mediationAgreementSigned: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if KYC2 is completed
    if (user.kyc2Status !== 'PASSED') {
      return NextResponse.json(
        { error: 'You must complete KYC Tier 2 verification before signing the mediation agreement' },
        { status: 400 }
      )
    }

    // Check if already signed
    if (user.mediationAgreementSigned) {
      return NextResponse.json(
        { error: 'Mediation agreement already signed' },
        { status: 400 }
      )
    }

    // Update user with signed mediation agreement
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mediationAgreementSigned: true,
        mediationAgreementSignedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Mediation agreement signed successfully',
      signedAt: updatedUser.mediationAgreementSignedAt
    })

  } catch (error) {
    console.error('Error signing mediation agreement:', error)
    return NextResponse.json(
      { error: 'Failed to sign mediation agreement' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        mediationAgreementSigned: true,
        mediationAgreementSignedAt: true,
        kyc2Status: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      signed: user.mediationAgreementSigned,
      signedAt: user.mediationAgreementSignedAt,
      canSign: user.kyc2Status === 'PASSED' && !user.mediationAgreementSigned,
      kyc2Status: user.kyc2Status
    })

  } catch (error) {
    console.error('Error checking mediation agreement status:', error)
    return NextResponse.json(
      { error: 'Failed to check mediation agreement status' },
      { status: 500 }
    )
  }
}