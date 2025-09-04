import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')
  
  // Create admin user with correct password
  const adminPassword = await bcrypt.hash('C@rlos2025', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'f@pachoman.com' },
    update: { password: adminPassword }, // Update password if user exists
    create: {
      email: 'f@pachoman.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      kycStatus: 'PASSED',
      paymentPreference: 'HYBRID',
      phone: '+351000000000',
      dateOfBirth: new Date('1980-01-01'),
      addressLine1: 'Admin Street 1',
      city: 'Lisbon',
      postalCode: '1000-000',
      country: 'PT',
      profile: {
        create: {
          bio: 'Platform Administrator',
        }
      }
    },
  })
  console.log('✅ Admin user created/updated:', admin.email)

  // Create test buyer with C@rlos2025 password
  const testPassword = await bcrypt.hash('C@rlos2025', 10)
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@test.com' },
    update: { password: testPassword }, // Update password if user exists
    create: {
      email: 'buyer@test.com',
      password: testPassword,
      firstName: 'Test',
      lastName: 'Buyer',
      role: 'BUYER',
      kycStatus: 'PENDING',
      paymentPreference: 'FIAT',
      phone: '+351900000001',
      dateOfBirth: new Date('1990-01-01'),
      addressLine1: 'Buyer Street 1',
      city: 'Porto',
      postalCode: '4000-000',
      country: 'PT'
    },
  })
  console.log('✅ Buyer user created/updated:', buyer.email)

  // Create test seller with C@rlos2025 password
  const seller = await prisma.user.upsert({
    where: { email: 'seller@test.com' },
    update: { password: testPassword }, // Update password if user exists
    create: {
      email: 'seller@test.com',
      password: testPassword,
      firstName: 'Test',
      lastName: 'Seller',
      role: 'SELLER',
      kycStatus: 'PENDING',
      paymentPreference: 'FIAT',
      phone: '+351900000002',
      dateOfBirth: new Date('1985-01-01'),
      addressLine1: 'Seller Avenue 1',
      city: 'Faro',
      postalCode: '8000-000',
      country: 'PT'
    },
  })
  console.log('✅ Seller user created/updated:', seller.email)

  console.log('\n📋 Test Credentials:')
  console.log('--------------------------------')
  console.log('Admin: f@pachoman.com / C@rlos2025')
  console.log('Buyer: buyer@test.com / C@rlos2025')
  console.log('Seller: seller@test.com / C@rlos2025')
  console.log('--------------------------------')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })