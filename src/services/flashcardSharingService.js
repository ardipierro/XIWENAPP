/**
 * @fileoverview FlashCard Sharing Service - Compartir colecciones entre teachers
 * @module services/flashcardSharingService
 */

import { firestore } from '../firebase/config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { createFlashCardCollection } from '../firebase/flashcards';
import logger from '../utils/logger';

/**
 * Compartir colección con otro teacher
 * @param {string} collectionId - ID de la colección
 * @param {string} teacherEmail - Email del teacher receptor
 * @param {Object} sharedBy - Usuario que comparte
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function shareCollection(collectionId, teacherEmail, sharedBy) {
  try {
    // Verificar que el teacher receptor existe
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('email', '==', teacherEmail));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('No se encontró un usuario con ese email');
    }

    const recipientDoc = snapshot.docs[0];
    const recipient = recipientDoc.data();

    // Verificar que es teacher
    if (recipient.role !== 'teacher' && recipient.role !== 'admin') {
      throw new Error('Solo se puede compartir con otros profesores');
    }

    // Crear registro de compartición
    const shareRef = doc(firestore, 'flashcard_shares', `${collectionId}_${recipientDoc.id}`);

    await setDoc(shareRef, {
      collectionId,
      sharedBy: {
        uid: sharedBy.uid,
        name: sharedBy.name || sharedBy.email,
        email: sharedBy.email
      },
      sharedWith: {
        uid: recipientDoc.id,
        name: recipient.name || recipient.email,
        email: recipient.email
      },
      sharedAt: Timestamp.now(),
      status: 'pending' // 'pending' | 'accepted' | 'declined'
    });

    logger.info('Collection shared successfully:', {
      collectionId,
      to: teacherEmail
    });

    return { success: true };

  } catch (error) {
    logger.error('Error sharing collection:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener colecciones compartidas conmigo
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>}
 */
export async function getSharedCollections(userId) {
  try {
    const sharesRef = collection(firestore, 'flashcard_shares');
    const q = query(
      sharesRef,
      where('sharedWith.uid', '==', userId),
      where('status', '==', 'accepted')
    );

    const snapshot = await getDocs(q);
    const collections = [];

    for (const doc of snapshot.docs) {
      const shareData = doc.data();
      collections.push({
        id: shareData.collectionId,
        sharedBy: shareData.sharedBy,
        sharedAt: shareData.sharedAt?.toDate(),
        isShared: true
      });
    }

    return collections;

  } catch (error) {
    logger.error('Error getting shared collections:', error);
    return [];
  }
}

/**
 * Obtener invitaciones pendientes
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>}
 */
export async function getPendingInvitations(userId) {
  try {
    const sharesRef = collection(firestore, 'flashcard_shares');
    const q = query(
      sharesRef,
      where('sharedWith.uid', '==', userId),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      sharedAt: doc.data().sharedAt?.toDate()
    }));

  } catch (error) {
    logger.error('Error getting pending invitations:', error);
    return [];
  }
}

/**
 * Aceptar invitación de colección compartida
 * @param {string} shareId - ID del share
 * @returns {Promise<{success: boolean}>}
 */
export async function acceptShare(shareId) {
  try {
    const shareRef = doc(firestore, 'flashcard_shares', shareId);
    await updateDoc(shareRef, {
      status: 'accepted',
      acceptedAt: Timestamp.now()
    });

    logger.info('Share accepted:', shareId);
    return { success: true };

  } catch (error) {
    logger.error('Error accepting share:', error);
    return { success: false };
  }
}

/**
 * Rechazar invitación
 * @param {string} shareId - ID del share
 * @returns {Promise<{success: boolean}>}
 */
export async function declineShare(shareId) {
  try {
    const shareRef = doc(firestore, 'flashcard_shares', shareId);
    await deleteDoc(shareRef);

    logger.info('Share declined:', shareId);
    return { success: true };

  } catch (error) {
    logger.error('Error declining share:', error);
    return { success: false };
  }
}

/**
 * Duplicar colección compartida a mi biblioteca
 * @param {string} collectionId - ID de la colección original
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, id?: string}>}
 */
export async function duplicateSharedCollection(collectionId, userId) {
  try {
    // Obtener colección original
    const collectionRef = doc(firestore, 'flashcard_collections', collectionId);
    const collectionDoc = await getDoc(collectionRef);

    if (!collectionDoc.exists()) {
      throw new Error('Colección no encontrada');
    }

    const originalData = collectionDoc.data();

    // Crear copia
    const newData = {
      ...originalData,
      name: `${originalData.name} (copia)`,
      createdBy: userId,
      originalCollection: collectionId,
      isDuplicate: true
    };

    const result = await createFlashCardCollection(newData);

    if (!result.success) {
      throw new Error(result.error);
    }

    logger.info('Collection duplicated:', result.id);
    return { success: true, id: result.id };

  } catch (error) {
    logger.error('Error duplicating collection:', error);
    return { success: false, error: error.message };
  }
}

export default {
  shareCollection,
  getSharedCollections,
  getPendingInvitations,
  acceptShare,
  declineShare,
  duplicateSharedCollection
};
