#!/bin/bash

# Generate a token
TOKEN=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"username": "testuser"}' \
    http://localhost:3000/login | jq -r '.token')

# Test the secure endpoint
echo "Testing Secure Endpoint:"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/secure-endpoint

# Test /files endpoint
echo -e "\nTesting /files Endpoint:"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/files

# Test /db-files endpoint
echo -e "\nTesting /db-files Endpoint:"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/db-files
