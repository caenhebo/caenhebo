import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET - Fetch user's Striga IBAN
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const digitalIban = await prisma.digitalIban.findFirst({
      where: { 
        userId: session.user.id,
        active: true
      }
    })

    if (!digitalIban) {
      return NextResponse.json({ iban: null })
    }

    return NextResponse.json({
      iban: digitalIban.iban,
      bankName: digitalIban.bankName || 'Striga Bank',
      accountNumber: digitalIban.accountNumber
    })
  } catch (error) {
    console.error('Failed to fetch IBAN:', error)
    return NextResponse.json(
      { error: 'Failed to fetch IBAN' },
      { status: 500 }
    )
  }
}