#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBuyerInterests() {
  try {
    // Find all property interests
    const interests = await prisma.propertyInterest.findMany({
      include: {
        buyer: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        property: {
          select: {
            code: true,
            title: true,
            price: true
          }
        }
      }
    });

    console.log(`\nFound ${interests.length} property interests in total\n`);

    if (interests.length > 0) {
      console.log('Property Interests:');
      interests.forEach(interest => {
        console.log(`- Buyer: ${interest.buyer.email}`);
        console.log(`  Property: ${interest.property.title} (${interest.property.code})`);
        console.log(`  Price: €${interest.property.price.toLocaleString()}`);
        console.log(`  Date: ${interest.interestedAt.toLocaleDateString()}`);
        if (interest.message) {
          console.log(`  Message: "${interest.message}"`);
        }
        console.log('');
      });
    }

    // Check specifically for buyer@test.com
    const buyerTestInterests = await prisma.propertyInterest.findMany({
      where: {
        buyer: {
          email: 'buyer@test.com'
        }
      },
      include: {
        property: true
      }
    });

    console.log(`\nbuyer@test.com has ${buyerTestInterests.length} interests`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBuyerInterests();