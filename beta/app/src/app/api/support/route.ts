import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { sendSupportEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to submit a support request.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { subject, message } = body

    // Validate input
    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required.' },
        { status: 400 }
      )
    }

    if (subject.length > 200) {
      return NextResponse.json(
        { error: 'Subject must be less than 200 characters.' },
        { status: 400 }
      )
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'Message must be less than 5000 characters.' },
        { status: 400 }
      )
    }

    // Send support email
    await sendSupportEmail({
      from: session.user.email,
      subject,
      message,
      userEmail: session.user.email,
    })

    return NextResponse.json({
      success: true,
      message: 'Your support request has been submitted successfully.',
    })
  } catch (error) {
    console.error('Error submitting support request:', error)
    return NextResponse.json(
      { error: 'Failed to submit support request. Please try again later.' },
      { status: 500 }
    )
  }
}
