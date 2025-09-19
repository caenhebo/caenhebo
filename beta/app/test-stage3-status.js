const fetch = require('node-fetch');

async function checkStage3() {
  // Login first
  const csrfRes = await fetch('http://localhost:3019/api/auth/csrf');
  const { csrfToken } = await csrfRes.json();
  const cookies = csrfRes.headers.raw()['set-cookie'];

  const loginRes = await fetch('http://localhost:3019/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies.join('; ')
    },
    body: JSON.stringify({
      email: 'f@pachoman.com',
      password: 'C@rlos2025',
      csrfToken: csrfToken,
      json: true
    }),
    redirect: 'manual'
  });

  const sessionCookies = loginRes.headers.raw()['set-cookie'];

  // Check transaction
  const transRes = await fetch('http://localhost:3019/api/transactions/cmfccc4by0001h2tkygk4j2mh', {
    headers: { 'Cookie': sessionCookies.join('; ') }
  });

  const data = await transRes.json();
  console.log('Transaction status:', data.transaction?.status);
  console.log('Purchase agreement signed:', data.transaction?.purchaseAgreementSigned);
  console.log('Buyer signed promissory:', data.transaction?.buyerSignedPromissory);
  console.log('Seller signed promissory:', data.transaction?.sellerSignedPromissory);

  // Check Stage 3 status
  const stage3Res = await fetch('http://localhost:3019/api/transactions/cmfccc4by0001h2tkygk4j2mh/stage3', {
    headers: { 'Cookie': sessionCookies.join('; ') }
  });

  if (stage3Res.ok) {
    const stage3Data = await stage3Res.json();
    console.log('\nStage 3 Requirements:');
    console.log('- Has representation doc:', stage3Data.status?.hasRepresentationDoc);
    console.log('- Has mediation agreement:', stage3Data.status?.hasMediationAgreement);
    console.log('- Buyer confirmed:', stage3Data.status?.buyerConfirmed);
    console.log('- Seller confirmed:', stage3Data.status?.sellerConfirmed);
    console.log('- Mediation signed:', stage3Data.status?.mediationSigned);
    console.log('- Stage 3 complete:', stage3Data.status?.stage3Complete);
  } else {
    console.log('Stage 3 status error:', await stage3Res.text());
  }

  // Try to advance
  console.log('\nAttempting to advance to ESCROW...');
  const advanceRes = await fetch('http://localhost:3019/api/transactions/cmfccc4by0001h2tkygk4j2mh/advance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookies.join('; ')
    },
    body: JSON.stringify({
      notes: 'Advancing to escrow',
      escrowDetails: {
        totalAmount: 500000,
        escrowProvider: 'Caenhebo'
      }
    })
  });

  if (advanceRes.ok) {
    console.log('✅ Advanced successfully!');
  } else {
    const error = await advanceRes.json();
    console.log('❌ Advance failed:', error.error);
  }
}

checkStage3().catch(console.error);