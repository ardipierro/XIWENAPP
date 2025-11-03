import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { getClassById, getClassesForStudent } from './classes';
import { getGroupMembers, getStudentGroups } from './groups';

/**
 * CRUD para Instancias de Clase
 * Una "instancia" es una ocurrencia específica de una clase recurrente
 * Ejemplo: "Mandarín HSK 1" el 05/11/2025 a las 10:00
 */

/**
 * Generar instancias para una clase recurrente
 * @param {string} classId - ID de la clase recurrente
 * @param {number} weeksAhead - Número de semanas a generar
 * @param {Date|string|null} startDate - Fecha de inicio opcional (default: hoy)
 * @returns {Promise<Object>} - {success: boolean, count: number, error?: string}
 */
export async function generateInstances(classId, weeksAhead = 4, startDate = null) {
  try {
    const classData = await getClassById(classId);
    if (!classData) {
      return { success: false, error: 'Clase no encontrada' };
    }

    const { schedules, name, creditCost, meetingLink, teacherId, courseId, courseName } = classData;

    if (!schedules || schedules.length === 0) {
      return { success: false, error: 'La clase no tiene horarios definidos' };
    }

    const instances = [];
    // Usar fecha de inicio proporcionada o la fecha de inicio de la clase o hoy
    let baseDate;
    if (startDate) {
      baseDate = typeof startDate === 'string' ? new Date(startDate) : startDate;
    } else if (classData.startDate) {
      baseDate = typeof classData.startDate === 'string' ? new Date(classData.startDate) : classData.startDate;
    } else {
      baseDate = new Date();
    }
    baseDate.setHours(0, 0, 0, 0);

    // Obtener estudiantes de grupos asignados
    const allStudentIds = new Set();
    if (classData.assignedGroups && classData.assignedGroups.length > 0) {
      for (const groupId of classData.assignedGroups) {
        const members = await getGroupMembers(groupId);
        members.forEach(member => allStudentIds.add(member.studentId));
      }
    }

    // Agregar estudiantes individuales
    if (classData.assignedStudents) {
      classData.assignedStudents.forEach(id => allStudentIds.add(id));
    }

    const studentIds = Array.from(allStudentIds);

    // Generar instancias para cada horario y cada semana
    for (let week = 0; week < weeksAhead; week++) {
      for (const schedule of schedules) {
        const { day, startTime, endTime } = schedule;

        // Calcular la fecha de esta instancia
        const instanceDate = new Date(baseDate);
        const daysUntilTarget = (day - baseDate.getDay() + 7) % 7;
        instanceDate.setDate(baseDate.getDate() + daysUntilTarget + (week * 7));

        // Solo crear si es fecha futura (respecto a hoy)
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (instanceDate < now) continue;

        // Verificar si ya existe una instancia para esta fecha/hora
        const existingInstance = await getInstanceByDateAndClass(classId, instanceDate, startTime);
        if (existingInstance) {
          console.log(`⏭️ Instancia ya existe: ${name} - ${instanceDate.toLocaleDateString()}`);
          continue;
        }

        const instance = {
          classId,
          className: name,
          courseId: courseId || null,
          courseName: courseName || '',
          date: Timestamp.fromDate(instanceDate),
          startTime,
          endTime,
          meetingLink: meetingLink || '',
          creditCost: creditCost || 1,
          status: 'scheduled',
          groupIds: classData.assignedGroups || [],
          studentIds,
          teacherId,
          createdAt: serverTimestamp()
        };

        instances.push(instance);
      }
    }

    // Guardar todas las instancias
    const batch = writeBatch(db);
    const instancesRef = collection(db, 'class_instances');

    instances.forEach(instance => {
      const newDocRef = doc(instancesRef);
      batch.set(newDocRef, instance);
    });

    await batch.commit();

    console.log(`✅ ${instances.length} instancias generadas para clase: ${name}`);
    return { success: true, count: instances.length };
  } catch (error) {
    console.error('❌ Error generando instancias:', error);
    return { success: false, error: error.message, count: 0 };
  }
}

/**
 * Verificar si ya existe una instancia para una clase en una fecha/hora específica
 * @param {string} classId - ID de la clase
 * @param {Date} date - Fecha
 * @param {string} startTime - Hora de inicio
 * @returns {Promise<Object|null>} - Instancia existente o null
 */
async function getInstanceByDateAndClass(classId, date, startTime) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'class_instances'),
      where('classId', '==', classId),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay)),
      where('startTime', '==', startTime)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error('Error verificando instancia existente:', error);
    return null;
  }
}

/**
 * Obtener todas las instancias de una clase
 * @param {string} classId - ID de la clase
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} - Array de instancias
 */
export async function getInstancesByClass(classId, limit = 50) {
  try {
    const q = query(
      collection(db, 'class_instances'),
      where('classId', '==', classId),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);
    const instances = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return instances.slice(0, limit);
  } catch (error) {
    console.error('❌ Error obteniendo instancias:', error);
    return [];
  }
}

/**
 * Obtener próximas instancias (todas las clases)
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} - Array de instancias
 */
export async function getUpcomingInstances(limit = 20) {
  try {
    const now = Timestamp.now();

    const q = query(
      collection(db, 'class_instances'),
      where('status', '==', 'scheduled'),
      where('date', '>=', now),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);
    const instances = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return instances.slice(0, limit);
  } catch (error) {
    console.error('❌ Error obteniendo próximas instancias:', error);
    return [];
  }
}

/**
 * Obtener instancias para un estudiante
 * @param {string} studentId - ID del estudiante
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} - Array de instancias
 */
export async function getInstancesForStudent(studentId, limit = 50) {
  try {
    // 1. Obtener todas las clases asignadas al estudiante (directamente o por grupos)
    const assignedClasses = await getClassesForStudent(studentId);

    // 2. Obtener grupos del estudiante
    const studentGroups = await getStudentGroups(studentId);
    const studentGroupIds = studentGroups.map(g => g.id);

    // 3. Obtener todas las clases activas
    const allClassesQuery = query(
      collection(db, 'classes'),
      where('active', '==', true)
    );
    const allClassesSnapshot = await getDocs(allClassesQuery);
    const allClasses = allClassesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 4. Filtrar clases donde el estudiante está asignado (directamente o por grupo)
    const relevantClassIds = allClasses
      .filter(cls => {
        // Asignado directamente
        if (cls.assignedStudents?.includes(studentId)) return true;
        // Asignado por grupo
        if (cls.assignedGroups?.some(groupId => studentGroupIds.includes(groupId))) return true;
        return false;
      })
      .map(cls => cls.id);

    if (relevantClassIds.length === 0) {
      console.log('📚 No hay clases asignadas para el estudiante:', studentId);
      return [];
    }

    console.log('📚 Clases asignadas:', relevantClassIds.length, relevantClassIds);

    // 5. Obtener todas las instancias de esas clases
    const allInstances = [];

    // Hacer queries en batches de 10 (límite de Firestore para 'in')
    const batchSize = 10;
    for (let i = 0; i < relevantClassIds.length; i += batchSize) {
      const batch = relevantClassIds.slice(i, i + batchSize);
      const q = query(
        collection(db, 'class_instances'),
        where('classId', 'in', batch)
      );

      const snapshot = await getDocs(q);
      const instances = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      allInstances.push(...instances);
    }

    // 6. Ordenar por fecha ascendente
    allInstances.sort((a, b) => {
      const dateA = a.date?.toMillis?.() || 0;
      const dateB = b.date?.toMillis?.() || 0;
      return dateA - dateB;
    });

    console.log('📅 Total de instancias encontradas:', allInstances.length);

    return allInstances.slice(0, limit);
  } catch (error) {
    console.error('❌ Error obteniendo instancias del estudiante:', error);
    return [];
  }
}

/**
 * Obtener instancias por rango de fechas
 * @param {Date} startDate - Fecha inicio
 * @param {Date} endDate - Fecha fin
 * @returns {Promise<Array>} - Array de instancias
 */
export async function getInstancesByDateRange(startDate, endDate) {
  try {
    const q = query(
      collection(db, 'class_instances'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);
    const instances = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return instances;
  } catch (error) {
    console.error('❌ Error obteniendo instancias por rango:', error);
    return [];
  }
}

/**
 * Actualizar estado de una instancia
 * @param {string} instanceId - ID de la instancia
 * @param {string} status - Nuevo estado (scheduled, in_progress, completed, cancelled)
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function updateInstanceStatus(instanceId, status) {
  try {
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return { success: false, error: 'Estado inválido' };
    }

    const docRef = doc(db, 'class_instances', instanceId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Estado de instancia actualizado:', instanceId, '->', status);
    return { success: true };
  } catch (error) {
    console.error('❌ Error actualizando estado de instancia:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancelar una instancia específica
 * @param {string} instanceId - ID de la instancia
 * @param {string} reason - Razón de cancelación
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function cancelInstance(instanceId, reason = '') {
  try {
    const docRef = doc(db, 'class_instances', instanceId);
    await updateDoc(docRef, {
      status: 'cancelled',
      cancelReason: reason,
      cancelledAt: serverTimestamp()
    });

    console.log('✅ Instancia cancelada:', instanceId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error cancelando instancia:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar una instancia
 * @param {string} instanceId - ID de la instancia
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function deleteInstance(instanceId) {
  try {
    const docRef = doc(db, 'class_instances', instanceId);
    await deleteDoc(docRef);

    console.log('✅ Instancia eliminada:', instanceId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error eliminando instancia:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener una instancia por ID
 * @param {string} instanceId - ID de la instancia
 * @returns {Promise<Object|null>} - Datos de la instancia o null
 */
export async function getInstanceById(instanceId) {
  try {
    const docRef = doc(db, 'class_instances', instanceId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo instancia:', error);
    return null;
  }
}
