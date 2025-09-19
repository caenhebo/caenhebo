const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndFixAdmin() {
  try {
    // Check admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'f@pachoman.com' }
    });

    if (!admin) {
      console.log('❌ Admin user not found!');
      return;
    }

    console.log('Current admin role:', admin.role);

    if (admin.role !== 'ADMIN') {
      console.log('🔧 Fixing admin role...');

      const updated = await prisma.user.update({
        where: { email: 'f@pachoman.com' },
        data: { role: 'ADMIN' }
      });

      console.log('✅ Admin role updated to:', updated.role);
    } else {
      console.log('✅ Admin role is already correct');
    }

    // Also list all users and their roles
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        firstName: true,
        lastName: true
      }
    });

    console.log('\n📋 All users in system:');
    allUsers.forEach(user => {
      console.log(`  - ${user.email}: ${user.role} (${user.firstName} ${user.lastName})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixAdmin();