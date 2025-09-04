import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUsers() {
  try {
    const password = 'C@rlos2025'
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create or update buyer
    const buyer = await prisma.user.upsert({
      where: { email: 'buyer@test.com' },
      update: { password: hashedPassword },
      create: {
        email: 'buyer@test.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Buyer',
        role: 'BUYER',
        paymentPreference: 'FIAT'
      }
    })
    console.log('Created/Updated buyer:', buyer.email)
    
    // Create or update seller
    const seller = await prisma.user.upsert({
      where: { email: 'seller@test.com' },
      update: { password: hashedPassword },
      create: {
        email: 'seller@test.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Seller',
        role: 'SELLER',
        paymentPreference: 'FIAT'
      }
    })
    console.log('Created/Updated seller:', seller.email)
    
    // Keep admin password as is
    const admin = await prisma.user.findUnique({
      where: { email: 'f@pachoman.com' }
    })
    
    if (admin) {
      console.log('Admin exists:', admin.email)
    }
    
    console.log('\nTest users ready:')
    console.log('Buyer: buyer@test.com / C@rlos2025')
    console.log('Seller: seller@test.com / C@rlos2025')
    console.log('Admin: f@pachoman.com / admin123')
    
  } catch (error) {
    console.error('Error creating test users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUsers()