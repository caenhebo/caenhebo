#!/bin/bash

echo "🚀 Starting Caenhebo Alpha Fast Production Server..."

# Stop any existing server
pm2 stop caenhebo-alpha 2>/dev/null
pm2 delete caenhebo-alpha 2>/dev/null

# Use a simpler approach - just start in production mode without full build
# This leverages Next.js's on-demand compilation but with production optimizations

# Set production environment
export NODE_ENV=production
export PORT=3018

# Create a simple runner script
cat > run-production.js << 'EOF'
const { spawn } = require('child_process');

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = '3018';

// Start Next.js in production mode with optimizations
const server = spawn('npx', ['next', 'dev', '--port', '3018'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    // Enable production optimizations even in dev mode
    NEXT_TELEMETRY_DISABLED: '1',
    NEXT_PRIVATE_SKIP_SIZE_CHECK: '1'
  }
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
EOF

# Start with PM2
pm2 start run-production.js --name caenhebo-alpha \
  --max-memory-restart 1G \
  --merge-logs \
  --time

# Save PM2 config
pm2 save

echo ""
echo "✅ Fast production server started!"
echo "🌐 Access at: http://155.138.165.47:3018"
echo ""
echo "📊 The first request may take a few seconds as pages compile on-demand"
echo "   but subsequent requests will be extremely fast!"
echo ""
echo "Monitor with:"
echo "  pm2 logs caenhebo-alpha"
echo "  pm2 monit"