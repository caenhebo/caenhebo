const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStage3() {
  const transactionId = 'cmfc9mufr0003h2yziizuctcf';
  
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      id: true,
      status: true,
      buyerHasRep: true,
      sellerHasRep: true,
      mediationSigned: true,
      documents: {
        select: {
          id: true,
          documentType: true,
          title: true
        }
      }
    }
  });
  
  console.log('Transaction:', JSON.stringify(transaction, null, 2));
  
  // Reset Stage 3 fields for proper testing
  console.log('\nResetting Stage 3 fields for proper testing...');
  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      buyerHasRep: false,
      sellerHasRep: false,
      mediationSigned: false
    }
  });
  
  // Also delete any test documents
  await prisma.document.deleteMany({
    where: {
      transactionId: transactionId,
      documentType: {
        in: ['REPRESENTATION_DOCUMENT', 'MEDIATION_AGREEMENT']
      }
    }
  });
  
  console.log('✓ Stage 3 reset complete - ready for testing');
}

checkStage3()
  .catch(console.error)
  .finally(() => prisma.$disconnect());