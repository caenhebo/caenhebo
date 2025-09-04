const { getWallets } = require('./src/lib/striga.ts');

async function debugWallets() {
    const strigaUserId = 'b3d32c24-4c4f-4db2-9873-04eb0987fa37'; // seller@test.com
    
    console.log('🔍 Testing Striga API directly for wallets...');
    console.log('Striga User ID:', strigaUserId);
    
    try {
        const wallets = await getWallets(strigaUserId);
        console.log('✅ Wallets response:', JSON.stringify(wallets, null, 2));
        console.log('📊 Number of wallets:', wallets.length);
        
        if (wallets.length === 0) {
            console.log('❌ No wallets found - this explains the issue!');
            console.log('💡 Need to create wallets after KYC approval');
        }
        
    } catch (error) {
        console.error('❌ Error fetching wallets:', error);
        console.error('Error details:', {
            message: error.message,
            status: error.statusCode,
            code: error.strigaCode
        });
    }
}

debugWallets();