-- Add promissory agreement fields to transactions table
ALTER TABLE "transactions" 
ADD COLUMN IF NOT EXISTS "buyerSignedPromissory" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "buyerSignedPromissoryAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "sellerSignedPromissory" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "sellerSignedPromissoryAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "purchaseAgreementSignedAt" TIMESTAMP(3);