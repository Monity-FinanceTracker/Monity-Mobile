#!/bin/bash

# Test script for new mobile features
# This script tests the backend API endpoints for the new features

echo "🧪 Testing Mobile Features Implementation"
echo "=========================================="
echo ""

API_URL="${API_URL:-http://localhost:3001/api/v1}"
TOKEN="${AUTH_TOKEN:-}"

if [ -z "$TOKEN" ]; then
    echo "⚠️  Warning: AUTH_TOKEN not set. Some tests may fail."
    echo "   Set AUTH_TOKEN environment variable with a valid auth token"
    echo ""
fi

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            "$API_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓${NC} (HTTP $http_code)"
        return 0
    elif [ "$http_code" -eq 401 ]; then
        echo -e "${YELLOW}⚠${NC} (HTTP $http_code - Auth required)"
        return 1
    else
        echo -e "${RED}✗${NC} (HTTP $http_code)"
        echo "   Response: $body"
        return 1
    fi
}

echo "📋 Testing Referral Program Endpoints"
echo "--------------------------------------"
test_endpoint "GET" "/referrals/my-code" "" "Get referral code"
test_endpoint "GET" "/referrals/stats" "" "Get referral stats"
test_endpoint "GET" "/referrals/list" "" "List referrals"
test_endpoint "GET" "/referrals/leaderboard" "" "Get leaderboard"
test_endpoint "POST" "/referrals/validate-code" '{"referralCode":"TEST123"}' "Validate referral code"
echo ""

echo "📋 Testing Onboarding Wizard Endpoints"
echo "--------------------------------------"
test_endpoint "GET" "/onboarding/progress" "" "Get onboarding progress"
test_endpoint "POST" "/onboarding/start" "" "Start onboarding"
test_endpoint "POST" "/onboarding/complete-step" '{"step":1,"data":{"goal":"save_money"}}' "Complete step"
test_endpoint "POST" "/onboarding/complete" "" "Complete onboarding"
test_endpoint "POST" "/onboarding/skip" "" "Skip onboarding"
echo ""

echo "📋 Testing Cash Flow Calendar Endpoints"
echo "--------------------------------------"
test_endpoint "GET" "/cash-flow/scheduled-transactions" "" "Get scheduled transactions"
test_endpoint "POST" "/cash-flow/scheduled-transactions" '{"description":"Test","amount":100,"category":"Food","typeId":1,"scheduled_date":"2025-12-31","recurrence_pattern":"once"}' "Create scheduled transaction"
test_endpoint "GET" "/cash-flow/calendar-data?start_date=2025-01-01&end_date=2025-01-31" "" "Get calendar data"
echo ""

echo "📋 Testing Groups Endpoints"
echo "--------------------------------------"
test_endpoint "GET" "/groups" "" "Get groups"
test_endpoint "POST" "/groups" '{"name":"Test Group"}' "Create group"
echo ""

echo "📋 Testing Enhanced Savings Goals"
echo "--------------------------------------"
test_endpoint "GET" "/savings-goals" "" "Get savings goals"
echo ""

echo ""
echo "✅ Testing complete!"
echo ""
echo "Note: Some endpoints may require authentication (401) if AUTH_TOKEN is not set."
echo "To test with authentication, set AUTH_TOKEN environment variable:"
echo "  export AUTH_TOKEN='your-token-here'"
echo "  ./test-features.sh"


