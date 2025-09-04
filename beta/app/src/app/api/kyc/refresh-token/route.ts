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
    // Get user with Striga ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        strigaUserId: true,
        kycStatus: true
      }
    })

    if (!user || !user.strigaUserId) {
      return NextResponse.json(
        { error: 'User not registered with Striga' },
        { status: 400 }
      )
    }

    console.log('[Refresh Token] Getting new KYC token for user:', user.strigaUserId)

    // Get a fresh token from Striga
    const { kycUrl, sessionId, token } = await initiateKYC(user.strigaUserId)
    
    // Update the session ID in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        kycSessionId: sessionId
      }
    })

    console.log('[Refresh Token] New token obtained:', token.substring(0, 50) + '...')

    return NextResponse.json({
      success: true,
      token,
      sessionId
    })
  } catch (error) {
    console.error('[Refresh Token] Failed:', error)
    return NextResponse.json(
      { error: 'Failed to refresh KYC token' },
      { status: 500 }
    )
  }
}