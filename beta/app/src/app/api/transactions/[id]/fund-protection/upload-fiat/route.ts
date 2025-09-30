import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transactionId = params.id

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        fundProtectionSteps: {
          orderBy: { stepNumber: 'asc' }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Verify user is buyer
    if (session.user.id !== transaction.buyerId) {
      return NextResponse.json({ error: 'Only buyer can upload proof' }, { status: 403 })
    }

    // Initialize steps if they don't exist (for immediate upload after entering FUND_PROTECTION)
    if (transaction.fundProtectionSteps.length === 0) {
      const { initializeFiatFundProtection } = await import('@/lib/fund-protection')
      try {
        await initializeFiatFundProtection(transactionId)
        // Refetch transaction with steps
        const updatedTransaction = await prisma.transaction.findUnique({
          where: { id: transactionId },
          include: {
            fundProtectionSteps: {
              orderBy: { stepNumber: 'asc' }
            }
          }
        })
        if (updatedTransaction) {
          transaction.fundProtectionSteps = updatedTransaction.fundProtectionSteps
        }
      } catch (error) {
        console.error('Failed to initialize steps:', error)
        return NextResponse.json({ error: 'Failed to initialize payment steps' }, { status: 500 })
      }
    }

    // Find the FIAT_UPLOAD step
    const uploadStep = transaction.fundProtectionSteps.find(s => s.stepType === 'FIAT_UPLOAD')

    if (!uploadStep) {
      return NextResponse.json({ error: 'Fiat upload step not found' }, { status: 404 })
    }

    if (uploadStep.status !== 'PENDING') {
      return NextResponse.json({ error: 'Already uploaded' }, { status: 400 })
    }

    // Get file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Only JPG, PNG, and PDF allowed'
      }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uniqueId = nanoid()
    const extension = file.name.split('.').pop()
    const filename = `fiat_proof_${transactionId}_${uniqueId}.${extension}`
    const uploadDir = join(process.cwd(), 'uploads', 'fiat-proofs')
    const filePath = join(uploadDir, filename)

    // Ensure directory exists
    const fs = require('fs')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    await writeFile(filePath, buffer)

    // Update the step
    await prisma.fundProtectionStep.update({
      where: { id: uploadStep.id },
      data: {
        status: 'COMPLETED',
        proofUrl: `/uploads/fiat-proofs/${filename}`,
        completedAt: new Date()
      }
    })

    // Notify seller
    await prisma.notification.create({
      data: {
        userId: transaction.sellerId,
        type: 'TRANSACTION_STATUS_CHANGE',
        title: 'Payment Proof Uploaded',
        message: 'Buyer uploaded proof of bank transfer. Please review and confirm.',
        transactionId: transactionId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Proof uploaded successfully',
      filename: filename
    })

  } catch (error: any) {
    console.error('Fiat upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    )
  }
}