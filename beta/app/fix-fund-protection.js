const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function initializeFundProtection(transactionId) {
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

  console.log('Transaction found:', transactionId)
  console.log('Payment method:', transaction.paymentMethod)
  console.log('Crypto %:', transaction.cryptoPercentage)
  console.log('Fiat %:', transaction.fiatPercentage)

  // Check if already initialized
  const existingSteps = await prisma.fundProtectionStep.findMany({
    where: { transactionId }
  })

  if (existingSteps.length > 0) {
    console.log('Fund protection already initialized:', existingSteps.length, 'steps')
    return
  }

  const paymentMethod = transaction.paymentMethod
  const cryptoPercentage = transaction.cryptoPercentage || 0
  const fiatPercentage = transaction.fiatPercentage || 0

  const propertyPrice = parseFloat(transaction.property.price.toString())
  console.log('Property price:', propertyPrice)

  const steps = []
  let stepNumber = 1

  // CRYPTO FLOW (if CRYPTO or HYBRID)
  if (paymentMethod === 'CRYPTO' || paymentMethod === 'HYBRID') {
    const cryptoAmount = (propertyPrice * cryptoPercentage) / 100
    console.log('Crypto amount:', cryptoAmount)

    const buyerWallet = transaction.buyer.wallets[0]
    const sellerWallet = transaction.seller.wallets.find(w => w.currency === buyerWallet?.currency) || transaction.seller.wallets[0]

    console.log('Buyer wallet:', buyerWallet?.currency, buyerWallet?.strigaWalletId)
    console.log('Seller wallet:', sellerWallet?.currency, sellerWallet?.strigaWalletId)

    if (buyerWallet && sellerWallet) {
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
    console.log('Fiat amount:', fiatAmount)

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
    console.log(`Creating ${steps.length} fund protection steps...`)
    await prisma.fundProtectionStep.createMany({
      data: steps
    })
    console.log('✅ Fund protection initialized successfully!')
  } else {
    console.log('⚠️  No steps to create')
  }
}

async function main() {
  const transactionId = process.argv[2] || 'cmfz7974t0001h2zasvuvka3a'
  console.log('Initializing fund protection for transaction:', transactionId)
  await initializeFundProtection(transactionId)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())