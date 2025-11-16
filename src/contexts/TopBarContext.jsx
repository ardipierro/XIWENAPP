/**
 * @fileoverview Context para controlar la TopBar de manera global
 * Permite que componentes como ClassDailyLog configuren la TopBar principal
 * @module contexts/TopBarContext
 */

import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const TopBarContext = createContext();

/**
 * Configuración por defecto de la TopBar
 */
const DEFAULT_CONFIG = {
  title: 'Dashboard',
  subtitle: null,
  actions: [],
  showBackButton: false,
  onBack: null,
  customContent: null
};

/**
 * Provider del TopBarContext
 */
export function TopBarProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  /**
   * Actualizar configuración de la TopBar
   */
  const updateTopBar = useCallback((newConfig) => {
    setConfig(prev => ({
      ...DEFAULT_CONFIG,
      ...newConfig
    }));
  }, []);

  /**
   * Resetear TopBar a configuración por defecto
   */
  const resetTopBar = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  /**
   * Agregar una acción a la TopBar
   */
  const addAction = useCallback((action) => {
    setConfig(prev => ({
      ...prev,
      actions: [...prev.actions, action]
    }));
  }, []);

  /**
   * Remover una acción de la TopBar por su key
   */
  const removeAction = useCallback((actionKey) => {
    setConfig(prev => ({
      ...prev,
      actions: prev.actions.filter(a => a.key !== actionKey)
    }));
  }, []);

  const value = useMemo(() => ({
    config,
    updateTopBar,
    resetTopBar,
    addAction,
    removeAction
  }), [config, updateTopBar, resetTopBar, addAction, removeAction]);

  return (
    <TopBarContext.Provider value={value}>
      {children}
    </TopBarContext.Provider>
  );
}

/**
 * Hook para usar el TopBarContext
 */
export function useTopBar() {
  const context = useContext(TopBarContext);
  if (!context) {
    throw new Error('useTopBar debe usarse dentro de TopBarProvider');
  }
  return context;
}

export default TopBarContext;
