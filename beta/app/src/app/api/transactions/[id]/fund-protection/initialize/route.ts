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
    const { currency } = await request.json()

    if (!currency || !['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'SOL', 'POL'].includes(currency)) {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        buyer: { include: { wallets: true } },
        seller: { include: { wallets: true, digitalIbans: true } }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (session.user.id !== transaction.buyerId) {
      return NextResponse.json({ error: 'Only buyer can initialize payment' }, { status: 403 })
    }

    if (transaction.status !== 'FUND_PROTECTION') {
      return NextResponse.json({ error: 'Transaction not in fund protection stage' }, { status: 400 })
    }

    // Delete existing steps first
    await prisma.fundProtectionStep.deleteMany({
      where: { transactionId }
    })

    // Get wallets
    const buyerWallet = transaction.buyer.wallets.find(w => w.currency === currency)
    const sellerWallet = transaction.seller.wallets.find(w => w.currency === currency)

    if (!buyerWallet || !sellerWallet) {
      return NextResponse.json({ error: `Wallet not found for ${currency}` }, { status: 400 })
    }

    // Generate blockchain address for buyer if it doesn't exist
    if (!buyerWallet.address) {
      try {
        const { strigaApiRequest } = await import('@/lib/striga')

        // Use the correct Striga endpoint: /wallets/account/enrich
        const addressResponse = await strigaApiRequest('/wallets/account/enrich', {
          method: 'POST',
          body: JSON.stringify({
            userId: transaction.buyer.strigaUserId,
            accountId: buyerWallet.strigaWalletId
          })
        })

        // Extract address from response
        let depositAddress = null
        if (addressResponse.blockchainDepositAddress) {
          depositAddress = addressResponse.blockchainDepositAddress
        } else if (addressResponse.blockchainNetworks && addressResponse.blockchainNetworks.length > 0) {
          // For multi-chain currencies like USDC
          depositAddress = addressResponse.blockchainNetworks[0].blockchainDepositAddress
        }

        if (depositAddress) {
          await prisma.wallet.update({
            where: { id: buyerWallet.id },
            data: { address: depositAddress }
          })
          buyerWallet.address = depositAddress
          console.log(`✅ Generated ${currency} deposit address for buyer: ${depositAddress}`)
        } else {
          console.warn(`⚠️  Striga did not return blockchain address for ${currency}. Response:`, addressResponse)
          return NextResponse.json({
            error: `Unable to generate ${currency} deposit address. Please try again later or contact support.`
          }, { status: 500 })
        }
      } catch (error) {
        console.error(`Failed to enrich buyer ${currency} wallet:`, error)
        return NextResponse.json({
          error: `Unable to initialize payment. Striga API error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 500 })
      }
    }

    // Generate blockchain address for seller if it doesn't exist
    if (!sellerWallet.address) {
      try {
        const { strigaApiRequest } = await import('@/lib/striga')

        // Use the correct Striga endpoint: /wallets/account/enrich
        const addressResponse = await strigaApiRequest('/wallets/account/enrich', {
          method: 'POST',
          body: JSON.stringify({
            userId: transaction.seller.strigaUserId,
            accountId: sellerWallet.strigaWalletId
          })
        })

        // Extract address from response
        let depositAddress = null
        if (addressResponse.blockchainDepositAddress) {
          depositAddress = addressResponse.blockchainDepositAddress
        } else if (addressResponse.blockchainNetworks && addressResponse.blockchainNetworks.length > 0) {
          depositAddress = addressResponse.blockchainNetworks[0].blockchainDepositAddress
        }

        if (depositAddress) {
          await prisma.wallet.update({
            where: { id: sellerWallet.id },
            data: { address: depositAddress }
          })
          sellerWallet.address = depositAddress
          console.log(`✅ Generated ${currency} deposit address for seller: ${depositAddress}`)
        } else {
          console.warn(`⚠️  Striga did not return blockchain address for ${currency}. Response:`, addressResponse)
          return NextResponse.json({
            error: `Unable to generate ${currency} deposit address. Please try again later or contact support.`
          }, { status: 500 })
        }
      } catch (error) {
        console.error(`Failed to enrich seller ${currency} wallet:`, error)
        return NextResponse.json({
          error: `Unable to initialize payment. Striga API error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 500 })
      }
    }

    // Calculate EUR amounts
    const agreedPrice = parseFloat(transaction.agreedPrice?.toString() || '0')

    // If percentages are not set, infer from payment method
    let cryptoPercentage = transaction.cryptoPercentage
    let fiatPercentage = transaction.fiatPercentage

    if (cryptoPercentage === null || cryptoPercentage === undefined) {
      if (transaction.paymentMethod === 'CRYPTO') {
        cryptoPercentage = 100
        fiatPercentage = 0
      } else if (transaction.paymentMethod === 'FIAT') {
        cryptoPercentage = 0
        fiatPercentage = 100
      } else if (transaction.paymentMethod === 'HYBRID') {
        // Default 50/50 split for hybrid
        cryptoPercentage = 50
        fiatPercentage = 50
      }
    }

    const cryptoEurAmount = (agreedPrice * (cryptoPercentage || 0)) / 100
    const fiatEurAmount = (agreedPrice * (fiatPercentage || 0)) / 100

    // Fetch live exchange rates from Striga
    let cryptoAmount = cryptoEurAmount
    let exchangeRate = 1

    try {
      const { strigaApiRequest } = await import('@/lib/striga')
      const rates = await strigaApiRequest<any>('/trade/rates', {
        method: 'POST',
        body: JSON.stringify({})
      })

      // Get the rate for the selected currency
      const rateKey = `${currency}EUR`
      if (rates[rateKey]) {
        // Use the 'sell' rate (what the user needs to pay)
        exchangeRate = parseFloat(rates[rateKey].sell || rates[rateKey].price)
        // Calculate how much crypto for the EUR amount
        cryptoAmount = cryptoEurAmount / exchangeRate

        console.log(`💱 Exchange Rate: 1 ${currency} = €${exchangeRate}`)
        console.log(`💰 Converting €${cryptoEurAmount} to ${cryptoAmount.toFixed(8)} ${currency}`)
      } else {
        console.warn(`⚠️  No exchange rate found for ${currency}, using 1:1`)
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error)
      // Fallback to 1:1 if rate fetch fails
      console.warn('Using fallback 1:1 exchange rate')
    }

    const steps = []
    let stepNumber = 1

    // CRYPTO FLOW - NEW SAFER PROCESS
    if (transaction.paymentMethod === 'CRYPTO' || transaction.paymentMethod === 'HYBRID') {
      if (cryptoEurAmount > 0) {
        // Calculate test deposit amount (€100 worth of crypto)
        const testDepositEur = 100
        const testDepositCrypto = testDepositEur / exchangeRate

        // BUYER STEPS
        // Step 1: Test deposit €100 to verify wallet address works
        steps.push({
          transactionId,
          stepNumber: stepNumber++,
          stepType: 'CRYPTO_TEST_DEPOSIT',
          description: `Test deposit: Send €${testDepositEur} (${testDepositCrypto.toFixed(8)} ${currency}) to your platform wallet`,
          userType: 'BUYER',
          status: 'PENDING',
          amount: testDepositCrypto,
          currency,
          fromWalletId: buyerWallet.strigaWalletId
        })

        // Step 2: Full deposit remaining amount
        const remainingAmount = cryptoAmount - testDepositCrypto
        steps.push({
          transactionId,
          stepNumber: stepNumber++,
          stepType: 'CRYPTO_DEPOSIT',
          description: `Deposit remaining ${remainingAmount.toFixed(8)} ${currency} to your platform wallet`,
          userType: 'BUYER',
          status: 'PENDING',
          amount: remainingAmount,
          currency,
          fromWalletId: buyerWallet.strigaWalletId
        })

        // Step 3: Convert crypto to EUR in buyer's vIBAN
        steps.push({
          transactionId,
          stepNumber: stepNumber++,
          stepType: 'CRYPTO_CONVERT_BUYER',
          description: `Convert ${cryptoAmount.toFixed(8)} ${currency} to €${cryptoEurAmount.toFixed(2)} in your vIBAN`,
          userType: 'BUYER',
          status: 'PENDING',
          amount: cryptoAmount,
          currency,
          fromWalletId: buyerWallet.strigaWalletId
        })

        // Step 4: Transfer EUR from buyer's vIBAN to seller's vIBAN
        steps.push({
          transactionId,
          stepNumber: stepNumber++,
          stepType: 'VIBAN_TRANSFER',
          description: `Transfer €${cryptoEurAmount.toFixed(2)} from your vIBAN to seller's vIBAN`,
          userType: 'BUYER',
          status: 'PENDING',
          amount: cryptoEurAmount,
          currency: 'EUR'
        })

        // SELLER STEPS
        // Step 5: Transfer EUR from seller's vIBAN to personal bank account
        steps.push({
          transactionId,
          stepNumber: stepNumber++,
          stepType: 'VIBAN_TO_BANK',
          description: `Transfer €${cryptoEurAmount.toFixed(2)} from your vIBAN to your personal bank account`,
          userType: 'SELLER',
          status: 'PENDING',
          amount: cryptoEurAmount,
          currency: 'EUR'
        })
      }
    }

    // FIAT FLOW
    if (transaction.paymentMethod === 'FIAT' || transaction.paymentMethod === 'HYBRID') {
      if (fiatEurAmount > 0) {
        steps.push({
          transactionId,
          stepNumber: stepNumber++,
          stepType: 'FIAT_UPLOAD',
          description: `Upload proof of €${fiatEurAmount.toFixed(2)} bank transfer`,
          userType: 'BUYER',
          status: 'PENDING',
          amount: fiatEurAmount,
          currency: 'EUR'
        })

        steps.push({
          transactionId,
          stepNumber: stepNumber++,
          stepType: 'FIAT_CONFIRM',
          description: `Confirm receipt of €${fiatEurAmount.toFixed(2)}`,
          userType: 'SELLER',
          status: 'PENDING',
          amount: fiatEurAmount,
          currency: 'EUR'
        })
      }
    }

    // Create all steps
    await prisma.fundProtectionStep.createMany({
      data: steps
    })

    return NextResponse.json({
      success: true,
      message: 'Payment initialized successfully',
      currency,
      cryptoAmount: cryptoAmount.toString(),
      fiatAmount: fiatEurAmount.toString(),
      totalSteps: steps.length
    })

  } catch (error) {
    console.error('Initialize fund protection error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}
