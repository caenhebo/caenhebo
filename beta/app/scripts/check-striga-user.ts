import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

import { strigaApiRequest } from '../src/lib/striga'

// Simple script to check if a user exists in Striga by email
async function checkStrigaUser(email: string) {
  console.log(`🔍 Checking Striga for user: ${email}`)
  
  try {
    // According to Striga docs, to get a user we need their userId
    // But let's try to list all users and filter
    console.log('Fetching all users from Striga...')
    
    // Get all users (this might need pagination for large datasets)
    const response = await strigaApiRequest<{
      data: any[],
      total: number,
      count: number
    }>('/users', {
      method: 'GET'
    })
    
    console.log(`Total users in Striga: ${response.total}`)
    
    // Find user by email
    const user = response.data.find(u => u.email === email)
    
    if (user) {
      console.log('\n✅ User found in Striga:')
      console.log(`   User ID: ${user.userId}`)
      console.log(`   Name: ${user.firstName} ${user.lastName}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Email Verified: ${user.emailVerified}`)
      console.log(`   Mobile Verified: ${user.mobileVerified}`)
      console.log(`   KYC Status: ${user.KYC?.status || 'NOT_STARTED'}`)
      console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`)
      
      if (user.wallets && user.wallets.length > 0) {
        console.log(`   Wallets: ${user.wallets.length}`)
      }
      
      return user
    } else {
      console.log('❌ User not found in Striga')
      return null
    }
    
  } catch (error: any) {
    console.error('Error checking Striga:', error.message)
    if (error.details) {
      console.error('Details:', error.details)
    }
    return null
  }
}

// Check specific users
async function main() {
  console.log('Environment check:')
  console.log('API Key:', process.env.STRIGA_API_KEY ? '✓ Set' : '✗ Missing')
  console.log('API Secret:', process.env.STRIGA_API_SECRET ? '✓ Set' : '✗ Missing')
  console.log('Base URL:', process.env.STRIGA_BASE_URL || 'Missing')
  
  // Debug the config
  console.log('\nDebug - Looking for secret in:')
  console.log('STRIGA_API_SECRET:', process.env.STRIGA_API_SECRET ? 'Found' : 'Not found')
  console.log('STRIGA_SECRET:', process.env.STRIGA_SECRET ? 'Found' : 'Not found')
  console.log('-'.repeat(50))
  
  const emailsToCheck = [
    'seller@test.com',
    'buyer@test.com',
    'seller@example.com',
    'buyer@example.com'
  ]
  
  for (const email of emailsToCheck) {
    await checkStrigaUser(email)
    console.log('-'.repeat(50))
  }
}

main().catch(console.error)