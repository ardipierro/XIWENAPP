import logger from '../utils/logger';

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
import { db } from './config';
import { createMeetSession, endMeetSessionByClassId } from './meetSessions';
import { notifyClassStarted, notifyClassEnded } from './notifications';

/**
 * Sistema Unificado de Sesiones de Clase
 * Integra: LiveKit + Pizarras (Canvas/Excalidraw) + Programación (single/recurring)
 */

/**
 * Crear una nueva sesión de clase
 * @param {Object} sessionData - Datos de la sesión
 * @returns {Promise<Object>} - {success: boolean, sessionId?: string, roomName?: string, error?: string}
 */
export async function createClassSession(sessionData) {
  try {
    const {
      name,
      description = '',
      courseId = null,
      courseName = '',
      teacherId,
      teacherName,

      // Modalidad
      mode = 'async', // 'live' | 'async'
      whiteboardType = 'none', // 'none' | 'canvas' | 'excalidraw'

      // Programación
      type = 'single', // 'single' | 'recurring'
      scheduledStart = null, // Timestamp para single
      schedules = [], // [{ day, startTime, endTime }] para recurring
      duration = 60, // minutos

      // LiveKit (si mode='live')
      maxParticipants = 30,
      recordingEnabled = false,

      // Asignación
      assignedGroups = [],
      assignedStudents = [],
      contentIds = [],

      // Meta
      creditCost = 1,
      meetingLink = '', // deprecated
      meetLink = '',
      zoomLink = '',
      imageUrl = ''
    } = sessionData;

    // Validaciones
    if (!name || !teacherId) {
      return { success: false, error: 'Nombre y profesor son requeridos' };
    }

    if (type === 'single' && !scheduledStart) {
      return { success: false, error: 'Fecha de inicio es requerida para sesiones únicas' };
    }

    if (type === 'recurring' && schedules.length === 0) {
      return { success: false, error: 'Debe definir al menos un horario para sesiones recurrentes' };
    }

    // Generar roomName único si es live
    const roomName = mode === 'live'
      ? `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : null;

    const newSession = {
      name,
      description,
      courseId,
      courseName,
      teacherId,
      teacherName,

      // Modalidad
      mode,
      whiteboardType,

      // Programación
      type,
      scheduledStart: type === 'single' && scheduledStart
        ? (scheduledStart instanceof Timestamp ? scheduledStart : Timestamp.fromDate(scheduledStart))
        : null,
      schedules: type === 'recurring' ? schedules : [],
      duration,

      // LiveKit
      roomName,
      maxParticipants: mode === 'live' ? maxParticipants : null,
      recordingEnabled: mode === 'live' ? recordingEnabled : false,
      recordingUrl: null,

      // Pizarra (se asignará al crear/abrir la sesión)
      canvasSessionId: null,
      excalidrawSessionId: null,

      // Asignación
      assignedGroups,
      assignedStudents,
      contentIds,

      // Estado
      status: 'scheduled', // 'scheduled' | 'live' | 'ended' | 'cancelled'
      startedAt: null,
      endedAt: null,
      participants: [],

      // Meta
      creditCost,
      meetingLink, // deprecated
      meetLink,
      zoomLink,
      imageUrl,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'class_sessions'), newSession);

    logger.info('✅ Sesión de clase creada:', docRef.id);
    return { success: true, sessionId: docRef.id, roomName };
  } catch (error) {
    logger.error('❌ Error creando sesión de clase:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar una sesión existente
 * @param {string} sessionId - ID de la sesión
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function updateClassSession(sessionId, updates) {
  try {
    const docRef = doc(db, 'class_sessions', sessionId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    logger.info('✅ Sesión actualizada:', sessionId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error actualizando sesión:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar una sesión
 * @param {string} sessionId - ID de la sesión
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function deleteClassSession(sessionId) {
  try {
    await deleteDoc(doc(db, 'class_sessions', sessionId));
    logger.info('✅ Sesión eliminada:', sessionId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error eliminando sesión:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener sesión por ID
 * @param {string} sessionId - ID de la sesión
 * @returns {Promise<Object|null>} - Sesión o null
 */
export async function getClassSession(sessionId) {
  try {
    const docRef = doc(db, 'class_sessions', sessionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    logger.error('❌ Error obteniendo sesión:', error);
    return null;
  }
}

/**
 * Obtener todas las sesiones de un profesor
 * @param {string} teacherId - ID del profesor
 * @returns {Promise<Array>} - Array de sesiones
 */
export async function getTeacherSessions(teacherId) {
  try {
    // Query sin orderBy para evitar requisito de índice compuesto
    const q = query(
      collection(db, 'class_sessions'),
      where('teacherId', '==', teacherId),
      where('active', '==', true)
    );

    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar en el cliente por createdAt (desc)
    return sessions.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
  } catch (error) {
    logger.error('❌ Error obteniendo sesiones del profesor:', error);
    return [];
  }
}

/**
 * Obtener sesiones asignadas a un estudiante
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<Array>} - Array de sesiones
 */
export async function getStudentSessions(studentId) {
  try {
    const q = query(
      collection(db, 'class_sessions'),
      where('assignedStudents', 'array-contains', studentId),
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    logger.error('❌ Error obteniendo sesiones del estudiante:', error);
    return [];
  }
}

/**
 * Obtener sesiones en vivo (status='live')
 * @param {string} teacherId - ID del profesor (opcional)
 * @returns {Promise<Array>} - Array de sesiones
 */
export async function getLiveSessions(teacherId = null) {
  try {
    let q;
    if (teacherId) {
      q = query(
        collection(db, 'class_sessions'),
        where('teacherId', '==', teacherId),
        where('status', '==', 'live'),
        orderBy('startedAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'class_sessions'),
        where('status', '==', 'live'),
        orderBy('startedAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    logger.error('❌ Error obteniendo sesiones en vivo:', error);
    return [];
  }
}

/**
 * Iniciar una sesión (cambiar status a 'live')
 * Crea automáticamente una meet session y notifica a los estudiantes asignados
 * @param {string} sessionId - ID de la sesión
 * @returns {Promise<Object>} - {success: boolean, meetSessionId?: string, error?: string}
 */
export async function startClassSession(sessionId) {
  try {
    // 1. Obtener datos de la sesión
    const sessionDoc = await getDoc(doc(db, 'class_sessions', sessionId));

    if (!sessionDoc.exists()) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const sessionData = sessionDoc.data();

    // 2. Actualizar status a 'live'
    const docRef = doc(db, 'class_sessions', sessionId);
    await updateDoc(docRef, {
      status: 'live',
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    let meetSessionId = null;

    // 3. Crear meet_session automáticamente si es modo 'live'
    if (sessionData.mode === 'live') {
      try {
        meetSessionId = await createMeetSession({
          classSessionId: sessionId,
          ownerId: sessionData.teacherId,
          ownerName: sessionData.teacherName,
          roomName: sessionData.roomName,
          sessionName: sessionData.name,
          courseId: sessionData.courseId,
          courseName: sessionData.courseName
        });

        // Guardar referencia al meet_session en class_session
        await updateDoc(docRef, {
          meetSessionId: meetSessionId
        });

        logger.info('✅ Meet session creada automáticamente:', meetSessionId);
      } catch (meetError) {
        logger.error('⚠️ Error creando meet session (no crítico):', meetError);
        // No detenemos el flujo si falla la creación de meet_session
      }
    }

    // 4. Notificar a estudiantes asignados
    const assignedStudents = sessionData.assignedStudents || [];

    if (assignedStudents.length > 0) {
      try {
        await notifyClassStarted(assignedStudents, {
          sessionId: sessionId,
          name: sessionData.name,
          teacherId: sessionData.teacherId,
          teacherName: sessionData.teacherName,
          courseId: sessionData.courseId,
          courseName: sessionData.courseName,
          joinUrl: `${window.location.origin}/class-session/${sessionId}`,
          roomName: sessionData.roomName
        });

        logger.info(`✅ ${assignedStudents.length} estudiantes notificados`);
      } catch (notifyError) {
        logger.error('⚠️ Error enviando notificaciones (no crítico):', notifyError);
        // No detenemos el flujo si fallan las notificaciones
      }
    }

    logger.info('✅ Sesión iniciada:', sessionId);
    return { success: true, meetSessionId };
  } catch (error) {
    logger.error('❌ Error iniciando sesión:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Finalizar una sesión (cambiar status a 'ended')
 * Finaliza automáticamente la meet session y notifica a los estudiantes
 * @param {string} sessionId - ID de la sesión
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function endClassSession(sessionId) {
  try {
    // 1. Obtener datos de la sesión
    const sessionDoc = await getDoc(doc(db, 'class_sessions', sessionId));

    if (!sessionDoc.exists()) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const sessionData = sessionDoc.data();

    // 2. Actualizar status a 'ended'
    const docRef = doc(db, 'class_sessions', sessionId);
    await updateDoc(docRef, {
      status: 'ended',
      endedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 3. Finalizar meet_session si existe
    if (sessionData.mode === 'live') {
      try {
        await endMeetSessionByClassId(sessionId);
        logger.info('✅ Meet session finalizada automáticamente');
      } catch (meetError) {
        logger.error('⚠️ Error finalizando meet session (no crítico):', meetError);
        // No detenemos el flujo si falla la finalización de meet_session
      }
    }

    // 4. Notificar a estudiantes que participaron
    const assignedStudents = sessionData.assignedStudents || [];

    if (assignedStudents.length > 0) {
      try {
        await notifyClassEnded(assignedStudents, {
          sessionId: sessionId,
          name: sessionData.name,
          teacherId: sessionData.teacherId,
          teacherName: sessionData.teacherName,
          recordingUrl: sessionData.recordingUrl || null
        });

        logger.info(`✅ ${assignedStudents.length} estudiantes notificados del fin de clase`);
      } catch (notifyError) {
        logger.error('⚠️ Error enviando notificaciones (no crítico):', notifyError);
        // No detenemos el flujo si fallan las notificaciones
      }
    }

    logger.info('✅ Sesión finalizada:', sessionId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error finalizando sesión:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancelar una sesión
 * @param {string} sessionId - ID de la sesión
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function cancelClassSession(sessionId) {
  try {
    const docRef = doc(db, 'class_sessions', sessionId);
    await updateDoc(docRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });

    logger.info('✅ Sesión cancelada:', sessionId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error cancelando sesión:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Asignar pizarra a una sesión
 * @param {string} sessionId - ID de la sesión
 * @param {string} whiteboardType - 'canvas' | 'excalidraw'
 * @param {string} whiteboardSessionId - ID de la sesión de pizarra
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function assignWhiteboardToSession(sessionId, whiteboardType, whiteboardSessionId) {
  try {
    const docRef = doc(db, 'class_sessions', sessionId);
    const updates = {
      whiteboardType,
      updatedAt: serverTimestamp()
    };

    if (whiteboardType === 'canvas') {
      updates.canvasSessionId = whiteboardSessionId;
    } else if (whiteboardType === 'excalidraw') {
      updates.excalidrawSessionId = whiteboardSessionId;
    }

    await updateDoc(docRef, updates);

    logger.info('✅ Pizarra asignada a sesión:', sessionId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error asignando pizarra:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Asignar grupo a sesión
 * @param {string} sessionId - ID de la sesión
 * @param {string} groupId - ID del grupo
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function assignGroupToSession(sessionId, groupId) {
  try {
    const docRef = doc(db, 'class_sessions', sessionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const currentGroups = docSnap.data().assignedGroups || [];
    if (currentGroups.includes(groupId)) {
      return { success: false, error: 'Grupo ya asignado' };
    }

    await updateDoc(docRef, {
      assignedGroups: [...currentGroups, groupId],
      updatedAt: serverTimestamp()
    });

    logger.info('✅ Grupo asignado a sesión:', sessionId, groupId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error asignando grupo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Desasignar grupo de sesión
 * @param {string} sessionId - ID de la sesión
 * @param {string} groupId - ID del grupo
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function unassignGroupFromSession(sessionId, groupId) {
  try {
    const docRef = doc(db, 'class_sessions', sessionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const currentGroups = docSnap.data().assignedGroups || [];
    const updatedGroups = currentGroups.filter(id => id !== groupId);

    await updateDoc(docRef, {
      assignedGroups: updatedGroups,
      updatedAt: serverTimestamp()
    });

    logger.info('✅ Grupo desasignado de sesión:', sessionId, groupId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error desasignando grupo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Asignar estudiante a sesión
 * @param {string} sessionId - ID de la sesión
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function assignStudentToSession(sessionId, studentId) {
  try {
    const docRef = doc(db, 'class_sessions', sessionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const currentStudents = docSnap.data().assignedStudents || [];
    if (currentStudents.includes(studentId)) {
      return { success: false, error: 'Estudiante ya asignado' };
    }

    await updateDoc(docRef, {
      assignedStudents: [...currentStudents, studentId],
      updatedAt: serverTimestamp()
    });

    logger.info('✅ Estudiante asignado a sesión:', sessionId, studentId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error asignando estudiante:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Desasignar estudiante de sesión
 * @param {string} sessionId - ID de la sesión
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function unassignStudentFromSession(sessionId, studentId) {
  try {
    const docRef = doc(db, 'class_sessions', sessionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const currentStudents = docSnap.data().assignedStudents || [];
    const updatedStudents = currentStudents.filter(id => id !== studentId);

    await updateDoc(docRef, {
      assignedStudents: updatedStudents,
      updatedAt: serverTimestamp()
    });

    logger.info('✅ Estudiante desasignado de sesión:', sessionId, studentId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error desasignando estudiante:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Agregar participante a sesión en vivo
 * @param {string} sessionId - ID de la sesión
 * @param {Object} participant - Datos del participante
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function addParticipantToSession(sessionId, participant) {
  try {
    const docRef = doc(db, 'class_sessions', sessionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const currentParticipants = docSnap.data().participants || [];

    // Verificar si ya está
    const existingIndex = currentParticipants.findIndex(p => p.userId === participant.userId);

    if (existingIndex >= 0) {
      // Actualizar timestamp de entrada
      currentParticipants[existingIndex].joinedAt = Timestamp.now();
    } else {
      // Agregar nuevo
      currentParticipants.push({
        ...participant,
        joinedAt: Timestamp.now()
      });
    }

    await updateDoc(docRef, {
      participants: currentParticipants,
      updatedAt: serverTimestamp()
    });

    logger.info('✅ Participante agregado a sesión:', sessionId, participant.userId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error agregando participante:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remover participante de sesión en vivo
 * @param {string} sessionId - ID de la sesión
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function removeParticipantFromSession(sessionId, userId) {
  try {
    const docRef = doc(db, 'class_sessions', sessionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const currentParticipants = docSnap.data().participants || [];
    const updatedParticipants = currentParticipants.filter(p => p.userId !== userId);

    await updateDoc(docRef, {
      participants: updatedParticipants,
      updatedAt: serverTimestamp()
    });

    logger.info('✅ Participante removido de sesión:', sessionId, userId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error removiendo participante:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Asignar contenido a sesión
 * @param {string} sessionId - ID de la sesión
 * @param {string} contentId - ID del contenido
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function assignContentToSession(sessionId, contentId) {
  try {
    const docRef = doc(db, 'class_sessions', sessionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const currentContents = docSnap.data().contentIds || [];
    if (currentContents.includes(contentId)) {
      return { success: false, error: 'Contenido ya asignado' };
    }

    await updateDoc(docRef, {
      contentIds: [...currentContents, contentId],
      updatedAt: serverTimestamp()
    });

    logger.info('✅ Contenido asignado a sesión:', sessionId, contentId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error asignando contenido:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Desasignar contenido de sesión
 * @param {string} sessionId - ID de la sesión
 * @param {string} contentId - ID del contenido
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function unassignContentFromSession(sessionId, contentId) {
  try {
    const docRef = doc(db, 'class_sessions', sessionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const currentContents = docSnap.data().contentIds || [];
    const updatedContents = currentContents.filter(id => id !== contentId);

    await updateDoc(docRef, {
      contentIds: updatedContents,
      updatedAt: serverTimestamp()
    });

    logger.info('✅ Contenido desasignado de sesión:', sessionId, contentId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error desasignando contenido:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener nombre del día de la semana
 * @param {number} day - Número del día (0-6)
 * @returns {string} - Nombre del día
 */
export function getDayName(day) {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[day] || '';
}
