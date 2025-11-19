/**
 * @fileoverview Context para configuración de paneles/dashboards
 * Gestiona el estado global de configuración visual de paneles
 *
 * @module contexts/DashboardConfigContext
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dashboardConfigs, defaultPanelConfig } from '../config/dashboardConfig';

const DashboardConfigContext = createContext();

const STORAGE_KEY = 'xiwen_dashboard_config';

/**
 * Provider para configuración de dashboards
 */
export function DashboardConfigProvider({ children }) {
  // Estado: configuración guardada por el usuario
  const [config, setConfig] = useState(() => {
    // Cargar desde localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge con configs por defecto
        const merged = {};
        Object.keys(dashboardConfigs).forEach(panelId => {
          merged[panelId] = {
            ...defaultPanelConfig,
            ...dashboardConfigs[panelId],
            ...(parsed[panelId] || {}),
          };
        });
        return merged;
      } catch (e) {
        console.error('Error loading dashboard config:', e);
        return { ...dashboardConfigs };
      }
    }
    return { ...dashboardConfigs };
  });

  /**
   * Actualizar configuración de un panel específico
   */
  const updatePanelConfig = useCallback((panelId, updates) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        [panelId]: {
          ...prev[panelId],
          ...updates,
        },
      };

      // Guardar en localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));

      return newConfig;
    });
  }, []);

  /**
   * Actualizar una propiedad específica de un panel
   */
  const updateProperty = useCallback((panelId, property, value) => {
    updatePanelConfig(panelId, { [property]: value });
  }, [updatePanelConfig]);

  /**
   * Resetear configuración de un panel a valores por defecto
   */
  const resetPanelConfig = useCallback((panelId) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        [panelId]: {
          ...defaultPanelConfig,
          ...dashboardConfigs[panelId],
        },
      };

      // Guardar en localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));

      return newConfig;
    });
  }, []);

  /**
   * Resetear TODA la configuración a valores por defecto
   */
  const resetAllConfig = useCallback(() => {
    const defaultConfig = { ...dashboardConfigs };
    setConfig(defaultConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultConfig));
  }, []);

  /**
   * Exportar configuración actual
   */
  const exportConfig = useCallback(() => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `dashboard-config-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [config]);

  /**
   * Importar configuración desde archivo JSON
   */
  const importConfig = useCallback((jsonData) => {
    try {
      const imported = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      setConfig(imported);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
      return { success: true };
    } catch (error) {
      console.error('Error importing dashboard config:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Obtener configuración de un panel específico
   */
  const getPanelConfig = useCallback((panelId) => {
    return config[panelId] || {
      ...defaultPanelConfig,
      ...dashboardConfigs[panelId],
    };
  }, [config]);

  /**
   * Recargar configuración desde localStorage
   */
  const reloadConfig = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(parsed);
      } catch (e) {
        console.error('Error reloading dashboard config:', e);
      }
    }
  }, []);

  const value = {
    config,
    updatePanelConfig,
    updateProperty,
    resetPanelConfig,
    resetAllConfig,
    getPanelConfig,
    exportConfig,
    importConfig,
    reloadConfig,
  };

  return (
    <DashboardConfigContext.Provider value={value}>
      {children}
    </DashboardConfigContext.Provider>
  );
}

/**
 * Hook para usar configuración de dashboards
 */
export function useDashboardConfigContext() {
  const context = useContext(DashboardConfigContext);
  if (!context) {
    throw new Error('useDashboardConfigContext must be used within DashboardConfigProvider');
  }
  return context;
}

export default DashboardConfigContext;
