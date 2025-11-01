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

// ============================================
// COURSE-CONTENT RELATIONSHIPS (Many-to-Many)
// ============================================

/**
 * Agregar contenido a un curso
 */
export async function addContentToCourse(courseId, contentId, order = 0) {
  try {
    // Verificar si ya existe la relación
    const q = query(
      collection(db, 'course_content'),
      where('courseId', '==', courseId),
      where('contentId', '==', contentId)
    );
    const existing = await getDocs(q);

    if (!existing.empty) {
      console.log('El contenido ya está en el curso');
      return { success: true, id: existing.docs[0].id };
    }

    const docRef = await addDoc(collection(db, 'course_content'), {
      courseId,
      contentId,
      order,
      addedAt: serverTimestamp()
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error agregando contenido al curso:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remover contenido de un curso
 */
export async function removeContentFromCourse(courseId, contentId) {
  try {
    const q = query(
      collection(db, 'course_content'),
      where('courseId', '==', courseId),
      where('contentId', '==', contentId)
    );
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error removiendo contenido del curso:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener todos los contenidos de un curso
 */
export async function getCourseContents(courseId) {
  try {
    const q = query(
      collection(db, 'course_content'),
      where('courseId', '==', courseId)
    );
    const snapshot = await getDocs(q);

    const contentIds = snapshot.docs.map(doc => ({
      relationId: doc.id,
      contentId: doc.data().contentId,
      order: doc.data().order || 0
    }));

    // Obtener detalles de cada contenido
    const contents = [];
    for (const item of contentIds) {
      const contentDoc = await getDoc(doc(db, 'content', item.contentId));
      if (contentDoc.exists()) {
        contents.push({
          id: contentDoc.id,
          ...contentDoc.data(),
          relationId: item.relationId,
          order: item.order
        });
      }
    }

    // Ordenar por order
    contents.sort((a, b) => (a.order || 0) - (b.order || 0));

    return contents;
  } catch (error) {
    console.error('Error obteniendo contenidos del curso:', error);
    return [];
  }
}

/**
 * Obtener cursos que contienen un contenido
 */
export async function getCoursesWithContent(contentId) {
  try {
    const q = query(
      collection(db, 'course_content'),
      where('contentId', '==', contentId)
    );
    const snapshot = await getDocs(q);

    const courseIds = snapshot.docs.map(doc => doc.data().courseId);

    // Obtener detalles de cada curso
    const courses = [];
    for (const courseId of courseIds) {
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (courseDoc.exists()) {
        courses.push({
          id: courseDoc.id,
          ...courseDoc.data()
        });
      }
    }

    return courses;
  } catch (error) {
    console.error('Error obteniendo cursos del contenido:', error);
    return [];
  }
}

// ============================================
// COURSE-EXERCISES RELATIONSHIPS (Many-to-Many)
// ============================================

/**
 * Agregar ejercicio a un curso
 */
export async function addExerciseToCourse(courseId, exerciseId, order = 0) {
  try {
    // Verificar si ya existe la relación
    const q = query(
      collection(db, 'course_exercises'),
      where('courseId', '==', courseId),
      where('exerciseId', '==', exerciseId)
    );
    const existing = await getDocs(q);

    if (!existing.empty) {
      console.log('El ejercicio ya está en el curso');
      return { success: true, id: existing.docs[0].id };
    }

    const docRef = await addDoc(collection(db, 'course_exercises'), {
      courseId,
      exerciseId,
      order,
      addedAt: serverTimestamp()
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error agregando ejercicio al curso:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remover ejercicio de un curso
 */
export async function removeExerciseFromCourse(courseId, exerciseId) {
  try {
    const q = query(
      collection(db, 'course_exercises'),
      where('courseId', '==', courseId),
      where('exerciseId', '==', exerciseId)
    );
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error removiendo ejercicio del curso:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener todos los ejercicios de un curso
 */
export async function getCourseExercises(courseId) {
  try {
    const q = query(
      collection(db, 'course_exercises'),
      where('courseId', '==', courseId)
    );
    const snapshot = await getDocs(q);

    const exerciseIds = snapshot.docs.map(doc => ({
      relationId: doc.id,
      exerciseId: doc.data().exerciseId,
      order: doc.data().order || 0
    }));

    // Obtener detalles de cada ejercicio
    const exercises = [];
    for (const item of exerciseIds) {
      const exerciseDoc = await getDoc(doc(db, 'exercises', item.exerciseId));
      if (exerciseDoc.exists()) {
        exercises.push({
          id: exerciseDoc.id,
          ...exerciseDoc.data(),
          relationId: item.relationId,
          order: item.order
        });
      }
    }

    // Ordenar por order
    exercises.sort((a, b) => (a.order || 0) - (b.order || 0));

    return exercises;
  } catch (error) {
    console.error('Error obteniendo ejercicios del curso:', error);
    return [];
  }
}

/**
 * Obtener cursos que contienen un ejercicio
 */
export async function getCoursesWithExercise(exerciseId) {
  try {
    const q = query(
      collection(db, 'course_exercises'),
      where('exerciseId', '==', exerciseId)
    );
    const snapshot = await getDocs(q);

    const courseIds = snapshot.docs.map(doc => doc.data().courseId);

    // Obtener detalles de cada curso
    const courses = [];
    for (const courseId of courseIds) {
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (courseDoc.exists()) {
        courses.push({
          id: courseDoc.id,
          ...courseDoc.data()
        });
      }
    }

    return courses;
  } catch (error) {
    console.error('Error obteniendo cursos del ejercicio:', error);
    return [];
  }
}

// ============================================
// STUDENT ASSIGNMENTS (Direct assignments)
// ============================================

/**
 * Asignar recurso directamente a un estudiante
 */
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
      console.log('El recurso ya está asignado al estudiante');
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
    console.error('Error asignando recurso al estudiante:', error);
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
    console.error('Error removiendo asignación del estudiante:', error);
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
            console.error(`Error cargando content ${data.itemId}:`, err);
          }
        } else if (data.itemType === 'exercise' && data.itemId) {
          try {
            const exerciseDoc = await getDoc(doc(db, 'exercises', data.itemId));
            if (exerciseDoc.exists()) {
              itemDetails = exerciseDoc.data();
            }
          } catch (err) {
            console.error(`Error cargando exercise ${data.itemId}:`, err);
          }
        } else if (data.itemType === 'course' && data.itemId) {
          try {
            const courseDoc = await getDoc(doc(db, 'courses', data.itemId));
            if (courseDoc.exists()) {
              itemDetails = courseDoc.data();
            }
          } catch (err) {
            console.error(`Error cargando course ${data.itemId}:`, err);
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
    console.error('Error obteniendo asignaciones del estudiante:', error);
    return [];
  }
}

// ============================================
// GROUP ASSIGNMENTS
// ============================================

/**
 * Asignar recurso a un grupo
 */
export async function assignToGroup(groupId, itemType, itemId) {
  try {
    // Verificar si ya existe
    const q = query(
      collection(db, 'group_assignments'),
      where('groupId', '==', groupId),
      where('itemType', '==', itemType),
      where('itemId', '==', itemId)
    );
    const existing = await getDocs(q);

    if (!existing.empty) {
      console.log('El recurso ya está asignado al grupo');
      return { success: true, id: existing.docs[0].id };
    }

    const docRef = await addDoc(collection(db, 'group_assignments'), {
      groupId,
      itemType, // 'content', 'exercise', 'course'
      itemId,
      assignedAt: serverTimestamp()
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error asignando recurso al grupo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remover asignación de grupo
 */
export async function removeFromGroup(groupId, itemType, itemId) {
  try {
    const q = query(
      collection(db, 'group_assignments'),
      where('groupId', '==', groupId),
      where('itemType', '==', itemType),
      where('itemId', '==', itemId)
    );
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error removiendo asignación del grupo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener todos los recursos asignados a un grupo
 */
export async function getGroupAssignments(groupId) {
  try {
    const q = query(
      collection(db, 'group_assignments'),
      where('groupId', '==', groupId)
    );
    const snapshot = await getDocs(q);

    const assignments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return assignments;
  } catch (error) {
    console.error('Error obteniendo asignaciones del grupo:', error);
    return [];
  }
}

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Actualizar cursos de un contenido (reemplaza todos)
 */
export async function updateContentCourses(contentId, courseIds) {
  try {
    // Remover relaciones existentes
    const q = query(
      collection(db, 'course_content'),
      where('contentId', '==', contentId)
    );
    const existing = await getDocs(q);

    const batch = writeBatch(db);
    existing.docs.forEach(doc => batch.delete(doc.ref));

    // Agregar nuevas relaciones
    for (let i = 0; i < courseIds.length; i++) {
      const newRef = doc(collection(db, 'course_content'));
      batch.set(newRef, {
        courseId: courseIds[i],
        contentId,
        order: 0,
        addedAt: serverTimestamp()
      });
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error actualizando cursos del contenido:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar cursos de un ejercicio (reemplaza todos)
 */
export async function updateExerciseCourses(exerciseId, courseIds) {
  try {
    // Remover relaciones existentes
    const q = query(
      collection(db, 'course_exercises'),
      where('exerciseId', '==', exerciseId)
    );
    const existing = await getDocs(q);

    const batch = writeBatch(db);
    existing.docs.forEach(doc => batch.delete(doc.ref));

    // Agregar nuevas relaciones
    for (let i = 0; i < courseIds.length; i++) {
      const newRef = doc(collection(db, 'course_exercises'));
      batch.set(newRef, {
        courseId: courseIds[i],
        exerciseId,
        order: 0,
        addedAt: serverTimestamp()
      });
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error actualizando cursos del ejercicio:', error);
    return { success: false, error: error.message };
  }
}
