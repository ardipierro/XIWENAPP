/**
 * @fileoverview Custom hook para mostrar notificaciones/mensajes
 * @module hooks/useNotification
 */

import { useState, useCallback } from 'react';

/**
 * Hook para manejar notificaciones temporales
 * @param {number} defaultDuration - Duración por defecto en ms (default: 3000)
 * @returns {Object} Estado y funciones de notificación
 */
export function useNotification(defaultDuration = 3000) {
  const [notification, setNotification] = useState({
    type: '', // 'success', 'error', 'warning', 'info'
    message: '',
    visible: false
  });

  /**
   * Muestra una notificación
   * @param {string} type - Tipo de notificación
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en ms
   */
  const show = useCallback((type, message, duration = defaultDuration) => {
    setNotification({
      type,
      message,
      visible: true
    });

    if (duration > 0) {
      setTimeout(() => {
        setNotification(prev => ({ ...prev, visible: false }));
      }, duration);
    }
  }, [defaultDuration]);

  /**
   * Muestra una notificación de éxito
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en ms
   */
  const showSuccess = useCallback((message, duration) => {
    show('success', message, duration);
  }, [show]);

  /**
   * Muestra una notificación de error
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en ms
   */
  const showError = useCallback((message, duration) => {
    show('error', message, duration);
  }, [show]);

  /**
   * Muestra una notificación de advertencia
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en ms
   */
  const showWarning = useCallback((message, duration) => {
    show('warning', message, duration);
  }, [show]);

  /**
   * Muestra una notificación informativa
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en ms
   */
  const showInfo = useCallback((message, duration) => {
    show('info', message, duration);
  }, [show]);

  /**
   * Cierra la notificación actual
   */
  const hide = useCallback(() => {
    setNotification(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    notification,
    show,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hide
  };
}

export default useNotification;
