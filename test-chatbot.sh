#!/bin/bash

# Test script for the AI Chatbot API
# Usage: ./test-chatbot.sh

BASE_URL="http://localhost:3000"

echo "=== Customer Registration Chatbot Test ==="
echo ""

# Test 1: Health check
echo "1. Health Check:"
curl -s "$BASE_URL/health" | jq
echo ""
echo ""

# Test 2: Simple greeting
echo "2. Simple Greeting:"
curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello! What can you help me with?"
  }' | jq
echo ""
echo ""

# Test 3: Register a customer (all info at once)
echo "3. Register Customer (all info at once):"
curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to register a new customer: John Doe, email john.doe@example.com, phone +1-555-0123"
  }' | jq
echo ""
echo ""

# Test 4: Register with optional fields
echo "4. Register Customer with Address:"
curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Register Jane Smith, jane@example.com, phone 555-9999, city New York, state NY, zipcode 10001"
  }' | jq
echo ""
echo ""

# Test 5: Multi-turn conversation start
echo "5. Multi-turn Conversation - Start:"
curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need to add a new customer to the system"
  }' | jq
echo ""
echo ""

# Test 6: Reset conversation
echo "6. Reset Conversation:"
curl -s -X POST "$BASE_URL/api/chat/reset" | jq
echo ""
echo ""

echo "=== Tests Complete ==="
