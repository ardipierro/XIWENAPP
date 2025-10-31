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

// Crear nuevo contenido
export async function createContent(contentData) {
  try {
    const contentRef = collection(db, 'content');
    const docRef = await addDoc(contentRef, {
      ...contentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al crear contenido:', error);
    return { success: false, error: error.message };
  }
}

// Obtener todo el contenido
export async function getAllContent() {
  try {
    const contentRef = collection(db, 'content');
    const q = query(contentRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener contenido:', error);
    return [];
  }
}

// Obtener contenido por profesor
export async function getContentByTeacher(teacherId) {
  try {
    const contentRef = collection(db, 'content');
    const q = query(
      contentRef,
      where('createdBy', '==', teacherId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener contenido del profesor:', error);
    return [];
  }
}

// Obtener contenido por curso
export async function getContentByCourse(courseId) {
  try {
    const contentRef = collection(db, 'content');
    const q = query(
      contentRef,
      where('courseId', '==', courseId),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener contenido del curso:', error);
    return [];
  }
}

// Obtener un contenido por ID
export async function getContentById(contentId) {
  try {
    const docRef = doc(db, 'content', contentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error al obtener contenido:', error);
    return null;
  }
}

// Actualizar contenido
export async function updateContent(contentId, updates) {
  try {
    const docRef = doc(db, 'content', contentId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar contenido:', error);
    return { success: false, error: error.message };
  }
}

// Eliminar contenido
export async function deleteContent(contentId) {
  try {
    const docRef = doc(db, 'content', contentId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar contenido:', error);
    return { success: false, error: error.message };
  }
}
