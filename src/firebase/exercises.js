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

// Crear nuevo ejercicio
export async function createExercise(exerciseData) {
  try {
    const exercisesRef = collection(db, 'exercises');
    const docRef = await addDoc(exercisesRef, {
      ...exerciseData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al crear ejercicio:', error);
    return { success: false, error: error.message };
  }
}

// Obtener todos los ejercicios
export async function getAllExercises() {
  try {
    const exercisesRef = collection(db, 'exercises');
    const q = query(exercisesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener ejercicios:', error);
    return [];
  }
}

// Obtener ejercicios por profesor
export async function getExercisesByTeacher(teacherId) {
  try {
    const exercisesRef = collection(db, 'exercises');
    // Query simple sin orderBy para evitar índice compuesto
    const q = query(
      exercisesRef,
      where('createdBy', '==', teacherId)
    );
    const snapshot = await getDocs(q);

    // Ordenar en el cliente
    const exercises = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar por createdAt descendente
    exercises.sort((a, b) => {
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
      return dateB - dateA;
    });

    return exercises;
  } catch (error) {
    console.error('Error al obtener ejercicios del profesor:', error);
    return [];
  }
}

// Obtener un ejercicio por ID
export async function getExerciseById(exerciseId) {
  try {
    const docRef = doc(db, 'exercises', exerciseId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error al obtener ejercicio:', error);
    return null;
  }
}

// Actualizar ejercicio
export async function updateExercise(exerciseId, updates) {
  try {
    const docRef = doc(db, 'exercises', exerciseId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar ejercicio:', error);
    return { success: false, error: error.message };
  }
}

// Eliminar ejercicio
export async function deleteExercise(exerciseId) {
  try {
    const docRef = doc(db, 'exercises', exerciseId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar ejercicio:', error);
    return { success: false, error: error.message };
  }
}

// Buscar ejercicios por categoría
export async function getExercisesByCategory(category) {
  try {
    const exercisesRef = collection(db, 'exercises');
    // Query simple sin orderBy para evitar índice compuesto
    const q = query(
      exercisesRef,
      where('category', '==', category)
    );
    const snapshot = await getDocs(q);

    // Ordenar en el cliente
    const exercises = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar por createdAt descendente
    exercises.sort((a, b) => {
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
      return dateB - dateA;
    });

    return exercises;
  } catch (error) {
    console.error('Error al buscar ejercicios por categoría:', error);
    return [];
  }
}
