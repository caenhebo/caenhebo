#!/usr/bin/env node

/**
 * Create a complete test scenario for Stage 3 testing
 * This will create properties and transactions in the appropriate stages
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestScenario() {
  try {
    console.log('Creating test scenario for Stage 3...\n');

    // Get test users
    const buyer = await prisma.user.findUnique({
      where: { email: 'buyer@test.com' }
    });

    const seller = await prisma.user.findUnique({
      where: { email: 'seller@test.com' }
    });

    if (!buyer || !seller) {
      console.error('Test users not found. Please ensure buyer@test.com and seller@test.com exist.');
      return;
    }

    console.log('✓ Found test users');

    // Create a test property
    const property = await prisma.property.create({
      data: {
        sellerId: seller.id,
        code: `TEST-${Date.now()}`,
        title: 'Test Property for Stage 3',
        description: 'Beautiful villa perfect for testing Stage 3 functionality',
        address: '123 Test Street',
        city: 'Lisbon',
        state: 'Lisboa',
        postalCode: '1000-001',
        country: 'Portugal',
        price: 500000,
        area: 200,
        bedrooms: 4,
        bathrooms: 3,
        complianceStatus: 'APPROVED'
      }
    });

    console.log(`✓ Created test property: ${property.code}`);

    // Create a transaction in AGREEMENT stage
    const transaction = await prisma.transaction.create({
      data: {
        propertyId: property.id,
        buyerId: buyer.id,
        sellerId: seller.id,
        status: 'AGREEMENT',
        offerPrice: 480000,
        agreedPrice: 490000,
        proposalDate: new Date(),
        acceptanceDate: new Date(),
        buyerHasRep: false,
        sellerHasRep: false,
        mediationSigned: false
      }
    });

    console.log(`✓ Created transaction in AGREEMENT stage: ${transaction.id}`);

    // Create status history
    await prisma.transactionStatusHistory.createMany({
      data: [
        {
          transactionId: transaction.id,
          toStatus: 'OFFER',
          changedBy: buyer.id,
          notes: 'Initial offer submitted'
        },
        {
          transactionId: transaction.id,
          fromStatus: 'OFFER',
          toStatus: 'NEGOTIATION',
          changedBy: seller.id,
          notes: 'Entered negotiation'
        },
        {
          transactionId: transaction.id,
          fromStatus: 'NEGOTIATION',
          toStatus: 'AGREEMENT',
          changedBy: buyer.id,
          notes: 'Agreement reached'
        }
      ]
    });

    console.log('✓ Created status history');

    console.log('\n=== Test Scenario Created Successfully ===');
    console.log('\nTransaction Details:');
    console.log(`- Transaction ID: ${transaction.id}`);
    console.log(`- Property: ${property.title} (${property.code})`);
    console.log(`- Status: AGREEMENT (Stage 3)`);
    console.log(`- Buyer: ${buyer.email}`);
    console.log(`- Seller: ${seller.email}`);
    console.log(`- Agreed Price: €${transaction.agreedPrice.toLocaleString()}`);
    
    console.log('\nStage 3 Requirements Status:');
    console.log('- Representation Document: ❌ Not uploaded');
    console.log('- Mediation Agreement: ❌ Not uploaded');
    console.log('- Buyer Confirmation: ❌ Not confirmed');
    console.log('- Seller Confirmation: ❌ Not confirmed');
    console.log('- Mediation Signed: ❌ Not signed');
    
    console.log('\nYou can now:');
    console.log('1. Login as buyer@test.com or seller@test.com');
    console.log('2. Navigate to the transaction page');
    console.log('3. Upload required documents');
    console.log('4. Complete confirmations');
    console.log('5. Advance to Escrow stage');
    
    console.log(`\nTransaction URL: http://95.179.170.56:3019/transactions/${transaction.id}`);

  } catch (error) {
    console.error('Error creating test scenario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestScenario();