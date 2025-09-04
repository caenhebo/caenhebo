import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getUnreadNotificationCount } from '@/lib/notifications'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const count = await getUnreadNotificationCount(session.user.id)

    return NextResponse.json({
      success: true,
      unreadCount: count
    })

  } catch (error) {
    console.error('Get unread count error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unread notification count' },
      { status: 500 }
    )
  }
}