#!/bin/bash

echo "Testing KYC Sync for buyer@test.com"
echo "====================================="

# 1. Get CSRF token
echo -e "\n1. Getting CSRF token..."
CSRF_RESPONSE=$(curl -s http://localhost:3018/api/auth/csrf)
CSRF_TOKEN=$(echo $CSRF_RESPONSE | jq -r '.csrfToken')
echo "CSRF Token: ${CSRF_TOKEN:0:20}..."

# 2. Login
echo -e "\n2. Logging in as buyer@test.com..."
LOGIN_RESPONSE=$(curl -s -c cookies.txt \
  -X POST http://localhost:3018/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=$CSRF_TOKEN&email=buyer@test.com&password=C@rlos2025")

echo "Login response: $LOGIN_RESPONSE"

# Try alternate password if first fails
if [[ $LOGIN_RESPONSE == *"error"* ]]; then
  echo -e "\nTrying alternate password..."
  LOGIN_RESPONSE=$(curl -s -c cookies.txt \
    -X POST http://localhost:3018/api/auth/callback/credentials \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "csrfToken=$CSRF_TOKEN&email=buyer@test.com&password=password123")
  echo "Login response: $LOGIN_RESPONSE"
fi

# 3. Get session
echo -e "\n3. Checking session..."
SESSION_RESPONSE=$(curl -s -b cookies.txt http://localhost:3018/api/auth/session)
echo "Session: $SESSION_RESPONSE" | jq '.'

# 4. Call KYC status
echo -e "\n4. Calling KYC status endpoint..."
KYC_RESPONSE=$(curl -s -b cookies.txt http://localhost:3018/api/kyc/status)
echo "KYC Status Response:"
echo "$KYC_RESPONSE" | jq '.'

# Cleanup
rm -f cookies.txt