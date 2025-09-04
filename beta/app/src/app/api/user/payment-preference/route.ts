import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  paymentPreference: z.enum(['CRYPTO', 'FIAT', 'HYBRID'])
})

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Only buyers can update payment preference
  if (session.user.role !== 'BUYER') {
    return NextResponse.json(
      { error: 'Only buyers can update payment preference' },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const { paymentPreference } = updateSchema.parse(body)

    // Update user's payment preference
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { paymentPreference },
      select: {
        id: true,
        paymentPreference: true
      }
    })

    return NextResponse.json({
      success: true,
      paymentPreference: updatedUser.paymentPreference
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payment preference' },
        { status: 400 }
      )
    }
    
    console.error('Failed to update payment preference:', error)
    return NextResponse.json(
      { error: 'Failed to update payment preference' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { paymentPreference: true }
    })

    return NextResponse.json({
      paymentPreference: user?.paymentPreference || 'FIAT'
    })
  } catch (error) {
    console.error('Failed to fetch payment preference:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment preference' },
      { status: 500 }
    )
  }
}