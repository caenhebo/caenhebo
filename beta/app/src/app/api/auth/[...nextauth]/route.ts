import NextAuth from 'next-auth'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
// import { ensureAdminUser } from '@/lib/setup-admin'

// Admin user already exists in database
// ensureAdminUser()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            profile: true
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          kycStatus: user.kycStatus,
          kyc2Status: user.kyc2Status,
          mediationAgreementSigned: user.mediationAgreementSigned,
          strigaUserId: user.strigaUserId,
          paymentPreference: user.paymentPreference,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
        token.kycStatus = user.kycStatus
        token.kyc2Status = user.kyc2Status
        token.mediationAgreementSigned = user.mediationAgreementSigned
        token.strigaUserId = user.strigaUserId
        token.paymentPreference = user.paymentPreference
      }

      // Handle session updates (when we manually update the session)
      if (trigger === "update" && session) {
        token.kyc2Status = session.kyc2Status
        token.mediationAgreementSigned = session.mediationAgreementSigned
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.kycStatus = token.kycStatus as string
        session.user.kyc2Status = token.kyc2Status as string
        session.user.mediationAgreementSigned = token.mediationAgreementSigned as boolean
        session.user.strigaUserId = token.strigaUserId as string
        session.user.paymentPreference = token.paymentPreference as string
      }

      // Always fetch fresh data from database for critical statuses
      if (session.user?.id) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            kyc2Status: true,
            mediationAgreementSigned: true
          }
        })
        if (user) {
          session.user.kyc2Status = user.kyc2Status
          session.user.mediationAgreementSigned = user.mediationAgreementSigned
        }
      }

      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    signOut: 'http://95.179.170.56:3019/auth/signin',
    error: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }