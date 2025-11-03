/**
 * @fileoverview Custom hook para debounce de valores
 * @module hooks/useDebounce
 */

import { useState, useEffect } from 'react';

/**
 * Hook para aplicar debounce a un valor
 * Útil para búsquedas en tiempo real y optimización de renders
 * @param {any} value - Valor a aplicar debounce
 * @param {number} delay - Delay en milisegundos (default: 500)
 * @returns {any} Valor con debounce aplicado
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Crear timeout para actualizar el valor después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar timeout si el valor cambia antes del delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
