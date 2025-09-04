#!/bin/bash

# Test Critical Features Script for Caenhebo Alpha
# Run this BEFORE and AFTER any code changes

echo "🔍 Testing Critical Features for Caenhebo Alpha..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3004"

# Test 1: Check if server is running
echo -n "1. Server Health Check... "
if curl -s -o /dev/null -w "%{http_code}" $BASE_URL | grep -q "200\|302"; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "   Server is not responding. Start with: PORT=3004 pm2 start 'npm run dev' --name caenhebo-alpha"
    exit 1
fi

# Test 2: Authentication endpoint
echo -n "2. Authentication API... "
AUTH_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/callback/credentials \
    -H "Content-Type: application/json" \
    -d '{"email":"seller@example.com","password":"password123","redirect":false,"json":true}' \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$AUTH_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    # Extract session cookie if available
    SESSION_COOKIE=$(echo "$AUTH_RESPONSE" | grep -o 'next-auth.session-token=[^;]*' | head -1)
else
    echo -e "${RED}✗ FAILED (HTTP $HTTP_CODE)${NC}"
    echo "   Authentication endpoint not working properly"
fi

# Test 3: Session endpoint
echo -n "3. Session API... "
SESSION_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/auth/session)
if [ "$SESSION_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED (HTTP $SESSION_CODE)${NC}"
fi

# Test 4: KYC Status endpoint (most critical)
echo -n "4. KYC Status API... "
KYC_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/kyc/status)
if [ "$KYC_CODE" = "200" ] || [ "$KYC_CODE" = "401" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (Returns $KYC_CODE - endpoint exists)"
else
    echo -e "${RED}✗ FAILED (HTTP $KYC_CODE)${NC}"
    echo "   CRITICAL: KYC Status endpoint is broken!"
fi

# Test 5: Seller Dashboard
echo -n "5. Seller Dashboard... "
SELLER_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/seller/dashboard)
if [ "$SELLER_CODE" = "200" ] || [ "$SELLER_CODE" = "302" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED (HTTP $SELLER_CODE)${NC}"
fi

# Test 6: Buyer Dashboard
echo -n "6. Buyer Dashboard... "
BUYER_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/buyer/dashboard)
if [ "$BUYER_CODE" = "200" ] || [ "$BUYER_CODE" = "302" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED (HTTP $BUYER_CODE)${NC}"
fi

# Test 7: Property Listings API
echo -n "7. Property Listings API... "
PROPERTY_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/properties)
if [ "$PROPERTY_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED (HTTP $PROPERTY_CODE)${NC}"
fi

# Test 8: Wallet API endpoints
echo -n "8. Wallet APIs... "
WALLET_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/wallets)
if [ "$WALLET_CODE" = "200" ] || [ "$WALLET_CODE" = "401" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (endpoint exists)"
else
    echo -e "${RED}✗ FAILED (HTTP $WALLET_CODE)${NC}"
fi

echo "================================================"
echo "Test completed. If any tests failed, DO NOT proceed with changes!"
echo ""
echo "To use this script:"
echo "1. Before changes: ./test-critical-features.sh > before.txt"
echo "2. After changes:  ./test-critical-features.sh > after.txt"
echo "3. Compare:        diff before.txt after.txt"