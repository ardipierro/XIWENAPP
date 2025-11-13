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
  limit,
  Timestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';

const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Tipos de notificaciones disponibles
 */
export const NOTIFICATION_TYPES = {
  CLASS_STARTED: 'class_started',
  CLASS_STARTING_SOON: 'class_starting_soon',
  CLASS_ENDED: 'class_ended',
  CLASS_CANCELLED: 'class_cancelled',
  ASSIGNMENT_NEW: 'assignment_new',
  GRADE_PUBLISHED: 'grade_published',
  MESSAGE: 'message',
  SYSTEM: 'system'
};

/**
 * Crea una notificación para un usuario
 * @param {Object} notificationData - Datos de la notificación
 * @param {string} notificationData.userId - ID del usuario destinatario
 * @param {string} notificationData.type - Tipo de notificación
 * @param {string} notificationData.title - Título de la notificación
 * @param {string} notificationData.message - Mensaje de la notificación
 * @param {Object} notificationData.data - Datos adicionales (sessionId, joinUrl, etc.)
 * @returns {Promise<string>} ID de la notificación creada
 */
export async function createNotification(notificationData) {
  try {
    const notificationRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId: notificationData.userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data || {},
      read: false,
      createdAt: Timestamp.now()
    });

    console.log('✅ Notificación creada:', notificationRef.id);
    return notificationRef.id;
  } catch (error) {
    console.error('❌ Error creando notificación:', error);
    throw error;
  }
}

/**
 * Crea notificaciones para múltiples usuarios (batch)
 * @param {Array<Object>} notificationsData - Array de notificaciones
 * @returns {Promise<void>}
 */
export async function createBatchNotifications(notificationsData) {
  try {
    const batch = writeBatch(db);
    const timestamp = Timestamp.now();

    notificationsData.forEach(notifData => {
      const notificationRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
      batch.set(notificationRef, {
        userId: notifData.userId,
        type: notifData.type,
        title: notifData.title,
        message: notifData.message,
        data: notifData.data || {},
        read: false,
        createdAt: timestamp
      });
    });

    await batch.commit();
    console.log(`✅ ${notificationsData.length} notificaciones creadas en batch`);
  } catch (error) {
    console.error('❌ Error creando notificaciones en batch:', error);
    throw error;
  }
}

/**
 * Notifica a estudiantes que una clase ha iniciado
 * @param {Array<string>} studentIds - IDs de los estudiantes
 * @param {Object} classData - Datos de la clase
 * @returns {Promise<void>}
 */
export async function notifyClassStarted(studentIds, classData) {
  const notifications = studentIds.map(studentId => ({
    userId: studentId,
    type: NOTIFICATION_TYPES.CLASS_STARTED,
    title: '🔴 ¡Clase en Vivo!',
    message: `${classData.name} con ${classData.teacherName} ha comenzado`,
    data: {
      sessionId: classData.sessionId,
      sessionName: classData.name,
      teacherId: classData.teacherId,
      teacherName: classData.teacherName,
      courseId: classData.courseId,
      courseName: classData.courseName,
      joinUrl: classData.joinUrl,
      roomName: classData.roomName
    }
  }));

  await createBatchNotifications(notifications);
}

/**
 * Notifica a estudiantes que una clase comenzará pronto
 * @param {Array<string>} studentIds - IDs de los estudiantes
 * @param {Object} classData - Datos de la clase
 * @param {number} minutesUntilStart - Minutos hasta el inicio
 * @returns {Promise<void>}
 */
export async function notifyClassStartingSoon(studentIds, classData, minutesUntilStart = 5) {
  const notifications = studentIds.map(studentId => ({
    userId: studentId,
    type: NOTIFICATION_TYPES.CLASS_STARTING_SOON,
    title: '⏰ Tu clase comienza pronto',
    message: `${classData.name} comenzará en ${minutesUntilStart} minutos`,
    data: {
      sessionId: classData.sessionId,
      sessionName: classData.name,
      teacherId: classData.teacherId,
      teacherName: classData.teacherName,
      scheduledStart: classData.scheduledStart,
      minutesUntilStart
    }
  }));

  await createBatchNotifications(notifications);
}

/**
 * Notifica a estudiantes que una clase ha finalizado
 * @param {Array<string>} studentIds - IDs de los estudiantes
 * @param {Object} classData - Datos de la clase
 * @returns {Promise<void>}
 */
export async function notifyClassEnded(studentIds, classData) {
  const notifications = studentIds.map(studentId => ({
    userId: studentId,
    type: NOTIFICATION_TYPES.CLASS_ENDED,
    title: '✅ Clase Finalizada',
    message: `${classData.name} con ${classData.teacherName} ha terminado`,
    data: {
      sessionId: classData.sessionId,
      sessionName: classData.name,
      teacherId: classData.teacherId,
      teacherName: classData.teacherName,
      recordingUrl: classData.recordingUrl || null
    }
  }));

  await createBatchNotifications(notifications);
}

/**
 * Notifica a estudiantes que una clase fue cancelada
 * @param {Array<string>} studentIds - IDs de los estudiantes
 * @param {Object} classData - Datos de la clase
 * @returns {Promise<void>}
 */
export async function notifyClassCancelled(studentIds, classData) {
  const notifications = studentIds.map(studentId => ({
    userId: studentId,
    type: NOTIFICATION_TYPES.CLASS_CANCELLED,
    title: '❌ Clase Cancelada',
    message: `${classData.name} programada para ${classData.scheduledTime} ha sido cancelada`,
    data: {
      sessionId: classData.sessionId,
      sessionName: classData.name,
      teacherId: classData.teacherId,
      teacherName: classData.teacherName,
      reason: classData.cancellationReason || null
    }
  }));

  await createBatchNotifications(notifications);
}

/**
 * Obtiene notificaciones de un usuario
 * @param {string} userId - ID del usuario
 * @param {Object} options - Opciones de consulta
 * @param {boolean} options.unreadOnly - Solo no leídas
 * @param {number} options.limitCount - Límite de resultados
 * @returns {Promise<Array>} Array de notificaciones
 */
export async function getUserNotifications(userId, options = {}) {
  try {
    const {
      unreadOnly = false,
      limitCount = 50
    } = options;

    let q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId)
    );

    if (unreadOnly) {
      q = query(q, where('read', '==', false));
    }

    q = query(q, orderBy('createdAt', 'desc'), limit(limitCount));

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error obteniendo notificaciones:', error);
    throw error;
  }
}

/**
 * Obtiene el conteo de notificaciones no leídas
 * @param {string} userId - ID del usuario
 * @returns {Promise<number>} Número de notificaciones no leídas
 */
export async function getUnreadCount(userId) {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('❌ Error obteniendo conteo de no leídas:', error);
    throw error;
  }
}

/**
 * Marca una notificación como leída
 * @param {string} notificationId - ID de la notificación
 */
export async function markAsRead(notificationId) {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: Timestamp.now()
    });
  } catch (error) {
    console.error('❌ Error marcando notificación como leída:', error);
    throw error;
  }
}

/**
 * Marca todas las notificaciones de un usuario como leídas
 * @param {string} userId - ID del usuario
 */
export async function markAllAsRead(userId) {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return;
    }

    const batch = writeBatch(db);
    const timestamp = Timestamp.now();

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        readAt: timestamp
      });
    });

    await batch.commit();
    console.log(`✅ ${snapshot.size} notificaciones marcadas como leídas`);
  } catch (error) {
    console.error('❌ Error marcando todas como leídas:', error);
    throw error;
  }
}

/**
 * Elimina una notificación
 * @param {string} notificationId - ID de la notificación
 */
export async function deleteNotification(notificationId) {
  try {
    await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId));
    console.log('✅ Notificación eliminada:', notificationId);
  } catch (error) {
    console.error('❌ Error eliminando notificación:', error);
    throw error;
  }
}

/**
 * Elimina todas las notificaciones leídas de un usuario
 * @param {string} userId - ID del usuario
 */
export async function deleteReadNotifications(userId) {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('read', '==', true)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return;
    }

    const batch = writeBatch(db);

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`✅ ${snapshot.size} notificaciones leídas eliminadas`);
  } catch (error) {
    console.error('❌ Error eliminando notificaciones leídas:', error);
    throw error;
  }
}

/**
 * Escucha notificaciones de un usuario en tiempo real
 * @param {string} userId - ID del usuario
 * @param {Function} callback - Función que recibe el array de notificaciones
 * @param {Object} options - Opciones de consulta
 * @returns {Function} Función para cancelar la suscripción
 */
export function subscribeUserNotifications(userId, callback, options = {}) {
  const {
    unreadOnly = false,
    limitCount = 50
  } = options;

  let q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId)
  );

  if (unreadOnly) {
    q = query(q, where('read', '==', false));
  }

  q = query(q, orderBy('createdAt', 'desc'), limit(limitCount));

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(notifications);
  }, (error) => {
    console.error('❌ Error en listener de notificaciones:', error);
  });
}

/**
 * Escucha el conteo de notificaciones no leídas en tiempo real
 * @param {string} userId - ID del usuario
 * @param {Function} callback - Función que recibe el conteo
 * @returns {Function} Función para cancelar la suscripción
 */
export function subscribeUnreadCount(userId, callback) {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  }, (error) => {
    console.error('❌ Error en listener de conteo no leídas:', error);
  });
}
