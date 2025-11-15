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
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './config';
import logger from '../utils/logger';


const MEET_SESSIONS_COLLECTION = 'meet_sessions';

/**
 * Crea una nueva sesión MEET al iniciar una clase
 * @param {Object} sessionData - Datos de la sesión
 * @param {string} sessionData.classSessionId - ID de la class_session
 * @param {string} sessionData.ownerId - ID del profesor/admin
 * @param {string} sessionData.ownerName - Nombre del profesor
 * @param {string} sessionData.roomName - Nombre único del room de LiveKit
 * @param {string} sessionData.sessionName - Nombre de la clase
 * @param {string} sessionData.courseId - ID del curso (opcional)
 * @param {string} sessionData.courseName - Nombre del curso (opcional)
 * @returns {Promise<string>} ID de la meet session creada
 */
export async function createMeetSession(sessionData) {
  try {
    const meetSessionRef = await addDoc(collection(db, MEET_SESSIONS_COLLECTION), {
      classSessionId: sessionData.classSessionId,
      ownerId: sessionData.ownerId,
      ownerName: sessionData.ownerName,
      roomName: sessionData.roomName,
      sessionName: sessionData.sessionName,
      courseId: sessionData.courseId || null,
      courseName: sessionData.courseName || null,

      // URL de acceso directo
      joinUrl: `${window.location.origin}/class-session/${sessionData.classSessionId}`,

      // Estado
      status: 'active', // active | ended

      // Participantes (se actualiza en tiempo real)
      participantCount: 0,

      // Metadata
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    logger.debug('✅ Meet session creada:', meetSessionRef.id);
    return meetSessionRef.id;
  } catch (error) {
    logger.error('❌ Error creando meet session:', error);
    throw error;
  }
}

/**
 * Obtiene una meet session por ID
 * @param {string} meetSessionId - ID de la meet session
 * @returns {Promise<Object|null>} Datos de la meet session
 */
export async function getMeetSession(meetSessionId) {
  try {
    const meetSessionDoc = await getDoc(doc(db, MEET_SESSIONS_COLLECTION, meetSessionId));

    if (meetSessionDoc.exists()) {
      return {
        id: meetSessionDoc.id,
        ...meetSessionDoc.data()
      };
    }

    return null;
  } catch (error) {
    logger.error('❌ Error obteniendo meet session:', error);
    throw error;
  }
}

/**
 * Obtiene una meet session por classSessionId
 * @param {string} classSessionId - ID de la class_session
 * @returns {Promise<Object|null>} Datos de la meet session activa
 */
export async function getMeetSessionByClassId(classSessionId) {
  try {
    const q = query(
      collection(db, MEET_SESSIONS_COLLECTION),
      where('classSessionId', '==', classSessionId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }

    return null;
  } catch (error) {
    logger.error('❌ Error obteniendo meet session por classId:', error);
    throw error;
  }
}

/**
 * Obtiene todas las meet sessions activas
 * @returns {Promise<Array>} Array de meet sessions activas
 */
export async function getActiveMeetSessions() {
  try {
    const q = query(
      collection(db, MEET_SESSIONS_COLLECTION),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    logger.error('❌ Error obteniendo meet sessions activas:', error);
    throw error;
  }
}

/**
 * Obtiene meet sessions por profesor
 * @param {string} teacherId - ID del profesor
 * @param {boolean} activeOnly - Solo sesiones activas (default: true)
 * @returns {Promise<Array>} Array de meet sessions
 */
export async function getMeetSessionsByTeacher(teacherId, activeOnly = true) {
  try {
    let q = query(
      collection(db, MEET_SESSIONS_COLLECTION),
      where('ownerId', '==', teacherId)
    );

    if (activeOnly) {
      q = query(q, where('status', '==', 'active'));
    }

    q = query(q, orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    logger.error('❌ Error obteniendo meet sessions del profesor:', error);
    throw error;
  }
}

/**
 * Actualiza el contador de participantes
 * @param {string} meetSessionId - ID de la meet session
 * @param {number} count - Nuevo número de participantes
 */
export async function updateParticipantCount(meetSessionId, count) {
  try {
    const meetSessionRef = doc(db, MEET_SESSIONS_COLLECTION, meetSessionId);
    await updateDoc(meetSessionRef, {
      participantCount: count,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    logger.error('❌ Error actualizando contador de participantes:', error);
    throw error;
  }
}

/**
 * Finaliza una meet session
 * @param {string} meetSessionId - ID de la meet session
 */
export async function endMeetSession(meetSessionId) {
  try {
    const meetSessionRef = doc(db, MEET_SESSIONS_COLLECTION, meetSessionId);
    await updateDoc(meetSessionRef, {
      status: 'ended',
      endedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    logger.debug('✅ Meet session finalizada:', meetSessionId);
  } catch (error) {
    logger.error('❌ Error finalizando meet session:', error);
    throw error;
  }
}

/**
 * Finaliza una meet session por classSessionId
 * @param {string} classSessionId - ID de la class_session
 */
export async function endMeetSessionByClassId(classSessionId) {
  try {
    const meetSession = await getMeetSessionByClassId(classSessionId);

    if (meetSession) {
      await endMeetSession(meetSession.id);
    }
  } catch (error) {
    logger.error('❌ Error finalizando meet session por classId:', error);
    throw error;
  }
}

/**
 * Elimina una meet session (solo si ya finalizó)
 * @param {string} meetSessionId - ID de la meet session
 */
export async function deleteMeetSession(meetSessionId) {
  try {
    const meetSession = await getMeetSession(meetSessionId);

    if (meetSession && meetSession.status === 'ended') {
      await deleteDoc(doc(db, MEET_SESSIONS_COLLECTION, meetSessionId));
      logger.debug('✅ Meet session eliminada:', meetSessionId);
    } else {
      throw new Error('Solo se pueden eliminar meet sessions finalizadas');
    }
  } catch (error) {
    logger.error('❌ Error eliminando meet session:', error);
    throw error;
  }
}

/**
 * Escucha cambios en tiempo real de una meet session
 * @param {string} meetSessionId - ID de la meet session
 * @param {Function} callback - Función que recibe los datos actualizados
 * @returns {Function} Función para cancelar la suscripción
 */
export function subscribeMeetSession(meetSessionId, callback) {
  const meetSessionRef = doc(db, MEET_SESSIONS_COLLECTION, meetSessionId);

  return onSnapshot(meetSessionRef, (doc) => {
    if (doc.exists()) {
      callback({
        id: doc.id,
        ...doc.data()
      });
    } else {
      callback(null);
    }
  }, (error) => {
    logger.error('❌ Error en listener de meet session:', error);
  });
}

/**
 * Escucha meet sessions activas en tiempo real
 * @param {Function} callback - Función que recibe el array de meet sessions
 * @returns {Function} Función para cancelar la suscripción
 */
export function subscribeActiveMeetSessions(callback) {
  const q = query(
    collection(db, MEET_SESSIONS_COLLECTION),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(sessions);
  }, (error) => {
    logger.error('❌ Error en listener de meet sessions activas:', error);
  });
}

/**
 * Escucha meet sessions de un profesor en tiempo real
 * @param {string} teacherId - ID del profesor
 * @param {Function} callback - Función que recibe el array de meet sessions
 * @returns {Function} Función para cancelar la suscripción
 */
export function subscribeTeacherMeetSessions(teacherId, callback) {
  const q = query(
    collection(db, MEET_SESSIONS_COLLECTION),
    where('ownerId', '==', teacherId),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(sessions);
  }, (error) => {
    logger.error('❌ Error en listener de meet sessions del profesor:', error);
  });
}
