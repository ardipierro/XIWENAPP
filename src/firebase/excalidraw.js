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
import { db, auth } from './config';

const COLLECTION_NAME = 'excalidraw_sessions';

/**
 * Crear una nueva sesión de Excalidraw
 */
export async function createExcalidrawSession(title, elements = [], appState = {}) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const sessionData = {
      title: title || 'Pizarra sin título',
      teacherId: user.uid,
      teacherEmail: user.email,
      elements: elements, // Array de elementos de Excalidraw
      appState: appState, // Estado de la app de Excalidraw
      files: {}, // Archivos/imágenes de Excalidraw
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), sessionData);
    console.log('✅ Sesión de Excalidraw creada:', docRef.id);

    return docRef.id;
  } catch (error) {
    console.error('❌ Error creando sesión de Excalidraw:', error);
    throw error;
  }
}

/**
 * Obtener todas las sesiones de un profesor
 */
export async function getExcalidrawSessionsByTeacher(teacherId) {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('teacherId', '==', teacherId)
      // NOTA: orderBy requiere índice en Firestore, ordenamos en cliente
    );

    const snapshot = await getDocs(q);
    const sessions = [];

    snapshot.forEach((doc) => {
      sessions.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      });
    });

    // Ordenar en cliente por updatedAt desc
    sessions.sort((a, b) => b.updatedAt - a.updatedAt);

    console.log(`✅ ${sessions.length} sesiones de Excalidraw cargadas`);
    return sessions;
  } catch (error) {
    console.error('❌ Error obteniendo sesiones de Excalidraw:', error);
    throw error;
  }
}

/**
 * Obtener una sesión específica por ID
 */
export async function getExcalidrawSessionById(sessionId) {
  try {
    const docRef = doc(db, COLLECTION_NAME, sessionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Sesión no encontrada');
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(),
    };
  } catch (error) {
    console.error('❌ Error obteniendo sesión de Excalidraw:', error);
    throw error;
  }
}

/**
 * Actualizar una sesión de Excalidraw
 */
export async function updateExcalidrawSession(sessionId, updates) {
  try {
    const docRef = doc(db, COLLECTION_NAME, sessionId);

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(docRef, updateData);
    console.log('✅ Sesión de Excalidraw actualizada:', sessionId);
  } catch (error) {
    console.error('❌ Error actualizando sesión de Excalidraw:', error);
    throw error;
  }
}

/**
 * Guardar el contenido completo de la sesión (elementos + estado)
 */
export async function saveExcalidrawContent(sessionId, elements, appState, files = {}) {
  try {
    await updateExcalidrawSession(sessionId, {
      elements,
      appState,
      files,
    });
    console.log('✅ Contenido de Excalidraw guardado');
  } catch (error) {
    console.error('❌ Error guardando contenido de Excalidraw:', error);
    throw error;
  }
}

/**
 * Eliminar una sesión de Excalidraw
 */
export async function deleteExcalidrawSession(sessionId) {
  try {
    const docRef = doc(db, COLLECTION_NAME, sessionId);
    await deleteDoc(docRef);
    console.log('✅ Sesión de Excalidraw eliminada:', sessionId);
  } catch (error) {
    console.error('❌ Error eliminando sesión de Excalidraw:', error);
    throw error;
  }
}

/**
 * Duplicar una sesión de Excalidraw
 */
export async function duplicateExcalidrawSession(sessionId) {
  try {
    const session = await getExcalidrawSessionById(sessionId);

    const newTitle = `${session.title} (copia)`;
    const newSessionId = await createExcalidrawSession(
      newTitle,
      session.elements,
      session.appState
    );

    console.log('✅ Sesión de Excalidraw duplicada');
    return newSessionId;
  } catch (error) {
    console.error('❌ Error duplicando sesión de Excalidraw:', error);
    throw error;
  }
}
