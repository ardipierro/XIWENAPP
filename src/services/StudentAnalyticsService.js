/**
 * @fileoverview Student Analytics Service - Queries about students and assignments
 * @module services/StudentAnalyticsService
 */

import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import logger from '../utils/logger';

class StudentAnalyticsService {
  /**
   * Get students with missing submissions
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Students with missing submissions
   */
  async getStudentsWithMissingSubmissions(filters = {}) {
    try {
      const { course_id, date_range } = filters;

      logger.info('Getting students with missing submissions', 'StudentAnalyticsService', filters);

      // 1. Get active assignments
      let assignmentsQuery = query(
        collection(db, 'assignments'),
        where('status', '==', 'active')
      );

      if (course_id) {
        assignmentsQuery = query(
          collection(db, 'assignments'),
          where('status', '==', 'active'),
          where('courseId', '==', course_id)
        );
      }

      const assignmentsSnap = await getDocs(assignmentsQuery);
      let assignments = assignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter by date range if specified
      if (date_range === 'this_week') {
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        weekStart.setHours(0, 0, 0, 0);

        assignments = assignments.filter(a => {
          const createdAt = a.createdAt?.toDate();
          return createdAt && createdAt >= weekStart;
        });
      }

      // 2. Get all submissions
      const submissionsSnap = await getDocs(collection(db, 'submissions'));
      const submissions = submissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 3. Get enrolled students for each assignment
      const results = [];

      for (const assignment of assignments) {
        // Get enrolled students
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('courseId', '==', assignment.courseId)
        );
        const enrollmentsSnap = await getDocs(enrollmentsQuery);
        const enrolledStudentIds = enrollmentsSnap.docs.map(doc => doc.data().studentId);

        // Get submissions for this assignment
        const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.id && s.status !== 'draft');
        const submittedStudentIds = assignmentSubmissions.map(s => s.studentId);

        // Find missing students
        const missingStudentIds = enrolledStudentIds.filter(id => !submittedStudentIds.includes(id));

        if (missingStudentIds.length > 0) {
          // Get student details
          const studentDetails = await this._getStudentDetails(missingStudentIds);

          results.push({
            assignment: {
              id: assignment.id,
              title: assignment.title,
              deadline: assignment.deadline
            },
            missingStudents: studentDetails,
            count: missingStudentIds.length
          });
        }
      }

      logger.info(`Found ${results.length} assignments with missing submissions`, 'StudentAnalyticsService');

      return results;

    } catch (error) {
      logger.error('Error getting missing submissions', 'StudentAnalyticsService', error);
      return [];
    }
  }

  /**
   * Get students with low performance
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Students with low grades
   */
  async getStudentsWithLowPerformance(filters = {}) {
    try {
      const { threshold = 60, course_id } = filters; // Default: less than 60%

      logger.info('Getting students with low performance', 'StudentAnalyticsService', filters);

      // Get graded submissions
      const submissionsSnap = await getDocs(
        query(collection(db, 'submissions'), where('status', '==', 'graded'))
      );
      const submissions = submissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Group by student
      const studentPerformance = {};

      submissions.forEach(sub => {
        if (sub.grade === null || sub.grade === undefined) return;

        if (!studentPerformance[sub.studentId]) {
          studentPerformance[sub.studentId] = {
            totalGrade: 0,
            count: 0,
            grades: []
          };
        }

        studentPerformance[sub.studentId].totalGrade += sub.grade;
        studentPerformance[sub.studentId].count++;
        studentPerformance[sub.studentId].grades.push({
          grade: sub.grade,
          assignmentId: sub.assignmentId
        });
      });

      // Filter students below threshold
      const lowPerformers = [];

      for (const [studentId, data] of Object.entries(studentPerformance)) {
        const average = data.totalGrade / data.count;

        if (average < threshold) {
          // Get student details
          const studentDoc = await getDoc(doc(db, 'users', studentId));
          const studentData = studentDoc.exists() ? studentDoc.data() : {};

          lowPerformers.push({
            studentId,
            studentName: studentData.name || 'Desconocido',
            studentEmail: studentData.email || '',
            averageGrade: Math.round(average * 10) / 10,
            totalSubmissions: data.count,
            lowestGrade: Math.min(...data.grades.map(g => g.grade)),
            highestGrade: Math.max(...data.grades.map(g => g.grade))
          });
        }
      }

      logger.info(`Found ${lowPerformers.length} students with low performance`, 'StudentAnalyticsService');

      return lowPerformers;

    } catch (error) {
      logger.error('Error getting low performance students', 'StudentAnalyticsService', error);
      return [];
    }
  }

  /**
   * Get students at risk of dropping out
   * @returns {Promise<Array>} Students at risk
   */
  async getStudentsAtRisk() {
    try {
      logger.info('Getting students at risk', 'StudentAnalyticsService');

      const now = new Date();
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Criterion 1: No submissions in last 2 weeks
      const recentSubmissionsQuery = query(
        collection(db, 'submissions'),
        where('submittedAt', '>=', Timestamp.fromDate(twoWeeksAgo))
      );
      const recentSnap = await getDocs(recentSubmissionsQuery);
      const activeStudentIds = [...new Set(recentSnap.docs.map(doc => doc.data().studentId))];

      // Get all enrolled students
      const enrollmentsSnap = await getDocs(collection(db, 'enrollments'));
      const allStudentIds = [...new Set(enrollmentsSnap.docs.map(doc => doc.data().studentId))];

      // Inactive students (no submissions in 2 weeks)
      const inactiveStudentIds = allStudentIds.filter(id => !activeStudentIds.includes(id));

      // Criterion 2: Low performance (< 50%)
      const lowPerformers = await this.getStudentsWithLowPerformance({ threshold: 50 });
      const lowPerformerIds = lowPerformers.map(p => p.studentId);

      // Combine both criteria
      const atRiskIds = [...new Set([...inactiveStudentIds, ...lowPerformerIds])];

      // Get student details
      const atRiskStudents = await this._getStudentDetails(atRiskIds);

      // Add risk reason
      const studentsWithReason = atRiskStudents.map(student => ({
        ...student,
        riskReasons: [
          inactiveStudentIds.includes(student.studentId) && '📉 Inactivo (sin entregas en 2 semanas)',
          lowPerformerIds.includes(student.studentId) && '⚠️ Bajo rendimiento (< 50%)'
        ].filter(Boolean)
      }));

      logger.info(`Found ${studentsWithReason.length} students at risk`, 'StudentAnalyticsService');

      return studentsWithReason;

    } catch (error) {
      logger.error('Error getting at-risk students', 'StudentAnalyticsService', error);
      return [];
    }
  }

  /**
   * Get student details from IDs
   * @private
   */
  async _getStudentDetails(studentIds) {
    const studentDetails = [];

    for (const studentId of studentIds) {
      try {
        const studentDoc = await getDoc(doc(db, 'users', studentId));
        if (studentDoc.exists()) {
          const data = studentDoc.data();
          studentDetails.push({
            studentId,
            studentName: data.name || 'Desconocido',
            studentEmail: data.email || '',
            studentAvatar: data.avatar || null
          });
        } else {
          studentDetails.push({
            studentId,
            studentName: 'Desconocido',
            studentEmail: '',
            studentAvatar: null
          });
        }
      } catch (error) {
        logger.error(`Error getting student ${studentId}`, 'StudentAnalyticsService', error);
      }
    }

    return studentDetails;
  }

  /**
   * Get assignment statistics
   * @param {string} assignmentId - Assignment ID
   * @returns {Promise<Object>} Assignment stats
   */
  async getAssignmentStats(assignmentId) {
    try {
      const submissionsSnap = await getDocs(
        query(collection(db, 'submissions'), where('assignmentId', '==', assignmentId))
      );

      const submissions = submissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const stats = {
        total: submissions.length,
        submitted: submissions.filter(s => s.status !== 'draft').length,
        graded: submissions.filter(s => s.status === 'graded').length,
        pending: submissions.filter(s => s.status === 'submitted').length,
        late: submissions.filter(s => s.isLate).length,
        averageGrade: 0
      };

      const gradedSubmissions = submissions.filter(s => s.grade !== null && s.grade !== undefined);
      if (gradedSubmissions.length > 0) {
        const sum = gradedSubmissions.reduce((acc, s) => acc + s.grade, 0);
        stats.averageGrade = Math.round((sum / gradedSubmissions.length) * 10) / 10;
      }

      return stats;

    } catch (error) {
      logger.error('Error getting assignment stats', 'StudentAnalyticsService', error);
      return null;
    }
  }
}

export default new StudentAnalyticsService();
