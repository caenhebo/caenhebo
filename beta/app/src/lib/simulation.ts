/**
 * SIMULATION MODE
 *
 * Easy to enable/disable for testing without real Striga API calls.
 * To disable: Set ENABLE_SIMULATION_MODE=false in .env
 * To remove completely: Delete this file and remove all imports
 */

export const SIMULATION_ENABLED = process.env.ENABLE_SIMULATION_MODE === 'true'

/**
 * Simulated wallet balances for testing
 */
export const SIMULATED_BALANCES: { [key: string]: number } = {
  'BTC': 0.5,      // 0.5 BTC (enough for testing)
  'ETH': 10,       // 10 ETH
  'USDC': 50000,   // $50k USDC
  'USDT': 50000,   // $50k USDT
  'BNB': 100,      // 100 BNB
  'SOL': 1000,     // 1000 SOL
  'POL': 10000,    // 10000 POL
  'EUR': 100000    // €100k
}

/**
 * Check if wallet has sufficient balance (real or simulated)
 */
export async function checkWalletBalance(
  currency: string,
  requiredAmount: number,
  strigaWalletId?: string
): Promise<{ available: number; sufficient: boolean }> {
  if (SIMULATION_ENABLED) {
    console.log(`🎭 [SIMULATION] Checking ${currency} balance: Required ${requiredAmount}`)
    const available = SIMULATED_BALANCES[currency] || 0
    return {
      available,
      sufficient: available >= requiredAmount
    }
  }

  // Real Striga API call
  if (!strigaWalletId) {
    throw new Error('Striga wallet ID required for real balance check')
  }

  const { strigaApiRequest } = await import('./striga')
  const response = await strigaApiRequest(`/wallets/account/get/${strigaWalletId}`, {
    method: 'GET'
  })

  const available = parseFloat(response.availableBalance?.amount || '0')
  return {
    available,
    sufficient: available >= requiredAmount
  }
}

/**
 * Simulate crypto to EUR conversion
 */
export async function convertCryptoToEur(
  userId: string,
  sourceAccountId: string,
  destinationAccountId: string,
  amount: number,
  sourceCurrency: string
): Promise<{ exchangeId: string; destinationAmount: number; conversionRate: number }> {
  if (SIMULATION_ENABLED) {
    console.log(`🎭 [SIMULATION] Converting ${amount} ${sourceCurrency} to EUR`)

    // Simulated exchange rates (approximate)
    const rates: { [key: string]: number } = {
      'BTC': 40000,
      'ETH': 2500,
      'USDC': 0.95,
      'USDT': 0.95,
      'BNB': 300,
      'SOL': 100,
      'POL': 0.50
    }

    const rate = rates[sourceCurrency] || 1
    const destinationAmount = amount * rate

    return {
      exchangeId: `SIM-${Date.now()}`,
      destinationAmount,
      conversionRate: rate
    }
  }

  // Real Striga API call
  const { strigaApiRequest } = await import('./striga')
  const response = await strigaApiRequest('/trade/exchange', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      sourceAccountId,
      destinationAccountId,
      amount: amount.toString(),
      sourceCurrency,
      destinationCurrency: 'EUR'
    })
  })

  return {
    exchangeId: response.exchangeId || response.id,
    destinationAmount: parseFloat(response.destinationAmount),
    conversionRate: parseFloat(response.rate || response.price)
  }
}

/**
 * Simulate SEPA transfer (vIBAN to vIBAN or vIBAN to bank)
 */
export async function transferSepa(
  userId: string,
  sourceAccountId: string,
  destinationIban: string,
  destinationName: string,
  amount: number,
  reference: string
): Promise<{ transactionId: string; status: string }> {
  if (SIMULATION_ENABLED) {
    console.log(`🎭 [SIMULATION] SEPA transfer: €${amount} to ${destinationIban}`)

    return {
      transactionId: `SIM-SEPA-${Date.now()}`,
      status: 'COMPLETED'
    }
  }

  // Real Striga API call
  const { strigaApiRequest } = await import('./striga')
  const response = await strigaApiRequest('/transfer/SEPA/send', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      sourceAccountId,
      whitelisted: {
        iban: destinationIban,
        name: destinationName,
        currency: 'EUR'
      },
      amount: amount.toString(),
      reference
    })
  })

  return {
    transactionId: response.transactionId || response.id,
    status: response.status || 'PENDING'
  }
}

/**
 * Get simulated or real exchange rates
 */
export async function getExchangeRates(): Promise<{ [key: string]: { sell: number; buy: number } }> {
  if (SIMULATION_ENABLED) {
    console.log('🎭 [SIMULATION] Fetching exchange rates')

    return {
      'BTCEUR': { sell: 40000, buy: 39500 },
      'ETHEUR': { sell: 2500, buy: 2480 },
      'USDCEUR': { sell: 0.95, buy: 0.94 },
      'USDTEUR': { sell: 0.95, buy: 0.94 },
      'BNBEUR': { sell: 300, buy: 295 },
      'SOLEUR': { sell: 100, buy: 98 },
      'POLEUR': { sell: 0.50, buy: 0.49 }
    }
  }

  // Real Striga API call
  const { strigaApiRequest } = await import('./striga')
  return await strigaApiRequest('/trade/rates', {
    method: 'POST',
    body: JSON.stringify({})
  })
}

/**
 * Helper to add simulation warning to responses
 */
export function addSimulationWarning<T>(data: T): T & { simulationMode?: boolean } {
  if (SIMULATION_ENABLED) {
    return {
      ...data,
      simulationMode: true
    }
  }
  return data
}