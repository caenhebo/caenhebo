#!/bin/bash

echo "Testing KYC Status with curl"
echo "============================"

# Get CSRF token
CSRF=$(curl -s http://localhost:3018/api/auth/csrf | jq -r '.csrfToken')
echo "CSRF Token obtained: ${CSRF:0:20}..."

# Login
echo -e "\nLogging in..."
curl -s -c cookies.txt \
  -X POST http://localhost:3018/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=$CSRF&email=buyer@test.com&password=C@rlos2025" \
  > /dev/null

# Call KYC status
echo -e "\nCalling KYC status endpoint..."
curl -s -b cookies.txt http://localhost:3018/api/kyc/status | jq '.'

# Check logs
echo -e "\n=== Recent Logs ==="
pm2 logs caenhebo-alpha --nostream --lines 100 | grep -A10 -B5 "KYC Status" | tail -50

rm cookies.txt