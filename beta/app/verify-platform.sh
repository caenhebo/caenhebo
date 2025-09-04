#!/bin/bash

echo "🔍 Caenhebo Platform Verification"
echo "================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3018"
EXTERNAL_URL="http://155.138.165.47:3018"

echo -e "\n📊 Service Status:"
echo "------------------"
pm2_status=$(pm2 list | grep caenhebo-alpha | grep online)
if [[ -n "$pm2_status" ]]; then
    echo -e "${GREEN}✅ PM2 Service: Running${NC}"
else
    echo -e "${RED}❌ PM2 Service: Not running${NC}"
fi

echo -e "\n🌐 Endpoint Health Check:"
echo "-------------------------"

# Function to test endpoint
test_endpoint() {
    local url=$1
    local name=$2
    local expected_code=$3
    
    code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$code" = "$expected_code" ]; then
        echo -e "${GREEN}✅ $name: $code${NC}"
    else
        echo -e "${RED}❌ $name: $code (expected $expected_code)${NC}"
    fi
}

# Test internal endpoints
echo -e "\nInternal Endpoints (localhost):"
test_endpoint "$BASE_URL/" "Homepage" "200"
test_endpoint "$BASE_URL/auth/signin" "Sign In Page" "200"
test_endpoint "$BASE_URL/auth/register" "Register Page" "200"
test_endpoint "$BASE_URL/api/auth/session" "Session API" "200"
test_endpoint "$BASE_URL/seller/dashboard" "Seller Dashboard" "200"
test_endpoint "$BASE_URL/buyer/dashboard" "Buyer Dashboard" "200"

echo -e "\nExternal Access:"
test_endpoint "$EXTERNAL_URL/auth/signin" "External Access" "200"

echo -e "\n📁 Database Status:"
echo "-------------------"
if [ -f "prisma/dev.db" ]; then
    echo -e "${GREEN}✅ Database file exists${NC}"
    
    # Count users
    user_count=$(sqlite3 prisma/dev.db "SELECT COUNT(*) FROM users;" 2>/dev/null)
    admin_count=$(sqlite3 prisma/dev.db "SELECT COUNT(*) FROM users WHERE role='ADMIN';" 2>/dev/null)
    seller_count=$(sqlite3 prisma/dev.db "SELECT COUNT(*) FROM users WHERE role='SELLER';" 2>/dev/null)
    buyer_count=$(sqlite3 prisma/dev.db "SELECT COUNT(*) FROM users WHERE role='BUYER';" 2>/dev/null)
    
    echo "   Total users: $user_count"
    echo "   Admins: $admin_count"
    echo "   Sellers: $seller_count"
    echo "   Buyers: $buyer_count"
else
    echo -e "${RED}❌ Database file not found${NC}"
fi

echo -e "\n👤 Test Users:"
echo "--------------"
echo "Admin:  f@pachoman.com / C@rlos2025"
echo "Seller: seller@test.com / password123"
echo "Buyer:  buyer@test.com / password123"

echo -e "\n🔧 Key Features Status:"
echo "-----------------------"

# Check if optimized dashboard exists
if [ -f "src/app/seller/dashboard/page.tsx" ]; then
    if grep -q "fetchDashboardData" src/app/seller/dashboard/page.tsx; then
        echo -e "${GREEN}✅ Optimized Dashboard: Active${NC}"
    else
        echo -e "${YELLOW}⚠️  Dashboard: Using old version${NC}"
    fi
fi

# Check if user management exists
if [ -f "src/components/admin/user-management.tsx" ]; then
    echo -e "${GREEN}✅ User Management: Available${NC}"
else
    echo -e "${RED}❌ User Management: Missing${NC}"
fi

# Check if API endpoints exist
if [ -f "src/app/api/seller/dashboard-data/route.ts" ]; then
    echo -e "${GREEN}✅ Dashboard API: Available${NC}"
else
    echo -e "${YELLOW}⚠️  Dashboard API: Missing${NC}"
fi

echo -e "\n📱 Access URLs:"
echo "----------------"
echo "Local:    http://localhost:3018"
echo "External: http://155.138.165.47:3018"

echo -e "\n✨ Recent Changes:"
echo "------------------"
echo "• Fixed property approval stages display"
echo "• Optimized dashboard performance (single API call)"
echo "• Added comprehensive user management"
echo "• Fixed interview status tracking"

echo -e "\n================================="
echo "Verification Complete!"