/**
 * @fileoverview Guardian/Parent/Tutor management system
 * @module firebase/guardians
 *
 * Gestiona tutores/padres/encargados y sus relaciones con estudiantes
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import logger from '../utils/logger';

/**
 * Tipos de relaciones disponibles
 */
export const RELATIONSHIP_TYPES = {
  PADRE: 'padre',
  MADRE: 'madre',
  TUTOR: 'tutor',
  ABUELO: 'abuelo',
  ABUELA: 'abuela',
  TIO: 'tio',
  TIA: 'tia',
  HERMANO: 'hermano',
  HERMANA: 'hermana',
  OTRO: 'otro'
};

/**
 * Crea un nuevo tutor/encargado
 */
export async function createGuardian(guardianData) {
  try {
    logger.info('Creating guardian', { email: guardianData.email });

    const docRef = await addDoc(collection(db, 'guardians'), {
      ...guardianData,
      createdAt: Timestamp.now(),
      active: true
    });

    logger.info('Guardian created successfully', { guardianId: docRef.id });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('Error creating guardian', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene datos de un tutor por userId
 */
export async function getGuardianByUserId(userId) {
  try {
    const q = query(
      collection(db, 'guardians'),
      where('userId', '==', userId),
      where('active', '==', true)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    logger.error('Error getting guardian by userId', error);
    return null;
  }
}

/**
 * Vincula un tutor con un estudiante
 */
export async function linkGuardianToStudent({
  guardianId,
  studentId,
  studentName,
  relationship,
  permissions = {
    canViewGrades: true,
    canViewAttendance: true,
    canViewBehavior: true,
    canReceiveNotifications: true
  },
  addedBy
}) {
  try {
    logger.info('Linking guardian to student', { guardianId, studentId });

    // Verificar si ya existe la relación
    const q = query(
      collection(db, 'guardian_students'),
      where('guardianId', '==', guardianId),
      where('studentId', '==', studentId),
      where('active', '==', true)
    );

    const existing = await getDocs(q);

    if (!existing.empty) {
      logger.warn('Guardian-student relationship already exists');
      return { success: false, error: 'La relación ya existe' };
    }

    // Crear la relación
    const docRef = await addDoc(collection(db, 'guardian_students'), {
      guardianId,
      studentId,
      studentName,
      relationship,
      ...permissions,
      addedBy,
      addedAt: Timestamp.now(),
      active: true
    });

    logger.info('Guardian linked to student successfully', { relationId: docRef.id });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('Error linking guardian to student', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene todos los estudiantes de un tutor
 */
export async function getGuardianStudents(guardianId) {
  try {
    const q = query(
      collection(db, 'guardian_students'),
      where('guardianId', '==', guardianId),
      where('active', '==', true),
      orderBy('studentName', 'asc')
    );

    const snapshot = await getDocs(q);
    const students = [];

    snapshot.forEach(doc => {
      students.push({
        relationId: doc.id,
        ...doc.data()
      });
    });

    logger.info('Guardian students loaded', { guardianId, count: students.length });
    return students;
  } catch (error) {
    logger.error('Error getting guardian students', error);
    return [];
  }
}

/**
 * Obtiene todos los tutores de un estudiante
 */
export async function getStudentGuardians(studentId) {
  try {
    const q = query(
      collection(db, 'guardian_students'),
      where('studentId', '==', studentId),
      where('active', '==', true)
    );

    const snapshot = await getDocs(q);
    const guardians = [];

    // Obtener datos completos de cada tutor
    for (const relationDoc of snapshot.docs) {
      const relation = relationDoc.data();
      const guardianDoc = await getDoc(doc(db, 'guardians', relation.guardianId));

      if (guardianDoc.exists()) {
        guardians.push({
          relationId: relationDoc.id,
          ...relation,
          guardianData: {
            id: guardianDoc.id,
            ...guardianDoc.data()
          }
        });
      }
    }

    logger.info('Student guardians loaded', { studentId, count: guardians.length });
    return guardians;
  } catch (error) {
    // Si es un error de permisos, loguear en info en vez de error
    if (error.code === 'permission-denied') {
      logger.info('Guardian permissions not configured - returning empty list', { studentId });
    } else {
      logger.error('Error getting student guardians', error);
    }
    return [];
  }
}

/**
 * Actualiza permisos de un tutor para un estudiante
 */
export async function updateGuardianPermissions(relationId, permissions) {
  try {
    logger.info('Updating guardian permissions', { relationId });

    await updateDoc(doc(db, 'guardian_students', relationId), {
      ...permissions,
      updatedAt: Timestamp.now()
    });

    logger.info('Guardian permissions updated successfully');
    return { success: true };
  } catch (error) {
    logger.error('Error updating guardian permissions', error);
    return { success: false, error: error.message };
  }
}

/**
 * Desvincula un tutor de un estudiante (soft delete)
 */
export async function unlinkGuardianFromStudent(relationId) {
  try {
    logger.info('Unlinking guardian from student', { relationId });

    await updateDoc(doc(db, 'guardian_students', relationId), {
      active: false,
      deactivatedAt: Timestamp.now()
    });

    logger.info('Guardian unlinked successfully');
    return { success: true };
  } catch (error) {
    logger.error('Error unlinking guardian', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene resumen de desempeño de un estudiante
 * (Para mostrar en el dashboard del tutor)
 */
export async function getStudentPerformanceSummary(studentId) {
  try {
    const docRef = doc(db, 'student_performance_summary', studentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Si no existe summary, calcularlo on-demand
      return await calculateStudentPerformanceSummary(studentId);
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    logger.error('Error getting student performance summary', error);
    return null;
  }
}

/**
 * Calcula resumen de desempeño en tiempo real
 * (Llamado si no existe caché)
 */
async function calculateStudentPerformanceSummary(studentId) {
  try {
    logger.info('Calculating student performance summary', { studentId });

    // TODO: Implementar cálculos reales basados en:
    // - submissions (tareas)
    // - attendance (asistencia)
    // - gamification (XP, badges)
    // - behavior_notes (comportamiento)

    // Por ahora retornamos estructura vacía
    return {
      studentId,
      averageGrade: 0,
      totalAssignments: 0,
      completedAssignments: 0,
      pendingAssignments: 0,
      attendanceRate: 0,
      totalXP: 0,
      level: 1,
      badges: 0,
      lastUpdated: Timestamp.now()
    };
  } catch (error) {
    logger.error('Error calculating performance summary', error);
    return null;
  }
}

/**
 * Actualiza resumen de desempeño de un estudiante
 * (Debe llamarse después de eventos importantes: nueva calificación, asistencia, etc.)
 */
export async function updateStudentPerformanceSummary(studentId, data) {
  try {
    const docRef = doc(db, 'student_performance_summary', studentId);

    await updateDoc(docRef, {
      ...data,
      lastUpdated: Timestamp.now()
    });

    logger.info('Performance summary updated', { studentId });
    return { success: true };
  } catch (error) {
    // Si no existe, crearlo
    if (error.code === 'not-found') {
      await setDoc(docRef, {
        studentId,
        ...data,
        lastUpdated: Timestamp.now()
      });
      return { success: true };
    }

    logger.error('Error updating performance summary', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía invitación a un tutor por email
 * (Para futuro: sistema de invitaciones)
 */
export async function inviteGuardian({ email, studentId, studentName, invitedBy }) {
  try {
    logger.info('Creating guardian invitation', { email, studentId });

    await addDoc(collection(db, 'guardian_invitations'), {
      email,
      studentId,
      studentName,
      invitedBy,
      status: 'pending',
      invitedAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 días
    });

    // TODO: Enviar email con link de invitación

    logger.info('Guardian invitation created');
    return { success: true };
  } catch (error) {
    logger.error('Error creating guardian invitation', error);
    return { success: false, error: error.message };
  }
}
