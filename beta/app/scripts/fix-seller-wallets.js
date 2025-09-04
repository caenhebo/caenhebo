#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import the wallet creation functions
const { createWallet, createDigitalIban } = require('../src/lib/striga');

async function fixSellerWallets() {
  console.log('🔧 Fixing wallets for KYC-approved sellers...\n');
  
  try {
    // Find the seller
    const seller = await prisma.user.findFirst({
      where: {
        email: 'seller@test.com',
        kycStatus: 'PASSED',
        role: 'SELLER'
      },
      include: {
        wallets: true
      }
    });

    if (!seller) {
      console.error('❌ Seller not found or KYC not passed');
      return;
    }

    console.log(`Found seller: ${seller.email}`);
    console.log(`Striga User ID: ${seller.strigaUserId}`);
    console.log(`Current wallets: ${seller.wallets.length}\n`);

    if (!seller.strigaUserId) {
      console.error('❌ No Striga User ID found');
      return;
    }

    // Create all crypto wallets
    const currencies = ['BTC', 'ETH', 'BNB', 'USDT'];
    
    for (const currency of currencies) {
      const existingWallet = seller.wallets.find(w => w.currency === currency);
      
      if (existingWallet) {
        console.log(`✅ ${currency} wallet already exists`);
        continue;
      }

      try {
        console.log(`Creating ${currency} wallet...`);
        const walletData = await createWallet(seller.strigaUserId, currency);
        
        // Create wallet record in database
        const wallet = await prisma.wallet.create({
          data: {
            userId: seller.id,
            strigaWalletId: walletData.walletId || `pending-${currency}-${Date.now()}`,
            currency: currency,
            address: walletData.address || null,
            balance: 0
          }
        });
        
        console.log(`✅ Created ${currency} wallet: ${wallet.strigaWalletId}`);
      } catch (error) {
        console.error(`❌ Failed to create ${currency} wallet:`, error.message);
      }
    }

    // Create digital IBAN for seller
    try {
      const existingIban = await prisma.digitalIban.findFirst({
        where: {
          userId: seller.id,
          active: true
        }
      });

      if (!existingIban) {
        console.log('\nCreating digital IBAN...');
        const ibanData = await createDigitalIban(seller.strigaUserId);
        
        const iban = await prisma.digitalIban.create({
          data: {
            userId: seller.id,
            iban: ibanData.iban,
            bankName: ibanData.bankName,
            accountNumber: ibanData.accountNumber,
            active: true
          }
        });
        
        console.log(`✅ Created digital IBAN: ${iban.iban}`);
      } else {
        console.log(`✅ Digital IBAN already exists: ${existingIban.iban}`);
      }
    } catch (error) {
      console.error('❌ Failed to create digital IBAN:', error.message);
    }

    // Verify the fix
    const updatedSeller = await prisma.user.findUnique({
      where: { id: seller.id },
      include: {
        wallets: true,
        digitalIbans: true
      }
    });

    console.log(`\n✅ Fix completed!`);
    console.log(`Wallets: ${updatedSeller.wallets.length}`);
    console.log(`Digital IBANs: ${updatedSeller.digitalIbans.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if Striga credentials are available
if (!process.env.STRIGA_API_KEY || !process.env.STRIGA_API_SECRET) {
  console.error('❌ Missing Striga credentials in environment variables');
  console.error('Please ensure STRIGA_API_KEY and STRIGA_API_SECRET are set');
  process.exit(1);
}

fixSellerWallets();