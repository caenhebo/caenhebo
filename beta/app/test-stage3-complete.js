const fetch = require('node-fetch');

async function testStage3() {
  // Login as buyer
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
      email: 'buyer@test.com',
      password: 'C@rlos2025',
      csrfToken: csrfToken,
      json: true
    }),
    redirect: 'manual'
  });

  const sessionCookies = loginRes.headers.raw()['set-cookie'];
  console.log('Login status:', loginRes.status === 302 ? '✅' : '❌');

  // Test both transactions
  const transactionIds = [
    'cmfccc4by0001h2tkygk4j2mh',  // Beautiful Villa in Lisbon
    'cmfc9mufr0003h2yziizuctcf'   // Test Property for Stage 3
  ];

  for (const transId of transactionIds) {
    console.log(`\n📋 Checking transaction: ${transId}`);

    // Check Stage 3 status
    const stage3Res = await fetch(`http://localhost:3019/api/transactions/${transId}/stage3`, {
      headers: { 'Cookie': sessionCookies.join('; ') }
    });

    if (stage3Res.ok) {
      const stage3Data = await stage3Res.json();
      console.log('Stage 3 Status:');
      console.log('  - Has rep doc:', stage3Data.status?.hasRepresentationDoc || false);
      console.log('  - Has mediation:', stage3Data.status?.hasMediationAgreement || false);
      console.log('  - Buyer confirmed:', stage3Data.status?.buyerConfirmed || false);
      console.log('  - Seller confirmed:', stage3Data.status?.sellerConfirmed || false);
      console.log('  - Mediation signed:', stage3Data.status?.mediationSigned || false);
      console.log('  - Stage 3 complete:', stage3Data.status?.stage3Complete || false);
      console.log('  - Can advance:', stage3Data.status?.canAdvanceToEscrow || false);

      // Try to complete Stage 3 requirements
      if (!stage3Data.status?.stage3Complete) {
        console.log('\n🔧 Completing Stage 3 requirements...');

        // Upload representation doc
        console.log('  - Uploading representation document...');
        // This would need actual file upload logic

        // Confirm representation
        const confirmRes = await fetch(`http://localhost:3019/api/transactions/${transId}/stage3`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': sessionCookies.join('; ')
          },
          body: JSON.stringify({ action: 'CONFIRM_REPRESENTATION' })
        });
        console.log('  - Confirm representation:', confirmRes.ok ? '✅' : '❌');

        // Sign mediation
        const mediationRes = await fetch(`http://localhost:3019/api/transactions/${transId}/stage3`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': sessionCookies.join('; ')
          },
          body: JSON.stringify({ action: 'SIGN_MEDIATION' })
        });
        console.log('  - Sign mediation:', mediationRes.ok ? '✅' : '❌');
      }

      // Try to advance to escrow
      console.log('\n🚀 Attempting to advance to ESCROW...');
      const advanceRes = await fetch(`http://localhost:3019/api/transactions/${transId}/advance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookies.join('; ')
        },
        body: JSON.stringify({
          notes: 'Advancing to escrow',
          escrowDetails: {
            totalAmount: 500000,
            initialDeposit: 50000,
            finalPayment: 450000
          }
        })
      });

      if (advanceRes.ok) {
        console.log('  ✅ Advanced to ESCROW successfully!');
      } else {
        const error = await advanceRes.json();
        console.log('  ❌ Failed to advance:', error.error);
      }
    }
  }
}

testStage3().catch(console.error);