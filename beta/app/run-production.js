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
