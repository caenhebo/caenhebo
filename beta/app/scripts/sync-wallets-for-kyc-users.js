#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { createWallet } = require('../src/lib/striga');

const prisma = new PrismaClient();

async function syncWalletsForKycUsers() {
  console.log('Starting wallet sync for KYC-approved users...\n');
  
  try {
    // Find all users who have passed KYC but don't have wallets
    const kycApprovedUsers = await prisma.user.findMany({
      where: {
        kycStatus: 'PASSED',
        strigaUserId: { not: null }
      },
      include: {
        wallets: true
      }
    });
    
    console.log(`Found ${kycApprovedUsers.length} KYC-approved users\n`);
    
    const currencies = ['BTC', 'ETH', 'BNB', 'USDT'];
    
    for (const user of kycApprovedUsers) {
      console.log(`\nProcessing user: ${user.email} (${user.id})`);
      console.log(`Striga User ID: ${user.strigaUserId}`);
      console.log(`Existing wallets: ${user.wallets.map(w => w.currency).join(', ') || 'None'}`);
      
      // Check which currencies are missing
      const existingCurrencies = user.wallets.map(w => w.currency);
      const missingCurrencies = currencies.filter(c => !existingCurrencies.includes(c));
      
      if (missingCurrencies.length === 0) {
        console.log('✅ User already has all wallets');
        continue;
      }
      
      console.log(`Missing wallets: ${missingCurrencies.join(', ')}`);
      
      // Create missing wallets
      for (const currency of missingCurrencies) {
        try {
          console.log(`Creating ${currency} wallet...`);
          
          // Create wallet via Striga API
          const walletData = await createWallet(user.strigaUserId, currency);
          
          console.log(`✅ Created ${currency} wallet with ID: ${walletData.walletId || 'pending'}`);
          
          // Create wallet record in database
          // Note: The webhook will also create this, but we do it here for immediate availability
          if (walletData.walletId) {
            await prisma.wallet.upsert({
              where: {
                userId_currency: {
                  userId: user.id,
                  currency: currency
                }
              },
              update: {
                strigaWalletId: walletData.walletId,
                address: walletData.address || null,
                lastSyncAt: new Date()
              },
              create: {
                userId: user.id,
                strigaWalletId: walletData.walletId,
                currency: currency,
                address: walletData.address || null,
                balance: 0
              }
            });
          }
          
          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`❌ Failed to create ${currency} wallet:`, error.message);
        }
      }
      
      // Create digital IBAN for sellers if missing
      if (user.role === 'SELLER') {
        const hasIban = await prisma.digitalIban.findFirst({
          where: {
            userId: user.id,
            active: true
          }
        });
        
        if (!hasIban) {
          try {
            console.log('Creating digital IBAN for seller...');
            const { createDigitalIban } = require('../src/lib/striga');
            const ibanData = await createDigitalIban(user.strigaUserId);
            console.log('✅ Created digital IBAN:', ibanData.iban);
            
            // Create IBAN record
            await prisma.digitalIban.create({
              data: {
                userId: user.id,
                iban: ibanData.iban,
                bankName: ibanData.bankName,
                accountNumber: ibanData.accountNumber,
                active: true
              }
            });
          } catch (error) {
            console.error('❌ Failed to create digital IBAN:', error.message);
          }
        }
      }
    }
    
    console.log('\n✅ Wallet sync completed!');
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
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

syncWalletsForKycUsers();