/**
 * Seed Test Data for Firebase Emulators
 *
 * Creates sample data in Firestore emulator for testing the payment system
 *
 * Usage: node test/seed-test-data.js
 */

const admin = require('firebase-admin');

// Connect to Firestore emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

admin.initializeApp({ projectId: 'xiwen-app-2026' });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

async function seedData() {
  console.log('🌱 Seeding test data to Firestore emulator...\n');

  try {
    // ============================================
    // 1. USERS
    // ============================================
    console.log('👤 Creating users...');

    await db.collection('users').doc('student001').set({
      name: 'Juan Pérez',
      email: 'juan.perez@test.com',
      role: 'student',
      createdAt: FieldValue.serverTimestamp()
    });

    await db.collection('users').doc('student002').set({
      name: 'Ana Pérez',
      email: 'ana.perez@test.com',
      role: 'student',
      createdAt: FieldValue.serverTimestamp()
    });

    await db.collection('users').doc('guardian001').set({
      name: 'María Pérez',
      email: 'maria.perez@test.com',
      role: 'guardian',
      createdAt: FieldValue.serverTimestamp()
    });

    await db.collection('users').doc('admin001').set({
      name: 'Admin Sistema',
      email: 'admin@xiwen.app',
      role: 'admin',
      createdAt: FieldValue.serverTimestamp()
    });

    console.log('✅ Users created: student001, student002, guardian001, admin001\n');

    // ============================================
    // 2. STUDENT ENROLLMENTS
    // ============================================
    console.log('📚 Creating student enrollments...');

    const enrollment1Ref = await db.collection('student_enrollments').add({
      studentId: 'student001',
      studentName: 'Juan Pérez',
      studentEmail: 'juan.perez@test.com',
      guardianId: 'guardian001',
      enrollmentType: 'annual',
      academicYear: '2025',
      matriculaAmount: 15000,
      cuotaAmount: 8000,
      discount: 0,
      discountReason: 'Sin descuento',
      status: 'pending',
      matriculaPaid: false,
      createdAt: FieldValue.serverTimestamp()
    });

    const enrollment2Ref = await db.collection('student_enrollments').add({
      studentId: 'student002',
      studentName: 'Ana Pérez',
      studentEmail: 'ana.perez@test.com',
      guardianId: 'guardian001',
      enrollmentType: 'annual',
      academicYear: '2025',
      matriculaAmount: 15000,
      cuotaAmount: 8000,
      discount: 20, // 2nd sibling discount
      discountReason: 'Hermano 2° - 20% descuento',
      status: 'pending',
      matriculaPaid: false,
      createdAt: FieldValue.serverTimestamp()
    });

    console.log('✅ Enrollments created:');
    console.log(`   - Enrollment 1 ID: ${enrollment1Ref.id}`);
    console.log(`   - Enrollment 2 ID: ${enrollment2Ref.id}\n`);

    // ============================================
    // 3. COURSES
    // ============================================
    console.log('📖 Creating courses...');

    await db.collection('courses').doc('course001').set({
      name: 'Matemáticas 101',
      description: 'Curso de matemáticas básicas',
      price: 5000,
      active: true,
      studentCount: 0,
      createdAt: FieldValue.serverTimestamp()
    });

    await db.collection('courses').doc('course002').set({
      name: 'Física 101',
      description: 'Introducción a la física',
      price: 6000,
      active: true,
      studentCount: 0,
      createdAt: FieldValue.serverTimestamp()
    });

    await db.collection('courses').doc('course003').set({
      name: 'Curso Gratuito de Prueba',
      description: 'Este curso es gratuito para testing',
      price: 0,
      active: true,
      studentCount: 0,
      createdAt: FieldValue.serverTimestamp()
    });

    console.log('✅ Courses created: course001 ($5000), course002 ($6000), course003 (free)\n');

    // ============================================
    // 4. MONTHLY FEE (Overdue for testing)
    // ============================================
    console.log('💰 Creating sample monthly fee (overdue)...');

    // Create an overdue fee from last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().substring(0, 7); // "2024-12"

    const dueDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 10);

    await db.collection('monthly_fees').add({
      studentId: 'student001',
      studentName: 'Juan Pérez',
      studentEmail: 'juan.perez@test.com',
      enrollmentId: enrollment1Ref.id,
      month: lastMonthStr,
      monthName: 'Diciembre 2024',
      amount: 8000,
      discount: 0,
      discountPercentage: 0,
      finalAmount: 8000,
      status: 'pending',
      dueDate: admin.firestore.Timestamp.fromDate(dueDate),
      lateFee: 0,
      daysPastDue: 0,
      createdAt: FieldValue.serverTimestamp()
    });

    console.log(`✅ Overdue fee created for ${lastMonthStr}\n`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('═══════════════════════════════════════');
    console.log('✅ Seed completed successfully!');
    console.log('═══════════════════════════════════════');
    console.log('\n📊 Data created:');
    console.log('   - 4 users (2 students, 1 guardian, 1 admin)');
    console.log('   - 2 enrollments (1 normal, 1 with 20% discount)');
    console.log('   - 3 courses (2 paid, 1 free)');
    console.log('   - 1 overdue monthly fee');
    console.log('\n🔗 View in Emulator UI: http://localhost:4000\n');
    console.log('📝 Next steps:');
    console.log('   1. Run: firebase emulators:start');
    console.log('   2. Open: http://localhost:4000');
    console.log('   3. Test functions with: node test/test-functions.js\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run seed
seedData();
