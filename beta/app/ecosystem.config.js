module.exports = {
  apps: [{
    name: 'caenhebo-beta',
    script: 'npm',
    args: 'run start',
    cwd: '/root/Caenhebo/beta/app',
    env: {
      PORT: '3019',
      NODE_ENV: 'production',
      EMAIL_FROM: 'supportfrompage@caenhebo.com',
      SMTP_HOST: 'mail.caenhebo.com',
      SMTP_PORT: '465',
      SMTP_USER: 'supportfrompage@caenhebo.com',
      SMTP_PASSWORD: 'C]*lS&z}8U@J'
    }
  }]
}
