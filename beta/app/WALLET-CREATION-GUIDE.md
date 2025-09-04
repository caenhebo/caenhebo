# Wallet Creation Guide for Caenhebo Alpha

## Overview
This guide ensures that all KYC-approved users automatically get their crypto wallets and payment accounts created. This prevents the issue where users pass KYC but can't access their wallets.

## How Wallet Creation Works

### 1. Automatic Creation (Primary Method)
When a user's KYC is approved, wallets are created automatically through:

#### A. Striga Webhook
- When KYC status changes to `PASSED`, Striga sends a webhook
- The webhook handler (`/api/webhooks/striga/route.ts`) creates wallets
- Creates 4 crypto wallets (BTC, ETH, BNB, USDT) for all users
- Creates EUR wallet and Digital IBAN for sellers

#### B. Admin Sync
- When admin syncs user data from Striga (`/api/admin/sync-striga`)
- If KYC status changes from non-PASSED to PASSED, wallets are created
- Uses the `ensureUserWallets` function from `wallet-manager.ts`

### 2. Manual Creation (Fallback Methods)

#### A. User-Initiated Sync
- Users can click "Create Missing Wallets" button on dashboard
- Calls `/api/wallets/sync` endpoint
- Creates any missing wallets immediately

#### B. Background Service
- Run `wallet-check-service.js` as a PM2 process
- Checks every hour for users with missing wallets
- Automatically creates missing wallets

#### C. One-Time Scripts
- `scripts/sync-wallets-for-kyc-users.js` - Creates wallets for all KYC users
- `scripts/populate-seller-wallets.js` - Populates test data

### 3. Monitoring and Health Checks

Run the health monitor to detect issues:
```bash
node scripts/monitor-wallet-health.js
```

This reports:
- KYC-approved users with no wallets
- Users with incomplete wallet setup
- Failed webhook processing
- Summary statistics

## Required Wallets by User Type

### Buyers (4 wallets)
- BTC - Bitcoin wallet
- ETH - Ethereum wallet  
- BNB - Binance Coin wallet
- USDT - Tether wallet

### Sellers (5 wallets + IBAN)
- All 4 crypto wallets above
- EUR - Euro fiat wallet
- Digital IBAN for receiving payments

## Preventing Missing Wallets

### 1. Enable Background Service
```bash
# Start wallet check service
pm2 start scripts/wallet-check-service.js --name wallet-checker

# Save PM2 configuration
pm2 save
pm2 startup
```

### 2. Set Up Daily Monitoring
Add to crontab:
```bash
# Daily wallet health check at 9 AM
0 9 * * * cd /path/to/app && node scripts/monitor-wallet-health.js >> wallet-health.log 2>&1
```

### 3. Ensure Striga Credentials
Required environment variables:
```env
STRIGA_API_KEY=your_api_key
STRIGA_API_SECRET=your_secret
STRIGA_BASE_URL=https://www.sandbox.striga.com/api/v1
```

### 4. Webhook Configuration
Ensure Striga webhooks are configured for:
- `KYC_STATUS_CHANGED`
- `WALLET_CREATED`
- `IBAN_CREATED`

## Troubleshooting

### Issue: User passed KYC but no wallets showing

1. **Check wallet count in database:**
```javascript
node scripts/debug-wallet-issue.js
```

2. **Manually create wallets for specific user:**
```javascript
// Edit scripts/populate-seller-wallets.js with user email
// Then run:
node scripts/populate-seller-wallets.js
```

3. **Run full sync for all users:**
```javascript
node scripts/sync-wallets-for-kyc-users.js
```

### Issue: Wallet creation failing

1. **Check Striga credentials:**
- Verify `STRIGA_API_KEY` and `STRIGA_API_SECRET` are set
- Test API connection with curl

2. **Check rate limits:**
- Striga has 10 requests/second limit
- The wallet-manager includes delays

3. **Review logs:**
```bash
pm2 logs caenhebo-alpha | grep -i wallet
pm2 logs wallet-checker
```

## Best Practices

1. **Always run the wallet check service** - This is your safety net
2. **Monitor webhook failures** - Failed webhooks = missing wallets
3. **Use the health monitor** - Daily checks prevent issues
4. **Test after KYC approval** - Verify wallets are created
5. **Keep credentials secure** - Use environment variables only

## API Endpoints

### GET /api/wallets
- Returns user's wallets from Striga API
- Falls back to mock data if API unavailable

### POST /api/wallets/sync
- Manually creates missing wallets for current user
- Requires authentication

### POST /api/wallets/create
- Creates a single wallet for specific currency
- Used internally by sync processes

### POST /api/admin/sync-striga
- Admin-only endpoint to sync all users
- Now includes automatic wallet creation

## Database Schema

### Wallet Table
- `userId` - Links to User
- `strigaWalletId` - Striga's wallet identifier  
- `currency` - BTC, ETH, BNB, USDT, EUR
- `address` - Blockchain address (null for EUR)
- `balance` - Current balance

### DigitalIban Table  
- `userId` - Links to User
- `iban` - IBAN number
- `bankName` - Bank name
- `accountNumber` - Account number
- `active` - Is this IBAN active

## Summary

To ensure wallets are always created:

1. ✅ Webhook handler creates wallets on KYC approval
2. ✅ Admin sync creates wallets when detecting KYC change
3. ✅ Background service checks hourly for missing wallets
4. ✅ Manual sync button for users to create wallets
5. ✅ Monitoring script to detect issues early

With all these safeguards in place, users should never experience missing wallets after KYC approval.