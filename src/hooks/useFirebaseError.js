import logger from '../utils/logger';

/**
 * @fileoverview Custom hook para manejar errores de Firebase de forma consistente
 * @module hooks/useFirebaseError
 */

import { useCallback } from 'react';

/**
 * Hook para traducir y manejar errores de Firebase
 * @returns {Object} Funciones para manejar errores
 */
export function useFirebaseError() {
  /**
   * Traduce códigos de error de Firebase a mensajes en español
   * @param {Error} error - Error de Firebase
   * @returns {string} Mensaje de error traducido
   */
  const getErrorMessage = useCallback((error) => {
    if (!error) return 'Error desconocido';

    const errorCode = error.code || '';
    const errorMessages = {
      // Auth errors
      'auth/email-already-in-use': 'Este correo ya está en uso',
      'auth/invalid-email': 'Correo electrónico inválido',
      'auth/operation-not-allowed': 'Operación no permitida',
      'auth/weak-password': 'La contraseña es demasiado débil',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'auth/network-request-failed': 'Error de red. Verifica tu conexión',
      'auth/invalid-credential': 'Credenciales inválidas',
      'auth/requires-recent-login': 'Requiere inicio de sesión reciente',

      // Firestore errors
      'permission-denied': 'No tienes permisos para realizar esta acción',
      'not-found': 'Documento no encontrado',
      'already-exists': 'El documento ya existe',
      'failed-precondition': 'Operación rechazada. Verifica las condiciones',
      'aborted': 'Operación cancelada debido a un conflicto',
      'out-of-range': 'Operación fuera de rango válido',
      'unimplemented': 'Operación no implementada',
      'internal': 'Error interno del servidor',
      'unavailable': 'Servicio temporalmente no disponible',
      'data-loss': 'Pérdida de datos irrecuperable',
      'unauthenticated': 'Usuario no autenticado',

      // Storage errors
      'storage/unauthorized': 'No autorizado para acceder al almacenamiento',
      'storage/canceled': 'Operación cancelada',
      'storage/unknown': 'Error desconocido en almacenamiento',
      'storage/object-not-found': 'Archivo no encontrado',
      'storage/bucket-not-found': 'Bucket no encontrado',
      'storage/project-not-found': 'Proyecto no encontrado',
      'storage/quota-exceeded': 'Cuota de almacenamiento excedida',
      'storage/invalid-checksum': 'Checksum inválido',
      'storage/retry-limit-exceeded': 'Límite de reintentos excedido',
      'storage/invalid-event-name': 'Nombre de evento inválido',
      'storage/invalid-url': 'URL inválida',
      'storage/invalid-argument': 'Argumento inválido',
      'storage/no-default-bucket': 'No hay bucket por defecto configurado',
      'storage/cannot-slice-blob': 'No se puede dividir el archivo',
      'storage/server-file-wrong-size': 'Tamaño de archivo incorrecto'
    };

    // Buscar mensaje por código
    const message = errorMessages[errorCode];
    if (message) return message;

    // Si no hay código específico, retornar mensaje genérico
    return error.message || 'Ha ocurrido un error. Intenta nuevamente';
  }, []);

  /**
   * Maneja un error de Firebase y retorna un objeto con información
   * @param {Error} error - Error de Firebase
   * @returns {Object} Objeto con código, mensaje y error original
   */
  const handleError = useCallback((error) => {
    const message = getErrorMessage(error);
    const code = error?.code || 'unknown';

    logger.error(`[Firebase Error ${code}]:`, error);

    return {
      code,
      message,
      originalError: error
    };
  }, [getErrorMessage]);

  /**
   * Verifica si un error es de un tipo específico
   * @param {Error} error - Error a verificar
   * @param {string} errorCode - Código de error a buscar
   * @returns {boolean} Si el error coincide con el código
   */
  const isErrorType = useCallback((error, errorCode) => {
    return error?.code === errorCode;
  }, []);

  /**
   * Verifica si un error es de autenticación
   * @param {Error} error - Error a verificar
   * @returns {boolean} Si es error de autenticación
   */
  const isAuthError = useCallback((error) => {
    return error?.code?.startsWith('auth/') || false;
  }, []);

  /**
   * Verifica si un error es de permisos
   * @param {Error} error - Error a verificar
   * @returns {boolean} Si es error de permisos
   */
  const isPermissionError = useCallback((error) => {
    return error?.code === 'permission-denied' ||
           error?.code === 'storage/unauthorized' ||
           error?.code === 'auth/operation-not-allowed';
  }, []);

  return {
    getErrorMessage,
    handleError,
    isErrorType,
    isAuthError,
    isPermissionError
  };
}

export default useFirebaseError;
