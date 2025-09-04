import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { createStrigaUser, initiateKYC } from '@/lib/striga'
import { z } from 'zod'

const kycDataSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string().min(1),
  dateOfBirth: z.string(),
  address: z.object({
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().length(2)
  })
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()
    console.log('[KYC Initiate] Received data:', JSON.stringify(body, null, 2))
    
    const kycData = kycDataSchema.parse(body)
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already has KYC initiated or passed
    if (user.kycStatus === 'PASSED') {
      return NextResponse.json(
        { error: 'KYC already completed' },
        { status: 400 }
      )
    }

    // Create Striga user if not exists
    let strigaUserId = user.strigaUserId
    
    if (!strigaUserId) {
      // Parse phone number - ONLY European countries supported by Striga
      const cleanPhone = kycData.phoneNumber.replace(/\s/g, '')
      
      // European country codes supported by Striga (sorted by length)
      const europeanCountryCodes = {
        '+351': 'PT', // Portugal
        '+34': 'ES',  // Spain  
        '+33': 'FR',  // France
        '+49': 'DE',  // Germany
        '+39': 'IT',  // Italy
        '+31': 'NL',  // Netherlands
        '+32': 'BE',  // Belgium
        '+43': 'AT',  // Austria
        '+45': 'DK',  // Denmark
        '+46': 'SE',  // Sweden
        '+47': 'NO',  // Norway
        '+48': 'PL',  // Poland
        '+30': 'GR',  // Greece
        '+353': 'IE', // Ireland
        '+352': 'LU', // Luxembourg
        '+354': 'IS', // Iceland
        '+356': 'MT', // Malta
        '+357': 'CY', // Cyprus
        '+358': 'FI', // Finland
        '+359': 'BG', // Bulgaria
        '+370': 'LT', // Lithuania
        '+371': 'LV', // Latvia
        '+372': 'EE', // Estonia
        '+385': 'HR', // Croatia
        '+386': 'SI', // Slovenia
        '+420': 'CZ', // Czech Republic
        '+421': 'SK', // Slovakia
        '+423': 'LI', // Liechtenstein
        '+36': 'HU',  // Hungary
        '+40': 'RO',  // Romania
      }
      
      let countryCode = ''
      let phoneNumber = ''
      
      // Find matching European country code
      for (const [code, country] of Object.entries(europeanCountryCodes)) {
        if (cleanPhone.startsWith(code)) {
          countryCode = code
          phoneNumber = cleanPhone.substring(code.length)
          break
        }
      }
      
      if (!countryCode || !phoneNumber || phoneNumber.length < 6) {
        console.error('[KYC Initiate] Invalid phone - must be European:', {
          original: kycData.phoneNumber,
          cleanPhone,
          countryCode,
          phoneNumber,
          phoneLength: phoneNumber ? phoneNumber.length : 0
        })
        throw new Error('Invalid phone number. Must be from a European country (e.g., +351 900000000). US, UK, and other non-EU countries are not supported.')
      }
      
      console.log('[KYC Initiate] Parsed phone:', {
        original: kycData.phoneNumber,
        cleanPhone,
        countryCode,
        phoneNumber,
        phoneLength: phoneNumber.length
      })
      
      // Validate phone number length
      if (phoneNumber.length < 6 || phoneNumber.length > 15) {
        throw new Error(`Invalid phone number length: ${phoneNumber.length} digits. Expected 6-15 digits.`)
      }
      
      // Create user in Striga
      const strigaUser = await createStrigaUser({
        firstName: kycData.firstName,
        lastName: kycData.lastName,
        email: kycData.email,
        mobile: {
          countryCode,
          number: phoneNumber
        },
        dateOfBirth: kycData.dateOfBirth,
        address: {
          addressLine1: kycData.address.addressLine1,
          addressLine2: kycData.address.addressLine2,
          city: kycData.address.city,
          postalCode: kycData.address.postalCode,
          country: kycData.address.country
        }
      })
      
      strigaUserId = strigaUser.userId
      
      // Update user with Striga ID and phone number
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          strigaUserId,
          phoneNumber: kycData.phoneNumber
        }
      })
      
      // Update or create profile with address
      await prisma.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          dateOfBirth: new Date(kycData.dateOfBirth),
          address: kycData.address.addressLine1,
          addressLine2: kycData.address.addressLine2,
          city: kycData.address.city,
          postalCode: kycData.address.postalCode,
          country: kycData.address.country
        },
        update: {
          dateOfBirth: new Date(kycData.dateOfBirth),
          address: kycData.address.addressLine1,
          addressLine2: kycData.address.addressLine2,
          city: kycData.address.city,
          postalCode: kycData.address.postalCode,
          country: kycData.address.country
        }
      })
    }

    // Don't initiate KYC yet - user needs to verify email/mobile first!
    // Just return the strigaUserId so the frontend can proceed to verification
    
    return NextResponse.json({
      success: true,
      strigaUserId,
      message: 'User created successfully. Please verify email and mobile.'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[KYC Initiate] Validation error:', error.errors)
      return NextResponse.json(
        { error: 'Invalid KYC data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('[KYC Initiate] Failed to initiate KYC:', error)
    
    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Failed to initiate KYC process'
    const errorDetails = error instanceof Error && 'response' in error ? (error as any).response : undefined
    
    console.error('[KYC Initiate] Error details:', {
      message: errorMessage,
      details: errorDetails,
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    )
  }
}