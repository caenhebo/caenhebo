import crypto from 'crypto'

// Striga API Configuration
const STRIGA_CONFIG = {
  sandbox: {
    baseUrl: process.env.STRIGA_API_URL || process.env.STRIGA_BASE_URL || 'https://www.sandbox.striga.com/api/v1',
    apiKey: process.env.STRIGA_API_KEY,
    secret: process.env.STRIGA_API_SECRET || process.env.STRIGA_SECRET // Support both for backward compatibility
  },
  production: {
    baseUrl: process.env.STRIGA_API_URL || process.env.STRIGA_BASE_URL || 'https://www.sandbox.striga.com/api/v1',
    apiKey: process.env.STRIGA_API_KEY || process.env.STRIGA_PROD_API_KEY,
    secret: process.env.STRIGA_API_SECRET || process.env.STRIGA_PROD_API_SECRET || process.env.STRIGA_PROD_SECRET
  }
}

// Use sandbox for now since we're testing
const config = STRIGA_CONFIG.sandbox

// Error class for Striga API errors
export class StrigaAPIError extends Error {
  constructor(
    public statusCode: number,
    public strigaCode: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'StrigaAPIError'
  }
}

// Rate limiter (10 requests per second as per Striga docs)
class RateLimiter {
  private tokens: number = 10
  private lastRefill: number = Date.now()
  private interval: number = 100 // 100ms between tokens

  async removeTokens(count: number = 1): Promise<void> {
    const now = Date.now()
    const timePassed = now - this.lastRefill
    const tokensToAdd = Math.floor(timePassed / this.interval)
    
    this.tokens = Math.min(10, this.tokens + tokensToAdd)
    this.lastRefill = now

    if (this.tokens < count) {
      const waitTime = (count - this.tokens) * this.interval
      await new Promise(resolve => setTimeout(resolve, waitTime))
      this.tokens = Math.max(0, this.tokens - count)
    } else {
      this.tokens -= count
    }
  }
}

const rateLimiter = new RateLimiter()

// Main Striga API request function with HMAC authentication
export async function strigaApiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  // Check if API credentials are configured
  if (!config.apiKey || !config.secret) {
    throw new Error('Striga API credentials are not configured. Please set STRIGA_API_KEY and STRIGA_API_SECRET in your environment variables.')
  }
  
  await rateLimiter.removeTokens(1)

  const timestamp = Date.now().toString()
  const method = options.method || 'GET'
  const body = options.body || '{}'
  
  // Create HMAC signature according to Striga docs
  const hmac = crypto.createHmac('sha256', config.secret)
  
  // Add components in order: timestamp, method, endpoint, content hash
  hmac.update(timestamp)
  hmac.update(method)
  hmac.update(endpoint) // Without /api/v1 prefix
  
  // Create MD5 hash of body
  const contentHash = crypto.createHash('md5')
  contentHash.update(body)
  hmac.update(contentHash.digest('hex'))
  
  // Final auth header format: HMAC timestamp:signature
  const signature = hmac.digest('hex')
  const authHeader = `HMAC ${timestamp}:${signature}`

  const headers = {
    'authorization': authHeader,
    'api-key': config.apiKey!,
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Log request details for debugging
  console.log(`[Striga API] ${method} ${endpoint}`, {
    body: body === '{}' ? undefined : JSON.parse(body),
    timestamp: new Date().toISOString()
  })

  try {
    const response = await fetch(`${config.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData: any = {}
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      
      console.error(`[Striga API] Error ${response.status}:`, {
        endpoint,
        method,
        status: response.status,
        error: errorData,
        requestBody: body === '{}' ? undefined : JSON.parse(body),
        errorDetails: errorData.details || errorData.validation || errorData.message
      })
      
      throw new StrigaAPIError(
        response.status,
        errorData.code || 'UNKNOWN',
        errorData.message || errorData.error || errorText || 'Striga API error',
        errorData
      )
    }

    // Check if response is JSON or plain text
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    } else {
      // For non-JSON responses like /ping endpoint
      return response.text() as unknown as T
    }
  } catch (error) {
    console.error(`[Striga API] ${method} ${endpoint}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    })
    throw error
  }
}

// User Management
export interface StrigaUserData {
  firstName: string
  lastName: string
  email: string
  mobile: {
    countryCode: string
    number: string
  }
  address?: {
    addressLine1: string
    addressLine2?: string
    city: string
    state?: string
    postalCode: string
    country: string
  }
  dateOfBirth?: string // YYYY-MM-DD format
}

export async function createStrigaUser(userData: any): Promise<any> {
  try {
    // Parse date of birth into year, month, day
    const dobDate = new Date(userData.dateOfBirth)
    const dateOfBirth = {
      year: dobDate.getFullYear(),
      month: dobDate.getMonth() + 1, // JavaScript months are 0-indexed
      day: dobDate.getDate()
    }
    
    // Format address properly - remove empty addressLine2
    const address: any = {
      addressLine1: userData.address.addressLine1,
      city: userData.address.city,
      postalCode: userData.address.postalCode,
      country: userData.address.country
    }
    
    // Only add addressLine2 if it exists and is not empty
    if (userData.address.addressLine2 && userData.address.addressLine2.trim() !== '') {
      address.addressLine2 = userData.address.addressLine2
    }
    
    // Format the user data according to Striga API
    const formattedData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      mobile: userData.mobile,
      dateOfBirth,
      address
    }
    
    console.log('[Striga] Creating user with data:', {
      ...formattedData,
      mobile: {
        countryCode: userData.mobile.countryCode,
        number: userData.mobile.number,
        numberLength: userData.mobile.number.length
      }
    })
    
    const response = await strigaApiRequest<any>('/user/create', {
      method: 'POST',
      body: JSON.stringify(formattedData)
    })
    
    console.log('[Striga] User created successfully:', response)
    return response
  } catch (error) {
    console.error('[Striga] User creation failed:', error)
    throw error
  }
}

// KYC Management
export async function initiateKYC(strigaUserId: string): Promise<{
  kycUrl: string
  sessionId: string
  token: string
}> {
  try {
    const response = await strigaApiRequest<{
      provider: string
      token: string
      userId: string
    }>('/user/kyc/start', {
      method: 'POST',
      body: JSON.stringify({
        userId: strigaUserId,
        tier: 1 // Start with Tier 1 KYC
      })
    })
    
    console.log('[Striga] KYC Start Response:', response)
    
    // Return the internal KYC verification page URL with token
    const kycUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://95.179.170.56:3019'}/kyc/verify?token=${response.token}`
    
    return {
      kycUrl,
      sessionId: response.token,
      token: response.token
    }
  } catch (error) {
    console.error('KYC initiation failed:', error)
    throw error
  }
}

// Wallet Operations
export async function getWallets(userId: string): Promise<any[]> {
  try {
    const endDate = Date.now()
    const startDate = endDate - (365 * 24 * 60 * 60 * 1000) // 1 year ago
    
    const requestBody = {
      userId: userId,
      startDate: startDate,
      endDate: endDate,
      page: 1
    }
    
    const response = await strigaApiRequest<{ wallets: any[] }>('/wallets/get/all', {
      method: 'POST', // Note: POST, not GET as per Striga docs
      body: JSON.stringify(requestBody)
    })
    
    return response.wallets || []
  } catch (error) {
    console.error('Failed to fetch wallets:', error)
    throw error
  }
}

export async function createWallet(userId: string, currency = 'BTC'): Promise<any> {
  try {
    const response = await strigaApiRequest('/wallets', {
      method: 'POST',
      body: JSON.stringify({
        userId: userId,
        currency: currency
      })
    })
    
    return response
  } catch (error) {
    console.error(`Failed to create ${currency} wallet:`, error)
    throw error
  }
}

// Process wallet data from Striga response
export function processWalletData(strigaWallets: any[]) {
  const balances = []
  
  for (const wallet of strigaWallets) {
    if (wallet.accounts && typeof wallet.accounts === 'object') {
      // Process multi-currency wallet structure
      for (const currency of Object.keys(wallet.accounts)) {
        const account = wallet.accounts[currency]
        
        if (account && account.availableBalance) {
          balances.push({
            currency: currency,
            amount: account.availableBalance.amount || '0',
            walletId: wallet.walletId,
            accountId: account.accountId || `account-${wallet.walletId}-${currency}`,
            address: account.address || '',
            qrCode: account.qrCode || ''
          })
        }
      }
    }
  }
  
  return balances
}

// Digital IBAN creation for sellers
export async function createDigitalIban(userId: string): Promise<{
  iban: string
  bankName: string
  accountNumber: string
}> {
  try {
    const response = await strigaApiRequest<{
      iban: string
      bankName: string
      accountNumber: string
    }>('/iban/create', {
      method: 'POST',
      body: JSON.stringify({
        userId: userId
      })
    })
    
    return response
  } catch (error) {
    console.error('Digital IBAN creation failed:', error)
    throw error
  }
}

// Webhook signature verification
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.STRIGA_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex')
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// Enrich account data - get banking details for EUR accounts
export async function enrichAccount(accountId: string): Promise<{
  iban: string
  bic: string
  bankName: string
  accountHolderName: string
  bankAddress?: string
}> {
  try {
    const response = await strigaApiRequest<{
      iban: string
      bic: string
      bankName: string
      accountHolderName: string
      bankAddress?: string
    }>(`/accounts/${accountId}/enrich`, {
      method: 'POST'
    })
    
    console.log('[Striga] Account enriched successfully:', {
      accountId,
      hasIban: !!response.iban,
      hasBic: !!response.bic,
      bankName: response.bankName
    })
    
    return response
  } catch (error) {
    console.error('[Striga] Account enrichment failed:', error)
    throw error
  }
}

// Logging utility for Striga requests
export function logStrigaRequest(endpoint: string, method: string, userId?: string) {
  console.log(`[Striga API] ${method} ${endpoint}`, {
    userId,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
}