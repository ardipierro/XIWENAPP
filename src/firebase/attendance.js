import logger from '../utils/logger';

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { useCreditsForClass } from './credits';
import { getUserCredits } from './credits';

// ============================================
// ASISTENCIA A CLASES
// ============================================

/**
 * Marcar asistencia de un estudiante
 * @param {Object} attendanceData - Datos de asistencia
 * @returns {Promise<Object>} - {success: boolean, id?: string, error?: string}
 */
export async function markAttendance(attendanceData) {
  try {
    const {
      sessionId,
      studentId,
      studentName,
      groupId,
      status = 'present', // present, absent, late, excused
      markedBy = 'auto', // auto, teacher, student
      linkClicked = false,
      creditCost = 1,
      deductCredits = true
    } = attendanceData;

    if (!sessionId || !studentId) {
      return { success: false, error: 'Faltan campos obligatorios' };
    }

    // Verificar si ya existe registro de asistencia
    const exists = await getStudentAttendance(sessionId, studentId);
    if (exists) {
      return { success: false, error: 'Ya existe registro de asistencia para esta sesión' };
    }

    const batch = writeBatch(db);

    // Crear registro de asistencia
    const attendanceRef = collection(db, 'class_attendance');
    const attendanceDoc = {
      sessionId,
      studentId,
      studentName: studentName || '',
      groupId: groupId || '',
      status,
      markedBy,
      linkClicked,
      linkClickedAt: linkClicked ? serverTimestamp() : null,
      creditDeducted: false,
      creditCost,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const attendanceDocRef = doc(attendanceRef);
    batch.set(attendanceDocRef, attendanceDoc);

    await batch.commit();

    // Deducir créditos si el alumno está presente
    let creditResult = { success: true };
    if (deductCredits && status === 'present' && creditCost > 0) {
      creditResult = await deductCreditsForAttendance(
        attendanceDocRef.id,
        studentId,
        creditCost,
        sessionId
      );
    }

    return {
      success: true,
      id: attendanceDocRef.id,
      creditDeducted: creditResult.success
    };
  } catch (error) {
    logger.error('Error al marcar asistencia:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Marcar asistencia al hacer click en link de videollamada
 * @param {string} sessionId - ID de la sesión
 * @param {string} studentId - ID del estudiante
 * @param {string} studentName - Nombre del estudiante
 * @param {number} creditCost - Costo en créditos
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function markAttendanceByLink(sessionId, studentId, studentName, creditCost = 1) {
  try {
    // Verificar créditos antes de marcar asistencia
    const credits = await getUserCredits(studentId);
    if (!credits || (credits.availableCredits || 0) < creditCost) {
      return {
        success: false,
        error: 'Créditos insuficientes',
        insufficientCredits: true
      };
    }

    const result = await markAttendance({
      sessionId,
      studentId,
      studentName,
      status: 'present',
      markedBy: 'student',
      linkClicked: true,
      creditCost,
      deductCredits: true
    });

    return result;
  } catch (error) {
    logger.error('Error al marcar asistencia por link:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Deducir créditos por asistencia a clase
 * @param {string} attendanceId - ID del registro de asistencia
 * @param {string} studentId - ID del estudiante
 * @param {number} creditCost - Cantidad de créditos
 * @param {string} sessionId - ID de la sesión
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
async function deductCreditsForAttendance(attendanceId, studentId, creditCost, sessionId) {
  try {
    // Obtener información de la sesión para el reason
    const sessionDoc = await getDoc(doc(db, 'class_sessions', sessionId));
    const sessionData = sessionDoc.exists() ? sessionDoc.data() : {};

    const className = sessionData.courseName || 'Clase';
    const sessionDate = sessionData.date
      ? (sessionData.date.toDate ? sessionData.date.toDate() : new Date(sessionData.date))
      : new Date();

    const formattedDate = sessionDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Usar la función de créditos para deducir
    const result = await useCreditsForClass(
      studentId,
      creditCost,
      sessionId,
      `${className} - ${formattedDate}`
    );

    if (result.success) {
      // Actualizar registro de asistencia
      const attendanceRef = doc(db, 'class_attendance', attendanceId);
      await updateDoc(attendanceRef, {
        creditDeducted: true,
        creditDeductedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    return result;
  } catch (error) {
    logger.error('Error al deducir créditos:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener asistencia de un estudiante en una sesión
 * @param {string} sessionId - ID de la sesión
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<Object|null>} - Registro de asistencia o null
 */
export async function getStudentAttendance(sessionId, studentId) {
  try {
    const q = query(
      collection(db, 'class_attendance'),
      where('sessionId', '==', sessionId),
      where('studentId', '==', studentId)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }

    return null;
  } catch (error) {
    logger.error('Error al obtener asistencia:', error);
    return null;
  }
}

/**
 * Obtener todas las asistencias de una sesión
 * @param {string} sessionId - ID de la sesión
 * @returns {Promise<Array>} - Lista de asistencias
 */
export async function getSessionAttendance(sessionId) {
  try {
    // Query simple sin orderBy para evitar necesitar índice compuesto
    const q = query(
      collection(db, 'class_attendance'),
      where('sessionId', '==', sessionId)
    );

    const snapshot = await getDocs(q);

    // Ordenar en el cliente
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateA - dateB; // ascendente
      });
  } catch (error) {
    logger.error('Error al obtener asistencias de sesión:', error);
    return [];
  }
}

/**
 * Obtener historial de asistencias de un estudiante
 * @param {string} studentId - ID del estudiante
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} - Lista de asistencias
 */
export async function getStudentAttendanceHistory(studentId, limit = 50) {
  try {
    // Query simple sin orderBy para evitar necesitar índice compuesto
    const q = query(
      collection(db, 'class_attendance'),
      where('studentId', '==', studentId)
    );

    const snapshot = await getDocs(q);

    // Ordenar en el cliente
    const attendances = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA; // descendente (más reciente primero)
      });

    return attendances.slice(0, limit);
  } catch (error) {
    logger.error('Error al obtener historial de asistencias:', error);
    return [];
  }
}

/**
 * Actualizar estado de asistencia
 * @param {string} attendanceId - ID del registro de asistencia
 * @param {string} status - Nuevo estado
 * @param {string} updatedBy - Quién actualiza
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function updateAttendanceStatus(attendanceId, status, updatedBy = 'teacher') {
  try {
    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(status)) {
      return { success: false, error: 'Estado inválido' };
    }

    const docRef = doc(db, 'class_attendance', attendanceId);
    await updateDoc(docRef, {
      status,
      lastUpdatedBy: updatedBy,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    logger.error('Error al actualizar estado de asistencia:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener estadísticas de asistencia de un estudiante
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<Object>} - Estadísticas
 */
export async function getStudentAttendanceStats(studentId) {
  try {
    const attendances = await getStudentAttendanceHistory(studentId, 1000);

    const stats = {
      total: attendances.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      attendanceRate: 0,
      totalCreditsSpent: 0
    };

    attendances.forEach(att => {
      switch (att.status) {
        case 'present':
          stats.present++;
          break;
        case 'absent':
          stats.absent++;
          break;
        case 'late':
          stats.late++;
          break;
        case 'excused':
          stats.excused++;
          break;
      }

      if (att.creditDeducted && att.creditCost) {
        stats.totalCreditsSpent += att.creditCost;
      }
    });

    // Calcular porcentaje de asistencia (presente + tarde)
    if (stats.total > 0) {
      stats.attendanceRate = Math.round(
        ((stats.present + stats.late) / stats.total) * 100
      );
    }

    return stats;
  } catch (error) {
    logger.error('Error al obtener estadísticas de asistencia:', error);
    return {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      attendanceRate: 0,
      totalCreditsSpent: 0
    };
  }
}

/**
 * Marcar asistencia masiva (múltiples estudiantes)
 * @param {string} sessionId - ID de la sesión
 * @param {Array} students - Lista de estudiantes [{id, name}, ...]
 * @param {string} status - Estado de asistencia
 * @param {string} markedBy - Quién marca
 * @returns {Promise<Object>} - {success: boolean, marked: number, error?: string}
 */
export async function markBulkAttendance(sessionId, students, status = 'present', markedBy = 'teacher') {
  try {
    let marked = 0;

    for (const student of students) {
      const result = await markAttendance({
        sessionId,
        studentId: student.id,
        studentName: student.name,
        status,
        markedBy,
        linkClicked: false,
        creditCost: 1,
        deductCredits: status === 'present'
      });

      if (result.success) marked++;
    }

    return { success: true, marked };
  } catch (error) {
    logger.error('Error al marcar asistencia masiva:', error);
    return { success: false, marked: 0, error: error.message };
  }
}
