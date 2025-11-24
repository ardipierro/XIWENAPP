/**
 * @fileoverview CardConfigContext - Provee configuración global para todas las cards
 *
 * Este contexto carga configuración guardada de localStorage y la hace disponible
 * para todas las instancias de UniversalCard en la aplicación.
 *
 * Incluye control global de visibilidad de botones de eliminar.
 *
 * @module contexts/CardConfigContext
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cardVariants } from '../components/cards/cardConfig';

// Keys para localStorage
const STORAGE_KEYS = {
  CARD_CONFIG: 'xiwen_card_config',
  COMPONENT_MAPPING: 'xiwen_card_component_mapping',
  SHOW_DELETE_BUTTONS: 'xiwen_show_delete_buttons',
  CONTENT_DISPLAY_CONFIG: 'xiwen_content_display_config',
};

const CardConfigContext = createContext();

/**
 * Mapeo por defecto de componentes a variants
 * Cada key es el nombre de un componente/sección, y el value es el variant a usar
 */
const DEFAULT_COMPONENT_MAPPING = {
  'UnifiedContentManager': 'content',
  'UniversalUserManager': 'user',
  'StudentList': 'user',
  'UniversalDashboard': 'default',
  'TeacherDashboard': 'default',
  'StudentDashboard': 'default',
  'LiveClassRoom': 'class',
  'ClassScheduleManager': 'class',
  'UnifiedCalendar': 'class',
};

/**
 * Configuración por defecto para visualización de contenido
 * Controla cómo se muestran ejercicios, lecciones y otros contenidos en modales
 */
const DEFAULT_CONTENT_DISPLAY_CONFIG = {
  mode: 'compact', // 'compact' | 'detailed'
  showInternalHeader: false, // Si false, elimina el header redundante dentro del modal
  showMetadataBadges: true, // Mostrar badges de tipo/dificultad/puntos
  compactQuestions: true, // Preguntas sin header "Preguntas (N)"
  showInfoNote: false, // Nota informativa al final
  showInstructions: true, // Mostrar instrucciones/descripción del ejercicio
};

/**
 * Hook para acceder a la configuración de cards
 */
export function useCardConfig() {
  const context = useContext(CardConfigContext);
  if (!context) {
    // Si no hay provider, retornar config por defecto
    return {
      config: cardVariants,
      reloadConfig: () => {},
      componentMapping: DEFAULT_COMPONENT_MAPPING,
      updateComponentMapping: () => {},
      getComponentVariant: (name) => DEFAULT_COMPONENT_MAPPING[name] || 'default',
      // Estado global de botones de eliminar
      showDeleteButtons: true,
      toggleDeleteButtons: () => {},
      setShowDeleteButtons: () => {},
      // Configuración de visualización de contenido
      contentDisplayConfig: DEFAULT_CONTENT_DISPLAY_CONFIG,
      updateContentDisplayConfig: () => {},
    };
  }
  return context;
}

/**
 * Provider de configuración de cards
 *
 * Carga config guardado de localStorage y lo merge con defaults
 */
export function CardConfigProvider({ children }) {
  const [config, setConfig] = useState(() => {
    // Cargar configuración guardada de localStorage
    const savedConfig = localStorage.getItem(STORAGE_KEYS.CARD_CONFIG);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        // Merge saved config con defaults (por si hay nuevas propiedades)
        const merged = {};
        Object.keys(cardVariants).forEach(variant => {
          merged[variant] = {
            ...cardVariants[variant],
            ...(parsed[variant] || {})
          };
        });
        console.log('✅ Configuración de cards cargada desde localStorage');
        return merged;
      } catch (e) {
        console.error('❌ Error loading saved card config:', e);
        return {...cardVariants};
      }
    }
    return {...cardVariants};
  });

  // Mapeo de componentes a variants
  const [componentMapping, setComponentMapping] = useState(() => {
    const savedMapping = localStorage.getItem(STORAGE_KEYS.COMPONENT_MAPPING);
    if (savedMapping) {
      try {
        const parsed = JSON.parse(savedMapping);
        return { ...DEFAULT_COMPONENT_MAPPING, ...parsed };
      } catch (e) {
        console.error('❌ Error loading component mapping:', e);
        return DEFAULT_COMPONENT_MAPPING;
      }
    }
    return DEFAULT_COMPONENT_MAPPING;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Estado global de visibilidad de botones de eliminar
  // ═══════════════════════════════════════════════════════════════════════════
  const [showDeleteButtons, setShowDeleteButtonsState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOW_DELETE_BUTTONS);
    // Por defecto TRUE (mostrar botones)
    return saved !== null ? JSON.parse(saved) : true;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Configuración de visualización de contenido
  // ═══════════════════════════════════════════════════════════════════════════
  const [contentDisplayConfig, setContentDisplayConfigState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONTENT_DISPLAY_CONFIG);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_CONTENT_DISPLAY_CONFIG, ...parsed };
      } catch (e) {
        console.error('❌ Error loading content display config:', e);
        return DEFAULT_CONTENT_DISPLAY_CONFIG;
      }
    }
    return DEFAULT_CONTENT_DISPLAY_CONFIG;
  });

  /**
   * Toggle para mostrar/ocultar botones de eliminar globalmente
   */
  const toggleDeleteButtons = useCallback(() => {
    setShowDeleteButtonsState(prev => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEYS.SHOW_DELETE_BUTTONS, JSON.stringify(newValue));
      console.log(`🗑️ Botones de eliminar: ${newValue ? 'VISIBLE' : 'OCULTO'}`);
      return newValue;
    });
  }, []);

  /**
   * Setter directo para el estado de botones de eliminar
   */
  const setShowDeleteButtons = useCallback((value) => {
    const newValue = Boolean(value);
    setShowDeleteButtonsState(newValue);
    localStorage.setItem(STORAGE_KEYS.SHOW_DELETE_BUTTONS, JSON.stringify(newValue));
    console.log(`🗑️ Botones de eliminar: ${newValue ? 'VISIBLE' : 'OCULTO'}`);
  }, []);

  /**
   * Actualizar configuración de visualización de contenido
   * @param {Object} updates - Objeto con las propiedades a actualizar
   */
  const updateContentDisplayConfig = useCallback((updates) => {
    setContentDisplayConfigState(prev => {
      const newConfig = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEYS.CONTENT_DISPLAY_CONFIG, JSON.stringify(newConfig));
      console.log('📄 Configuración de visualización actualizada:', newConfig);
      return newConfig;
    });
  }, []);

  /**
   * Función para recargar la configuración desde localStorage
   * (útil después de guardar cambios en el configurator)
   */
  const reloadConfig = useCallback(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEYS.CARD_CONFIG);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        const merged = {};
        Object.keys(cardVariants).forEach(variant => {
          merged[variant] = {
            ...cardVariants[variant],
            ...(parsed[variant] || {})
          };
        });
        setConfig(merged);
        console.log('🔄 Configuración de cards recargada');
      } catch (e) {
        console.error('❌ Error reloading card config:', e);
      }
    } else {
      // Si no hay config guardado, volver a defaults
      setConfig({...cardVariants});
    }

    // También recargar estado de botones de eliminar
    const savedDeleteButtons = localStorage.getItem(STORAGE_KEYS.SHOW_DELETE_BUTTONS);
    if (savedDeleteButtons !== null) {
      setShowDeleteButtonsState(JSON.parse(savedDeleteButtons));
    }

    // Recargar configuración de visualización de contenido
    const savedContentDisplay = localStorage.getItem(STORAGE_KEYS.CONTENT_DISPLAY_CONFIG);
    if (savedContentDisplay) {
      try {
        const parsed = JSON.parse(savedContentDisplay);
        setContentDisplayConfigState({ ...DEFAULT_CONTENT_DISPLAY_CONFIG, ...parsed });
      } catch (e) {
        console.error('❌ Error reloading content display config:', e);
      }
    }
  }, []);

  /**
   * Función para actualizar el mapeo de un componente
   */
  const updateComponentMapping = useCallback((componentName, variant) => {
    setComponentMapping(prev => {
      const newMapping = { ...prev, [componentName]: variant };
      localStorage.setItem(STORAGE_KEYS.COMPONENT_MAPPING, JSON.stringify(newMapping));
      console.log(`🔄 Mapeo actualizado: ${componentName} → ${variant}`);
      return newMapping;
    });
  }, []);

  /**
   * Función para obtener el variant de un componente
   */
  const getComponentVariant = useCallback((componentName) => {
    return componentMapping[componentName] || 'default';
  }, [componentMapping]);

  // Escuchar cambios en localStorage (para sincronizar entre tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.CARD_CONFIG) {
        reloadConfig();
      }
      // Sincronizar estado de botones de eliminar entre tabs
      if (e.key === STORAGE_KEYS.SHOW_DELETE_BUTTONS) {
        const newValue = e.newValue !== null ? JSON.parse(e.newValue) : true;
        setShowDeleteButtonsState(newValue);
      }
      // Sincronizar configuración de visualización de contenido entre tabs
      if (e.key === STORAGE_KEYS.CONTENT_DISPLAY_CONFIG) {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : DEFAULT_CONTENT_DISPLAY_CONFIG;
          setContentDisplayConfigState({ ...DEFAULT_CONTENT_DISPLAY_CONFIG, ...newValue });
        } catch (err) {
          console.error('❌ Error syncing content display config:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [reloadConfig]);

  return (
    <CardConfigContext.Provider value={{
      config,
      reloadConfig,
      componentMapping,
      updateComponentMapping,
      getComponentVariant,
      // Estado global de botones de eliminar
      showDeleteButtons,
      toggleDeleteButtons,
      setShowDeleteButtons,
      // Configuración de visualización de contenido
      contentDisplayConfig,
      updateContentDisplayConfig,
    }}>
      {children}
    </CardConfigContext.Provider>
  );
}
