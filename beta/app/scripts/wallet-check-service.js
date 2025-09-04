#!/usr/bin/env node

/**
 * Wallet Check Service
 * 
 * This service runs periodically to ensure all KYC-approved users have their wallets created.
 * It prevents the situation where users pass KYC but don't get wallets due to webhook failures.
 * 
 * Run this as a cron job every hour or as a PM2 service
 */

const { checkAndCreateMissingWallets } = require('../src/lib/wallet-manager');

const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

async function runWalletCheck() {
  console.log(`\n🕐 [${new Date().toISOString()}] Starting wallet check...`);
  
  try {
    await checkAndCreateMissingWallets();
  } catch (error) {
    console.error('❌ Wallet check failed:', error);
  }
  
  console.log(`✅ [${new Date().toISOString()}] Wallet check completed`);
}

// Run immediately on startup
runWalletCheck();

// Then run periodically
setInterval(runWalletCheck, CHECK_INTERVAL);

console.log('💚 Wallet Check Service started');
console.log(`⏰ Will check for missing wallets every ${CHECK_INTERVAL / 1000 / 60} minutes`);

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Wallet Check Service shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nWallet Check Service shutting down...');
  process.exit(0);
});