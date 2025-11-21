/**
 * @fileoverview Hook para gestionar configuración de overlay con persistencia
 *
 * Uso:
 * const { settings, updateSetting, resetSettings } = useOverlaySettings();
 *
 * @module hooks/useOverlaySettings
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getOverlaySettings,
  saveOverlaySettings,
  DEFAULT_OVERLAY_CONFIG,
} from '../config/errorTypeConfig';

/**
 * Configuración por defecto de overlay
 */
const DEFAULT_SETTINGS = {
  highlightOpacity: 0.25,
  useWavyUnderline: true,
  showCorrectionText: true,
  correctionTextFont: 'Caveat',
  visibleErrorTypes: {
    spelling: true,
    grammar: true,
    punctuation: true,
    vocabulary: true,
  },
};

/**
 * Hook para gestionar configuración de overlay con persistencia en localStorage
 *
 * @param {string} storageKey - Clave opcional para storage (para diferentes contextos)
 * @returns {Object} Estado y funciones de actualización
 */
export function useOverlaySettings(storageKey = null) {
  // Cargar settings desde localStorage
  const [settings, setSettings] = useState(() => {
    return getOverlaySettings();
  });

  // Flag para indicar si hay cambios sin guardar
  const [hasChanges, setHasChanges] = useState(false);

  // Guardar automáticamente cuando cambian los settings
  useEffect(() => {
    if (hasChanges) {
      saveOverlaySettings(settings);
      setHasChanges(false);
    }
  }, [settings, hasChanges]);

  /**
   * Actualiza un setting específico
   */
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  }, []);

  /**
   * Actualiza múltiples settings a la vez
   */
  const updateSettings = useCallback((updates) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
    }));
    setHasChanges(true);
  }, []);

  /**
   * Toggle de visibilidad de un tipo de error
   */
  const toggleErrorType = useCallback((type) => {
    setSettings(prev => ({
      ...prev,
      visibleErrorTypes: {
        ...prev.visibleErrorTypes,
        [type]: !prev.visibleErrorTypes[type],
      },
    }));
    setHasChanges(true);
  }, []);

  /**
   * Toggle de todos los tipos de error
   */
  const toggleAllErrorTypes = useCallback((visible) => {
    setSettings(prev => ({
      ...prev,
      visibleErrorTypes: {
        spelling: visible,
        grammar: visible,
        punctuation: visible,
        vocabulary: visible,
      },
    }));
    setHasChanges(true);
  }, []);

  /**
   * Verifica si todos los tipos están visibles
   */
  const allTypesVisible = Object.values(settings.visibleErrorTypes).every(v => v);

  /**
   * Restaura los settings por defecto
   */
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
  }, []);

  /**
   * Recarga settings desde localStorage (útil si otro componente los modificó)
   */
  const reloadSettings = useCallback(() => {
    setSettings(getOverlaySettings());
  }, []);

  return {
    settings,
    updateSetting,
    updateSettings,
    toggleErrorType,
    toggleAllErrorTypes,
    allTypesVisible,
    resetSettings,
    reloadSettings,
    hasChanges,
    // Shortcuts para valores comunes
    highlightOpacity: settings.highlightOpacity,
    useWavyUnderline: settings.useWavyUnderline,
    showCorrectionText: settings.showCorrectionText,
    correctionTextFont: settings.correctionTextFont,
    visibleErrorTypes: settings.visibleErrorTypes,
    // Constantes de configuración
    opacityLevels: DEFAULT_OVERLAY_CONFIG.opacityLevels,
    availableFonts: DEFAULT_OVERLAY_CONFIG.availableFonts,
  };
}

export default useOverlaySettings;
