#!/bin/bash

# GST Module API Test Script
# This script tests the GST API endpoints

BASE_URL="http://localhost:8080"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "GST Module API Test Script"
echo "========================================="
echo ""

# Function to print test results
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ $2${NC}"
  else
    echo -e "${RED}✗ $2${NC}"
  fi
}

# Test 1: Login as admin
echo -e "${YELLOW}Test 1: Admin Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@1234"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
  print_result 0 "Admin login successful"
  echo "Token: ${TOKEN:0:20}..."
else
  print_result 1 "Admin login failed"
  exit 1
fi
echo ""

# Test 2: Create GST Client
echo -e "${YELLOW}Test 2: Create GST Client${NC}"
CLIENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/gst/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Test Company Ltd",
    "gstin": "27AABCU9603R1ZX",
    "businessName": "Test Business",
    "filingFrequency": "monthly",
    "financialYearStart": "2024-04-01",
    "panNumber": "AABCU9603R",
    "address": "123 Test Street",
    "state": "Maharashtra",
    "contactPerson": "John Doe",
    "contactEmail": "john@test.com",
    "contactPhone": "9876543210"
  }')

CLIENT_ID=$(echo $CLIENT_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$CLIENT_ID" ]; then
  print_result 0 "GST client created successfully"
  echo "Client ID: $CLIENT_ID"
else
  print_result 1 "Failed to create GST client"
  echo "Response: $CLIENT_RESPONSE"
fi
echo ""

# Test 3: Get GST Clients
echo -e "${YELLOW}Test 3: Get GST Clients${NC}"
CLIENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/gst/clients" \
  -H "Authorization: Bearer $TOKEN")

CLIENT_COUNT=$(echo $CLIENTS_RESPONSE | grep -o '"id"' | wc -l)

if [ $CLIENT_COUNT -gt 0 ]; then
  print_result 0 "Retrieved $CLIENT_COUNT GST client(s)"
else
  print_result 1 "Failed to retrieve GST clients"
fi
echo ""

# Test 4: Create Purchase Invoice
echo -e "${YELLOW}Test 4: Create Purchase Invoice${NC}"
PURCHASE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/gst/purchases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"$CLIENT_ID\",
    \"invoiceNumber\": \"PI-001\",
    \"vendorName\": \"Vendor ABC\",
    \"vendorGSTIN\": \"27AABCU9603R1ZY\",
    \"invoiceDate\": \"2024-02-10\",
    \"taxableAmount\": 10000,
    \"cgst\": 900,
    \"sgst\": 900,
    \"igst\": 0,
    \"month\": \"2024-02\",
    \"financialYear\": \"2024-25\"
  }")

PURCHASE_ID=$(echo $PURCHASE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$PURCHASE_ID" ]; then
  print_result 0 "Purchase invoice created successfully"
  echo "Purchase ID: $PURCHASE_ID"
else
  print_result 1 "Failed to create purchase invoice"
  echo "Response: $PURCHASE_RESPONSE"
fi
echo ""

# Test 5: Create Sales Invoice
echo -e "${YELLOW}Test 5: Create Sales Invoice${NC}"
SALES_RESPONSE=$(curl -s -X POST "$BASE_URL/api/gst/sales" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"$CLIENT_ID\",
    \"invoiceNumber\": \"SI-001\",
    \"customerName\": \"Customer XYZ\",
    \"customerGSTIN\": \"27AABCU9603R1ZZ\",
    \"invoiceDate\": \"2024-02-12\",
    \"taxableAmount\": 20000,
    \"cgst\": 1800,
    \"sgst\": 1800,
    \"igst\": 0,
    \"month\": \"2024-02\",
    \"financialYear\": \"2024-25\"
  }")

SALES_ID=$(echo $SALES_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$SALES_ID" ]; then
  print_result 0 "Sales invoice created successfully"
  echo "Sales ID: $SALES_ID"
else
  print_result 1 "Failed to create sales invoice"
  echo "Response: $SALES_RESPONSE"
fi
echo ""

# Test 6: Get Monthly Summary
echo -e "${YELLOW}Test 6: Get Monthly Summary${NC}"
SUMMARY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/gst/summary/$CLIENT_ID/2024-02" \
  -H "Authorization: Bearer $TOKEN")

TOTAL_PURCHASES=$(echo $SUMMARY_RESPONSE | grep -o '"totalPurchases":[0-9]*' | cut -d':' -f2)
TOTAL_SALES=$(echo $SUMMARY_RESPONSE | grep -o '"totalSales":[0-9]*' | cut -d':' -f2)

if [ ! -z "$TOTAL_PURCHASES" ] && [ ! -z "$TOTAL_SALES" ]; then
  print_result 0 "Monthly summary retrieved successfully"
  echo "Total Purchases: ₹$TOTAL_PURCHASES"
  echo "Total Sales: ₹$TOTAL_SALES"
else
  print_result 1 "Failed to retrieve monthly summary"
fi
echo ""

# Test 7: Update Filing Status
echo -e "${YELLOW}Test 7: Update Filing Status${NC}"
FILING_RESPONSE=$(curl -s -X POST "$BASE_URL/api/gst/filings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"$CLIENT_ID\",
    \"month\": \"2024-02\",
    \"financialYear\": \"2024-25\",
    \"gstr1Filed\": true,
    \"gstr1FiledDate\": \"2024-02-20\",
    \"gstr1ARN\": \"AA270220240001\",
    \"gstr3bFiled\": true,
    \"gstr3bFiledDate\": \"2024-02-22\",
    \"gstr3bARN\": \"AA270220240002\",
    \"taxPaid\": 2000,
    \"lateFee\": 0,
    \"interest\": 0,
    \"filingStatus\": \"filed\"
  }")

FILING_SUCCESS=$(echo $FILING_RESPONSE | grep -o '"success":true')

if [ ! -z "$FILING_SUCCESS" ]; then
  print_result 0 "Filing status updated successfully"
else
  print_result 1 "Failed to update filing status"
  echo "Response: $FILING_RESPONSE"
fi
echo ""

echo "========================================="
echo "Test Summary"
echo "========================================="
echo "All core GST API endpoints tested"
echo "Verify the UI at: $BASE_URL/admin/gst"
echo ""
echo "Cleanup: Consider removing test data after verification"
