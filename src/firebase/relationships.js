import logger from '../utils/logger';

import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';

export async function assignToStudent(studentId, itemType, itemId, assignedBy) {
  try {
    // Verificar si ya existe
    const q = query(
      collection(db, 'student_assignments'),
      where('studentId', '==', studentId),
      where('itemType', '==', itemType),
      where('itemId', '==', itemId)
    );
    const existing = await getDocs(q);

    if (!existing.empty) {
      logger.debug('El recurso ya está asignado al estudiante');
      return { success: true, id: existing.docs[0].id };
    }

    const docRef = await addDoc(collection(db, 'student_assignments'), {
      studentId,
      itemType, // 'content', 'exercise', 'course'
      itemId,
      assignedBy,
      assignedAt: serverTimestamp()
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('Error asignando recurso al estudiante:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remover asignación directa de estudiante
 */
export async function removeFromStudent(studentId, itemType, itemId) {
  try {
    const q = query(
      collection(db, 'student_assignments'),
      where('studentId', '==', studentId),
      where('itemType', '==', itemType),
      where('itemId', '==', itemId)
    );
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    return { success: true };
  } catch (error) {
    logger.error('Error removiendo asignación del estudiante:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener todos los recursos asignados a un estudiante
 * Incluye los detalles del item (content o exercise)
 */
export async function getStudentAssignments(studentId) {
  try {
    const q = query(
      collection(db, 'student_assignments'),
      where('studentId', '==', studentId)
    );
    const snapshot = await getDocs(q);

    const assignments = await Promise.all(
      snapshot.docs.map(async (assignmentDoc) => {
        const data = assignmentDoc.data();
        let itemDetails = null;

        // Obtener detalles del item según su tipo
        if (data.itemType === 'content' && data.itemId) {
          try {
            const contentDoc = await getDoc(doc(db, 'content', data.itemId));
            if (contentDoc.exists()) {
              itemDetails = contentDoc.data();
            }
          } catch (err) {
            logger.error(`Error cargando content ${data.itemId}:`, err);
          }
        } else if (data.itemType === 'exercise' && data.itemId) {
          try {
            const exerciseDoc = await getDoc(doc(db, 'exercises', data.itemId));
            if (exerciseDoc.exists()) {
              itemDetails = exerciseDoc.data();
            }
          } catch (err) {
            logger.error(`Error cargando exercise ${data.itemId}:`, err);
          }
        } else if (data.itemType === 'course' && data.itemId) {
          try {
            const courseDoc = await getDoc(doc(db, 'courses', data.itemId));
            if (courseDoc.exists()) {
              itemDetails = courseDoc.data();
            }
          } catch (err) {
            logger.error(`Error cargando course ${data.itemId}:`, err);
          }
        }

        return {
          id: assignmentDoc.id,
          ...data,
          itemDetails
        };
      })
    );

    return assignments;
  } catch (error) {
    logger.error('Error obteniendo asignaciones del estudiante:', error);
    return [];
  }
}

