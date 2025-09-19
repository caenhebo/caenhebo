const fetch = require('node-fetch');

async function checkTransactionStatus() {
  try {
    // Get CSRF token
    const csrfRes = await fetch('http://localhost:3019/api/auth/csrf');
    const { csrfToken } = await csrfRes.json();
    const cookies = csrfRes.headers.raw()['set-cookie'];

    // Login as admin to see all details
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
    console.log('Login status:', loginRes.status === 302 ? '✅ Logged in' : '❌ Failed');

    // Check the specific transaction
    const transRes = await fetch('http://localhost:3019/api/transactions/cmfccc4by0001h2tkygk4j2mh', {
      headers: { 'Cookie': sessionCookies.join('; ') }
    });

    if (transRes.ok) {
      const data = await transRes.json();
      const trans = data.transaction;

      console.log('\n📋 TRANSACTION DETAILS:');
      console.log('========================');
      console.log('ID:', trans.id);
      console.log('Status:', trans.status || 'UNKNOWN');
      console.log('Property:', trans.property?.title || 'No property');
      console.log('Property Code:', trans.property?.code);
      console.log('Buyer ID:', trans.buyerId);
      console.log('Seller ID:', trans.sellerId);
      console.log('Offer Price:', trans.offerPrice);
      console.log('Agreed Price:', trans.agreedPrice);

      console.log('\n📝 AGREEMENT STATUS:');
      console.log('Purchase Agreement Signed:', trans.purchaseAgreementSigned || false);
      console.log('Buyer Signed Promissory:', trans.buyerSignedPromissory || false);
      console.log('Seller Signed Promissory:', trans.sellerSignedPromissory || false);

      console.log('\n📑 STAGE 3 STATUS:');
      console.log('Buyer Has Rep:', trans.buyerHasRep || false);
      console.log('Seller Has Rep:', trans.sellerHasRep || false);
      console.log('Mediation Signed:', trans.mediationSigned || false);

      // Check Stage 3 endpoint
      const stage3Res = await fetch('http://localhost:3019/api/transactions/cmfccc4by0001h2tkygk4j2mh/stage3', {
        headers: { 'Cookie': sessionCookies.join('; ') }
      });

      if (stage3Res.ok) {
        const stage3Data = await stage3Res.json();
        console.log('\n🔍 STAGE 3 REQUIREMENTS CHECK:');
        console.log('Has Representation Doc:', stage3Data.status?.hasRepresentationDoc || false);
        console.log('Has Mediation Agreement:', stage3Data.status?.hasMediationAgreement || false);
        console.log('Buyer Confirmed:', stage3Data.status?.buyerConfirmed || false);
        console.log('Seller Confirmed:', stage3Data.status?.sellerConfirmed || false);
        console.log('Mediation Signed:', stage3Data.status?.mediationSigned || false);
        console.log('Stage 3 Complete:', stage3Data.status?.stage3Complete || false);
        console.log('Can Advance to Escrow:', stage3Data.status?.canAdvanceToEscrow || false);
      }

      // Check status history
      if (trans.statusHistory && trans.statusHistory.length > 0) {
        console.log('\n📜 STATUS HISTORY:');
        trans.statusHistory.slice(-5).forEach(h => {
          console.log(`  - ${h.notes || 'No notes'}`);
        });
      }

    } else {
      console.log('❌ Failed to fetch transaction:', transRes.status);
      const error = await transRes.text();
      console.log('Error:', error);
    }

    // Also check all transactions for this user
    const allTransRes = await fetch('http://localhost:3019/api/transactions', {
      headers: { 'Cookie': sessionCookies.join('; ') }
    });

    if (allTransRes.ok) {
      const allData = await allTransRes.json();
      console.log('\n📊 ALL TRANSACTIONS FOR THIS USER:');
      console.log('Total count:', allData.transactions?.length || 0);

      if (allData.transactions && allData.transactions.length > 0) {
        allData.transactions.forEach(t => {
          console.log(`  - ${t.id}: ${t.status} | Property: ${t.property?.title || 'Unknown'}`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTransactionStatus();