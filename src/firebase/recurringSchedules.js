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
  Timestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from './config';

/**
 * Sistema de Horarios Recurrentes
 *
 * Un "horario" representa una clase que se repite en días/horarios fijos
 * por un período de tiempo (ej: "Chino HSK1 - Lunes y Miércoles 10:00-11:00")
 *
 * Características:
 * - Tracking temporal de estudiantes (enrolledAt, unenrolledAt)
 * - Genera instancias individuales de clase (class_instances)
 * - Los estudiantes se agregan al horario y automáticamente a todas las clases futuras
 */

/**
 * Crear un nuevo horario recurrente
 * @param {Object} scheduleData - Datos del horario
 * @returns {Promise<Object>} - {success: boolean, scheduleId?: string, error?: string}
 */
export async function createRecurringSchedule(scheduleData) {
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
      whiteboardType = 'none',

      // Horarios - array de {day, startTime, endTime}
      schedules = [], // [{day: 1, startTime: '10:00', endTime: '11:00'}, ...]

      // Vigencia
      startDate = null, // Timestamp - cuándo empieza el horario
      endDate = null, // Timestamp - cuándo termina (null = indefinido)

      // LiveKit
      maxParticipants = 30,
      recordingEnabled = false,

      // Meta
      creditCost = 1,
      duration = 60,
      meetLink = '',
      zoomLink = '',
      imageUrl = ''
    } = scheduleData;

    // Validaciones
    if (!name || !teacherId) {
      return { success: false, error: 'Nombre y profesor son requeridos' };
    }

    if (schedules.length === 0) {
      return { success: false, error: 'Debe definir al menos un horario' };
    }

    if (!startDate) {
      return { success: false, error: 'Fecha de inicio es requerida' };
    }

    const newSchedule = {
      name,
      description,
      courseId,
      courseName,
      teacherId,
      teacherName,

      // Tipo
      type: 'recurring_schedule',
      mode,
      whiteboardType,

      // Horarios
      schedules,
      startDate: startDate instanceof Timestamp ? startDate : Timestamp.fromDate(startDate),
      endDate: endDate ? (endDate instanceof Timestamp ? endDate : Timestamp.fromDate(endDate)) : null,
      duration,

      // Estudiantes - array vacío al crear
      studentEnrollments: [],

      // LiveKit
      maxParticipants: mode === 'live' ? maxParticipants : null,
      recordingEnabled: mode === 'live' ? recordingEnabled : false,

      // Estado
      status: 'active', // 'active' | 'paused' | 'ended'

      // Meta
      creditCost,
      meetLink,
      zoomLink,
      imageUrl,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'recurring_schedules'), newSchedule);

    logger.info('✅ Horario recurrente creado:', docRef.id);

    // Generar instancias para las próximas 4 semanas
    await generateInstancesForSchedule(docRef.id, 4);

    return { success: true, scheduleId: docRef.id };
  } catch (error) {
    logger.error('❌ Error creando horario recurrente:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar un horario recurrente
 * @param {string} scheduleId - ID del horario
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>}
 */
export async function updateRecurringSchedule(scheduleId, updates) {
  try {
    const docRef = doc(db, 'recurring_schedules', scheduleId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    logger.info('✅ Horario actualizado:', scheduleId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error actualizando horario:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar un horario recurrente
 * @param {string} scheduleId - ID del horario
 * @returns {Promise<Object>}
 */
export async function deleteRecurringSchedule(scheduleId) {
  try {
    // Eliminar todas las instancias futuras
    const instancesQuery = query(
      collection(db, 'class_instances'),
      where('scheduleId', '==', scheduleId),
      where('status', '==', 'scheduled')
    );
    const instancesSnapshot = await getDocs(instancesQuery);

    const deletePromises = instancesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Eliminar el horario
    await deleteDoc(doc(db, 'recurring_schedules', scheduleId));

    logger.info('✅ Horario eliminado:', scheduleId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error eliminando horario:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener horario por ID
 * @param {string} scheduleId
 * @returns {Promise<Object|null>}
 */
export async function getRecurringSchedule(scheduleId) {
  try {
    const docRef = doc(db, 'recurring_schedules', scheduleId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    logger.error('❌ Error obteniendo horario:', error);
    return null;
  }
}

/**
 * Obtener horarios de un profesor
 * @param {string} teacherId
 * @returns {Promise<Array>}
 */
export async function getTeacherSchedules(teacherId) {
  try {
    const q = query(
      collection(db, 'recurring_schedules'),
      where('teacherId', '==', teacherId),
      where('active', '==', true)
    );

    const snapshot = await getDocs(q);
    const schedules = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar en el cliente por createdAt (desc)
    return schedules.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
  } catch (error) {
    logger.error('❌ Error obteniendo horarios del profesor:', error);
    return [];
  }
}

/**
 * Inscribir estudiante a un horario
 * Se agrega al horario con timestamp actual y automáticamente a todas las clases futuras
 *
 * @param {string} scheduleId - ID del horario
 * @param {string} studentId - ID del estudiante
 * @param {string} studentName - Nombre del estudiante
 * @returns {Promise<Object>}
 */
export async function enrollStudentToSchedule(scheduleId, studentId, studentName) {
  try {
    const docRef = doc(db, 'recurring_schedules', scheduleId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: 'Horario no encontrado' };
    }

    const schedule = docSnap.data();
    const now = Timestamp.now();

    // Verificar si ya está inscrito (activo)
    const existingEnrollment = schedule.studentEnrollments?.find(
      e => e.studentId === studentId && e.status === 'active'
    );

    if (existingEnrollment) {
      return { success: false, error: 'Estudiante ya está inscrito en este horario' };
    }

    // Agregar enrollment
    await updateDoc(docRef, {
      studentEnrollments: arrayUnion({
        studentId,
        studentName,
        enrolledAt: now,
        unenrolledAt: null,
        status: 'active'
      }),
      updatedAt: serverTimestamp()
    });

    // Actualizar instancias futuras (desde ahora en adelante)
    await updateFutureInstancesForSchedule(scheduleId, now);

    logger.info('✅ Estudiante inscrito al horario:', scheduleId, studentId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error inscribiendo estudiante:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Desinscribir estudiante de un horario
 * Marca la fecha de baja y actualiza instancias futuras
 *
 * @param {string} scheduleId - ID del horario
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<Object>}
 */
export async function unenrollStudentFromSchedule(scheduleId, studentId) {
  try {
    const docRef = doc(db, 'recurring_schedules', scheduleId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: 'Horario no encontrado' };
    }

    const schedule = docSnap.data();
    const now = Timestamp.now();

    // Actualizar el enrollment marcándolo como inactivo
    const updatedEnrollments = schedule.studentEnrollments.map(e =>
      e.studentId === studentId && e.status === 'active'
        ? { ...e, unenrolledAt: now, status: 'inactive' }
        : e
    );

    await updateDoc(docRef, {
      studentEnrollments: updatedEnrollments,
      updatedAt: serverTimestamp()
    });

    // Actualizar instancias futuras
    await updateFutureInstancesForSchedule(scheduleId, now);

    logger.info('✅ Estudiante desinscrito del horario:', scheduleId, studentId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error desinscribiendo estudiante:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calcular estudiantes elegibles para una fecha específica
 * Un estudiante es elegible si:
 * - Fue inscrito antes/en esa fecha (enrolledAt <= date)
 * - Y no fue desinscrito, o fue desinscrito después (unenrolledAt == null || unenrolledAt > date)
 *
 * @param {Array} enrollments - Array de enrollments
 * @param {Timestamp} date - Fecha a evaluar
 * @returns {Array} - Array de studentIds elegibles
 */
export function calculateEligibleStudents(enrollments, date) {
  if (!enrollments || enrollments.length === 0) return [];

  return enrollments
    .filter(e => {
      // Debe estar inscrito antes/en la fecha
      const wasEnrolled = e.enrolledAt.toMillis() <= date.toMillis();

      // No debe estar dado de baja, o debe haberse dado de baja DESPUÉS
      const stillEnrolled = !e.unenrolledAt || e.unenrolledAt.toMillis() > date.toMillis();

      return wasEnrolled && stillEnrolled;
    })
    .map(e => e.studentId);
}

/**
 * Generar instancias de clase para un horario
 * Crea documentos en class_instances para las próximas N semanas
 *
 * @param {string} scheduleId - ID del horario
 * @param {number} weeksAhead - Cuántas semanas adelante generar (default: 4)
 * @returns {Promise<Object>}
 */
export async function generateInstancesForSchedule(scheduleId, weeksAhead = 4) {
  try {
    const scheduleDoc = await getDoc(doc(db, 'recurring_schedules', scheduleId));

    if (!scheduleDoc.exists()) {
      return { success: false, error: 'Horario no encontrado' };
    }

    const schedule = scheduleDoc.data();
    const now = new Date();
    const startDate = schedule.startDate.toDate();
    const endDate = schedule.endDate ? schedule.endDate.toDate() : null;

    // Fecha límite para generar instancias
    const generateUntil = new Date(now);
    generateUntil.setDate(generateUntil.getDate() + (weeksAhead * 7));

    // Si hay endDate y es antes que generateUntil, usar endDate
    const finalDate = endDate && endDate < generateUntil ? endDate : generateUntil;

    let instancesCreated = 0;
    const instances = [];

    // Iterar cada día desde ahora hasta finalDate
    for (let date = new Date(Math.max(now.getTime(), startDate.getTime())); date <= finalDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();

      // Ver si este día tiene clase según schedules
      const scheduleForDay = schedule.schedules.find(s => s.day === dayOfWeek);

      if (scheduleForDay) {
        const [hours, minutes] = scheduleForDay.startTime.split(':');
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
            const [endHours, endMinutes] = scheduleForDay.endTime.split(':');
            const endDateTime = new Date(classDateTime);
            endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
            const scheduledEnd = Timestamp.fromDate(endDateTime);

            // Calcular estudiantes elegibles para esta fecha
            const eligibleStudentIds = calculateEligibleStudents(
              schedule.studentEnrollments || [],
              scheduledStart
            );

            // Generar roomName único
            const roomName = schedule.mode === 'live'
              ? `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              : null;

            // Crear instancia
            const instanceData = {
              scheduleId,
              scheduleName: schedule.name,
              scheduleType: 'recurring',

              // Fecha/hora
              scheduledStart,
              scheduledEnd,

              // Info del profesor y curso
              teacherId: schedule.teacherId,
              teacherName: schedule.teacherName,
              courseId: schedule.courseId,
              courseName: schedule.courseName,

              // Modalidad
              mode: schedule.mode,
              whiteboardType: schedule.whiteboardType,
              roomName,

              // Estudiantes
              eligibleStudentIds,
              attendedStudentIds: [],

              // Estado
              status: 'scheduled',
              startedAt: null,
              endedAt: null,

              // Meta
              duration: schedule.duration,
              creditCost: schedule.creditCost,
              meetLink: schedule.meetLink,
              zoomLink: schedule.zoomLink,

              // LiveKit
              maxParticipants: schedule.maxParticipants,
              recordingEnabled: schedule.recordingEnabled,
              meetSessionId: null,

              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };

            instances.push(instanceData);
            instancesCreated++;
          }
        }
      }
    }

    // Crear todas las instancias en batch
    if (instances.length > 0) {
      const addPromises = instances.map(instance =>
        addDoc(collection(db, 'class_instances'), instance)
      );
      await Promise.all(addPromises);
    }

    logger.info(`✅ ${instancesCreated} instancias generadas para horario ${scheduleId}`);
    return { success: true, instancesCreated };
  } catch (error) {
    logger.error('❌ Error generando instancias:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar instancias futuras de un horario
 * Recalcula eligibleStudentIds para todas las instancias que aún no han empezado
 *
 * @param {string} scheduleId - ID del horario
 * @param {Timestamp} fromDate - Actualizar desde esta fecha en adelante
 * @returns {Promise<Object>}
 */
async function updateFutureInstancesForSchedule(scheduleId, fromDate) {
  try {
    const scheduleDoc = await getDoc(doc(db, 'recurring_schedules', scheduleId));

    if (!scheduleDoc.exists()) {
      return { success: false, error: 'Horario no encontrado' };
    }

    const schedule = scheduleDoc.data();

    // Buscar todas las instancias futuras
    const instancesQuery = query(
      collection(db, 'class_instances'),
      where('scheduleId', '==', scheduleId),
      where('scheduledStart', '>=', fromDate),
      where('status', '==', 'scheduled')
    );

    const instancesSnapshot = await getDocs(instancesQuery);

    const updatePromises = instancesSnapshot.docs.map(instanceDoc => {
      const instanceData = instanceDoc.data();

      // Recalcular estudiantes elegibles para la fecha de esta instancia
      const eligibleStudentIds = calculateEligibleStudents(
        schedule.studentEnrollments || [],
        instanceData.scheduledStart
      );

      return updateDoc(instanceDoc.ref, {
        eligibleStudentIds,
        updatedAt: serverTimestamp()
      });
    });

    await Promise.all(updatePromises);

    logger.info(`✅ ${instancesSnapshot.size} instancias futuras actualizadas para horario ${scheduleId}`);
    return { success: true, instancesUpdated: instancesSnapshot.size };
  } catch (error) {
    logger.error('❌ Error actualizando instancias futuras:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener instancias de un horario
 * @param {string} scheduleId
 * @param {Object} options - { status: 'scheduled'|'live'|'ended', limit: number }
 * @returns {Promise<Array>}
 */
export async function getScheduleInstances(scheduleId, options = {}) {
  try {
    let q = query(
      collection(db, 'class_instances'),
      where('scheduleId', '==', scheduleId)
    );

    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }

    q = query(q, orderBy('scheduledStart', 'asc'));

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
    logger.error('❌ Error obteniendo instancias del horario:', error);
    return [];
  }
}

/**
 * Pausar un horario (deja de generar instancias futuras)
 * @param {string} scheduleId
 * @returns {Promise<Object>}
 */
export async function pauseSchedule(scheduleId) {
  try {
    await updateDoc(doc(db, 'recurring_schedules', scheduleId), {
      status: 'paused',
      updatedAt: serverTimestamp()
    });

    logger.info('✅ Horario pausado:', scheduleId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error pausando horario:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reactivar un horario pausado
 * @param {string} scheduleId
 * @returns {Promise<Object>}
 */
export async function resumeSchedule(scheduleId) {
  try {
    await updateDoc(doc(db, 'recurring_schedules', scheduleId), {
      status: 'active',
      updatedAt: serverTimestamp()
    });

    // Regenerar instancias para las próximas 4 semanas
    await generateInstancesForSchedule(scheduleId, 4);

    logger.info('✅ Horario reactivado:', scheduleId);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error reactivando horario:', error);
    return { success: false, error: error.message };
  }
}
