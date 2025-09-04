# caenhebo-alpha

## 🚨 IMPORTANT: PORT CONFIGURATION
**This project runs EXCLUSIVELY on PORT 3018**
- Development: http://localhost:3018
- Production: http://155.138.165.47:3018
- DO NOT switch ports or use any other port
- All environment files must use PORT=3018

## 🏦 STRIGA Expert Agent Available
For any Striga API, KYC, or payment issues, use the specialized STRIGA agent:
- **Launch**: `/root/striga-agent.sh`
- **Expertise**: 20 years Full Stack + Complete Striga API knowledge
- **Safety**: Never breaks existing features, always tests first

## MUSK3 Project - Orchestrator-Worker Pattern
This project uses MUSK3's advanced orchestrator-worker pattern based on Anthropic's multi-agent research system.

## Key Features
- Dynamic subagent spawning
- Parallel task execution
- Context-aware orchestration
- Efficient resource management

## Structure
- Tasks: .musk3/tasks/
- Orchestrator: .musk3/orchestrator/
- Subagents: .musk3/subagents/
- Synthesis: .musk3/synthesis/

## 🔑 Important Project Documents

### 📚 Caenhebo Technical Documentation
**COMPREHENSIVE**: Full technical overview of the project:
- **[/root/coding/claudecode/projects/caenhebo-alpha/app/CAENHEBO-TECHNICAL-DOCS.md](./app/CAENHEBO-TECHNICAL-DOCS.md)**

This document contains:
- Complete architecture overview
- All API endpoints and their functions
- Database schema and relationships
- User flows and authentication
- Frontend component structure
- Common operations and debugging

### Development Rules (READ FIRST!)
**MANDATORY**: Before making ANY code changes:
- **[/root/coding/claudecode/projects/caenhebo-alpha/app/DEVELOPMENT-RULES.md](./app/DEVELOPMENT-RULES.md)**

This prevents breaking existing features and ensures proper testing.

### 🏦 Striga API Integration - MASTER GUIDE
**🚨 MANDATORY**: Before ANY Striga work, ALWAYS read:
- **[/root/coding/claudecode/projects/caenhebo-alpha/CAENHEBO-STRIGA-GUIDE.md](./CAENHEBO-STRIGA-GUIDE.md)**

This is the CONSOLIDATED guide that contains:
- ✅ All working implementations from our experience
- ✅ Correct endpoints (including `/user/get-by-email` we discovered)
- ✅ Authentication that actually works
- ✅ Common errors and their fixes
- ✅ Test user data (seller@test.com with Striga ID)
- ✅ Valid KYC status values (NO 'NOT_STARTED'!)

**Other Striga documents** (now consolidated into the master guide):
- tipsforstriga.md - Original implementation notes
- striga-api-integration-guide.md - Best practices

**ALWAYS check CAENHEBO-STRIGA-GUIDE.md FIRST!**

### ⚠️ STRIGA WORK RULES - DO NOT BREAK WORKING CODE!
1. **NEVER REWRITE WORKING STRIGA INTEGRATIONS**
   - The current implementation WORKS - don't "improve" it
   - Check CAENHEBO-STRIGA-GUIDE.md for what's already working
   - Test the existing feature first before changing anything

2. **BACKUP BEFORE TOUCHING STRIGA FILES**
   ```bash
   cp src/lib/striga.ts src/lib/striga.ts.backup
   cp src/app/api/admin/sync-striga/route.ts src/app/api/admin/sync-striga/route.ts.backup
   ```

3. **IF STRIGA SYNC WORKS, DON'T CHANGE IT**
   - The admin sync feature is WORKING
   - It correctly searches users by email
   - It properly updates the database
   - DO NOT "refactor" or "optimize" it

## 🚨 CRITICAL: DATABASE PROTECTION RULES

### NEVER MODIFY THESE CREDENTIALS
```
Admin User:
- Email: f@pachoman.com  
- Password: C@rlos2025

Test Users:
- seller@test.com / password123
- buyer@test.com / password123
```

### DATABASE MODIFICATION RULES
1. **NEVER UPDATE PASSWORDS** - If login fails, fix the code, not the database
2. **NEVER CHANGE USER DATA** without explicit permission
3. **ALWAYS CREATE BACKUPS** before any database operation
4. **READ-ONLY BY DEFAULT** - Only SELECT queries unless asked

### Run Protection Check
```bash
./scripts/protect-database.sh
```

## 🧪 Debug and Test Tools

### KYC Verification Debug Pages
These tools help diagnose KYC and verification issues:

1. **Mobile Verification Debug Tool**: http://155.138.165.47:3018/test-mobile-verification.html
   - Tests authentication flow
   - Checks Striga user status
   - Shows KYC status response
   - Highlights phoneVerified/mobileVerified values
   - Identifies verification stage issues

2. **Simple Browser Test Guide**: http://155.138.165.47:3018/simple-browser-test.html
   - Step-by-step manual testing instructions
   - Shows expected behavior at each stage
   - Helps identify where the flow breaks

### Test Scripts (in app directory)
- `test-kyc-sync.js` - Direct Striga API testing
- `direct-test-kyc.js` - Database values and logic verification
- `manual-test-kyc.sh` - Curl-based API testing
- `test-kyc-detailed.js` - Detailed session and KYC flow testing

### Using the Debug Tools
1. When users report KYC issues, first use the Mobile Verification Debug Tool
2. Click through buttons 1-4 in order to test the complete flow
3. Look for highlighted fields showing verification status
4. Check if the stage matches the verification status

Common issues these tools help diagnose:
- Phone/email verification not syncing with Striga
- KYC stage stuck at wrong step
- Session authentication problems
- Boolean value conversion issues (1/0 vs true/false)

## 🚨 CRITICAL: PREVENTING FEATURE BREAKAGE

### MANDATORY RULES TO PREVENT BREAKING EXISTING FEATURES

1. **ALWAYS TEST BEFORE CHANGING**
   ```bash
   # Use the automated test script:
   ./test-critical-features.sh
   
   # Or test manually:
   curl http://localhost:3018/api/kyc/status -H "Cookie: <session-cookie>"
   curl http://localhost:3018/api/auth/session -H "Cookie: <session-cookie>"
   # Save the responses to compare after changes
   ```

2. **NEVER MODIFY WORKING CODE WITHOUT BACKUP**
   ```bash
   # Before editing ANY file:
   cp src/app/api/kyc/status/route.ts src/app/api/kyc/status/route.ts.backup
   # After changes, if something breaks:
   cp src/app/api/kyc/status/route.ts.backup src/app/api/kyc/status/route.ts
   ```

3. **VERIFY IMPORTS MATCH WORKING PATTERNS**
   - ✅ CORRECT: `import { NextRequest, NextResponse } from 'next/server'`
   - ❌ WRONG: `import { NextResponse } from 'next/server'` with `Request`
   - ✅ CORRECT: `import { getServerSession } from 'next-auth'`
   - ❌ WRONG: `import { getServerSession } from 'next-auth/next'`

4. **CHECK CRITICAL FEATURES AFTER EVERY CHANGE**
   ```bash
   # Run this checklist after ANY modification:
   # 1. Login works
   curl -X POST http://localhost:3018/api/auth/callback/credentials \
     -H "Content-Type: application/json" \
     -d '{"email":"seller@example.com","password":"password123"}'
   
   # 2. KYC status endpoint responds
   curl http://localhost:3018/api/kyc/status -H "Cookie: <session-cookie>"
   
   # 3. Dashboard loads without errors
   curl http://localhost:3018/seller/dashboard -H "Cookie: <session-cookie>"
   ```

5. **MAINTAIN A FEATURE STATUS LOG**
   ```
   Feature Status (Update after each change):
   ✅ Authentication: Working
   ✅ KYC Status API: Working (Fixed imports)
   ✅ Seller Dashboard: Working
   ✅ Buyer Dashboard: Working
   ✅ Wallet Management: Working
   ✅ Property Listings: Working
   ```

6. **ROLLBACK IMMEDIATELY IF SOMETHING BREAKS**
   ```bash
   # If a feature stops working:
   git diff  # See what changed
   git checkout -- <broken-file>  # Revert the file
   pm2 restart caenhebo-alpha  # Restart the server
   ```

### KNOWN WORKING CONFIGURATIONS

#### KYC Status Route (DO NOT BREAK THIS!)
- File: `/src/app/api/kyc/status/route.ts`
- Critical imports:
  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { getServerSession } from 'next-auth'
  import { authOptions } from '@/app/api/auth/[...nextauth]/route'
  import { prisma } from '@/lib/prisma'
  import { strigaApiRequest } from '@/lib/striga'
  ```

#### Authentication (DO NOT BREAK THIS!)
- Password hash format: `$2b$10$...` (bcrypt with cost 10)
- Test credentials:
  - seller@example.com / password123
  - buyer@example.com / password123
  - john.silva@example.com / password123

### FEATURE DEPENDENCY MAP
```
Authentication (auth)
    ├─> KYC Status (/api/kyc/status)
    ├─> Dashboard Pages
    └─> All API Routes

KYC System
    ├─> Striga User Creation
    ├─> Email/Phone Verification
    └─> Wallet Creation

Wallet System
    ├─> Requires KYC Approved
    └─> Striga API Integration
```

## Project Overview
Caenhebo Alpha is a real estate transaction platform for Portugal that supports:
- Cryptocurrency payments (BTC, ETH, BNB, USDT)
- Traditional fiat payments
- Hybrid payment options
- Full KYC/AML compliance via Striga
- 6-stage property transaction workflow

## 🛠️ Development Configuration
- **Port**: 3018 (NEVER change this)
- **PM2 Process Name**: caenhebo-alpha
- **Start Command**: `PORT=3018 pm2 start "npm run dev" --name caenhebo-alpha`
- **Access URL**: http://155.138.165.47:3018
- **Environment**: All .env files must specify PORT=3018 and NEXTAUTH_URL with port 3018
