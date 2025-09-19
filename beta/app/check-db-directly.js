const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTransaction() {
  try {
    // Check if the transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { id: 'cmfccc4by0001h2tkygk4j2mh' },
      include: {
        buyer: true,
        seller: true,
        property: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        documents: true,
        counterOffers: true
      }
    });

    if (!transaction) {
      console.log('❌ Transaction NOT FOUND with ID: cmfccc4by0001h2tkygk4j2mh');

      // List all transactions
      const allTransactions = await prisma.transaction.findMany({
        include: {
          property: true,
          buyer: true,
          seller: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      console.log('\n📋 Available Transactions:');
      allTransactions.forEach(t => {
        console.log(`ID: ${t.id}`);
        console.log(`  Property: ${t.property?.title || 'Unknown'}`);
        console.log(`  Status: ${t.status}`);
        console.log(`  Buyer: ${t.buyer?.email}`);
        console.log(`  Seller: ${t.seller?.email}`);
        console.log(`  Created: ${t.createdAt}`);
        console.log('---');
      });
    } else {
      console.log('✅ TRANSACTION FOUND!');
      console.log('\n📋 TRANSACTION DETAILS:');
      console.log('========================');
      console.log('ID:', transaction.id);
      console.log('Status:', transaction.status);
      console.log('Property:', transaction.property?.title);
      console.log('Property Code:', transaction.property?.code);
      console.log('Buyer:', transaction.buyer?.email);
      console.log('Seller:', transaction.seller?.email);
      console.log('Offer Price:', transaction.offerPrice.toString());
      console.log('Agreed Price:', transaction.agreedPrice?.toString());

      console.log('\n📝 AGREEMENT STATUS:');
      console.log('Purchase Agreement Signed:', transaction.purchaseAgreementSigned);
      console.log('Buyer Signed Promissory:', transaction.buyerSignedPromissory);
      console.log('Seller Signed Promissory:', transaction.sellerSignedPromissory);

      console.log('\n📑 STAGE 3 STATUS:');
      console.log('Buyer Has Rep:', transaction.buyerHasRep);
      console.log('Seller Has Rep:', transaction.sellerHasRep);
      console.log('Mediation Signed:', transaction.mediationSigned);

      console.log('\n📄 DOCUMENTS:', transaction.documents.length);
      transaction.documents.forEach(doc => {
        console.log(`  - ${doc.documentType}: ${doc.title || doc.filename}`);
      });

      console.log('\n📜 STATUS HISTORY:');
      transaction.statusHistory.forEach(h => {
        console.log(`  - ${h.notes || 'No notes'} (${h.createdAt})`);
      });
    }

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransaction();