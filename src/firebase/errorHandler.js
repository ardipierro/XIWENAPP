/**
 * @fileoverview Manejo centralizado de errores de Firebase
 * @module firebase/errorHandler
 */

import logger from '../utils/logger';

/**
 * Mensajes de error traducidos para Firebase
 */
const FIREBASE_ERROR_MESSAGES = {
  // Auth errors
  'auth/invalid-credential': 'Email o contraseña incorrectos',
  'auth/wrong-password': 'Email o contraseña incorrectos',
  'auth/user-not-found': 'No existe una cuenta con este email',
  'auth/invalid-email': 'Email inválido',
  'auth/email-already-in-use': 'Ya existe una cuenta con este email',
  'auth/weak-password': 'La contraseña es muy débil',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
  'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
  'auth/operation-not-allowed': 'Operación no permitida',

  // Firestore errors
  'permission-denied': 'No tienes permisos para esta operación',
  'not-found': 'Documento no encontrado',
  'already-exists': 'El documento ya existe',
  'resource-exhausted': 'Cuota excedida. Intenta más tarde',
  'failed-precondition': 'Operación rechazada. Verifica las condiciones',
  'aborted': 'Operación abortada. Intenta de nuevo',
  'out-of-range': 'Valor fuera de rango',
  'unimplemented': 'Operación no implementada',
  'internal': 'Error interno del servidor',
  'unavailable': 'Servicio no disponible. Intenta más tarde',
  'data-loss': 'Pérdida de datos',
  'unauthenticated': 'Debes iniciar sesión para continuar',

  // Storage errors
  'storage/unknown': 'Error desconocido en almacenamiento',
  'storage/object-not-found': 'Archivo no encontrado',
  'storage/bucket-not-found': 'Bucket de almacenamiento no encontrado',
  'storage/project-not-found': 'Proyecto no encontrado',
  'storage/quota-exceeded': 'Cuota de almacenamiento excedida',
  'storage/unauthenticated': 'Debes iniciar sesión para subir archivos',
  'storage/unauthorized': 'No tienes permisos para esta operación',
  'storage/retry-limit-exceeded': 'Límite de reintentos excedido',
  'storage/invalid-checksum': 'Checksum inválido',
  'storage/canceled': 'Operación cancelada',
  'storage/invalid-event-name': 'Nombre de evento inválido',
  'storage/invalid-url': 'URL inválida',
  'storage/invalid-argument': 'Argumento inválido',
  'storage/no-default-bucket': 'No hay bucket por defecto',
  'storage/cannot-slice-blob': 'Error al procesar archivo',
  'storage/server-file-wrong-size': 'Tamaño de archivo incorrecto'
};

/**
 * Convierte un error de Firebase en un mensaje legible
 * @param {Error} error - Error de Firebase
 * @returns {string} Mensaje de error legible
 */
export function getFirebaseErrorMessage(error) {
  if (!error) return 'Error desconocido';

  // Si el error ya tiene un mensaje personalizado
  if (error.message && !error.code) {
    return error.message;
  }

  // Buscar mensaje traducido
  const errorCode = error.code || '';
  const translatedMessage = FIREBASE_ERROR_MESSAGES[errorCode];

  if (translatedMessage) {
    return translatedMessage;
  }

  // Mensajes por defecto según el tipo
  if (errorCode.startsWith('auth/')) {
    return 'Error de autenticación. Intenta de nuevo';
  }

  if (errorCode.startsWith('storage/')) {
    return 'Error de almacenamiento. Intenta de nuevo';
  }

  // Mensaje genérico
  return error.message || 'Ocurrió un error. Intenta de nuevo';
}

/**
 * Maneja un error de Firebase de forma centralizada
 * @param {Error} error - Error de Firebase
 * @param {string} context - Contexto donde ocurrió el error
 * @param {boolean} [rethrow=true] - Si se debe re-lanzar el error
 * @returns {Object} Objeto con error formateado
 */
export function handleFirebaseError(error, context, rethrow = true) {
  const message = getFirebaseErrorMessage(error);

  logger.error(`Error en ${context}`, error, 'FirebaseErrorHandler');

  const errorObj = {
    success: false,
    error: message,
    code: error.code || 'unknown',
    originalError: error
  };

  if (rethrow) {
    throw errorObj;
  }

  return errorObj;
}

/**
 * Wrapper para funciones async de Firebase
 * Agrega manejo de errores automático
 * @param {Function} fn - Función async a ejecutar
 * @param {string} context - Contexto de la operación
 * @returns {Function} Función wrapped
 */
export function withErrorHandling(fn, context) {
  return async (...args) => {
    try {
      const result = await fn(...args);
      return { success: true, data: result };
    } catch (error) {
      return handleFirebaseError(error, context, false);
    }
  };
}

/**
 * Verifica si un error es por falta de permisos
 * @param {Error} error - Error a verificar
 * @returns {boolean}
 */
export function isPermissionError(error) {
  return error?.code === 'permission-denied' || error?.code === 'auth/unauthorized';
}

/**
 * Verifica si un error es por problemas de red
 * @param {Error} error - Error a verificar
 * @returns {boolean}
 */
export function isNetworkError(error) {
  return (
    error?.code === 'auth/network-request-failed' ||
    error?.code === 'unavailable' ||
    error?.message?.toLowerCase().includes('network')
  );
}

/**
 * Verifica si un error es recuperable (puede reintentar)
 * @param {Error} error - Error a verificar
 * @returns {boolean}
 */
export function isRetryableError(error) {
  const retryableCodes = [
    'unavailable',
    'aborted',
    'deadline-exceeded',
    'resource-exhausted',
    'auth/network-request-failed',
    'storage/retry-limit-exceeded'
  ];

  return retryableCodes.includes(error?.code);
}

/**
 * Ejecuta una función con reintentos automáticos
 * @param {Function} fn - Función async a ejecutar
 * @param {number} [maxRetries=3] - Número máximo de reintentos
 * @param {number} [delay=1000] - Delay entre reintentos en ms
 * @returns {Promise<any>}
 */
export async function withRetry(fn, maxRetries = 3, delay = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Intento ${attempt} de ${maxRetries}`, null, 'FirebaseErrorHandler');
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }

      logger.warn(
        `Intento ${attempt} falló, reintentando en ${delay}ms`,
        'FirebaseErrorHandler'
      );

      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
}

export default {
  getFirebaseErrorMessage,
  handleFirebaseError,
  withErrorHandling,
  isPermissionError,
  isNetworkError,
  isRetryableError,
  withRetry
};
