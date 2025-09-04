import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { createIbanIfNeeded } from '@/lib/auto-create-iban'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('[Create Missing IBANs] Starting process...')
    
    // Find all users with approved KYC but no IBAN
    const usersWithoutIban = await prisma.user.findMany({
      where: {
        kycStatus: 'PASSED',
        strigaUserId: { not: null },
        digitalIbans: {
          none: {
            active: true
          }
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    })
    
    console.log(`[Create Missing IBANs] Found ${usersWithoutIban.length} users without IBAN`)
    
    const results = []
    
    for (const user of usersWithoutIban) {
      try {
        console.log(`[Create Missing IBANs] Processing user: ${user.email}`)
        const iban = await createIbanIfNeeded(user.id)
        
        results.push({
          userId: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          success: !!iban,
          iban: iban?.iban
        })
      } catch (error) {
        console.error(`[Create Missing IBANs] Failed for user ${user.email}:`, error)
        results.push({
          userId: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    
    return NextResponse.json({
      message: `Processed ${usersWithoutIban.length} users`,
      successCount,
      failureCount: usersWithoutIban.length - successCount,
      results
    })
    
  } catch (error) {
    console.error('[Create Missing IBANs] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create missing IBANs' },
      { status: 500 }
    )
  }
}