#!/bin/bash

echo "🏃 Testing Caenhebo Alpha Performance..."
echo "========================================="

# Test homepage
echo -n "Homepage load time: "
curl -s -o /dev/null -w "%{time_total}s\n" http://localhost:3018

# Test again (should be cached)
echo -n "Homepage (cached): "
curl -s -o /dev/null -w "%{time_total}s\n" http://localhost:3018

# Test auth endpoint
echo -n "Auth endpoint: "
curl -s -o /dev/null -w "%{time_total}s\n" http://localhost:3018/api/auth/session

# Test static asset
echo -n "Static asset: "
curl -s -o /dev/null -w "%{time_total}s\n" http://localhost:3018/_next/static/css/app/layout.css

echo ""
echo "✅ Performance test complete!"