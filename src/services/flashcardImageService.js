/**
 * @fileoverview FlashCard Image Service - Upload de imágenes a Firebase Storage
 * @module services/flashcardImageService
 */

import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import logger from '../utils/logger';

/**
 * Subir imagen de flashcard a Firebase Storage
 * @param {File} file - Archivo de imagen
 * @param {string} collectionId - ID de la colección
 * @param {string} cardId - ID de la tarjeta
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadFlashCardImage(file, collectionId, cardId) {
  try {
    // Validación
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('La imagen no puede superar los 5MB');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Formato de imagen no soportado. Usa JPG, PNG, WEBP o GIF');
    }

    // Crear referencia única
    const timestamp = Date.now();
    const filename = `flashcards/${collectionId}/${cardId}_${timestamp}.${getFileExtension(file.name)}`;
    const storageRef = ref(storage, filename);

    // Upload
    logger.info('Uploading flashcard image:', filename);
    const snapshot = await uploadBytes(storageRef, file);

    // Obtener URL
    const url = await getDownloadURL(snapshot.ref);

    logger.info('Flashcard image uploaded successfully:', url);
    return { success: true, url };

  } catch (error) {
    logger.error('Error uploading flashcard image:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar imagen de flashcard
 * @param {string} imageUrl - URL de la imagen a eliminar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFlashCardImage(imageUrl) {
  try {
    if (!imageUrl || !imageUrl.includes('firebase')) {
      return { success: true }; // No es una imagen de Firebase
    }

    // Extraer path de la URL
    const path = extractPathFromUrl(imageUrl);
    if (!path) {
      throw new Error('URL de imagen inválida');
    }

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);

    logger.info('Flashcard image deleted:', path);
    return { success: true };

  } catch (error) {
    logger.error('Error deleting flashcard image:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Subir imagen de portada de colección
 * @param {File} file - Archivo de imagen
 * @param {string} collectionId - ID de la colección
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadCollectionCoverImage(file, collectionId) {
  try {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('La imagen no puede superar los 5MB');
    }

    const timestamp = Date.now();
    const filename = `flashcards/${collectionId}/cover_${timestamp}.${getFileExtension(file.name)}`;
    const storageRef = ref(storage, filename);

    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    logger.info('Collection cover image uploaded:', url);
    return { success: true, url };

  } catch (error) {
    logger.error('Error uploading cover image:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Comprimir imagen antes de subir
 * @param {File} file - Archivo original
 * @param {number} maxWidth - Ancho máximo
 * @param {number} quality - Calidad (0-1)
 * @returns {Promise<Blob>}
 */
export async function compressImage(file, maxWidth = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular nuevo tamaño
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper functions
function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

function extractPathFromUrl(url) {
  try {
    // Firebase Storage URL format:
    // https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const match = url.match(/\/o\/(.+?)\?/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    return null;
  } catch (error) {
    return null;
  }
}

export default {
  uploadFlashCardImage,
  deleteFlashCardImage,
  uploadCollectionCoverImage,
  compressImage
};
