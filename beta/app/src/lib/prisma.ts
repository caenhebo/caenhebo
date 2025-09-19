import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  })
}

const globalPrisma = global.prisma || prismaClientSingleton()

export const prisma = globalPrisma

// Always assign to global to ensure singleton
global.prisma = globalPrisma

// Ensure the client connects on first import
prisma.$connect().catch((e) => {
  console.error('Failed to connect Prisma Client:', e)
  process.exit(1)
})