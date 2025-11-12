/**
 * @fileoverview Payment Analytics Service - Queries about payments and credits
 * @module services/PaymentAnalyticsService
 */

import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import logger from '../utils/logger';

class PaymentAnalyticsService {
  /**
   * Get overdue payments
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Overdue payments
   */
  async getOverduePayments(filters = {}) {
    try {
      logger.info('Getting overdue payments', 'PaymentAnalyticsService');

      const now = Timestamp.now();
      const results = [];

      // Check monthly_fees collection
      const feesSnap = await getDocs(collection(db, 'monthly_fees'));

      for (const feeDoc of feesSnap.docs) {
        const feeData = feeDoc.data();

        // Check if pending and overdue
        if (feeData.status === 'pending' && feeData.dueDate && feeData.dueDate.toMillis() < now.toMillis()) {
          const studentDoc = await getDoc(doc(db, 'users', feeData.studentId));
          const studentData = studentDoc.exists() ? studentDoc.data() : {};

          const daysOverdue = this._calculateDaysOverdue(feeData.dueDate);

          results.push({
            id: feeDoc.id,
            type: 'monthly_fee',
            studentId: feeData.studentId,
            studentName: studentData.name || 'Desconocido',
            studentEmail: studentData.email || '',
            amount: feeData.amount || 0,
            dueDate: feeData.dueDate,
            daysOverdue,
            description: feeData.description || 'Cuota mensual'
          });
        }
      }

      // Sort by days overdue (most overdue first)
      results.sort((a, b) => b.daysOverdue - a.daysOverdue);

      logger.info(`Found ${results.length} overdue payments`, 'PaymentAnalyticsService');

      return results;

    } catch (error) {
      logger.error('Error getting overdue payments', 'PaymentAnalyticsService', error);
      return [];
    }
  }

  /**
   * Get upcoming payments (due in next 7 days)
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Upcoming payments
   */
  async getUpcomingPayments(filters = {}) {
    try {
      const { days_ahead = 7 } = filters;

      logger.info(`Getting upcoming payments (next ${days_ahead} days)`, 'PaymentAnalyticsService');

      const now = new Date();
      const futureDate = new Date(now.getTime() + days_ahead * 24 * 60 * 60 * 1000);
      const results = [];

      // Check monthly_fees collection
      const feesSnap = await getDocs(collection(db, 'monthly_fees'));

      for (const feeDoc of feesSnap.docs) {
        const feeData = feeDoc.data();

        // Check if pending and due within date range
        if (feeData.status === 'pending' && feeData.dueDate) {
          const dueDate = feeData.dueDate.toDate();

          if (dueDate >= now && dueDate <= futureDate) {
            const studentDoc = await getDoc(doc(db, 'users', feeData.studentId));
            const studentData = studentDoc.exists() ? studentDoc.data() : {};

            const daysUntilDue = this._calculateDaysUntilDue(feeData.dueDate);

            results.push({
              id: feeDoc.id,
              type: 'monthly_fee',
              studentId: feeData.studentId,
              studentName: studentData.name || 'Desconocido',
              studentEmail: studentData.email || '',
              amount: feeData.amount || 0,
              dueDate: feeData.dueDate,
              daysUntilDue,
              description: feeData.description || 'Cuota mensual'
            });
          }
        }
      }

      // Sort by days until due (soonest first)
      results.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

      logger.info(`Found ${results.length} upcoming payments`, 'PaymentAnalyticsService');

      return results;

    } catch (error) {
      logger.error('Error getting upcoming payments', 'PaymentAnalyticsService', error);
      return [];
    }
  }

  /**
   * Get student payment history
   * @param {string} studentId - Student ID
   * @returns {Promise<Array>} Payment history
   */
  async getStudentPaymentHistory(studentId) {
    try {
      logger.info(`Getting payment history for student ${studentId}`, 'PaymentAnalyticsService');

      const paymentsSnap = await getDocs(
        query(collection(db, 'payments'), where('studentId', '==', studentId))
      );

      const payments = paymentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by date (newest first)
      payments.sort((a, b) => {
        const dateA = a.createdAt?.toMillis() || 0;
        const dateB = b.createdAt?.toMillis() || 0;
        return dateB - dateA;
      });

      return payments;

    } catch (error) {
      logger.error('Error getting payment history', 'PaymentAnalyticsService', error);
      return [];
    }
  }

  /**
   * Get students with low credits
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Students with low credits
   */
  async getStudentsWithLowCredits(filters = {}) {
    try {
      const { threshold = 2 } = filters; // Default: less than 2 credits

      logger.info(`Getting students with less than ${threshold} credits`, 'PaymentAnalyticsService');

      const creditsSnap = await getDocs(collection(db, 'user_credits'));
      const results = [];

      for (const creditDoc of creditsSnap.docs) {
        const creditData = creditDoc.data();

        if ((creditData.availableCredits || 0) < threshold) {
          const studentDoc = await getDoc(doc(db, 'users', creditData.userId));
          const studentData = studentDoc.exists() ? studentDoc.data() : {};

          results.push({
            studentId: creditData.userId,
            studentName: studentData.name || 'Desconocido',
            studentEmail: studentData.email || '',
            availableCredits: creditData.availableCredits || 0,
            totalUsed: creditData.totalUsed || 0,
            totalPurchased: creditData.totalPurchased || 0
          });
        }
      }

      logger.info(`Found ${results.length} students with low credits`, 'PaymentAnalyticsService');

      return results;

    } catch (error) {
      logger.error('Error getting students with low credits', 'PaymentAnalyticsService', error);
      return [];
    }
  }

  /**
   * Get payment summary for all students
   * @returns {Promise<Object>} Payment summary
   */
  async getPaymentSummary() {
    try {
      logger.info('Getting payment summary', 'PaymentAnalyticsService');

      const [overdue, upcoming] = await Promise.all([
        this.getOverduePayments(),
        this.getUpcomingPayments({ days_ahead: 7 })
      ]);

      const totalOverdueAmount = overdue.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const totalUpcomingAmount = upcoming.reduce((sum, payment) => sum + (payment.amount || 0), 0);

      return {
        overdueCount: overdue.length,
        overdueAmount: totalOverdueAmount,
        upcomingCount: upcoming.length,
        upcomingAmount: totalUpcomingAmount,
        overduePayments: overdue.slice(0, 5), // Top 5
        upcomingPayments: upcoming.slice(0, 5) // Top 5
      };

    } catch (error) {
      logger.error('Error getting payment summary', 'PaymentAnalyticsService', error);
      return {
        overdueCount: 0,
        overdueAmount: 0,
        upcomingCount: 0,
        upcomingAmount: 0,
        overduePayments: [],
        upcomingPayments: []
      };
    }
  }

  /**
   * Calculate days overdue
   * @private
   */
  _calculateDaysOverdue(dueDate) {
    const now = new Date();
    const due = dueDate.toDate();
    const diffTime = now - due;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate days until due
   * @private
   */
  _calculateDaysUntilDue(dueDate) {
    const now = new Date();
    const due = dueDate.toDate();
    const diffTime = due - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export default new PaymentAnalyticsService();
