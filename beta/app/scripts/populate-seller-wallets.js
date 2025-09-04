#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function populateSellerWallets() {
  console.log('🔧 Populating wallets for seller@test.com...\n');
  
  try {
    // Find the seller
    const seller = await prisma.user.findFirst({
      where: {
        email: 'seller@test.com'
      }
    });

    if (!seller) {
      console.error('❌ Seller not found');
      return;
    }

    console.log(`Found seller: ${seller.email}`);
    console.log(`Striga User ID: ${seller.strigaUserId}`);
    console.log(`KYC Status: ${seller.kycStatus}\n`);

    // Create crypto wallets
    const currencies = ['BTC', 'ETH', 'BNB', 'USDT'];
    
    for (const currency of currencies) {
      const existingWallet = await prisma.wallet.findUnique({
        where: {
          userId_currency: {
            userId: seller.id,
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
          userId: seller.id,
          strigaWalletId: `wallet-${currency.toLowerCase()}-${seller.strigaUserId}`,
          currency: currency,
          address: `${currency.toLowerCase()}-address-${Date.now()}`,
          balance: 0
        }
      });
      
      console.log(`✅ Created ${currency} wallet`);
    }

    // Create EUR wallet for seller (primary wallet)
    const existingEurWallet = await prisma.wallet.findUnique({
      where: {
        userId_currency: {
          userId: seller.id,
          currency: 'EUR'
        }
      }
    });

    if (!existingEurWallet) {
      const eurWallet = await prisma.wallet.create({
        data: {
          userId: seller.id,
          strigaWalletId: `wallet-eur-${seller.strigaUserId}`,
          currency: 'EUR',
          address: null, // EUR doesn't have blockchain address
          balance: 0
        }
      });
      console.log(`✅ Created EUR wallet`);
    }

    // Create digital IBAN
    const existingIban = await prisma.digitalIban.findFirst({
      where: {
        userId: seller.id,
        active: true
      }
    });

    if (!existingIban) {
      const iban = await prisma.digitalIban.create({
        data: {
          userId: seller.id,
          iban: 'PT50000000000000000000001',
          bankName: 'Striga Digital Bank',
          accountNumber: '000000001',
          active: true
        }
      });
      console.log(`✅ Created digital IBAN: ${iban.iban}`);
    }

    // Verify the results
    const walletCount = await prisma.wallet.count({
      where: { userId: seller.id }
    });

    console.log(`\n✅ Completed! Seller now has ${walletCount} wallets`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateSellerWallets();