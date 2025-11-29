/**
 * @fileoverview Hook para gestionar configuración de badges
 * @module hooks/useBadgeConfig
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getBadgeConfig,
  saveBadgeConfig,
  resetBadgeConfig,
  getBadgeByKey,
  getBadgesByCategory,
  addCustomBadge,
  removeCustomBadge,
  updateBadge,
  DEFAULT_BADGE_CONFIG,
  BADGE_CATEGORIES,
  applyBadgeColors,
  getIconLibraryConfig,
  saveIconLibraryConfig,
  resetIconLibraryConfig,
  DEFAULT_ICON_LIBRARY_CONFIG,
  getGlobalBadgeConfig,
  saveGlobalBadgeConfig,
  DEFAULT_GLOBAL_BADGE_CONFIG,
  applyColorPalette,
  // 🆕 Sistema de Presets
  getBadgePresetConfig,
  saveBadgePresetConfig,
  resetBadgePresetConfig,
  BADGE_DISPLAY_PRESETS,
  DEFAULT_BADGE_PRESET_CONFIG,
  getPresetForBadge,
  createCustomPreset,
  deleteCustomPreset,
  setCategoryPreset,
  setBadgePresetOverride,
  removeBadgePresetOverride,
} from '../config/badgeSystem';
import logger from '../utils/logger';

/**
 * Hook para trabajar con el sistema de badges
 *
 * @returns {Object} - Configuración y funciones para gestionar badges
 *
 * @example
 * const { config, updateColor, addBadge, removeBadge, reset } = useBadgeConfig();
 */
function useBadgeConfig() {
  const [config, setConfig] = useState(getBadgeConfig());
  const [iconConfig, setIconConfig] = useState(getIconLibraryConfig());
  const [globalConfig, setGlobalConfig] = useState(getGlobalBadgeConfig());
  const [presetConfig, setPresetConfig] = useState(getBadgePresetConfig());
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar configuración al montar
  useEffect(() => {
    let loaded = getBadgeConfig();

    // MIGRACIÓN AUTOMÁTICA: Mover GAMIFICATION_CREDITS de 'gamification' a 'credits'
    if (loaded.GAMIFICATION_CREDITS && loaded.GAMIFICATION_CREDITS.category === 'gamification') {
      logger.info('🔄 Migrando badge GAMIFICATION_CREDITS de gamification a credits');
      loaded = {
        ...loaded,
        GAMIFICATION_CREDITS: {
          ...loaded.GAMIFICATION_CREDITS,
          category: 'credits'
        }
      };
      // Guardar la configuración migrada
      saveBadgeConfig(loaded);
    }

    setConfig(loaded);
    applyBadgeColors(loaded);
  }, []);

  // Escuchar cambios de otros componentes
  useEffect(() => {
    const handleStorageChange = () => {
      const updated = getBadgeConfig();
      setConfig(updated);
      applyBadgeColors(updated);
    };

    const handlePresetConfigChange = () => {
      const updated = getBadgePresetConfig();
      setPresetConfig(updated);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('xiwen_badge_config_changed', handleStorageChange);
    window.addEventListener('badgePresetConfigChange', handlePresetConfigChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('xiwen_badge_config_changed', handleStorageChange);
      window.removeEventListener('badgePresetConfigChange', handlePresetConfigChange);
    };
  }, []);

  /**
   * Actualizar configuración de librería de iconos (con guardado inmediato)
   */
  const updateIconLibrary = useCallback((library) => {
    setIconConfig((prev) => {
      const updated = { ...prev, library };
      // Guardar inmediatamente para que se aplique en tiempo real
      saveIconLibraryConfig(updated);
      window.dispatchEvent(new CustomEvent('iconLibraryChange', { detail: updated }));
      setHasChanges(true);
      return updated;
    });
  }, []);

  /**
   * Actualizar paleta monocromática (con guardado inmediato para que se aplique en tiempo real)
   */
  const updateMonochromePalette = useCallback((palette) => {
    setIconConfig((prev) => {
      const updated = { ...prev, monochromePalette: palette };
      // Guardar inmediatamente para que se aplique en tiempo real
      saveIconLibraryConfig(updated);
      window.dispatchEvent(new CustomEvent('iconLibraryChange', { detail: updated }));
      setHasChanges(true);
      return updated;
    });
  }, []);

  /**
   * Actualizar color custom de paleta monocromática (con guardado inmediato)
   */
  const updateMonochromeColor = useCallback((color) => {
    setIconConfig((prev) => {
      const updated = { ...prev, monochromeColor: color };
      // Guardar inmediatamente para que se aplique en tiempo real
      saveIconLibraryConfig(updated);
      window.dispatchEvent(new CustomEvent('iconLibraryChange', { detail: updated }));
      setHasChanges(true);
      return updated;
    });
  }, []);

  /**
   * Actualizar configuración global de badges (con guardado inmediato)
   * NOTA: No reseteamos hasChanges aquí porque puede haber otros cambios pendientes
   * que no se guardan con esta operación (como cambios de color individual)
   */
  const updateGlobalConfig = useCallback((key, value) => {
    setGlobalConfig((prev) => {
      const updated = { ...prev, [key]: value };

      // Si cambia la paleta de colores, aplicar inmediatamente a los badges
      if (key === 'colorPalette') {
        setConfig((currentConfig) => {
          const newConfig = applyColorPalette(value, currentConfig, updated.monochromeColor);
          // Guardar y disparar evento
          saveBadgeConfig(newConfig);
          window.dispatchEvent(new Event('xiwen_badge_config_changed'));
          return newConfig;
        });
      }

      // Si cambia el color monocromático y la paleta es monocromática, reaplicar
      if (key === 'monochromeColor' && prev.colorPalette === 'monochrome') {
        setConfig((currentConfig) => {
          const newConfig = applyColorPalette('monochrome', currentConfig, value);
          // Guardar y disparar evento
          saveBadgeConfig(newConfig);
          window.dispatchEvent(new Event('xiwen_badge_config_changed'));
          return newConfig;
        });
      }

      // CRÍTICO: Guardar configuración global inmediatamente
      saveGlobalBadgeConfig(updated);
      window.dispatchEvent(new CustomEvent('globalBadgeConfigChange', { detail: updated }));

      return updated;
    });
    // FIX: Ya no reseteamos hasChanges - el usuario debe guardar explícitamente
    // para confirmar que todos los cambios están guardados
    setHasChanges(true);
  }, []);

  /**
   * Cambiar el estilo de TODOS los badges (solid/outline/soft/glass/gradient)
   * NOTA: Se guarda inmediatamente pero mantenemos hasChanges=true para consistencia UX
   */
  const updateAllBadgeStyles = useCallback((badgeStyle) => {
    setConfig((prev) => {
      const updated = {};
      Object.keys(prev).forEach((key) => {
        updated[key] = {
          ...prev[key],
          badgeStyle,
        };
      });

      // Guardar inmediatamente para que se aplique en tiempo real
      saveBadgeConfig(updated);
      window.dispatchEvent(new Event('xiwen_badge_config_changed'));
      logger.info(`All badges updated to style: ${badgeStyle}`, 'useBadgeConfig');

      return updated;
    });

    // CRÍTICO: También actualizar la configuración GLOBAL
    setGlobalConfig((prev) => {
      const updated = { ...prev, defaultBadgeStyle: badgeStyle };
      saveGlobalBadgeConfig(updated);
      window.dispatchEvent(new CustomEvent('globalBadgeConfigChange', { detail: updated }));
      logger.info(`Global badge style updated to: ${badgeStyle}`, 'useBadgeConfig');
      return updated;
    });

    // FIX: Mantenemos hasChanges=true para que el usuario vea que hubo cambios
    // y pueda confirmar con el botón "Guardar" (aunque ya se guardó en tiempo real)
    setHasChanges(true);
  }, []);

  /**
   * Guardar configuración actual (badges + iconos + global + presets)
   */
  const save = useCallback(() => {
    try {
      saveBadgeConfig(config);
      saveIconLibraryConfig(iconConfig);
      saveGlobalBadgeConfig(globalConfig);
      saveBadgePresetConfig(presetConfig);
      setHasChanges(false);
      window.dispatchEvent(new Event('xiwen_badge_config_changed'));
      window.dispatchEvent(new Event('badgePresetConfigChange'));
      logger.info('Badge configuration saved (including presets)', 'useBadgeConfig');
      return true;
    } catch (err) {
      logger.error('Error saving badge config:', err, 'useBadgeConfig');
      return false;
    }
  }, [config, iconConfig, globalConfig, presetConfig]);

  /**
   * Restaurar configuración por defecto (incluyendo presets)
   */
  const reset = useCallback(() => {
    resetBadgeConfig();
    resetIconLibraryConfig();
    resetBadgePresetConfig();
    localStorage.removeItem('xiwen_global_badge_config');
    setConfig(DEFAULT_BADGE_CONFIG);
    setIconConfig(DEFAULT_ICON_LIBRARY_CONFIG);
    setGlobalConfig(DEFAULT_GLOBAL_BADGE_CONFIG);
    setPresetConfig(DEFAULT_BADGE_PRESET_CONFIG);
    setHasChanges(false);
    window.dispatchEvent(new Event('xiwen_badge_config_changed'));
    window.dispatchEvent(new Event('badgePresetConfigChange'));
    logger.info('Badge configuration reset to defaults (including presets)', 'useBadgeConfig');
  }, []);

  /**
   * Actualizar color de un badge
   */
  const updateColor = useCallback((badgeKey, newColor) => {
    setConfig((prev) => {
      const badge = prev[badgeKey];
      if (!badge) {
        logger.warn(`Badge not found: ${badgeKey}`, 'useBadgeConfig');
        return prev;
      }

      return {
        ...prev,
        [badgeKey]: {
          ...badge,
          color: newColor,
        },
      };
    });
    setHasChanges(true);
  }, []);

  /**
   * Actualizar cualquier propiedad de un badge
   */
  const updateProperty = useCallback((badgeKey, property, value) => {
    setConfig((prev) => {
      const badge = prev[badgeKey];
      if (!badge) {
        logger.warn(`Badge not found: ${badgeKey}`, 'useBadgeConfig');
        return prev;
      }

      return {
        ...prev,
        [badgeKey]: {
          ...badge,
          [property]: value,
        },
      };
    });
    setHasChanges(true);
  }, []);

  /**
   * Agregar un nuevo badge custom
   */
  const addBadge = useCallback((category, key, badgeData) => {
    setConfig((prev) => {
      // Validar que no existe
      if (prev[key]) {
        logger.warn(`Badge already exists: ${key}`, 'useBadgeConfig');
        return prev;
      }

      const newBadge = {
        variant: 'default',
        color: '#71717a',
        label: badgeData.label || 'Nuevo',
        icon: badgeData.icon || '',
        description: badgeData.description || '',
        category,
        custom: true,
        ...badgeData,
      };

      return {
        ...prev,
        [key]: newBadge,
      };
    });
    setHasChanges(true);
    logger.info(`Custom badge added: ${key}`, 'useBadgeConfig');
  }, []);

  /**
   * Eliminar un badge custom
   */
  const removeBadge = useCallback((badgeKey) => {
    setConfig((prev) => {
      const badge = prev[badgeKey];

      // Solo permitir eliminar badges custom
      if (!badge) {
        logger.warn(`Badge not found: ${badgeKey}`, 'useBadgeConfig');
        return prev;
      }

      if (!badge.custom) {
        logger.warn(`Cannot remove system badge: ${badgeKey}`, 'useBadgeConfig');
        return prev;
      }

      const { [badgeKey]: removed, ...remaining } = prev;
      return remaining;
    });
    setHasChanges(true);
    logger.info(`Custom badge removed: ${badgeKey}`, 'useBadgeConfig');
  }, []);

  /**
   * Obtener un badge específico
   */
  const getBadge = useCallback(
    (badgeKey) => {
      return config[badgeKey] || null;
    },
    [config]
  );

  /**
   * Obtener todos los badges de una categoría
   */
  const getBadgesByCategory = useCallback(
    (categoryName) => {
      return Object.entries(config)
        .filter(([key, badge]) => badge.category === categoryName)
        .reduce((acc, [key, badge]) => {
          acc[key] = badge;
          return acc;
        }, {});
    },
    [config]
  );

  /**
   * Descartar cambios no guardados (incluyendo presets)
   */
  const discard = useCallback(() => {
    const saved = getBadgeConfig();
    const savedIconConfig = getIconLibraryConfig();
    const savedGlobalConfig = getGlobalBadgeConfig();
    const savedPresetConfig = getBadgePresetConfig();
    setConfig(saved);
    setIconConfig(savedIconConfig);
    setGlobalConfig(savedGlobalConfig);
    setPresetConfig(savedPresetConfig);
    setHasChanges(false);
    logger.info('Badge configuration changes discarded (including presets)', 'useBadgeConfig');
  }, []);

  /**
   * 🆕 Actualizar preset de una categoría
   * CRÍTICO: Guarda INMEDIATAMENTE para que los cambios se apliquen en tiempo real
   */
  const updateCategoryPreset = useCallback((category, presetName) => {
    setPresetConfig((prev) => {
      const updated = {
        ...prev,
        categories: {
          ...prev.categories,
          [category]: presetName,
        },
      };
      // CRÍTICO: Guardar inmediatamente en localStorage para aplicación en tiempo real
      saveBadgePresetConfig(updated);
      // Disparar evento para que CategoryBadge se actualice
      window.dispatchEvent(new CustomEvent('badgePresetConfigChange', { detail: updated }));
      logger.info(`Category ${category} preset set to: ${presetName} (saved immediately)`, 'useBadgeConfig');
      return updated;
    });
    setHasChanges(true);
  }, []);

  /**
   * 🆕 Actualizar override de preset individual
   * CRÍTICO: Guarda INMEDIATAMENTE para aplicación en tiempo real
   */
  const updateBadgePreset = useCallback((badgeKey, presetName) => {
    setPresetConfig((prev) => {
      const updated = {
        ...prev,
        overrides: {
          ...prev.overrides,
          [badgeKey]: presetName,
        },
      };
      // Guardar inmediatamente
      saveBadgePresetConfig(updated);
      window.dispatchEvent(new CustomEvent('badgePresetConfigChange', { detail: updated }));
      logger.info(`Badge ${badgeKey} preset override set to: ${presetName} (saved immediately)`, 'useBadgeConfig');
      return updated;
    });
    setHasChanges(true);
  }, []);

  /**
   * 🆕 Eliminar override de preset individual
   * CRÍTICO: Guarda INMEDIATAMENTE para aplicación en tiempo real
   */
  const removeBadgePreset = useCallback((badgeKey) => {
    setPresetConfig((prev) => {
      const { [badgeKey]: removed, ...remaining } = prev.overrides || {};
      const updated = {
        ...prev,
        overrides: remaining,
      };
      // Guardar inmediatamente
      saveBadgePresetConfig(updated);
      window.dispatchEvent(new CustomEvent('badgePresetConfigChange', { detail: updated }));
      logger.info(`Badge ${badgeKey} preset override removed (saved immediately)`, 'useBadgeConfig');
      return updated;
    });
    setHasChanges(true);
  }, []);

  /**
   * 🆕 Crear preset personalizado
   */
  const addCustomPreset = useCallback((name, presetData) => {
    setPresetConfig((prev) => ({
      ...prev,
      customPresets: {
        ...prev.customPresets,
        [name]: {
          name: presetData.name || name,
          description: presetData.description || '',
          icon: presetData.icon || '🎨',
          showIcon: presetData.showIcon !== false,
          showText: presetData.showText !== false,
          showBackground: presetData.showBackground !== false,
          enabled: presetData.enabled !== false,
          fontWeight: presetData.fontWeight || 'medium',
          custom: true,
        },
      },
    }));
    setHasChanges(true);
    logger.info(`Custom preset "${name}" created`, 'useBadgeConfig');
  }, []);

  /**
   * 🆕 Eliminar preset personalizado
   */
  const removeCustomPreset = useCallback((name) => {
    setPresetConfig((prev) => {
      const { [name]: removed, ...remaining } = prev.customPresets || {};
      return {
        ...prev,
        customPresets: remaining,
      };
    });
    setHasChanges(true);
    logger.info(`Custom preset "${name}" removed`, 'useBadgeConfig');
  }, []);

  return {
    // Estado
    config,
    iconConfig,
    globalConfig,
    presetConfig,
    hasChanges,
    categories: BADGE_CATEGORIES,
    defaults: DEFAULT_BADGE_CONFIG,
    displayPresets: BADGE_DISPLAY_PRESETS,

    // Funciones de lectura
    getBadge,
    getBadgesByCategory,
    getPresetForBadge,

    // Funciones de escritura (badges)
    save,
    reset,
    discard,
    updateColor,
    updateProperty,
    addBadge,
    removeBadge,

    // Funciones de escritura (iconos y estilos globales)
    updateIconLibrary,
    updateMonochromePalette,
    updateMonochromeColor,
    updateGlobalConfig,
    updateAllBadgeStyles,

    // 🆕 Funciones de escritura (presets)
    updateCategoryPreset,
    updateBadgePreset,
    removeBadgePreset,
    addCustomPreset,
    removeCustomPreset,
  };
}

export default useBadgeConfig;
