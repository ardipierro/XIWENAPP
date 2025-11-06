/**
 * @fileoverview Utilidad para manejo centralizado de errores
 * @module utils/errorHandler
 */

import logger from './logger.js';

/**
 * Mensajes de error amigables por código de Firebase
 */
const FIREBASE_ERROR_MESSAGES = {
  // Auth errors
  'auth/user-not-found': 'Usuario no encontrado',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/email-already-in-use': 'Este email ya está registrado',
  'auth/weak-password': 'La contraseña es muy débil',
  'auth/invalid-email': 'Email inválido',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
  'auth/network-request-failed': 'Error de conexión. Verifica tu internet',

  // Firestore errors
  'permission-denied': 'No tienes permisos para realizar esta acción',
  'not-found': 'El documento no existe',
  'already-exists': 'El documento ya existe',
  'resource-exhausted': 'Se ha excedido la cuota de uso',
  'unauthenticated': 'Debes iniciar sesión primero',
  'unavailable': 'Servicio temporalmente no disponible',
  'deadline-exceeded': 'La operación tardó demasiado',

  // Storage errors
  'storage/unauthorized': 'No tienes permisos para subir archivos',
  'storage/canceled': 'Carga cancelada',
  'storage/unknown': 'Error al subir el archivo',
  'storage/object-not-found': 'Archivo no encontrado',
  'storage/quota-exceeded': 'Cuota de almacenamiento excedida',

  // Generic
  'network-error': 'Error de conexión. Verifica tu internet',
  'unknown': 'Ocurrió un error inesperado'
};

/**
 * Extrae un mensaje amigable de un error de Firebase
 * @param {Error} error - Error de Firebase
 * @returns {string} - Mensaje amigable
 */
export function getFriendlyErrorMessage(error) {
  if (!error) return FIREBASE_ERROR_MESSAGES.unknown;

  // Firebase Auth errors
  if (error.code && error.code.startsWith('auth/')) {
    return FIREBASE_ERROR_MESSAGES[error.code] || FIREBASE_ERROR_MESSAGES.unknown;
  }

  // Firebase Firestore errors
  if (error.code) {
    return FIREBASE_ERROR_MESSAGES[error.code] || FIREBASE_ERROR_MESSAGES.unknown;
  }

  // Network errors
  if (error.message && error.message.includes('network')) {
    return FIREBASE_ERROR_MESSAGES['network-error'];
  }

  // Error genérico
  if (error.message) {
    return error.message;
  }

  return FIREBASE_ERROR_MESSAGES.unknown;
}

/**
 * Wrapper para operaciones async con manejo de errores
 * @param {Function} asyncFn - Función async a ejecutar
 * @param {Object} options - Opciones
 * @param {string} [options.context] - Contexto para logging
 * @param {string} [options.errorMessage] - Mensaje de error personalizado
 * @param {Function} [options.onError] - Callback opcional en caso de error
 * @param {boolean} [options.throwError=false] - Si debe lanzar el error
 * @returns {Promise<[Error|null, any]>} - [error, data] tuple
 *
 * @example
 * const [error, user] = await handleAsync(
 *   () => getUser(userId),
 *   { context: 'UserProfile', errorMessage: 'Error al cargar usuario' }
 * );
 *
 * if (error) {
 *   showToast(error.friendlyMessage);
 *   return;
 * }
 *
 * setUser(user);
 */
export async function handleAsync(asyncFn, options = {}) {
  const {
    context = 'AsyncOperation',
    errorMessage,
    onError,
    throwError = false
  } = options;

  try {
    const data = await asyncFn();
    return [null, data];
  } catch (error) {
    // Log del error
    logger.error(
      errorMessage || 'Error en operación async',
      error,
      context
    );

    // Agregar mensaje amigable al error
    const enhancedError = {
      ...error,
      friendlyMessage: getFriendlyErrorMessage(error),
      context,
      timestamp: new Date().toISOString()
    };

    // Callback de error si se proporciona
    if (onError) {
      onError(enhancedError);
    }

    // Lanzar error si se solicita
    if (throwError) {
      throw enhancedError;
    }

    return [enhancedError, null];
  }
}

/**
 * Hook-like wrapper para operaciones async en componentes React
 * Similar a handleAsync pero con mejor integración en componentes
 *
 * @param {Function} asyncFn - Función async a ejecutar
 * @param {Object} options - Opciones
 * @returns {Promise<any>} - Data o null
 *
 * @example
 * const loadUsers = async () => {
 *   const users = await safeAsync(
 *     () => getAllUsers(),
 *     {
 *       context: 'AdminDashboard',
 *       onError: (error) => setError(error.friendlyMessage)
 *     }
 *   );
 *
 *   if (users) {
 *     setUsers(users);
 *   }
 * };
 */
export async function safeAsync(asyncFn, options = {}) {
  const [error, data] = await handleAsync(asyncFn, options);

  if (error && options.onError) {
    options.onError(error);
  }

  return data;
}

/**
 * Retry wrapper para operaciones que pueden fallar temporalmente
 * @param {Function} asyncFn - Función async a ejecutar
 * @param {Object} options - Opciones
 * @param {number} [options.maxRetries=3] - Número máximo de reintentos
 * @param {number} [options.delayMs=1000] - Delay entre reintentos (ms)
 * @param {Function} [options.shouldRetry] - Función para decidir si reintentar
 * @returns {Promise<any>}
 *
 * @example
 * const data = await retryAsync(
 *   () => fetchDataFromAPI(),
 *   {
 *     maxRetries: 3,
 *     delayMs: 1000,
 *     shouldRetry: (error) => error.code === 'unavailable'
 *   }
 * );
 */
export async function retryAsync(asyncFn, options = {}) {
  const {
    maxRetries = 3,
    delayMs = 1000,
    shouldRetry = () => true,
    context = 'RetryOperation'
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const data = await asyncFn();
      if (attempt > 0) {
        logger.info(
          `Operación exitosa en intento ${attempt + 1}/${maxRetries + 1}`,
          context
        );
      }
      return data;
    } catch (error) {
      lastError = error;

      // Si es el último intento o no debemos reintentar, lanzar error
      if (attempt === maxRetries || !shouldRetry(error)) {
        logger.error(
          `Operación falló después de ${attempt + 1} intentos`,
          error,
          context
        );
        throw error;
      }

      // Log del reintento
      logger.warn(
        `Intento ${attempt + 1} falló. Reintentando en ${delayMs}ms...`,
        context
      );

      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * Batch error handler para múltiples operaciones async
 * @param {Array<Promise>} promises - Array de promesas
 * @param {Object} options - Opciones
 * @returns {Promise<Array>} - Array de resultados con { success, data, error }
 *
 * @example
 * const results = await batchAsync([
 *   getUser(id1),
 *   getUser(id2),
 *   getUser(id3)
 * ], { context: 'BatchUserLoad' });
 *
 * const successful = results.filter(r => r.success);
 * const failed = results.filter(r => !r.success);
 */
export async function batchAsync(promises, options = {}) {
  const { context = 'BatchOperation' } = options;

  const results = await Promise.allSettled(promises);

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return {
        success: true,
        data: result.value,
        error: null
      };
    } else {
      logger.error(
        `Operación ${index + 1} falló en batch`,
        result.reason,
        context
      );

      return {
        success: false,
        data: null,
        error: {
          ...result.reason,
          friendlyMessage: getFriendlyErrorMessage(result.reason)
        }
      };
    }
  });
}

export default {
  handleAsync,
  safeAsync,
  retryAsync,
  batchAsync,
  getFriendlyErrorMessage
};
