const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBuyerAPIs() {
  try {
    // Get the buyer@test.com user ID
    const buyer = await prisma.user.findUnique({
      where: { email: 'buyer@test.com' }
    });

    if (!buyer) {
      console.log('Buyer not found');
      return;
    }

    console.log('Buyer ID:', buyer.id);
    console.log('Buyer email:', buyer.email);

    // Check property interests
    console.log('\n=== Property Interests ===');
    const interests = await prisma.propertyInterest.findMany({
      where: {
        buyerId: buyer.id
      },
      include: {
        property: {
          include: {
            seller: true
          }
        }
      }
    });

    console.log('Total interests:', interests.length);
    interests.forEach(interest => {
      console.log(`- Property: ${interest.property.title} (${interest.property.code})`);
      console.log(`  Interested at: ${interest.interestedAt}`);
    });

    // Check transactions/offers
    console.log('\n=== Transactions/Offers ===');
    const offers = await prisma.transaction.findMany({
      where: {
        buyerId: buyer.id,
        status: {
          not: 'CANCELLED'
        }
      },
      include: {
        property: true
      }
    });

    console.log('Total offers:', offers.length);
    offers.forEach(offer => {
      console.log(`- Property: ${offer.property.title} (${offer.property.code})`);
      console.log(`  Status: ${offer.status}`);
      console.log(`  Offer Price: ${offer.offerPrice}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBuyerAPIs();
