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
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

/**
 * CRUD para Clases Recurrentes
 * Una "clase" es un curso que se imparte regularmente con horarios definidos
 * y genera "instancias" (sesiones) automáticamente en el calendario
 */

/**
 * Crear una nueva clase recurrente
 * @param {Object} classData - Datos de la clase
 * @returns {Promise<Object>} - {success: boolean, classId?: string, error?: string}
 */
export async function createClass(classData) {
  try {
    const {
      name,
      description = '',
      courseId = null,
      courseName = '',
      contentIds = [],
      schedules = [], // [{ day: 1, startTime: "10:00", endTime: "11:00" }]
      duration = 60,
      creditCost = 1,
      meetingLink = '',
      assignedGroups = [],
      assignedStudents = [],
      teacherId
    } = classData;

    // Validaciones
    if (!name || !teacherId) {
      return { success: false, error: 'Nombre y profesor son requeridos' };
    }

    if (schedules.length === 0) {
      return { success: false, error: 'Debe definir al menos un horario' };
    }

    const newClass = {
      name,
      description,
      courseId,
      courseName,
      contentIds,
      schedules,
      duration,
      creditCost,
      meetingLink,
      assignedGroups,
      assignedStudents,
      teacherId,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'classes'), newClass);

    console.log('✅ Clase creada:', docRef.id);
    return { success: true, classId: docRef.id };
  } catch (error) {
    console.error('❌ Error creando clase:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar una clase existente
 * @param {string} classId - ID de la clase
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function updateClass(classId, updates) {
  try {
    const docRef = doc(db, 'classes', classId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Clase actualizada:', classId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error actualizando clase:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar una clase (soft delete)
 * @param {string} classId - ID de la clase
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function deleteClass(classId) {
  try {
    const docRef = doc(db, 'classes', classId);
    await updateDoc(docRef, {
      active: false,
      deletedAt: serverTimestamp()
    });

    console.log('✅ Clase eliminada:', classId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error eliminando clase:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener todas las clases de un profesor
 * @param {string} teacherId - ID del profesor
 * @returns {Promise<Array>} - Array de clases
 */
export async function getClassesByTeacher(teacherId) {
  try {
    // Consulta simplificada sin orderBy para evitar requerir índice compuesto
    const q = query(
      collection(db, 'classes'),
      where('teacherId', '==', teacherId)
    );

    const snapshot = await getDocs(q);
    const classes = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Filtrar activos y ordenar en memoria
      .filter(cls => cls.active !== false)
      .sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA;
      });

    return classes;
  } catch (error) {
    console.error('❌ Error obteniendo clases:', error);
    return [];
  }
}

/**
 * Obtener todas las clases (admin)
 * @returns {Promise<Array>} - Array de clases
 */
export async function getAllClasses() {
  try {
    const q = query(
      collection(db, 'classes'),
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const classes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return classes;
  } catch (error) {
    console.error('❌ Error obteniendo todas las clases:', error);
    return [];
  }
}

/**
 * Obtener una clase por ID
 * @param {string} classId - ID de la clase
 * @returns {Promise<Object|null>} - Datos de la clase o null
 */
export async function getClassById(classId) {
  try {
    const docRef = doc(db, 'classes', classId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo clase:', error);
    return null;
  }
}

/**
 * Asignar un grupo a una clase
 * @param {string} classId - ID de la clase
 * @param {string} groupId - ID del grupo
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function assignGroupToClass(classId, groupId) {
  try {
    const classDoc = await getClassById(classId);
    if (!classDoc) {
      return { success: false, error: 'Clase no encontrada' };
    }

    const currentGroups = classDoc.assignedGroups || [];
    if (currentGroups.includes(groupId)) {
      return { success: false, error: 'Grupo ya asignado' };
    }

    await updateClass(classId, {
      assignedGroups: [...currentGroups, groupId]
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Error asignando grupo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Desasignar un grupo de una clase
 * @param {string} classId - ID de la clase
 * @param {string} groupId - ID del grupo
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function unassignGroupFromClass(classId, groupId) {
  try {
    const classDoc = await getClassById(classId);
    if (!classDoc) {
      return { success: false, error: 'Clase no encontrada' };
    }

    const currentGroups = classDoc.assignedGroups || [];
    const updatedGroups = currentGroups.filter(id => id !== groupId);

    await updateClass(classId, {
      assignedGroups: updatedGroups
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Error desasignando grupo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Asignar un estudiante individual a una clase
 * @param {string} classId - ID de la clase
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function assignStudentToClass(classId, studentId) {
  try {
    const classDoc = await getClassById(classId);
    if (!classDoc) {
      return { success: false, error: 'Clase no encontrada' };
    }

    const currentStudents = classDoc.assignedStudents || [];
    if (currentStudents.includes(studentId)) {
      return { success: false, error: 'Estudiante ya asignado' };
    }

    await updateClass(classId, {
      assignedStudents: [...currentStudents, studentId]
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Error asignando estudiante:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Desasignar un estudiante de una clase
 * @param {string} classId - ID de la clase
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function unassignStudentFromClass(classId, studentId) {
  try {
    const classDoc = await getClassById(classId);
    if (!classDoc) {
      return { success: false, error: 'Clase no encontrada' };
    }

    const currentStudents = classDoc.assignedStudents || [];
    const updatedStudents = currentStudents.filter(id => id !== studentId);

    await updateClass(classId, {
      assignedStudents: updatedStudents
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Error desasignando estudiante:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener clases asignadas a un estudiante
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<Array>} - Array de clases
 */
export async function getClassesForStudent(studentId) {
  try {
    // Buscar clases donde el estudiante está asignado directamente
    const q1 = query(
      collection(db, 'classes'),
      where('assignedStudents', 'array-contains', studentId),
      where('active', '==', true)
    );

    const snapshot1 = await getDocs(q1);
    const directClasses = snapshot1.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      assignmentType: 'individual'
    }));

    // TODO: También buscar clases asignadas a grupos del estudiante
    // Esto requeriría consultar group_members primero

    return directClasses;
  } catch (error) {
    console.error('❌ Error obteniendo clases del estudiante:', error);
    return [];
  }
}

/**
 * Obtener día de la semana en número (0 = Domingo, 1 = Lunes, ...)
 * @param {string} dayName - Nombre del día en español
 * @returns {number} - Número del día
 */
export function getDayNumber(dayName) {
  const days = {
    'domingo': 0,
    'lunes': 1,
    'martes': 2,
    'miércoles': 3,
    'miercoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sábado': 6,
    'sabado': 6
  };
  return days[dayName.toLowerCase()] ?? -1;
}

/**
 * Obtener nombre del día en español
 * @param {number} dayNumber - Número del día (0-6)
 * @returns {string} - Nombre del día
 */
export function getDayName(dayNumber) {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayNumber] || '';
}
