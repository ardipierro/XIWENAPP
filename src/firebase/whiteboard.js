/**
 * @fileoverview Firebase operations for whiteboard sessions
 * @module firebase/whiteboard
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  setDoc
} from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'whiteboard_sessions';
const ACTIVE_SESSIONS_COLLECTION = 'active_whiteboard_sessions';

/**
 * Create a new whiteboard session
 * @param {Object} sessionData - Session data
 * @param {string} sessionData.title - Session title
 * @param {Array} sessionData.slides - Array of slide data
 * @param {string} sessionData.userId - User ID who created the session
 * @param {string} sessionData.userName - User name
 * @returns {Promise<string>} Session ID
 */
export async function createWhiteboardSession(sessionData) {
  try {
    console.log('🔷 [Firebase/whiteboard] createWhiteboardSession llamado');
    console.log('🔷 [Firebase/whiteboard] sessionData:', {
      title: sessionData.title,
      slidesCount: sessionData.slides?.length,
      userId: sessionData.userId
    });

    const docRef = await addDoc(collection(db, COLLECTION), {
      title: sessionData.title || 'Sin título',
      slides: sessionData.slides || [],
      userId: sessionData.userId,
      userName: sessionData.userName || 'Usuario',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('✅ [Firebase/whiteboard] Documento creado con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error creating whiteboard session:', error);
    throw error;
  }
}

/**
 * Get a whiteboard session by ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object|null>} Session data or null
 */
export async function getWhiteboardSession(sessionId) {
  try {
    const docRef = doc(db, COLLECTION, sessionId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting whiteboard session:', error);
    throw error;
  }
}

/**
 * Update a whiteboard session
 * @param {string} sessionId - Session ID
 * @param {Object} updates - Updated data
 * @returns {Promise<void>}
 */
export async function updateWhiteboardSession(sessionId, updates) {
  try {
    const docRef = doc(db, COLLECTION, sessionId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating whiteboard session:', error);
    throw error;
  }
}

/**
 * Share a whiteboard with users
 * @param {string} sessionId - Session ID
 * @param {Array<string>} userIds - Array of user IDs to share with
 * @returns {Promise<void>}
 */
export async function shareWhiteboardSession(sessionId, userIds) {
  try {
    const docRef = doc(db, COLLECTION, sessionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Session not found');
    }

    const currentSharedWith = docSnap.data().sharedWith || [];
    const newSharedWith = [...new Set([...currentSharedWith, ...userIds])]; // Evitar duplicados

    await updateDoc(docRef, {
      sharedWith: newSharedWith,
      updatedAt: serverTimestamp()
    });

    console.log('✅ [Firebase/whiteboard] Session shared with:', userIds);
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error sharing session:', error);
    throw error;
  }
}

/**
 * Unshare a whiteboard with specific users
 * @param {string} sessionId - Session ID
 * @param {Array<string>} userIds - Array of user IDs to unshare
 * @returns {Promise<void>}
 */
export async function unshareWhiteboardSession(sessionId, userIds) {
  try {
    const docRef = doc(db, COLLECTION, sessionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Session not found');
    }

    const currentSharedWith = docSnap.data().sharedWith || [];
    const newSharedWith = currentSharedWith.filter(id => !userIds.includes(id));

    await updateDoc(docRef, {
      sharedWith: newSharedWith,
      updatedAt: serverTimestamp()
    });

    console.log('✅ [Firebase/whiteboard] Session unshared from:', userIds);
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error unsharing session:', error);
    throw error;
  }
}

/**
 * Delete a whiteboard session
 * @param {string} sessionId - Session ID
 * @returns {Promise<void>}
 */
export async function deleteWhiteboardSession(sessionId) {
  try {
    const docRef = doc(db, COLLECTION, sessionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting whiteboard session:', error);
    throw error;
  }
}

/**
 * Get all whiteboard sessions for a user
 * Includes: sessions created by the user + sessions shared with the user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of sessions
 */
export async function getUserWhiteboardSessions(userId) {
  try {
    console.log('🔷 [Firebase/whiteboard] getUserWhiteboardSessions llamado para userId:', userId);

    // Query 1: Pizarras creadas por el usuario
    const q1 = query(
      collection(db, COLLECTION),
      where('userId', '==', userId)
    );

    // Query 2: Pizarras compartidas con el usuario (usando array-contains)
    const q2 = query(
      collection(db, COLLECTION),
      where('sharedWith', 'array-contains', userId)
    );

    // Ejecutar ambas queries en paralelo
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);

    const sessions = [];
    const seenIds = new Set();

    // Agregar pizarras creadas por el usuario
    snapshot1.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() });
      seenIds.add(doc.id);
    });

    // Agregar pizarras compartidas (evitar duplicados)
    snapshot2.forEach((doc) => {
      if (!seenIds.has(doc.id)) {
        sessions.push({ id: doc.id, ...doc.data() });
      }
    });

    // TEMPORAL: Si no hay pizarras compartidas, mostrar todas las pizarras existentes
    // (Para pizarras creadas antes de implementar el sistema de compartir)
    if (sessions.length === 0) {
      console.log('⚠️ No hay pizarras propias/compartidas. Mostrando todas las pizarras...');
      const allQuery = query(collection(db, COLLECTION));
      const allSnapshot = await getDocs(allQuery);

      allSnapshot.forEach((doc) => {
        const data = doc.data();
        // Solo mostrar si no tiene sharedWith definido (pizarras antiguas)
        if (!data.sharedWith) {
          sessions.push({ id: doc.id, ...data });
        }
      });
    }

    // Ordenar por updatedAt en el cliente (desc)
    sessions.sort((a, b) => {
      const timeA = a.updatedAt?.seconds || 0;
      const timeB = b.updatedAt?.seconds || 0;
      return timeB - timeA; // descendente (más reciente primero)
    });

    console.log('✅ [Firebase/whiteboard] Sesiones encontradas:', sessions.length);
    return sessions;
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error getting user whiteboard sessions:', error);
    throw error;
  }
}

/**
 * Get all whiteboard sessions (for admins)
 * @returns {Promise<Array>} Array of all sessions
 */
export async function getAllWhiteboardSessions() {
  try {
    const q = query(
      collection(db, COLLECTION),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const sessions = [];

    querySnapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() });
    });

    return sessions;
  } catch (error) {
    console.error('Error getting all whiteboard sessions:', error);
    throw error;
  }
}

// ============================================
// COLLABORATIVE WHITEBOARD FUNCTIONS
// ============================================

/**
 * Create or join an active collaborative whiteboard session
 * @param {string} sessionId - Session ID (can be from saved session or new)
 * @param {Object} user - User object { uid, displayName }
 * @param {Object} initialData - Initial session data (title, slides)
 * @returns {Promise<string>} Active session ID
 */
export async function createActiveWhiteboardSession(sessionId, user, initialData = {}) {
  try {
    console.log('🟢 [Firebase/whiteboard] Creating active session:', sessionId);

    const activeSessionRef = doc(db, ACTIVE_SESSIONS_COLLECTION, sessionId);

    // Check if session already exists
    const existingDoc = await getDoc(activeSessionRef);

    if (existingDoc.exists()) {
      console.log('⚠️ Session already exists, joining instead');
      await joinActiveWhiteboardSession(sessionId, user);
      return sessionId;
    }

    // Create new session
    await setDoc(activeSessionRef, {
      sessionId,
      title: initialData.title || 'Pizarra Colaborativa',
      createdBy: user.uid,
      createdByName: user.displayName || 'Usuario',
      participants: [{
        uid: user.uid,
        displayName: user.displayName || 'Usuario',
        joinedAt: Date.now(), // Use Date.now() instead of serverTimestamp() in arrays
        isActive: true
      }],
      strokes: initialData.strokes || [],
      currentSlide: 0,
      slides: initialData.slides || [{ id: 1, strokes: [], objects: [] }],
      sharedContent: null, // { type: 'video'|'pdf'|'exercise'|'image', url: string, data: any }
      activeSelections: {}, // { userId: { objectId, slideIndex, userName } }
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    });

    console.log('✅ [Firebase/whiteboard] Active session created');
    return sessionId;
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error creating active session:', error);
    throw error;
  }
}

/**
 * Join an existing active whiteboard session
 * @param {string} sessionId - Session ID
 * @param {Object} user - User object { uid, displayName }
 * @returns {Promise<void>}
 */
export async function joinActiveWhiteboardSession(sessionId, user) {
  try {
    console.log('🟢 [Firebase/whiteboard] User joining session:', sessionId, user.uid);

    const activeSessionRef = doc(db, ACTIVE_SESSIONS_COLLECTION, sessionId);

    await updateDoc(activeSessionRef, {
      participants: arrayUnion({
        uid: user.uid,
        displayName: user.displayName || 'Usuario',
        joinedAt: Date.now(), // Use Date.now() instead of serverTimestamp() in arrays
        isActive: true
      }),
      updatedAt: serverTimestamp()
    });

    console.log('✅ [Firebase/whiteboard] User joined session');
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error joining session:', error);
    throw error;
  }
}

/**
 * Leave an active whiteboard session
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function leaveActiveWhiteboardSession(sessionId, userId) {
  try {
    console.log('🟡 [Firebase/whiteboard] User leaving session:', sessionId, userId);

    const activeSessionRef = doc(db, ACTIVE_SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(activeSessionRef);

    if (!sessionDoc.exists()) {
      console.log('⚠️ Session does not exist');
      return;
    }

    const sessionData = sessionDoc.data();
    const updatedParticipants = sessionData.participants.filter(p => p.uid !== userId);

    // Si no quedan participantes, marcar sesión como inactiva
    if (updatedParticipants.length === 0) {
      await updateDoc(activeSessionRef, {
        participants: [],
        isActive: false,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Session marked as inactive (no participants)');
    } else {
      await updateDoc(activeSessionRef, {
        participants: updatedParticipants,
        updatedAt: serverTimestamp()
      });
      console.log('✅ User left session');
    }
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error leaving session:', error);
    throw error;
  }
}

/**
 * Add a stroke to the active whiteboard session
 * @param {string} sessionId - Session ID
 * @param {number} slideIndex - Slide index
 * @param {Object} stroke - Stroke data
 * @returns {Promise<void>}
 */
export async function addStrokeToActiveSession(sessionId, slideIndex, stroke) {
  try {
    const activeSessionRef = doc(db, ACTIVE_SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(activeSessionRef);

    if (!sessionDoc.exists()) {
      console.warn('⚠️ Active session not found, cannot add stroke. Session might have ended.');
      return; // Silently fail instead of throwing
    }

    const sessionData = sessionDoc.data();
    const slides = [...(sessionData.slides || [])]; // Create copy to avoid mutation

    // Asegurarse de que el slide existe
    while (slides.length <= slideIndex) {
      slides.push({ id: slides.length + 1, strokes: [] });
    }

    // Agregar stroke al slide específico
    if (!slides[slideIndex].strokes) {
      slides[slideIndex].strokes = [];
    }
    slides[slideIndex].strokes.push(stroke);

    await updateDoc(activeSessionRef, {
      slides,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error adding stroke:', error);
    // Don't throw - just log, to avoid breaking the UI
  }
}

/**
 * Clear all strokes from a slide in active session
 * @param {string} sessionId - Session ID
 * @param {number} slideIndex - Slide index
 * @returns {Promise<void>}
 */
export async function clearSlideInActiveSession(sessionId, slideIndex) {
  try {
    const activeSessionRef = doc(db, ACTIVE_SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(activeSessionRef);

    if (!sessionDoc.exists()) {
      throw new Error('Active session not found');
    }

    const sessionData = sessionDoc.data();
    const slides = sessionData.slides || [];

    if (slides[slideIndex]) {
      slides[slideIndex].strokes = [];
      slides[slideIndex].objects = [];
    }

    await updateDoc(activeSessionRef, {
      slides,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error clearing slide:', error);
    throw error;
  }
}

/**
 * Add object (sticky note, text box) to active session
 * @param {string} sessionId - Session ID
 * @param {number} slideIndex - Slide index
 * @param {Object} object - Object data
 * @returns {Promise<void>}
 */
export async function addObjectToActiveSession(sessionId, slideIndex, object) {
  try {
    const activeSessionRef = doc(db, ACTIVE_SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(activeSessionRef);

    if (!sessionDoc.exists()) {
      console.warn('⚠️ Active session not found, cannot add object.');
      return;
    }

    const sessionData = sessionDoc.data();
    const slides = [...(sessionData.slides || [])];

    // Asegurarse de que el slide existe
    while (slides.length <= slideIndex) {
      slides.push({ id: slides.length + 1, strokes: [], objects: [] });
    }

    // Agregar objeto al slide específico
    if (!slides[slideIndex].objects) {
      slides[slideIndex].objects = [];
    }
    slides[slideIndex].objects.push(object);

    await updateDoc(activeSessionRef, {
      slides,
      updatedAt: serverTimestamp()
    });

    console.log('✅ [Firebase/whiteboard] Object added to slide', slideIndex);
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error adding object:', error);
  }
}

/**
 * Update object in active session
 * @param {string} sessionId - Session ID
 * @param {number} slideIndex - Slide index
 * @param {string} objectId - Object ID
 * @param {Object} updates - Object updates
 * @returns {Promise<void>}
 */
export async function updateObjectInActiveSession(sessionId, slideIndex, objectId, updates) {
  try {
    const activeSessionRef = doc(db, ACTIVE_SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(activeSessionRef);

    if (!sessionDoc.exists()) {
      console.warn('⚠️ Active session not found, cannot update object.');
      return;
    }

    const sessionData = sessionDoc.data();
    const slides = [...(sessionData.slides || [])];

    if (slides[slideIndex] && slides[slideIndex].objects) {
      const objectIndex = slides[slideIndex].objects.findIndex(obj => obj.id === objectId);
      if (objectIndex !== -1) {
        slides[slideIndex].objects[objectIndex] = {
          ...slides[slideIndex].objects[objectIndex],
          ...updates
        };

        await updateDoc(activeSessionRef, {
          slides,
          updatedAt: serverTimestamp()
        });

        console.log('✅ [Firebase/whiteboard] Object updated');
      }
    }
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error updating object:', error);
  }
}

/**
 * Delete object from active session
 * @param {string} sessionId - Session ID
 * @param {number} slideIndex - Slide index
 * @param {string} objectId - Object ID
 * @returns {Promise<void>}
 */
export async function deleteObjectFromActiveSession(sessionId, slideIndex, objectId) {
  try {
    const activeSessionRef = doc(db, ACTIVE_SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(activeSessionRef);

    if (!sessionDoc.exists()) {
      console.warn('⚠️ Active session not found, cannot delete object.');
      return;
    }

    const sessionData = sessionDoc.data();
    const slides = [...(sessionData.slides || [])];

    if (slides[slideIndex] && slides[slideIndex].objects) {
      slides[slideIndex].objects = slides[slideIndex].objects.filter(obj => obj.id !== objectId);

      await updateDoc(activeSessionRef, {
        slides,
        updatedAt: serverTimestamp()
      });

      console.log('✅ [Firebase/whiteboard] Object deleted');
    }
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error deleting object:', error);
  }
}

/**
 * Subscribe to active whiteboard session changes
 * @param {string} sessionId - Session ID
 * @param {Function} callback - Callback function to handle updates
 * @returns {Function} Unsubscribe function
 */
export function subscribeToActiveWhiteboardSession(sessionId, callback) {
  const activeSessionRef = doc(db, ACTIVE_SESSIONS_COLLECTION, sessionId);

  return onSnapshot(activeSessionRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('❌ [Firebase/whiteboard] Error in snapshot listener:', error);
    callback(null);
  });
}

/**
 * Get active whiteboard session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object|null>} Session data or null
 */
export async function getActiveWhiteboardSession(sessionId) {
  try {
    const activeSessionRef = doc(db, ACTIVE_SESSIONS_COLLECTION, sessionId);
    const docSnap = await getDoc(activeSessionRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error getting active session:', error);
    throw error;
  }
}

/**
 * End an active whiteboard session (mark as inactive)
 * @param {string} sessionId - Session ID
 * @returns {Promise<void>}
 */
export async function endActiveWhiteboardSession(sessionId) {
  try {
    const activeSessionRef = doc(db, ACTIVE_SESSIONS_COLLECTION, sessionId);

    await updateDoc(activeSessionRef, {
      isActive: false,
      endedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('✅ [Firebase/whiteboard] Session ended');
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error ending session:', error);
    throw error;
  }
}

// ============================================
// SHARED CONTENT FUNCTIONS
// ============================================

/**
 * Share content (video, PDF, exercise, image) in active session
 * @param {string} sessionId - Session ID
 * @param {Object} content - Content object { type, url, data, title }
 * @returns {Promise<void>}
 */
export async function shareContentInSession(sessionId, content) {
  try {
    console.log('📤 [Firebase/whiteboard] Sharing content:', content.type);

    const activeSessionRef = doc(db, ACTIVE_SESSIONS_COLLECTION, sessionId);

    await updateDoc(activeSessionRef, {
      sharedContent: {
        type: content.type, // 'video', 'pdf', 'exercise', 'image'
        url: content.url || null,
        data: content.data || null,
        title: content.title || 'Contenido compartido',
        sharedAt: Date.now()
      },
      updatedAt: serverTimestamp()
    });

    console.log('✅ [Firebase/whiteboard] Content shared successfully');
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error sharing content:', error);
    throw error;
  }
}

/**
 * Clear shared content from active session
 * @param {string} sessionId - Session ID
 * @returns {Promise<void>}
 */
export async function clearSharedContent(sessionId) {
  try {
    const activeSessionRef = doc(db, ACTIVE_SESSIONS_COLLECTION, sessionId);

    await updateDoc(activeSessionRef, {
      sharedContent: null,
      updatedAt: serverTimestamp()
    });

    console.log('✅ [Firebase/whiteboard] Shared content cleared');
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error clearing shared content:', error);
    throw error;
  }
}

/**
 * Update video playback state (time, playing/paused)
 * @param {string} sessionId - Session ID
 * @param {Object} playbackState - { currentTime, isPlaying }
 * @returns {Promise<void>}
 */
export async function updateVideoPlayback(sessionId, playbackState) {
  try {
    const activeSessionRef = doc(db, ACTIVE_SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(activeSessionRef);

    if (!sessionDoc.exists() || sessionDoc.data().sharedContent?.type !== 'video') {
      return;
    }

    await updateDoc(activeSessionRef, {
      'sharedContent.playbackState': {
        currentTime: playbackState.currentTime,
        isPlaying: playbackState.isPlaying,
        updatedAt: Date.now()
      },
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error updating video playback:', error);
    // Don't throw - playback sync failures shouldn't break the app
  }
}

/**
 * Update PDF page number
 * @param {string} sessionId - Session ID
 * @param {number} pageNumber - Current page number
 * @returns {Promise<void>}
 */
export async function updatePDFPage(sessionId, pageNumber) {
  try {
    const activeSessionRef = doc(db, ACTIVE_SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(activeSessionRef);

    if (!sessionDoc.exists() || sessionDoc.data().sharedContent?.type !== 'pdf') {
      return;
    }

    await updateDoc(activeSessionRef, {
      'sharedContent.currentPage': pageNumber,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error updating PDF page:', error);
  }
}

/**
 * Update active selection (which object a user is selecting)
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @param {string} userName - User name
 * @param {string|null} objectId - Selected object ID (null to clear selection)
 * @param {number|null} slideIndex - Slide index
 * @returns {Promise<void>}
 */
export async function updateActiveSelection(sessionId, userId, userName, objectId, slideIndex) {
  try {
    const activeSessionRef = doc(db, ACTIVE_SESSIONS_COLLECTION, sessionId);

    if (objectId === null) {
      // Clear selection for this user
      await updateDoc(activeSessionRef, {
        [`activeSelections.${userId}`]: null,
        updatedAt: serverTimestamp()
      });
    } else {
      // Set selection
      await updateDoc(activeSessionRef, {
        [`activeSelections.${userId}`]: {
          objectId,
          slideIndex,
          userName,
          timestamp: Date.now()
        },
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error updating active selection:', error);
    // Don't throw - selection updates are not critical
  }
}

// ============================================================================
// ASSIGNMENT & LIVE SESSION FUNCTIONS
// ============================================================================

/**
 * Assign students to a whiteboard session
 * @param {string} sessionId - Whiteboard session ID
 * @param {Array<string>} studentIds - Array of student user IDs
 * @returns {Promise<void>}
 */
export async function assignStudentsToWhiteboard(sessionId, studentIds) {
  try {
    const sessionRef = doc(db, COLLECTION, sessionId);
    await updateDoc(sessionRef, {
      assignedStudents: studentIds,
      updatedAt: serverTimestamp()
    });
    console.log('✅ [Firebase/whiteboard] Students assigned to whiteboard:', sessionId);
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error assigning students:', error);
    throw error;
  }
}

/**
 * Assign groups to a whiteboard session
 * @param {string} sessionId - Whiteboard session ID
 * @param {Array<string>} groupIds - Array of group IDs
 * @returns {Promise<void>}
 */
export async function assignGroupsToWhiteboard(sessionId, groupIds) {
  try {
    const sessionRef = doc(db, COLLECTION, sessionId);
    await updateDoc(sessionRef, {
      assignedGroups: groupIds,
      updatedAt: serverTimestamp()
    });
    console.log('✅ [Firebase/whiteboard] Groups assigned to whiteboard:', sessionId);
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error assigning groups:', error);
    throw error;
  }
}

/**
 * Start a live collaborative session for a whiteboard
 * @param {string} sessionId - Whiteboard session ID
 * @param {string} liveSessionId - ID for the active collaborative session
 * @returns {Promise<void>}
 */
export async function startLiveSession(sessionId, liveSessionId) {
  try {
    const sessionRef = doc(db, COLLECTION, sessionId);
    await updateDoc(sessionRef, {
      isLive: true,
      liveSessionId: liveSessionId,
      liveStartedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ [Firebase/whiteboard] Live session started:', liveSessionId);
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error starting live session:', error);
    throw error;
  }
}

/**
 * End a live collaborative session
 * @param {string} sessionId - Whiteboard session ID
 * @returns {Promise<void>}
 */
export async function endLiveSession(sessionId) {
  try {
    const sessionRef = doc(db, COLLECTION, sessionId);
    await updateDoc(sessionRef, {
      isLive: false,
      liveSessionId: null,
      liveEndedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ [Firebase/whiteboard] Live session ended');
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error ending live session:', error);
    throw error;
  }
}

/**
 * Get whiteboards assigned to a student
 * @param {string} studentId - Student user ID
 * @returns {Promise<Array>} Array of assigned whiteboard sessions
 */
export async function getAssignedWhiteboards(studentId) {
  try {
    const whiteboardsRef = collection(db, COLLECTION);
    const q = query(
      whiteboardsRef,
      where('assignedStudents', 'array-contains', studentId),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const whiteboards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('✅ [Firebase/whiteboard] Found', whiteboards.length, 'assigned whiteboards for student');
    return whiteboards;
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error getting assigned whiteboards:', error);
    return [];
  }
}

/**
 * Subscribe to live whiteboard sessions for a student
 * @param {string} studentId - Student user ID
 * @param {Function} callback - Callback function to receive updates
 * @returns {Function} Unsubscribe function
 */
export function subscribeToLiveWhiteboards(studentId, callback) {
  try {
    const whiteboardsRef = collection(db, COLLECTION);
    const q = query(
      whiteboardsRef,
      where('assignedStudents', 'array-contains', studentId),
      where('isLive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveWhiteboards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(liveWhiteboards);
    });

    return unsubscribe;
  } catch (error) {
    console.error('❌ [Firebase/whiteboard] Error subscribing to live whiteboards:', error);
    return () => {};
  }
}
