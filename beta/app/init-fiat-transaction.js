const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function initFiat() {
  const transactionId = 'cmg6htwz80007h2vyigovql8o'
  
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      buyer: true,
      seller: { include: { digitalIbans: true, bankAccount: true } }
    }
  })

  if (!transaction) {
    console.error('Transaction not found')
    return
  }

  console.log('Transaction:', {
    id: transaction.id,
    status: transaction.status,
    paymentMethod: transaction.paymentMethod,
    agreedPrice: transaction.agreedPrice?.toString() || transaction.offerPrice.toString()
  })

  console.log('Seller bank details:', {
    digitalIban: transaction.seller.digitalIbans[0]?.iban,
    bankAccount: transaction.seller.bankAccount?.iban
  })

  // Check existing steps
  const existingSteps = await prisma.fundProtectionStep.findMany({
    where: { transactionId }
  })

  if (existingSteps.length > 0) {
    console.log('Steps already exist:', existingSteps.length)
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

  console.log('✅ Created', steps.length, 'fund protection steps')
  console.log('Steps:', steps)
}

initFiat()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
