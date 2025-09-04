#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function populateBuyerWallets() {
  console.log('🔧 Populating wallets for buyer@test.com...\n');
  
  try {
    // Find the buyer
    const buyer = await prisma.user.findFirst({
      where: {
        email: 'buyer@test.com'
      }
    });

    if (!buyer) {
      console.error('❌ Buyer not found');
      return;
    }

    console.log(`Found buyer: ${buyer.email}`);
    console.log(`Striga User ID: ${buyer.strigaUserId}`);
    console.log(`KYC Status: ${buyer.kycStatus}\n`);

    // Create crypto wallets for buyer
    const currencies = ['BTC', 'ETH', 'BNB', 'USDT'];
    
    for (const currency of currencies) {
      const existingWallet = await prisma.wallet.findUnique({
        where: {
          userId_currency: {
            userId: buyer.id,
            currency: currency
          }
        }
      });
      
      if (existingWallet) {
        console.log(`✅ ${currency} wallet already exists`);
        continue;
      }

      const wallet = await prisma.wallet.create({
        data: {
          userId: buyer.id,
          strigaWalletId: `wallet-${currency.toLowerCase()}-${buyer.strigaUserId}`,
          currency: currency,
          address: `${currency.toLowerCase()}-address-buyer-${Date.now()}`,
          balance: 0
        }
      });
      
      console.log(`✅ Created ${currency} wallet`);
    }

    // Verify the results
    const walletCount = await prisma.wallet.count({
      where: { userId: buyer.id }
    });

    console.log(`\n✅ Completed! Buyer now has ${walletCount} wallets`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateBuyerWallets();