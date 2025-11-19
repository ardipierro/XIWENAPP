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
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar configuración al montar
  useEffect(() => {
    const loaded = getBadgeConfig();
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

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('xiwen_badge_config_changed', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('xiwen_badge_config_changed', handleStorageChange);
    };
  }, []);

  /**
   * Actualizar configuración de librería de iconos
   */
  const updateIconLibrary = useCallback((library) => {
    setIconConfig((prev) => ({ ...prev, library }));
    setHasChanges(true);
  }, []);

  /**
   * Cambiar el estilo de TODOS los badges (solid/outline)
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
      return updated;
    });
    setHasChanges(true);
    logger.info(`All badges updated to style: ${badgeStyle}`, 'useBadgeConfig');
  }, []);

  /**
   * Guardar configuración actual (badges + iconos)
   */
  const save = useCallback(() => {
    try {
      saveBadgeConfig(config);
      saveIconLibraryConfig(iconConfig);
      setHasChanges(false);
      window.dispatchEvent(new Event('xiwen_badge_config_changed'));
      logger.info('Badge configuration saved', 'useBadgeConfig');
      return true;
    } catch (err) {
      logger.error('Error saving badge config:', err, 'useBadgeConfig');
      return false;
    }
  }, [config, iconConfig]);

  /**
   * Restaurar configuración por defecto
   */
  const reset = useCallback(() => {
    resetBadgeConfig();
    resetIconLibraryConfig();
    setConfig(DEFAULT_BADGE_CONFIG);
    setIconConfig(DEFAULT_ICON_LIBRARY_CONFIG);
    setHasChanges(false);
    window.dispatchEvent(new Event('xiwen_badge_config_changed'));
    logger.info('Badge configuration reset to defaults', 'useBadgeConfig');
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
   * Descartar cambios no guardados
   */
  const discard = useCallback(() => {
    const saved = getBadgeConfig();
    const savedIconConfig = getIconLibraryConfig();
    setConfig(saved);
    setIconConfig(savedIconConfig);
    setHasChanges(false);
    logger.info('Badge configuration changes discarded', 'useBadgeConfig');
  }, []);

  return {
    // Estado
    config,
    iconConfig,
    hasChanges,
    categories: BADGE_CATEGORIES,
    defaults: DEFAULT_BADGE_CONFIG,

    // Funciones de lectura
    getBadge,
    getBadgesByCategory,

    // Funciones de escritura
    save,
    reset,
    discard,
    updateColor,
    updateProperty,
    addBadge,
    removeBadge,
    updateIconLibrary,
    updateAllBadgeStyles,
  };
}

export default useBadgeConfig;
