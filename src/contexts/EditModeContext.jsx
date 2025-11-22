/**
 * @fileoverview Context para controlar el Modo Edición global de la aplicación
 *
 * Cuando está ACTIVO: Se muestran botones de eliminar, editar, y otras acciones destructivas
 * Cuando está INACTIVO: Las cards se muestran limpias, solo información (modo visualización)
 *
 * El estado se persiste en localStorage para mantener la preferencia del usuario
 *
 * @module contexts/EditModeContext
 */

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

const EditModeContext = createContext();

const STORAGE_KEY = 'xiwen_edit_mode';

/**
 * Provider del EditModeContext
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes hijos
 * @param {boolean} props.defaultValue - Valor por defecto (false = modo visualización)
 */
export function EditModeProvider({ children, defaultValue = false }) {
  // Inicializar desde localStorage o usar valor por defecto
  const [isEditMode, setIsEditMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch {
      // Si hay error, usar valor por defecto
    }
    return defaultValue;
  });

  // Persistir cambios en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isEditMode));
    } catch {
      // Ignorar errores de localStorage
    }
  }, [isEditMode]);

  /**
   * Activar modo edición
   */
  const enableEditMode = useCallback(() => {
    setIsEditMode(true);
  }, []);

  /**
   * Desactivar modo edición (modo visualización)
   */
  const disableEditMode = useCallback(() => {
    setIsEditMode(false);
  }, []);

  /**
   * Alternar modo edición
   */
  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev);
  }, []);

  const value = useMemo(() => ({
    isEditMode,
    enableEditMode,
    disableEditMode,
    toggleEditMode,
  }), [isEditMode, enableEditMode, disableEditMode, toggleEditMode]);

  return (
    <EditModeContext.Provider value={value}>
      {children}
    </EditModeContext.Provider>
  );
}

/**
 * Hook para usar el EditModeContext
 *
 * @returns {Object} Objeto con el estado y funciones del modo edición
 * @returns {boolean} isEditMode - Si el modo edición está activo
 * @returns {Function} enableEditMode - Activa el modo edición
 * @returns {Function} disableEditMode - Desactiva el modo edición
 * @returns {Function} toggleEditMode - Alterna el modo edición
 *
 * @example
 * const { isEditMode, toggleEditMode } = useEditMode();
 *
 * // En un componente que muestra botones destructivos:
 * {isEditMode && <CardDeleteButton onDelete={handleDelete} />}
 *
 * // En el TopBar para el toggle:
 * <button onClick={toggleEditMode}>
 *   {isEditMode ? 'Modo Edición' : 'Modo Ver'}
 * </button>
 */
export function useEditMode() {
  const context = useContext(EditModeContext);

  // Si no hay provider, devolver valores por defecto (modo ver)
  // Esto permite que componentes funcionen aunque no estén envueltos
  if (!context) {
    return {
      isEditMode: false,
      enableEditMode: () => {},
      disableEditMode: () => {},
      toggleEditMode: () => {},
    };
  }

  return context;
}

export default EditModeContext;
