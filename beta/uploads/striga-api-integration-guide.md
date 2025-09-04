# Striga API Integration Guide & Best Practices

This document provides comprehensive recommendations for integrating the Striga API based on real-world implementation experience with the Caenhebo platform. It covers authentication, user management, KYC processes, and wallet operations.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Security](#authentication--security)
3. [User Creation & Management](#user-creation--management)
4. [KYC Integration](#kyc-integration)
5. [Wallet Operations](#wallet-operations)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Common Pitfalls](#common-pitfalls)
9. [Implementation Examples](#implementation-examples)

---

## Overview

Striga provides a comprehensive financial API for cryptocurrency and traditional banking services. This guide covers the essential components for a production-ready integration.

### Key Components Covered
- 🔐 **HMAC Authentication**
- 👤 **User Registration & Management**
- 🛡️ **KYC (Know Your Customer) Verification**
- 💰 **Multi-Currency Wallet Operations**
- 🔄 **Webhook Handling**

---

## Authentication & Security

### 1. HMAC Signature Authentication

**✅ Recommended Approach:**
```typescript
// Centralized authentication with HMAC signatures
const strigaApiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const timestamp = Date.now().toString();
  const method = options.method || 'GET';
  const body = options.body || '';
  
  // Create signature payload
  const signaturePayload = `${method}${endpoint}${timestamp}${body}`;
  const signature = crypto
    .createHmac('sha256', process.env.STRIGA_SECRET!)
    .update(signaturePayload)
    .digest('hex');

  const headers = {
    'api-key': process.env.STRIGA_API_KEY!,
    'Authorization': `Bearer ${signature}`,
    'Content-Type': 'application/json',
    'x-timestamp': timestamp,
    ...options.headers,
  };

  // Make request to Striga API
  const response = await fetch(`${STRIGA_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Striga API error: ${response.status}`);
  }

  return response.json();
};
```

**🔑 Key Security Recommendations:**
- Store API keys in environment variables, never in code
- Use different API keys for sandbox vs production
- Implement request signing for all API calls
- Add timestamp validation to prevent replay attacks
- Use HTTPS only for all communications

### 2. Environment Configuration

```bash
# Required environment variables
STRIGA_API_KEY=your_api_key_here
STRIGA_SECRET=your_secret_key_here
STRIGA_BASE_URL=https://www.sandbox.striga.com/api/v1  # or production URL
```

---

## User Creation & Management

### 1. User Registration Flow

**✅ Recommended Implementation:**

```typescript
interface StrigaUserData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: {
    countryCode: string;
    number: string;
  };
  address: {
    addressLine1: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  dateOfBirth: string; // YYYY-MM-DD format
  // Additional fields based on your requirements
}

const createStrigaUser = async (userData: StrigaUserData) => {
  try {
    const response = await strigaApiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    // Store the returned userId in your database
    return response.userId;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
```

**📋 Required Data Fields:**
- ✅ Personal information (name, DOB, email)
- ✅ Contact details (phone with country code)
- ✅ Address information (complete postal address)
- ✅ Valid email address for verification

### 2. User Profile Management

**✅ Store Striga User ID in Your Database:**
```sql
-- Add to your user profiles table
ALTER TABLE profiles ADD COLUMN striga_user_id VARCHAR;
```

---

## KYC Integration

### 1. KYC Initiation

**✅ Recommended Flow:**
```typescript
const initiateKYC = async (strigaUserId: string) => {
  const response = await strigaApiRequest('/user/kyc/start', {
    method: 'POST',
    body: JSON.stringify({
      userId: strigaUserId,
      tier: 1  // Start with Tier 1
    })
  });
  
  return {
    token: response.token,     // SumSub SDK token
    provider: response.provider // "SUMSUB"
  };
};
```

### 2. Real-time KYC Status Checking

**✅ Live Status Verification (NEW - August 2025):**
```typescript
// Fetch current KYC status from Striga
const checkKYCStatus = async (strigaUserId: string) => {
  // 1. Get live status from Striga
  const strigaUser = await strigaApiRequest(`/user/${strigaUserId}`, {
    method: 'GET'
  });
  
  // 2. Map Striga status to internal status
  const mappedStatus = mapStrigaStatus(strigaUser.KYC?.status);
  
  // 3. Update local database if changed
  if (mappedStatus !== currentDbStatus) {
    await updateUserKYCStatus(userId, mappedStatus);
  }
  
  return {
    status: mappedStatus,
    displayStatus: getDisplayStatus(mappedStatus)
  };
};

// Status mapping function
const mapStrigaStatus = (strigaStatus: string | null): KycStatus => {
  switch (strigaStatus) {
    case 'APPROVED':
    case 'PASSED':
      return 'PASSED';
    case 'REJECTED':
    case 'FAILED':
      return 'REJECTED';
    case 'PENDING':
    case 'IN_REVIEW':
    case 'PROCESSING':
      return 'INITIATED';
    default:
      return 'PENDING';
  }
};

// User-friendly display mapping
const getDisplayStatus = (status: KycStatus): string => {
  switch (status) {
    case 'PASSED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    case 'INITIATED':
      return 'In Review';
    default:
      return 'Pending';
  }
};
```

### 3. Dashboard Integration

**✅ Implementation Pattern for Dashboards:**
```typescript
// In your dashboard component
const DashboardPage = () => {
  const [kycStatus, setKycStatus] = useState<string>('PENDING');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch live KYC status on page load
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const response = await fetch('/api/kyc/status');
      const data = await response.json();
      setKycStatus(data.status);
    } catch (error) {
      console.error('Failed to fetch KYC status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hide KYC alert when approved */}
      {kycStatus !== 'PASSED' && (
        <Alert>
          <AlertTitle>Complete KYC Verification</AlertTitle>
          <AlertDescription>
            Verify your identity to unlock all features
          </AlertDescription>
        </Alert>
      )}

      {/* Show visual status indicator */}
      <Badge className={
        kycStatus === 'PASSED' ? 'bg-green-100 text-green-800' :
        kycStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
        'bg-amber-100 text-amber-800'
      }>
        KYC Status: {getDisplayStatus(kycStatus)}
      </Badge>

      {/* Gate features based on KYC status */}
      <Button 
        disabled={kycStatus !== 'PASSED'}
        onClick={handleFeature}
      >
        {kycStatus !== 'PASSED' ? 'Complete KYC First' : 'Access Feature'}
      </Button>
    </div>
  );
};
```

### 4. KYC Status Monitoring

**✅ Use Both Webhooks and Live Checks:**
```typescript
// Webhook handler for KYC status updates
export default async function strigaWebhookHandler(req: NextApiRequest, res: NextApiResponse) {
  const { eventType, data } = req.body;
  
  if (eventType === 'KYC_STATUS_CHANGED') {
    const { userId, status } = data;
    
    // Update user status in your database
    await updateKYCStatus(userId, status);
    
    // Notify user of status change
    await notifyUser(userId, status);
  }
  
  res.status(200).json({ received: true });
}
```

**🎯 KYC Status Values:**
- `PENDING` - Initial state, verification not started
- `INITIATED` - Verification in progress (maps from IN_REVIEW, PROCESSING)
- `PASSED` - Successfully verified (maps from APPROVED)
- `REJECTED` - Verification failed (maps from FAILED)

### 5. KYC Best Practices

**✅ Implementation Checklist:**
1. **Always fetch live status** - Don't rely solely on database/session
2. **Map all Striga statuses** - Handle APPROVED, REJECTED, IN_REVIEW, etc.
3. **Update UI immediately** - Hide alerts, enable features when approved
4. **Provide manual refresh** - Add "Check Status" button for pending states
5. **Sync database on changes** - Keep local data current with Striga
6. **Show clear feedback** - Use color-coded status indicators
7. **Gate all features** - Check KYC status before enabling actions

**✅ Recommendations:**
- Always use webhooks for status updates (don't poll)
- Provide clear user feedback for each KYC status
- Handle rejection cases with guidance for resubmission
- Store KYC session IDs for debugging
- Implement retry mechanisms for failed webhook deliveries

---

## Wallet Operations

### 1. Fetching User Wallets

**⚠️ Critical: Use Correct Endpoint Format**

```typescript
const getWallets = async (userId: string): Promise<any[]> => {
  // CORRECT endpoint format from official Striga API docs
  const endDate = Date.now();
  const startDate = endDate - (365 * 24 * 60 * 60 * 1000); // 1 year ago
  
  const requestBody = {
    userId: userId,
    startDate: startDate,
    endDate: endDate,
    page: 1
  };
  
  const response = await strigaApiRequest('/wallets/get/all', {
    method: 'POST', // Note: POST, not GET
    body: JSON.stringify(requestBody)
  });
  
  return response.wallets || [];
};
```

**🚨 Common Mistake:**
```typescript
// ❌ WRONG - This will return "Invalid fields" error
const wrongApproach = await strigaApiRequest(`/user/${userId}/wallets`);
```

### 2. Processing Wallet Data

**✅ Handle Multi-Currency Structure:**
```typescript
const processWalletData = (strigaWallets: any[]) => {
  const balances = [];
  
  for (const wallet of strigaWallets) {
    if (wallet.accounts && typeof wallet.accounts === 'object') {
      // Process multi-currency wallet structure
      for (const currency of Object.keys(wallet.accounts)) {
        const account = wallet.accounts[currency];
        
        if (account && account.availableBalance) {
          balances.push({
            currency: currency,
            amount: account.availableBalance.amount || '0',
            walletId: wallet.walletId
          });
        }
      }
    }
  }
  
  return balances;
};
```

### 3. Wallet Creation

**✅ Create Wallets After KYC:**
```typescript
const createWallet = async (userId: string, currency = 'BTC') => {
  const response = await strigaApiRequest('/wallets', {
    method: 'POST',
    body: JSON.stringify({
      userId: userId,
      currency: currency
    })
  });
  
  return response;
};
```

### 4. Complete Wallet Display Implementation (August 2025)

**✅ Key Implementation Details:**

#### A. AccountId Structure Fix
```typescript
// CRITICAL: AccountId is in account objects, not wallet object
const processWalletForDisplay = (wallet: any) => {
  const accounts = []
  
  for (const [currency, account] of Object.entries(wallet.accounts || {})) {
    accounts.push({
      currency,
      // ✅ CORRECT - Extract accountId from account
      accountId: account.accountId || `account-${wallet.walletId}-${currency}`,
      balance: account.availableBalance?.amount || '0',
      address: account.blockchainAddress?.address
    })
  }
  
  return accounts
}
```

#### B. Banking Details Enrichment
```typescript
// Fetch IBAN, BIC, and bank details for EUR accounts
const enrichBankingDetails = async (accountId: string) => {
  const response = await strigaApiRequest(`/accounts/${accountId}/enrich`, {
    method: 'POST',
    body: JSON.stringify({})
  })
  
  return {
    iban: response.bankAccount?.iban,
    bic: response.bankAccount?.bic,
    bankName: response.bankAccount?.bankName,
    accountHolderName: response.bankAccount?.accountHolderName,
    bankAddress: response.bankAccount?.bankAddress
  }
}
```

#### C. Clipboard Copy with HTTP Fallback
```typescript
// Handle clipboard for both HTTP and HTTPS environments
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Modern clipboard API (HTTPS only)
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for HTTP environments
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'absolute'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)
    textArea.select()
    
    try {
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      return success
    } catch {
      document.body.removeChild(textArea)
      return false
    }
  }
}
```

#### D. Role-Based Wallet Display
```typescript
// Show different primary wallets based on user role
const getPrimaryWallet = (wallets: any[], userRole: string) => {
  if (userRole === 'SELLER') {
    // Sellers need EUR for receiving payments
    return wallets.find(w => w.currency === 'EUR') || wallets[0]
  } else if (userRole === 'BUYER') {
    // Buyers need BTC for making payments
    return wallets.find(w => w.currency === 'BTC') || wallets[0]
  }
  return wallets[0]
}
```

### 5. Common Wallet Issues & Solutions

**❌ Problem: "No accountId found on wallet"**
- **Cause**: Looking for accountId on wallet object instead of account
- **Solution**: Extract from `wallet.accounts[currency].accountId`

**❌ Problem: Clipboard not working**
- **Cause**: navigator.clipboard requires HTTPS
- **Solution**: Implement fallback with document.execCommand

**❌ Problem: Banking details not loading**
- **Cause**: Missing authentication in API endpoint
- **Solution**: Import and use authOptions in getServerSession

**❌ Problem: Wallets not displaying**
- **Cause**: Using wrong HTTP method or endpoint
- **Solution**: Use POST method with `/wallets/get/all` endpoint

---

## Error Handling

### 1. Comprehensive Error Handling

**✅ Recommended Error Structure:**
```typescript
class StrigaAPIError extends Error {
  constructor(
    public statusCode: number,
    public strigaCode: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'StrigaAPIError';
  }
}

const handleStrigaResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    throw new StrigaAPIError(
      response.status,
      errorData.code || 'UNKNOWN',
      errorData.message || 'Striga API error',
      errorData
    );
  }
  
  return response.json();
};
```

### 2. Common Error Codes & Solutions

| Error Code | Cause | Solution |
|------------|--------|----------|
| `INVALID_FIELDS` | Missing required parameters | Check API documentation for required fields |
| `USER_NOT_FOUND` | Invalid userId | Verify userId exists in Striga system |
| `UNAUTHORIZED` | Invalid API key/signature | Check authentication implementation |
| `KYC_REQUIRED` | Operation requires verified KYC | Complete KYC process first |
| `INSUFFICIENT_BALANCE` | Not enough funds | Check wallet balance before operations |

---

## Best Practices

### 1. API Request Management

**✅ Implement Rate Limiting:**
```typescript
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter(10, 'second'); // 10 requests per second

const rateLimitedRequest = async (endpoint: string, options: RequestInit) => {
  await new Promise(resolve => limiter.removeTokens(1, resolve));
  return strigaApiRequest(endpoint, options);
};
```

### 2. Logging & Monitoring

**✅ Comprehensive Logging:**
```typescript
const logStrigaRequest = (endpoint: string, method: string, userId?: string) => {
  console.log(`[Striga API] ${method} ${endpoint}`, {
    userId,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
};
```

### 3. Environment Management

**✅ Environment-Specific Configuration:**
```typescript
const STRIGA_CONFIG = {
  sandbox: {
    baseUrl: 'https://www.sandbox.striga.com/api/v1',
    apiKey: process.env.STRIGA_SANDBOX_API_KEY,
    secret: process.env.STRIGA_SANDBOX_SECRET
  },
  production: {
    baseUrl: 'https://api.striga.com/api/v1',
    apiKey: process.env.STRIGA_PROD_API_KEY,
    secret: process.env.STRIGA_PROD_SECRET
  }
};
```

### 4. Data Validation

**✅ Validate Input Data:**
```typescript
import { z } from 'zod';

const UserDataSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  mobile: z.object({
    countryCode: z.string(),
    number: z.string()
  }),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
```

---

## Common Pitfalls

### 1. Authentication Issues

**❌ Common Mistakes:**
- Using wrong signature algorithm
- Incorrect timestamp format
- Missing required headers
- Using GET instead of POST for wallet endpoints

**✅ Solutions:**
- Follow HMAC SHA-256 signature specification exactly
- Use millisecond timestamps
- Include all required headers in every request
- Check official API documentation for correct HTTP methods

### 2. Data Format Issues

**❌ Common Mistakes:**
- Incorrect date formats
- Wrong phone number format
- Missing required address fields
- Invalid currency codes

**✅ Solutions:**
- Use ISO 8601 date format (YYYY-MM-DD)
- Include country code with phone numbers
- Provide complete postal addresses
- Use standard currency codes (BTC, EUR, USD, etc.)

### 3. Webhook Handling

**❌ Common Mistakes:**
- Not verifying webhook signatures
- Not handling duplicate events
- Missing event types
- Synchronous processing causing timeouts

**✅ Solutions:**
- Always verify webhook signatures
- Implement idempotency checks
- Handle all relevant event types
- Process webhooks asynchronously

---

## KYC Status Implementation Summary (August 2025)

### Complete Implementation Overview

We successfully implemented a real-time KYC status verification system that:

1. **Fetches Live Status from Striga**
   - API endpoint `/api/kyc/status` checks Striga in real-time
   - Maps all Striga statuses to internal statuses
   - Syncs database when status changes

2. **Updates Dashboard UI Dynamically**
   - KYC alerts completely hidden when approved
   - Features enabled/disabled based on actual status
   - Visual status indicators with color coding

3. **Provides Manual Status Refresh**
   - "Check Status" button for pending reviews
   - No need for page refresh to see updates
   - Clear loading states and error handling

### Key Implementation Files

| File | Purpose | Changes |
|------|---------|---------|
| `/api/kyc/status/route.ts` | Live status API | Added Striga fetch, status mapping, DB sync |
| `/kyc/callback/page.tsx` | KYC step 4 | Shows final status, manual refresh button |
| `/buyer/dashboard/page.tsx` | Buyer dashboard | Live status check, alert hiding, feature gating |
| `/seller/dashboard/page.tsx` | Seller dashboard | Live status check, alert hiding, feature gating |

### Status Flow Diagram

```
User Completes KYC → Striga Updates Status → We Fetch Live Status → Map to Internal Status → Update UI
                                              ↑                                               ↓
                                          Webhooks                                    Hide Alerts/Enable Features
```

### Testing the Implementation

1. **Test User**: `seller@test.com`
2. **Access URL**: http://155.138.165.47:3004
3. **Expected Behavior**:
   - Complete KYC verification through SumSub
   - Status shows as "Approved" in callback page
   - Dashboards hide KYC alerts
   - All features become enabled

### Critical Success Factors

1. **Real-time Updates** - Always fetch from Striga, don't rely on cached data
2. **Proper Mapping** - Handle all Striga status variations correctly
3. **UI Consistency** - Same status display across all pages
4. **Feature Gating** - All actions check live KYC status
5. **User Experience** - Clear feedback and manual refresh options

This implementation ensures users always see their current KYC status and have appropriate access to platform features based on their verification state.

**❌ Common Mistakes:**
- Not verifying webhook signatures
- Blocking webhook processing
- Not handling duplicate events
- Missing error responses

**✅ Solutions:**
- Always verify webhook signatures
- Process webhooks asynchronously
- Implement idempotency for webhook handling
- Return proper HTTP status codes

---

## Implementation Examples

### 1. Complete User Onboarding Flow

```typescript
async function onboardUser(userData: UserRegistrationData) {
  try {
    // 1. Create user in your system
    const user = await createLocalUser(userData);
    
    // 2. Create user in Striga
    const strigaUserId = await createStrigaUser({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      mobile: {
        countryCode: userData.countryCode,
        number: userData.phoneNumber
      },
      address: userData.address,
      dateOfBirth: userData.dateOfBirth
    });
    
    // 3. Store Striga user ID
    await updateUserProfile(user.id, { striga_user_id: strigaUserId });
    
    // 4. Initiate KYC process
    const kycSession = await initiateKYC(strigaUserId);
    
    return {
      userId: user.id,
      strigaUserId,
      kycUrl: kycSession.kycUrl
    };
    
  } catch (error) {
    console.error('User onboarding failed:', error);
    throw error;
  }
}
```

### 2. Wallet Balance Dashboard

```typescript
async function getDashboardData(userId: string) {
  try {
    // Get user's Striga ID
    const profile = await getUserProfile(userId);
    
    if (!profile.striga_user_id) {
      throw new Error('User not registered with Striga');
    }
    
    // Fetch wallets and balances
    const wallets = await getWallets(profile.striga_user_id);
    const balances = processWalletData(wallets);
    
    // Group by currency and sum amounts
    const consolidatedBalances = balances.reduce((acc, balance) => {
      const existing = acc.find(b => b.currency === balance.currency);
      if (existing) {
        existing.amount = (parseFloat(existing.amount) + parseFloat(balance.amount)).toString();
      } else {
        acc.push({ ...balance });
      }
      return acc;
    }, []);
    
    return consolidatedBalances;
    
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    throw error;
  }
}
```

---

## Testing & Development

### 1. Sandbox Environment

**✅ Always Start with Sandbox:**
- Use sandbox environment for all development
- Test complete user flows before production
- Verify webhook delivery and processing
- Test error scenarios and edge cases

### 2. Testing Checklist

**Before Production Deployment:**
- [ ] User registration and profile creation
- [ ] KYC flow initiation and completion
- [ ] Wallet creation and balance fetching
- [ ] Webhook endpoint security and processing
- [ ] Error handling for all scenarios
- [ ] Rate limiting and request throttling
- [ ] Environment variable configuration
- [ ] API key rotation procedures

---

## Security Considerations

### 1. API Key Management

**✅ Security Best Practices:**
- Use different API keys for each environment
- Rotate API keys regularly
- Never expose API keys in client-side code
- Use secure environment variable management
- Implement API key monitoring and alerting

### 2. Data Protection

**✅ Privacy & Compliance:**
- Encrypt sensitive user data at rest
- Use HTTPS for all API communications
- Implement data retention policies
- Follow GDPR/privacy regulations
- Log security events and API access

### 3. Webhook Security

**✅ Secure Webhook Handling:**
```typescript
const verifyWebhookSignature = (payload: string, signature: string) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.STRIGA_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};
```

---

## Conclusion

This guide provides a comprehensive foundation for integrating the Striga API based on real-world implementation experience. Following these recommendations will help you avoid common pitfalls and build a robust, secure financial application.

### Key Takeaways

1. **Authentication**: Always use proper HMAC signatures with correct timestamp handling
2. **API Endpoints**: Follow the official documentation exactly, especially for wallet operations
3. **Error Handling**: Implement comprehensive error handling with proper user feedback
4. **Security**: Never compromise on security - use webhooks, verify signatures, protect API keys
5. **Testing**: Thoroughly test in sandbox before production deployment

For additional support or questions about Striga API integration, refer to the official Striga documentation or contact their support team.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Based on**: Caenhebo Platform Implementation 