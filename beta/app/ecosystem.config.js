module.exports = {
  apps: [{
    name: 'caenhebo-beta',
    script: 'npm',
    args: 'start',
    
    // Single instance (Next.js doesn't support cluster mode)
    instances: 1,
    exec_mode: 'fork',
    
    // Memory management
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3019,
      NODE_OPTIONS: '--max-old-space-size=1024',
    },
    
    // Restart policies
    min_uptime: '10s',
    max_restarts: 10,
    autorestart: true,
    watch: false,
    
    // Logging
    error_file: '/root/.pm2/logs/caenhebo-beta-error.log',
    out_file: '/root/.pm2/logs/caenhebo-beta-out.log',
    log_file: '/root/.pm2/logs/caenhebo-beta-combined.log',
    time: true,
    merge_logs: true,
    
    // Graceful reload
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000,
    
    // Production environment
    env_production: {
      NODE_ENV: 'production',
      PORT: 3019,
      NODE_OPTIONS: '--max-old-space-size=1024',
    }
  }]
};