const { strigaApiRequest } = require('./src/lib/striga');

async function checkJuanaKYC() {
  try {
    const strigaUserId = '7ebc0a93-fd66-4c95-8b6a-b71a74842ae8';
    console.log('Checking KYC for Juana:', strigaUserId);
    
    const user = await strigaApiRequest(`/user/${strigaUserId}`, {
      method: 'GET'
    });
    
    console.log('Full response:', JSON.stringify(user, null, 2));
    console.log('\nKYC Status:', user.KYC?.status);
    console.log('Email Verified:', user.emailVerified);
    console.log('Mobile Verified:', user.mobileVerified);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

checkJuanaKYC();