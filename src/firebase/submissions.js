/**
 * @fileoverview Firebase operations for assignment submissions
 * @module firebase/submissions
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
 * Create or update a submission
 * @param {Object} submissionData - Submission data
 * @returns {Promise<Object>} Result with id
 */
export async function createSubmission(submissionData) {
  try {
    // Check if submission already exists
    const submissionsRef = collection(db, 'submissions');
    const q = query(
      submissionsRef,
      where('assignmentId', '==', submissionData.assignmentId),
      where('studentId', '==', submissionData.studentId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Update existing submission
      const existingDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'submissions', existingDoc.id), {
        ...submissionData,
        updatedAt: serverTimestamp()
      });

      logger.info(`Updated submission: ${existingDoc.id}`, 'Submissions');
      return { success: true, id: existingDoc.id, updated: true };
    }

    // Create new submission
    const docRef = await addDoc(submissionsRef, {
      ...submissionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: submissionData.status || 'draft' // draft, submitted, graded, returned
    });

    logger.info(`Created submission: ${docRef.id}`, 'Submissions');
    return { success: true, id: docRef.id, updated: false };
  } catch (error) {
    logger.error('Error creating submission', 'Submissions', error);
    return { success: false, error: error.message };
  }
}

/**
 * Submit an assignment (change status from draft to submitted)
 * @param {string} submissionId - Submission ID
 * @param {Object} assignmentData - Assignment data (for deadline check)
 * @returns {Promise<Object>} Result
 */
export async function submitAssignment(submissionId, assignmentData) {
  try {
    const now = new Date();
    const deadline = assignmentData.deadline?.toDate?.() || null;
    const isLate = deadline && now > deadline;

    const docRef = doc(db, 'submissions', submissionId);
    await updateDoc(docRef, {
      status: 'submitted',
      submittedAt: serverTimestamp(),
      isLate,
      updatedAt: serverTimestamp()
    });

    logger.info(`Submitted assignment: ${submissionId}`, 'Submissions');
    return { success: true, isLate };
  } catch (error) {
    logger.error(`Error submitting assignment ${submissionId}`, 'Submissions', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get submission by ID
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object|null>} Submission data
 */
export async function getSubmission(submissionId) {
  try {
    const docRef = doc(db, 'submissions', submissionId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    logger.error(`Error getting submission ${submissionId}`, 'Submissions', error);
    return null;
  }
}

/**
 * Get submission by assignment and student
 * @param {string} assignmentId - Assignment ID
 * @param {string} studentId - Student ID
 * @returns {Promise<Object|null>} Submission data
 */
export async function getSubmissionByAssignmentAndStudent(assignmentId, studentId) {
  try {
    const submissionsRef = collection(db, 'submissions');
    const q = query(
      submissionsRef,
      where('assignmentId', '==', assignmentId),
      where('studentId', '==', studentId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    logger.error('Error getting submission', 'Submissions', error);
    return null;
  }
}

/**
 * Get all submissions for an assignment
 * @param {string} assignmentId - Assignment ID
 * @returns {Promise<Array>} Array of submissions with student info
 */
export async function getSubmissionsByAssignment(assignmentId) {
  try {
    const submissionsRef = collection(db, 'submissions');
    const q = query(
      submissionsRef,
      where('assignmentId', '==', assignmentId)
    );
    const snapshot = await getDocs(q);

    const submissions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get student info for each submission
    const studentsRef = collection(db, 'users');
    const studentsPromises = submissions.map(async (submission) => {
      const studentDoc = await getDoc(doc(studentsRef, submission.studentId));
      if (studentDoc.exists()) {
        return {
          ...submission,
          studentName: studentDoc.data().name,
          studentEmail: studentDoc.data().email
        };
      }
      return submission;
    });

    const submissionsWithStudents = await Promise.all(studentsPromises);

    // Sort by submission date
    submissionsWithStudents.sort((a, b) => {
      const dateA = a.submittedAt?.toMillis?.() || 0;
      const dateB = b.submittedAt?.toMillis?.() || 0;
      return dateB - dateA;
    });

    return submissionsWithStudents;
  } catch (error) {
    logger.error('Error getting submissions by assignment', 'Submissions', error);
    return [];
  }
}

/**
 * Get all submissions for a student
 * @param {string} studentId - Student ID
 * @returns {Promise<Array>} Array of submissions
 */
export async function getSubmissionsByStudent(studentId) {
  try {
    const submissionsRef = collection(db, 'submissions');
    const q = query(
      submissionsRef,
      where('studentId', '==', studentId)
    );
    const snapshot = await getDocs(q);

    const submissions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by submission date
    submissions.sort((a, b) => {
      const dateA = a.submittedAt?.toMillis?.() || 0;
      const dateB = b.submittedAt?.toMillis?.() || 0;
      return dateB - dateA;
    });

    return submissions;
  } catch (error) {
    logger.error('Error getting submissions by student', 'Submissions', error);
    return [];
  }
}

/**
 * Grade a submission
 * @param {string} submissionId - Submission ID
 * @param {number} grade - Grade (0-100 or custom scale)
 * @param {string} feedback - Teacher feedback
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} Result
 */
export async function gradeSubmission(submissionId, grade, feedback, teacherId) {
  try {
    const docRef = doc(db, 'submissions', submissionId);
    await updateDoc(docRef, {
      grade,
      feedback,
      gradedBy: teacherId,
      gradedAt: serverTimestamp(),
      status: 'graded',
      updatedAt: serverTimestamp()
    });

    logger.info(`Graded submission: ${submissionId}`, 'Submissions');
    return { success: true };
  } catch (error) {
    logger.error(`Error grading submission ${submissionId}`, 'Submissions', error);
    return { success: false, error: error.message };
  }
}

/**
 * Return submission for revision
 * @param {string} submissionId - Submission ID
 * @param {string} feedback - Feedback for revision
 * @returns {Promise<Object>} Result
 */
export async function returnSubmission(submissionId, feedback) {
  try {
    const docRef = doc(db, 'submissions', submissionId);
    await updateDoc(docRef, {
      status: 'returned',
      feedback,
      returnedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    logger.info(`Returned submission: ${submissionId}`, 'Submissions');
    return { success: true };
  } catch (error) {
    logger.error(`Error returning submission ${submissionId}`, 'Submissions', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a submission
 * @param {string} submissionId - Submission ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Result
 */
export async function updateSubmission(submissionId, updates) {
  try {
    const docRef = doc(db, 'submissions', submissionId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    logger.info(`Updated submission: ${submissionId}`, 'Submissions');
    return { success: true };
  } catch (error) {
    logger.error(`Error updating submission ${submissionId}`, 'Submissions', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a submission
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object>} Result
 */
export async function deleteSubmission(submissionId) {
  try {
    const docRef = doc(db, 'submissions', submissionId);
    await deleteDoc(docRef);

    logger.info(`Deleted submission: ${submissionId}`, 'Submissions');
    return { success: true };
  } catch (error) {
    logger.error(`Error deleting submission ${submissionId}`, 'Submissions', error);
    return { success: false, error: error.message };
  }
}

export default {
  createSubmission,
  submitAssignment,
  getSubmission,
  getSubmissionByAssignmentAndStudent,
  getSubmissionsByAssignment,
  getSubmissionsByStudent,
  gradeSubmission,
  returnSubmission,
  updateSubmission,
  deleteSubmission
};
