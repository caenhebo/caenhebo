const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ['buyer@test.com', 'seller@test.com']
      }
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true
    }
  });
  
  console.log('Test users:', users);
  
  if (users.length === 0) {
    console.log('No test users found! They were likely deleted.');
  }
}

checkUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());