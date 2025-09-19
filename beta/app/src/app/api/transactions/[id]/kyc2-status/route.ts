import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const transactionId = params.id

    // Get transaction with buyer and seller KYC info
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        buyer: {
          select: {
            id: true,
            kycStatus: true,
            kyc2Status: true,
            kyc2SessionId: true,
            kyc2CompletedAt: true
          }
        },
        seller: {
          select: {
            id: true,
            kycStatus: true,
            kyc2Status: true,
            kyc2SessionId: true,
            kyc2CompletedAt: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check if user is involved in the transaction
    const isAdmin = session.user.role === 'ADMIN'
    const isBuyer = transaction.buyerId === session.user.id
    const isSeller = transaction.sellerId === session.user.id

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json(
        { error: 'You are not authorized to view this transaction' },
        { status: 403 }
      )
    }

    // Get current user's KYC status
    const currentUser = isBuyer ? transaction.buyer : transaction.seller
    const role = isBuyer ? 'buyer' : 'seller'

    // Check if user can start KYC2
    // For testing, we'll allow starting KYC2 even without KYC1
    const canStartKyc2 = true // Allow for testing
    // In production: currentUser.kycStatus === 'PASSED' && currentUser.kyc2Status === 'PENDING'

    // Mock required documents for KYC2 (in production, this would come from Striga)
    const requiredDocuments = [
      {
        id: 'proof_of_funds',
        name: 'Proof of Funds',
        description: 'Bank statements for the last 3 months',
        uploaded: false,
        verified: false
      },
      {
        id: 'employment_proof',
        name: 'Employment Verification',
        description: 'Employment contract or letter',
        uploaded: false,
        verified: false
      },
      {
        id: 'tax_returns',
        name: 'Tax Returns',
        description: 'Tax returns for the last year',
        uploaded: false,
        verified: false
      },
      {
        id: 'additional_id',
        name: 'Additional ID',
        description: 'Secondary identification document',
        uploaded: false,
        verified: false
      }
    ]

    // Update uploaded/verified status based on KYC2 status
    if (currentUser.kyc2Status === 'INITIATED') {
      // Mark some documents as uploaded when in review
      requiredDocuments[0].uploaded = true
      requiredDocuments[1].uploaded = true
    } else if (currentUser.kyc2Status === 'PASSED') {
      // Mark all documents as uploaded and verified when passed
      requiredDocuments.forEach(doc => {
        doc.uploaded = true
        doc.verified = true
      })
    }

    return NextResponse.json({
      userKycStatus: currentUser.kycStatus,
      userKyc2Status: currentUser.kyc2Status || 'PENDING',
      kycSessionId: currentUser.kyc2SessionId,
      kyc2CompletedAt: currentUser.kyc2CompletedAt,
      canStartKyc2,
      requiredDocuments,
      transactionStatus: transaction.status,
      role,
      // Include both parties' KYC2 status for the transaction
      buyerKyc2Status: transaction.buyer.kyc2Status || 'PENDING',
      sellerKyc2Status: transaction.seller.kyc2Status || 'PENDING',
      buyerKyc2Verified: transaction.buyerKyc2Verified,
      sellerKyc2Verified: transaction.sellerKyc2Verified
    })
  } catch (error) {
    console.error('Failed to get KYC2 status:', error)
    return NextResponse.json(
      { error: 'Failed to get KYC2 status' },
      { status: 500 }
    )
  }
}