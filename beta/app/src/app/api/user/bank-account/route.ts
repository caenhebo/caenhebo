import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET - Fetch user's bank account
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const bankAccount = await prisma.bankAccount.findUnique({
      where: { userId: session.user.id }
    })

    return NextResponse.json({ bankAccount })
  } catch (error) {
    console.error('Failed to fetch bank account:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bank account' },
      { status: 500 }
    )
  }
}

// POST - Create new bank account
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { accountHolderName, bankName, iban, swiftCode, bankAddress } = body

    // Validate required fields
    if (!accountHolderName || !bankName || !iban) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if bank account already exists
    const existingAccount = await prisma.bankAccount.findUnique({
      where: { userId: session.user.id }
    })

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Bank account already exists. Use PUT to update.' },
        { status: 400 }
      )
    }

    // Create bank account
    const bankAccount = await prisma.bankAccount.create({
      data: {
        userId: session.user.id,
        accountHolderName,
        bankName,
        iban: iban.replace(/\s/g, '').toUpperCase(),
        swiftCode: swiftCode?.toUpperCase(),
        bankAddress
      }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'Bank Account Added',
        message: 'Your personal bank account has been successfully added.',
        type: 'KYC_UPDATE'
      }
    })

    return NextResponse.json({ bankAccount })
  } catch (error) {
    console.error('Failed to create bank account:', error)
    return NextResponse.json(
      { error: 'Failed to create bank account' },
      { status: 500 }
    )
  }
}

// PUT - Update existing bank account
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { accountHolderName, bankName, iban, swiftCode, bankAddress } = body

    // Validate required fields
    if (!accountHolderName || !bankName || !iban) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update bank account
    const bankAccount = await prisma.bankAccount.upsert({
      where: { userId: session.user.id },
      update: {
        accountHolderName,
        bankName,
        iban: iban.replace(/\s/g, '').toUpperCase(),
        swiftCode: swiftCode?.toUpperCase(),
        bankAddress,
        verified: false // Reset verification on update
      },
      create: {
        userId: session.user.id,
        accountHolderName,
        bankName,
        iban: iban.replace(/\s/g, '').toUpperCase(),
        swiftCode: swiftCode?.toUpperCase(),
        bankAddress
      }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'Bank Account Updated',
        message: 'Your personal bank account details have been updated.',
        type: 'KYC_UPDATE'
      }
    })

    return NextResponse.json({ bankAccount })
  } catch (error) {
    console.error('Failed to update bank account:', error)
    return NextResponse.json(
      { error: 'Failed to update bank account' },
      { status: 500 }
    )
  }
}