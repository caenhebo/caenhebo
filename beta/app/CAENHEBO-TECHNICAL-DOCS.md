# Caenhebo Alpha - Technical Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Frontend Structure](#frontend-structure)
4. [Backend API Routes](#backend-api-routes)
5. [Database Schema](#database-schema)
6. [Authentication Flow](#authentication-flow)
7. [KYC/Striga Integration](#kycstriga-integration)
8. [User Flows](#user-flows)
9. [Environment Configuration](#environment-configuration)
10. [Common Operations](#common-operations)

---

## 🏗️ Project Overview

**Caenhebo Alpha** is a real estate transaction platform for Portugal that facilitates property transactions with cryptocurrency and fiat payment options.

### Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production-ready)
- **Authentication**: NextAuth.js with JWT sessions
- **Payment Processing**: Striga API (crypto/fiat wallets, KYC)
- **Deployment**: PM2 process manager

### 🚨 Port Configuration
**IMPORTANT**: This project runs EXCLUSIVELY on PORT 3004
- Never change the port
- All URLs must use port 3004
- PM2 process: `PORT=3004 pm2 start "npm run dev" --name caenhebo-alpha`

### Key Features
- Multi-role system (Buyer, Seller, Admin)
- KYC/AML compliance via Striga
- Crypto wallet integration (BTC, ETH, BNB, USDT)
- 6-stage property transaction workflow
- Document management system
- Real-time notifications

---

## 🏛️ Architecture

```
/root/coding/claudecode/projects/caenhebo-alpha/app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API endpoints
│   │   ├── admin/             # Admin dashboard
│   │   ├── buyer/             # Buyer dashboard
│   │   ├── seller/            # Seller dashboard
│   │   ├── auth/              # Authentication pages
│   │   └── kyc/               # KYC flow pages
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── admin/            # Admin-specific components
│   │   ├── auth/             # Auth forms
│   │   └── kyc/              # KYC components
│   ├── lib/                   # Utility functions
│   │   ├── prisma.ts         # Database client
│   │   ├── striga.ts         # Striga API integration
│   │   └── countries.ts      # Country data
│   └── types/                 # TypeScript definitions
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
├── public/                    # Static assets
└── uploads/                   # User uploads directory
```

---

## 🎨 Frontend Structure

### Page Routes
| Route | Component | Description | Access |
|-------|-----------|-------------|--------|
| `/` | `app/page.tsx` | Landing page | Public |
| `/auth/signin` | `auth/signin/page.tsx` | Login page | Public |
| `/auth/register` | `auth/register/page.tsx` | Registration | Public |
| `/admin` | `admin/page.tsx` | Admin dashboard | Admin only |
| `/buyer/dashboard` | `buyer/dashboard/page.tsx` | Buyer dashboard | Buyers only |
| `/seller/dashboard` | `seller/dashboard/page.tsx` | Seller dashboard | Sellers only |
| `/kyc` | `kyc/page.tsx` | KYC form | Authenticated |
| `/kyc/verify` | `kyc/verify/page.tsx` | KYC verification | Authenticated |
| `/kyc/callback` | `kyc/callback/page.tsx` | KYC result | Authenticated |

### Key Components

#### Authentication Components
- `components/auth/signin-form.tsx` - Login form with email/password
- `components/auth/register-form.tsx` - Registration with role selection
- `components/header.tsx` - Navigation header with auth state

#### KYC Components
- `components/kyc/kyc-form.tsx` - Full KYC data collection form
- `components/kyc/verification-steps.tsx` - Email/mobile verification
- `components/kyc/sumsub-kyc.tsx` - SumSub SDK integration

#### Admin Components
- `components/admin/striga-config.tsx` - Striga API configuration
- `components/admin/user-list.tsx` - User management table

---

## 🔌 Backend API Routes

### Authentication APIs
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/[...nextauth]` | * | NextAuth.js handler | No |
| `/api/auth/register` | POST | User registration | No |
| `/api/auth/signin` | POST | User login | No |
| `/api/auth/signout` | POST | User logout | Yes |
| `/api/auth/session` | GET | Get current session | No |

### KYC APIs
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/kyc/initiate` | POST | Create Striga user & start KYC | Yes |
| `/api/kyc/start` | POST | Get KYC verification URL | Yes |
| `/api/kyc/status` | GET | Check KYC status | Yes |
| `/api/verify/email` | POST | Verify email with code | Yes |
| `/api/verify/mobile` | POST | Verify mobile with code | Yes |

### User APIs
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/user/payment-preference` | GET | Get payment preference | Yes |
| `/api/user/payment-preference` | PUT | Update payment preference | Yes (Buyer) |

### Admin APIs
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/admin/striga-config` | GET | Get Striga config | Admin |
| `/api/admin/striga-config` | POST | Update Striga config | Admin |
| `/api/admin/striga-test` | POST | Test Striga connection | Admin |

### Webhook APIs
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/webhooks/striga` | POST | Striga webhook handler | Signature |

---

## 💾 Database Schema

### Core Models

#### User
```prisma
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  password          String   // Hashed with bcrypt
  role              UserRole // BUYER, SELLER, ADMIN
  firstName         String
  lastName          String
  phoneNumber       String?
  
  // KYC/Striga
  strigaUserId      String?  @unique
  kycStatus         KycStatus // PENDING, INITIATED, PASSED, REJECTED
  kycSessionId      String?
  
  // Preferences
  paymentPreference PaymentPreference // CRYPTO, FIAT, HYBRID
  
  // Relations
  profile           Profile?
  buyerTransactions Transaction[] @relation("BuyerTransactions")
  sellerTransactions Transaction[] @relation("SellerTransactions")
}
```

#### Property
```prisma
model Property {
  id               String @id @default(cuid())
  code             String @unique // Search code
  title            String
  address          String
  price            Decimal
  sellerId         String
  complianceStatus ComplianceStatus // PENDING, APPROVED, REJECTED
  
  // Relations
  transactions     Transaction[]
  documents        Document[]
}
```

#### Transaction
```prisma
model Transaction {
  id              String @id @default(cuid())
  buyerId         String
  sellerId        String
  propertyId      String
  status          TransactionStatus // DRAFT, NEGOTIATION, ESCROW, COMPLETED
  agreedPrice     Decimal?
  
  // Relations
  buyer           User @relation("BuyerTransactions")
  seller          User @relation("SellerTransactions")
  property        Property
  payments        Payment[]
}
```

---

## 🔐 Authentication Flow

### Registration Flow
1. User fills registration form with:
   - First/Last name
   - Email & Password
   - Role selection (Buyer/Seller)
   - Terms acceptance

2. System creates user with:
   - Hashed password (bcrypt)
   - Default KYC status: PENDING
   - Default payment preference: FIAT

3. Auto sign-in after registration
4. Redirect to role-specific dashboard

### Login Flow
1. Email/password authentication
2. NextAuth creates JWT session
3. Session includes: id, email, role, kycStatus, strigaUserId
4. Redirect based on role

### Session Management
```typescript
// Session type
interface Session {
  user: {
    id: string
    email: string
    name: string
    role: 'BUYER' | 'SELLER' | 'ADMIN'
    kycStatus: 'PENDING' | 'INITIATED' | 'PASSED' | 'REJECTED'
    strigaUserId?: string
    paymentPreference: 'CRYPTO' | 'FIAT' | 'HYBRID'
  }
}
```

---

## 🛡️ KYC/Striga Integration

### Complete KYC Flow

#### 1. User Registration in Striga
```
POST /api/kyc/initiate
→ Collects: firstName, lastName, email, phone, DOB, address
→ Creates Striga user
→ Returns: strigaUserId
```

#### 2. Email Verification
```
POST /api/verify/email
→ Verifies email with code
→ Sandbox: always "123456"
```

#### 3. Mobile Verification
```
POST /api/verify/mobile
→ Verifies mobile with code
→ Sandbox: always "123456"
```

#### 4. KYC Verification
```
POST /api/kyc/start
→ Gets SumSub token from Striga
→ Redirects to /kyc/verify with token
→ SumSub SDK handles verification
```

#### 5. Status Updates
- Webhook receives status changes
- Updates user kycStatus
- Notifies user

### Striga API Configuration
```typescript
// Environment variables needed
STRIGA_APPLICATION_ID="..."
STRIGA_API_KEY="..."
STRIGA_API_SECRET="..."
STRIGA_UI_SECRET="..."
STRIGA_BASE_URL="https://www.sandbox.striga.com/api/v1"
STRIGA_WEBHOOK_SECRET="..."
```

### HMAC Authentication
```typescript
// Signature components (in order):
1. timestamp (milliseconds)
2. HTTP method
3. endpoint (without /api/v1)
4. MD5 hash of body

// Header format:
Authorization: HMAC timestamp:signature
```

---

## 👥 User Flows

### Buyer Flow
1. **Registration** → Select "Buyer" role
2. **Dashboard Access** → Limited until KYC complete
3. **KYC Verification** → Complete identity verification
4. **Payment Setup** → Choose payment preference
5. **Property Search** → Enter property code
6. **Make Offer** → Submit offer with terms
7. **Escrow Payment** → Pay via selected method
8. **Complete Purchase** → Receive property ownership

### Seller Flow
1. **Registration** → Select "Seller" role
2. **Dashboard Access** → Limited until KYC complete
3. **KYC Verification** → Complete identity verification
4. **Digital IBAN** → Setup for receiving payments
5. **List Property** → Submit for compliance check
6. **Review Offers** → Accept/reject buyer offers
7. **Receive Payment** → Via digital IBAN
8. **Transfer Property** → Complete ownership transfer

### Admin Flow
1. **Login** → Admin credentials
2. **Configure Striga** → Add API keys
3. **Manage Users** → View/edit user data
4. **Monitor Transactions** → Track platform activity
5. **Handle Compliance** → Approve/reject properties

---

## ⚙️ Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3018"

# Striga API (stored in .env.local)
STRIGA_APPLICATION_ID="..."
STRIGA_API_KEY="..."
STRIGA_API_SECRET="..."
STRIGA_UI_SECRET="..."
STRIGA_BASE_URL="https://www.sandbox.striga.com/api/v1"
STRIGA_WEBHOOK_SECRET="..."

# App Configuration
NEXT_PUBLIC_APP_URL="http://155.138.165.47:3018"
```

### File Storage
- User documents: `./uploads/`
- Striga config: `.env.local`
- Session data: JWT (stateless)

---

## 🔧 Common Operations

### Starting the Application
```bash
# Development
npm run dev

# Production with PM2
pm2 start "npm run dev" --name caenhebo-alpha
pm2 logs caenhebo-alpha
```

### Database Operations
```bash
# Run migrations
npx prisma migrate dev

# Reset database (WARNING: This deletes all data!)
npx prisma migrate reset

# Seed database with test users
npx prisma db seed

# View data
npx prisma studio
```

### Database Seed
The project includes a seed file (`prisma/seed.ts`) that automatically creates test users:
- **Admin**: f@pachoman.com / admin123
- **Buyer**: buyer@test.com / C@rlos2025  
- **Seller**: seller@test.com / C@rlos2025

**Important**: The seed runs automatically after `prisma migrate reset` but can be run manually with `npx prisma db seed`

### Testing Flows
```bash
# Test accounts
Admin: f@pachoman.com / admin123
Buyer: buyer@test.com / C@arlos2025
Seller: seller@test.com / C@arlos2025

# Test Striga connection (as admin)
1. Login as admin
2. Go to /admin
3. Configure Striga API keys
4. Click "Test Connection"
```

### Debugging
```bash
# View logs
pm2 logs caenhebo-alpha --lines 100

# Check errors only
pm2 logs caenhebo-alpha --err

# Monitor in real-time
pm2 monit
```

---

## 🚀 Deployment Checklist

- [ ] Set production DATABASE_URL
- [ ] Generate secure NEXTAUTH_SECRET
- [ ] Configure production Striga API keys
- [ ] Set up webhook URL in Striga dashboard
- [ ] Configure email service
- [ ] Set up file storage (S3/similar)
- [ ] Enable HTTPS
- [ ] Set up monitoring/logging
- [ ] Configure backup strategy

---

## 📝 Notes

- Sandbox KYC codes are always "123456"
- All amounts are stored as Decimal in database
- Passwords are hashed with bcrypt (10 rounds)
- Sessions expire after 30 days
- File uploads limited to 10MB
- Supported countries: EU + selected others

---

Last Updated: December 2024
Version: 1.0.0