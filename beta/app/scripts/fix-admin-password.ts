import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function fixAdminPassword() {
  const correctPassword = 'C@rlos2025'
  const hashedPassword = await bcrypt.hash(correctPassword, 10)
  
  await prisma.user.update({
    where: { email: 'f@pachoman.com' },
    data: { password: hashedPassword }
  })
  
  console.log('✅ Admin password updated successfully!')
  console.log('Email: f@pachoman.com')
  console.log('Password: C@rlos2025')
}

fixAdminPassword().catch(console.error).finally(() => prisma.$disconnect())