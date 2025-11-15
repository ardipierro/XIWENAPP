/**
 * @fileoverview Firebase FlashCards Repository
 * Gestión de colecciones de flashcards
 * @module firebase/flashcards
 */

import { db } from './config';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import logger from '../utils/logger';

// Colección principal
const COLLECTION_NAME = 'flashcard_collections';

/**
 * Estructura de una colección de flashcards:
 * {
 *   id: string,
 *   name: string,
 *   description: string,
 *   level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
 *   category: 'vocabulary' | 'expressions' | 'idioms' | 'phrases',
 *   cards: [
 *     {
 *       id: string,
 *       spanish: string,
 *       translation: string,
 *       hint: string,
 *       context: string,
 *       imageUrl: string,
 *       audioUrl: string,
 *       difficulty: 1 | 2 | 3
 *     }
 *   ],
 *   cardCount: number,
 *   imageUrl: string (URL de imagen de portada),
 *   createdBy: string (userId),
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp
 * }
 */

/**
 * Crear una nueva colección de flashcards
 * @param {Object} collectionData - Datos de la colección
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function createFlashCardCollection(collectionData) {
  try {
    const collectionRef = collection(db, COLLECTION_NAME);

    const data = {
      ...collectionData,
      cardCount: collectionData.cards?.length || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collectionRef, data);

    logger.info('FlashCard collection created:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('Error creating flashcard collection:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener todas las colecciones de flashcards
 * @returns {Promise<Array>}
 */
export async function getAllFlashCardCollections() {
  try {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const collections = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    logger.info(`Loaded ${collections.length} flashcard collections`);
    return collections;
  } catch (error) {
    logger.error('Error getting flashcard collections:', error);
    return [];
  }
}

/**
 * Obtener colecciones de un profesor específico
 * @param {string} teacherId - ID del profesor
 * @returns {Promise<Array>}
 */
export async function getFlashCardCollectionsByTeacher(teacherId) {
  try {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(
      collectionRef,
      where('createdBy', '==', teacherId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    const collections = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    logger.info(`Loaded ${collections.length} flashcard collections for teacher ${teacherId}`);
    return collections;
  } catch (error) {
    logger.error('Error getting flashcard collections by teacher:', error);
    return [];
  }
}

/**
 * Obtener una colección por ID
 * @param {string} collectionId - ID de la colección
 * @returns {Promise<Object|null>}
 */
export async function getFlashCardCollectionById(collectionId) {
  try {
    const docRef = doc(db, COLLECTION_NAME, collectionId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }

    return null;
  } catch (error) {
    logger.error('Error getting flashcard collection:', error);
    return null;
  }
}

/**
 * Actualizar una colección de flashcards
 * @param {string} collectionId - ID de la colección
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateFlashCardCollection(collectionId, updates) {
  try {
    const docRef = doc(db, COLLECTION_NAME, collectionId);

    const data = {
      ...updates,
      cardCount: updates.cards?.length || updates.cardCount,
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, data);

    logger.info('FlashCard collection updated:', collectionId);
    return { success: true };
  } catch (error) {
    logger.error('Error updating flashcard collection:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar una colección de flashcards
 * @param {string} collectionId - ID de la colección
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFlashCardCollection(collectionId) {
  try {
    const docRef = doc(db, COLLECTION_NAME, collectionId);
    await deleteDoc(docRef);

    logger.info('FlashCard collection deleted:', collectionId);
    return { success: true };
  } catch (error) {
    logger.error('Error deleting flashcard collection:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener colecciones por nivel CEFR
 * @param {string} level - Nivel CEFR (A1, A2, B1, B2, C1, C2)
 * @returns {Promise<Array>}
 */
export async function getFlashCardCollectionsByLevel(level) {
  try {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(
      collectionRef,
      where('level', '==', level),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    const collections = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return collections;
  } catch (error) {
    logger.error('Error getting flashcard collections by level:', error);
    return [];
  }
}

/**
 * Obtener colecciones por categoría
 * @param {string} category - Categoría (vocabulary, expressions, idioms, phrases)
 * @returns {Promise<Array>}
 */
export async function getFlashCardCollectionsByCategory(category) {
  try {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(
      collectionRef,
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    const collections = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return collections;
  } catch (error) {
    logger.error('Error getting flashcard collections by category:', error);
    return [];
  }
}

// Exportar todo
export default {
  createFlashCardCollection,
  getAllFlashCardCollections,
  getFlashCardCollectionsByTeacher,
  getFlashCardCollectionById,
  updateFlashCardCollection,
  deleteFlashCardCollection,
  getFlashCardCollectionsByLevel,
  getFlashCardCollectionsByCategory
};
