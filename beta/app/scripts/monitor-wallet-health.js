#!/usr/bin/env node

/**
 * Wallet Health Monitor
 * 
 * This script checks for wallet issues and reports them.
 * Run this as a cron job daily to get reports about:
 * - Users with missing wallets
 * - Failed wallet creation attempts
 * - Wallet sync status
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateWalletHealthReport() {
  console.log('📊 WALLET HEALTH REPORT');
  console.log('=' .repeat(50));
  console.log(`Generated at: ${new Date().toISOString()}\n`);

  try {
    // 1. Check for KYC-approved users without wallets
    const kycUsersNoWallets = await prisma.user.findMany({
      where: {
        kycStatus: 'PASSED',
        strigaUserId: { not: null },
        wallets: {
          none: {}
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        strigaUserId: true
      }
    });

    if (kycUsersNoWallets.length > 0) {
      console.log('🚨 CRITICAL: KYC-approved users with NO wallets:');
      kycUsersNoWallets.forEach(user => {
        const daysSinceCreation = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        console.log(`  - ${user.email} (${user.role}) - Created ${daysSinceCreation} days ago`);
      });
      console.log('');
    }

    // 2. Check for users with incomplete wallets
    const allKycUsers = await prisma.user.findMany({
      where: {
        kycStatus: 'PASSED',
        strigaUserId: { not: null }
      },
      include: {
        wallets: true,
        digitalIbans: true
      }
    });

    const incompleteUsers = [];
    
    for (const user of allKycUsers) {
      const expectedWallets = user.role === 'SELLER' ? 5 : 4;
      const hasIban = user.role === 'SELLER' ? user.digitalIbans.length > 0 : true;
      
      if (user.wallets.length < expectedWallets || !hasIban) {
        incompleteUsers.push({
          email: user.email,
          role: user.role,
          walletCount: user.wallets.length,
          expectedCount: expectedWallets,
          missingCurrencies: getMissingCurrencies(user),
          hasIban: hasIban
        });
      }
    }

    if (incompleteUsers.length > 0) {
      console.log('⚠️  WARNING: Users with incomplete wallet setup:');
      incompleteUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.role})`);
        console.log(`    Wallets: ${user.walletCount}/${user.expectedCount}`);
        if (user.missingCurrencies.length > 0) {
          console.log(`    Missing: ${user.missingCurrencies.join(', ')}`);
        }
        if (!user.hasIban && user.role === 'SELLER') {
          console.log(`    Missing: Digital IBAN`);
        }
      });
      console.log('');
    }

    // 3. Check webhook processing status
    const recentWebhooks = await prisma.webhookEvent.findMany({
      where: {
        eventType: {
          in: ['KYC_STATUS_CHANGED', 'WALLET_CREATED']
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    const failedWebhooks = recentWebhooks.filter(w => !w.processed || w.error);
    
    if (failedWebhooks.length > 0) {
      console.log('❌ FAILED WEBHOOKS (Last 24h):');
      failedWebhooks.forEach(webhook => {
        console.log(`  - ${webhook.eventType} at ${webhook.createdAt.toISOString()}`);
        if (webhook.error) {
          console.log(`    Error: ${webhook.error}`);
        }
      });
      console.log('');
    }

    // 4. Summary statistics
    const totalUsers = await prisma.user.count();
    const kycApprovedUsers = await prisma.user.count({
      where: { kycStatus: 'PASSED' }
    });
    const totalWallets = await prisma.wallet.count();
    const avgWalletsPerUser = kycApprovedUsers > 0 ? (totalWallets / kycApprovedUsers).toFixed(2) : 0;

    console.log('📈 SUMMARY STATISTICS:');
    console.log(`  - Total users: ${totalUsers}`);
    console.log(`  - KYC approved users: ${kycApprovedUsers}`);
    console.log(`  - Total wallets: ${totalWallets}`);
    console.log(`  - Avg wallets per KYC user: ${avgWalletsPerUser}`);
    console.log('');

    // 5. Recommendations
    if (kycUsersNoWallets.length > 0 || incompleteUsers.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      console.log('  1. Run the wallet sync script immediately:');
      console.log('     node scripts/wallet-check-service.js');
      console.log('  2. Check Striga API credentials are valid');
      console.log('  3. Review webhook logs for errors');
      console.log('  4. Consider enabling the wallet check service as a PM2 process');
      console.log('');
    } else {
      console.log('✅ All systems healthy! All KYC-approved users have their wallets.');
    }

  } catch (error) {
    console.error('❌ Error generating report:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getMissingCurrencies(user) {
  const requiredCurrencies = ['BTC', 'ETH', 'BNB', 'USDT'];
  if (user.role === 'SELLER') {
    requiredCurrencies.push('EUR');
  }
  
  const existingCurrencies = user.wallets.map(w => w.currency);
  return requiredCurrencies.filter(c => !existingCurrencies.includes(c));
}

// Run the report
generateWalletHealthReport();