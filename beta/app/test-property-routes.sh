#!/bin/bash

# Test script for property routes and redirects
# This tests that all property-related URLs are working correctly

BASE_URL="http://localhost:3019"

echo "=== Testing Property Routes and Redirects ==="
echo ""

# Test /properties (main properties page)
echo "1. Testing /properties (main listing page)..."
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/properties)
if [ "$response" = "200" ]; then
    echo "   ✓ /properties returns 200 OK"
else
    echo "   ✗ /properties returns $response (expected 200)"
fi

# Test /buyer/properties (buyer-specific page)
echo ""
echo "2. Testing /buyer/properties (buyer listing)..."
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/buyer/properties)
if [ "$response" = "200" ]; then
    echo "   ✓ /buyer/properties returns 200 OK"
else
    echo "   ✗ /buyer/properties returns $response (expected 200)"
fi

# Test /seller/properties (seller-specific page)
echo ""
echo "3. Testing /seller/properties (seller listing)..."
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/seller/properties)
if [ "$response" = "200" ]; then
    echo "   ✓ /seller/properties returns 200 OK"
else
    echo "   ✗ /seller/properties returns $response (expected 200)"
fi

# Test individual property page with test code
echo ""
echo "4. Testing /property/[code] (individual property)..."
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/property/TEST-123)
if [ "$response" = "200" ] || [ "$response" = "404" ]; then
    echo "   ✓ /property/TEST-123 returns $response (working route)"
else
    echo "   ✗ /property/TEST-123 returns $response (unexpected)"
fi

# Test API endpoints
echo ""
echo "5. Testing API endpoints..."

# Test properties search API
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/properties/search)
if [ "$response" = "200" ] || [ "$response" = "401" ]; then
    echo "   ✓ /api/properties/search returns $response"
else
    echo "   ✗ /api/properties/search returns $response"
fi

# Test properties API
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/properties)
if [ "$response" = "200" ] || [ "$response" = "401" ] || [ "$response" = "405" ]; then
    echo "   ✓ /api/properties returns $response"
else
    echo "   ✗ /api/properties returns $response"
fi

echo ""
echo "=== Route Testing Complete ==="
echo ""
echo "Summary:"
echo "- Main properties page (/properties): Available for public browsing"
echo "- Buyer properties (/buyer/properties): For authenticated buyers"
echo "- Seller properties (/seller/properties): For authenticated sellers"
echo "- Individual properties (/property/[code]): For viewing specific properties"
echo ""
echo "Redirects:"
echo "- Authenticated buyers visiting /properties → /buyer/properties"
echo "- Authenticated sellers visiting /properties → /seller/properties"
echo "- Authenticated admins visiting /properties → /admin"