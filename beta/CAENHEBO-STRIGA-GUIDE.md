# 🏦 CAENHEBO STRIGA INTEGRATION GUIDE

**⚠️ READ THIS FIRST BEFORE ANY STRIGA WORK!**

This is the MASTER guide for all Striga API integrations in Caenhebo. It consolidates all our learnings, fixes, and working implementations. Always refer to this guide BEFORE checking official Striga docs.

## 🛑 GOLDEN RULE: DO NOT BREAK WORKING CODE!

### The Following Features are WORKING - DO NOT REWRITE THEM:
1. ✅ **User Sync** - Admin dashboard sync button correctly finds users by email
2. ✅ **Authentication** - HMAC signature implementation is correct
3. ✅ **KYC Status Check** - Live status fetching from Striga works
4. ✅ **Wallet Display** - Including banking details for EUR accounts
5. ✅ **User Search** - `/user/get-by-email` endpoint works perfectly

**If it's not broken, DON'T fix it!**

---

## 📋 Table of Contents

1. [Critical Information](#critical-information)
2. [Authentication - WORKING METHOD](#authentication---working-method)
3. [User Management](#user-management)
4. [KYC Implementation](#kyc-implementation)
5. [Wallet Operations](#wallet-operations)
6. [Admin Sync Feature](#admin-sync-feature)
7. [Common Errors & Solutions](#common-errors--solutions)
8. [Environment Setup](#environment-setup)
9. [Testing Guidelines](#testing-guidelines)

---

## 🚨 Critical Information

### Working Test Users
```
seller@test.com
- Striga User ID: b3d32c24-4c4f-4db2-9873-04eb0987fa37
- KYC Status: APPROVED
- Email Verified: true
- Mobile Verified: true
```

### Fixed Credentials (NEVER CHANGE)
```
Admin: f@pachoman.com / C@rlos2025
Test users: seller@test.com, buyer@test.com / password123
```

### Valid KYC Status Values (Database)
- `PENDING` - Default for new users
- `INITIATED` - KYC in progress  
- `PASSED` - KYC approved
- `REJECTED` - KYC rejected
- `EXPIRED` - KYC expired

**❌ NOT VALID**: `NOT_STARTED` (will cause database errors!)

---

## 🔐 Authentication - WORKING METHOD

### ✅ CORRECT HMAC Implementation (August 2025)

```typescript
// This is the EXACT format that works with Striga
const timestamp = Date.now().toString()
const method = options.method || 'GET'
const body = options.body || '{}'

// Create HMAC signature
const hmac = crypto.createHmac('sha256', apiSecret)
hmac.update(timestamp)
hmac.update(method)
hmac.update(endpoint) // Without /api/v1 prefix!

// Create MD5 hash of body
const contentHash = crypto.createHash('md5')
contentHash.update(body)
hmac.update(contentHash.digest('hex'))

const signature = hmac.digest('hex')
const authHeader = `HMAC ${timestamp}:${signature}`

const headers = {
  'authorization': authHeader,  // Use lowercase!
  'api-key': apiKey,
  'Content-Type': 'application/json'
}
```

### ⚠️ Common Authentication Mistakes
- ❌ Using Bearer token format
- ❌ Including /api/v1 in the endpoint for signature
- ❌ Using seconds instead of milliseconds for timestamp
- ❌ Forgetting to MD5 hash the body

---

## 👤 User Management

### 1. User Creation

#### ✅ WORKING Endpoint
```typescript
POST /user/create
```

#### ⚠️ CRITICAL: European Phone Numbers Only!
```javascript
// Striga ONLY accepts European phone numbers
const europeanCodes = {
  '+351': 'PT', // Portugal
  '+34': 'ES',  // Spain
  '+33': 'FR',  // France
  '+49': 'DE',  // Germany
  // ... 30 European countries total
}

// Format mobile correctly
mobile: {
  countryCode: '+351',
  number: '912345678'  // Digits only, no spaces!
}
```

#### Date Format
```javascript
// Convert YYYY-MM-DD to Striga format
const dobDate = new Date(userData.dateOfBirth)
dateOfBirth: {
  year: dobDate.getFullYear(),
  month: dobDate.getMonth() + 1, // JS months are 0-indexed!
  day: dobDate.getDate()
}
```

### 2. User Search by Email

#### ✅ CORRECT Endpoint (Discovered August 2025)
```typescript
POST /user/get-by-email
{
  "email": "user@example.com"
}

// Returns user with userId if exists
// Returns 404 if not found
```

#### ❌ WRONG Endpoints (Don't exist)
- `/users` - Returns 404
- `/user/search` - Returns 404
- `/user?email=...` - Not valid

---

## 🛡️ KYC Implementation

### 1. Complete KYC Flow (MUST follow this order)

1. **Create User** → Automatically sends verification emails/SMS
2. **Verify Email** (`/user/verify-email`)
   ```javascript
   body: {
     userId: 'striga-user-id',
     code: '123456'  // NOT 'verificationCode'!
   }
   ```
3. **Verify Mobile** (`/user/verify-mobile`) 
   ```javascript
   body: {
     userId: 'striga-user-id',
     code: '123456'  // Sandbox always uses 123456
   }
   ```
4. **Start KYC** (`/user/kyc/start`)
5. **Complete KYC** via SumSub integration

### 2. KYC Status Mapping

```typescript
// Map Striga status to our database enum
function mapStrigaStatus(strigaStatus: string): KycStatus {
  switch (strigaStatus) {
    case 'APPROVED':
      return 'PASSED'
    case 'REJECTED':
    case 'FAILED':
      return 'REJECTED'
    case 'IN_REVIEW':
    case 'PENDING':
      return 'INITIATED'
    default:
      return 'PENDING' // NOT 'NOT_STARTED'!
  }
}
```

### 3. Live KYC Status Check

```typescript
// Always fetch live status from Striga
const strigaUser = await strigaApiRequest(`/user/${strigaUserId}`, {
  method: 'GET'
})

// Update local database if changed
if (mappedStatus !== user.kycStatus) {
  await prisma.user.update({
    where: { id: user.id },
    data: { kycStatus: mappedStatus }
  })
}
```

### 4. SumSub Integration (WORKING!)

```javascript
// CRITICAL: The object is called snsWebSdk (lowercase!)
const snsWebSdkInstance = window.snsWebSdk.init(
  token,  // Token from Striga
  () => Promise.resolve(token)  // REQUIRED callback
)
.withConf({
  lang: 'en',
  onMessage: (type, payload) => {
    if (type === 'idCheck.onApplicantSubmitted') {
      // User completed verification
    }
  }
})
.build()

snsWebSdkInstance.launch('#sumsub-websdk-container')
```

---

## 💰 Wallet Operations

### 1. Fetching Wallets

#### ✅ CORRECT Method
```typescript
POST /wallets/get/all
{
  "userId": "striga-user-id",
  "startDate": 1234567890,
  "endDate": 1234567890,
  "page": 1
}
```

#### ❌ WRONG Methods
- `GET /user/{userId}/wallets` - Returns "Invalid fields"
- `GET /wallets` - Not a valid endpoint

### 2. AccountId Location (CRITICAL!)

```typescript
// ❌ WRONG - wallet doesn't have accountId
const accountId = wallet.accountId

// ✅ CORRECT - extract from account object
const accountId = wallet.accounts[currency].accountId
```

### 3. Banking Details for EUR

```typescript
// Enrich account to get IBAN/BIC
const bankDetails = await strigaApiRequest(`/accounts/${accountId}/enrich`, {
  method: 'POST',
  body: JSON.stringify({})
})

// Returns: iban, bic, bankName, accountHolderName
```

### 4. Clipboard Copy (HTTP Fix)

```typescript
// Works on both HTTP and HTTPS
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Fallback for HTTP
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'absolute'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}
```

---

## 🔄 Admin Sync Feature

### Location
Admin Dashboard → Striga API tab → User Synchronization section

### How It Works

1. **For users WITH strigaUserId**: Fetches current status from Striga
2. **For users WITHOUT strigaUserId**: Searches by email using `/user/get-by-email`
3. **Updates local database** with found data

### API Endpoint
```
POST /api/admin/sync-striga
```

### Common Sync Messages
- ✅ "Successfully found and synced user from Striga"
- ⚠️ "User not on Striga DB" (user needs to register first)
- ❌ "Error connecting to Striga" (API issue)

---

## ❌ Common Errors & Solutions

### 1. "Invalid value for argument kycStatus. Expected KycStatus"
**Cause**: Using 'NOT_STARTED' which isn't a valid enum
**Solution**: Use 'PENDING' instead

### 2. "Email and mobile must be verified"
**Cause**: Trying to start KYC before verification
**Solution**: Complete email and mobile verification first

### 3. "No accountId found on wallet"
**Cause**: Looking for accountId on wallet object
**Solution**: Get it from wallet.accounts[currency].accountId

### 4. "504 Gateway Timeout"
**Cause**: Striga API temporary issue
**Solution**: Wait and retry, check Striga status page

### 5. "Failed to fetch KYC status"
**Cause**: Wrong imports in route file
**Solution**: Use `NextRequest` not `Request`, import from 'next-auth' not 'next-auth/next'

---

## 🔧 Environment Setup

### Required Variables (.env.local)
```bash
STRIGA_APPLICATION_ID="4a3a6168-d87a-41ab-ad85-2e937c812b63"
STRIGA_API_KEY="-AXMGvbIKTPVTrXFqrV-B-M9YewL8kPBq2WgwB_QCOM="
STRIGA_API_SECRET="//+kduDcXz9gTuZ+FGBqKSftCKV8OG52OF07kWzztM4="
STRIGA_UI_SECRET="SubDkb2X71QzixH/4s0FlfE80nAJZpnQtEg2DXj/YrE="
STRIGA_BASE_URL="https://www.sandbox.striga.com/api/v1"
```

### Port Configuration
```
ALWAYS use port 3004
Access: http://155.138.165.47:3004
```

---

## 🧪 Testing Guidelines

### 1. Test Credentials
- Email: Any valid email
- Phone: Any European number
- Verification codes: Always "123456" in sandbox

### 2. Test Flow
1. Create user with European phone number
2. Verify email with code "123456"
3. Verify phone with code "123456"
4. Start KYC process
5. Complete SumSub verification
6. Check status via admin sync

### 3. Before ANY Changes
```bash
# Run protection check
./scripts/protect-database.sh

# Test critical features
./test-critical-features.sh
```

---

## 📚 Quick Reference

### Working Endpoints
- `POST /user/create` - Create new user
- `POST /user/get-by-email` - Find user by email
- `GET /user/{userId}` - Get user details
- `POST /user/verify-email` - Verify email
- `POST /user/verify-mobile` - Verify phone
- `POST /user/kyc/start` - Start KYC
- `POST /wallets/get/all` - Get wallets
- `POST /accounts/{accountId}/enrich` - Get banking details

### Status Values
- Striga: APPROVED, REJECTED, IN_REVIEW, PENDING
- Database: PENDING, INITIATED, PASSED, REJECTED, EXPIRED

### Key Files
- `/src/lib/striga.ts` - Core Striga integration
- `/src/app/api/admin/sync-striga/route.ts` - User sync
- `/src/app/api/kyc/status/route.ts` - KYC status check
- `/src/components/admin/striga-config.tsx` - Admin UI

---

## ⚠️ NEVER DO THESE
1. ❌ Use 'NOT_STARTED' as KYC status
2. ❌ Change password hashes in database
3. ❌ Skip email/phone verification before KYC
4. ❌ Look for accountId on wallet object
5. ❌ Use wrong import patterns (Request vs NextRequest)
6. ❌ Include /api/v1 in signature endpoint
7. ❌ Use non-European phone numbers

---

**Last Updated**: August 2025
**Maintained by**: Caenhebo Development Team