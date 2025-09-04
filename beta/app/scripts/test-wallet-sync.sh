#!/bin/bash
cd /root/coding/claudecode/projects/caenhebo-alpha/app

# Test the wallet sync API for a specific user
echo "Testing wallet sync API..."

# You'll need to get a valid session token first
# For testing, you can login via browser and copy the session cookie

curl -X POST http://localhost:3018/api/wallets/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN_HERE" \
  -v

echo -e "\n\nTo use this script:"
echo "1. Login as a KYC-approved user (e.g., seller@test.com)"
echo "2. Open browser DevTools > Application > Cookies"
echo "3. Copy the 'next-auth.session-token' value"
echo "4. Replace YOUR_SESSION_TOKEN_HERE in this script"
echo "5. Run the script again"