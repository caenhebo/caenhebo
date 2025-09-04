import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export async function ensureAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'f@pachoman.com' }
    })

    if (!existingAdmin) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('C@rlos2025', 10)
      
      const admin = await prisma.user.create({
        data: {
          email: 'f@pachoman.com',
          password: hashedPassword,
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

      console.log('Admin user created:', admin.email)
      return admin
    }

    return existingAdmin
  } catch (error) {
    console.error('Failed to ensure admin user:', error)
    // Don't throw - allow app to continue
    return null
  }
}