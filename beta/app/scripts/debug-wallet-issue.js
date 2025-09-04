#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugWalletIssue() {
  try {
    // Find a user with KYC PASSED status
    const kycPassedUsers = await prisma.user.findMany({
      where: {
        kycStatus: 'PASSED',
        role: 'SELLER'
      },
      include: {
        wallets: true,
        digitalIbans: true
      },
      take: 3
    });

    console.log(`\nFound ${kycPassedUsers.length} KYC-approved sellers\n`);

    for (const user of kycPassedUsers) {
      console.log(`\n=== User: ${user.email} ===`);
      console.log(`ID: ${user.id}`);
      console.log(`Striga User ID: ${user.strigaUserId || 'NONE'}`);
      console.log(`KYC Status: ${user.kycStatus}`);
      console.log(`Role: ${user.role}`);
      console.log(`\nWallets in DB: ${user.wallets.length}`);
      
      if (user.wallets.length > 0) {
        console.log('Wallet Details:');
        user.wallets.forEach(wallet => {
          console.log(`  - ${wallet.currency}: ${wallet.strigaWalletId || 'No Striga ID'}`);
        });
      } else {
        console.log('  ❌ No wallets found in database!');
      }

      console.log(`\nDigital IBANs: ${user.digitalIbans.length}`);
      if (user.digitalIbans.length > 0) {
        user.digitalIbans.forEach(iban => {
          console.log(`  - IBAN: ${iban.iban} (Active: ${iban.active})`);
        });
      }

      // Check wallet count (this is what dashboard uses)
      const walletCount = await prisma.wallet.count({
        where: { userId: user.id }
      });
      console.log(`\nWallet count query result: ${walletCount}`);
      console.log(`hasWallets would be: ${walletCount > 0}`);
    }

    // Check if there are any wallets at all in the database
    const totalWallets = await prisma.wallet.count();
    console.log(`\n\nTotal wallets in database: ${totalWallets}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugWalletIssue();