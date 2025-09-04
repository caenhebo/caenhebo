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
