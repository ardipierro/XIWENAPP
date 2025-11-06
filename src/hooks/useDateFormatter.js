import logger from '../utils/logger';

/**
 * @fileoverview Custom hook para formatear fechas de forma consistente
 * @module hooks/useDateFormatter
 */

import { useCallback } from 'react';

/**
 * Hook para formatear fechas de Firebase Timestamp a formato español
 * @returns {Object} Funciones de formateo de fechas
 */
export function useDateFormatter() {
  /**
   * Formatea una fecha a formato largo español
   * @param {import('firebase/firestore').Timestamp|Date|string} timestamp - Fecha a formatear
   * @returns {string} Fecha formateada
   */
  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return 'No disponible';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      logger.error('Error formateando fecha:', error);
      return 'Fecha inválida';
    }
  }, []);

  /**
   * Formatea una fecha a formato corto español
   * @param {import('firebase/firestore').Timestamp|Date|string} timestamp - Fecha a formatear
   * @returns {string} Fecha formateada
   */
  const formatDateShort = useCallback((timestamp) => {
    if (!timestamp) return 'N/A';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      logger.error('Error formateando fecha:', error);
      return 'N/A';
    }
  }, []);

  /**
   * Formatea una fecha con hora
   * @param {import('firebase/firestore').Timestamp|Date|string} timestamp - Fecha a formatear
   * @returns {string} Fecha y hora formateadas
   */
  const formatDateTime = useCallback((timestamp) => {
    if (!timestamp) return 'No disponible';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      logger.error('Error formateando fecha y hora:', error);
      return 'Fecha inválida';
    }
  }, []);

  /**
   * Formatea una fecha de forma relativa (hace X días, hace X horas)
   * @param {import('firebase/firestore').Timestamp|Date|string} timestamp - Fecha a formatear
   * @returns {string} Tiempo relativo
   */
  const formatRelativeTime = useCallback((timestamp) => {
    if (!timestamp) return 'Hace tiempo';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);

      if (diffInSeconds < 60) return 'Hace unos segundos';
      if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
      }
      if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
      }
      if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `Hace ${days} día${days > 1 ? 's' : ''}`;
      }
      if (diffInSeconds < 2592000) {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
      }

      // Si es más de un mes, mostrar fecha normal
      return formatDate(timestamp);
    } catch (error) {
      logger.error('Error formateando tiempo relativo:', error);
      return 'Hace tiempo';
    }
  }, [formatDate]);

  return {
    formatDate,
    formatDateShort,
    formatDateTime,
    formatRelativeTime
  };
}

export default useDateFormatter;
