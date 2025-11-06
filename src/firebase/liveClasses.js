import logger from '../utils/logger';

import { db } from './config';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { AccessToken } from 'livekit-server-sdk';

// Configuración de LiveKit
// NOTA: Estos valores deben estar en variables de entorno en producción
const LIVEKIT_API_KEY = import.meta.env.VITE_LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = import.meta.env.VITE_LIVEKIT_API_SECRET || 'secret';
export const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';

/**
 * Genera un token JWT para unirse a una sala de LiveKit
 * @param {string} roomName - Nombre de la sala
 * @param {string} participantName - Nombre del participante
 * @param {object} metadata - Metadata adicional del participante
 * @returns {string} Token JWT
 */
export function generateLiveKitToken(roomName, participantName, metadata = {}) {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantName,
    metadata: JSON.stringify(metadata)
  });

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true
  });

  return at.toJwt();
}

/**
 * Crea una nueva clase en vivo
 * @param {object} data - Datos de la clase
 * @returns {Promise<object>} ID de la clase y roomName
 */
export async function createLiveClass({
  teacherId,
  teacherName,
  courseId,
  courseName,
  title,
  description,
  scheduledStart,
  duration = 60,
  maxParticipants = 30
}) {
  try {
    const roomName = `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const docRef = await addDoc(collection(db, 'live_classes'), {
      teacherId,
      teacherName,
      courseId: courseId || null,
      courseName: courseName || null,
      title,
      description: description || '',
      roomName,
      scheduledStart: scheduledStart instanceof Timestamp ? scheduledStart : Timestamp.fromDate(scheduledStart),
      duration,
      startedAt: null,
      endedAt: null,
      status: 'scheduled', // scheduled, live, ended, cancelled
      participants: [],
      maxParticipants,
      recordingEnabled: false,
      recordingUrl: null,
      createdAt: serverTimestamp()
    });

    return {
      id: docRef.id,
      roomName
    };
  } catch (error) {
    logger.error('Error creating live class:', error);
    throw error;
  }
}

/**
 * Obtiene una clase por ID
 * @param {string} classId - ID de la clase
 * @returns {Promise<object>} Datos de la clase
 */
export async function getLiveClass(classId) {
  try {
    const classDoc = await getDoc(doc(db, 'live_classes', classId));

    if (!classDoc.exists()) {
      throw new Error('Clase no encontrada');
    }

    return {
      id: classDoc.id,
      ...classDoc.data()
    };
  } catch (error) {
    logger.error('Error getting live class:', error);
    throw error;
  }
}

/**
 * Obtiene todas las clases de un profesor
 * @param {string} teacherId - ID del profesor
 * @returns {Promise<array>} Lista de clases
 */
export async function getTeacherLiveClasses(teacherId) {
  try {
    const q = query(
      collection(db, 'live_classes'),
      where('teacherId', '==', teacherId),
      orderBy('scheduledStart', 'desc')
    );

    const snapshot = await getDocs(q);
    const classes = [];

    snapshot.forEach(doc => {
      classes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return classes;
  } catch (error) {
    logger.error('Error getting teacher live classes:', error);
    throw error;
  }
}

/**
 * Obtiene clases disponibles para un estudiante (de sus cursos)
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<array>} Lista de clases
 */
export async function getStudentAvailableLiveClasses(studentId) {
  try {
    // Primero obtener los cursos del estudiante
    const enrollmentsQuery = query(
      collection(db, 'course_enrollments'),
      where('studentId', '==', studentId)
    );

    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const courseIds = [];
    enrollmentsSnapshot.forEach(doc => {
      courseIds.push(doc.data().courseId);
    });

    if (courseIds.length === 0) {
      return [];
    }

    // Obtener clases de esos cursos que están programadas o en vivo
    const classesQuery = query(
      collection(db, 'live_classes'),
      where('courseId', 'in', courseIds.slice(0, 10)), // Firestore limita a 10
      where('status', 'in', ['scheduled', 'live']),
      orderBy('scheduledStart', 'asc')
    );

    const snapshot = await getDocs(classesQuery);
    const classes = [];

    snapshot.forEach(doc => {
      classes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return classes;
  } catch (error) {
    logger.error('Error getting student available classes:', error);
    throw error;
  }
}

/**
 * Inicia una clase (cambia estado a live)
 * @param {string} classId - ID de la clase
 * @returns {Promise<void>}
 */
export async function startLiveClass(classId) {
  try {
    const classRef = doc(db, 'live_classes', classId);

    await updateDoc(classRef, {
      status: 'live',
      startedAt: serverTimestamp()
    });
  } catch (error) {
    logger.error('Error starting live class:', error);
    throw error;
  }
}

/**
 * Finaliza una clase
 * @param {string} classId - ID de la clase
 * @returns {Promise<void>}
 */
export async function endLiveClass(classId) {
  try {
    const classRef = doc(db, 'live_classes', classId);

    await updateDoc(classRef, {
      status: 'ended',
      endedAt: serverTimestamp()
    });
  } catch (error) {
    logger.error('Error ending live class:', error);
    throw error;
  }
}

/**
 * Cancela una clase programada
 * @param {string} classId - ID de la clase
 * @returns {Promise<void>}
 */
export async function cancelLiveClass(classId) {
  try {
    const classRef = doc(db, 'live_classes', classId);

    await updateDoc(classRef, {
      status: 'cancelled'
    });
  } catch (error) {
    logger.error('Error cancelling live class:', error);
    throw error;
  }
}

/**
 * Elimina una clase
 * @param {string} classId - ID de la clase
 * @returns {Promise<void>}
 */
export async function deleteLiveClass(classId) {
  try {
    await deleteDoc(doc(db, 'live_classes', classId));
  } catch (error) {
    logger.error('Error deleting live class:', error);
    throw error;
  }
}

/**
 * Agrega un participante a una clase
 * @param {string} classId - ID de la clase
 * @param {string} userId - ID del usuario
 * @param {string} userName - Nombre del usuario
 * @returns {Promise<void>}
 */
export async function joinLiveClass(classId, userId, userName) {
  try {
    const classRef = doc(db, 'live_classes', classId);
    const classDoc = await getDoc(classRef);

    if (!classDoc.exists()) {
      throw new Error('Clase no encontrada');
    }

    const data = classDoc.data();

    // Verificar si ya está en la clase
    if (data.participants.some(p => p.userId === userId)) {
      return; // Ya está en la clase
    }

    // Verificar capacidad
    if (data.participants.length >= data.maxParticipants) {
      throw new Error('Clase llena');
    }

    // Agregar participante
    await updateDoc(classRef, {
      participants: [
        ...data.participants,
        {
          userId,
          userName,
          joinedAt: serverTimestamp()
        }
      ]
    });
  } catch (error) {
    logger.error('Error joining live class:', error);
    throw error;
  }
}

/**
 * Remueve un participante de una clase
 * @param {string} classId - ID de la clase
 * @param {string} userId - ID del usuario
 * @returns {Promise<void>}
 */
export async function leaveLiveClass(classId, userId) {
  try {
    const classRef = doc(db, 'live_classes', classId);
    const classDoc = await getDoc(classRef);

    if (!classDoc.exists()) {
      return;
    }

    const data = classDoc.data();

    // Filtrar participante
    const updatedParticipants = data.participants.filter(p => p.userId !== userId);

    await updateDoc(classRef, {
      participants: updatedParticipants
    });
  } catch (error) {
    logger.error('Error leaving live class:', error);
    throw error;
  }
}

/**
 * Actualiza la URL de grabación de una clase
 * @param {string} classId - ID de la clase
 * @param {string} recordingUrl - URL de la grabación
 * @returns {Promise<void>}
 */
export async function updateClassRecording(classId, recordingUrl) {
  try {
    const classRef = doc(db, 'live_classes', classId);

    await updateDoc(classRef, {
      recordingUrl,
      recordingEnabled: true
    });
  } catch (error) {
    logger.error('Error updating class recording:', error);
    throw error;
  }
}
