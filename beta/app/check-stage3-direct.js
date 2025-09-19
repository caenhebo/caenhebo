const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStage3Direct() {
  const transactionId = 'cmfc9mufr0003h2yziizuctcf';
  
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      documents: {
        select: {
          id: true,
          documentType: true,
          title: true
        }
      }
    }
  });
  
  console.log('Transaction Stage 3 fields:');
  console.log('- buyerHasRep:', transaction.buyerHasRep);
  console.log('- sellerHasRep:', transaction.sellerHasRep);
  console.log('- mediationSigned:', transaction.mediationSigned);
  console.log('- status:', transaction.status);
  console.log('\nDocuments:');
  console.log(transaction.documents);
  
  // Check what the component would see
  const hasRepresentationDoc = transaction.documents.some(
    doc => doc.documentType === 'REPRESENTATION_DOCUMENT'
  );
  const hasMediationAgreement = transaction.documents.some(
    doc => doc.documentType === 'MEDIATION_AGREEMENT'
  );
  
  const stage3Complete = hasRepresentationDoc && 
                        hasMediationAgreement && 
                        transaction.buyerHasRep && 
                        transaction.sellerHasRep && 
                        transaction.mediationSigned;
                        
  console.log('\nCalculated values:');
  console.log('- hasRepresentationDoc:', hasRepresentationDoc);
  console.log('- hasMediationAgreement:', hasMediationAgreement);
  console.log('- stage3Complete:', stage3Complete);
}

checkStage3Direct()
  .catch(console.error)
  .finally(() => prisma.$disconnect());