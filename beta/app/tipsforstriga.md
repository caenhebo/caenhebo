# Tips for Striga API Implementation

This document contains lessons learned and best practices from implementing the Striga API in the Caenhebo Alpha project. Update this whenever you discover new insights.

---

## 🔐 Authentication

### HMAC Signature Format (CRITICAL!)
```typescript
// CORRECT format that actually works:
const hmac = crypto.createHmac('sha256', config.secret!)

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
  'authorization': authHeader,  // Use lowercase!
  'api-key': config.apiKey!,
  'Content-Type': 'application/json',
}
```

### Key Points:
- Use `HMAC ${timestamp}:${signature}` format (NOT Bearer!)
- Timestamp should be milliseconds: `Date.now().toString()`
- Endpoint in signature should NOT include `/api/v1` prefix
- Body must be MD5 hashed before adding to signature
- Order matters: timestamp → method → endpoint → MD5(body)
- Use lowercase 'authorization' header

---

## 👤 User Creation

### Correct Endpoint
- **Endpoint**: `/user/create`
- **Method**: POST
- **Required Fields**: firstName, lastName, email, mobile

### Mobile Number Format - EUROPEAN ONLY!
```javascript
// Striga ONLY accepts European phone numbers!
// UK, US, and other non-EU countries are NOT supported

// Parse European phone numbers
const cleanPhone = phoneNumber.replace(/\s/g, '')
const europeanCodes = {
  '+351': 'PT', // Portugal
  '+34': 'ES',  // Spain
  '+33': 'FR',  // France
  '+49': 'DE',  // Germany
  // ... etc (30 European countries total)
}

// Find the country code
for (const [code, country] of Object.entries(europeanCodes)) {
  if (cleanPhone.startsWith(code)) {
    countryCode = code
    phoneNumber = cleanPhone.substring(code.length)
    break
  }
}

mobile: {
  countryCode: countryCode,  // e.g., "+351"
  number: phoneNumber        // e.g., "900000000" (digits only!)
}
```

### Date of Birth Format
```javascript
// Striga expects separate year, month, day fields
const dobDate = new Date(userData.dateOfBirth)
dateOfBirth: {
  year: dobDate.getFullYear(),      // e.g., 1990
  month: dobDate.getMonth() + 1,    // e.g., 3 (March) - JS months are 0-indexed!
  day: dobDate.getDate()            // e.g., 15
}
```

### Address Format
```javascript
// Only include addressLine2 if it's not empty
address: {
  addressLine1: "Street 123",
  addressLine2: "Apt 4B",  // OMIT if empty!
  city: "Lisbon",
  postalCode: "1000-000",
  country: "PT"            // Use 2-letter country code
}
```

---

## 📋 Complete Onboarding Flow

### Proper Sequence (MUST follow this order):
1. **Create User** (`/user/create`) → Automatically sends verification emails/SMS
2. **Verify Email** (`/user/verify-email`) → Use code "123456" in sandbox
   ```javascript
   body: {
     userId: 'striga-user-id',
     code: '123456'  // NOT 'verificationCode'!
   }
   ```
3. **Verify Mobile** (`/user/verify-mobile`) → Use code "123456" in sandbox
   ```javascript
   body: {
     userId: 'striga-user-id',
     code: '123456'  // NOT 'verificationCode'!
   }
   ```
4. **Start KYC** (`/user/kyc/start`) → Returns SumSub token
5. **Complete KYC** → Via SumSub SDK integration
6. **Receive Webhook** → Updates user status

### CRITICAL: Email and Mobile MUST be verified before KYC!
- Creating a user does NOT automatically verify email/mobile
- You MUST call verify endpoints separately
- KYC will fail with "Email and mobile must be verified" if you skip steps 2-3
- DO NOT call initiateKYC() in the same request as createStrigaUser()

### Important Notes:
- Creating a user AUTOMATICALLY sends verification emails/SMS
- In sandbox, verification codes are always "123456"
- Mobile numbers are not strictly validated in sandbox
- **ONLY European users can be onboarded** - 30 countries supported
- **UK is SUSPENDED** - Do not allow UK users
- **US, Brazil, Chile, etc. are NOT supported** - European countries only!

---

## 🛡️ KYC Process

### Start KYC Endpoint
```typescript
// Request
POST /user/kyc/start
{
  "userId": "strigaUserId",
  "tier": 1  // Start with Tier 1
}

// Response
{
  "provider": "SUMSUB",
  "token": "_act-sbx-...",
  "userId": "..."
}
```

### SumSub Integration
- The token is for SumSub SDK, NOT a direct URL
- You need to integrate SumSub WebSDK in your app
- Striga handles the backend communication with SumSub
- Use the internal verification page, not external redirect

### KYC Status Mapping
```typescript
// Striga Status → Our Status
'APPROVED' | 'PASSED' → 'PASSED'
'REJECTED' | 'FAILED' → 'REJECTED'
'PENDING' | 'IN_REVIEW' | 'PROCESSING' → 'INITIATED'
```

### 🔄 Real-time KYC Status Checking (NEW!)

#### Implementation Overview
We've implemented real-time KYC status checking that syncs with Striga's API to ensure dashboards always show the current status.

#### Status Checking Flow
```typescript
// 1. Fetch live status from Striga
const strigaResponse = await strigaApiRequest(`/user/${strigaUserId}`, {
  method: 'GET'
})

// 2. Map Striga status to internal status
const mappedStatus = mapStrigaStatus(strigaResponse.KYC.status)

// 3. Update database if status changed
if (mappedStatus !== user.kycStatus) {
  await prisma.user.update({
    where: { id: userId },
    data: { kycStatus: mappedStatus }
  })
}

// 4. Return current status to frontend
return { 
  status: mappedStatus,
  displayStatus: getDisplayStatus(mappedStatus)
}
```

#### Status Display Mapping
```typescript
function getDisplayStatus(status: KycStatus): string {
  switch (status) {
    case 'PASSED':
      return 'Approved'  // User-friendly display
    case 'REJECTED':
      return 'Rejected'
    case 'INITIATED':
      return 'In Review'
    default:
      return 'Pending'
  }
}
```

#### Dashboard Integration
Both buyer and seller dashboards now:
1. **Fetch live status on page load** - Ensures current status is displayed
2. **Hide KYC alerts when approved** - Alert section completely hidden when KYC is PASSED
3. **Enable/disable features based on status** - All buttons respect actual KYC status
4. **Show visual status indicators** - Color-coded badges (green/red/amber)
5. **Allow manual status refresh** - "Check Status" button for pending reviews

#### API Endpoint: `/api/kyc/status`
```typescript
// GET /api/kyc/status
// Returns:
{
  "status": "PASSED",        // Internal status
  "displayStatus": "Approved" // User-friendly display
}
```

#### Key Implementation Details:
- **Always fetch from Striga first** - Don't rely on session/database status alone
- **Sync database on changes** - Keep local data in sync with Striga
- **Handle all Striga statuses** - Map APPROVED, REJECTED, IN_REVIEW, etc.
- **Update session if needed** - Refresh session data when status changes
- **Show appropriate UI** - Hide alerts, enable features, show correct messages

---

## 💼 Wallet Operations

### Fetching Wallets (Tricky!)
```typescript
// CORRECT - Use POST with date range
const response = await strigaApiRequest('/wallets/get/all', {
  method: 'POST',  // NOT GET!
  body: JSON.stringify({
    userId: userId,
    startDate: Date.now() - (365 * 24 * 60 * 60 * 1000),
    endDate: Date.now(),
    page: 1
  })
})

// WRONG - This returns "Invalid fields"
const response = await strigaApiRequest(`/user/${userId}/wallets`)
```

---

## 🪝 Webhooks

### Webhook URL to Configure
```
https://yourdomain.com/api/webhooks/striga
```

### Important Events
- `KYC_STATUS_CHANGED` - KYC approval/rejection
- `USER_CREATED` - User successfully created
- `WALLET_CREATED` - Wallet created for user

### Signature Verification
```typescript
const verifyWebhookSignature = (payload: string, signature: string) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.STRIGA_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex')
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

---

## ✅ SUCCESS: How to Create Users in Striga

### Working Implementation (August 2025)
```javascript
// 1. Parse European phone numbers correctly
const europeanCountryCodes = {
  '+351': 'PT', // Portugal
  '+34': 'ES',  // Spain
  '+33': 'FR',  // France
  // ... (30 European countries total)
}

// 2. Format the data properly
const strigaUser = await createStrigaUser({
  firstName: 'Test',
  lastName: 'User',
  email: 'user@example.com',
  mobile: {
    countryCode: '+351',        // Must be European!
    number: '964963136'         // Digits only, no spaces!
  },
  dateOfBirth: '1990-01-01',    // Will be converted to {year, month, day}
  address: {
    addressLine1: 'Rua Test 123',
    addressLine2: '',            // Will be omitted if empty
    city: 'Porto',
    postalCode: '1000-000',     // Can include dash
    country: 'PT'                // 2-letter code
  }
})
```

### Key Lessons Learned:
1. **Don't start KYC immediately** - Create user first, verify email/mobile, THEN start KYC
2. **Phone numbers are flexible in sandbox** - Any European number works
3. **User creation triggers emails/SMS** - Automatically sent by Striga
4. **Return strigaUserId** - Frontend needs it for verification steps

---

## 🚨 Common Errors & Solutions

### "Email and mobile must be verified" 
- **Cause**: Trying to start KYC before verifying email/mobile
- **Solution**: Follow the proper sequence - create user → verify → KYC

### "Invalid fields" Error
- **Cause**: Wrong endpoint or missing required fields
- **Solution**: Check exact endpoint format and required fields

### 404 Not Found
- **Cause**: Wrong endpoint path or authentication
- **Solution**: 
  - Verify endpoint includes `/api/v1` prefix in URL (but NOT in signature)
  - Check authentication headers

### "Striga API error"
- **Cause**: Authentication failure
- **Solution**: 
  - Verify HMAC signature format
  - Check API key and secret are correct
  - Ensure timestamp is in milliseconds

---

## 🚨 Supported Countries

Striga ONLY supports users from these 30 European countries:
- Austria, Belgium, Bulgaria, Croatia, Cyprus
- Czech Republic, Denmark, Estonia, Finland, France
- Germany, Greece, Hungary, Iceland, Ireland
- Italy, Latvia, Liechtenstein, Lithuania, Luxembourg
- Malta, Netherlands, Norway, Poland, Portugal
- Romania, Slovakia, Slovenia, Spain, Sweden

**NOT SUPPORTED:**
- UK (suspended)
- US, Canada, Brazil, Chile, or any non-European country

---

## 🌍 Environment Configuration

### Required Environment Variables
```bash
# Striga API Keys (get from Striga dashboard)
STRIGA_APPLICATION_ID="..."
STRIGA_API_KEY="..."
STRIGA_API_SECRET="..."
STRIGA_UI_SECRET="..."
STRIGA_BASE_URL="https://www.sandbox.striga.com/api/v1"
STRIGA_WEBHOOK_SECRET="..." # Set in Striga dashboard

# App URL for callbacks
NEXT_PUBLIC_APP_URL="http://yourdomain.com"
```

### Loading Environment Variables
- Use `.env.local` for sensitive keys
- Restart the app after changing env vars: `pm2 restart app-name`
- Access in code: `process.env.STRIGA_API_KEY`

---

## 📝 Testing Tips

### Sandbox Limitations
- Email/SMS not actually sent
- Verification codes always "123456"
- Some validations are relaxed
- Free to test without charges

### Test Flow
1. Create test user with valid email
2. Use "123456" for both verifications
3. Complete KYC with test documents
4. Check webhook logs for status updates

### Debugging
```typescript
// Always log API calls
console.log(`[Striga API] ${method} ${endpoint}`, {
  userId,
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV
})

// Log full errors
catch (error) {
  console.error('Striga API Error:', {
    endpoint,
    status: error.statusCode,
    code: error.strigaCode,
    message: error.message,
    details: error.details
  })
}
```

---

## 🔧 SumSub Integration (WORKING SOLUTION!)

### ✅ The Correct Way to Integrate SumSub with Striga

**IMPORTANT**: The SumSub SDK object is called `snsWebSdk` (NOT `SumsubWebSdk` or `window.SumsubWebSdk`)

### Token Format
Striga returns a token that looks like: `_act-sbx-jwt-eyJhbG...`
- This is a JWT access token for SumSub SDK
- Use it directly - no parsing or modification needed
- The token includes the sandbox/production environment info

### Working Implementation (Tested August 2025)
```javascript
// 1. Load the SumSub SDK script
const script = document.createElement('script')
script.src = 'https://static.sumsub.com/idensic/static/sns-websdk-builder.js'
script.async = true
document.body.appendChild(script)

// 2. Initialize after script loads
script.onload = () => {
  // CRITICAL: Use window.snsWebSdk (lowercase!)
  const snsWebSdkInstance = window.snsWebSdk.init(
    token,  // The token from Striga KYC start endpoint
    // REQUIRED: updateAccessToken callback
    () => {
      // Return the same token or fetch a new one
      return Promise.resolve(token)
    }
  )
  .withConf({
    lang: 'en',
    onMessage: (type, payload) => {
      console.log('WebSDK onMessage', type, payload)
      if (type === 'idCheck.onApplicantSubmitted') {
        // User completed verification
      }
    }
  })
  .build()
  
  // 3. Launch in container
  snsWebSdkInstance.launch('#sumsub-websdk-container')
}
```

### Key Points That Cause Issues:
1. **Wrong SDK name**: It's `window.snsWebSdk` NOT `window.SumsubWebSdk`
2. **Missing callback**: The `updateAccessToken` callback is REQUIRED as the 2nd parameter
3. **Script loading**: Must wait for script to fully load before accessing `snsWebSdk`
4. **Container ID**: Use the exact ID you specify in launch() for your HTML element

### Common Errors & Solutions
- **"updateAccessToken callback is required"** → Add the callback as 2nd parameter to init()
- **"snsWebSdk is not defined"** → Script not loaded yet or using wrong object name
- **Blank screen** → Check browser console, token might be expired or already used

---

## 🎯 Best Practices

1. **Always validate input** before sending to Striga
2. **Store Striga user ID** immediately after creation
3. **Use webhooks** for status updates (don't poll)
4. **Handle all error cases** with user-friendly messages
5. **Test complete flow** in sandbox before production
6. **Keep this document updated** with new learnings

---

## 🔄 Rate Limiting

Striga allows 10 requests per second. Implement rate limiting:
```typescript
const rateLimiter = new RateLimiter(10, 'second')
await rateLimiter.removeTokens(1)
```

---

## 📚 Useful Links

- [Striga API Docs](https://docs.striga.com)
- [Onboarding Flow](https://docs.striga.com/reference/onboarding-flow)
- [KYC Start](https://docs.striga.com/reference/start-kyc)
- [Create User](https://docs.striga.com/reference/create-user)

---

## 🎯 Complete KYC Status Implementation (August 2025)

### Overview
We implemented a complete real-time KYC status verification system that ensures users see their current KYC status across all dashboards and properly gates features based on approval status.

### Key Files Modified:
1. **`/api/kyc/status/route.ts`** - Enhanced to fetch live status from Striga
2. **`/kyc/callback/page.tsx`** - Step 4 of KYC now shows final status
3. **`/buyer/dashboard/page.tsx`** - Real-time status check and UI updates
4. **`/seller/dashboard/page.tsx`** - Real-time status check and UI updates

### Implementation Highlights:

#### 1. Live Status Fetching
```typescript
// In /api/kyc/status/route.ts
const strigaUser = await strigaApiRequest(`/user/${user.strigaUserId}`, {
  method: 'GET'
})

const strigaStatus = strigaUser.KYC?.status || null
const mappedStatus = mapStrigaStatus(strigaStatus)

// Sync database if status changed
if (mappedStatus !== user.kycStatus) {
  await prisma.user.update({
    where: { id: session.user.id },
    data: { kycStatus: mappedStatus }
  })
}
```

#### 2. Dashboard Alert Hiding
```typescript
// In buyer/seller dashboards
{kycStatus !== 'PASSED' && (
  <Alert>
    {/* KYC prompt only shows if not approved */}
  </Alert>
)}
```

#### 3. Feature Gating
```typescript
// All buttons check live KYC status
<Button 
  disabled={kycStatus !== 'PASSED'}
  onClick={handleAction}
>
  {kycStatus !== 'PASSED' 
    ? 'Complete KYC First' 
    : 'Proceed'}
</Button>
```

#### 4. Visual Status Indicators
```typescript
// Color-coded status display
const statusColor = 
  status === 'PASSED' ? 'text-green-600' :
  status === 'REJECTED' ? 'text-red-600' :
  'text-amber-600'
```

### Testing Checklist:
- ✅ User completes KYC verification
- ✅ Status fetched from Striga API
- ✅ Dashboard shows correct status
- ✅ KYC alert hidden when approved
- ✅ All features enabled when approved
- ✅ Manual refresh button works
- ✅ Database syncs with Striga

### Important Notes:
1. **Always check Striga first** - Database might be out of sync
2. **Map all statuses properly** - Handle APPROVED, REJECTED, IN_REVIEW, etc.
3. **Update UI immediately** - Don't wait for page refresh
4. **Gate all features** - Check status before enabling any action
5. **Provide feedback** - Show loading states and clear messages

---

## 💰 Wallet Display Implementation (August 2025)

### Overview
We implemented a comprehensive wallet display system that shows different wallet types based on user roles and includes full banking details for EUR wallets.

### Key Implementation Details:

#### 1. Role-Based Primary Wallets
```typescript
// Sellers see EUR wallet as primary
// Buyers see BTC wallet as primary
const primaryWallet = walletData.wallets.find(w => 
  user.role === 'SELLER' ? w.currency === 'EUR' : w.currency === 'BTC'
) || walletData.wallets[0]
```

#### 2. Fetching Wallets from Striga
```typescript
// POST method required for wallet fetching
const response = await strigaApiRequest('/wallets/get/all', {
  method: 'POST',
  body: JSON.stringify({
    userId: userId,
    startDate: Date.now() - (365 * 24 * 60 * 60 * 1000),
    endDate: Date.now(),
    page: 1
  })
})
```

#### 3. AccountId Structure Fix
**Problem**: Banking details API was failing because accountId wasn't found
**Issue**: Striga returns accountId inside individual account objects, not on the wallet
**Solution**:
```typescript
// ❌ Wrong - wallet doesn't have accountId
accountId: wallet.accountId

// ✅ Correct - extract from account object
accountId: account.accountId || `account-${wallet.walletId}-${currency}`
```

#### 4. Banking Details Enrichment
```typescript
// Enrich EUR accounts with banking details
const enrichAccount = async (accountId: string) => {
  const response = await strigaApiRequest(`/accounts/${accountId}/enrich`, {
    method: 'POST',
    body: JSON.stringify({})
  })
  
  return {
    iban: response.bankAccount.iban,
    bic: response.bankAccount.bic,
    bankName: response.bankAccount.bankName,
    accountHolderName: response.bankAccount.accountHolderName,
    bankAddress: response.bankAccount.bankAddress
  }
}
```

#### 5. Clipboard Copy for HTTP Environments
**Problem**: navigator.clipboard.writeText() requires HTTPS
**Solution**: Implement fallback for HTTP environments
```typescript
const copyToClipboard = async (text: string) => {
  try {
    // Try modern clipboard API first (HTTPS only)
    await navigator.clipboard.writeText(text)
  } catch (error) {
    // Fallback for HTTP environments
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.cssText = 'position:absolute;left:-9999px'
    document.body.appendChild(textArea)
    textArea.select()
    
    try {
      document.execCommand('copy')
    } finally {
      document.body.removeChild(textArea)
    }
  }
}
```

#### 6. Wallet Display Features
- **Show/Hide Banking Details**: Fetches IBAN, BIC, bank info for EUR wallets
- **Show/Hide Wallet Address**: Toggles visibility of crypto addresses
- **Show Wallet Details**: Displays all wallet metadata with copy functionality
- **Copy All**: Copies all wallet details as formatted text

### Implementation Checklist:
- ✅ Role-based wallet display (EUR for sellers, BTC for buyers)
- ✅ "See more wallets" modal for viewing all wallets
- ✅ Banking details fetching with proper accountId
- ✅ Clipboard copy that works on both HTTP and HTTPS
- ✅ Individual copy buttons for each detail
- ✅ Wallet details view with comprehensive information
- ✅ Loading states and error handling

### Common Issues & Solutions:
1. **"No accountId found"** - Extract accountId from account object, not wallet
2. **Clipboard not working** - Use fallback method for HTTP environments
3. **Banking details not loading** - Ensure authentication with authOptions in API
4. **Wallets not showing** - Check NEXTAUTH_URL matches the running port

---

Last Updated: August 2025