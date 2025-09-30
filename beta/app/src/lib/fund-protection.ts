import { prisma } from './prisma'

/**
 * Initialize fund protection for FIAT-only transactions
 * Creates steps for buyer to upload proof and seller to confirm receipt
 */
export async function initializeFiatFundProtection(transactionId: string) {
  // Get transaction details
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      buyer: { include: { bankAccount: true } },
      seller: { include: { bankAccount: true, digitalIbans: true } }
    }
  })

  if (!transaction) {
    throw new Error('Transaction not found')
  }

  // Check if already initialized
  const existingSteps = await prisma.fundProtectionStep.findMany({
    where: { transactionId }
  })

  if (existingSteps.length > 0) {
    console.log('Fund protection already initialized for transaction:', transactionId)
    return
  }

  const agreedPrice = parseFloat(transaction.agreedPrice?.toString() || transaction.offerPrice.toString())

  const steps = [
    {
      transactionId,
      stepNumber: 1,
      stepType: 'FIAT_UPLOAD',
      description: `Upload proof of €${agreedPrice.toFixed(2)} bank transfer to seller`,
      userType: 'BUYER',
      status: 'PENDING',
      amount: agreedPrice,
      currency: 'EUR'
    },
    {
      transactionId,
      stepNumber: 2,
      stepType: 'FIAT_CONFIRM',
      description: `Confirm receipt of €${agreedPrice.toFixed(2)} payment`,
      userType: 'SELLER',
      status: 'PENDING',
      amount: agreedPrice,
      currency: 'EUR'
    }
  ]

  await prisma.fundProtectionStep.createMany({
    data: steps
  })

  console.log(`✅ Initialized ${steps.length} FIAT fund protection steps for transaction ${transactionId}`)
}

export async function initializeFundProtection(transactionId: string) {
  // Get transaction with full details
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      buyer: {
        include: {
          wallets: true
        }
      },
      seller: {
        include: {
          wallets: true,
          digitalIbans: true
        }
      },
      property: true
    }
  })

  if (!transaction) {
    throw new Error('Transaction not found')
  }

  // Check if already initialized
  const existingSteps = await prisma.fundProtectionStep.findMany({
    where: { transactionId }
  })

  if (existingSteps.length > 0) {
    console.log('Fund protection already initialized for transaction:', transactionId)
    return
  }

  const paymentMethod = transaction.paymentMethod
  const cryptoPercentage = transaction.cryptoPercentage || 0
  const fiatPercentage = transaction.fiatPercentage || 0

  // For now, use property price as base (in production, use actual agreed amount)
  const propertyPrice = parseFloat(transaction.property.price.toString())

  const steps: any[] = []
  let stepNumber = 1

  // CRYPTO FLOW (if CRYPTO or HYBRID)
  if (paymentMethod === 'CRYPTO' || paymentMethod === 'HYBRID') {
    const cryptoAmount = (propertyPrice * cryptoPercentage) / 100

    // Find buyer's preferred crypto wallet (or default to first one)
    const buyerWallet = transaction.buyer.wallets[0]
    const sellerWallet = transaction.seller.wallets.find(w => w.currency === buyerWallet?.currency) || transaction.seller.wallets[0]

    if (buyerWallet && sellerWallet) {
      // Step 1: Buyer funds platform wallet (auto-detected)
      steps.push({
        transactionId,
        stepNumber: stepNumber++,
        stepType: 'CRYPTO_DEPOSIT',
        description: `Deposit ${buyerWallet.currency} to your platform wallet`,
        userType: 'BUYER',
        status: 'PENDING',
        amount: cryptoAmount,
        currency: buyerWallet.currency,
        fromWalletId: buyerWallet.strigaWalletId
      })

      // Step 2: Buyer transfers to seller
      steps.push({
        transactionId,
        stepNumber: stepNumber++,
        stepType: 'CRYPTO_TRANSFER',
        description: `Transfer ${buyerWallet.currency} to seller`,
        userType: 'BUYER',
        status: 'PENDING',
        amount: cryptoAmount,
        currency: buyerWallet.currency,
        fromWalletId: buyerWallet.strigaWalletId,
        toWalletId: sellerWallet.strigaWalletId
      })

      // Step 3: Seller converts to EUR
      steps.push({
        transactionId,
        stepNumber: stepNumber++,
        stepType: 'CRYPTO_CONVERT',
        description: 'Convert digital assets to EUR',
        userType: 'SELLER',
        status: 'PENDING',
        amount: cryptoAmount,
        currency: buyerWallet.currency,
        fromWalletId: sellerWallet.strigaWalletId
      })

      // Step 4: Seller transfers to personal bank
      const digitalIban = transaction.seller.digitalIbans[0]
      if (digitalIban) {
        steps.push({
          transactionId,
          stepNumber: stepNumber++,
          stepType: 'IBAN_TRANSFER',
          description: 'Transfer EUR to your bank account',
          userType: 'SELLER',
          status: 'PENDING',
          amount: cryptoAmount,
          currency: 'EUR'
        })
      }
    }
  }

  // FIAT FLOW (if FIAT or HYBRID)
  if (paymentMethod === 'FIAT' || paymentMethod === 'HYBRID') {
    const fiatAmount = (propertyPrice * fiatPercentage) / 100

    // Step: Buyer uploads proof
    steps.push({
      transactionId,
      stepNumber: stepNumber++,
      stepType: 'FIAT_UPLOAD',
      description: 'Upload bank transfer proof',
      userType: 'BUYER',
      status: 'PENDING',
      amount: fiatAmount,
      currency: 'EUR'
    })

    // Step: Seller confirms receipt
    steps.push({
      transactionId,
      stepNumber: stepNumber++,
      stepType: 'FIAT_CONFIRM',
      description: 'Confirm receipt of bank transfer',
      userType: 'SELLER',
      status: 'PENDING',
      amount: fiatAmount,
      currency: 'EUR'
    })
  }

  // Create all steps
  if (steps.length > 0) {
    await prisma.fundProtectionStep.createMany({
      data: steps
    })

    console.log(`Initialized ${steps.length} fund protection steps for transaction ${transactionId}`)
  }
}