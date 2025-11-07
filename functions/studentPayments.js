/**
 * @fileoverview Student Payment System - Cloud Functions
 * @module functions/studentPayments
 *
 * MercadoPago integration for student payments:
 * - Matrícula (enrollment fee)
 * - Cuotas mensuales (monthly fees)
 * - Cursos individuales (course purchases)
 * - Scholarships and family discounts
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const mercadopago = require('mercadopago');

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

// Configure MercadoPago
// Access token must be configured: firebase functions:config:set mercadopago.access_token="YOUR_TOKEN"
const getMercadoPagoClient = () => {
  const config = functions.config().mercadopago;
  if (!config || !config.access_token) {
    throw new Error('MercadoPago access token not configured');
  }

  mercadopago.configure({
    access_token: config.access_token
  });

  return mercadopago;
};

// ============================================
// CRON JOBS - Automated Tasks
// ============================================

/**
 * Generate monthly fees for all active students
 * Runs on the 1st of every month at 00:00 AM (Argentina time)
 *
 * Cron schedule: '0 0 1 * *'
 */
exports.generateMonthlyFees = functions.pubsub
  .schedule('0 0 1 * *')
  .timeZone('America/Argentina/Buenos_Aires')
  .onRun(async (context) => {
    console.log('Starting monthly fee generation...');

    const now = Timestamp.now();
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().substring(0, 7); // "2025-03"

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthName = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    try {
      // Get all active student enrollments
      const enrollmentsSnapshot = await db.collection('student_enrollments')
        .where('status', '==', 'active')
        .get();

      console.log(`Found ${enrollmentsSnapshot.size} active enrollments`);

      const batch = db.batch();
      let feesCreated = 0;
      const errors = [];

      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        try {
          const enrollment = enrollmentDoc.data();

          // Check if fee already exists for this month
          const existingFeeQuery = await db.collection('monthly_fees')
            .where('studentId', '==', enrollment.studentId)
            .where('month', '==', currentMonth)
            .limit(1)
            .get();

          if (!existingFeeQuery.empty) {
            console.log(`Fee already exists for student ${enrollment.studentId} - ${currentMonth}`);
            continue;
          }

          // Calculate final amount with discounts
          let finalAmount = enrollment.cuotaAmount || 8000; // Default: $8,000 ARS
          let discount = 0;
          let discountPercentage = enrollment.discount || 0;

          if (discountPercentage > 0) {
            discount = Math.round((finalAmount * discountPercentage) / 100);
            finalAmount = finalAmount - discount;
          }

          // Set due date to the 10th of current month
          const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 10);

          // Create fee document
          const feeRef = db.collection('monthly_fees').doc();
          batch.set(feeRef, {
            studentId: enrollment.studentId,
            studentName: enrollment.studentName || 'Estudiante',
            studentEmail: enrollment.studentEmail || '',
            enrollmentId: enrollmentDoc.id,
            month: currentMonth,
            monthName: monthName,
            amount: enrollment.cuotaAmount || 8000,
            discount: discount,
            discountPercentage: discountPercentage,
            finalAmount: finalAmount,
            status: 'pending',
            dueDate: Timestamp.fromDate(dueDate),
            lateFee: 0,
            daysPastDue: 0,
            createdAt: FieldValue.serverTimestamp()
          });

          feesCreated++;

        } catch (error) {
          console.error(`Error creating fee for enrollment ${enrollmentDoc.id}:`, error);
          errors.push({
            enrollmentId: enrollmentDoc.id,
            error: error.message
          });
        }
      }

      // Commit batch
      if (feesCreated > 0) {
        await batch.commit();
        console.log(`✅ Successfully created ${feesCreated} monthly fees for ${currentMonth}`);
      } else {
        console.log(`ℹ️ No new fees to create for ${currentMonth}`);
      }

      if (errors.length > 0) {
        console.error(`❌ Errors occurred: ${errors.length}`, errors);
      }

      return {
        success: true,
        feesCreated,
        month: currentMonth,
        errors: errors.length
      };

    } catch (error) {
      console.error('Error in generateMonthlyFees:', error);
      throw error;
    }
  });

/**
 * Check for overdue fees and apply late fees
 * Runs daily at 2:00 AM (Argentina time)
 *
 * Cron schedule: '0 2 * * *'
 */
exports.checkOverdueFees = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('America/Argentina/Buenos_Aires')
  .onRun(async (context) => {
    console.log('Checking for overdue fees...');

    const now = Timestamp.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Get all pending fees that are past due
      const overdueFeesSnapshot = await db.collection('monthly_fees')
        .where('status', '==', 'pending')
        .where('dueDate', '<', Timestamp.fromDate(today))
        .get();

      console.log(`Found ${overdueFeesSnapshot.size} potentially overdue fees`);

      const batch = db.batch();
      let feesUpdated = 0;

      for (const feeDoc of overdueFeesSnapshot.docs) {
        const fee = feeDoc.data();

        // Calculate days past due
        const dueDate = fee.dueDate.toDate();
        const daysPastDue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

        // Calculate late fee: 2% per cada 10 días
        const lateFeePercentage = Math.floor(daysPastDue / 10) * 2;
        const lateFee = Math.round((fee.finalAmount * lateFeePercentage) / 100);

        // Update fee status
        batch.update(feeDoc.ref, {
          status: 'overdue',
          daysPastDue: daysPastDue,
          lateFee: lateFee,
          updatedAt: FieldValue.serverTimestamp()
        });

        feesUpdated++;
      }

      if (feesUpdated > 0) {
        await batch.commit();
        console.log(`✅ Updated ${feesUpdated} overdue fees`);
      } else {
        console.log(`ℹ️ No overdue fees to update`);
      }

      return {
        success: true,
        feesUpdated
      };

    } catch (error) {
      console.error('Error in checkOverdueFees:', error);
      throw error;
    }
  });

// ============================================
// PAYMENT CREATION FUNCTIONS (Callable)
// ============================================

/**
 * Create MercadoPago preference for matrícula payment
 */
exports.createMatriculaPayment = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { enrollmentId, returnUrl } = data;
  const userId = context.auth.uid;

  console.log('Creating matricula payment preference:', { enrollmentId, userId });

  try {
    // Get enrollment
    const enrollmentDoc = await db.collection('student_enrollments').doc(enrollmentId).get();

    if (!enrollmentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Inscripción no encontrada');
    }

    const enrollment = enrollmentDoc.data();

    // Verify user is student or guardian
    if (enrollment.studentId !== userId && enrollment.guardianId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'No autorizado');
    }

    // Check if already paid
    if (enrollment.matriculaPaid) {
      throw new functions.https.HttpsError('already-exists', 'Matrícula ya pagada');
    }

    // Configure MercadoPago
    const mp = getMercadoPagoClient();

    // Create preference
    const preference = {
      items: [
        {
          title: `Matrícula ${enrollment.academicYear || '2025'} - ${enrollment.studentName}`,
          description: `Inscripción anual - ${enrollment.studentName}`,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: enrollment.matriculaAmount || 15000
        }
      ],
      payer: {
        email: context.auth.token.email || enrollment.studentEmail,
        name: enrollment.studentName
      },
      back_urls: {
        success: `${returnUrl || 'http://localhost:5173/payment-result'}?status=success&type=matricula`,
        failure: `${returnUrl || 'http://localhost:5173/payment-result'}?status=failure&type=matricula`,
        pending: `${returnUrl || 'http://localhost:5173/payment-result'}?status=pending&type=matricula`
      },
      auto_return: 'approved',
      external_reference: `matricula_${enrollmentId}_${Date.now()}`,
      metadata: {
        user_id: userId,
        enrollment_id: enrollmentId,
        student_id: enrollment.studentId,
        type: 'matricula'
      },
      notification_url: functions.config().app?.webhook_url || 'https://your-project.cloudfunctions.net/mercadopagoWebhook'
    };

    const response = await mp.preferences.create(preference);

    console.log('Matricula preference created:', response.body.id);

    return {
      success: true,
      preferenceId: response.body.id,
      initPoint: response.body.init_point,
      sandboxInitPoint: response.body.sandbox_init_point
    };

  } catch (error) {
    console.error('Error creating matricula payment:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Create MercadoPago preference for monthly fee payment
 */
exports.createMonthlyFeePayment = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { feeId, returnUrl } = data;
  const userId = context.auth.uid;

  console.log('Creating monthly fee payment preference:', { feeId, userId });

  try {
    // Get fee
    const feeDoc = await db.collection('monthly_fees').doc(feeId).get();

    if (!feeDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Cuota no encontrada');
    }

    const fee = feeDoc.data();

    // Get enrollment to verify permissions
    const enrollmentDoc = await db.collection('student_enrollments').doc(fee.enrollmentId).get();

    if (!enrollmentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Inscripción no encontrada');
    }

    const enrollment = enrollmentDoc.data();

    // Verify user is student or guardian
    if (enrollment.studentId !== userId && enrollment.guardianId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'No autorizado');
    }

    // Check if already paid
    if (fee.status === 'paid') {
      throw new functions.https.HttpsError('already-exists', 'Cuota ya pagada');
    }

    // Calculate total amount (includes late fee if any)
    const totalAmount = fee.finalAmount + (fee.lateFee || 0);

    // Configure MercadoPago
    const mp = getMercadoPagoClient();

    // Create preference
    const preference = {
      items: [
        {
          title: `Cuota ${fee.monthName} - ${fee.studentName}`,
          description: fee.lateFee > 0
            ? `Incluye recargo por mora de $${fee.lateFee}`
            : `Cuota mensual - ${fee.monthName}`,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: totalAmount
        }
      ],
      payer: {
        email: context.auth.token.email || fee.studentEmail,
        name: fee.studentName
      },
      back_urls: {
        success: `${returnUrl || 'http://localhost:5173/payment-result'}?status=success&type=cuota`,
        failure: `${returnUrl || 'http://localhost:5173/payment-result'}?status=failure&type=cuota`,
        pending: `${returnUrl || 'http://localhost:5173/payment-result'}?status=pending&type=cuota`
      },
      auto_return: 'approved',
      external_reference: `cuota_${feeId}_${Date.now()}`,
      metadata: {
        user_id: userId,
        fee_id: feeId,
        student_id: fee.studentId,
        type: 'monthly_fee'
      },
      notification_url: functions.config().app?.webhook_url || 'https://your-project.cloudfunctions.net/mercadopagoWebhook'
    };

    const response = await mp.preferences.create(preference);

    console.log('Monthly fee preference created:', response.body.id);

    return {
      success: true,
      preferenceId: response.body.id,
      initPoint: response.body.init_point,
      sandboxInitPoint: response.body.sandbox_init_point
    };

  } catch (error) {
    console.error('Error creating monthly fee payment:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Create MercadoPago preference for course purchase
 */
exports.createCoursePayment = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { courseId, returnUrl } = data;
  const userId = context.auth.uid;

  console.log('Creating course payment preference:', { courseId, userId });

  try {
    // Get course
    const courseDoc = await db.collection('courses').doc(courseId).get();

    if (!courseDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Curso no encontrado');
    }

    const course = courseDoc.data();

    // Check if course has a price
    if (!course.price || course.price === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Este curso es gratuito');
    }

    // Check if student already has access
    const existingEnrollment = await db.collection('course_enrollments')
      .where('studentId', '==', userId)
      .where('courseId', '==', courseId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!existingEnrollment.empty) {
      throw new functions.https.HttpsError('already-exists', 'Ya tienes acceso a este curso');
    }

    // Configure MercadoPago
    const mp = getMercadoPagoClient();

    // Create preference
    const preference = {
      items: [
        {
          title: course.name,
          description: course.description || `Acceso completo al curso ${course.name}`,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: course.price
        }
      ],
      payer: {
        email: context.auth.token.email
      },
      back_urls: {
        success: `${returnUrl || 'http://localhost:5173/payment-result'}?status=success&type=course`,
        failure: `${returnUrl || 'http://localhost:5173/payment-result'}?status=failure&type=course`,
        pending: `${returnUrl || 'http://localhost:5173/payment-result'}?status=pending&type=course`
      },
      auto_return: 'approved',
      external_reference: `course_${courseId}_${userId}_${Date.now()}`,
      metadata: {
        user_id: userId,
        course_id: courseId,
        type: 'course_purchase'
      },
      notification_url: functions.config().app?.webhook_url || 'https://your-project.cloudfunctions.net/mercadopagoWebhook'
    };

    const response = await mp.preferences.create(preference);

    console.log('Course payment preference created:', response.body.id);

    return {
      success: true,
      preferenceId: response.body.id,
      initPoint: response.body.init_point,
      sandboxInitPoint: response.body.sandbox_init_point
    };

  } catch (error) {
    console.error('Error creating course payment:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================
// DISCOUNT & SCHOLARSHIP FUNCTIONS
// ============================================

/**
 * Apply family discount to students
 */
exports.applyFamilyDiscount = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { guardianId, studentIds } = data;

  console.log('Applying family discount:', { guardianId, studentCount: studentIds.length });

  try {
    const batch = db.batch();
    const students = [];

    // Process each student
    for (let i = 0; i < studentIds.length; i++) {
      const studentId = studentIds[i];

      // Get student data
      const studentDoc = await db.collection('users').doc(studentId).get();

      if (!studentDoc.exists) {
        console.warn(`Student ${studentId} not found, skipping`);
        continue;
      }

      const student = studentDoc.data();

      // Calculate discount based on order
      let discount = 0;
      if (i === 1) discount = 20;  // 2nd child: 20%
      if (i === 2) discount = 30;  // 3rd child: 30%
      if (i >= 3) discount = 30;   // 4th+ child: 30%

      students.push({
        studentId,
        studentName: student.name,
        order: i + 1,
        discount
      });

      // Update enrollment with discount
      const enrollmentQuery = await db.collection('student_enrollments')
        .where('studentId', '==', studentId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (!enrollmentQuery.empty) {
        const enrollmentRef = enrollmentQuery.docs[0].ref;
        batch.update(enrollmentRef, {
          discount,
          discountReason: discount > 0 ? `Hermano ${i + 1}° - ${discount}% descuento` : 'Sin descuento',
          guardianId,
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    }

    // Create or update family group
    const familyGroupRef = db.collection('family_groups').doc();
    batch.set(familyGroupRef, {
      guardianId,
      students,
      discountSecondChild: 20,
      discountThirdChild: 30,
      active: true,
      createdAt: FieldValue.serverTimestamp()
    });

    await batch.commit();

    console.log(`✅ Family discount applied to ${students.length} students`);

    return {
      success: true,
      familyGroupId: familyGroupRef.id,
      studentsProcessed: students.length
    };

  } catch (error) {
    console.error('Error applying family discount:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Apply scholarship to a student
 */
exports.applyScholarship = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const {
    studentId,
    percentage,
    reason,
    coversMatricula,
    coversCuotas,
    coversCourses,
    startDate,
    endDate
  } = data;

  console.log('Applying scholarship:', { studentId, percentage, reason });

  try {
    // Get student
    const studentDoc = await db.collection('users').doc(studentId).get();

    if (!studentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Estudiante no encontrado');
    }

    const student = studentDoc.data();

    // Create scholarship
    const scholarshipRef = await db.collection('scholarships').add({
      studentId,
      studentName: student.name,
      type: percentage >= 100 ? 'full' : 'partial',
      percentage,
      reason,
      coversMatricula: coversMatricula || false,
      coversCuotas: coversCuotas || true,
      coversCourses: coversCourses || false,
      startDate: startDate ? Timestamp.fromDate(new Date(startDate)) : Timestamp.now(),
      endDate: endDate ? Timestamp.fromDate(new Date(endDate)) : null,
      status: 'active',
      approvedBy: context.auth.uid,
      approvedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp()
    });

    // Update enrollment discount if scholarship covers cuotas
    if (coversCuotas) {
      const enrollmentQuery = await db.collection('student_enrollments')
        .where('studentId', '==', studentId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (!enrollmentQuery.empty) {
        await enrollmentQuery.docs[0].ref.update({
          discount: percentage,
          discountReason: `Beca ${percentage}% - ${reason}`,
          scholarshipId: scholarshipRef.id,
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    }

    console.log(`✅ Scholarship ${percentage}% applied to student ${studentId}`);

    return {
      success: true,
      scholarshipId: scholarshipRef.id
    };

  } catch (error) {
    console.error('Error applying scholarship:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================
// WEBHOOK - MercadoPago IPN
// ============================================

/**
 * MercadoPago Webhook - Instant Payment Notification
 * Receives payment notifications from MercadoPago
 */
exports.mercadopagoWebhook = functions.https.onRequest(async (req, res) => {
  const topic = req.query.topic || req.body.topic || req.body.type;
  const id = req.query.id || req.body.data?.id || req.body.id;

  console.log('MercadoPago webhook received:', { topic, id, body: JSON.stringify(req.body) });

  if (topic === 'payment' && id) {
    try {
      // Configure MercadoPago
      const mp = getMercadoPagoClient();

      // Get payment details
      const payment = await mp.payment.get(id);
      const paymentData = payment.body;

      console.log('Payment data retrieved:', {
        id: paymentData.id,
        status: paymentData.status,
        amount: paymentData.transaction_amount,
        metadata: paymentData.metadata
      });

      // Extract metadata
      const userId = paymentData.metadata.user_id;
      const type = paymentData.metadata.type;

      // Save payment record
      const paymentRecord = {
        userId,
        type,
        amount: paymentData.transaction_amount,
        currency: paymentData.currency_id,
        status: paymentData.status,
        paymentMethod: paymentData.payment_type_id,
        mercadopagoPaymentId: paymentData.id.toString(),
        mercadopagoStatus: paymentData.status,
        mercadopagoStatusDetail: paymentData.status_detail,
        payerEmail: paymentData.payer.email,
        payerName: `${paymentData.payer.first_name || ''} ${paymentData.payer.last_name || ''}`.trim(),
        createdAt: FieldValue.serverTimestamp()
      };

      if (paymentData.status === 'approved') {
        paymentRecord.paidAt = Timestamp.fromDate(new Date(paymentData.date_approved));

        // Process based on payment type
        if (type === 'matricula') {
          const enrollmentId = paymentData.metadata.enrollment_id;
          paymentRecord.enrollmentId = enrollmentId;

          // Mark matricula as paid
          await db.collection('student_enrollments').doc(enrollmentId).update({
            matriculaPaid: true,
            matriculaPaymentId: paymentData.id.toString(),
            matriculaPaidAt: FieldValue.serverTimestamp(),
            status: 'active',
            updatedAt: FieldValue.serverTimestamp()
          });

          console.log(`✅ Matricula paid for enrollment ${enrollmentId}`);

        } else if (type === 'monthly_fee') {
          const feeId = paymentData.metadata.fee_id;
          paymentRecord.feeId = feeId;

          // Mark fee as paid
          await db.collection('monthly_fees').doc(feeId).update({
            status: 'paid',
            paymentId: paymentData.id.toString(),
            mercadopagoPaymentId: paymentData.id.toString(),
            paidAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
          });

          console.log(`✅ Monthly fee paid: ${feeId}`);

        } else if (type === 'course_purchase') {
          const courseId = paymentData.metadata.course_id;
          const studentId = paymentData.metadata.user_id;
          paymentRecord.courseId = courseId;

          // Grant course access
          await db.collection('course_enrollments').add({
            studentId,
            courseId,
            paymentId: paymentData.id.toString(),
            status: 'active',
            enrolledAt: FieldValue.serverTimestamp()
          });

          // Update course student count
          await db.collection('courses').doc(courseId).update({
            studentCount: FieldValue.increment(1)
          });

          console.log(`✅ Course access granted: ${courseId} to ${studentId}`);
        }
      }

      // Save payment record
      await db.collection('payments').add(paymentRecord);

      res.status(200).send('OK');

    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Error');
    }
  } else {
    console.log('Webhook ignored - topic:', topic);
    res.status(200).send('OK');
  }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check subscription/enrollment status
 */
exports.checkSubscriptionStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const userId = context.auth.uid;

  try {
    const enrollmentQuery = await db.collection('student_enrollments')
      .where('studentId', '==', userId)
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (enrollmentQuery.empty) {
      return {
        hasActiveEnrollment: false
      };
    }

    const enrollment = enrollmentQuery.docs[0].data();
    const now = Timestamp.now();

    // Check if expired
    if (enrollment.expiresAt && enrollment.expiresAt.toMillis() < now.toMillis()) {
      await enrollmentQuery.docs[0].ref.update({
        status: 'expired',
        updatedAt: FieldValue.serverTimestamp()
      });

      return {
        hasActiveEnrollment: false
      };
    }

    return {
      hasActiveEnrollment: true,
      enrollment: {
        academicYear: enrollment.academicYear,
        matriculaPaid: enrollment.matriculaPaid,
        cuotaAmount: enrollment.cuotaAmount,
        discount: enrollment.discount,
        expiresAt: enrollment.expiresAt?.toDate()
      }
    };

  } catch (error) {
    console.error('Error checking subscription status:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Get payment history for a student
 */
exports.getPaymentHistory = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const userId = data.studentId || context.auth.uid;
  const limit = data.limit || 50;

  try {
    const paymentsSnapshot = await db.collection('payments')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      paidAt: doc.data().paidAt?.toDate()
    }));

    return {
      success: true,
      payments
    };

  } catch (error) {
    console.error('Error getting payment history:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
