/**
 * @fileoverview Firebase operations for assignments
 * @module firebase/assignments
 */

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import logger from '../utils/logger';

/**
 * Create a new assignment
 * @param {Object} assignmentData - Assignment data
 * @returns {Promise<Object>} Result with id
 */
export async function createAssignment(assignmentData) {
  try {
    const assignmentsRef = collection(db, 'assignments');
    const docRef = await addDoc(assignmentsRef, {
      ...assignmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active' // active, archived, draft
    });

    logger.info(`Created assignment: ${docRef.id}`, 'Assignments');
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('Error creating assignment', 'Assignments', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get assignment by ID
 * @param {string} assignmentId - Assignment ID
 * @returns {Promise<Object|null>} Assignment data
 */
export async function getAssignment(assignmentId) {
  try {
    const docRef = doc(db, 'assignments', assignmentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    logger.error(`Error getting assignment ${assignmentId}`, 'Assignments', error);
    return null;
  }
}

/**
 * Get all assignments for a teacher
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Array>} Array of assignments
 */
export async function getAssignmentsByTeacher(teacherId) {
  try {
    const assignmentsRef = collection(db, 'assignments');
    const q = query(
      assignmentsRef,
      where('teacherId', '==', teacherId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);

    const assignments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by deadline descending
    assignments.sort((a, b) => {
      const dateA = a.deadline?.toMillis?.() || 0;
      const dateB = b.deadline?.toMillis?.() || 0;
      return dateB - dateA;
    });

    return assignments;
  } catch (error) {
    logger.error('Error getting assignments by teacher', 'Assignments', error);
    return [];
  }
}

/**
 * Get assignments for a course
 * @param {string} courseId - Course ID
 * @returns {Promise<Array>} Array of assignments
 */
export async function getAssignmentsByCourse(courseId) {
  try {
    const assignmentsRef = collection(db, 'assignments');
    const q = query(
      assignmentsRef,
      where('courseId', '==', courseId),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);

    const assignments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by deadline
    assignments.sort((a, b) => {
      const dateA = a.deadline?.toMillis?.() || 0;
      const dateB = b.deadline?.toMillis?.() || 0;
      return dateA - dateB;
    });

    return assignments;
  } catch (error) {
    logger.error('Error getting assignments by course', 'Assignments', error);
    return [];
  }
}

/**
 * Get assignments for a student
 * @param {string} studentId - Student ID
 * @returns {Promise<Array>} Array of assignments with submission status
 */
export async function getAssignmentsForStudent(studentId) {
  try {
    // Get student's enrollments first
    const enrollmentsRef = collection(db, 'enrollments');
    const enrollmentsQuery = query(enrollmentsRef, where('studentId', '==', studentId));
    const enrollmentsSnap = await getDocs(enrollmentsQuery);

    const courseIds = enrollmentsSnap.docs.map(doc => doc.data().courseId);

    if (courseIds.length === 0) {
      return [];
    }

    // Get assignments for enrolled courses
    const assignmentsRef = collection(db, 'assignments');
    const q = query(
      assignmentsRef,
      where('courseId', 'in', courseIds.slice(0, 10)), // Firestore 'in' limit is 10
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);

    const assignments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get submissions for this student
    const submissionsRef = collection(db, 'submissions');
    const submissionsQuery = query(submissionsRef, where('studentId', '==', studentId));
    const submissionsSnap = await getDocs(submissionsQuery);

    const submissionsMap = {};
    submissionsSnap.docs.forEach(doc => {
      const data = doc.data();
      submissionsMap[data.assignmentId] = { id: doc.id, ...data };
    });

    // Merge assignments with submission status
    const assignmentsWithStatus = assignments.map(assignment => ({
      ...assignment,
      submission: submissionsMap[assignment.id] || null,
      isSubmitted: !!submissionsMap[assignment.id],
      isGraded: submissionsMap[assignment.id]?.status === 'graded',
      isOverdue: assignment.deadline && assignment.deadline.toDate() < new Date() && !submissionsMap[assignment.id]
    }));

    // Sort by deadline
    assignmentsWithStatus.sort((a, b) => {
      const dateA = a.deadline?.toMillis?.() || 0;
      const dateB = b.deadline?.toMillis?.() || 0;
      return dateA - dateB;
    });

    return assignmentsWithStatus;
  } catch (error) {
    logger.error('Error getting assignments for student', 'Assignments', error);
    return [];
  }
}

/**
 * Update an assignment
 * @param {string} assignmentId - Assignment ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Result
 */
export async function updateAssignment(assignmentId, updates) {
  try {
    const docRef = doc(db, 'assignments', assignmentId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    logger.info(`Updated assignment: ${assignmentId}`, 'Assignments');
    return { success: true };
  } catch (error) {
    logger.error(`Error updating assignment ${assignmentId}`, 'Assignments', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete an assignment (soft delete)
 * @param {string} assignmentId - Assignment ID
 * @returns {Promise<Object>} Result
 */
export async function deleteAssignment(assignmentId) {
  try {
    const docRef = doc(db, 'assignments', assignmentId);
    await updateDoc(docRef, {
      status: 'deleted',
      deletedAt: serverTimestamp()
    });

    logger.info(`Deleted assignment: ${assignmentId}`, 'Assignments');
    return { success: true };
  } catch (error) {
    logger.error(`Error deleting assignment ${assignmentId}`, 'Assignments', error);
    return { success: false, error: error.message };
  }
}

/**
 * Archive an assignment
 * @param {string} assignmentId - Assignment ID
 * @returns {Promise<Object>} Result
 */
export async function archiveAssignment(assignmentId) {
  try {
    const docRef = doc(db, 'assignments', assignmentId);
    await updateDoc(docRef, {
      status: 'archived',
      archivedAt: serverTimestamp()
    });

    logger.info(`Archived assignment: ${assignmentId}`, 'Assignments');
    return { success: true };
  } catch (error) {
    logger.error(`Error archiving assignment ${assignmentId}`, 'Assignments', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get assignment statistics
 * @param {string} assignmentId - Assignment ID
 * @returns {Promise<Object>} Statistics
 */
export async function getAssignmentStats(assignmentId) {
  try {
    const submissionsRef = collection(db, 'submissions');
    const q = query(submissionsRef, where('assignmentId', '==', assignmentId));
    const snapshot = await getDocs(q);

    const submissions = snapshot.docs.map(doc => doc.data());

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
      stats.averageGrade = sum / gradedSubmissions.length;
    }

    return stats;
  } catch (error) {
    logger.error(`Error getting stats for assignment ${assignmentId}`, 'Assignments', error);
    return null;
  }
}

export default {
  createAssignment,
  getAssignment,
  getAssignmentsByTeacher,
  getAssignmentsByCourse,
  getAssignmentsForStudent,
  updateAssignment,
  deleteAssignment,
  archiveAssignment,
  getAssignmentStats
};
