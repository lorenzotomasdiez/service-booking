#!/bin/bash

# Day 5 Advanced Features API Testing Script
# Tests the core functionality of referrals, promotions, and analytics

BASE_URL="http://localhost:3000"
AUTH_HEADER="Authorization: Bearer test-token"

echo "🚀 Testing Day 5 Advanced Features Endpoints"
echo "============================================="

# Test Health Check
echo "1. Testing Health Check..."
curl -s -X GET $BASE_URL/api/health | grep -q "OK" && echo "✅ Health Check PASSED" || echo "❌ Health Check FAILED"

# Test Referral System (Public endpoint)
echo -e "\n2. Testing Referral Validation (Public)..."
curl -s -X GET $BASE_URL/api/referrals/validate/TEST123 | grep -q "valid" && echo "✅ Referral Validation Endpoint AVAILABLE" || echo "❌ Referral Validation Endpoint NOT FOUND"

# Test Active Promotions (Public endpoint)
echo -e "\n3. Testing Active Promotions (Public)..."
curl -s -X GET $BASE_URL/api/promotions/active | grep -q "data" && echo "✅ Active Promotions Endpoint AVAILABLE" || echo "❌ Active Promotions Endpoint NOT FOUND"

# Test Provider Analytics (Protected - will fail auth but should show endpoint exists)
echo -e "\n4. Testing Provider Analytics (Protected)..."
curl -s -X GET $BASE_URL/api/provider/analytics | grep -q "Unauthorized\|Token" && echo "✅ Provider Analytics Endpoint AVAILABLE (Auth Required)" || echo "❌ Provider Analytics Endpoint NOT FOUND"

# Test Swagger Documentation Update
echo -e "\n5. Testing Swagger Documentation..."
curl -s -X GET $BASE_URL/docs/json | grep -q "Referrals\|Promotions\|Provider Analytics" && echo "✅ Swagger Documentation UPDATED with new endpoints" || echo "❌ Swagger Documentation NOT UPDATED"

# Test Database Connection for New Models
echo -e "\n6. Database Schema Validation..."
# This would require database connection - showing conceptual test
echo "⚠️  Database schema validation requires direct DB connection"
echo "   New tables: referral_codes, referrals, promotions, loyalty_points, etc."

echo -e "\n🏁 Day 5 API Testing Complete!"
echo "============================================="
echo "Next Steps:"
echo "1. Verify endpoints return proper JSON responses"
echo "2. Test authenticated endpoints with valid JWT tokens"  
echo "3. Validate database operations with real data"
echo "4. Run performance tests for <200ms response time validation"