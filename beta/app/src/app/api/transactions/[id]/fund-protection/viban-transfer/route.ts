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
        buyer: { include: { digitalIbans: true } },
        seller: { include: { digitalIbans: true } },
        fundProtectionSteps: { orderBy: { stepNumber: 'asc' } }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (session.user.id !== transaction.buyerId) {
      return NextResponse.json({ error: 'Only buyer can perform this action' }, { status: 403 })
    }

    // Find the vIBAN transfer step
    const vibanTransferStep = transaction.fundProtectionSteps.find(
      s => s.stepType === 'VIBAN_TRANSFER' && s.status === 'PENDING'
    )

    if (!vibanTransferStep) {
      return NextResponse.json({ error: 'VIBAN transfer step not found or already completed' }, { status: 400 })
    }

    // Check that conversion step is completed
    const conversionStep = transaction.fundProtectionSteps.find(s => s.stepType === 'CRYPTO_CONVERT_BUYER')
    if (conversionStep?.status !== 'COMPLETED') {
      return NextResponse.json({
        error: 'Please complete crypto conversion before transferring EUR'
      }, { status: 400 })
    }

    const buyerIban = transaction.buyer.digitalIbans?.[0]
    const sellerIban = transaction.seller.digitalIbans?.[0]

    if (!buyerIban || !sellerIban) {
      return NextResponse.json({ error: 'Digital IBAN not found for buyer or seller' }, { status: 400 })
    }

    try {
      const { transferSepa, addSimulationWarning } = await import('@/lib/simulation')

      // Transfer EUR from buyer's vIBAN to seller's vIBAN (supports simulation mode)
      const transferResponse = await transferSepa(
        transaction.buyer.strigaUserId || '',
        buyerIban.strigaAccountId || '',
        sellerIban.iban,
        `${transaction.seller.firstName} ${transaction.seller.lastName}`,
        parseFloat(vibanTransferStep.amount?.toString() || '0'),
        `Transaction ${transactionId.slice(0, 8)}`
      )

      console.log('✅ vIBAN transfer successful:', transferResponse)

      // Mark transfer step as completed
      await prisma.fundProtectionStep.update({
        where: { id: vibanTransferStep.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          txHash: transferResponse.transactionId || transferResponse.id
        }
      })

      // Update balances
      const transferAmount = parseFloat(vibanTransferStep.amount?.toString() || '0')

      await prisma.digitalIban.update({
        where: { id: buyerIban.id },
        data: {
          balance: {
            decrement: transferAmount
          }
        }
      })

      await prisma.digitalIban.update({
        where: { id: sellerIban.id },
        data: {
          balance: {
            increment: transferAmount
          }
        }
      })

      // Create notification for seller
      await prisma.notification.create({
        data: {
          userId: transaction.sellerId,
          type: 'TRANSACTION_STATUS_CHANGE',
          title: 'Payment Received in Your vIBAN',
          message: `Buyer transferred €${transferAmount.toFixed(2)} to your digital IBAN`,
          transactionId: transactionId
        }
      })

      return NextResponse.json(addSimulationWarning({
        success: true,
        message: 'Transfer successful! EUR sent to seller\'s vIBAN',
        transferId: transferResponse.transactionId,
        amount: transferAmount
      }))

    } catch (error) {
      console.error('vIBAN transfer error:', error)
      return NextResponse.json({
        error: `Failed to transfer EUR: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, { status: 500 })
    }

  } catch (error) {
    console.error('VIBAN transfer error:', error)
    return NextResponse.json(
      { error: 'Failed to process vIBAN transfer' },
      { status: 500 }
    )
  }
}