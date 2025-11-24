/**
 * @fileoverview CardConfigContext - Provee configuración global para todas las cards
 *
 * Este contexto carga configuración guardada de localStorage y la hace disponible
 * para todas las instancias de UniversalCard en la aplicación.
 *
 * Incluye "Modo Edición" para mostrar botones de eliminar en tarjetas.
 * - Por defecto: OFF (tarjetas limpias)
 * - Activado: Muestra botones de eliminar en tarjetas para limpieza rápida
 * - NO persiste entre sesiones (siempre arranca en modo normal)
 *
 * @module contexts/CardConfigContext
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cardVariants } from '../components/cards/cardConfig';

// Keys para localStorage (editMode NO usa localStorage - no persiste)
const STORAGE_KEYS = {
  CARD_CONFIG: 'xiwen_card_config',
  COMPONENT_MAPPING: 'xiwen_card_component_mapping',
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
      // Modo Edición - muestra botones de eliminar en tarjetas
      editMode: false,
      toggleEditMode: () => {},
      setEditMode: () => {},
      // Aliases para compatibilidad (deprecated - usar editMode)
      showDeleteButtons: false,
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
  // Modo Edición - Muestra botones de eliminar en tarjetas
  // Por defecto OFF, NO persiste entre sesiones
  // ═══════════════════════════════════════════════════════════════════════════
  const [editMode, setEditModeState] = useState(false);

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
   * Toggle para activar/desactivar modo edición
   */
  const toggleEditMode = useCallback(() => {
    setEditModeState(prev => {
      const newValue = !prev;
      console.log(`✏️ Modo Edición: ${newValue ? 'ACTIVADO' : 'DESACTIVADO'}`);
      return newValue;
    });
  }, []);

  /**
   * Setter directo para el modo edición
   */
  const setEditMode = useCallback((value) => {
    const newValue = Boolean(value);
    setEditModeState(newValue);
    console.log(`✏️ Modo Edición: ${newValue ? 'ACTIVADO' : 'DESACTIVADO'}`);
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

    // Nota: editMode NO se recarga - siempre arranca en false

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
      // Modo Edición - muestra botones de eliminar en tarjetas
      editMode,
      toggleEditMode,
      setEditMode,
      // Aliases para compatibilidad (deprecated - usar editMode)
      showDeleteButtons: editMode,
      toggleDeleteButtons: toggleEditMode,
      setShowDeleteButtons: setEditMode,
      // Configuración de visualización de contenido
      contentDisplayConfig,
      updateContentDisplayConfig,
    }}>
      {children}
    </CardConfigContext.Provider>
  );
}

export { DEFAULT_CONTENT_DISPLAY_CONFIG };
