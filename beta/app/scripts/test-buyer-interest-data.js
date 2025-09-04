#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBuyerInterestData() {
  try {
    // Get buyer
    const buyer = await prisma.user.findFirst({
      where: { email: 'buyer@test.com' }
    });

    if (!buyer) {
      console.error('Buyer not found');
      return;
    }

    console.log('Buyer found:', buyer.email, 'ID:', buyer.id);

    // Get interests with full property data
    const interests = await prisma.propertyInterest.findMany({
      where: {
        buyerId: buyer.id
      },
      include: {
        property: {
          include: {
            seller: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            documents: {
              where: {
                type: 'MAIN_IMAGE'
              },
              take: 1
            }
          }
        }
      },
      orderBy: {
        interestedAt: 'desc'
      }
    });

    console.log('\nFound', interests.length, 'interests\n');

    interests.forEach(interest => {
      console.log('Interest ID:', interest.id);
      console.log('Property:', interest.property.title);
      console.log('Code:', interest.property.code);
      console.log('Price:', interest.property.price);
      console.log('Location:', interest.property.location);
      console.log('Area:', interest.property.area);
      console.log('Compliance Status:', interest.property.complianceStatus);
      console.log('Seller:', interest.property.seller.firstName, interest.property.seller.lastName);
      console.log('Seller Email:', interest.property.seller.email);
      console.log('Main Image:', interest.property.documents[0]?.url || 'No image');
      console.log('Interest Date:', interest.interestedAt);
      console.log('Message:', interest.message || 'No message');
      console.log('\n---\n');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBuyerInterestData();