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
 * Homework review status constants
 */
export const REVIEW_STATUS = {
  UPLOADING: 'uploading',           // Image is being uploaded
  PROCESSING: 'processing',          // AI is analyzing
  PENDING_REVIEW: 'pending_review',  // Waiting for teacher review
  APPROVED: 'approved',              // Teacher approved - student can view
  REJECTED: 'rejected',              // Teacher rejected
  FAILED: 'failed'                   // Processing failed
};

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
      // Only set status to PROCESSING if not already provided (for manual uploads it may be PENDING_REVIEW)
      status: reviewData.status || REVIEW_STATUS.PROCESSING,
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
 * @param {boolean} includeUnreviewed - Include unreviewed corrections (for free corrections)
 * @returns {Promise<Array>} Array of reviews
 */
export async function getReviewsByStudent(studentId, includeUnreviewed = false) {
  try {
    const reviewsRef = collection(db, 'homework_reviews');
    let q;

    if (includeUnreviewed) {
      // For free corrections, show all statuses (including processing, completed, etc.)
      q = query(
        reviewsRef,
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
      );
    } else {
      // For assignment-based corrections, only show teacher-reviewed ones
      q = query(
        reviewsRef,
        where('studentId', '==', studentId),
        where('teacherReviewed', '==', true),
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
    logger.error(`Error getting reviews for student ${studentId}`, 'HomeworkReviews', error);
    return [];
  }
}

/**
 * Get ALL reviews for teacher panel (pending + approved)
 * @param {string} teacherId - Teacher ID (optional, for filtering by teacher's assignments)
 * @returns {Promise<Array>} Array of all reviews
 */
export async function getAllReviewsForTeacher(teacherId = null) {
  try {
    console.log(`[getAllReviewsForTeacher] Fetching all reviews (teacherId: ${teacherId || 'ALL'})`);
    const reviewsRef = collection(db, 'homework_reviews');

    // Fetch ALL statuses: PROCESSING, PENDING_REVIEW, and APPROVED
    const processingQuery = query(
      reviewsRef,
      where('status', '==', REVIEW_STATUS.PROCESSING),
      orderBy('createdAt', 'desc')
    );

    const pendingQuery = query(
      reviewsRef,
      where('status', '==', REVIEW_STATUS.PENDING_REVIEW),
      orderBy('createdAt', 'desc')
    );

    const approvedQuery = query(
      reviewsRef,
      where('status', '==', REVIEW_STATUS.APPROVED),
      orderBy('createdAt', 'desc'),
      limit(100) // Limit approved to avoid too many results
    );

    console.log('[getAllReviewsForTeacher] Executing queries...');
    const [processingSnapshot, pendingSnapshot, approvedSnapshot] = await Promise.all([
      getDocs(processingQuery),
      getDocs(pendingQuery),
      getDocs(approvedQuery)
    ]);

    console.log(`[getAllReviewsForTeacher] Query returned ${processingSnapshot.docs.length} processing + ${pendingSnapshot.docs.length} pending + ${approvedSnapshot.docs.length} approved`);

    // Combine all results
    const allReviews = [
      ...processingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      ...pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      ...approvedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    ];

    // Sort by createdAt (most recent first)
    allReviews.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    console.log(`[getAllReviewsForTeacher] ✅ Returning ${allReviews.length} reviews total`);
    return allReviews;
  } catch (error) {
    console.error('[getAllReviewsForTeacher] ❌ Error:', error);
    logger.error('Error getting all reviews for teacher', 'HomeworkReviews', error);
    return [];
  }
}

/**
 * Get pending reviews (not yet reviewed by teacher)
 * Includes both PROCESSING (being analyzed) and PENDING_REVIEW (ready to review) status
 * @param {string} teacherId - Teacher ID (optional, for filtering by teacher's assignments)
 * @returns {Promise<Array>} Array of pending reviews
 */
export async function getPendingReviews(teacherId = null) {
  try {
    console.log(`[getPendingReviews] Fetching reviews (teacherId: ${teacherId || 'ALL'})`);
    const reviewsRef = collection(db, 'homework_reviews');

    // Fetch BOTH processing and pending_review status
    // This ensures tasks appear immediately after upload, even while AI is processing
    const processingQuery = query(
      reviewsRef,
      where('teacherReviewed', '==', false),
      where('status', '==', REVIEW_STATUS.PROCESSING),
      orderBy('createdAt', 'desc')
    );

    const pendingQuery = query(
      reviewsRef,
      where('teacherReviewed', '==', false),
      where('status', '==', REVIEW_STATUS.PENDING_REVIEW),
      orderBy('createdAt', 'desc')
    );

    console.log('[getPendingReviews] Executing queries...');
    const [processingSnapshot, pendingSnapshot] = await Promise.all([
      getDocs(processingQuery),
      getDocs(pendingQuery)
    ]);

    console.log(`[getPendingReviews] Query returned ${processingSnapshot.docs.length} processing + ${pendingSnapshot.docs.length} pending_review documents`);

    // Combine both results
    const allReviews = [
      ...processingSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`[getPendingReviews] PROCESSING Review ${doc.id}:`, {
          status: data.status,
          teacherReviewed: data.teacherReviewed,
          studentId: data.studentId,
          createdAt: data.createdAt
        });
        return {
          id: doc.id,
          ...data
        };
      }),
      ...pendingSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`[getPendingReviews] PENDING Review ${doc.id}:`, {
          status: data.status,
          teacherReviewed: data.teacherReviewed,
          studentId: data.studentId,
          createdAt: data.createdAt
        });
        return {
          id: doc.id,
          ...data
        };
      })
    ];

    // Sort by createdAt (most recent first)
    allReviews.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    console.log(`[getPendingReviews] ✅ Returning ${allReviews.length} reviews total`);
    return allReviews;
  } catch (error) {
    console.error('[getPendingReviews] ❌ Error:', error);
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
      status: REVIEW_STATUS.APPROVED,
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
 * Request reanalysis of a homework with a different profile
 * @param {string} reviewId - Review ID
 * @param {string} profileId - Correction profile ID to use
 * @returns {Promise<Object>} Result
 */
export async function requestReanalysis(reviewId, profileId) {
  try {
    const docRef = doc(db, 'homework_reviews', reviewId);
    await updateDoc(docRef, {
      status: REVIEW_STATUS.PROCESSING,
      correctionProfileId: profileId,
      requestReanalysis: true,
      reanalysisRequestedAt: serverTimestamp(),
      // Clear previous corrections
      aiSuggestions: [],
      aiErrorSummary: {},
      detailedCorrections: [],
      errorSummary: {},
      overallFeedback: '',
      suggestedGrade: 0,
      teacherReviewed: false
    });

    logger.info(`Requested reanalysis for review ${reviewId} with profile ${profileId}`, 'HomeworkReviews');
    return { success: true };
  } catch (error) {
    logger.error(`Error requesting reanalysis for review ${reviewId}`, 'HomeworkReviews', error);
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
 * Includes both PROCESSING and PENDING_REVIEW status for immediate feedback
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function subscribeToPendingReviews(callback) {
  try {
    const reviewsRef = collection(db, 'homework_reviews');

    // Subscribe to PROCESSING reviews
    const processingQuery = query(
      reviewsRef,
      where('teacherReviewed', '==', false),
      where('status', '==', REVIEW_STATUS.PROCESSING),
      orderBy('createdAt', 'desc')
    );

    // Subscribe to PENDING_REVIEW reviews
    const pendingQuery = query(
      reviewsRef,
      where('teacherReviewed', '==', false),
      where('status', '==', REVIEW_STATUS.PENDING_REVIEW),
      orderBy('createdAt', 'desc')
    );

    let processingReviews = [];
    let pendingReviews = [];

    const combineAndCallback = () => {
      // Combine both arrays and sort by createdAt
      const allReviews = [...processingReviews, ...pendingReviews];
      allReviews.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      callback(allReviews);
    };

    // Subscribe to both queries
    const unsubscribeProcessing = onSnapshot(processingQuery, (snapshot) => {
      processingReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      combineAndCallback();
    });

    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      pendingReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      combineAndCallback();
    });

    // Return combined unsubscribe function
    return () => {
      unsubscribeProcessing();
      unsubscribePending();
    };
  } catch (error) {
    logger.error('Error subscribing to pending reviews', 'HomeworkReviews', error);
    return () => {};
  }
}

/**
 * Assign or reassign student to a homework review
 * @param {string} reviewId - Review ID
 * @param {string} studentId - Student ID to assign (or null to unassign)
 * @param {string} studentName - Student name
 * @returns {Promise<Object>} Result
 */
export async function assignStudentToReview(reviewId, studentId, studentName) {
  try {
    const docRef = doc(db, 'homework_reviews', reviewId);
    await updateDoc(docRef, {
      studentId: studentId || null,
      studentName: studentName || 'Sin asignar',
      needsStudentAssignment: !studentId,
      studentAssignedAt: studentId ? serverTimestamp() : null
    });

    logger.info(`Assigned student ${studentId || 'none'} to review ${reviewId}`, 'HomeworkReviews');
    return { success: true };
  } catch (error) {
    logger.error(`Error assigning student to review ${reviewId}`, 'HomeworkReviews', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancel a stuck processing review
 * @param {string} reviewId - Review ID
 * @returns {Promise<Object>} Result
 */
export async function cancelProcessingReview(reviewId) {
  try {
    const docRef = doc(db, 'homework_reviews', reviewId);
    await updateDoc(docRef, {
      status: REVIEW_STATUS.FAILED,
      errorMessage: 'Procesamiento cancelado manualmente. Puedes reintentar el análisis.',
      cancelledAt: serverTimestamp(),
      teacherReviewed: false
    });

    logger.info(`Cancelled processing review: ${reviewId}`, 'HomeworkReviews');
    return { success: true };
  } catch (error) {
    logger.error(`Error cancelling processing review ${reviewId}`, 'HomeworkReviews', error);
    return { success: false, error: error.message };
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
  assignStudentToReview,
  subscribeToReview,
  subscribeToPendingReviews,
  cancelProcessingReview,
  deleteHomeworkReview
};
