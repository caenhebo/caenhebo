const { PrismaClient } = require('@prisma/client')

async function testWalletSession() {
  console.log('🔍 Testing wallet session and database setup...')
  
  const prisma = new PrismaClient()
  
  try {
    // 1. Check if users exist
    console.log('1. 📊 Checking users in database...')
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        kycStatus: true,
        strigaUserId: true,
        firstName: true,
        lastName: true
      }
    })
    
    console.log(`Found ${users.length} users:`)
    users.forEach(user => {
      console.log(`  📧 ${user.email} (${user.role}) - KYC: ${user.kycStatus} - Striga: ${user.strigaUserId ? 'Yes' : 'No'}`)
    })
    
    // 2. Focus on the seller user
    const seller = users.find(u => u.email === 'seller@test.com')
    if (!seller) {
      console.log('❌ Seller user not found!')
      return
    }
    
    console.log(`\n2. 🏠 Seller details:`, {
      id: seller.id,
      email: seller.email,
      role: seller.role,
      kycStatus: seller.kycStatus,
      hasStrigaUserId: !!seller.strigaUserId,
      strigaUserId: seller.strigaUserId
    })
    
    // 3. Check what would happen when the API is called
    console.log('\n3. 🧪 Simulating API wallet logic...')
    
    if (!seller.strigaUserId) {
      console.log('❌ Issue: User not registered with Striga')
      console.log('💡 Solution: User needs to complete onboarding to get Striga User ID')
      return
    }
    
    if (seller.kycStatus !== 'PASSED') {
      console.log(`❌ Issue: KYC verification required. Status: ${seller.kycStatus}`)
      console.log('💡 Solution: User needs to complete KYC verification')
      return
    }
    
    console.log('✅ User would be authorized to access wallets!')
    console.log('✅ The API would proceed to fetch/create mock wallets')
    
    // 4. Test mock wallet logic
    console.log('\n4. 🏦 Testing mock wallet creation for seller...')
    
    const mockWallets = [
      {
        currency: 'EUR',
        walletId: 'mock-eur-wallet-' + seller.strigaUserId,
        accountId: 'mock-eur-account-' + seller.strigaUserId,
        address: '', // EUR doesn't have blockchain address
        qrCode: '',
        network: '',
        balance: {
          amount: '0.00',
          currency: 'EUR'
        },
        type: 'fiat'
      }
    ]
    
    console.log('Mock wallet data:')
    console.log(JSON.stringify(mockWallets, null, 2))
    
    console.log('\n📋 Test Results Summary:')
    console.log(`✅ User exists: ${seller.email}`)
    console.log(`✅ User role correct: ${seller.role}`)
    console.log(`${seller.strigaUserId ? '✅' : '❌'} Striga User ID: ${seller.strigaUserId || 'Missing'}`)
    console.log(`${seller.kycStatus === 'PASSED' ? '✅' : '❌'} KYC Status: ${seller.kycStatus}`)
    
    if (!seller.strigaUserId) {
      console.log('\n🚨 PROBLEM: User needs to complete onboarding to get Striga User ID')
      console.log('   This happens at /onboarding route')
    }
    
    if (seller.kycStatus !== 'PASSED') {
      console.log('\n🚨 PROBLEM: User needs to complete KYC verification')
      console.log(`   Current status: ${seller.kycStatus}`)
      console.log('   This happens at /kyc route')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testWalletSession().catch(console.error)