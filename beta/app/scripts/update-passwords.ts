import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function updatePasswords() {
  try {
    const newPassword = 'C@arlos2025'
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // Update buyer password
    const buyer = await prisma.user.update({
      where: { email: 'buyer@test.com' },
      data: { password: hashedPassword }
    })
    console.log('Updated buyer password:', buyer.email)
    
    // Update seller password
    const seller = await prisma.user.update({
      where: { email: 'seller@test.com' },
      data: { password: hashedPassword }
    })
    console.log('Updated seller password:', seller.email)
    
    console.log('Passwords updated successfully to: C@arlos2025')
  } catch (error) {
    console.error('Error updating passwords:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updatePasswords()