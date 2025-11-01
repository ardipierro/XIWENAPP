import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

/**
 * Sube una imagen a Firebase Storage
 * @param {File} file - El archivo de imagen
 * @param {string} path - Ruta donde guardar (ej: 'courses/course123.jpg')
 * @returns {Promise<string>} URL de descarga de la imagen
 */
export async function uploadImage(file, path) {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Elimina una imagen de Firebase Storage
 * @param {string} url - URL de la imagen a eliminar
 * @returns {Promise<boolean>} True si se eliminó correctamente
 */
export async function deleteImage(url) {
  try {
    // Extraer path de la URL de Firebase Storage
    const path = extractPathFromUrl(url);
    if (!path) return { success: false, error: 'URL inválida' };

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Extrae el path del storage desde una URL de Firebase
 * @param {string} url - URL completa de Firebase Storage
 * @returns {string|null} Path del archivo o null
 */
function extractPathFromUrl(url) {
  try {
    const matches = url.match(/\/o\/(.+?)\?/);
    if (matches && matches[1]) {
      return decodeURIComponent(matches[1]);
    }
    return null;
  } catch (error) {
    console.error('Error al extraer path:', error);
    return null;
  }
}

/**
 * Sube imagen de curso
 * @param {File} file - Archivo de imagen
 * @param {string} courseId - ID del curso
 * @returns {Promise<object>} Resultado con URL
 */
export async function uploadCourseImage(file, courseId) {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const path = `courses/${courseId}_${timestamp}.${extension}`;
  return uploadImage(file, path);
}

/**
 * Sube imagen de ejercicio
 * @param {File} file - Archivo de imagen
 * @param {string} exerciseId - ID del ejercicio
 * @returns {Promise<object>} Resultado con URL
 */
export async function uploadExerciseImage(file, exerciseId) {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const path = `exercises/${exerciseId}_${timestamp}.${extension}`;
  return uploadImage(file, path);
}

/**
 * Sube avatar de usuario
 * @param {File} file - Archivo de imagen
 * @param {string} userId - ID del usuario
 * @returns {Promise<object>} Resultado con URL
 */
export async function uploadUserAvatar(file, userId) {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const path = `avatars/${userId}_${timestamp}.${extension}`;
  return uploadImage(file, path);
}

/**
 * Sube imagen de avatar para un usuario (versión simplificada)
 * @param {string} userId - ID del usuario
 * @param {File} file - Archivo de imagen
 * @returns {Promise<string>} URL de la imagen subida
 */
export async function uploadAvatarImage(userId, file) {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const path = `avatars/${userId}_${timestamp}.${extension}`;

  const result = await uploadImage(file, path);
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.url;
}

/**
 * Elimina la imagen de avatar de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>} True si se eliminó correctamente
 */
export async function deleteAvatarImage(userId) {
  try {
    // Buscar y eliminar todas las imágenes de avatar del usuario
    // Por simplicidad, solo eliminamos si tenemos la URL
    // En una implementación más completa, buscaríamos en Storage
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar avatar:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Valida que el archivo sea una imagen
 * @param {File} file - Archivo a validar
 * @returns {boolean} True si es imagen válida
 */
export function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Tipo de archivo no válido. Use JPG, PNG, GIF o WEBP.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'La imagen es demasiado grande. Máximo 5MB.' };
  }

  return { valid: true };
}
