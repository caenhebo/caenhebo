import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      kycStatus: string
      kyc2Status: string
      mediationAgreementSigned: boolean
      strigaUserId?: string
      paymentPreference?: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    kycStatus: string
    kyc2Status: string
    mediationAgreementSigned: boolean
    strigaUserId?: string
    paymentPreference?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    kycStatus: string
    kyc2Status: string
    mediationAgreementSigned: boolean
    strigaUserId?: string
    paymentPreference?: string
  }
}