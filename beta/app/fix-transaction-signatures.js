const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSignatures() {
  try {
    console.log('Fixing transaction signature fields...');

    // Update the transaction to reflect the signatures from history
    const result = await prisma.transaction.update({
      where: { id: 'cmfccc4by0001h2tkygk4j2mh' },
      data: {
        buyerSignedPromissory: true,
        sellerSignedPromissory: true,
        buyerSignedPromissoryAt: new Date('2025-09-09T11:15:32Z'),
        sellerSignedPromissoryAt: new Date('2025-09-09T11:16:57Z')
      }
    });

    console.log('✅ Fixed signature fields!');
    console.log('Buyer Signed:', result.buyerSignedPromissory);
    console.log('Seller Signed:', result.sellerSignedPromissory);
    console.log('Purchase Agreement Signed:', result.purchaseAgreementSigned);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSignatures();