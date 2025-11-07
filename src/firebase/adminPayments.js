/**
 * @fileoverview Admin Payment System - Frontend Module
 * @module firebase/adminPayments
 *
 * Admin functions for managing payments, scholarships, and discounts
 */

import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './config';
import logger from '../utils/logger';

const db = getFirestore(app);
const functions = getFunctions(app);

// ============================================
// DISCOUNT & SCHOLARSHIP FUNCTIONS
// ============================================

/**
 * Apply family discount to multiple students
 *
 * @param {string} guardianId - Guardian/parent ID
 * @param {Array<string>} studentIds - Array of student IDs (ordered)
 * @returns {Promise<Object>} Result
 */
export async function applyFamilyDiscount(guardianId, studentIds) {
  try {
    logger.info('Applying family discount', { guardianId, studentCount: studentIds.length });

    const applyDiscount = httpsCallable(functions, 'applyFamilyDiscount');
    const result = await applyDiscount({ guardianId, studentIds });

    logger.info('Family discount applied successfully', result.data);

    return {
      success: true,
      ...result.data
    };

  } catch (error) {
    logger.error('Error applying family discount:', error);

    return {
      success: false,
      error: error.message || 'Error al aplicar descuento familiar'
    };
  }
}

/**
 * Apply scholarship to a student
 *
 * @param {Object} scholarshipData - Scholarship data
 * @param {string} scholarshipData.studentId - Student ID
 * @param {number} scholarshipData.percentage - Scholarship percentage (0-100)
 * @param {string} scholarshipData.reason - Reason for scholarship
 * @param {boolean} scholarshipData.coversMatricula - Covers enrollment fee
 * @param {boolean} scholarshipData.coversCuotas - Covers monthly fees
 * @param {boolean} scholarshipData.coversCourses - Covers course purchases
 * @param {string} scholarshipData.startDate - Start date (ISO string, optional)
 * @param {string} scholarshipData.endDate - End date (ISO string, optional)
 * @returns {Promise<Object>} Result
 */
export async function applyScholarship(scholarshipData) {
  try {
    logger.info('Applying scholarship', scholarshipData);

    const applyBeca = httpsCallable(functions, 'applyScholarship');
    const result = await applyBeca(scholarshipData);

    logger.info('Scholarship applied successfully', result.data);

    return {
      success: true,
      ...result.data
    };

  } catch (error) {
    logger.error('Error applying scholarship:', error);

    return {
      success: false,
      error: error.message || 'Error al aplicar beca'
    };
  }
}

// ============================================
// QUERY FUNCTIONS - Student Enrollments
// ============================================

/**
 * Get all student enrollments
 *
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status (active, pending, suspended, etc.)
 * @param {string} filters.academicYear - Filter by academic year
 * @returns {Promise<Object>} Enrollments data
 */
export async function getAllEnrollments(filters = {}) {
  try {
    logger.info('Getting all enrollments', filters);

    let q = collection(db, 'student_enrollments');
    const constraints = [];

    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    if (filters.academicYear) {
      constraints.push(where('academicYear', '==', filters.academicYear));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (constraints.length > 0) {
      q = query(q, ...constraints);
    }

    const snapshot = await getDocs(q);
    const enrollments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    logger.info(`Retrieved ${enrollments.length} enrollments`);

    return {
      success: true,
      enrollments
    };

  } catch (error) {
    logger.error('Error getting enrollments:', error);

    return {
      success: false,
      enrollments: [],
      error: error.message
    };
  }
}

/**
 * Get enrollment by ID
 *
 * @param {string} enrollmentId - Enrollment ID
 * @returns {Promise<Object>} Enrollment data
 */
export async function getEnrollmentById(enrollmentId) {
  try {
    const docRef = doc(db, 'student_enrollments', enrollmentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Inscripción no encontrada'
      };
    }

    return {
      success: true,
      enrollment: {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate()
      }
    };

  } catch (error) {
    logger.error('Error getting enrollment:', error);

    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// QUERY FUNCTIONS - Monthly Fees
// ============================================

/**
 * Get all monthly fees
 *
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status (pending, paid, overdue, forgiven)
 * @param {string} filters.month - Filter by month (YYYY-MM)
 * @param {string} filters.studentId - Filter by student ID
 * @returns {Promise<Object>} Fees data
 */
export async function getAllMonthlyFees(filters = {}) {
  try {
    logger.info('Getting all monthly fees', filters);

    let q = collection(db, 'monthly_fees');
    const constraints = [];

    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    if (filters.month) {
      constraints.push(where('month', '==', filters.month));
    }

    if (filters.studentId) {
      constraints.push(where('studentId', '==', filters.studentId));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (constraints.length > 0) {
      q = query(q, ...constraints);
    }

    const snapshot = await getDocs(q);
    const fees = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dueDate: doc.data().dueDate?.toDate(),
      paidAt: doc.data().paidAt?.toDate(),
      createdAt: doc.data().createdAt?.toDate()
    }));

    logger.info(`Retrieved ${fees.length} monthly fees`);

    return {
      success: true,
      fees
    };

  } catch (error) {
    logger.error('Error getting monthly fees:', error);

    return {
      success: false,
      fees: [],
      error: error.message
    };
  }
}

// ============================================
// QUERY FUNCTIONS - Payments
// ============================================

/**
 * Get all payments
 *
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status (approved, pending, rejected)
 * @param {string} filters.type - Filter by type (matricula, monthly_fee, course_purchase)
 * @param {string} filters.userId - Filter by user ID
 * @param {number} filters.limit - Limit results (default: 100)
 * @returns {Promise<Object>} Payments data
 */
export async function getAllPayments(filters = {}) {
  try {
    logger.info('Getting all payments', filters);

    let q = collection(db, 'payments');
    const constraints = [];

    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    if (filters.type) {
      constraints.push(where('type', '==', filters.type));
    }

    if (filters.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (constraints.length > 0) {
      q = query(q, ...constraints);
    }

    const snapshot = await getDocs(q);
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      paidAt: doc.data().paidAt?.toDate(),
      createdAt: doc.data().createdAt?.toDate()
    }));

    // Apply limit after getting all docs (Firestore limit not applied in query to avoid index issues)
    const limit = filters.limit || 100;
    const limitedPayments = payments.slice(0, limit);

    logger.info(`Retrieved ${limitedPayments.length} payments`);

    return {
      success: true,
      payments: limitedPayments,
      total: payments.length
    };

  } catch (error) {
    logger.error('Error getting payments:', error);

    return {
      success: false,
      payments: [],
      total: 0,
      error: error.message
    };
  }
}

// ============================================
// QUERY FUNCTIONS - Scholarships
// ============================================

/**
 * Get all scholarships
 *
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status (active, expired)
 * @param {string} filters.studentId - Filter by student ID
 * @returns {Promise<Object>} Scholarships data
 */
export async function getAllScholarships(filters = {}) {
  try {
    logger.info('Getting all scholarships', filters);

    let q = collection(db, 'scholarships');
    const constraints = [];

    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    if (filters.studentId) {
      constraints.push(where('studentId', '==', filters.studentId));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (constraints.length > 0) {
      q = query(q, ...constraints);
    }

    const snapshot = await getDocs(q);
    const scholarships = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate(),
      endDate: doc.data().endDate?.toDate(),
      approvedAt: doc.data().approvedAt?.toDate(),
      createdAt: doc.data().createdAt?.toDate()
    }));

    logger.info(`Retrieved ${scholarships.length} scholarships`);

    return {
      success: true,
      scholarships
    };

  } catch (error) {
    logger.error('Error getting scholarships:', error);

    return {
      success: false,
      scholarships: [],
      error: error.message
    };
  }
}

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

/**
 * Get payment statistics
 *
 * @param {Object} filters - Optional filters
 * @param {string} filters.month - Filter by month (YYYY-MM)
 * @param {string} filters.academicYear - Filter by academic year
 * @returns {Promise<Object>} Statistics
 */
export async function getPaymentStatistics(filters = {}) {
  try {
    logger.info('Getting payment statistics', filters);

    // Get enrollments
    const enrollmentsResult = await getAllEnrollments({
      academicYear: filters.academicYear
    });
    const enrollments = enrollmentsResult.enrollments || [];

    // Get monthly fees
    const feesResult = await getAllMonthlyFees({
      month: filters.month
    });
    const fees = feesResult.fees || [];

    // Get payments
    const paymentsResult = await getAllPayments({ limit: 500 });
    const payments = paymentsResult.payments || [];

    // Calculate statistics
    const stats = {
      enrollments: {
        total: enrollments.length,
        active: enrollments.filter(e => e.status === 'active').length,
        pending: enrollments.filter(e => e.status === 'pending').length,
        suspended: enrollments.filter(e => e.status === 'suspended').length,
        matriculaPaid: enrollments.filter(e => e.matriculaPaid).length
      },
      monthlyFees: {
        total: fees.length,
        paid: fees.filter(f => f.status === 'paid').length,
        pending: fees.filter(f => f.status === 'pending').length,
        overdue: fees.filter(f => f.status === 'overdue').length,
        totalAmount: fees.reduce((sum, f) => sum + (f.finalAmount || 0), 0),
        collectedAmount: fees
          .filter(f => f.status === 'paid')
          .reduce((sum, f) => sum + (f.finalAmount || 0), 0)
      },
      payments: {
        total: payments.length,
        approved: payments.filter(p => p.status === 'approved').length,
        pending: payments.filter(p => p.status === 'pending').length,
        rejected: payments.filter(p => p.status === 'rejected').length,
        totalRevenue: payments
          .filter(p => p.status === 'approved')
          .reduce((sum, p) => sum + (p.amount || 0), 0)
      }
    };

    logger.info('Payment statistics calculated', stats);

    return {
      success: true,
      stats
    };

  } catch (error) {
    logger.error('Error getting payment statistics:', error);

    return {
      success: false,
      stats: null,
      error: error.message
    };
  }
}

/**
 * Update fee status manually (admin only)
 *
 * @param {string} feeId - Fee ID
 * @param {string} newStatus - New status (paid, forgiven, etc.)
 * @param {string} reason - Reason for status change
 * @returns {Promise<Object>} Result
 */
export async function updateFeeStatus(feeId, newStatus, reason = '') {
  try {
    logger.info('Updating fee status', { feeId, newStatus, reason });

    const feeRef = doc(db, 'monthly_fees', feeId);

    await updateDoc(feeRef, {
      status: newStatus,
      adminNote: reason,
      updatedAt: Timestamp.now()
    });

    logger.info('Fee status updated successfully');

    return {
      success: true
    };

  } catch (error) {
    logger.error('Error updating fee status:', error);

    return {
      success: false,
      error: error.message
    };
  }
}
