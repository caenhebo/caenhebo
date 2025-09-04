import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
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
    const { verificationCode } = await req.json()
    
    // In sandbox, the verification code is always "123456"
    const response = await strigaApiRequest('/user/verify-email', {
      method: 'POST',
      body: JSON.stringify({
        userId: session.user.strigaUserId,
        verificationCode: verificationCode || '123456' // Default for sandbox
      })
    })
    
    return NextResponse.json({
      success: true,
      verified: true
    })
  } catch (error) {
    console.error('Email verification failed:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}