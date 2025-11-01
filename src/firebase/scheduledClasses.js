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

// ============================================
// CLASES PROGRAMADAS (HORARIOS RECURRENTES)
// ============================================

/**
 * Crear clases programadas en múltiples días (wrapper para horarios recurrentes)
 * @param {Object} classData - Datos de la clase (con daysOfWeek como array)
 * @returns {Promise<Object>} - {success: boolean, ids?: Array, count?: number, error?: string}
 */
export async function createScheduledClassMultipleDays(classData) {
  try {
    const { daysOfWeek, ...restData } = classData;

    if (!daysOfWeek || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return { success: false, error: 'Debes seleccionar al menos un día' };
    }

    const createdIds = [];

    // Crear una clase programada por cada día seleccionado
    for (const dayOfWeek of daysOfWeek) {
      const result = await createScheduledClass({
        ...restData,
        dayOfWeek
      });

      if (result.success) {
        createdIds.push(result.id);
      } else {
        console.error(`Error al crear horario para día ${dayOfWeek}:`, result.error);
      }
    }

    if (createdIds.length === 0) {
      return { success: false, error: 'No se pudo crear ningún horario' };
    }

    return {
      success: true,
      ids: createdIds,
      count: createdIds.length
    };
  } catch (error) {
    console.error('Error al crear horarios múltiples:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Crear una clase programada recurrente
 * @param {Object} classData - Datos de la clase
 * @returns {Promise<Object>} - {success: boolean, id?: string, error?: string}
 */
export async function createScheduledClass(classData) {
  try {
    const {
      groupId,
      groupName,
      courseName,
      dayOfWeek, // 0=Domingo, 1=Lunes, ..., 6=Sábado
      startTime, // formato "HH:MM" (ej: "10:00")
      endTime,   // formato "HH:MM" (ej: "11:30")
      meetingLink, // URL de Meet/Zoom
      creditCost = 1, // créditos que cuesta la clase
      teacherId,
      active = true
    } = classData;

    // Validaciones
    if (!groupId || !dayOfWeek === undefined || !startTime || !endTime) {
      return { success: false, error: 'Faltan campos obligatorios' };
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return { success: false, error: 'Día de semana inválido (0-6)' };
    }

    if (creditCost < 0) {
      return { success: false, error: 'Costo de créditos no puede ser negativo' };
    }

    const scheduledClassData = {
      groupId,
      groupName: groupName || '',
      courseName: courseName || '',
      dayOfWeek,
      startTime,
      endTime,
      meetingLink: meetingLink || '',
      creditCost,
      teacherId,
      active,
      autoRenew: classData.autoRenew || false, // Auto-renovación de sesiones
      autoRenewWeeks: classData.autoRenewWeeks || 4, // Semanas a generar en cada renovación
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'scheduled_classes'), scheduledClassData);

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al crear clase programada:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener una clase programada por ID
 * @param {string} classId - ID de la clase
 * @returns {Promise<Object|null>} - Datos de la clase o null
 */
export async function getScheduledClass(classId) {
  try {
    const docRef = doc(db, 'scheduled_classes', classId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error al obtener clase programada:', error);
    return null;
  }
}

/**
 * Obtener todas las clases programadas de un grupo
 * @param {string} groupId - ID del grupo
 * @returns {Promise<Array>} - Lista de clases programadas
 */
export async function getGroupScheduledClasses(groupId) {
  try {
    // Query simple sin orderBy para evitar necesitar índice compuesto
    const q = query(
      collection(db, 'scheduled_classes'),
      where('groupId', '==', groupId),
      where('active', '==', true) // Solo horarios activos
    );

    const snapshot = await getDocs(q);

    // Ordenar en el cliente por día de la semana
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.dayOfWeek || 0) - (b.dayOfWeek || 0));
  } catch (error) {
    console.error('Error al obtener clases del grupo:', error);
    return [];
  }
}

/**
 * Obtener todas las clases programadas de un profesor
 * @param {string} teacherId - ID del profesor
 * @returns {Promise<Array>} - Lista de clases programadas
 */
export async function getTeacherScheduledClasses(teacherId) {
  try {
    // Query simple sin orderBy para evitar necesitar índice compuesto
    const q = query(
      collection(db, 'scheduled_classes'),
      where('teacherId', '==', teacherId),
      where('active', '==', true)
    );

    const snapshot = await getDocs(q);

    // Ordenar en el cliente por día de la semana
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.dayOfWeek || 0) - (b.dayOfWeek || 0));
  } catch (error) {
    console.error('Error al obtener clases del profesor:', error);
    return [];
  }
}

/**
 * Actualizar una clase programada
 * @param {string} classId - ID de la clase
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function updateScheduledClass(classId, updates) {
  try {
    const docRef = doc(db, 'scheduled_classes', classId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error al actualizar clase programada:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar (desactivar) una clase programada
 * @param {string} classId - ID de la clase
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function deleteScheduledClass(classId) {
  try {
    const docRef = doc(db, 'scheduled_classes', classId);
    // No borramos físicamente, solo desactivamos
    await updateDoc(docRef, {
      active: false,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error al eliminar clase programada:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener clases programadas por día de la semana
 * @param {number} dayOfWeek - Día de la semana (0-6)
 * @returns {Promise<Array>} - Lista de clases
 */
export async function getClassesByDay(dayOfWeek) {
  try {
    // Query simple sin orderBy para evitar necesitar índice compuesto
    const q = query(
      collection(db, 'scheduled_classes'),
      where('dayOfWeek', '==', dayOfWeek),
      where('active', '==', true)
    );

    const snapshot = await getDocs(q);

    // Ordenar en el cliente por hora de inicio
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  } catch (error) {
    console.error('Error al obtener clases por día:', error);
    return [];
  }
}

/**
 * Helper: Convertir día de semana a nombre en español
 * @param {number} dayOfWeek - 0-6
 * @returns {string} - Nombre del día
 */
export function getDayName(dayOfWeek) {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayOfWeek] || 'Desconocido';
}

/**
 * Verificar y auto-renovar sesiones de horarios con autoRenew activo
 * @param {string} groupId - ID del grupo (opcional, si no se pasa verifica todos)
 * @returns {Promise<Object>} - {success: boolean, renewed: number, details: Array}
 */
export async function checkAndAutoRenewSessions(groupId = null) {
  try {
    let q;
    if (groupId) {
      q = query(
        collection(db, 'scheduled_classes'),
        where('groupId', '==', groupId),
        where('active', '==', true),
        where('autoRenew', '==', true)
      );
    } else {
      q = query(
        collection(db, 'scheduled_classes'),
        where('active', '==', true),
        where('autoRenew', '==', true)
      );
    }

    const snapshot = await getDocs(q);
    const schedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let totalRenewed = 0;
    const details = [];

    // Importar la función de sesiones
    const { getScheduledClassStats, generateSessionsForScheduledClass } =
      await import('./classSessions');

    for (const schedule of schedules) {
      // Obtener estadísticas de sesiones
      const stats = await getScheduledClassStats(schedule.id);

      // Si tiene menos de 3 sesiones pendientes, generar más
      if (stats.upcoming < 3) {
        const weeksToGenerate = schedule.autoRenewWeeks || 4;

        const result = await generateSessionsForScheduledClass(
          schedule.id,
          schedule,
          weeksToGenerate
        );

        if (result.success && result.created > 0) {
          totalRenewed += result.created;
          details.push({
            scheduleId: schedule.id,
            scheduleName: `${getDayName(schedule.dayOfWeek)} ${schedule.startTime}`,
            sessionsCreated: result.created,
            weeksGenerated: weeksToGenerate
          });

          console.log(`✅ Auto-renovado: ${schedule.groupName} - ${getDayName(schedule.dayOfWeek)} (${result.created} sesiones)`);
        }
      }
    }

    return {
      success: true,
      renewed: totalRenewed,
      details
    };
  } catch (error) {
    console.error('Error al auto-renovar sesiones:', error);
    return {
      success: false,
      renewed: 0,
      details: [],
      error: error.message
    };
  }
}

/**
 * Helper: Obtener siguiente fecha de una clase programada
 * @param {number} dayOfWeek - Día de la semana (0-6)
 * @param {string} startTime - Hora de inicio "HH:MM"
 * @returns {Date} - Próxima fecha/hora de la clase
 */
export function getNextClassDate(dayOfWeek, startTime) {
  const now = new Date();
  const currentDay = now.getDay();

  // Calcular días hasta la próxima clase
  let daysUntil = dayOfWeek - currentDay;
  if (daysUntil < 0) {
    daysUntil += 7;
  } else if (daysUntil === 0) {
    // Si es hoy, verificar si ya pasó la hora
    const [hours, minutes] = startTime.split(':').map(Number);
    const classTime = new Date(now);
    classTime.setHours(hours, minutes, 0, 0);

    if (now > classTime) {
      daysUntil = 7; // Próxima semana
    }
  }

  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysUntil);

  const [hours, minutes] = startTime.split(':').map(Number);
  nextDate.setHours(hours, minutes, 0, 0);

  return nextDate;
}
