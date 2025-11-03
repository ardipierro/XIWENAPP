/**
 * @fileoverview Custom hook para manejar localStorage con React state
 * @module hooks/useLocalStorage
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * Hook para sincronizar estado con localStorage
 * @param {string} key - Clave en localStorage
 * @param {any} initialValue - Valor inicial si no existe en localStorage
 * @returns {[any, Function, Function]} [valor, setValue, removeValue]
 */
export function useLocalStorage(key, initialValue) {
  // Función para obtener el valor inicial del localStorage
  const readValue = useCallback(() => {
    // Prevenir error en SSR
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error leyendo localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState(readValue);

  /**
   * Función para actualizar el valor en localStorage y state
   * @param {any} value - Nuevo valor o función que recibe el valor anterior
   */
  const setValue = useCallback((value) => {
    try {
      // Permitir que value sea una función para la misma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));

        // Disparar evento personalizado para sincronizar entre tabs/componentes
        window.dispatchEvent(new Event('local-storage'));
      }
    } catch (error) {
      console.warn(`Error guardando en localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  /**
   * Función para eliminar el valor del localStorage
   */
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        window.dispatchEvent(new Event('local-storage'));
      }
    } catch (error) {
      console.warn(`Error eliminando localStorage key "${key}":`, error);
    }
  }, [initialValue, key]);

  // Sincronizar cambios de localStorage entre tabs
  useEffect(() => {
    const handleStorageChange = () => {
      setStoredValue(readValue());
    };

    // Escuchar eventos de storage (cambios en otras tabs)
    window.addEventListener('storage', handleStorageChange);

    // Escuchar nuestro evento personalizado (cambios en la misma tab)
    window.addEventListener('local-storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleStorageChange);
    };
  }, [readValue]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
