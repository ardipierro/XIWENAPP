/**
 * @fileoverview Firebase Cloud Functions - Main Entry Point
 * @module functions/index
 *
 * XIWEN App Cloud Functions
 * - Student Payment System (MercadoPago integration)
 * - Cron jobs for monthly fee generation
 * - Webhooks for payment notifications
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Export student payment functions
const {
  generateMonthlyFees,
  checkOverdueFees,
  createMatriculaPayment,
  createMonthlyFeePayment,
  createCoursePayment,
  applyFamilyDiscount,
  applyScholarship,
  mercadopagoWebhook,
  checkSubscriptionStatus,
  getPaymentHistory
} = require('./studentPayments');

// Student Payment Functions
exports.generateMonthlyFees = generateMonthlyFees;
exports.checkOverdueFees = checkOverdueFees;
exports.createMatriculaPayment = createMatriculaPayment;
exports.createMonthlyFeePayment = createMonthlyFeePayment;
exports.createCoursePayment = createCoursePayment;
exports.applyFamilyDiscount = applyFamilyDiscount;
exports.applyScholarship = applyScholarship;
exports.mercadopagoWebhook = mercadopagoWebhook;
exports.checkSubscriptionStatus = checkSubscriptionStatus;
exports.getPaymentHistory = getPaymentHistory;
