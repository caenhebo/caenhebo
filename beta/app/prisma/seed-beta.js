const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with beta users...');

  // Hash the passwords
  const adminPassword = await bcrypt.hash('C@rlos2025', 10);
  const testPassword = await bcrypt.hash('C@rlos2025', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'f@pachoman.com' },
    update: {},
    create: {
      email: 'f@pachoman.com',
      password: adminPassword,
      firstName: 'Francisco',
      lastName: 'Pachoman',
      role: 'ADMIN',
      emailVerified: new Date(),
      phoneVerified: true,
      kycStatus: 'PASSED',
      paymentPreference: 'HYBRID',
    },
  });

  console.log('Created admin user:', admin.email);

  // Create seller user
  const seller = await prisma.user.upsert({
    where: { email: 'seller@test.com' },
    update: {},
    create: {
      email: 'seller@test.com',
      password: testPassword,
      firstName: 'Test',
      lastName: 'Seller',
      role: 'SELLER',
      emailVerified: new Date(),
      phoneVerified: false,
      kycStatus: 'PENDING',
      paymentPreference: 'CRYPTO',
      phone: '+351912345678',
    },
  });

  console.log('Created seller user:', seller.email);

  // Create buyer user
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@test.com' },
    update: {},
    create: {
      email: 'buyer@test.com',
      password: testPassword,
      firstName: 'Test',
      lastName: 'Buyer',
      role: 'BUYER',
      emailVerified: new Date(),
      phoneVerified: false,
      kycStatus: 'PENDING',
      paymentPreference: 'FIAT',
      phone: '+351912345679',
    },
  });

  console.log('Created buyer user:', buyer.email);

  // Create a test property for the seller
  const property = await prisma.property.create({
    data: {
      code: 'PROP001',
      title: 'Beautiful Villa in Lisbon',
      description: 'A stunning 4-bedroom villa with ocean views',
      address: 'Rua das Flores 123',
      city: 'Lisbon',
      state: 'Lisboa',
      postalCode: '1200-001',
      country: 'Portugal',
      price: 750000,
      area: 250,
      bedrooms: 4,
      bathrooms: 3,
      complianceStatus: 'APPROVED',
      sellerId: seller.id,
    },
  });

  console.log('Created test property:', property.code);

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });