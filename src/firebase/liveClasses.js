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
import { getFunctions, httpsCallable } from 'firebase/functions';

// Configuración de LiveKit
export const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';

/**
 * Genera un token JWT para unirse a una sala de LiveKit
 * IMPORTANTE: Ahora usa Firebase Cloud Function para generar tokens de forma segura
 *
 * @param {string} roomName - Nombre de la sala
 * @param {string} participantName - Nombre del participante
 * @param {object} metadata - Metadata adicional del participante
 * @returns {Promise<string>} Token JWT
 */
export async function generateLiveKitToken(roomName, participantName, metadata = {}) {
  try {
    const functions = getFunctions();
    const generateToken = httpsCallable(functions, 'generateLiveKitToken');

    const result = await generateToken({
      roomName,
      participantName,
      metadata
    });

    if (!result.data || !result.data.token) {
      throw new Error('No se recibió token de la Cloud Function');
    }

    return result.data.token;
  } catch (error) {
    logger.error('Error calling generateLiveKitToken Cloud Function:', error);
    throw new Error(`Error generando token: ${error.message}`);
  }
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
  maxParticipants = 30,
  meetLink = '',
  zoomLink = '',
  whiteboardType = 'excalidraw',
  assignedStudents = [],
  assignedGroups = [],
  assignedContent = []
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
      meetLink: meetLink || '',
      zoomLink: zoomLink || '',
      whiteboardType: whiteboardType || 'excalidraw',
      assignedStudents: assignedStudents || [],
      assignedGroups: assignedGroups || [],
      assignedContent: assignedContent || [],
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
    // Query sin orderBy para evitar índice compuesto (ordenamos en memoria)
    const q = query(
      collection(db, 'live_classes'),
      where('teacherId', '==', teacherId)
    );

    const snapshot = await getDocs(q);
    const classes = [];

    snapshot.forEach(doc => {
      classes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Ordenar en memoria por scheduledStart descendente
    classes.sort((a, b) => {
      const aTime = a.scheduledStart?.toMillis?.() || 0;
      const bTime = b.scheduledStart?.toMillis?.() || 0;
      return bTime - aTime; // desc
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

    // Agregar participante (usar Timestamp.now() en lugar de serverTimestamp() porque no se permite en arrays)
    await updateDoc(classRef, {
      participants: [
        ...data.participants,
        {
          userId,
          userName,
          joinedAt: Timestamp.now()
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

/**
 * Asigna un estudiante a una clase en vivo
 * @param {string} classId - ID de la clase
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<object>}
 */
export async function assignStudentToLiveClass(classId, studentId) {
  try {
    const classRef = doc(db, 'live_classes', classId);
    const classDoc = await getDoc(classRef);

    if (!classDoc.exists()) {
      throw new Error('Clase no encontrada');
    }

    const data = classDoc.data();
    const assignedStudents = data.assignedStudents || [];

    if (assignedStudents.includes(studentId)) {
      return { success: true, message: 'Estudiante ya asignado' };
    }

    await updateDoc(classRef, {
      assignedStudents: [...assignedStudents, studentId]
    });

    return { success: true };
  } catch (error) {
    logger.error('Error assigning student to live class:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Desasigna un estudiante de una clase en vivo
 * @param {string} classId - ID de la clase
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<object>}
 */
export async function unassignStudentFromLiveClass(classId, studentId) {
  try {
    const classRef = doc(db, 'live_classes', classId);
    const classDoc = await getDoc(classRef);

    if (!classDoc.exists()) {
      throw new Error('Clase no encontrada');
    }

    const data = classDoc.data();
    const assignedStudents = data.assignedStudents || [];

    await updateDoc(classRef, {
      assignedStudents: assignedStudents.filter(id => id !== studentId)
    });

    return { success: true };
  } catch (error) {
    logger.error('Error unassigning student from live class:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Asigna un grupo a una clase en vivo
 * @param {string} classId - ID de la clase
 * @param {string} groupId - ID del grupo
 * @returns {Promise<object>}
 */
export async function assignGroupToLiveClass(classId, groupId) {
  try {
    const classRef = doc(db, 'live_classes', classId);
    const classDoc = await getDoc(classRef);

    if (!classDoc.exists()) {
      throw new Error('Clase no encontrada');
    }

    const data = classDoc.data();
    const assignedGroups = data.assignedGroups || [];

    if (assignedGroups.includes(groupId)) {
      return { success: true, message: 'Grupo ya asignado' };
    }

    await updateDoc(classRef, {
      assignedGroups: [...assignedGroups, groupId]
    });

    return { success: true };
  } catch (error) {
    logger.error('Error assigning group to live class:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Desasigna un grupo de una clase en vivo
 * @param {string} classId - ID de la clase
 * @param {string} groupId - ID del grupo
 * @returns {Promise<object>}
 */
export async function unassignGroupFromLiveClass(classId, groupId) {
  try {
    const classRef = doc(db, 'live_classes', classId);
    const classDoc = await getDoc(classRef);

    if (!classDoc.exists()) {
      throw new Error('Clase no encontrada');
    }

    const data = classDoc.data();
    const assignedGroups = data.assignedGroups || [];

    await updateDoc(classRef, {
      assignedGroups: assignedGroups.filter(id => id !== groupId)
    });

    return { success: true };
  } catch (error) {
    logger.error('Error unassigning group from live class:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Asigna contenido a una clase en vivo
 * @param {string} classId - ID de la clase
 * @param {string} contentId - ID del contenido
 * @returns {Promise<object>}
 */
export async function assignContentToLiveClass(classId, contentId) {
  try {
    const classRef = doc(db, 'live_classes', classId);
    const classDoc = await getDoc(classRef);

    if (!classDoc.exists()) {
      throw new Error('Clase no encontrada');
    }

    const data = classDoc.data();
    const assignedContent = data.assignedContent || [];

    if (assignedContent.includes(contentId)) {
      return { success: true, message: 'Contenido ya asignado' };
    }

    await updateDoc(classRef, {
      assignedContent: [...assignedContent, contentId]
    });

    return { success: true };
  } catch (error) {
    logger.error('Error assigning content to live class:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Desasigna contenido de una clase en vivo
 * @param {string} classId - ID de la clase
 * @param {string} contentId - ID del contenido
 * @returns {Promise<object>}
 */
export async function unassignContentFromLiveClass(classId, contentId) {
  try {
    const classRef = doc(db, 'live_classes', classId);
    const classDoc = await getDoc(classRef);

    if (!classDoc.exists()) {
      throw new Error('Clase no encontrada');
    }

    const data = classDoc.data();
    const assignedContent = data.assignedContent || [];

    await updateDoc(classRef, {
      assignedContent: assignedContent.filter(id => id !== contentId)
    });

    return { success: true };
  } catch (error) {
    logger.error('Error unassigning content from live class:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualiza los datos generales de una clase en vivo
 * @param {string} classId - ID de la clase
 * @param {object} updates - Datos a actualizar
 * @returns {Promise<object>}
 */
export async function updateLiveClass(classId, updates) {
  try {
    const classRef = doc(db, 'live_classes', classId);

    await updateDoc(classRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    logger.error('Error updating live class:', error);
    return { success: false, error: error.message };
  }
}
