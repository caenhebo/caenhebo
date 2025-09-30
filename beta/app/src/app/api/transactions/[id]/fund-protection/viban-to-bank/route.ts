import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

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

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        seller: { include: { digitalIbans: true, bankAccount: true } },
        fundProtectionSteps: { orderBy: { stepNumber: 'asc' } }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (session.user.id !== transaction.sellerId) {
      return NextResponse.json({ error: 'Only seller can perform this action' }, { status: 403 })
    }

    // Find the vIBAN to bank transfer step
    const vibanToBankStep = transaction.fundProtectionSteps.find(
      s => s.stepType === 'VIBAN_TO_BANK' && s.status === 'PENDING'
    )

    if (!vibanToBankStep) {
      return NextResponse.json({ error: 'VIBAN to bank transfer step not found or already completed' }, { status: 400 })
    }

    // Check that buyer's vIBAN transfer step is completed
    const buyerVibanTransferStep = transaction.fundProtectionSteps.find(s => s.stepType === 'VIBAN_TRANSFER')
    if (buyerVibanTransferStep?.status !== 'COMPLETED') {
      return NextResponse.json({
        error: 'Waiting for buyer to transfer EUR to your vIBAN first'
      }, { status: 400 })
    }

    const sellerIban = transaction.seller.digitalIbans?.[0]
    const sellerBankAccount = transaction.seller.bankAccount

    if (!sellerIban) {
      return NextResponse.json({ error: 'Digital IBAN not found for seller' }, { status: 400 })
    }

    if (!sellerBankAccount || !sellerBankAccount.iban) {
      return NextResponse.json({
        error: 'Personal bank account not configured. Please add your bank account details in settings.'
      }, { status: 400 })
    }

    try {
      const { transferSepa, addSimulationWarning } = await import('@/lib/simulation')

      // Transfer EUR from seller's vIBAN to their personal bank account (supports simulation mode)
      const transferResponse = await transferSepa(
        transaction.seller.strigaUserId || '',
        sellerIban.strigaAccountId || '',
        sellerBankAccount.iban,
        sellerBankAccount.accountHolderName,
        parseFloat(vibanToBankStep.amount?.toString() || '0'),
        `Property Sale ${transactionId.slice(0, 8)}`
      )

      console.log('✅ vIBAN to bank transfer successful:', transferResponse)

      // Mark transfer step as completed
      await prisma.fundProtectionStep.update({
        where: { id: vibanToBankStep.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          txHash: transferResponse.transactionId || transferResponse.id
        }
      })

      // Update seller's vIBAN balance
      const transferAmount = parseFloat(vibanToBankStep.amount?.toString() || '0')

      await prisma.digitalIban.update({
        where: { id: sellerIban.id },
        data: {
          balance: {
            decrement: transferAmount
          }
        }
      })

      // Check if all fund protection steps are completed
      const allSteps = transaction.fundProtectionSteps
      const allCompleted = allSteps.every(step => {
        if (step.id === vibanToBankStep.id) return true // This step just completed
        return step.status === 'COMPLETED'
      })

      // If all steps are complete, advance transaction to CLOSING
      if (allCompleted) {
        await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'CLOSING'
          }
        })

        await prisma.transactionStatusHistory.create({
          data: {
            transactionId,
            fromStatus: 'FUND_PROTECTION',
            toStatus: 'CLOSING',
            notes: 'All fund protection steps completed successfully'
          }
        })
      }

      // Create notification for buyer
      await prisma.notification.create({
        data: {
          userId: transaction.buyerId,
          type: 'TRANSACTION_STATUS_CHANGE',
          title: 'Seller Received Payment',
          message: `Seller transferred €${transferAmount.toFixed(2)} to their bank account. ${allCompleted ? 'Transaction advancing to closing stage.' : ''}`,
          transactionId: transactionId
        }
      })

      return NextResponse.json(addSimulationWarning({
        success: true,
        message: 'Transfer successful! EUR sent to your personal bank account',
        transferId: transferResponse.transactionId,
        amount: transferAmount,
        allStepsCompleted: allCompleted
      }))

    } catch (error) {
      console.error('vIBAN to bank transfer error:', error)
      return NextResponse.json({
        error: `Failed to transfer EUR: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, { status: 500 })
    }

  } catch (error) {
    console.error('VIBAN to bank transfer error:', error)
    return NextResponse.json(
      { error: 'Failed to process vIBAN to bank transfer' },
      { status: 500 }
    )
  }
}