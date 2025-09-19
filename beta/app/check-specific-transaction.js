const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTransaction() {
  try {
    // Check the specific transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: 'cmfc9mufr0003h2yziizuctcf' },
      include: {
        property: true,
        buyer: true,
        seller: true
      }
    });

    if (!transaction) {
      console.log('❌ Transaction NOT FOUND');
      return;
    }

    console.log('📋 TRANSACTION DETAILS:');
    console.log('========================');
    console.log('ID:', transaction.id);
    console.log('Status:', transaction.status);
    console.log('Property:', transaction.property?.title);
    console.log('Buyer:', transaction.buyer?.email);
    console.log('Seller:', transaction.seller?.email);

    console.log('\n📝 SIGNATURE STATUS:');
    console.log('Purchase Agreement Signed:', transaction.purchaseAgreementSigned);
    console.log('Buyer Signed Promissory:', transaction.buyerSignedPromissory);
    console.log('Seller Signed Promissory:', transaction.sellerSignedPromissory);

    console.log('\n📑 STAGE 3 STATUS:');
    console.log('Buyer Has Rep:', transaction.buyerHasRep);
    console.log('Seller Has Rep:', transaction.sellerHasRep);
    console.log('Mediation Signed:', transaction.mediationSigned);

    if (transaction.buyerSignedPromissory && transaction.sellerSignedPromissory) {
      console.log('\n⚠️ BOTH SIGNATURES ALREADY MARKED - This is why you see the old UI');
      console.log('The new upload flow only shows when signatures are not yet recorded');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransaction();