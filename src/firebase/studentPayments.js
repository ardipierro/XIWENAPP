/**
 * @fileoverview Student Payment System - Frontend Module
 * @module firebase/studentPayments
 *
 * Client-side functions for calling Cloud Functions
 * Handles all payment operations from the frontend
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './config';
import logger from '../utils/logger';

const functions = getFunctions(app);

// ============================================
// PAYMENT CREATION FUNCTIONS
// ============================================

/**
 * Create MercadoPago preference for matrícula payment
 *
 * @param {string} enrollmentId - Student enrollment ID
 * @param {string} returnUrl - URL to return after payment (optional)
 * @returns {Promise<Object>} Payment preference data
 */
export async function createMatriculaPayment(enrollmentId, returnUrl = null) {
  try {
    logger.info('Creating matricula payment preference', { enrollmentId });

    const createPayment = httpsCallable(functions, 'createMatriculaPayment');
    const result = await createPayment({
      enrollmentId,
      returnUrl: returnUrl || `${window.location.origin}/payment-result`
    });

    logger.info('Matricula payment preference created', result.data);

    return {
      success: true,
      ...result.data
    };

  } catch (error) {
    logger.error('Error creating matricula payment:', error);

    return {
      success: false,
      error: error.message || 'Error al crear preferencia de pago'
    };
  }
}

/**
 * Create MercadoPago preference for monthly fee payment
 *
 * @param {string} feeId - Monthly fee ID
 * @param {string} returnUrl - URL to return after payment (optional)
 * @returns {Promise<Object>} Payment preference data
 */
export async function createMonthlyFeePayment(feeId, returnUrl = null) {
  try {
    logger.info('Creating monthly fee payment preference', { feeId });

    const createPayment = httpsCallable(functions, 'createMonthlyFeePayment');
    const result = await createPayment({
      feeId,
      returnUrl: returnUrl || `${window.location.origin}/payment-result`
    });

    logger.info('Monthly fee payment preference created', result.data);

    return {
      success: true,
      ...result.data
    };

  } catch (error) {
    logger.error('Error creating monthly fee payment:', error);

    return {
      success: false,
      error: error.message || 'Error al crear preferencia de pago'
    };
  }
}

/**
 * Create MercadoPago preference for course purchase
 *
 * @param {string} courseId - Course ID
 * @param {string} returnUrl - URL to return after payment (optional)
 * @returns {Promise<Object>} Payment preference data
 */
export async function createCoursePayment(courseId, returnUrl = null) {
  try {
    logger.info('Creating course payment preference', { courseId });

    const createPayment = httpsCallable(functions, 'createCoursePayment');
    const result = await createPayment({
      courseId,
      returnUrl: returnUrl || `${window.location.origin}/payment-result`
    });

    logger.info('Course payment preference created', result.data);

    return {
      success: true,
      ...result.data
    };

  } catch (error) {
    logger.error('Error creating course payment:', error);

    return {
      success: false,
      error: error.message || 'Error al crear preferencia de pago'
    };
  }
}

// ============================================
// STATUS & HISTORY FUNCTIONS
// ============================================

/**
 * Check current subscription/enrollment status
 *
 * @returns {Promise<Object>} Enrollment status
 */
export async function checkSubscriptionStatus() {
  try {
    logger.info('Checking subscription status');

    const checkStatus = httpsCallable(functions, 'checkSubscriptionStatus');
    const result = await checkStatus();

    return {
      success: true,
      ...result.data
    };

  } catch (error) {
    logger.error('Error checking subscription status:', error);

    return {
      success: false,
      hasActiveEnrollment: false,
      error: error.message
    };
  }
}

/**
 * Get payment history for current user
 *
 * @param {number} limit - Maximum number of payments to retrieve (default: 50)
 * @returns {Promise<Object>} Payment history
 */
export async function getPaymentHistory(limit = 50) {
  try {
    logger.info('Getting payment history', { limit });

    const getHistory = httpsCallable(functions, 'getPaymentHistory');
    const result = await getHistory({ limit });

    return {
      success: true,
      ...result.data
    };

  } catch (error) {
    logger.error('Error getting payment history:', error);

    return {
      success: false,
      payments: [],
      error: error.message
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Redirect to MercadoPago checkout
 *
 * @param {string} initPoint - MercadoPago checkout URL
 * @param {boolean} useSandbox - Use sandbox URL (default: based on env)
 */
export function redirectToCheckout(initPoint, sandboxInitPoint = null) {
  try {
    // Determine if we're in development mode
    const isDevelopment = import.meta.env.DEV;

    // Use sandbox URL in development if available
    const checkoutUrl = isDevelopment && sandboxInitPoint
      ? sandboxInitPoint
      : initPoint;

    logger.info('Redirecting to MercadoPago checkout', { checkoutUrl, isDevelopment });

    // Redirect to checkout
    window.location.href = checkoutUrl;

  } catch (error) {
    logger.error('Error redirecting to checkout:', error);
    throw new Error('No se pudo redirigir al checkout de pago');
  }
}

/**
 * Format currency amount in ARS
 *
 * @param {number} amount - Amount in ARS
 * @returns {string} Formatted amount (e.g., "$15.000")
 */
export function formatCurrency(amount) {
  if (typeof amount !== 'number') {
    return '$0';
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format date for display
 *
 * @param {Date|string|Object} date - Date to format
 * @returns {string} Formatted date (e.g., "10 de Enero, 2025")
 */
export function formatDate(date) {
  if (!date) {
    return '-';
  }

  try {
    let dateObj;

    // Handle Firestore Timestamp
    if (date.toDate) {
      dateObj = date.toDate();
    }
    // Handle string
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    }
    // Handle Date object
    else if (date instanceof Date) {
      dateObj = date;
    }
    else {
      return '-';
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(dateObj);

  } catch (error) {
    logger.error('Error formatting date:', error);
    return '-';
  }
}

/**
 * Get status badge variant based on payment status
 *
 * @param {string} status - Payment status (pending, paid, overdue, forgiven)
 * @returns {string} Badge variant (default, success, danger, warning)
 */
export function getStatusVariant(status) {
  const statusMap = {
    'paid': 'success',
    'pending': 'warning',
    'overdue': 'danger',
    'forgiven': 'info',
    'approved': 'success',
    'rejected': 'danger',
    'active': 'success',
    'expired': 'default',
    'suspended': 'danger'
  };

  return statusMap[status] || 'default';
}

/**
 * Get status label in Spanish
 *
 * @param {string} status - Payment status
 * @returns {string} Spanish label
 */
export function getStatusLabel(status) {
  const statusLabels = {
    'pending': 'Pendiente',
    'paid': 'Pagado',
    'overdue': 'Vencido',
    'forgiven': 'Condonado',
    'approved': 'Aprobado',
    'rejected': 'Rechazado',
    'active': 'Activo',
    'expired': 'Expirado',
    'suspended': 'Suspendido',
    'graduated': 'Graduado'
  };

  return statusLabels[status] || status;
}

/**
 * Calculate days until due date
 *
 * @param {Date|string|Object} dueDate - Due date
 * @returns {number} Days until due (negative if overdue)
 */
export function getDaysUntilDue(dueDate) {
  if (!dueDate) {
    return 0;
  }

  try {
    let dateObj;

    // Handle Firestore Timestamp
    if (dueDate.toDate) {
      dateObj = dueDate.toDate();
    }
    // Handle string
    else if (typeof dueDate === 'string') {
      dateObj = new Date(dueDate);
    }
    // Handle Date object
    else if (dueDate instanceof Date) {
      dateObj = dueDate;
    }
    else {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timeDiff = dateObj.getTime() - today.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    return daysDiff;

  } catch (error) {
    logger.error('Error calculating days until due:', error);
    return 0;
  }
}
