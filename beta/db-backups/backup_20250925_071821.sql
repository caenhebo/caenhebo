--
-- PostgreSQL database dump
--

\restrict Ux696ohNhDBDnMgzBzjpQpE77EoDgYO1e3AjeDlz6DoNhULDPANL15VSFj0QI2r

-- Dumped from database version 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ComplianceStatus; Type: TYPE; Schema: public; Owner: caenhebo
--

CREATE TYPE public."ComplianceStatus" AS ENUM (
    'PENDING',
    'REJECTED',
    'APPROVED'
);


ALTER TYPE public."ComplianceStatus" OWNER TO caenhebo;

--
-- Name: DocumentType; Type: TYPE; Schema: public; Owner: caenhebo
--

CREATE TYPE public."DocumentType" AS ENUM (
    'ENERGY_CERTIFICATE',
    'MUNICIPAL_LICENSE',
    'PREDIAL_REGISTRATION',
    'CADERNETA_PREDIAL_URBANA',
    'COMPLIANCE_DECLARATION',
    'REPRESENTATION_DOCUMENT',
    'MEDIATION_AGREEMENT',
    'PURCHASE_AGREEMENT',
    'PAYMENT_PROOF',
    'NOTARIZED_DOCUMENT',
    'TITLE_DEED',
    'CERTIFICATE',
    'PHOTO',
    'FLOOR_PLAN',
    'OTHER',
    'USAGE_LICENSE',
    'LAND_REGISTRY',
    'TAX_REGISTER',
    'OWNER_AUTHORIZATION',
    'CONTRACT',
    'PROOF_OF_PAYMENT',
    'LEGAL_DOCUMENT'
);


ALTER TYPE public."DocumentType" OWNER TO caenhebo;

--
-- Name: KycStatus; Type: TYPE; Schema: public; Owner: caenhebo
--

CREATE TYPE public."KycStatus" AS ENUM (
    'PENDING',
    'INITIATED',
    'PASSED',
    'REJECTED',
    'EXPIRED'
);


ALTER TYPE public."KycStatus" OWNER TO caenhebo;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: caenhebo
--

CREATE TYPE public."NotificationType" AS ENUM (
    'NEW_OFFER',
    'OFFER_ACCEPTED',
    'OFFER_REJECTED',
    'COUNTER_OFFER',
    'PROPERTY_APPROVED',
    'PROPERTY_REJECTED',
    'PROPERTY_INTEREST',
    'DOCUMENT_UPLOADED',
    'TRANSACTION_STATUS_CHANGE',
    'KYC_STATUS_CHANGE',
    'INTERVIEW_SCHEDULED'
);


ALTER TYPE public."NotificationType" OWNER TO caenhebo;

--
-- Name: PaymentPreference; Type: TYPE; Schema: public; Owner: caenhebo
--

CREATE TYPE public."PaymentPreference" AS ENUM (
    'CRYPTO',
    'FIAT',
    'HYBRID'
);


ALTER TYPE public."PaymentPreference" OWNER TO caenhebo;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: caenhebo
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public."PaymentStatus" OWNER TO caenhebo;

--
-- Name: TransactionStatus; Type: TYPE; Schema: public; Owner: caenhebo
--

CREATE TYPE public."TransactionStatus" AS ENUM (
    'OFFER',
    'NEGOTIATION',
    'AGREEMENT',
    'KYC2_VERIFICATION',
    'FUND_PROTECTION',
    'CLOSING',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."TransactionStatus" OWNER TO caenhebo;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: caenhebo
--

CREATE TYPE public."UserRole" AS ENUM (
    'BUYER',
    'SELLER',
    'ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO caenhebo;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO caenhebo;

--
-- Name: bank_accounts; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.bank_accounts (
    id text NOT NULL,
    "userId" text NOT NULL,
    "accountHolderName" text NOT NULL,
    "bankName" text NOT NULL,
    iban text NOT NULL,
    "swiftCode" text,
    "bankAddress" text,
    currency text DEFAULT 'EUR'::text NOT NULL,
    "accountType" text,
    verified boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bank_accounts OWNER TO caenhebo;

--
-- Name: counter_offers; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.counter_offers (
    id text NOT NULL,
    "transactionId" text NOT NULL,
    price numeric(65,30) NOT NULL,
    message text,
    terms text,
    "fromBuyer" boolean NOT NULL,
    accepted boolean DEFAULT false NOT NULL,
    rejected boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.counter_offers OWNER TO caenhebo;

--
-- Name: digital_ibans; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.digital_ibans (
    id text NOT NULL,
    "userId" text NOT NULL,
    iban text NOT NULL,
    "bankName" text,
    "accountNumber" text,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.digital_ibans OWNER TO caenhebo;

--
-- Name: document_access; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.document_access (
    id text NOT NULL,
    "propertyId" text NOT NULL,
    "buyerId" text NOT NULL,
    "grantedBy" text NOT NULL,
    "grantedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    revoked boolean DEFAULT false NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    message text
);


ALTER TABLE public.document_access OWNER TO caenhebo;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.documents (
    id text NOT NULL,
    "userId" text,
    "transactionId" text,
    "propertyId" text,
    type public."DocumentType" NOT NULL,
    filename text NOT NULL,
    "originalName" text,
    url text NOT NULL,
    "mimeType" text NOT NULL,
    size integer NOT NULL,
    title text,
    description text,
    verified boolean DEFAULT false NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    signed boolean DEFAULT false NOT NULL,
    "signedAt" timestamp(3) without time zone,
    "signedBy" text,
    signature text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.documents OWNER TO caenhebo;

--
-- Name: escrow_details; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.escrow_details (
    id text NOT NULL,
    "transactionId" text NOT NULL,
    "escrowAccountId" text,
    "escrowProvider" text,
    "totalAmount" numeric(65,30) NOT NULL,
    "initialDeposit" numeric(65,30),
    "finalPayment" numeric(65,30),
    "releaseConditions" text,
    "fundsReceived" boolean DEFAULT false NOT NULL,
    "fundsReleased" boolean DEFAULT false NOT NULL,
    "fundingDate" timestamp(3) without time zone,
    "releaseDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.escrow_details OWNER TO caenhebo;

--
-- Name: escrow_steps; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.escrow_steps (
    id text NOT NULL,
    "transactionId" text NOT NULL,
    "stepNumber" integer NOT NULL,
    description text NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    amount numeric(65,30),
    currency text,
    "adminApproved" boolean DEFAULT false NOT NULL,
    "adminNotes" text,
    "approvedBy" text,
    "approvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.escrow_steps OWNER TO caenhebo;

--
-- Name: interviews; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.interviews (
    id text NOT NULL,
    "propertyId" text NOT NULL,
    "scheduledAt" timestamp(3) without time zone NOT NULL,
    duration integer DEFAULT 60 NOT NULL,
    notes text,
    completed boolean DEFAULT false NOT NULL,
    approved boolean DEFAULT false NOT NULL,
    "conductedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.interviews OWNER TO caenhebo;

--
-- Name: legal_templates; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.legal_templates (
    id text NOT NULL,
    name text NOT NULL,
    type public."DocumentType" NOT NULL,
    content text NOT NULL,
    version text DEFAULT '1.0'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.legal_templates OWNER TO caenhebo;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb,
    read boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "transactionId" text,
    "propertyId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.notifications OWNER TO caenhebo;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "transactionId" text NOT NULL,
    type public."PaymentPreference" NOT NULL,
    amount numeric(65,30) NOT NULL,
    currency text NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "walletAddress" text,
    "txHash" text,
    "bankDetails" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payments OWNER TO caenhebo;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.profiles (
    id text NOT NULL,
    "userId" text NOT NULL,
    bio text,
    avatar text,
    "companyName" text,
    "taxId" text,
    "dateOfBirth" timestamp(3) without time zone,
    address text,
    "addressLine2" text,
    city text,
    "postalCode" text,
    country text,
    "termsAcceptedAt" timestamp(3) without time zone,
    "privacyAcceptedAt" timestamp(3) without time zone,
    "amlAcceptedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.profiles OWNER TO caenhebo;

--
-- Name: properties; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.properties (
    id text NOT NULL,
    code text NOT NULL,
    title text NOT NULL,
    description text,
    address text NOT NULL,
    city text NOT NULL,
    state text,
    "postalCode" text NOT NULL,
    country text DEFAULT 'Portugal'::text NOT NULL,
    price numeric(65,30) NOT NULL,
    area double precision,
    bedrooms integer,
    bathrooms integer,
    "sellerId" text NOT NULL,
    "complianceStatus" public."ComplianceStatus" DEFAULT 'PENDING'::public."ComplianceStatus" NOT NULL,
    "complianceNotes" text,
    "valuationPrice" numeric(65,30),
    "interviewDate" timestamp(3) without time zone,
    "interviewStatus" text DEFAULT 'NOT_SCHEDULED'::text NOT NULL,
    "interviewNotes" text,
    "finalApprovalStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.properties OWNER TO caenhebo;

--
-- Name: property_audits; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.property_audits (
    id text NOT NULL,
    "propertyId" text NOT NULL,
    "adminId" text NOT NULL,
    notes text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.property_audits OWNER TO caenhebo;

--
-- Name: property_interests; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.property_interests (
    id text NOT NULL,
    "propertyId" text NOT NULL,
    "buyerId" text NOT NULL,
    "interestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    message text
);


ALTER TABLE public.property_interests OWNER TO caenhebo;

--
-- Name: transaction_status_history; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.transaction_status_history (
    id text NOT NULL,
    "transactionId" text NOT NULL,
    "fromStatus" public."TransactionStatus",
    "toStatus" public."TransactionStatus" NOT NULL,
    "changedBy" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.transaction_status_history OWNER TO caenhebo;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.transactions (
    id text NOT NULL,
    "buyerId" text NOT NULL,
    "sellerId" text NOT NULL,
    "propertyId" text NOT NULL,
    status public."TransactionStatus" DEFAULT 'OFFER'::public."TransactionStatus" NOT NULL,
    "offerPrice" numeric(65,30) NOT NULL,
    "agreedPrice" numeric(65,30),
    "initialPayment" numeric(65,30),
    "paymentMethod" public."PaymentPreference" DEFAULT 'FIAT'::public."PaymentPreference" NOT NULL,
    "cryptoPercentage" integer,
    "fiatPercentage" integer,
    "offerMessage" text,
    "offerTerms" text,
    "proposalDate" timestamp(3) without time zone,
    "acceptanceDate" timestamp(3) without time zone,
    "escrowDate" timestamp(3) without time zone,
    "completionDate" timestamp(3) without time zone,
    "deadlineDate" timestamp(3) without time zone,
    "buyerHasRep" boolean DEFAULT false NOT NULL,
    "sellerHasRep" boolean DEFAULT false NOT NULL,
    "mediationSigned" boolean DEFAULT false NOT NULL,
    "purchaseAgreementSigned" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "buyerSignedPromissory" boolean DEFAULT false,
    "buyerSignedPromissoryAt" timestamp(3) without time zone,
    "purchaseAgreementSignedAt" timestamp(3) without time zone,
    "sellerSignedPromissory" boolean DEFAULT false,
    "sellerSignedPromissoryAt" timestamp(3) without time zone,
    "buyerKyc2Verified" boolean DEFAULT false NOT NULL,
    "buyerKyc2VerifiedAt" timestamp(3) without time zone,
    "sellerKyc2Verified" boolean DEFAULT false NOT NULL,
    "sellerKyc2VerifiedAt" timestamp(3) without time zone,
    "kyc2StartedAt" timestamp(3) without time zone,
    "fundProtectionDate" timestamp(3) without time zone,
    "buyerSignedMediation" boolean DEFAULT false,
    "buyerSignedMediationAt" timestamp(3) without time zone,
    "sellerSignedMediation" boolean DEFAULT false,
    "sellerSignedMediationAt" timestamp(3) without time zone
);


ALTER TABLE public.transactions OWNER TO caenhebo;

--
-- Name: users; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    role public."UserRole" DEFAULT 'BUYER'::public."UserRole" NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    "phoneNumber" text,
    "phoneVerified" boolean DEFAULT false NOT NULL,
    "dateOfBirth" timestamp(3) without time zone,
    "addressLine1" text,
    city text,
    state text,
    "postalCode" text,
    country text,
    "paymentPreference" public."PaymentPreference" DEFAULT 'FIAT'::public."PaymentPreference" NOT NULL,
    "strigaUserId" text,
    "kycStatus" public."KycStatus" DEFAULT 'PENDING'::public."KycStatus" NOT NULL,
    "kycSessionId" text,
    "kyc2Status" public."KycStatus" DEFAULT 'PENDING'::public."KycStatus" NOT NULL,
    "kyc2SessionId" text,
    "kyc2CompletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO caenhebo;

--
-- Name: wallets; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.wallets (
    id text NOT NULL,
    "userId" text NOT NULL,
    "strigaWalletId" text NOT NULL,
    currency text NOT NULL,
    address text,
    "qrCode" text,
    balance numeric(65,30) DEFAULT 0 NOT NULL,
    "lastSyncAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.wallets OWNER TO caenhebo;

--
-- Name: webhook_events; Type: TABLE; Schema: public; Owner: caenhebo
--

CREATE TABLE public.webhook_events (
    id text NOT NULL,
    "eventType" text NOT NULL,
    source text NOT NULL,
    "eventId" text,
    payload jsonb NOT NULL,
    processed boolean DEFAULT false NOT NULL,
    "processedAt" timestamp(3) without time zone,
    error text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.webhook_events OWNER TO caenhebo;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
6d481ae6-02c9-42a8-93bd-7d6a7afce5a8	b188e54574bbe84a5d414abcf09c08e9b5df151f1e237eb226400208e617d003	\N	20250109_add_promissory_fields	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250109_add_promissory_fields\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "transactions" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"transactions\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(433), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250109_add_promissory_fields"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20250109_add_promissory_fields"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:236	2025-09-19 10:35:50.876306+00	2025-09-19 10:35:36.354925+00	0
36e96d38-ec5f-4a35-81a6-301280c2624b	b188e54574bbe84a5d414abcf09c08e9b5df151f1e237eb226400208e617d003	2025-09-19 10:35:50.877154+00	20250109_add_promissory_fields		\N	2025-09-19 10:35:50.877154+00	0
\.


--
-- Data for Name: bank_accounts; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.bank_accounts (id, "userId", "accountHolderName", "bankName", iban, "swiftCode", "bankAddress", currency, "accountType", verified, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: counter_offers; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.counter_offers (id, "transactionId", price, message, terms, "fromBuyer", accepted, rejected, "createdAt") FROM stdin;
cmfqt7ftm0007h2r1bo1lim0h	cmfqt4sef0001h2r1ph4j43vn	262000.000000000000000000000000000000	\N	\N	f	f	f	2025-09-19 12:22:01.691
cmfseobf1003lh2ot033kkvhq	cmfsait65003bh2otwfklp8o1	25550000.000000000000000000000000000000	dsfaadsfdsafdsa	\N	f	f	f	2025-09-20 15:10:47.246
\.


--
-- Data for Name: digital_ibans; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.digital_ibans (id, "userId", iban, "bankName", "accountNumber", active, "createdAt", "updatedAt") FROM stdin;
cmfqq7bn10001h2vdtnhcdvvx	cmfqptx630002h26lmvzj0tvd	PT50003506090000a75d55b5	Striga Bank (Test)	f7a75d55b5	t	2025-09-19 10:57:57.422	2025-09-19 10:57:57.422
cmfqqow9a0005h2vdmuj0fn94	cmfqptx660003h26llurbau9n	PT500035060900000987fa37	Striga Bank (Test)	eb0987fa37	t	2025-09-19 11:11:37.295	2025-09-19 11:11:37.295
cmfqzskkr000lh2otykn8n9pa	cmfqzlep4000gh2otifdq4dj0	PT50003506090000f4cb2dd3	Striga Bank (Test)	9cf4cb2dd3	t	2025-09-19 15:26:25.323	2025-09-19 15:26:25.323
cmfr1fy9c001nh2otda6oe7gw	cmfr17ro5001ih2ot5z5v8yu4	PT5000350609000044be6fef	Striga Bank (Test)	a944be6fef	t	2025-09-19 16:12:35.761	2025-09-19 16:12:35.761
\.


--
-- Data for Name: document_access; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.document_access (id, "propertyId", "buyerId", "grantedBy", "grantedAt", "expiresAt", revoked, "revokedAt", message) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.documents (id, "userId", "transactionId", "propertyId", type, filename, "originalName", url, "mimeType", size, title, description, verified, "uploadedAt", signed, "signedAt", "signedBy", signature, "createdAt", "updatedAt") FROM stdin;
cmfqs704x0001h20bpzp8jw5w	cmfqptx660003h26llurbau9n	\N	cmfqrfvpi0001h27y5vwyur33	COMPLIANCE_DECLARATION	vLcou9HeayzIxN8KQbin9_1758282821743.pdf	test.pdf	/uploads/properties/cmfqrfvpi0001h27y5vwyur33/vLcou9HeayzIxN8KQbin9_1758282821743.pdf	application/pdf	14804	\N	\N	f	2025-09-19 11:53:41.746	f	\N	\N	\N	2025-09-19 11:53:41.746	2025-09-19 11:53:41.746
cmfqs7ahp0003h20blz5j9za2	cmfqptx660003h26llurbau9n	\N	cmfqrfvpi0001h27y5vwyur33	ENERGY_CERTIFICATE	cleyzj2kEINlKNU4rPZAF_1758282835164.pdf	test.pdf	/uploads/properties/cmfqrfvpi0001h27y5vwyur33/cleyzj2kEINlKNU4rPZAF_1758282835164.pdf	application/pdf	14804	\N	\N	f	2025-09-19 11:53:55.166	f	\N	\N	\N	2025-09-19 11:53:55.166	2025-09-19 11:53:55.166
cmfqshv6t0001h2s89cianvdl	cmfqptx660003h26llurbau9n	\N	cmfqrfvpi0001h27y5vwyur33	MUNICIPAL_LICENSE	46P0cvHgeESPEdz4dpOmQ_1758283328548.pdf	test.pdf	/uploads/properties/cmfqrfvpi0001h27y5vwyur33/46P0cvHgeESPEdz4dpOmQ_1758283328548.pdf	application/pdf	14804	\N	\N	f	2025-09-19 12:02:08.55	f	\N	\N	\N	2025-09-19 12:02:08.55	2025-09-19 12:02:08.55
cmfqsi18c0003h2s82vfepz51	cmfqptx660003h26llurbau9n	\N	cmfqrfvpi0001h27y5vwyur33	PREDIAL_REGISTRATION	pNEjJSSCMVfsxDet1bRiU_1758283336379.pdf	test.pdf	/uploads/properties/cmfqrfvpi0001h27y5vwyur33/pNEjJSSCMVfsxDet1bRiU_1758283336379.pdf	application/pdf	14804	\N	\N	f	2025-09-19 12:02:16.38	f	\N	\N	\N	2025-09-19 12:02:16.38	2025-09-19 12:02:16.38
cmfqsi9210005h2s8rhtgto1e	cmfqptx660003h26llurbau9n	\N	cmfqrfvpi0001h27y5vwyur33	CADERNETA_PREDIAL_URBANA	CqeW8ZI-eGxoXJ6AnG5fH_1758283346520.pdf	test.pdf	/uploads/properties/cmfqrfvpi0001h27y5vwyur33/CqeW8ZI-eGxoXJ6AnG5fH_1758283346520.pdf	application/pdf	14804	\N	\N	f	2025-09-19 12:02:26.521	f	\N	\N	\N	2025-09-19 12:02:26.521	2025-09-19 12:02:26.521
cmfqsif2o0007h2s8pl40jmny	cmfqptx660003h26llurbau9n	\N	cmfqrfvpi0001h27y5vwyur33	OWNER_AUTHORIZATION	9dDr9mWL6SaxTfymkWjOy_1758283354318.pdf	test.pdf	/uploads/properties/cmfqrfvpi0001h27y5vwyur33/9dDr9mWL6SaxTfymkWjOy_1758283354318.pdf	application/pdf	14804	\N	\N	f	2025-09-19 12:02:34.32	f	\N	\N	\N	2025-09-19 12:02:34.32	2025-09-19 12:02:34.32
cmfqv7qv40001h2wdpdqg1quu	cmfqptx630002h26lmvzj0tvd	cmfqt4sef0001h2r1ph4j43vn	\N	REPRESENTATION_DOCUMENT	aeWpL4kyEaNdWVmG6RWQF_1758287895231.pdf	test.pdf	/uploads/transactions/cmfqt4sef0001h2r1ph4j43vn/aeWpL4kyEaNdWVmG6RWQF_1758287895231.pdf	application/pdf	14804	\N	\N	f	2025-09-19 13:18:15.232	f	\N	\N	\N	2025-09-19 13:18:15.232	2025-09-19 13:18:15.232
cmfqvee030001h2jx5jfasvrp	cmfqptx630002h26lmvzj0tvd	cmfqt4sef0001h2r1ph4j43vn	\N	REPRESENTATION_DOCUMENT	AraXxDUI87fcpWysapHuJ_1758288205154.pdf	test.pdf	/uploads/transactions/cmfqt4sef0001h2r1ph4j43vn/AraXxDUI87fcpWysapHuJ_1758288205154.pdf	application/pdf	14804	\N	\N	f	2025-09-19 13:23:25.155	f	\N	\N	\N	2025-09-19 13:23:25.155	2025-09-19 13:23:25.155
cmfqz20y20003h2ot4n83scgz	cmfqptx660003h26llurbau9n	\N	cmfqz0gms0001h2ot3dyehmrb	MUNICIPAL_LICENSE	D7OXpHC9t59adIPFAH3nL_1758294346824.pdf	test.pdf	/uploads/properties/cmfqz0gms0001h2ot3dyehmrb/D7OXpHC9t59adIPFAH3nL_1758294346824.pdf	application/pdf	14804	\N	\N	f	2025-09-19 15:05:46.826	f	\N	\N	\N	2025-09-19 15:05:46.826	2025-09-19 15:05:46.826
cmfqz2eo60005h2otq9wpkfgv	cmfqptx660003h26llurbau9n	\N	cmfqz0gms0001h2ot3dyehmrb	ENERGY_CERTIFICATE	bfglAUuxpBloxNzNBIvEy_1758294364613.pdf	test.pdf	/uploads/properties/cmfqz0gms0001h2ot3dyehmrb/bfglAUuxpBloxNzNBIvEy_1758294364613.pdf	application/pdf	14804	\N	\N	f	2025-09-19 15:06:04.615	f	\N	\N	\N	2025-09-19 15:06:04.615	2025-09-19 15:06:04.615
cmfqz2nj90007h2otfpuo3yvi	cmfqptx660003h26llurbau9n	\N	cmfqz0gms0001h2ot3dyehmrb	COMPLIANCE_DECLARATION	ACGkAwaaZSodElMWa_pK-_1758294376100.pdf	test.pdf	/uploads/properties/cmfqz0gms0001h2ot3dyehmrb/ACGkAwaaZSodElMWa_pK-_1758294376100.pdf	application/pdf	14804	\N	\N	f	2025-09-19 15:06:16.101	f	\N	\N	\N	2025-09-19 15:06:16.101	2025-09-19 15:06:16.101
cmfqz2wbg0009h2otjlyrxq0x	cmfqptx660003h26llurbau9n	\N	cmfqz0gms0001h2ot3dyehmrb	PREDIAL_REGISTRATION	X4UHFi2q27k3_BIQlZNaw_1758294387483.pdf	test.pdf	/uploads/properties/cmfqz0gms0001h2ot3dyehmrb/X4UHFi2q27k3_BIQlZNaw_1758294387483.pdf	application/pdf	14804	\N	\N	f	2025-09-19 15:06:27.484	f	\N	\N	\N	2025-09-19 15:06:27.484	2025-09-19 15:06:27.484
cmfqz34s1000bh2ot8aoat1by	cmfqptx660003h26llurbau9n	\N	cmfqz0gms0001h2ot3dyehmrb	CADERNETA_PREDIAL_URBANA	cFiWqega7fTxRIMjc5mQw_1758294398448.pdf	test.pdf	/uploads/properties/cmfqz0gms0001h2ot3dyehmrb/cFiWqega7fTxRIMjc5mQw_1758294398448.pdf	application/pdf	14804	\N	\N	f	2025-09-19 15:06:38.449	f	\N	\N	\N	2025-09-19 15:06:38.449	2025-09-19 15:06:38.449
cmfqz733o000dh2otd500k62l	cmfqptx660003h26llurbau9n	\N	cmfqz0gms0001h2ot3dyehmrb	OWNER_AUTHORIZATION	m4csdZSfwGV4Affquko3s_1758294582899.pdf	test.pdf	/uploads/properties/cmfqz0gms0001h2ot3dyehmrb/m4csdZSfwGV4Affquko3s_1758294582899.pdf	application/pdf	14804	\N	\N	f	2025-09-19 15:09:42.9	f	\N	\N	\N	2025-09-19 15:09:42.9	2025-09-19 15:09:42.9
cmfr0n2o80015h2ot7lbtdpb4	cmfqptx630002h26lmvzj0tvd	cmfqzuywy000ph2otnbkgvxjw	\N	REPRESENTATION_DOCUMENT	CZSx99Iz2xeR7qCsFq3Mr_1758297008455.pdf	test.pdf	/uploads/transactions/cmfqzuywy000ph2otnbkgvxjw/CZSx99Iz2xeR7qCsFq3Mr_1758297008455.pdf	application/pdf	14804	\N	\N	f	2025-09-19 15:50:08.456	f	\N	\N	\N	2025-09-19 15:50:08.456	2025-09-19 15:50:08.456
cmfr0ny4r001bh2otupt03uj6	cmfqptx660003h26llurbau9n	cmfqzuywy000ph2otnbkgvxjw	\N	REPRESENTATION_DOCUMENT	U4vIdMPLs2SatCqw8C2QV_1758297049224.pdf	test.pdf	/uploads/transactions/cmfqzuywy000ph2otnbkgvxjw/U4vIdMPLs2SatCqw8C2QV_1758297049224.pdf	application/pdf	14804	\N	\N	f	2025-09-19 15:50:49.227	f	\N	\N	\N	2025-09-19 15:50:49.227	2025-09-19 15:50:49.227
cmfr23fgi001th2otwavcrfnq	cmfr17ro5001ih2ot5z5v8yu4	\N	cmfr1wdd0001rh2oty4ros5td	COMPLIANCE_DECLARATION	pfPwUNfOqt-xHWHcRdEIb_1758299451137.pdf	test.pdf	/uploads/properties/cmfr1wdd0001rh2oty4ros5td/pfPwUNfOqt-xHWHcRdEIb_1758299451137.pdf	application/pdf	14804	\N	\N	f	2025-09-19 16:30:51.138	f	\N	\N	\N	2025-09-19 16:30:51.138	2025-09-19 16:30:51.138
cmfr23s0q001vh2otwo0vo144	cmfr17ro5001ih2ot5z5v8yu4	\N	cmfr1wdd0001rh2oty4ros5td	ENERGY_CERTIFICATE	m4wY_cMinKZ2XvaFc3iYS_1758299467417.pdf	test.pdf	/uploads/properties/cmfr1wdd0001rh2oty4ros5td/m4wY_cMinKZ2XvaFc3iYS_1758299467417.pdf	application/pdf	14804	\N	\N	f	2025-09-19 16:31:07.418	f	\N	\N	\N	2025-09-19 16:31:07.418	2025-09-19 16:31:07.418
cmfr240w7001xh2otl6t8h4as	cmfr17ro5001ih2ot5z5v8yu4	\N	cmfr1wdd0001rh2oty4ros5td	ENERGY_CERTIFICATE	AG4Lktiu2_C46pJnbBwuX_1758299478918.pdf	test.pdf	/uploads/properties/cmfr1wdd0001rh2oty4ros5td/AG4Lktiu2_C46pJnbBwuX_1758299478918.pdf	application/pdf	14804	\N	\N	f	2025-09-19 16:31:18.92	f	\N	\N	\N	2025-09-19 16:31:18.92	2025-09-19 16:31:18.92
cmfr248uz001zh2otbse232ny	cmfr17ro5001ih2ot5z5v8yu4	\N	cmfr1wdd0001rh2oty4ros5td	MUNICIPAL_LICENSE	n4YAOhT5nmFNruMe5Kc7-_1758299489242.pdf	test.pdf	/uploads/properties/cmfr1wdd0001rh2oty4ros5td/n4YAOhT5nmFNruMe5Kc7-_1758299489242.pdf	application/pdf	14804	\N	\N	f	2025-09-19 16:31:29.243	f	\N	\N	\N	2025-09-19 16:31:29.243	2025-09-19 16:31:29.243
cmfr24ki20021h2ot17o1dhxu	cmfr17ro5001ih2ot5z5v8yu4	\N	cmfr1wdd0001rh2oty4ros5td	PREDIAL_REGISTRATION	P9Cwk5U35zoqVi2hExWIt_1758299504329.pdf	test.pdf	/uploads/properties/cmfr1wdd0001rh2oty4ros5td/P9Cwk5U35zoqVi2hExWIt_1758299504329.pdf	application/pdf	14804	\N	\N	f	2025-09-19 16:31:44.33	f	\N	\N	\N	2025-09-19 16:31:44.33	2025-09-19 16:31:44.33
cmfr261390023h2otmwicfft5	cmfr17ro5001ih2ot5z5v8yu4	\N	cmfr1wdd0001rh2oty4ros5td	CADERNETA_PREDIAL_URBANA	haWThuqQwaupvZSrUhUrG_1758299572484.pdf	test.pdf	/uploads/properties/cmfr1wdd0001rh2oty4ros5td/haWThuqQwaupvZSrUhUrG_1758299572484.pdf	application/pdf	14804	\N	\N	f	2025-09-19 16:32:52.486	f	\N	\N	\N	2025-09-19 16:32:52.486	2025-09-19 16:32:52.486
cmfr26c290025h2otwx3klc15	cmfr17ro5001ih2ot5z5v8yu4	\N	cmfr1wdd0001rh2oty4ros5td	OWNER_AUTHORIZATION	F8qr3w5cjY7IKv4Tlf1kL_1758299586704.pdf	test.pdf	/uploads/properties/cmfr1wdd0001rh2oty4ros5td/F8qr3w5cjY7IKv4Tlf1kL_1758299586704.pdf	application/pdf	14804	\N	\N	f	2025-09-19 16:33:06.705	f	\N	\N	\N	2025-09-19 16:33:06.705	2025-09-19 16:33:06.705
cmfsadu0d002vh2ot03v2rvbw	cmfqptx660003h26llurbau9n	\N	cmfsabd2q002th2oty827xaik	COMPLIANCE_DECLARATION	HHKQF2UQrQvMeJVffd9Me_1758373839659.pdf	test.pdf	/uploads/properties/cmfsabd2q002th2oty827xaik/HHKQF2UQrQvMeJVffd9Me_1758373839659.pdf	application/pdf	14804	\N	\N	f	2025-09-20 13:10:39.662	f	\N	\N	\N	2025-09-20 13:10:39.662	2025-09-20 13:10:39.662
cmfsae2yk002xh2otidny9hlq	cmfqptx660003h26llurbau9n	\N	cmfsabd2q002th2oty827xaik	COMPLIANCE_DECLARATION	mEJe3DO8tM1l9D4pvrIt1_1758373851259.pdf	test.pdf	/uploads/properties/cmfsabd2q002th2oty827xaik/mEJe3DO8tM1l9D4pvrIt1_1758373851259.pdf	application/pdf	14804	\N	\N	f	2025-09-20 13:10:51.26	f	\N	\N	\N	2025-09-20 13:10:51.26	2025-09-20 13:10:51.26
cmfsaeg7s002zh2otbee8lb0t	cmfqptx660003h26llurbau9n	\N	cmfsabd2q002th2oty827xaik	ENERGY_CERTIFICATE	4CBbunGF_baxw_bukwiCa_1758373868439.pdf	test.pdf	/uploads/properties/cmfsabd2q002th2oty827xaik/4CBbunGF_baxw_bukwiCa_1758373868439.pdf	application/pdf	14804	\N	\N	f	2025-09-20 13:11:08.44	f	\N	\N	\N	2025-09-20 13:11:08.44	2025-09-20 13:11:08.44
cmfsaett30031h2ot0jdr4pqj	cmfqptx660003h26llurbau9n	\N	cmfsabd2q002th2oty827xaik	PREDIAL_REGISTRATION	0lrX5Kjnvj6f0NHQiIFPY_1758373886053.pdf	test.pdf	/uploads/properties/cmfsabd2q002th2oty827xaik/0lrX5Kjnvj6f0NHQiIFPY_1758373886053.pdf	application/pdf	14804	\N	\N	f	2025-09-20 13:11:26.056	f	\N	\N	\N	2025-09-20 13:11:26.056	2025-09-20 13:11:26.056
cmfsaf7520033h2ote05xexvx	cmfqptx660003h26llurbau9n	\N	cmfsabd2q002th2oty827xaik	MUNICIPAL_LICENSE	thFHcAjcu6oFJTrBhMqC7_1758373903331.pdf	test.pdf	/uploads/properties/cmfsabd2q002th2oty827xaik/thFHcAjcu6oFJTrBhMqC7_1758373903331.pdf	application/pdf	14804	\N	\N	f	2025-09-20 13:11:43.334	f	\N	\N	\N	2025-09-20 13:11:43.334	2025-09-20 13:11:43.334
cmfsafh6t0035h2ota0ogn9dp	cmfqptx660003h26llurbau9n	\N	cmfsabd2q002th2oty827xaik	CADERNETA_PREDIAL_URBANA	cMtQssjMMobLnLjAApWRo_1758373916356.pdf	test.pdf	/uploads/properties/cmfsabd2q002th2oty827xaik/cMtQssjMMobLnLjAApWRo_1758373916356.pdf	application/pdf	14804	\N	\N	f	2025-09-20 13:11:56.357	f	\N	\N	\N	2025-09-20 13:11:56.357	2025-09-20 13:11:56.357
cmfsafo4x0037h2ot2rflqftn	cmfqptx660003h26llurbau9n	\N	cmfsabd2q002th2oty827xaik	OWNER_AUTHORIZATION	5dmlSNLtvfxGlYYMF0ECY_1758373925360.pdf	test.pdf	/uploads/properties/cmfsabd2q002th2oty827xaik/5dmlSNLtvfxGlYYMF0ECY_1758373925360.pdf	application/pdf	14804	\N	\N	f	2025-09-20 13:12:05.361	f	\N	\N	\N	2025-09-20 13:12:05.361	2025-09-20 13:12:05.361
cmfsew8830041h2ot7igaltb4	cmfqptx660003h26llurbau9n	cmfsait65003bh2otwfklp8o1	\N	REPRESENTATION_DOCUMENT	zeEe3og7l-v6l2f6Fsl1K_1758381416354.pdf	test.pdf	/uploads/transactions/cmfsait65003bh2otwfklp8o1/zeEe3og7l-v6l2f6Fsl1K_1758381416354.pdf	application/pdf	14804	\N	\N	f	2025-09-20 15:16:56.356	f	\N	\N	\N	2025-09-20 15:16:56.356	2025-09-20 15:16:56.356
\.


--
-- Data for Name: escrow_details; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.escrow_details (id, "transactionId", "escrowAccountId", "escrowProvider", "totalAmount", "initialDeposit", "finalPayment", "releaseConditions", "fundsReceived", "fundsReleased", "fundingDate", "releaseDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: escrow_steps; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.escrow_steps (id, "transactionId", "stepNumber", description, status, amount, currency, "adminApproved", "adminNotes", "approvedBy", "approvedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: interviews; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.interviews (id, "propertyId", "scheduledAt", duration, notes, completed, approved, "conductedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: legal_templates; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.legal_templates (id, name, type, content, version, active, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.notifications (id, "userId", type, title, message, data, read, "readAt", "transactionId", "propertyId", "createdAt", "updatedAt") FROM stdin;
cmfqq7bn40003h2vd13tg6tif	cmfqptx630002h26lmvzj0tvd	KYC_STATUS_CHANGE	Payment Account Created	Your EUR payment account has been successfully created with banking details.	\N	f	\N	\N	\N	2025-09-19 10:57:57.424	2025-09-19 10:57:57.424
cmfqqow9c0007h2vddnywnbxr	cmfqptx660003h26llurbau9n	KYC_STATUS_CHANGE	Payment Account Created	Your EUR payment account has been successfully created with banking details.	\N	f	\N	\N	\N	2025-09-19 11:11:37.297	2025-09-19 11:11:37.297
cmfqsjhg60009h2s8qi799w3s	cmfqptx660003h26llurbau9n	PROPERTY_APPROVED	Property Approved	Your property "3 bedroom house" has been approved and is now live! Property code: CAE-2025-0001	{"property": {"id": "cmfqrfvpi0001h27y5vwyur33", "code": "CAE-2025-0001", "price": 0, "title": "3 bedroom house", "address": ""}}	f	\N	\N	cmfqrfvpi0001h27y5vwyur33	2025-09-19 12:03:24.054	2025-09-19 12:03:24.054
cmfqt4sew0005h2r1beny9zv3	cmfqptx660003h26llurbau9n	NEW_OFFER	New Offer Received	Test Buyer made an offer of €250,000 on 3 bedroom house	{"property": {"id": "cmfqrfvpi0001h27y5vwyur33", "code": "CAE-2025-0001", "price": "3520000", "title": "3 bedroom house", "address": "fdasfddf"}, "transaction": {"id": "cmfqt4sef0001h2r1ph4j43vn", "status": "OFFER", "offerPrice": 250000}}	f	\N	cmfqt4sef0001h2r1ph4j43vn	cmfqrfvpi0001h27y5vwyur33	2025-09-19 12:19:58.041	2025-09-19 12:19:58.041
cmfqt7ftt000bh2r1uyg10vu4	cmfqptx630002h26lmvzj0tvd	COUNTER_OFFER	Counter Offer Received	Test Seller made a counter-offer of €262,000 for 3 bedroom house	{"other": {"fromBuyer": false}, "transaction": {"id": "cmfqt4sef0001h2r1ph4j43vn", "status": "NEGOTIATION", "offerPrice": 262000}}	f	\N	cmfqt4sef0001h2r1ph4j43vn	cmfqrfvpi0001h27y5vwyur33	2025-09-19 12:22:01.697	2025-09-19 12:22:01.697
cmfqt7y17000fh2r19dheckjt	cmfqptx660003h26llurbau9n	OFFER_ACCEPTED	Offer Accepted!	Test Buyer accepted your offer of €262,000 for 3 bedroom house	{"transaction": {"id": "cmfqt4sef0001h2r1ph4j43vn", "status": "AGREEMENT", "offerPrice": 262000}}	f	\N	cmfqt4sef0001h2r1ph4j43vn	cmfqrfvpi0001h27y5vwyur33	2025-09-19 12:22:25.291	2025-09-19 12:22:25.291
cmfqv7qv70003h2wd1wdw9mj1	cmfqptx660003h26llurbau9n	DOCUMENT_UPLOADED	New Documents Uploaded	buyer@test.com uploaded 1 document for the transaction	{"documents": {"count": 1, "types": ["REPRESENTATION_DOCUMENT"]}}	f	\N	cmfqt4sef0001h2r1ph4j43vn	cmfqrfvpi0001h27y5vwyur33	2025-09-19 13:18:15.235	2025-09-19 13:18:15.235
cmfqvee050003h2jxpzntfghy	cmfqptx660003h26llurbau9n	DOCUMENT_UPLOADED	New Documents Uploaded	buyer@test.com uploaded 1 document for the transaction	{"documents": {"count": 1, "types": ["REPRESENTATION_DOCUMENT"]}}	f	\N	cmfqt4sef0001h2r1ph4j43vn	cmfqrfvpi0001h27y5vwyur33	2025-09-19 13:23:25.157	2025-09-19 13:23:25.157
cmfqvijv30001h2t0ypd2bdaz	cmfqptx630002h26lmvzj0tvd	TRANSACTION_STATUS_CHANGE	Mediation Agreement Complete	Both parties have signed the mediation agreement for transaction ph4j43vn	{"action": "mediation_signed", "bothSigned": true, "signerRole": "seller", "transactionId": "cmfqt4sef0001h2r1ph4j43vn"}	f	\N	cmfqt4sef0001h2r1ph4j43vn	\N	2025-09-19 13:26:39.375	2025-09-19 13:26:39.375
cmfqzgtco000fh2otxcnpzb64	cmfqptx660003h26llurbau9n	PROPERTY_APPROVED	Property Approved	Your property "2 bedroom" has been approved and is now live! Property code: CAE-2025-0002	{"property": {"id": "cmfqz0gms0001h2ot3dyehmrb", "code": "CAE-2025-0002", "price": 0, "title": "2 bedroom", "address": ""}}	f	\N	\N	cmfqz0gms0001h2ot3dyehmrb	2025-09-19 15:17:16.824	2025-09-19 15:17:16.824
cmfqzskks000nh2ottzaa236d	cmfqzlep4000gh2otifdq4dj0	KYC_STATUS_CHANGE	Payment Account Created	Your EUR payment account has been successfully created with banking details.	\N	f	\N	\N	\N	2025-09-19 15:26:25.325	2025-09-19 15:26:25.325
cmfqzuyxd000th2othrp4xwjt	cmfqptx660003h26llurbau9n	NEW_OFFER	New Offer Received	Test Buyer made an offer of €25,111 on 2 bedroom	{"property": {"id": "cmfqz0gms0001h2ot3dyehmrb", "code": "CAE-2025-0002", "price": "2501000", "title": "2 bedroom", "address": "adfasd"}, "transaction": {"id": "cmfqzuywy000ph2otnbkgvxjw", "status": "OFFER", "offerPrice": 25111}}	f	\N	cmfqzuywy000ph2otnbkgvxjw	cmfqz0gms0001h2ot3dyehmrb	2025-09-19 15:28:17.234	2025-09-19 15:28:17.234
cmfr00hir000xh2ot7rjs27rw	cmfqptx630002h26lmvzj0tvd	OFFER_ACCEPTED	Offer Accepted!	Test Seller accepted your offer of €25,111 for 2 bedroom	{"transaction": {"id": "cmfqzuywy000ph2otnbkgvxjw", "status": "AGREEMENT", "offerPrice": 25111}}	t	2025-09-19 15:47:21.794	cmfqzuywy000ph2otnbkgvxjw	cmfqz0gms0001h2ot3dyehmrb	2025-09-19 15:32:34.612	2025-09-19 15:47:21.795
cmfr0n2o90017h2ot9rgzjomy	cmfqptx660003h26llurbau9n	DOCUMENT_UPLOADED	New Documents Uploaded	buyer@test.com uploaded 1 document for the transaction	{"documents": {"count": 1, "types": ["REPRESENTATION_DOCUMENT"]}}	f	\N	cmfqzuywy000ph2otnbkgvxjw	cmfqz0gms0001h2ot3dyehmrb	2025-09-19 15:50:08.458	2025-09-19 15:50:08.458
cmfr0n8or0019h2otm80wo3au	cmfqptx660003h26llurbau9n	TRANSACTION_STATUS_CHANGE	Mediation Agreement Signed	buyer@test.com has signed the mediation agreement for transaction nbkgvxjw	{"action": "mediation_signed", "bothSigned": false, "signerRole": "buyer", "transactionId": "cmfqzuywy000ph2otnbkgvxjw"}	t	2025-09-19 15:50:38.695	cmfqzuywy000ph2otnbkgvxjw	\N	2025-09-19 15:50:16.251	2025-09-19 15:50:38.696
cmfr0ny4s001dh2otpd2qs6rt	cmfqptx630002h26lmvzj0tvd	DOCUMENT_UPLOADED	New Documents Uploaded	seller@test.com uploaded 1 document for the transaction	{"documents": {"count": 1, "types": ["REPRESENTATION_DOCUMENT"]}}	f	\N	cmfqzuywy000ph2otnbkgvxjw	cmfqz0gms0001h2ot3dyehmrb	2025-09-19 15:50:49.229	2025-09-19 15:50:49.229
cmfr0o0ay001fh2ot9xe2slhc	cmfqptx630002h26lmvzj0tvd	TRANSACTION_STATUS_CHANGE	Mediation Agreement Complete	Both parties have signed the mediation agreement for transaction nbkgvxjw	{"action": "mediation_signed", "bothSigned": true, "signerRole": "seller", "transactionId": "cmfqzuywy000ph2otnbkgvxjw"}	f	\N	cmfqzuywy000ph2otnbkgvxjw	\N	2025-09-19 15:50:52.043	2025-09-19 15:50:52.043
cmfr0t81d001hh2oti38yao5n	cmfqptx630002h26lmvzj0tvd	KYC_STATUS_CHANGE	KYC2 Verification Progress	seller@test.com has completed KYC2 verification for transaction nbkgvxjw	{"action": "kyc2_completed", "bothVerified": false, "verifierRole": "seller", "transactionId": "cmfqzuywy000ph2otnbkgvxjw"}	f	\N	cmfqzuywy000ph2otnbkgvxjw	\N	2025-09-19 15:54:55.346	2025-09-19 15:54:55.346
cmfr1fy9e001ph2otmquupnf6	cmfr17ro5001ih2ot5z5v8yu4	KYC_STATUS_CHANGE	Payment Account Created	Your EUR payment account has been successfully created with banking details.	\N	f	\N	\N	\N	2025-09-19 16:12:35.763	2025-09-19 16:12:35.763
cmfr2g0f60027h2ot6am3qf5k	cmfr17ro5001ih2ot5z5v8yu4	PROPERTY_APPROVED	Property Approved	Your property "3 bedroom" has been approved and is now live! Property code: CAE-2025-0003	{"property": {"id": "cmfr1wdd0001rh2oty4ros5td", "code": "CAE-2025-0003", "price": 0, "title": "3 bedroom", "address": ""}}	f	\N	\N	cmfr1wdd0001rh2oty4ros5td	2025-09-19 16:40:38.178	2025-09-19 16:40:38.178
cmfr2okd8002bh2otc2wys6uc	cmfr17ro5001ih2ot5z5v8yu4	PROPERTY_INTEREST	New Interest in Your Property	Test Buyer has expressed interest in your property "3 bedroom" (CAE-2025-0003)	{"buyerId": "cmfqptx630002h26lmvzj0tvd", "message": null, "buyerName": "Test Buyer", "buyerEmail": "buyer@test.com", "propertyId": "cmfr1wdd0001rh2oty4ros5td", "propertyCode": "CAE-2025-0003", "propertyTitle": "3 bedroom"}	f	\N	\N	cmfr1wdd0001rh2oty4ros5td	2025-09-19 16:47:17.277	2025-09-19 16:47:17.277
cmfr2q6ba002hh2otfeo734u1	cmfr17ro5001ih2ot5z5v8yu4	NEW_OFFER	New Offer Received	Test Buyer made an offer of €325,000 on 3 bedroom	{"property": {"id": "cmfr1wdd0001rh2oty4ros5td", "code": "CAE-2025-0003", "price": "3500000", "title": "3 bedroom", "address": "cadsfdasdf"}, "transaction": {"id": "cmfr2q6b3002dh2ot1ipegzgf", "status": "OFFER", "offerPrice": 325000}}	t	2025-09-19 16:49:14.934	cmfr2q6b3002dh2ot1ipegzgf	cmfr1wdd0001rh2oty4ros5td	2025-09-19 16:48:32.375	2025-09-19 16:49:14.935
cmfr3867b002lh2ota7kua8r1	cmfqptx630002h26lmvzj0tvd	OFFER_ACCEPTED	Offer Accepted!	Bruno registers accepted your offer of €325,000 for 3 bedroom	{"transaction": {"id": "cmfr2q6b3002dh2ot1ipegzgf", "status": "AGREEMENT", "offerPrice": 325000}}	t	2025-09-19 17:09:24.389	cmfr2q6b3002dh2ot1ipegzgf	cmfr1wdd0001rh2oty4ros5td	2025-09-19 17:02:32.04	2025-09-19 17:09:24.389
cmfsag63f0039h2otje70n9c8	cmfqptx660003h26llurbau9n	PROPERTY_APPROVED	Property Approved	Your property "tatiana 3bedrrom" has been approved and is now live! Property code: CAE-2025-0004	{"property": {"id": "cmfsabd2q002th2oty827xaik", "code": "CAE-2025-0004", "price": 0, "title": "tatiana 3bedrrom", "address": ""}}	f	\N	\N	cmfsabd2q002th2oty827xaik	2025-09-20 13:12:28.636	2025-09-20 13:12:28.636
cmfsait6a003fh2ot4n17b3sx	cmfqptx660003h26llurbau9n	NEW_OFFER	New Offer Received	Test Buyer made an offer of €250,000 on tatiana 3bedrrom	{"property": {"id": "cmfsabd2q002th2oty827xaik", "code": "CAE-2025-0004", "price": "8500000", "title": "tatiana 3bedrrom", "address": "dsfadfsa"}, "transaction": {"id": "cmfsait65003bh2otwfklp8o1", "status": "OFFER", "offerPrice": 250000}}	f	\N	cmfsait65003bh2otwfklp8o1	cmfsabd2q002th2oty827xaik	2025-09-20 13:14:31.859	2025-09-20 13:14:31.859
cmfseobf8003ph2ot2th7brey	cmfqptx630002h26lmvzj0tvd	COUNTER_OFFER	Counter Offer Received	Test Seller made a counter-offer of €25,550,000 for tatiana 3bedrrom	{"other": {"fromBuyer": false}, "transaction": {"id": "cmfsait65003bh2otwfklp8o1", "status": "NEGOTIATION", "offerPrice": 25550000}}	t	2025-09-20 15:10:59.551	cmfsait65003bh2otwfklp8o1	cmfsabd2q002th2oty827xaik	2025-09-20 15:10:47.252	2025-09-20 15:10:59.552
cmfser1v5003th2ot706k8y64	cmfqptx660003h26llurbau9n	OFFER_ACCEPTED	Offer Accepted!	Test Buyer accepted your offer of €25,550,000 for tatiana 3bedrrom	{"transaction": {"id": "cmfsait65003bh2otwfklp8o1", "status": "AGREEMENT", "offerPrice": 25550000}}	f	\N	cmfsait65003bh2otwfklp8o1	cmfsabd2q002th2oty827xaik	2025-09-20 15:12:54.833	2025-09-20 15:12:54.833
cmfsew8850043h2ot3pxc2n4t	cmfqptx630002h26lmvzj0tvd	DOCUMENT_UPLOADED	New Documents Uploaded	seller@test.com uploaded 1 document for the transaction	{"documents": {"count": 1, "types": ["REPRESENTATION_DOCUMENT"]}}	f	\N	cmfsait65003bh2otwfklp8o1	cmfsabd2q002th2oty827xaik	2025-09-20 15:16:56.358	2025-09-20 15:16:56.358
cmfsew9vz0045h2ote5sf0tkk	cmfqptx630002h26lmvzj0tvd	TRANSACTION_STATUS_CHANGE	Mediation Agreement Signed	seller@test.com has signed the mediation agreement for transaction wfklp8o1	{"action": "mediation_signed", "bothSigned": false, "signerRole": "seller", "transactionId": "cmfsait65003bh2otwfklp8o1"}	f	\N	cmfsait65003bh2otwfklp8o1	\N	2025-09-20 15:16:58.512	2025-09-20 15:16:58.512
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.payments (id, "transactionId", type, amount, currency, status, "walletAddress", "txHash", "bankDetails", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.profiles (id, "userId", bio, avatar, "companyName", "taxId", "dateOfBirth", address, "addressLine2", city, "postalCode", country, "termsAcceptedAt", "privacyAcceptedAt", "amlAcceptedAt", "createdAt", "updatedAt") FROM stdin;
cmfqptx350001h26l7ntekibb	cmfqptx350000h26l748hs4s0	Platform Administrator	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-19 10:47:32.033	2025-09-19 10:47:32.033
cmfqzlep4000hh2ot3lkuspvp	cmfqzlep4000gh2otifdq4dj0	\N	\N	\N	\N	1986-05-25 00:00:00	london		london	10614	EE	\N	\N	\N	2025-09-19 15:20:51.112	2025-09-19 15:23:59.802
cmfr17ro5001jh2ottko1s28p	cmfr17ro5001ih2ot5z5v8yu4	\N	\N	\N	\N	1986-02-25 00:00:00	brunos house		lond	12151515	SK	\N	\N	\N	2025-09-19 16:06:13.973	2025-09-19 16:09:39.637
cmfsbmmbq003hh2otdt8nmlsb	cmfsbmmbq003gh2ot62k3rqwr	\N	\N	\N	\N	1960-05-01 00:00:00	Copenhagen lane 1		Copenhagen	1234	DK	\N	\N	\N	2025-09-20 13:45:29.222	2025-09-20 13:48:00.251
\.


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.properties (id, code, title, description, address, city, state, "postalCode", country, price, area, bedrooms, bathrooms, "sellerId", "complianceStatus", "complianceNotes", "valuationPrice", "interviewDate", "interviewStatus", "interviewNotes", "finalApprovalStatus", "createdAt", "updatedAt") FROM stdin;
cmfqrfvpi0001h27y5vwyur33	CAE-2025-0001	3 bedroom house	my house	fdasfddf	lisbon	lisbon	10000	Portugal	3520000.000000000000000000000000000000	25	3	2	cmfqptx660003h26llurbau9n	APPROVED	\N	\N	2026-05-22 08:00:00	COMPLETED	great inverview	APPROVED	2025-09-19 11:32:36.295	2025-09-19 12:03:53.505
cmfqz0gms0001h2ot3dyehmrb	CAE-2025-0002	2 bedroom	tatiana walking	adfasd	lisbon	lisbon	10000	Portugal	2501000.000000000000000000000000000000	2243	3	5	cmfqptx660003h26llurbau9n	APPROVED	tatiana likes it	\N	2025-10-22 02:00:00	COMPLETED	nice	APPROVED	2025-09-19 15:04:33.844	2025-09-19 15:19:51.03
cmfr1wdd0001rh2oty4ros5td	CAE-2025-0003	3 bedroom	traditoina	cadsfdasdf	lisbon	lisonb	100000	Portugal	3500000.000000000000000000000000000000	125	3	2	cmfr17ro5001ih2ot5z5v8yu4	APPROVED	\N	\N	2025-12-12 08:55:00	COMPLETED	I dont like him, he is from REMAX!	APPROVED	2025-09-19 16:25:21.829	2025-09-19 16:45:22.879
cmfsabd2q002th2oty827xaik	CAE-2025-0004	tatiana 3bedrrom	hello	dsfadfsa	lisbon	lisbon	10000	Portugal	8500000.000000000000000000000000000000	252	5	4	cmfqptx660003h26llurbau9n	APPROVED	\N	\N	2055-02-25 08:22:00	COMPLETED	\N	APPROVED	2025-09-20 13:08:44.403	2025-09-20 13:12:48.957
\.


--
-- Data for Name: property_audits; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.property_audits (id, "propertyId", "adminId", notes, "createdAt") FROM stdin;
\.


--
-- Data for Name: property_interests; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.property_interests (id, "propertyId", "buyerId", "interestedAt", message) FROM stdin;
cmfqsl142000bh2s8ub3np9mz	cmfqrfvpi0001h27y5vwyur33	cmfqptx630002h26lmvzj0tvd	2025-09-19 12:04:36.195	\N
cmfr2okd50029h2otqwaqb119	cmfr1wdd0001rh2oty4ros5td	cmfqptx630002h26lmvzj0tvd	2025-09-19 16:47:17.274	\N
\.


--
-- Data for Name: transaction_status_history; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.transaction_status_history (id, "transactionId", "fromStatus", "toStatus", "changedBy", notes, "createdAt") FROM stdin;
cmfqt4sei0003h2r13mxqf48p	cmfqt4sef0001h2r1ph4j43vn	\N	OFFER	cmfqptx630002h26lmvzj0tvd	Initial offer created	2025-09-19 12:19:58.027
cmfqt7ftr0009h2r1b2l0tovt	cmfqt4sef0001h2r1ph4j43vn	OFFER	NEGOTIATION	cmfqptx660003h26llurbau9n	Seller made counter offer	2025-09-19 12:22:01.696
cmfqt7y16000dh2r1ir8b1iio	cmfqt4sef0001h2r1ph4j43vn	NEGOTIATION	AGREEMENT	cmfqptx630002h26lmvzj0tvd	Buyer accepted the counter-offer	2025-09-19 12:22:25.29
cmfqt8krp000hh2r1k3xr3z3q	cmfqt4sef0001h2r1ph4j43vn	AGREEMENT	AGREEMENT	cmfqptx630002h26lmvzj0tvd	Buyer signed the Promissory Purchase & Sale Agreement	2025-09-19 12:22:54.758
cmfqtgs3u0001h29adf1rl9ct	cmfqt4sef0001h2r1ph4j43vn	AGREEMENT	AGREEMENT	cmfqptx660003h26llurbau9n	Seller signed the Promissory Purchase & Sale Agreement	2025-09-19 12:29:17.514
cmfqtgs3w0003h29ajwsuaep3	cmfqt4sef0001h2r1ph4j43vn	AGREEMENT	AGREEMENT	cmfqptx660003h26llurbau9n	Both parties have signed the Promissory Purchase & Sale Agreement - Agreement is now fully executed	2025-09-19 12:29:17.516
cmfqvkahu0003h2t0uh61yr39	cmfqt4sef0001h2r1ph4j43vn	AGREEMENT	KYC2_VERIFICATION	cmfqptx630002h26lmvzj0tvd	All Stage 3 requirements completed - advancing to KYC Tier 2 Verification	2025-09-19 13:28:00.546
cmfqzuyx1000rh2otvzhbs1sb	cmfqzuywy000ph2otnbkgvxjw	\N	OFFER	cmfqptx630002h26lmvzj0tvd	Initial offer created	2025-09-19 15:28:17.222
cmfr00hiq000vh2otmhmtfg3j	cmfqzuywy000ph2otnbkgvxjw	OFFER	AGREEMENT	cmfqptx660003h26llurbau9n	Seller accepted the offer	2025-09-19 15:32:34.61
cmfr0j5zn000zh2otgjx300dj	cmfqzuywy000ph2otnbkgvxjw	AGREEMENT	AGREEMENT	cmfqptx660003h26llurbau9n	Seller signed the Promissory Purchase & Sale Agreement	2025-09-19 15:47:06.131
cmfr0juoj0011h2otr3i86e25	cmfqzuywy000ph2otnbkgvxjw	AGREEMENT	AGREEMENT	cmfqptx630002h26lmvzj0tvd	Buyer signed the Promissory Purchase & Sale Agreement	2025-09-19 15:47:38.132
cmfr0juol0013h2otg0pl4ti1	cmfqzuywy000ph2otnbkgvxjw	AGREEMENT	AGREEMENT	cmfqptx630002h26lmvzj0tvd	Both parties have signed the Promissory Purchase & Sale Agreement - Agreement is now fully executed	2025-09-19 15:47:38.134
cmfr2q6b8002fh2oti2s18vvd	cmfr2q6b3002dh2ot1ipegzgf	\N	OFFER	cmfqptx630002h26lmvzj0tvd	Initial offer created	2025-09-19 16:48:32.373
cmfr3867a002jh2ot53sndqq6	cmfr2q6b3002dh2ot1ipegzgf	OFFER	AGREEMENT	cmfr17ro5001ih2ot5z5v8yu4	Seller accepted the offer	2025-09-19 17:02:32.038
cmfr3glwa002nh2otnnvj71yt	cmfr2q6b3002dh2ot1ipegzgf	AGREEMENT	AGREEMENT	cmfr17ro5001ih2ot5z5v8yu4	Seller signed the Promissory Purchase & Sale Agreement	2025-09-19 17:09:05.627
cmfr3hfwk002ph2otqur2n61e	cmfr2q6b3002dh2ot1ipegzgf	AGREEMENT	AGREEMENT	cmfqptx630002h26lmvzj0tvd	Buyer signed the Promissory Purchase & Sale Agreement	2025-09-19 17:09:44.516
cmfr3hfwn002rh2otgxjwurtm	cmfr2q6b3002dh2ot1ipegzgf	AGREEMENT	AGREEMENT	cmfqptx630002h26lmvzj0tvd	Both parties have signed the Promissory Purchase & Sale Agreement - Agreement is now fully executed	2025-09-19 17:09:44.519
cmfsait68003dh2oto2xzl14a	cmfsait65003bh2otwfklp8o1	\N	OFFER	cmfqptx630002h26lmvzj0tvd	Initial offer created	2025-09-20 13:14:31.856
cmfseobf7003nh2otobjs8lrv	cmfsait65003bh2otwfklp8o1	OFFER	NEGOTIATION	cmfqptx660003h26llurbau9n	Seller made counter offer	2025-09-20 15:10:47.251
cmfser1v4003rh2ots7v8kvs6	cmfsait65003bh2otwfklp8o1	NEGOTIATION	AGREEMENT	cmfqptx630002h26lmvzj0tvd	Buyer accepted the counter-offer	2025-09-20 15:12:54.832
cmfseuiie003vh2otyvvz9oal	cmfsait65003bh2otwfklp8o1	AGREEMENT	AGREEMENT	cmfqptx630002h26lmvzj0tvd	Buyer signed the Promissory Purchase & Sale Agreement	2025-09-20 15:15:36.374
cmfsev31w003xh2otf141gr9i	cmfsait65003bh2otwfklp8o1	AGREEMENT	AGREEMENT	cmfqptx660003h26llurbau9n	Seller signed the Promissory Purchase & Sale Agreement	2025-09-20 15:16:02.997
cmfsev31z003zh2otgo9x9wod	cmfsait65003bh2otwfklp8o1	AGREEMENT	AGREEMENT	cmfqptx660003h26llurbau9n	Both parties have signed the Promissory Purchase & Sale Agreement - Agreement is now fully executed	2025-09-20 15:16:02.999
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.transactions (id, "buyerId", "sellerId", "propertyId", status, "offerPrice", "agreedPrice", "initialPayment", "paymentMethod", "cryptoPercentage", "fiatPercentage", "offerMessage", "offerTerms", "proposalDate", "acceptanceDate", "escrowDate", "completionDate", "deadlineDate", "buyerHasRep", "sellerHasRep", "mediationSigned", "purchaseAgreementSigned", "createdAt", "updatedAt", "buyerSignedPromissory", "buyerSignedPromissoryAt", "purchaseAgreementSignedAt", "sellerSignedPromissory", "sellerSignedPromissoryAt", "buyerKyc2Verified", "buyerKyc2VerifiedAt", "sellerKyc2Verified", "sellerKyc2VerifiedAt", "kyc2StartedAt", "fundProtectionDate", "buyerSignedMediation", "buyerSignedMediationAt", "sellerSignedMediation", "sellerSignedMediationAt") FROM stdin;
cmfqt4sef0001h2r1ph4j43vn	cmfqptx630002h26lmvzj0tvd	cmfqptx660003h26llurbau9n	cmfqrfvpi0001h27y5vwyur33	KYC2_VERIFICATION	250000.000000000000000000000000000000	262000.000000000000000000000000000000	\N	HYBRID	60	40	Test offer	Standard terms	2025-09-19 12:19:58.022	2025-09-19 12:22:25.286	\N	\N	\N	f	f	f	t	2025-09-19 12:19:58.023	2025-09-19 13:28:00.543	t	2025-09-19 12:22:54.755	\N	t	2025-09-19 12:29:17.512	f	\N	f	\N	2025-09-19 13:28:00.542	\N	t	2025-09-19 13:23:30.052	t	2025-09-19 13:26:39.371
cmfqzuywy000ph2otnbkgvxjw	cmfqptx630002h26lmvzj0tvd	cmfqptx660003h26llurbau9n	cmfqz0gms0001h2ot3dyehmrb	AGREEMENT	25111.000000000000000000000000000000	25111.000000000000000000000000000000	\N	HYBRID	50	50	\N	\N	2025-09-19 15:28:17.218	2025-09-19 15:32:34.604	\N	\N	\N	f	f	f	t	2025-09-19 15:28:17.219	2025-09-19 15:54:55.344	t	2025-09-19 15:47:38.129	\N	t	2025-09-19 15:47:06.128	f	\N	t	2025-09-19 15:54:55.343	\N	\N	t	2025-09-19 15:50:16.248	t	2025-09-19 15:50:52.04
cmfr2q6b3002dh2ot1ipegzgf	cmfqptx630002h26lmvzj0tvd	cmfr17ro5001ih2ot5z5v8yu4	cmfr1wdd0001rh2oty4ros5td	AGREEMENT	325000.000000000000000000000000000000	325000.000000000000000000000000000000	\N	HYBRID	70	30	fasdfaf	dasfadsf	2025-09-19 16:48:32.366	2025-09-19 17:02:32.034	\N	\N	\N	f	f	f	t	2025-09-19 16:48:32.367	2025-09-19 17:09:44.518	t	2025-09-19 17:09:44.514	\N	t	2025-09-19 17:09:05.624	f	\N	f	\N	\N	\N	f	\N	f	\N
cmfsait65003bh2otwfklp8o1	cmfqptx630002h26lmvzj0tvd	cmfqptx660003h26llurbau9n	cmfsabd2q002th2oty827xaik	AGREEMENT	250000.000000000000000000000000000000	25550000.000000000000000000000000000000	\N	HYBRID	85	15	fafdads	fdsafadsf	2025-09-20 13:14:31.852	2025-09-20 15:12:54.828	\N	\N	\N	f	f	f	t	2025-09-20 13:14:31.853	2025-09-20 15:16:58.51	t	2025-09-20 15:15:36.371	\N	t	2025-09-20 15:16:02.994	f	\N	f	\N	\N	\N	f	\N	t	2025-09-20 15:16:58.509
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.users (id, email, password, "emailVerified", role, "firstName", "lastName", phone, "phoneNumber", "phoneVerified", "dateOfBirth", "addressLine1", city, state, "postalCode", country, "paymentPreference", "strigaUserId", "kycStatus", "kycSessionId", "kyc2Status", "kyc2SessionId", "kyc2CompletedAt", "createdAt", "updatedAt") FROM stdin;
cmfqptx350000h26l748hs4s0	f@pachoman.com	$2b$10$uyzyFVR5/So5zI7oxrbhGuEucyAZnYl88k/EtE3nGxBZpSj.YByiu	\N	ADMIN	Admin	User	+351000000000	\N	f	1980-01-01 00:00:00	Admin Street 1	Lisbon	\N	1000-000	PT	HYBRID	\N	PASSED	\N	PENDING	\N	\N	2025-09-19 10:47:32.033	2025-09-19 10:47:32.033
cmfqptx630002h26lmvzj0tvd	buyer@test.com	$2b$10$BRarhpBz//7p9zh0UuZSGepmuY/HkC3lczXIcpH/FniNeqX9xqft2	2025-09-19 10:57:14.48	BUYER	Test	Buyer	+351900000001	\N	t	1990-01-01 00:00:00	Buyer Street 1	Porto	\N	4000-000	PT	FIAT	8d356d73-0905-40c1-900d-59f7a75d55b5	PASSED	\N	PENDING	\N	\N	2025-09-19 10:47:32.14	2025-09-19 10:57:14.48
cmfqptx660003h26llurbau9n	seller@test.com	$2b$10$BRarhpBz//7p9zh0UuZSGepmuY/HkC3lczXIcpH/FniNeqX9xqft2	2025-09-19 10:57:16.836	SELLER	Test	Seller	+351900000002	\N	t	1985-01-01 00:00:00	Seller Avenue 1	Faro	\N	8000-000	PT	FIAT	b3d32c24-4c4f-4db2-9873-04eb0987fa37	PASSED	\N	PENDING	\N	\N	2025-09-19 10:47:32.142	2025-09-19 10:57:16.837
cmfqzlep4000gh2otifdq4dj0	test1@test.com	$2b$12$9FRjFdPVqjmW.pOj3NBUgeYdIwJF/XAyZT4d/ZWw2ujxRJF8rk1ny	2025-09-19 15:25:12.332	SELLER	tatiana	perez	\N	+351211111111	t	\N	\N	\N	\N	\N	Portugal	FIAT	3b332c30-0db5-4702-8cc7-789cf4cb2dd3	PASSED	_act-sbx-jwt-eyJhbGciOiJub25lIn0.eyJqdGkiOiJfYWN0LXNieC01YzhmODE3OS0zNzM5LTQ2YjktYWM5Ny0wNmY1MGVhOWZmNWYtdjIiLCJ1cmwiOiJodHRwczovL2FwaS5zdW1zdWIuY29tIn0.-v2	PENDING	\N	\N	2025-09-19 15:20:51.112	2025-09-19 15:26:13.541
cmfr17ro5001ih2ot5z5v8yu4	test2@test.com	$2b$12$c94Aq8YmJJyF4BD9H2.guuWL.oiAFqJ0Z/Ogsg6nqQIAjlcFsUAii	2025-09-19 16:10:19.156	SELLER	Bruno	registers	\N	+351927885532	t	\N	\N	\N	\N	\N	Portugal	FIAT	3cd45665-a7b3-4cb1-99b7-f2a944be6fef	PASSED	_act-sbx-jwt-eyJhbGciOiJub25lIn0.eyJqdGkiOiJfYWN0LXNieC03MjM0MGE2Ny0zMDIwLTQwODYtOWY2MS02OGU0MDEzNGFiZTgtdjIiLCJ1cmwiOiJodHRwczovL2FwaS5zdW1zdWIuY29tIn0.-v2	PENDING	\N	\N	2025-09-19 16:06:13.973	2025-09-19 16:11:19.597
cmfsbmmbq003gh2ot62k3rqwr	elisa@test.com	$2b$12$G00MB.IOIeVEps3A9PaHv.E52nywuusutNvEPm6KbqgPUsiO4O3gS	2025-09-20 13:49:08.838	BUYER	Elisa	Elisa	\N	+37253912338	t	\N	\N	\N	\N	\N	Portugal	FIAT	230a1eb8-9a3b-476d-b8a5-cc9950ab7854	INITIATED	_act-sbx-jwt-eyJhbGciOiJub25lIn0.eyJqdGkiOiJfYWN0LXNieC1lMjc4ZjUyYS04MmEyLTQ4M2EtOTYzNC03ZTBiMzQyMWRmNzktdjIiLCJ1cmwiOiJodHRwczovL2FwaS5zdW1zdWIuY29tIn0.-v2	PENDING	\N	\N	2025-09-20 13:45:29.222	2025-09-20 13:49:08.839
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.wallets (id, "userId", "strigaWalletId", currency, address, "qrCode", balance, "lastSyncAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: webhook_events; Type: TABLE DATA; Schema: public; Owner: caenhebo
--

COPY public.webhook_events (id, "eventType", source, "eventId", payload, processed, "processedAt", error, "createdAt") FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: bank_accounts bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: counter_offers counter_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.counter_offers
    ADD CONSTRAINT counter_offers_pkey PRIMARY KEY (id);


--
-- Name: digital_ibans digital_ibans_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.digital_ibans
    ADD CONSTRAINT digital_ibans_pkey PRIMARY KEY (id);


--
-- Name: document_access document_access_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.document_access
    ADD CONSTRAINT document_access_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: escrow_details escrow_details_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.escrow_details
    ADD CONSTRAINT escrow_details_pkey PRIMARY KEY (id);


--
-- Name: escrow_steps escrow_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.escrow_steps
    ADD CONSTRAINT escrow_steps_pkey PRIMARY KEY (id);


--
-- Name: interviews interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_pkey PRIMARY KEY (id);


--
-- Name: legal_templates legal_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.legal_templates
    ADD CONSTRAINT legal_templates_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: property_audits property_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.property_audits
    ADD CONSTRAINT property_audits_pkey PRIMARY KEY (id);


--
-- Name: property_interests property_interests_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.property_interests
    ADD CONSTRAINT property_interests_pkey PRIMARY KEY (id);


--
-- Name: transaction_status_history transaction_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.transaction_status_history
    ADD CONSTRAINT transaction_status_history_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: webhook_events webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT webhook_events_pkey PRIMARY KEY (id);


--
-- Name: bank_accounts_userId_key; Type: INDEX; Schema: public; Owner: caenhebo
--

CREATE UNIQUE INDEX "bank_accounts_userId_key" ON public.bank_accounts USING btree ("userId");


--
-- Name: digital_ibans_iban_key; Type: INDEX; Schema: public; Owner: caenhebo
--

CREATE UNIQUE INDEX digital_ibans_iban_key ON public.digital_ibans USING btree (iban);


--
-- Name: document_access_propertyId_buyerId_key; Type: INDEX; Schema: public; Owner: caenhebo
--

CREATE UNIQUE INDEX "document_access_propertyId_buyerId_key" ON public.document_access USING btree ("propertyId", "buyerId");


--
-- Name: escrow_details_transactionId_key; Type: INDEX; Schema: public; Owner: caenhebo
--

CREATE UNIQUE INDEX "escrow_details_transactionId_key" ON public.escrow_details USING btree ("transactionId");


--
-- Name: escrow_steps_transactionId_stepNumber_key; Type: INDEX; Schema: public; Owner: caenhebo
--

CREATE UNIQUE INDEX "escrow_steps_transactionId_stepNumber_key" ON public.escrow_steps USING btree ("transactionId", "stepNumber");


--
-- Name: profiles_userId_key; Type: INDEX; Schema: public; Owner: caenhebo
--

CREATE UNIQUE INDEX "profiles_userId_key" ON public.profiles USING btree ("userId");


--
-- Name: properties_code_key; Type: INDEX; Schema: public; Owner: caenhebo
--

CREATE UNIQUE INDEX properties_code_key ON public.properties USING btree (code);


--
-- Name: property_interests_propertyId_buyerId_key; Type: INDEX; Schema: public; Owner: caenhebo
--

CREATE UNIQUE INDEX "property_interests_propertyId_buyerId_key" ON public.property_interests USING btree ("propertyId", "buyerId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: caenhebo
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_strigaUserId_key; Type: INDEX; Schema: public; Owner: caenhebo
--

CREATE UNIQUE INDEX "users_strigaUserId_key" ON public.users USING btree ("strigaUserId");


--
-- Name: wallets_strigaWalletId_key; Type: INDEX; Schema: public; Owner: caenhebo
--

CREATE UNIQUE INDEX "wallets_strigaWalletId_key" ON public.wallets USING btree ("strigaWalletId");


--
-- Name: wallets_userId_currency_key; Type: INDEX; Schema: public; Owner: caenhebo
--

CREATE UNIQUE INDEX "wallets_userId_currency_key" ON public.wallets USING btree ("userId", currency);


--
-- Name: webhook_events_source_eventId_key; Type: INDEX; Schema: public; Owner: caenhebo
--

CREATE UNIQUE INDEX "webhook_events_source_eventId_key" ON public.webhook_events USING btree (source, "eventId");


--
-- Name: bank_accounts bank_accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT "bank_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: counter_offers counter_offers_transactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.counter_offers
    ADD CONSTRAINT "counter_offers_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES public.transactions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: digital_ibans digital_ibans_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.digital_ibans
    ADD CONSTRAINT "digital_ibans_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_access document_access_buyerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.document_access
    ADD CONSTRAINT "document_access_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_access document_access_grantedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.document_access
    ADD CONSTRAINT "document_access_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_access document_access_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.document_access
    ADD CONSTRAINT "document_access_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_transactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES public.transactions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: escrow_details escrow_details_transactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.escrow_details
    ADD CONSTRAINT "escrow_details_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES public.transactions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: escrow_steps escrow_steps_transactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.escrow_steps
    ADD CONSTRAINT "escrow_steps_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES public.transactions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: interviews interviews_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT "interviews_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_transactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES public.transactions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: profiles profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: properties properties_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT "properties_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: property_audits property_audits_adminId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.property_audits
    ADD CONSTRAINT "property_audits_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: property_audits property_audits_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.property_audits
    ADD CONSTRAINT "property_audits_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: property_interests property_interests_buyerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.property_interests
    ADD CONSTRAINT "property_interests_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: property_interests property_interests_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.property_interests
    ADD CONSTRAINT "property_interests_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transaction_status_history transaction_status_history_transactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.transaction_status_history
    ADD CONSTRAINT "transaction_status_history_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES public.transactions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transactions transactions_buyerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transactions transactions_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transactions transactions_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: wallets wallets_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: caenhebo
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Ux696ohNhDBDnMgzBzjpQpE77EoDgYO1e3AjeDlz6DoNhULDPANL15VSFj0QI2r

