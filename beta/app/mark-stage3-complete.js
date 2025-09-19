const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function markStage3Complete() {
  try {
    // Update both test transactions to mark Stage 3 as complete
    const transactions = [
      'cmfccc4by0001h2tkygk4j2mh',  // Beautiful Villa in Lisbon
      'cmfc9mufr0003h2yziizuctcf'   // Test Property for Stage 3
    ];

    for (const transId of transactions) {
      const result = await prisma.transaction.update({
        where: { id: transId },
        data: {
          buyerHasRep: true,
          sellerHasRep: true,
          mediationSigned: true,
          buyerSignedPromissory: true,
          sellerSignedPromissory: true,
          buyerSignedPromissoryAt: new Date(),
          sellerSignedPromissoryAt: new Date()
        }
      });

      console.log(`✅ Updated ${transId}:`);
      console.log('  - buyerHasRep:', result.buyerHasRep);
      console.log('  - sellerHasRep:', result.sellerHasRep);
      console.log('  - mediationSigned:', result.mediationSigned);
      console.log('  - buyerSignedPromissory:', result.buyerSignedPromissory);
      console.log('  - sellerSignedPromissory:', result.sellerSignedPromissory);
    }

    console.log('\n🎯 Stage 3 requirements marked as complete!');
    console.log('You can now advance to KYC Tier 2 Verification stage.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

markStage3Complete();