import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { createStrigaUser, initiateKYC, StrigaUserData } from '@/lib/striga'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      phone,
      countryCode,
      addressLine1,
      city,
      state,
      postalCode,
      country,
      dateOfBirth
    } = await request.json()

    // Validate required fields
    if (!phone || !countryCode || !addressLine1 || !city || !postalCode || !dateOfBirth) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.strigaUserId) {
      return NextResponse.json(
        { error: 'User already onboarded with Striga' },
        { status: 400 }
      )
    }

    // Prepare Striga user data
    const strigaUserData: StrigaUserData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: {
        countryCode: countryCode,
        number: phone
      },
      address: {
        addressLine1: addressLine1,
        city: city,
        state: state,
        postalCode: postalCode,
        country: country || 'Portugal'
      },
      dateOfBirth: dateOfBirth // YYYY-MM-DD format
    }

    try {
      // Create user in Striga
      const strigaUserId = await createStrigaUser(strigaUserData)

      // Update local user with Striga ID and additional info
      await prisma.user.update({
        where: { id: user.id },
        data: {
          strigaUserId: strigaUserId,
          phone: phone,
          addressLine1: addressLine1,
          city: city,
          state: state,
          postalCode: postalCode,
          country: country || 'Portugal',
          dateOfBirth: new Date(dateOfBirth)
        }
      })

      // Initiate KYC process
      const kycSession = await initiateKYC(strigaUserId)

      // Store KYC session ID
      await prisma.user.update({
        where: { id: user.id },
        data: {
          kycSessionId: kycSession.sessionId
        }
      })

      // Create notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Onboarding Complete',
          message: 'Your account has been successfully created. Please complete KYC verification.',
          type: 'ONBOARDING_COMPLETE'
        }
      })

      return NextResponse.json({
        message: 'Onboarding completed successfully',
        strigaUserId: strigaUserId,
        kycUrl: kycSession.kycUrl,
        kycSessionId: kycSession.sessionId
      })

    } catch (strigaError) {
      console.error('Striga onboarding error:', strigaError)
      
      // If Striga user creation fails, we don't update the local user
      return NextResponse.json(
        { error: 'Failed to complete onboarding with payment provider' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}