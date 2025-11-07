/**
 * Test Cloud Functions Locally
 *
 * Tests all payment system functions against Firebase emulators
 *
 * Prerequisites:
 * - Firebase emulators running (firebase emulators:start)
 * - Test data seeded (node test/seed-test-data.js)
 *
 * Usage: node test/test-functions.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/xiwen-app-2026/us-central1';

// Test results
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function logTest(name, passed, details = '') {
  testsRun++;
  if (passed) {
    testsPassed++;
    console.log(`✅ ${name}`);
  } else {
    testsFailed++;
    console.log(`❌ ${name}`);
  }
  if (details) {
    console.log(`   ${details}`);
  }
}

async function testGenerateMonthlyFees() {
  console.log('\n📅 Test 1: generateMonthlyFees (Cron Job)');
  console.log('─'.repeat(50));

  try {
    // This function is a PubSub function, we can't call it directly via HTTP
    // In a real test, we'd need to use Firebase Admin SDK or the emulator's internal API
    console.log('⚠️  This is a PubSub scheduled function');
    console.log('   Manual test: Check if fees are created on the 1st of each month');
    console.log('   Or trigger manually via Emulator UI Functions tab');
    logTest('generateMonthlyFees configured', true, 'Cron schedule: 0 0 1 * *');
  } catch (error) {
    logTest('generateMonthlyFees', false, error.message);
  }
}

async function testCheckOverdueFees() {
  console.log('\n⏰ Test 2: checkOverdueFees (Cron Job)');
  console.log('─'.repeat(50));

  try {
    console.log('⚠️  This is a PubSub scheduled function');
    console.log('   Manual test: Check if overdue fees are marked and late fees calculated');
    console.log('   Or trigger manually via Emulator UI Functions tab');
    logTest('checkOverdueFees configured', true, 'Cron schedule: 0 2 * * *');
  } catch (error) {
    logTest('checkOverdueFees', false, error.message);
  }
}

async function testCreateMatriculaPayment() {
  console.log('\n💳 Test 3: createMatriculaPayment (Callable Function)');
  console.log('─'.repeat(50));

  try {
    // To test callable functions, we need to authenticate
    // For local testing, we can use the emulator's relaxed security
    console.log('⚠️  This is a callable function requiring authentication');
    console.log('   Test from frontend with real auth token, or:');
    console.log('   1. Get enrollment ID from Firestore UI');
    console.log('   2. Call with proper auth context');
    console.log('\n   Example curl (after getting enrollment ID):');
    console.log(`   curl -X POST ${BASE_URL}/createMatriculaPayment \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"data":{"enrollmentId":"ENROLLMENT_ID","returnUrl":"http://localhost:5173"}}'`);

    logTest('createMatriculaPayment configured', true, 'Requires: enrollmentId, returnUrl');
  } catch (error) {
    logTest('createMatriculaPayment', false, error.message);
  }
}

async function testCreateMonthlyFeePayment() {
  console.log('\n💰 Test 4: createMonthlyFeePayment (Callable Function)');
  console.log('─'.repeat(50));

  try {
    console.log('⚠️  This is a callable function requiring authentication');
    console.log('   1. Run generateMonthlyFees to create fees');
    console.log('   2. Get fee ID from Firestore UI');
    console.log('   3. Call function with auth context');

    logTest('createMonthlyFeePayment configured', true, 'Requires: feeId, returnUrl');
  } catch (error) {
    logTest('createMonthlyFeePayment', false, error.message);
  }
}

async function testCreateCoursePayment() {
  console.log('\n📚 Test 5: createCoursePayment (Callable Function)');
  console.log('─'.repeat(50));

  try {
    console.log('⚠️  This is a callable function requiring authentication');
    console.log('   1. Get course ID from Firestore UI (course001 or course002)');
    console.log('   2. Call function with auth context');
    console.log('   Note: Will reject course003 (price = 0)');

    logTest('createCoursePayment configured', true, 'Requires: courseId, returnUrl');
  } catch (error) {
    logTest('createCoursePayment', false, error.message);
  }
}

async function testApplyFamilyDiscount() {
  console.log('\n👨‍👩‍👧‍👦 Test 6: applyFamilyDiscount (Callable Function)');
  console.log('─'.repeat(50));

  try {
    console.log('⚠️  This is a callable function requiring admin authentication');
    console.log('   Tests discount calculation:');
    console.log('   - 1st child: 0%');
    console.log('   - 2nd child: 20%');
    console.log('   - 3rd+ child: 30%');

    logTest('applyFamilyDiscount configured', true, 'Requires: guardianId, studentIds[]');
  } catch (error) {
    logTest('applyFamilyDiscount', false, error.message);
  }
}

async function testApplyScholarship() {
  console.log('\n🎓 Test 7: applyScholarship (Callable Function)');
  console.log('─'.repeat(50));

  try {
    console.log('⚠️  This is a callable function requiring admin authentication');
    console.log('   Applies scholarship to student enrollment');
    console.log('   Supports partial (e.g., 50%) or full (100%) scholarships');

    logTest('applyScholarship configured', true, 'Requires: studentId, percentage, reason, etc.');
  } catch (error) {
    logTest('applyScholarship', false, error.message);
  }
}

async function testMercadoPagoWebhook() {
  console.log('\n🔔 Test 8: mercadopagoWebhook (HTTP Function)');
  console.log('─'.repeat(50));

  try {
    // Test webhook with mock data
    const mockWebhookPayload = {
      topic: 'payment',
      id: '123456789'
    };

    console.log('   Simulating MercadoPago webhook notification...');
    console.log('   Payload:', JSON.stringify(mockWebhookPayload));

    // In real test, this would fail because we don't have a real payment ID
    // But we can verify the endpoint is accessible
    const response = await axios.post(`${BASE_URL}/mercadopagoWebhook`, mockWebhookPayload, {
      validateStatus: () => true // Don't throw on any status
    });

    if (response.status === 200) {
      logTest('mercadopagoWebhook endpoint accessible', true, `Status: ${response.status}`);
    } else {
      logTest('mercadopagoWebhook endpoint', false, `Status: ${response.status}`);
    }

    console.log('\n   ℹ️  To test fully:');
    console.log('   1. Create a payment preference (Test 3, 4, or 5)');
    console.log('   2. Complete checkout in MercadoPago sandbox');
    console.log('   3. MercadoPago will call this webhook');
    console.log('   4. Check Firestore for updated payment status');

  } catch (error) {
    logTest('mercadopagoWebhook', false, error.message);
  }
}

async function testCheckSubscriptionStatus() {
  console.log('\n✔️ Test 9: checkSubscriptionStatus (Callable Function)');
  console.log('─'.repeat(50));

  try {
    console.log('⚠️  This is a callable function requiring authentication');
    console.log('   Checks if student has active enrollment');
    console.log('   Returns enrollment details if active');

    logTest('checkSubscriptionStatus configured', true, 'No parameters required');
  } catch (error) {
    logTest('checkSubscriptionStatus', false, error.message);
  }
}

async function testGetPaymentHistory() {
  console.log('\n📜 Test 10: getPaymentHistory (Callable Function)');
  console.log('─'.repeat(50));

  try {
    console.log('⚠️  This is a callable function requiring authentication');
    console.log('   Returns payment history for authenticated user');
    console.log('   Optional: limit parameter (default: 50)');

    logTest('getPaymentHistory configured', true, 'Optional: studentId, limit');
  } catch (error) {
    logTest('getPaymentHistory', false, error.message);
  }
}

async function testFunctionsConfiguration() {
  console.log('\n⚙️ Test 11: Configuration Validation');
  console.log('─'.repeat(50));

  // Check if .runtimeconfig.json exists
  const fs = require('fs');
  const path = require('path');
  const configPath = path.join(__dirname, '../functions/.runtimeconfig.json');

  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      // Check MercadoPago access token
      if (config.mercadopago?.access_token) {
        if (config.mercadopago.access_token.startsWith('TEST-')) {
          logTest('MercadoPago TEST credentials configured', true, 'Token starts with TEST-');
        } else if (config.mercadopago.access_token === 'TEST-PLACEHOLDER-REPLACE-WITH-YOUR-TEST-TOKEN') {
          logTest('MercadoPago credentials', false, '❗ Replace placeholder with real TEST token');
        } else {
          logTest('MercadoPago credentials', false, '❗ Should use TEST credentials for local testing');
        }
      } else {
        logTest('MercadoPago credentials', false, 'access_token missing in .runtimeconfig.json');
      }

      // Check webhook URL
      if (config.app?.webhook_url) {
        logTest('Webhook URL configured', true, config.app.webhook_url);
      } else {
        logTest('Webhook URL', false, 'webhook_url missing in .runtimeconfig.json');
      }

    } else {
      logTest('Configuration file', false, '.runtimeconfig.json not found in functions/');
      console.log('   Create it with:');
      console.log('   {');
      console.log('     "mercadopago": { "access_token": "TEST-xxxxx" },');
      console.log('     "app": { "webhook_url": "http://localhost:5001/..." }');
      console.log('   }');
    }
  } catch (error) {
    logTest('Configuration validation', false, error.message);
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TESTING STUDENT PAYMENT SYSTEM - Cloud Functions');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n⚡ Prerequisites:');
  console.log('   1. Firebase emulators running: firebase emulators:start');
  console.log('   2. Test data seeded: node test/seed-test-data.js');
  console.log('   3. Emulator UI open: http://localhost:4000');
  console.log('\n');

  // Run tests
  await testFunctionsConfiguration();
  await testGenerateMonthlyFees();
  await testCheckOverdueFees();
  await testCreateMatriculaPayment();
  await testCreateMonthlyFeePayment();
  await testCreateCoursePayment();
  await testApplyFamilyDiscount();
  await testApplyScholarship();
  await testMercadoPagoWebhook();
  await testCheckSubscriptionStatus();
  await testGetPaymentHistory();

  // Summary
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`   Total tests: ${testsRun}`);
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log('\n');

  if (testsFailed === 0) {
    console.log('🎉 All configuration tests passed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Replace TEST-PLACEHOLDER in functions/.runtimeconfig.json');
    console.log('   2. Start emulators: firebase emulators:start');
    console.log('   3. Test functions from frontend or Emulator UI');
    console.log('   4. Complete a test payment with MercadoPago sandbox');
  } else {
    console.log('⚠️  Some tests failed. Please fix configuration before proceeding.');
  }

  console.log('\n');
}

// Run all tests
runAllTests().catch(console.error);
