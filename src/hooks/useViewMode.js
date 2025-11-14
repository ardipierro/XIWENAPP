/**
 * @fileoverview useViewMode - Hook para gestionar modo de vista de cards
 * Maneja: grid/list/table con persistencia en localStorage
 *
 * @module hooks/useViewMode
 */

import { useState, useCallback } from 'react';
import logger from '../utils/logger';

/**
 * Hook para gestionar el modo de vista (grid/list/table)
 *
 * Características:
 * - Persistencia en localStorage
 * - Valores por defecto configurables
 * - Helper booleans para checks rápidos
 * - Validación de modos
 *
 * @param {string} defaultMode - Modo por defecto: 'grid' | 'list' | 'table'
 * @param {string} storageKey - Key para localStorage (único por vista)
 *
 * @returns {{
 *   viewMode: string,
 *   setViewMode: function,
 *   isGrid: boolean,
 *   isList: boolean,
 *   isTable: boolean,
 *   toggleViewMode: function,
 *   resetViewMode: function
 * }}
 *
 * @example
 * // En un componente de gestión de usuarios
 * function UserManager() {
 *   const { viewMode, setViewMode, isGrid, isList, isTable } = useViewMode('grid', 'users-view');
 *
 *   return (
 *     <div>
 *       <SearchBar
 *         viewMode={viewMode}
 *         onViewModeChange={setViewMode}
 *       />
 *
 *       {isGrid && <CardGrid>{/* ... *\/}</CardGrid>}
 *       {isList && <CardList>{/* ... *\/}</CardList>}
 *       {isTable && <CardTable>{/* ... *\/}</CardTable>}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Múltiples vistas en un mismo componente
 * const studentsView = useViewMode('grid', 'students-view');
 * const coursesView = useViewMode('list', 'courses-view');
 */
export function useViewMode(defaultMode = 'grid', storageKey = 'viewMode') {
  /**
   * Valid view modes
   */
  const validModes = ['grid', 'list', 'table'];

  /**
   * Initialize state from localStorage or default
   */
  const [viewMode, setViewModeState] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);

      if (stored && validModes.includes(stored)) {
        logger.debug(`useViewMode: Loaded ${storageKey} = ${stored} from localStorage`);
        return stored;
      }

      logger.debug(`useViewMode: Using default mode "${defaultMode}" for ${storageKey}`);
      return defaultMode;
    } catch (error) {
      logger.error('useViewMode: Error reading from localStorage:', error);
      return defaultMode;
    }
  });

  /**
   * Set view mode with localStorage persistence
   */
  const setViewMode = useCallback(
    (mode) => {
      if (!validModes.includes(mode)) {
        logger.warn(`useViewMode: Invalid mode "${mode}". Must be one of: ${validModes.join(', ')}`);
        return;
      }

      try {
        setViewModeState(mode);
        localStorage.setItem(storageKey, mode);
        logger.debug(`useViewMode: Set ${storageKey} = ${mode}`);
      } catch (error) {
        logger.error('useViewMode: Error saving to localStorage:', error);
      }
    },
    [storageKey]
  );

  /**
   * Toggle between view modes (grid -> list -> table -> grid)
   */
  const toggleViewMode = useCallback(() => {
    const currentIndex = validModes.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % validModes.length;
    const nextMode = validModes[nextIndex];

    setViewMode(nextMode);
  }, [viewMode, setViewMode]);

  /**
   * Reset to default mode
   */
  const resetViewMode = useCallback(() => {
    setViewMode(defaultMode);
  }, [defaultMode, setViewMode]);

  /**
   * Helper booleans para checks rápidos
   */
  const isGrid = viewMode === 'grid';
  const isList = viewMode === 'list';
  const isTable = viewMode === 'table';

  return {
    viewMode,
    setViewMode,
    isGrid,
    isList,
    isTable,
    toggleViewMode,
    resetViewMode,
  };
}

export default useViewMode;
