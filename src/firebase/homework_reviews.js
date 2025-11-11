/**
 * @fileoverview Firebase operations for homework AI reviews
 * @module firebase/homework_reviews
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
  onSnapshot
} from 'firebase/firestore';
import { db } from './config';
import logger from '../utils/logger';

/**
 * Create a homework review record
 * @param {Object} reviewData - Review data
 * @returns {Promise<Object>} Result with id
 */
export async function createHomeworkReview(reviewData) {
  try {
    const reviewsRef = collection(db, 'homework_reviews');
    const docRef = await addDoc(reviewsRef, {
      ...reviewData,
      status: 'processing',
      teacherReviewed: false,
      createdAt: serverTimestamp()
    });

    logger.info(`Created homework review: ${docRef.id}`, 'HomeworkReviews');
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('Error creating homework review', 'HomeworkReviews', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update homework review with AI analysis results
 * @param {string} reviewId - Review ID
 * @param {Object} analysisData - AI analysis results
 * @returns {Promise<Object>} Result
 */
export async function updateHomeworkReview(reviewId, analysisData) {
  try {
    const docRef = doc(db, 'homework_reviews', reviewId);
    await updateDoc(docRef, {
      ...analysisData,
      analyzedAt: serverTimestamp()
    });

    logger.info(`Updated homework review: ${reviewId}`, 'HomeworkReviews');
    return { success: true };
  } catch (error) {
    logger.error(`Error updating homework review ${reviewId}`, 'HomeworkReviews', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark review as failed
 * @param {string} reviewId - Review ID
 * @param {string} errorMessage - Error message
 * @returns {Promise<Object>} Result
 */
export async function markReviewAsFailed(reviewId, errorMessage) {
  try {
    const docRef = doc(db, 'homework_reviews', reviewId);
    await updateDoc(docRef, {
      status: 'failed',
      errorMessage,
      analyzedAt: serverTimestamp()
    });

    logger.error(`Homework review failed: ${reviewId} - ${errorMessage}`, 'HomeworkReviews');
    return { success: true };
  } catch (error) {
    logger.error(`Error marking review as failed ${reviewId}`, 'HomeworkReviews', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get homework review by ID
 * @param {string} reviewId - Review ID
 * @returns {Promise<Object|null>} Review data
 */
export async function getHomeworkReview(reviewId) {
  try {
    const docRef = doc(db, 'homework_reviews', reviewId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    logger.error(`Error getting homework review ${reviewId}`, 'HomeworkReviews', error);
    return null;
  }
}

/**
 * Get homework review by submission ID
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object|null>} Review data
 */
export async function getReviewBySubmission(submissionId) {
  try {
    const reviewsRef = collection(db, 'homework_reviews');
    const q = query(
      reviewsRef,
      where('submissionId', '==', submissionId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0]; // Get most recent review
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    logger.error(`Error getting review for submission ${submissionId}`, 'HomeworkReviews', error);
    return null;
  }
}

/**
 * Get all reviews for an assignment
 * @param {string} assignmentId - Assignment ID
 * @returns {Promise<Array>} Array of reviews
 */
export async function getReviewsByAssignment(assignmentId) {
  try {
    const reviewsRef = collection(db, 'homework_reviews');
    const q = query(
      reviewsRef,
      where('assignmentId', '==', assignmentId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    const reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return reviews;
  } catch (error) {
    logger.error(`Error getting reviews for assignment ${assignmentId}`, 'HomeworkReviews', error);
    return [];
  }
}

/**
 * Get all reviews by a student
 * @param {string} studentId - Student ID
 * @returns {Promise<Array>} Array of reviews
 */
export async function getReviewsByStudent(studentId) {
  try {
    const reviewsRef = collection(db, 'homework_reviews');
    const q = query(
      reviewsRef,
      where('studentId', '==', studentId),
      where('teacherReviewed', '==', true), // Only show reviews approved by teacher
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    const reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return reviews;
  } catch (error) {
    logger.error(`Error getting reviews for student ${studentId}`, 'HomeworkReviews', error);
    return [];
  }
}

/**
 * Get pending reviews (not yet reviewed by teacher)
 * @param {string} teacherId - Teacher ID (optional, for filtering by teacher's assignments)
 * @returns {Promise<Array>} Array of pending reviews
 */
export async function getPendingReviews(teacherId = null) {
  try {
    const reviewsRef = collection(db, 'homework_reviews');
    let q;

    if (teacherId) {
      q = query(
        reviewsRef,
        where('teacherReviewed', '==', false),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        reviewsRef,
        where('teacherReviewed', '==', false),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);

    const reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return reviews;
  } catch (error) {
    logger.error('Error getting pending reviews', 'HomeworkReviews', error);
    return [];
  }
}

/**
 * Mark review as reviewed by teacher
 * @param {string} reviewId - Review ID
 * @param {Object} teacherEdits - Optional edits made by teacher
 * @returns {Promise<Object>} Result
 */
export async function approveReview(reviewId, teacherEdits = {}) {
  try {
    const docRef = doc(db, 'homework_reviews', reviewId);
    await updateDoc(docRef, {
      teacherReviewed: true,
      teacherReviewedAt: serverTimestamp(),
      ...teacherEdits
    });

    logger.info(`Teacher approved review: ${reviewId}`, 'HomeworkReviews');
    return { success: true };
  } catch (error) {
    logger.error(`Error approving review ${reviewId}`, 'HomeworkReviews', error);
    return { success: false, error: error.message };
  }
}

/**
 * Subscribe to review updates (real-time)
 * @param {string} reviewId - Review ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function subscribeToReview(reviewId, callback) {
  try {
    const docRef = doc(db, 'homework_reviews', reviewId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      } else {
        callback(null);
      }
    });
  } catch (error) {
    logger.error(`Error subscribing to review ${reviewId}`, 'HomeworkReviews', error);
    return () => {};
  }
}

/**
 * Subscribe to pending reviews (real-time)
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function subscribeToPendingReviews(callback) {
  try {
    const reviewsRef = collection(db, 'homework_reviews');
    const q = query(
      reviewsRef,
      where('teacherReviewed', '==', false),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const reviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(reviews);
    });
  } catch (error) {
    logger.error('Error subscribing to pending reviews', 'HomeworkReviews', error);
    return () => {};
  }
}

/**
 * Delete a homework review
 * @param {string} reviewId - Review ID
 * @returns {Promise<Object>} Result
 */
export async function deleteHomeworkReview(reviewId) {
  try {
    const docRef = doc(db, 'homework_reviews', reviewId);
    await deleteDoc(docRef);

    logger.info(`Deleted homework review: ${reviewId}`, 'HomeworkReviews');
    return { success: true };
  } catch (error) {
    logger.error(`Error deleting homework review ${reviewId}`, 'HomeworkReviews', error);
    return { success: false, error: error.message };
  }
}

export default {
  createHomeworkReview,
  updateHomeworkReview,
  markReviewAsFailed,
  getHomeworkReview,
  getReviewBySubmission,
  getReviewsByAssignment,
  getReviewsByStudent,
  getPendingReviews,
  approveReview,
  subscribeToReview,
  subscribeToPendingReviews,
  deleteHomeworkReview
};
