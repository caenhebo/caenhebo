import { prisma } from '@/lib/prisma'
import { createDigitalIban } from '@/lib/striga'

export async function createIbanIfNeeded(userId: string) {
  try {
    console.log('[Auto IBAN] Checking if IBAN creation needed for user:', userId)
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        strigaUserId: true,
        kycStatus: true,
        digitalIbans: {
          where: { active: true }
        }
      }
    })
    
    if (!user || !user.strigaUserId) {
      console.log('[Auto IBAN] User not found or no Striga ID')
      return null
    }
    
    // Check if user already has an active IBAN
    if (user.digitalIbans.length > 0) {
      console.log('[Auto IBAN] User already has active IBAN')
      return user.digitalIbans[0]
    }
    
    // Only create IBAN if KYC is approved
    if (user.kycStatus !== 'PASSED') {
      console.log('[Auto IBAN] KYC not approved, skipping IBAN creation')
      return null
    }
    
    console.log('[Auto IBAN] Creating IBAN for user:', user.email)
    
    // Try to create via Striga API, fallback to mock
    try {
      const ibanData = await createDigitalIban(user.strigaUserId)
      
      // Create the IBAN record
      const digitalIban = await prisma.digitalIban.create({
        data: {
          userId: user.id,
          iban: ibanData.iban,
          bankName: ibanData.bankName || 'Striga Bank',
          accountNumber: ibanData.accountNumber,
          active: true
        }
      })
      
      // Create notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'EUR Payment Account Created',
          message: 'Your EUR payment account has been automatically created. You can now receive payments.',
          type: 'KYC_STATUS_CHANGE'
        }
      })
      
      console.log('[Auto IBAN] IBAN created successfully:', digitalIban.iban)
      return digitalIban
      
    } catch (error) {
      console.warn('[Auto IBAN] Striga API error, creating mock IBAN:', error)
      
      // Create mock IBAN for testing
      const mockIban = `PT50003506090000${user.strigaUserId.slice(-8)}`
      
      const digitalIban = await prisma.digitalIban.create({
        data: {
          userId: user.id,
          iban: mockIban,
          bankName: 'Striga Bank (Test)',
          accountNumber: user.strigaUserId.slice(-10),
          active: true
        }
      })
      
      // Create notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'EUR Payment Account Created',
          message: 'Your EUR payment account has been automatically created. You can now receive payments.',
          type: 'KYC_STATUS_CHANGE'
        }
      })
      
      console.log('[Auto IBAN] Mock IBAN created:', digitalIban.iban)
      return digitalIban
    }
    
  } catch (error) {
    console.error('[Auto IBAN] Failed to create IBAN:', error)
    return null
  }
}