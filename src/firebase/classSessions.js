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

// Importar sistema de horarios recurrentes e instancias
import {
  createRecurringSchedule,
  updateRecurringSchedule,
  deleteRecurringSchedule,
  getRecurringSchedule,
  getTeacherSchedules,
  enrollStudentToSchedule,
  unenrollStudentFromSchedule,
  generateInstancesForSchedule,
  getScheduleInstances,
  pauseSchedule,
  resumeSchedule
} from './recurringSchedules';

import {
  getClassInstance,
  getTeacherInstances,
  getStudentInstances,
  startClassInstance,
  endClassInstance,
  cancelClassInstance,
  deleteClassInstance,
  recordAttendance,
  getUpcomingInstances,
  getLiveInstances
} from './classInstances';

/**
 * Sistema Unificado de Sesiones de Clase
 * Integra: LiveKit + Pizarras (Canvas/Excalidraw) + Programación (single/recurring)
 *
 * NUEVA ARQUITECTURA:
 * - Sesiones ÚNICAS (single) → Se crean como class_instances directamente
 * - Sesiones RECURRENTES (recurring) → Se crean como recurring_schedules + genera class_instances
 * - class_sessions (legacy) → Mantiene compatibilidad con sesiones antiguas
 */

/**
 * Crear una nueva sesión de clase
 * NUEVO: Rutea a recurring_schedules o class_instances según el tipo
 *
 * @param {Object} sessionData - Datos de la sesión
 * @returns {Promise<Object>} - {success: boolean, sessionId?: string, scheduleId?: string, roomName?: string, error?: string}
 */
export async function createClassSession(sessionData) {
  try {
    const {
      type = 'single', // 'single' | 'recurring' | 'instant'
      scheduledStart = null,
      schedules = [],
      recurringStartDate = null,
      recurringWeeks = 4,
      assignedStudents = [],
    } = sessionData;

    // CASO 1: Sesión RECURRENTE → Crear recurring_schedule
    if (type === 'recurring') {
      logger.info('🔄 Creando horario recurrente...');

      const result = await createRecurringSchedule({
        ...sessionData,
        schedules,
        startDate: recurringStartDate,
        endDate: null // Por ahora sin fecha de fin (indefinido)
      });

      if (!result.success) {
        return result;
      }

      // Si hay estudiantes pre-asignados, inscribirlos
      if (assignedStudents && assignedStudents.length > 0) {
        for (const studentId of assignedStudents) {
          await enrollStudentToSchedule(result.scheduleId, studentId, '');
        }
      }

      return {
        success: true,
        scheduleId: result.scheduleId,
        sessionId: result.scheduleId, // Por compatibilidad
        type: 'recurring'
      };
    }

    // CASO 2: Sesión ÚNICA o INSTANTÁNEA → Crear class_instance
    logger.info('📅 Creando sesión única/instantánea...');

    const {
      name,
      description = '',
      courseId = null,
      courseName = '',
      teacherId,
      teacherName,
      videoProvider = 'livekit', // 'livekit' | 'meet' | 'zoom' | 'voov'
      whiteboardType = 'none',
      duration = 60,
      maxParticipants = 30,
      recordingEnabled = false,
      creditCost = 1,
      imageUrl = ''
    } = sessionData;

    // Validaciones
    if (!name || !teacherId) {
      return { success: false, error: 'Nombre y profesor son requeridos' };
    }

    if (type === 'single' && !scheduledStart) {
      return { success: false, error: 'Fecha de inicio es requerida para sesiones únicas' };
    }

    // Generar roomName único (todas las clases son live ahora)
    const roomName = `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calcular scheduledEnd
    const startTimestamp = type === 'instant'
      ? Timestamp.now()
      : (scheduledStart instanceof Timestamp ? scheduledStart : Timestamp.fromDate(scheduledStart));

    const scheduledEndDate = new Date(startTimestamp.toMillis() + duration * 60 * 1000);
    const scheduledEnd = Timestamp.fromDate(scheduledEndDate);

    // Crear instancia directamente
    const instanceData = {
      scheduleId: null, // No pertenece a ningún horario
      scheduleName: name,
      scheduleType: 'single',

      // Fecha/hora
      scheduledStart: startTimestamp,
      scheduledEnd,

      // Info del profesor y curso
      teacherId,
      teacherName,
      courseId,
      courseName,

      // Modalidad (todas las clases son live ahora)
      videoProvider,
      whiteboardType,
      roomName,

      // Estudiantes
      eligibleStudentIds: assignedStudents || [],
      attendedStudentIds: [],

      // Estado
      status: 'scheduled',
      startedAt: null,
      endedAt: null,

      // Meta
      duration,
      creditCost,
      imageUrl,
      description,

      // Video config
      maxParticipants,
      recordingEnabled,
      meetSessionId: null,
      videoMeetingUrl: null, // Se genera al iniciar la clase

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'class_instances'), instanceData);

    logger.info('✅ Instancia de clase creada:', docRef.id);
    return {
      success: true,
      sessionId: docRef.id,
      instanceId: docRef.id,
      roomName,
      type: 'single'
    };
  } catch (error) {
    logger.error('❌ Error creando sesión de clase:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar una sesión existente
 * Si la instancia pertenece a un scheduled_classes, actualiza el horario original
 * @param {string} sessionId - ID de la sesión/instancia
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function updateClassSession(sessionId, updates) {
  try {
    // 1. Obtener la instancia para ver si pertenece a un horario
    const instanceRef = doc(db, 'class_instances', sessionId);
    const instanceSnap = await getDoc(instanceRef);

    if (!instanceSnap.exists()) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const instance = instanceSnap.data();
    const scheduleId = instance.scheduleId;

    // 2. Normalizar campos: convertir 'name' a 'scheduleName' y 'courseName' para class_instances
    const normalizedUpdates = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    // CRITICAL: Normalizar 'name' → 'scheduleName'
    if (updates.name !== undefined) {
      normalizedUpdates.scheduleName = updates.name;
    }

    // CRITICAL: Normalizar 'assignedStudents' → 'eligibleStudentIds'
    if (updates.assignedStudents !== undefined) {
      normalizedUpdates.eligibleStudentIds = updates.assignedStudents;
    }

    // Filtrar campos undefined (Firestore no los permite)
    const cleanUpdates = Object.fromEntries(
      Object.entries(normalizedUpdates).filter(([_, value]) => value !== undefined)
    );

    // 3. Si la instancia pertenece a un scheduled_classes, actualizar el horario original
    if (scheduleId) {
      logger.info('🔄 Instancia pertenece a scheduled_classes:', scheduleId);

      // Preparar updates para scheduled_classes
      const scheduleUpdates = {
        updatedAt: serverTimestamp()
      };

      // Mapear campos de la sesión a campos de scheduled_classes
      if (updates.name !== undefined) {
        scheduleUpdates.courseName = updates.name;
      }
      if (updates.description !== undefined) {
        scheduleUpdates.description = updates.description;
      }
      if (updates.videoProvider !== undefined) {
        scheduleUpdates.videoProvider = updates.videoProvider;
      }
      if (updates.whiteboardType !== undefined) {
        scheduleUpdates.whiteboardType = updates.whiteboardType;
      }
      if (updates.creditCost !== undefined) {
        scheduleUpdates.creditCost = updates.creditCost;
      }
      if (updates.maxParticipants !== undefined) {
        scheduleUpdates.maxParticipants = updates.maxParticipants;
      }
      if (updates.duration !== undefined) {
        scheduleUpdates.duration = updates.duration;
      }

      // Actualizar el scheduled_classes original
      const scheduleRef = doc(db, 'scheduled_classes', scheduleId);
      const scheduleSnap = await getDoc(scheduleRef);

      if (scheduleSnap.exists()) {
        await updateDoc(scheduleRef, scheduleUpdates);
        logger.info('✅ scheduled_classes actualizado:', scheduleId);

        // Actualizar todas las instancias futuras del mismo horario
        const now = Timestamp.now();
        logger.info(`🔍 Buscando instancias futuras para scheduleId: ${scheduleId}, desde: ${now.toDate().toISOString()}`);

        const futureInstancesQuery = query(
          collection(db, 'class_instances'),
          where('scheduleId', '==', scheduleId),
          where('scheduledStart', '>=', now),
          where('status', '==', 'scheduled')
        );

        const futureInstancesSnap = await getDocs(futureInstancesQuery);
        logger.info(`📊 Encontradas ${futureInstancesSnap.size} instancias futuras para actualizar`);

        if (futureInstancesSnap.size > 0) {
          const updatePromises = futureInstancesSnap.docs.map(doc => {
            const docData = doc.data();
            logger.info(`  → Actualizando instancia ${doc.id}: ${docData.scheduleName} (${docData.scheduledStart.toDate().toLocaleString()})`);
            return updateDoc(doc.ref, cleanUpdates);
          });

          await Promise.all(updatePromises);
          logger.info(`✅ ${futureInstancesSnap.size} instancias futuras actualizadas correctamente`);
        } else {
          logger.warn(`⚠️ No se encontraron instancias futuras para actualizar (scheduleId: ${scheduleId})`);
        }
      } else {
        logger.warn('⚠️ scheduled_classes no encontrado:', scheduleId);
        logger.info('🔍 Buscando instancias futuras por coincidencia de campos (nombre, profesor)...');

        // FALLBACK: Si no existe el scheduled_classes, buscar instancias futuras por campos comunes
        const now = Timestamp.now();
        const currentScheduleName = instance.scheduleName;
        const currentTeacherId = instance.teacherId;

        if (currentScheduleName && currentTeacherId) {
          const futureInstancesQuery = query(
            collection(db, 'class_instances'),
            where('teacherId', '==', currentTeacherId),
            where('scheduleName', '==', currentScheduleName),
            where('scheduledStart', '>=', now),
            where('status', '==', 'scheduled')
          );

          const futureInstancesSnap = await getDocs(futureInstancesQuery);
          logger.info(`📊 Encontradas ${futureInstancesSnap.size} instancias futuras con el mismo nombre y profesor`);

          if (futureInstancesSnap.size > 0) {
            const updatePromises = futureInstancesSnap.docs.map(doc => {
              const docData = doc.data();
              logger.info(`  → Actualizando instancia ${doc.id}: ${docData.scheduleName} (${docData.scheduledStart.toDate().toLocaleString()})`);
              return updateDoc(doc.ref, cleanUpdates);
            });

            await Promise.all(updatePromises);
            logger.info(`✅ ${futureInstancesSnap.size} instancias futuras actualizadas (por coincidencia)`);
          }
        }
      }
    }

    // 4. Actualizar la instancia actual de todas formas
    await updateDoc(instanceRef, cleanUpdates);

    logger.info('✅ Sesión actualizada:', sessionId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error actualizando sesión:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar una sesión (solo class_instances)
 * @param {string} sessionId - ID de la sesión
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function deleteClassSession(sessionId) {
  try {
    return await deleteClassInstance(sessionId);
  } catch (error) {
    logger.error('❌ Error eliminando sesión:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener sesión por ID (solo class_instances)
 * @param {string} sessionId - ID de la sesión
 * @returns {Promise<Object|null>} - Sesión o null
 */
export async function getClassSession(sessionId) {
  try {
    return await getClassInstance(sessionId);
  } catch (error) {
    logger.error('❌ Error obteniendo sesión:', error);
    return null;
  }
}

/**
 * Obtener todas las sesiones de un profesor
 * Combina recurring_schedules + class_instances
 *
 * @param {string} teacherId - ID del profesor
 * @returns {Promise<Array>} - Array de sesiones
 */
export async function getTeacherSessions(teacherId) {
  try {
    // 1. Obtener horarios recurrentes (recurring_schedules)
    const schedules = await getTeacherSchedules(teacherId);

    // 2. Obtener instancias únicas que NO pertenecen a un horario (class_instances con scheduleId=null)
    const instancesQuery = query(
      collection(db, 'class_instances'),
      where('teacherId', '==', teacherId),
      where('scheduleId', '==', null) // Solo las que no son parte de un horario
    );
    const instancesSnapshot = await getDocs(instancesQuery);
    const singleInstances = instancesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Normalizar campos para consistencia con recurring_schedules
        name: data.scheduleName || data.name || '',
        type: 'single', // Marcar como single para el UI
        assignedStudents: data.eligibleStudentIds || data.assignedStudents || []
      };
    });

    // Combinar todo
    const allSessions = [
      ...schedules.map(s => ({ ...s, type: 'recurring' })),
      ...singleInstances
    ];

    // Ordenar por createdAt (desc)
    return allSessions.sort((a, b) => {
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
 * Obtener sesiones asignadas a un estudiante (solo class_instances)
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<Array>} - Array de sesiones
 */
export async function getStudentSessions(studentId) {
  try {
    return await getStudentInstances(studentId);
  } catch (error) {
    logger.error('❌ Error obteniendo sesiones del estudiante:', error);
    return [];
  }
}

/**
 * Obtener sesiones en vivo (status='live' solo class_instances)
 * @param {string} teacherId - ID del profesor (opcional)
 * @returns {Promise<Array>} - Array de sesiones
 */
export async function getLiveSessions(teacherId = null) {
  try {
    return await getLiveInstances(teacherId);
  } catch (error) {
    logger.error('❌ Error obteniendo sesiones en vivo:', error);
    return [];
  }
}

/**
 * Iniciar una sesión (cambiar status a 'live' - solo class_instances)
 *
 * @param {string} sessionId - ID de la sesión/instancia
 * @returns {Promise<Object>} - {success: boolean, meetSessionId?: string, error?: string}
 */
export async function startClassSession(sessionId) {
  try {
    return await startClassInstance(sessionId);
  } catch (error) {
    logger.error('❌ Error iniciando sesión:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Finalizar una sesión (cambiar status a 'ended' - solo class_instances)
 *
 * @param {string} sessionId - ID de la sesión/instancia
 * @param {Object} data - Datos adicionales (attendedStudentIds, etc.)
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function endClassSession(sessionId, data = {}) {
  try {
    return await endClassInstance(sessionId, data);
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
    const docRef = doc(db, 'class_instances', sessionId);
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
    const docRef = doc(db, 'class_instances', sessionId);
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
    const docRef = doc(db, 'class_instances', sessionId);
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
    const docRef = doc(db, 'class_instances', sessionId);
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
 * Busca primero en class_instances (nuevo sistema), luego en class_sessions (legacy)
 * @param {string} sessionId - ID de la sesión
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function assignStudentToSession(sessionId, studentId) {
  try {
    // Intentar buscar primero en class_instances (nuevo sistema)
    const instanceRef = doc(db, 'class_instances', sessionId);
    const instanceSnap = await getDoc(instanceRef);

    if (instanceSnap.exists()) {
      // Es una instancia nueva → usar eligibleStudentIds
      const currentStudents = instanceSnap.data().eligibleStudentIds || [];
      if (currentStudents.includes(studentId)) {
        return { success: false, error: 'Estudiante ya asignado' };
      }

      await updateDoc(instanceRef, {
        eligibleStudentIds: [...currentStudents, studentId],
        updatedAt: serverTimestamp()
      });

      logger.info('✅ Estudiante asignado a instancia:', sessionId, studentId);
      return { success: true };
    }

    // Si no está en class_instances, buscar en class_sessions (legacy)
    const sessionRef = doc(db, 'class_instances', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const currentStudents = sessionSnap.data().assignedStudents || [];
    if (currentStudents.includes(studentId)) {
      return { success: false, error: 'Estudiante ya asignado' };
    }

    await updateDoc(sessionRef, {
      assignedStudents: [...currentStudents, studentId],
      updatedAt: serverTimestamp()
    });

    logger.info('✅ Estudiante asignado a sesión (legacy):', sessionId, studentId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error asignando estudiante:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Desasignar estudiante de sesión
 * Busca primero en class_instances (nuevo sistema), luego en class_sessions (legacy)
 * @param {string} sessionId - ID de la sesión
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function unassignStudentFromSession(sessionId, studentId) {
  try {
    // Intentar buscar primero en class_instances (nuevo sistema)
    const instanceRef = doc(db, 'class_instances', sessionId);
    const instanceSnap = await getDoc(instanceRef);

    if (instanceSnap.exists()) {
      // Es una instancia nueva → usar eligibleStudentIds
      const currentStudents = instanceSnap.data().eligibleStudentIds || [];
      const updatedStudents = currentStudents.filter(id => id !== studentId);

      await updateDoc(instanceRef, {
        eligibleStudentIds: updatedStudents,
        updatedAt: serverTimestamp()
      });

      logger.info('✅ Estudiante desasignado de instancia:', sessionId, studentId);
      return { success: true };
    }

    // Si no está en class_instances, buscar en class_sessions (legacy)
    const sessionRef = doc(db, 'class_instances', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const currentStudents = sessionSnap.data().assignedStudents || [];
    const updatedStudents = currentStudents.filter(id => id !== studentId);

    await updateDoc(sessionRef, {
      assignedStudents: updatedStudents,
      updatedAt: serverTimestamp()
    });

    logger.info('✅ Estudiante desasignado de sesión (legacy):', sessionId, studentId);
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
    const docRef = doc(db, 'class_instances', sessionId);
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
    const docRef = doc(db, 'class_instances', sessionId);
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
 * Busca primero en class_instances (nuevo sistema), luego en class_sessions (legacy)
 * @param {string} sessionId - ID de la sesión
 * @param {string} contentId - ID del contenido
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function assignContentToSession(sessionId, contentId) {
  try {
    // Intentar buscar primero en class_instances (nuevo sistema)
    const instanceRef = doc(db, 'class_instances', sessionId);
    const instanceSnap = await getDoc(instanceRef);

    if (instanceSnap.exists()) {
      // Es una instancia nueva
      const currentContents = instanceSnap.data().contentIds || [];
      if (currentContents.includes(contentId)) {
        return { success: false, error: 'Contenido ya asignado' };
      }

      await updateDoc(instanceRef, {
        contentIds: [...currentContents, contentId],
        updatedAt: serverTimestamp()
      });

      logger.info('✅ Contenido asignado a instancia:', sessionId, contentId);
      return { success: true };
    }

    // Si no está en class_instances, buscar en class_sessions (legacy)
    const sessionRef = doc(db, 'class_instances', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const currentContents = sessionSnap.data().contentIds || [];
    if (currentContents.includes(contentId)) {
      return { success: false, error: 'Contenido ya asignado' };
    }

    await updateDoc(sessionRef, {
      contentIds: [...currentContents, contentId],
      updatedAt: serverTimestamp()
    });

    logger.info('✅ Contenido asignado a sesión (legacy):', sessionId, contentId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error asignando contenido:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Desasignar contenido de sesión
 * Busca primero en class_instances (nuevo sistema), luego en class_sessions (legacy)
 * @param {string} sessionId - ID de la sesión
 * @param {string} contentId - ID del contenido
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function unassignContentFromSession(sessionId, contentId) {
  try {
    // Intentar buscar primero en class_instances (nuevo sistema)
    const instanceRef = doc(db, 'class_instances', sessionId);
    const instanceSnap = await getDoc(instanceRef);

    if (instanceSnap.exists()) {
      // Es una instancia nueva
      const currentContents = instanceSnap.data().contentIds || [];
      const updatedContents = currentContents.filter(id => id !== contentId);

      await updateDoc(instanceRef, {
        contentIds: updatedContents,
        updatedAt: serverTimestamp()
      });

      logger.info('✅ Contenido desasignado de instancia:', sessionId, contentId);
      return { success: true };
    }

    // Si no está en class_instances, buscar en class_sessions (legacy)
    const sessionRef = doc(db, 'class_instances', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const currentContents = sessionSnap.data().contentIds || [];
    const updatedContents = currentContents.filter(id => id !== contentId);

    await updateDoc(sessionRef, {
      contentIds: updatedContents,
      updatedAt: serverTimestamp()
    });

    logger.info('✅ Contenido desasignado de sesión (legacy):', sessionId, contentId);
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

/**
 * Crear clase instantánea con Google Meet
 * Crea y inicia automáticamente una clase en vivo
 *
 * @param {Object} config - Configuración de la clase instantánea
 * @param {string} config.teacherId - ID del profesor
 * @param {string} config.teacherName - Nombre del profesor
 * @param {string} config.meetLink - Link de Google Meet (opcional)
 * @param {Array<string>} config.assignedGroups - IDs de grupos asignados
 * @param {Array<string>} config.assignedStudents - IDs de estudiantes asignados
 * @param {string} config.name - Nombre personalizado (opcional)
 * @returns {Promise<Object>} - Resultado con sessionId, roomName, meetSessionId
 */
export async function createInstantMeetSession(config) {
  try {
    const {
      teacherId,
      teacherName,
      meetLink = '',
      assignedGroups = [],
      assignedStudents = [],
      name = null
    } = config;

    const now = new Date();
    const defaultName = `Clase Instantánea - ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

    const sessionData = {
      name: name || defaultName,
      description: 'Clase en vivo creada instantáneamente',
      teacherId,
      teacherName,
      mode: 'live',
      type: 'single',
      scheduledStart: Timestamp.fromDate(now),
      duration: 60,
      maxParticipants: 30,
      recordingEnabled: false,
      whiteboardType: 'none',
      meetLink: meetLink || '',
      zoomLink: '',
      assignedGroups,
      assignedStudents
    };

    // Crear sesión
    const result = await createClassSession(sessionData);

    if (result.success) {
      // Auto-iniciar la sesión
      const startResult = await startClassSession(result.sessionId);

      logger.info('✅ Clase instantánea creada e iniciada:', result.sessionId);

      return {
        success: true,
        sessionId: result.sessionId,
        roomName: result.roomName,
        meetSessionId: startResult.meetSessionId
      };
    }

    return result;
  } catch (error) {
    logger.error('❌ Error creando clase instantánea:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generar instancias de clase para un scheduled_classes
 * Esta función es para compatibilidad con el sistema scheduled_classes
 * @param {string} scheduleId - ID del scheduled_classes
 * @param {Object} schedule - Datos del horario
 * @param {number} weeksToGenerate - Número de semanas a generar
 * @returns {Promise<Object>}
 */
export async function generateSessionsForScheduledClass(scheduleId, schedule, weeksToGenerate = 4) {
  try {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + (weeksToGenerate * 7));

    let instancesCreated = 0;

    // Iterar cada día desde ahora hasta endDate
    for (let date = new Date(now); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();

      // Ver si este día coincide con el dayOfWeek del horario
      if (dayOfWeek === schedule.dayOfWeek) {
        const [hours, minutes] = schedule.startTime.split(':');
        const classDateTime = new Date(date);
        classDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Solo crear si es fecha futura
        if (classDateTime >= now) {
          const scheduledStart = Timestamp.fromDate(classDateTime);

          // Verificar que no exista ya esta instancia
          const existingQuery = query(
            collection(db, 'class_instances'),
            where('scheduleId', '==', scheduleId),
            where('scheduledStart', '==', scheduledStart)
          );
          const existingSnapshot = await getDocs(existingQuery);

          if (existingSnapshot.empty) {
            // Calcular duración
            const [endHours, endMinutes] = schedule.endTime.split(':');
            const endDateTime = new Date(classDateTime);
            endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
            const scheduledEnd = Timestamp.fromDate(endDateTime);

            // Generar roomName único
            const roomName = `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Crear instancia
            const instanceData = {
              scheduleId,
              scheduleName: schedule.courseName || 'Clase',
              scheduleType: 'scheduled_class',

              // Fecha/hora
              scheduledStart,
              scheduledEnd,

              // Info del profesor y grupo
              teacherId: schedule.teacherId,
              teacherName: schedule.teacherName || '',
              groupId: schedule.groupId,
              groupName: schedule.groupName,
              courseId: null,
              courseName: schedule.courseName,

              // Modalidad
              videoProvider: schedule.videoProvider || 'meet',
              whiteboardType: schedule.whiteboardType || 'none',
              roomName,

              // Estudiantes (vacío por ahora, se asignan dinámicamente)
              eligibleStudentIds: [],
              attendedStudentIds: [],

              // Estado
              status: 'scheduled',
              startedAt: null,
              endedAt: null,

              // Meta
              duration: schedule.duration || 60,
              creditCost: schedule.creditCost || 1,

              // Video config
              maxParticipants: schedule.maxParticipants || 30,
              recordingEnabled: false,
              meetSessionId: null,
              videoMeetingUrl: null,

              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };

            await addDoc(collection(db, 'class_instances'), instanceData);
            instancesCreated++;
          }
        }
      }
    }

    logger.info(`✅ ${instancesCreated} instancias generadas para scheduled_classes ${scheduleId}`);
    return { success: true, created: instancesCreated };
  } catch (error) {
    logger.error('❌ Error generando instancias para scheduled_classes:', error);
    return { success: false, created: 0, error: error.message };
  }
}

/**
 * Obtener estadísticas de un scheduled_classes
 * @param {string} scheduleId - ID del scheduled_classes
 * @returns {Promise<Object>} - { total, upcoming, completed, nextSession }
 */
export async function getScheduledClassStats(scheduleId) {
  try {
    const now = Timestamp.now();

    // Obtener todas las instancias del horario
    const allInstancesQuery = query(
      collection(db, 'class_instances'),
      where('scheduleId', '==', scheduleId),
      orderBy('scheduledStart', 'asc')
    );
    const allInstancesSnap = await getDocs(allInstancesQuery);

    const total = allInstancesSnap.size;
    let upcoming = 0;
    let completed = 0;
    let nextSession = null;

    allInstancesSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === 'ended') {
        completed++;
      } else if (data.status === 'scheduled' && data.scheduledStart >= now) {
        upcoming++;
        if (!nextSession) {
          nextSession = {
            id: doc.id,
            date: data.scheduledStart,
            ...data
          };
        }
      }
    });

    return {
      total,
      upcoming,
      completed,
      nextSession
    };
  } catch (error) {
    logger.error('❌ Error obteniendo estadísticas de scheduled_classes:', error);
    return {
      total: 0,
      upcoming: 0,
      completed: 0,
      nextSession: null
    };
  }
}

/**
 * ============================================================================
 * RE-EXPORTAR FUNCIONES DEL NUEVO SISTEMA
 * ============================================================================
 */

// Horarios Recurrentes
export {
  createRecurringSchedule,
  updateRecurringSchedule,
  deleteRecurringSchedule,
  getRecurringSchedule,
  getTeacherSchedules,
  enrollStudentToSchedule,
  unenrollStudentFromSchedule,
  generateInstancesForSchedule,
  getScheduleInstances,
  pauseSchedule,
  resumeSchedule
};

// Instancias de Clase
export {
  getClassInstance,
  getTeacherInstances,
  getStudentInstances,
  startClassInstance,
  endClassInstance,
  cancelClassInstance,
  recordAttendance,
  getUpcomingInstances,
  getLiveInstances
};
