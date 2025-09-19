const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function testConnection() {
  try {
    console.log('Testing Prisma connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    // Test connection
    await prisma.$connect();
    console.log('Connected to database');
    
    // Test query
    const userCount = await prisma.user.count();
    console.log('Found ' + userCount + ' users in database');
    
    // Test specific user
    const admin = await prisma.user.findUnique({
      where: { email: 'f@pachoman.com' }
    });
    console.log('Admin user exists: ' + (admin ? 'Yes' : 'No'));
    
    await prisma.$disconnect();
    console.log('Disconnected cleanly');
  } catch (error) {
    console.error('Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
