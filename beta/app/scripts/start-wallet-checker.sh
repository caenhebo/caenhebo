#!/bin/bash

echo "🚀 Starting Wallet Check Service..."

# Check if already running
if pm2 info wallet-checker > /dev/null 2>&1; then
  echo "⚠️  Wallet checker already running. Restarting..."
  pm2 restart wallet-checker
else
  echo "✅ Starting new wallet checker instance..."
  pm2 start scripts/wallet-check-service.js --name wallet-checker \
    --log-date-format "YYYY-MM-DD HH:mm:ss" \
    --merge-logs \
    --time
fi

# Save PM2 configuration
pm2 save

echo "✅ Wallet Check Service started!"
echo ""
echo "📊 View logs with: pm2 logs wallet-checker"
echo "📈 Check status with: pm2 info wallet-checker"
echo "🛑 Stop with: pm2 stop wallet-checker"