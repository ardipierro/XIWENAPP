/**
 * @fileoverview Firebase operations for homework correction profiles
 * @module firebase/correctionProfiles
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
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import logger from '../utils/logger';

/**
 * Strictness levels for correction profiles
 */
export const STRICTNESS_LEVELS = {
  LENIENT: 'lenient',     // Fewer corrections, higher tolerance
  MODERATE: 'moderate',   // Balanced approach
  STRICT: 'strict'        // Maximum corrections, low tolerance
};

/**
 * Check types for corrections
 */
export const CHECK_TYPES = {
  SPELLING: 'spelling',
  GRAMMAR: 'grammar',
  PUNCTUATION: 'punctuation',
  VOCABULARY: 'vocabulary'
};

/**
 * Default correction profiles
 */
export const DEFAULT_PROFILES = [
  {
    name: 'Principiantes (A1-A2)',
    description: 'Para estudiantes que están comenzando',
    icon: '🌱',
    settings: {
      checks: [CHECK_TYPES.SPELLING],
      strictness: STRICTNESS_LEVELS.LENIENT,
      weights: {
        spelling: 1.0,
        grammar: 0,
        punctuation: 0,
        vocabulary: 0
      },
      minGrade: 50,
      display: {
        showDetailedErrors: true,
        showExplanations: true,
        showSuggestions: true,
        highlightOnImage: false
      },
      visualization: {
        highlightOpacity: 0.15,
        useWavyUnderline: false,
        showCorrectionText: true,
        correctionTextFont: 'Caveat',
        colors: {
          spelling: '#ef4444',
          grammar: '#f97316',
          punctuation: '#eab308',
          vocabulary: '#5b8fa3'
        },
        strokeWidth: 2,
        strokeOpacity: 0.8
      }
    }
  },
  {
    name: 'Intermedio (B1-B2)',
    description: 'Para estudiantes con nivel intermedio',
    icon: '📚',
    settings: {
      checks: [CHECK_TYPES.SPELLING, CHECK_TYPES.GRAMMAR, CHECK_TYPES.PUNCTUATION],
      strictness: STRICTNESS_LEVELS.MODERATE,
      weights: {
        spelling: 0.4,
        grammar: 0.4,
        punctuation: 0.2,
        vocabulary: 0
      },
      minGrade: 60,
      display: {
        showDetailedErrors: true,
        showExplanations: true,
        showSuggestions: true,
        highlightOnImage: true
      },
      visualization: {
        highlightOpacity: 0.25,
        useWavyUnderline: true,
        showCorrectionText: true,
        correctionTextFont: 'Caveat',
        colors: {
          spelling: '#ef4444',
          grammar: '#f97316',
          punctuation: '#eab308',
          vocabulary: '#5b8fa3'
        },
        strokeWidth: 2,
        strokeOpacity: 0.8
      }
    }
  },
  {
    name: 'Avanzado (C1-C2)',
    description: 'Para estudiantes avanzados',
    icon: '🎓',
    settings: {
      checks: [CHECK_TYPES.SPELLING, CHECK_TYPES.GRAMMAR, CHECK_TYPES.PUNCTUATION, CHECK_TYPES.VOCABULARY],
      strictness: STRICTNESS_LEVELS.STRICT,
      weights: {
        spelling: 0.3,
        grammar: 0.3,
        punctuation: 0.2,
        vocabulary: 0.2
      },
      minGrade: 70,
      display: {
        showDetailedErrors: true,
        showExplanations: true,
        showSuggestions: true,
        highlightOnImage: true
      },
      visualization: {
        highlightOpacity: 0.40,
        useWavyUnderline: true,
        showCorrectionText: true,
        correctionTextFont: 'Shadows Into Light',
        colors: {
          spelling: '#dc2626',
          grammar: '#ea580c',
          punctuation: '#ca8a04',
          vocabulary: '#0284c7'
        },
        strokeWidth: 3,
        strokeOpacity: 1.0
      }
    }
  }
];

/**
 * Create a correction profile (Admin only)
 * @param {string} createdBy - Admin user ID who creates the profile
 * @param {Object} profileData - Profile data
 * @returns {Promise<Object>} Result with id
 */
export async function createCorrectionProfile(createdBy, profileData) {
  try {
    const profilesRef = collection(db, 'correction_profiles');
    const docRef = await addDoc(profilesRef, {
      createdBy,
      isSystemProfile: true,
      ...profileData,
      isDefault: false,
      assignedToStudents: [],
      assignedToGroups: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    logger.info(`Created universal correction profile: ${docRef.id}`, 'CorrectionProfiles');
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('Error creating correction profile', 'CorrectionProfiles', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a correction profile
 * @param {string} profileId - Profile ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Result
 */
export async function updateCorrectionProfile(profileId, updates) {
  try {
    const docRef = doc(db, 'correction_profiles', profileId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    logger.info(`Updated correction profile: ${profileId}`, 'CorrectionProfiles');
    return { success: true };
  } catch (error) {
    logger.error(`Error updating correction profile ${profileId}`, 'CorrectionProfiles', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get a correction profile by ID
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object|null>} Profile data
 */
export async function getCorrectionProfile(profileId) {
  try {
    const docRef = doc(db, 'correction_profiles', profileId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    logger.error(`Error getting correction profile ${profileId}`, 'CorrectionProfiles', error);
    return null;
  }
}

/**
 * Get all universal correction profiles
 * All users (admin and teachers) see the same universal profiles
 * @returns {Promise<Array>} Array of universal profiles
 */
export async function getAllCorrectionProfiles() {
  try {
    const profilesRef = collection(db, 'correction_profiles');

    // Get all system profiles (universal)
    const q = query(
      profilesRef,
      where('isSystemProfile', '==', true)
    );

    const snapshot = await getDocs(q);

    const profiles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort in memory to avoid needing Firestore index
    profiles.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA; // Desc order (newest first)
    });

    logger.info(`Loaded ${profiles.length} universal correction profiles`, 'CorrectionProfiles');
    return profiles;
  } catch (error) {
    logger.error('Error getting universal correction profiles', 'CorrectionProfiles', error);
    return [];
  }
}

/**
 * @deprecated Use getAllCorrectionProfiles() instead
 * Kept for backwards compatibility
 */
export async function getCorrectionProfilesByTeacher(teacherId, isAdmin = false) {
  logger.warn('getCorrectionProfilesByTeacher is deprecated, use getAllCorrectionProfiles', 'CorrectionProfiles');
  return getAllCorrectionProfiles();
}

/**
 * Delete a correction profile
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object>} Result
 */
export async function deleteCorrectionProfile(profileId) {
  try {
    const docRef = doc(db, 'correction_profiles', profileId);
    await deleteDoc(docRef);

    logger.info(`Deleted correction profile: ${profileId}`, 'CorrectionProfiles');
    return { success: true };
  } catch (error) {
    logger.error(`Error deleting correction profile ${profileId}`, 'CorrectionProfiles', error);
    return { success: false, error: error.message };
  }
}

/**
 * Assign profile to students
 * @param {string} profileId - Profile ID
 * @param {Array<string>} studentIds - Array of student IDs
 * @returns {Promise<Object>} Result
 */
export async function assignProfileToStudents(profileId, studentIds) {
  try {
    const docRef = doc(db, 'correction_profiles', profileId);
    await updateDoc(docRef, {
      assignedToStudents: studentIds,
      updatedAt: serverTimestamp()
    });

    logger.info(`Assigned profile ${profileId} to ${studentIds.length} students`, 'CorrectionProfiles');
    return { success: true };
  } catch (error) {
    logger.error(`Error assigning profile ${profileId}`, 'CorrectionProfiles', error);
    return { success: false, error: error.message };
  }
}

/**
 * Assign profile to groups
 * @param {string} profileId - Profile ID
 * @param {Array<string>} groupIds - Array of group IDs
 * @returns {Promise<Object>} Result
 */
export async function assignProfileToGroups(profileId, groupIds) {
  try {
    const docRef = doc(db, 'correction_profiles', profileId);
    await updateDoc(docRef, {
      assignedToGroups: groupIds,
      updatedAt: serverTimestamp()
    });

    logger.info(`Assigned profile ${profileId} to ${groupIds.length} groups`, 'CorrectionProfiles');
    return { success: true };
  } catch (error) {
    logger.error(`Error assigning profile ${profileId}`, 'CorrectionProfiles', error);
    return { success: false, error: error.message };
  }
}

/**
 * Set a profile as the system-wide default (Admin only)
 * @param {string} profileId - Profile ID to set as default
 * @returns {Promise<Object>} Result
 */
export async function setDefaultProfile(profileId) {
  try {
    // First, unset all other defaults (system-wide)
    const profilesRef = collection(db, 'correction_profiles');
    const q = query(
      profilesRef,
      where('isSystemProfile', '==', true),
      where('isDefault', '==', true)
    );
    const snapshot = await getDocs(q);

    const batch = [];
    snapshot.docs.forEach(doc => {
      batch.push(updateDoc(doc.ref, { isDefault: false, updatedAt: serverTimestamp() }));
    });
    await Promise.all(batch);

    // Set the new default
    const docRef = doc(db, 'correction_profiles', profileId);
    await updateDoc(docRef, {
      isDefault: true,
      updatedAt: serverTimestamp()
    });

    logger.info(`Set profile ${profileId} as system-wide default`, 'CorrectionProfiles');
    return { success: true };
  } catch (error) {
    logger.error(`Error setting default profile ${profileId}`, 'CorrectionProfiles', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get the system-wide default profile
 * @returns {Promise<Object|null>} Default profile or null
 */
export async function getDefaultProfile() {
  try {
    const profilesRef = collection(db, 'correction_profiles');
    const q = query(
      profilesRef,
      where('isSystemProfile', '==', true),
      where('isDefault', '==', true)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      logger.info('Found system-wide default profile', 'CorrectionProfiles');
      return { id: docSnap.id, ...docSnap.data() };
    }

    logger.warn('No system-wide default profile found', 'CorrectionProfiles');
    return null;
  } catch (error) {
    logger.error('Error getting system default profile', 'CorrectionProfiles', error);
    return null;
  }
}

/**
 * Initialize default system profiles (Admin only)
 * @param {string} adminUserId - Admin user ID who initializes the profiles
 * @returns {Promise<Object>} Result
 */
export async function initializeDefaultProfiles(adminUserId) {
  try {
    const results = [];

    for (const profile of DEFAULT_PROFILES) {
      const result = await createCorrectionProfile(adminUserId, profile);
      results.push(result);
    }

    // Set first profile as system-wide default
    if (results.length > 0 && results[0].success) {
      await setDefaultProfile(results[0].id);
    }

    logger.info(`Initialized ${results.length} default system profiles`, 'CorrectionProfiles');
    return { success: true, count: results.length };
  } catch (error) {
    logger.error('Error initializing default system profiles', 'CorrectionProfiles', error);
    return { success: false, error: error.message };
  }
}

/**
 * Assign a profile to an individual student
 * @param {string} profileId - Profile ID
 * @param {string} studentId - Student ID
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} Result with assignment ID
 */
export async function assignProfileToStudent(profileId, studentId, teacherId) {
  try {
    const assignmentsRef = collection(db, 'profile_students');

    // Check if assignment already exists
    const q = query(
      assignmentsRef,
      where('studentId', '==', studentId),
      where('teacherId', '==', teacherId)
    );
    const existing = await getDocs(q);

    if (!existing.empty) {
      // Update existing assignment
      const docRef = existing.docs[0].ref;
      await updateDoc(docRef, {
        profileId,
        updatedAt: serverTimestamp()
      });
      logger.info(`Updated profile assignment for student ${studentId}`, 'CorrectionProfiles');
      return { success: true, id: existing.docs[0].id };
    } else {
      // Create new assignment
      const docRef = await addDoc(assignmentsRef, {
        profileId,
        studentId,
        teacherId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      logger.info(`Assigned profile ${profileId} to student ${studentId}`, 'CorrectionProfiles');
      return { success: true, id: docRef.id };
    }
  } catch (error) {
    logger.error(`Error assigning profile to student ${studentId}`, 'CorrectionProfiles', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get the correction profile for a student
 * Returns individual assignment or system default profile
 * @param {string} studentId - Student ID
 * @returns {Promise<Object|null>} Profile or null
 */
export async function getStudentProfile(studentId) {
  try {
    // First, check for individual assignment
    const assignmentsRef = collection(db, 'profile_students');
    const q = query(
      assignmentsRef,
      where('studentId', '==', studentId)
    );
    const assignmentSnapshot = await getDocs(q);

    if (!assignmentSnapshot.empty) {
      const assignment = assignmentSnapshot.docs[0].data();
      const profile = await getCorrectionProfile(assignment.profileId);
      if (profile) {
        logger.info(`Found individual profile assignment for student ${studentId}`, 'CorrectionProfiles');
        return profile;
      }
    }

    // Fallback to system-wide default profile
    const defaultProfile = await getDefaultProfile();
    if (defaultProfile) {
      logger.info(`Using system default profile for student ${studentId}`, 'CorrectionProfiles');
      return defaultProfile;
    }

    logger.warn(`No profile found for student ${studentId}`, 'CorrectionProfiles');
    return null;
  } catch (error) {
    logger.error(`Error getting profile for student ${studentId}`, 'CorrectionProfiles', error);
    return null;
  }
}

/**
 * Remove profile assignment from a student
 * @param {string} studentId - Student ID
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} Result
 */
export async function removeStudentProfileAssignment(studentId, teacherId) {
  try {
    const assignmentsRef = collection(db, 'profile_students');
    const q = query(
      assignmentsRef,
      where('studentId', '==', studentId),
      where('teacherId', '==', teacherId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      await deleteDoc(snapshot.docs[0].ref);
      logger.info(`Removed profile assignment for student ${studentId}`, 'CorrectionProfiles');
      return { success: true };
    }

    return { success: true, message: 'No assignment found' };
  } catch (error) {
    logger.error(`Error removing profile assignment for student ${studentId}`, 'CorrectionProfiles', error);
    return { success: false, error: error.message };
  }
}

export default {
  createCorrectionProfile,
  updateCorrectionProfile,
  getCorrectionProfile,
  getAllCorrectionProfiles,
  getCorrectionProfilesByTeacher, // Deprecated, kept for backwards compatibility
  deleteCorrectionProfile,
  assignProfileToStudents,
  assignProfileToGroups,
  assignProfileToStudent,
  getStudentProfile,
  removeStudentProfileAssignment,
  setDefaultProfile,
  getDefaultProfile,
  initializeDefaultProfiles,
  STRICTNESS_LEVELS,
  CHECK_TYPES,
  DEFAULT_PROFILES
};
