import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { strigaApiRequest } from '@/lib/striga'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { code } = await req.json()
    
    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || !user.strigaUserId) {
      return NextResponse.json(
        { error: 'User not found or not registered with Striga' },
        { status: 404 }
      )
    }

    console.log('[Verify Email] Verifying email for user:', user.strigaUserId)

    // Verify email with Striga
    const response = await strigaApiRequest<{ message: string }>('/user/verify-email', {
      method: 'POST',
      body: JSON.stringify({
        userId: user.strigaUserId,
        code: code  // Changed from 'verificationCode' to 'code'
      })
    })

    console.log('[Verify Email] Success:', response)

    // Update user status
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() }
    })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    })
  } catch (error) {
    console.error('[Verify Email] Failed:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}