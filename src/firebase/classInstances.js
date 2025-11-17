import logger from '../utils/logger';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
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
 * Sistema de Instancias de Clase
 *
 * Una "instancia" es una ocurrencia específica de una clase
 * Puede ser:
 * - Parte de un horario recurrente (scheduleType='recurring')
 * - Una clase única (scheduleType='single')
 */

/**
 * Obtener instancia por ID
 * @param {string} instanceId
 * @returns {Promise<Object|null>}
 */
export async function getClassInstance(instanceId) {
  try {
    const docRef = doc(db, 'class_instances', instanceId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    logger.error('❌ Error obteniendo instancia:', error);
    return null;
  }
}

/**
 * Obtener instancias de un profesor
 * @param {string} teacherId
 * @param {Object} options - { status: 'scheduled'|'live'|'ended', limit: number }
 * @returns {Promise<Array>}
 */
export async function getTeacherInstances(teacherId, options = {}) {
  try {
    let q = query(
      collection(db, 'class_instances'),
      where('teacherId', '==', teacherId)
    );

    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }

    q = query(q, orderBy('scheduledStart', 'desc'));

    const snapshot = await getDocs(q);
    let instances = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (options.limit) {
      instances = instances.slice(0, options.limit);
    }

    return instances;
  } catch (error) {
    logger.error('❌ Error obteniendo instancias del profesor:', error);
    return [];
  }
}

/**
 * Obtener instancias de un estudiante
 * @param {string} studentId
 * @param {Object} options
 * @returns {Promise<Array>}
 */
export async function getStudentInstances(studentId, options = {}) {
  try {
    let q = query(
      collection(db, 'class_instances'),
      where('eligibleStudentIds', 'array-contains', studentId)
    );

    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }

    q = query(q, orderBy('scheduledStart', 'desc'));

    const snapshot = await getDocs(q);
    let instances = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (options.limit) {
      instances = instances.slice(0, options.limit);
    }

    return instances;
  } catch (error) {
    logger.error('❌ Error obteniendo instancias del estudiante:', error);
    return [];
  }
}

/**
 * Iniciar una instancia de clase
 * Cambia status a 'live', crea meet session y notifica estudiantes
 *
 * @param {string} instanceId - ID de la instancia
 * @returns {Promise<Object>}
 */
export async function startClassInstance(instanceId) {
  try {
    const instanceDoc = await getDoc(doc(db, 'class_instances', instanceId));

    if (!instanceDoc.exists()) {
      return { success: false, error: 'Instancia no encontrada' };
    }

    const instance = instanceDoc.data();

    if (instance.status === 'live') {
      return { success: false, error: 'La clase ya está en vivo' };
    }

    if (instance.status === 'ended') {
      return { success: false, error: 'La clase ya finalizó' };
    }

    // Actualizar status a 'live'
    const docRef = doc(db, 'class_instances', instanceId);
    await updateDoc(docRef, {
      status: 'live',
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    let meetSessionId = null;

    // Crear meet_session si es modo 'live'
    if (instance.mode === 'live') {
      try {
        meetSessionId = await createMeetSession({
          classSessionId: instanceId,
          ownerId: instance.teacherId,
          ownerName: instance.teacherName,
          roomName: instance.roomName,
          sessionName: instance.scheduleName,
          courseId: instance.courseId,
          courseName: instance.courseName
        });

        // Guardar referencia
        await updateDoc(docRef, {
          meetSessionId: meetSessionId
        });

        logger.info('✅ Meet session creada:', meetSessionId);
      } catch (meetError) {
        logger.error('⚠️ Error creando meet session (no crítico):', meetError);
      }
    }

    // Notificar a estudiantes elegibles
    const eligibleStudents = instance.eligibleStudentIds || [];

    if (eligibleStudents.length > 0) {
      try {
        await notifyClassStarted(eligibleStudents, {
          sessionId: instanceId,
          name: instance.scheduleName,
          teacherId: instance.teacherId,
          teacherName: instance.teacherName,
          courseId: instance.courseId,
          courseName: instance.courseName,
          joinUrl: `${window.location.origin}/class-instance/${instanceId}`,
          roomName: instance.roomName
        });

        logger.info(`✅ ${eligibleStudents.length} estudiantes notificados`);
      } catch (notifyError) {
        logger.error('⚠️ Error enviando notificaciones (no crítico):', notifyError);
      }
    }

    logger.info('✅ Instancia iniciada:', instanceId);
    return { success: true, meetSessionId };
  } catch (error) {
    logger.error('❌ Error iniciando instancia:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Finalizar una instancia de clase
 * Cambia status a 'ended', finaliza meet session y notifica estudiantes
 *
 * @param {string} instanceId - ID de la instancia
 * @param {Object} data - { attendedStudentIds: [] } opcional
 * @returns {Promise<Object>}
 */
export async function endClassInstance(instanceId, data = {}) {
  try {
    const instanceDoc = await getDoc(doc(db, 'class_instances', instanceId));

    if (!instanceDoc.exists()) {
      return { success: false, error: 'Instancia no encontrada' };
    }

    const instance = instanceDoc.data();

    if (instance.status === 'ended') {
      return { success: false, error: 'La clase ya finalizó' };
    }

    // Actualizar status a 'ended'
    const docRef = doc(db, 'class_instances', instanceId);
    const updates = {
      status: 'ended',
      endedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Si se proveen estudiantes que asistieron, guardarlos
    if (data.attendedStudentIds) {
      updates.attendedStudentIds = data.attendedStudentIds;
    }

    await updateDoc(docRef, updates);

    // Finalizar meet_session si existe
    if (instance.mode === 'live') {
      try {
        await endMeetSessionByClassId(instanceId);
        logger.info('✅ Meet session finalizada');
      } catch (meetError) {
        logger.error('⚠️ Error finalizando meet session (no crítico):', meetError);
      }
    }

    // Notificar a estudiantes
    const eligibleStudents = instance.eligibleStudentIds || [];

    if (eligibleStudents.length > 0) {
      try {
        await notifyClassEnded(eligibleStudents, {
          sessionId: instanceId,
          name: instance.scheduleName,
          teacherId: instance.teacherId,
          teacherName: instance.teacherName,
          recordingUrl: instance.recordingUrl || null
        });

        logger.info(`✅ ${eligibleStudents.length} estudiantes notificados del fin de clase`);
      } catch (notifyError) {
        logger.error('⚠️ Error enviando notificaciones (no crítico):', notifyError);
      }
    }

    logger.info('✅ Instancia finalizada:', instanceId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error finalizando instancia:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancelar una instancia de clase
 * @param {string} instanceId
 * @returns {Promise<Object>}
 */
export async function cancelClassInstance(instanceId) {
  try {
    await updateDoc(doc(db, 'class_instances', instanceId), {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });

    logger.info('✅ Instancia cancelada:', instanceId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error cancelando instancia:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Registrar asistencia de estudiantes a una instancia
 * @param {string} instanceId
 * @param {Array<string>} studentIds - IDs de estudiantes que asistieron
 * @returns {Promise<Object>}
 */
export async function recordAttendance(instanceId, studentIds) {
  try {
    await updateDoc(doc(db, 'class_instances', instanceId), {
      attendedStudentIds: studentIds,
      updatedAt: serverTimestamp()
    });

    logger.info('✅ Asistencia registrada:', instanceId, studentIds.length);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error registrando asistencia:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener instancias próximas (en las próximas N horas)
 * @param {number} hoursAhead - Cuántas horas adelante buscar
 * @returns {Promise<Array>}
 */
export async function getUpcomingInstances(hoursAhead = 24) {
  try {
    const now = Timestamp.now();
    const future = Timestamp.fromMillis(now.toMillis() + (hoursAhead * 60 * 60 * 1000));

    const q = query(
      collection(db, 'class_instances'),
      where('status', '==', 'scheduled'),
      where('scheduledStart', '>=', now),
      where('scheduledStart', '<=', future),
      orderBy('scheduledStart', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    logger.error('❌ Error obteniendo instancias próximas:', error);
    return [];
  }
}

/**
 * Obtener instancias en vivo
 * @param {string} teacherId - Filtrar por profesor (opcional)
 * @returns {Promise<Array>}
 */
export async function getLiveInstances(teacherId = null) {
  try {
    let q = query(
      collection(db, 'class_instances'),
      where('status', '==', 'live'),
      orderBy('startedAt', 'desc')
    );

    if (teacherId) {
      q = query(
        collection(db, 'class_instances'),
        where('teacherId', '==', teacherId),
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
    logger.error('❌ Error obteniendo instancias en vivo:', error);
    return [];
  }
}
