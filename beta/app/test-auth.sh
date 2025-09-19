#!/bin/bash

echo "Getting CSRF token..."
CSRF_RESPONSE=$(curl -s -c /tmp/auth-cookies.txt http://localhost:3019/api/auth/csrf)
CSRF=$(echo $CSRF_RESPONSE | jq -r .csrfToken)
echo "CSRF Token: ${CSRF:0:20}..."

echo -e "\nTesting admin login..."
LOGIN_RESPONSE=$(curl -X POST http://localhost:3019/api/auth/callback/credentials \
  -b /tmp/auth-cookies.txt \
  -c /tmp/auth-cookies.txt \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=f@pachoman.com&password=C@rlos2025&csrfToken=$CSRF" \
  -s -o /dev/null -w "%{http_code}")
echo "Login response: $LOGIN_RESPONSE"

echo -e "\nChecking session..."
SESSION=$(curl -s http://localhost:3019/api/auth/session -b /tmp/auth-cookies.txt)
echo "Session: $SESSION" | jq .user.email

rm -f /tmp/auth-cookies.txt
