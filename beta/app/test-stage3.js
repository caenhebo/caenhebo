#!/usr/bin/env node

/**
 * Test script for Stage 3 (Representation & Mediation) functionality
 * Tests the complete flow of Stage 3 requirements
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3019';

// Test credentials
const testBuyer = {
  email: 'buyer@test.com',
  password: 'password123'
};

const testSeller = {
  email: 'seller@test.com',
  password: 'password123'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function loginUser(credentials) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: credentials.email,
        password: credentials.password,
        csrfToken: 'test',
        json: 'true'
      })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const cookies = response.headers.get('set-cookie');
    if (!cookies) {
      throw new Error('No cookies received from login');
    }

    // Extract session cookie
    const sessionMatch = cookies.match(/next-auth\.session-token=([^;]+)/);
    if (!sessionMatch) {
      throw new Error('No session token in cookies');
    }

    return sessionMatch[1];
  } catch (error) {
    log(`Login error: ${error.message}`, 'red');
    throw error;
  }
}

async function getTransactions(sessionToken) {
  try {
    const response = await fetch(`${BASE_URL}/api/transactions`, {
      headers: {
        'Cookie': `next-auth.session-token=${sessionToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get transactions: ${response.status}`);
    }

    const data = await response.json();
    return data.transactions || [];
  } catch (error) {
    log(`Error getting transactions: ${error.message}`, 'red');
    throw error;
  }
}

async function checkStage3Status(transactionId, sessionToken) {
  try {
    const response = await fetch(`${BASE_URL}/api/transactions/${transactionId}/stage3`, {
      headers: {
        'Cookie': `next-auth.session-token=${sessionToken}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to check Stage 3 status: ${error}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    log(`Error checking Stage 3 status: ${error.message}`, 'red');
    throw error;
  }
}

async function confirmRepresentation(transactionId, sessionToken) {
  try {
    const response = await fetch(`${BASE_URL}/api/transactions/${transactionId}/stage3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=${sessionToken}`
      },
      body: JSON.stringify({
        action: 'CONFIRM_REPRESENTATION'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to confirm representation: ${error}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    log(`Error confirming representation: ${error.message}`, 'red');
    throw error;
  }
}

async function signMediation(transactionId, sessionToken) {
  try {
    const response = await fetch(`${BASE_URL}/api/transactions/${transactionId}/stage3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=${sessionToken}`
      },
      body: JSON.stringify({
        action: 'SIGN_MEDIATION'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to sign mediation: ${error}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    log(`Error signing mediation: ${error.message}`, 'red');
    throw error;
  }
}

async function runTests() {
  log('\n=== Stage 3 (Representation & Mediation) Test Suite ===\n', 'cyan');

  try {
    // 1. Login as buyer
    log('1. Logging in as buyer...', 'blue');
    const buyerSession = await loginUser(testBuyer);
    log('   ✓ Buyer logged in successfully', 'green');

    // 2. Get buyer's transactions
    log('\n2. Getting buyer transactions...', 'blue');
    const buyerTransactions = await getTransactions(buyerSession);
    log(`   ✓ Found ${buyerTransactions.length} transaction(s)`, 'green');

    // Find an AGREEMENT stage transaction
    const agreementTransaction = buyerTransactions.find(t => t.status === 'AGREEMENT');
    
    if (!agreementTransaction) {
      log('   ⚠ No transactions in AGREEMENT stage found for testing', 'yellow');
      log('   Creating a test scenario would require setting up a full transaction flow', 'yellow');
      return;
    }

    const transactionId = agreementTransaction.id;
    log(`   ✓ Found AGREEMENT transaction: ${transactionId}`, 'green');

    // 3. Check initial Stage 3 status
    log('\n3. Checking Stage 3 status...', 'blue');
    const initialStatus = await checkStage3Status(transactionId, buyerSession);
    log('   Stage 3 Status:', 'cyan');
    log(`   - Representation Doc: ${initialStatus.status.hasRepresentationDoc ? '✓' : '✗'}`, 
        initialStatus.status.hasRepresentationDoc ? 'green' : 'yellow');
    log(`   - Mediation Agreement: ${initialStatus.status.hasMediationAgreement ? '✓' : '✗'}`,
        initialStatus.status.hasMediationAgreement ? 'green' : 'yellow');
    log(`   - Buyer Confirmed: ${initialStatus.status.buyerConfirmed ? '✓' : '✗'}`,
        initialStatus.status.buyerConfirmed ? 'green' : 'yellow');
    log(`   - Seller Confirmed: ${initialStatus.status.sellerConfirmed ? '✓' : '✗'}`,
        initialStatus.status.sellerConfirmed ? 'green' : 'yellow');
    log(`   - Mediation Signed: ${initialStatus.status.mediationSigned ? '✓' : '✗'}`,
        initialStatus.status.mediationSigned ? 'green' : 'yellow');
    log(`   - Stage 3 Complete: ${initialStatus.status.stage3Complete ? '✓' : '✗'}`,
        initialStatus.status.stage3Complete ? 'green' : 'yellow');

    // 4. Test buyer confirmation (if not already confirmed)
    if (!initialStatus.status.buyerConfirmed && initialStatus.status.hasRepresentationDoc) {
      log('\n4. Testing buyer representation confirmation...', 'blue');
      const confirmResult = await confirmRepresentation(transactionId, buyerSession);
      log('   ✓ Buyer representation confirmed', 'green');
    }

    // 5. Test mediation signing (if not already signed)
    if (!initialStatus.status.mediationSigned && initialStatus.status.hasMediationAgreement) {
      log('\n5. Testing mediation agreement signing...', 'blue');
      const signResult = await signMediation(transactionId, buyerSession);
      log('   ✓ Mediation agreement signed by buyer', 'green');
    }

    // 6. Login as seller and test seller actions
    log('\n6. Logging in as seller...', 'blue');
    const sellerSession = await loginUser(testSeller);
    log('   ✓ Seller logged in successfully', 'green');

    // 7. Check Stage 3 status as seller
    log('\n7. Checking Stage 3 status as seller...', 'blue');
    const sellerStatus = await checkStage3Status(transactionId, sellerSession);
    
    // 8. Test seller confirmation (if not already confirmed)
    if (!sellerStatus.status.sellerConfirmed && sellerStatus.status.hasRepresentationDoc) {
      log('\n8. Testing seller representation confirmation...', 'blue');
      const confirmResult = await confirmRepresentation(transactionId, sellerSession);
      log('   ✓ Seller representation confirmed', 'green');
    }

    // 9. Final status check
    log('\n9. Final Stage 3 status check...', 'blue');
    const finalStatus = await checkStage3Status(transactionId, buyerSession);
    
    log('\n   Final Stage 3 Status:', 'cyan');
    log(`   - Representation Doc: ${finalStatus.status.hasRepresentationDoc ? '✓' : '✗'}`, 
        finalStatus.status.hasRepresentationDoc ? 'green' : 'red');
    log(`   - Mediation Agreement: ${finalStatus.status.hasMediationAgreement ? '✓' : '✗'}`,
        finalStatus.status.hasMediationAgreement ? 'green' : 'red');
    log(`   - Buyer Confirmed: ${finalStatus.status.buyerConfirmed ? '✓' : '✗'}`,
        finalStatus.status.buyerConfirmed ? 'green' : 'red');
    log(`   - Seller Confirmed: ${finalStatus.status.sellerConfirmed ? '✓' : '✗'}`,
        finalStatus.status.sellerConfirmed ? 'green' : 'red');
    log(`   - Mediation Signed: ${finalStatus.status.mediationSigned ? '✓' : '✗'}`,
        finalStatus.status.mediationSigned ? 'green' : 'red');
    log(`   - Stage 3 Complete: ${finalStatus.status.stage3Complete ? '✓' : '✗'}`,
        finalStatus.status.stage3Complete ? 'green' : 'red');

    if (finalStatus.status.stage3Complete) {
      log('\n✅ Stage 3 is complete! Transaction can advance to Escrow.', 'green');
    } else {
      log('\n⚠ Stage 3 is not complete. Missing requirements:', 'yellow');
      if (!finalStatus.status.hasRepresentationDoc) {
        log('   - Upload representation document', 'yellow');
      }
      if (!finalStatus.status.hasMediationAgreement) {
        log('   - Upload mediation agreement', 'yellow');
      }
      if (!finalStatus.status.buyerConfirmed) {
        log('   - Buyer needs to confirm representation', 'yellow');
      }
      if (!finalStatus.status.sellerConfirmed) {
        log('   - Seller needs to confirm representation', 'yellow');
      }
      if (!finalStatus.status.mediationSigned) {
        log('   - Mediation agreement needs to be signed', 'yellow');
      }
    }

    log('\n=== Test Suite Complete ===\n', 'cyan');

  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});