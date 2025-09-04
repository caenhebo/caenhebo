# 📋 Product Requirements Document (PRD)
## Caenhebo Alpha - Real Estate Transaction Execution Platform

### 📊 Executive Summary

**Project**: Caenhebo Alpha - A transaction execution platform for real estate deals in Portugal where buyers search properties by code and complete transactions.

**Vision**: Streamline the entire real estate transaction process from property compliance to final payment, enabling secure crypto/fiat/hybrid payments through compliant escrow services.

**Key Objectives**:
- Enable property search by code and negotiation
- Provide instant KYC verification via Striga/SumSub APIs
- Manage property compliance and documentation
- Handle secure escrow for crypto, fiat, and hybrid payments
- Generate €36,000+ monthly revenue (3% from each party + €50 subscriptions)

### 👥 User Stories

**Stage 1 - User Onboarding**:
1. As a **User**, I want to register with email/password and verify my email
2. As a **User**, I want to complete KYC via SumSub through Striga
3. As a **User**, I want to choose my payment preference (crypto/fiat/hybrid)
4. As a **User**, I want automatic wallet creation for all crypto options
5. As a **Seller**, I want automatic digital IBAN creation for receiving payments

**Stage 2 - Seller Property Compliance**:
6. As a **Seller**, I want to upload or digitally sign the compliance declaration
7. As a **Seller**, I want to upload all required property documents
8. As a **Seller**, I want to schedule an interview after document verification
9. As an **Admin**, I want to take notes and approve/reject during interviews
10. As an **Admin**, I want to offer property valuation service with payment link
11. As a **Seller**, I want to track my compliance status (pending/rejected/approved)

**Stage 3 - Representation & Mediation**:
12. As a **Seller**, I want to choose if I have a representative (yes/no)
13. As a **Seller with representative**, I want to upload the legalized document
14. As a **Buyer**, I want to choose if I have a representative (yes/no)
15. As a **Buyer with representative**, I want to upload the representation document
16. As **Both Parties**, I want to digitally sign the mediation agreement
17. As **Both Parties**, I want to receive email copies of signed agreements

**Stage 4 - Proposal Dashboard**:
18. As a **Buyer**, I want to search properties by code
19. As a **Buyer**, I want to see property information (location, price)
20. As a **Buyer**, I want to show interest in a property
21. As a **Seller**, I want to see buyer interest notifications
22. As a **Seller**, I want to adjust price for specific buyers
23. As a **Buyer**, I want to propose payment conditions (% crypto/fiat split)
24. As a **Seller**, I want to accept conditions with double confirmation
25. As **Both Parties**, I want to download agreement PDFs from dashboard

**Stage 5A - Fiat Payment Process**:
26. As a **Seller**, I want to provide transfer instructions
27. As a **Buyer**, I want to see transfer instructions clearly
28. As a **Buyer**, I want to upload payment proof screenshots
29. As a **Seller**, I want to confirm receipt of fiat payment

**Stage 5B - Crypto Payment Process**:
30. As a **Buyer**, I want to see my wallet QR code and address
31. As a **Buyer**, I want to send test transaction (€20-100)
32. As a **Platform**, I want Striga to verify test transaction
33. As a **Buyer**, I want to transfer crypto to my platform wallet
34. As a **Buyer**, I want to transfer from my wallet to seller's wallet
35. As an **Admin**, I want to confirm crypto arrival and approve
36. As a **Platform**, I want to convert crypto to EUR in seller's digital IBAN
37. As an **Admin**, I want to confirm EUR arrival and approve transfer
38. As a **Seller**, I want automatic transfer to my personal IBAN

**Stage 5C - Hybrid Payment Process**:
39. As a **Buyer**, I want to complete both fiat and crypto portions
40. As a **Seller**, I want to confirm receipt of both payment types

**Stage 6 - Property Transfer**:
41. As a **Seller**, I want to confirm readiness for final payment
42. As a **Buyer**, I want to complete remaining payment per P&S terms
43. As a **Platform**, I want to manage deposit retention if deadline missed
44. As **Both Parties**, I want to download final purchase agreement
45. As **Both Parties**, I want to upload notarized documents
46. As **Both Parties**, I want to receive complete transaction report

### 🔧 Functional Requirements

**1. User Onboarding**
- Email/password registration with verification
- Basic information form with T&C acceptance
- KYC process via SumSub (integrated through Striga)
- Payment preference selection (crypto/fiat/hybrid)
- Automatic wallet creation for ALL users (BTC, ETH, BNB, USDT)
- Automatic digital IBAN creation for sellers

**2. Seller Property Compliance**
- Compliance declaration upload or digital signing
- Required documents upload:
  - Energy certificate
  - Municipal license
  - Predial registration
  - Caderneta predial urbana
  - Additional documents (optional)
- Document verification system
- Interview booking link generation after verification
- Admin interface with:
  - Note-taking during interviews
  - Approve/Reject buttons
  - Property valuation service payment link
- Seller status tracking (pending/rejected/approved)
- Compliance dashboard showing all steps

**3. Representation & Mediation**
- Representation choice for both parties (Yes/No)
- Legalized document upload for representatives
- Conditional flow:
  - No representative → Direct to mediation
  - Has representative → Upload document → Then mediation
- Digital mediation agreement signing
- Automatic email delivery of signed documents

**4. Proposal Dashboard**
- Property search by code functionality
- Property information display (location, price focus)
- "Show Interest" button for buyers
- Seller notifications for buyer interest
- Dynamic pricing per buyer
- Payment conditions proposal interface:
  - Initial payment percentage
  - Crypto/Fiat split configuration
  - Easy setup UI
- Double confirmation for acceptance
- PDF generation and download:
  - Purchase Agreement Term Sheet
  - Promissory P&S Agreement
- Payment confirmation before signing

**5. Payment Processing**

**5A. Fiat Payment**
- Seller inputs transfer instructions
- Buyer views instructions clearly
- Screenshot upload for payment proof
- Seller confirmation of receipt

**5B. Crypto Payment**
- Wallet QR code and address display
- Test transaction (€20-100 range selector)
- Striga API verification
- Multi-step escrow process:
  - Buyer wallet → Buyer platform wallet
  - Buyer platform wallet → Seller platform wallet
  - Admin confirmation at each step
  - Seller wallet → Seller digital IBAN (auto-conversion)
  - Admin confirmation of EUR arrival
  - Digital IBAN → Personal IBAN (automatic)

**5C. Hybrid Payment**
- Split payment tracking per P&S conditions
- Parallel fiat and crypto processes
- Combined confirmation requirements

**6. Property Transfer**
- Seller readiness confirmation
- Deadline management per P&S terms
- Automatic deposit retention logic
- Final payment completion
- Purchase agreement generation
- Notarized document upload
- Transaction report generation
- Email delivery of complete documentation

**7. Platform Features**
- Multi-stage transaction tracking
- Role-based dashboards (buyer/seller/admin)
- Document management system
- Email notification system
- Striga wallet integration
- Digital IBAN management
- Interview scheduling system
- Payment tracking (all methods)
- Conditional workflow engine
- PDF generation and storage

### 🔌 Striga API Integration Requirements

**📚 Implementation Guide**: Consult `/root/coding/claudecode/projects/caenhebo-alpha/uploads/striga-api-integration-guide.md` for detailed implementation instructions and best practices.

**Authentication**:
- HMAC SHA-256 signature for all requests
- Timestamp validation (milliseconds)
- Separate API keys for sandbox/production
- Required headers: api-key, Authorization, x-timestamp

**User Management**:
- Create Striga user after local registration
- Store striga_user_id in database
- Required fields: firstName, lastName, email, mobile (with country code), full address, DOB (YYYY-MM-DD)

**KYC Process**:
- Integration with SumSub via Striga
- Webhook handling for status updates (PENDING, PASSED, REJECTED, EXPIRED)
- No polling - use webhooks only
- Store KYC session IDs for debugging

**Wallet Operations**:
- Use POST `/wallets/get/all` endpoint (NOT GET)
- Multi-currency wallet structure (BTC, ETH, BNB, USDT)
- Create wallets only after KYC approval
- Display wallet addresses with QR codes

**Critical Implementation Notes**:
- Rate limiting: 10 requests/second
- Webhook signature verification required
- Environment-specific configurations
- Comprehensive error handling with proper user feedback
- Test in sandbox before production

### 🏗️ Technical Architecture Options

#### **Option A: Next.js Full-Stack (Recommended)**
**Stack**: Next.js 14, TypeScript, Prisma, PostgreSQL, Tailwind + shadcn/ui

**Pros**:
- Single codebase for frontend/backend
- Excellent TypeScript support
- Built-in API routes
- Great developer experience
- Easy deployment on Vercel

**Cons**:
- Potential vendor lock-in
- Learning curve for team unfamiliar with Next.js

**Rationale**: Best for rapid MVP development with small team

#### **Option B: MERN Stack**
**Stack**: React, Node.js/Express, MongoDB, Material-UI

**Pros**:
- Widely known technology
- Flexible architecture
- Good for complex applications
- NoSQL flexibility

**Cons**:
- More boilerplate code
- Separate frontend/backend deployment
- More initial setup time

**Rationale**: Good if team has MERN experience

#### **Option C: Django + React**
**Stack**: Django REST, React, PostgreSQL, Ant Design

**Pros**:
- Django's built-in admin panel
- Excellent ORM
- Strong security features
- Python ecosystem for data processing

**Cons**:
- Two different languages to maintain
- More complex deployment
- Slower initial development

**Rationale**: Best for long-term scalability and if team knows Python

### 📏 Non-Functional Requirements

**Performance**:
- Page load < 3 seconds
- API response < 500ms
- Support 100 concurrent users

**Security**:
- HTTPS everywhere
- API key encryption
- GDPR compliance
- Secure document storage

**Usability**:
- Mobile-responsive design
- Support for PT, EN languages
- Accessibility (WCAG 2.1 AA)

### 📈 Success Metrics

**Primary KPIs**:
- 20 sellers onboarded/month
- 30 buyers registered/month
- 5-10 completed transactions/month
- €50K+ transaction volume/month
- €36,000+ revenue/month (6% fees + subscriptions)

**Secondary Metrics**:
- KYC approval rate > 95%
- Property compliance approval rate > 80%
- Average time to complete transaction < 30 days
- Test transaction success rate > 99%
- Platform uptime > 99.9%
- Striga API success rate > 99.5%
- Admin response time < 24 hours

### ⚠️ Risk Assessment

**Technical Risks**:
- Striga API downtime → Implement status page and notifications
- Crypto price volatility → Clear disclaimers, real-time pricing
- Document security → Encryption at rest and in transit

**Business Risks**:
- Regulatory changes → Legal advisor on retainer
- Low adoption → Marketing campaign, referral program
- Competition → Focus on UX and Portuguese market

### 🚀 MVP Scope (Phase 1)

**Must Have**:
- User registration with email verification
- KYC integration (SumSub via Striga)
- Payment preference selection (crypto/fiat/hybrid)
- Automatic wallet creation for ALL users
- Digital IBAN creation for sellers
- Property document upload system (4 required + optional)
- Interview scheduling with booking links
- Admin interface with notes and approve/reject
- Property valuation service payment option
- Property search by code
- Buyer interest notifications
- Dynamic pricing per buyer
- Payment conditions proposal (% splits)
- Representation choice workflow (both parties)
- Mediation agreement digital signing
- Multi-step crypto escrow with admin approvals
- Fiat payment with screenshot proof
- Hybrid payment support
- Deadline management with deposit retention
- Transaction report generation

**Nice to Have** (Phase 2):
- €50 verification fee payment via Stripe
- Power of Attorney workflow
- Advanced payment reports
- Multi-language support (PT/EN)
- Mobile app
- Automated notary integration

---

## 🎯 Recommendation

I strongly recommend **Option A (Next.js Full-Stack)** for the following reasons:

1. **Fastest time to market** - Critical for alpha version
2. **Best match with shadcn/ui** - As specified in requirements
3. **Unified codebase** - Easier for small team to manage
4. **Excellent Striga/Stripe integration** support
5. **Cost-effective hosting** on Vercel

### ⚖️ Legal Agreements

**User Acceptance Documents (During Registration)**:
1. **Terms and Conditions** - Platform usage rules and user obligations
2. **Privacy Policy** - Data collection, storage, and usage policies
3. **Striga Terms of Service** - Third-party payment processor terms
4. **AML/KYC Policy** - Anti-money laundering and compliance requirements
5. **Fee Schedule** - Clear breakdown of all platform fees (3% + 3% + €50)

**Transaction Template Documents**:
1. **Buyer's Purchase Agreement Template** - Initial negotiation document
2. **Seller Representation Agreement** - Seller's authorization to list
3. **Promissory Purchase & Sale Agreement** - Binding sale contract
4. **Power of Attorney Template** (Optional) - For representative transactions
5. **Escrow Agreement** - Terms for holding funds during transaction
6. **Final Purchase & Sale Agreement** - Closing document

**Platform Operational Documents**:
1. **Mediation Agreement** - Dispute resolution procedures
2. **Electronic Signature Consent** - Authorization for digital signatures
3. **Cryptocurrency Risk Disclosure** - Volatility and risk warnings
4. **Data Processing Agreement** - GDPR compliance for EU users
5. **Refund Policy** - Conditions for fee refunds
6. **Platform Liability Disclaimer** - Limitation of platform liability

**Compliance Documents**:
1. **KYC Consent Form** - Permission to verify identity
2. **Source of Funds Declaration** - For AML compliance
3. **Tax Responsibility Notice** - User's tax obligations
4. **Cross-Border Transaction Disclosure** - International transfer rules

**Implementation Requirements**:
- All documents must be reviewed by Portuguese legal counsel
- Version control for all legal documents
- User must actively accept (checkbox + button click)
- Store acceptance timestamps and document versions
- Ability to update terms with user re-acceptance
- Multi-language support (PT and EN minimum)
- PDF download option for all signed documents
- Email confirmation of acceptance

### 📝 Additional Technical Specifications

**Database Schema Requirements**:
- Users table with striga_user_id field
- Transactions table with status tracking
- KYC sessions table for debugging
- Webhook events table for idempotency
- Document versions table

**API Endpoints Required**:
- POST `/api/auth/register` - User registration
- POST `/api/auth/verify-email` - Email verification
- POST `/api/kyc/initiate` - Start KYC process
- POST `/api/kyc/webhook` - Striga webhook handler
- GET `/api/wallets` - Fetch user wallets
- POST `/api/seller/compliance/upload` - Document uploads
- POST `/api/seller/compliance/interview` - Schedule interview
- POST `/api/admin/compliance/review` - Admin approval/rejection
- POST `/api/admin/valuation-link` - Generate property valuation payment
- GET `/api/property/search` - Search by code
- POST `/api/property/interest` - Show buyer interest
- POST `/api/property/price-adjust` - Seller price adjustment
- POST `/api/proposal/conditions` - Payment conditions proposal
- POST `/api/payment/fiat/instructions` - Seller bank details
- POST `/api/payment/fiat/proof` - Upload payment proof
- POST `/api/payment/crypto/test` - Test transaction
- POST `/api/payment/crypto/escrow` - Multi-step escrow
- POST `/api/admin/escrow/approve` - Admin escrow approvals
- GET `/api/transaction/report` - Generate final report

**Environment Variables**:
```
STRIGA_API_KEY
STRIGA_SECRET
STRIGA_BASE_URL
STRIGA_WEBHOOK_SECRET
STRIPE_API_KEY
STRIPE_WEBHOOK_SECRET
DATABASE_URL
NEXTAUTH_SECRET
EMAIL_SERVER_HOST
EMAIL_SERVER_PORT
EMAIL_FROM
```

**Status**: ✅ Updated with Striga API implementation requirements. Awaiting approval to proceed with implementation.