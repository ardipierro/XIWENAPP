/**
 * @fileoverview Custom hook para manejo de modales
 * @module hooks/useModal
 */

import { useState, useCallback } from 'react';

/**
 * Hook para manejar estado y acciones de modales
 * @returns {Object} Estado y funciones del modal
 */
export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(null);

  /**
   * Abre el modal con datos opcionales
   * @param {any} modalData - Datos a pasar al modal
   */
  const open = useCallback((modalData = null) => {
    setData(modalData);
    setIsOpen(true);
  }, []);

  /**
   * Cierra el modal y limpia los datos
   */
  const close = useCallback(() => {
    setIsOpen(false);
    // Esperar a que termine la animación antes de limpiar datos
    setTimeout(() => setData(null), 300);
  }, []);

  /**
   * Toggle del estado del modal
   */
  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
    if (isOpen) {
      setTimeout(() => setData(null), 300);
    }
  }, [isOpen]);

  /**
   * Actualiza los datos del modal sin cerrarlo
   * @param {any} newData - Nuevos datos
   */
  const updateData = useCallback((newData) => {
    setData(newData);
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    updateData
  };
}

export default useModal;
