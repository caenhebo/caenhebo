#!/bin/bash

echo "🚀 Optimizing Caenhebo Alpha for Production..."

# Stop current process
echo "Stopping current server..."
pm2 stop caenhebo-alpha 2>/dev/null

# Create production environment file
cat > .env.production.local << EOF
NODE_ENV=production
PORT=3018
NEXTAUTH_URL=http://155.138.165.47:3018
EOF

# Copy other env vars from existing .env
if [ -f .env ]; then
    grep -E "(NEXTAUTH_SECRET|DATABASE_URL|STRIGA_|SUMSUB_)" .env >> .env.production.local
fi

# Install production dependencies only
echo "Installing production dependencies..."
NODE_ENV=production npm ci --only=production

# Build for production (simplified)
echo "Building production version..."
NODE_ENV=production npm run build

# Create PM2 production config
cat > ecosystem.production.js << 'EOF'
module.exports = {
  apps: [{
    name: 'caenhebo-alpha',
    script: 'npm',
    args: 'start',
    cwd: '/root/coding/claudecode/projects/caenhebo-alpha/app',
    env: {
      NODE_ENV: 'production',
      PORT: 3018
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1G',
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    merge_logs: true,
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start production server with PM2
echo "Starting production server..."
pm2 delete caenhebo-alpha 2>/dev/null
NODE_ENV=production pm2 start ecosystem.production.js

# Save PM2 configuration
pm2 save

echo "✅ Production optimization complete!"
echo "🌐 Access the application at: http://155.138.165.47:3018"
echo ""
echo "📊 Monitor performance with:"
echo "  pm2 monit"
echo "  pm2 logs caenhebo-alpha"