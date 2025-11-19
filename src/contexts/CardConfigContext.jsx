/**
 * @fileoverview CardConfigContext - Provee configuración global para todas las cards
 *
 * Este contexto carga configuración guardada de localStorage y la hace disponible
 * para todas las instancias de UniversalCard en la aplicación.
 *
 * @module contexts/CardConfigContext
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { cardVariants } from '../components/cards/cardConfig';

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
      getComponentVariant: (name) => DEFAULT_COMPONENT_MAPPING[name] || 'default'
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
    const savedConfig = localStorage.getItem('xiwen_card_config');
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
    const savedMapping = localStorage.getItem('xiwen_card_component_mapping');
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

  /**
   * Función para recargar la configuración desde localStorage
   * (útil después de guardar cambios en el configurator)
   */
  const reloadConfig = () => {
    const savedConfig = localStorage.getItem('xiwen_card_config');
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
  };

  /**
   * Función para actualizar el mapeo de un componente
   */
  const updateComponentMapping = (componentName, variant) => {
    const newMapping = { ...componentMapping, [componentName]: variant };
    setComponentMapping(newMapping);
    localStorage.setItem('xiwen_card_component_mapping', JSON.stringify(newMapping));
    console.log(`🔄 Mapeo actualizado: ${componentName} → ${variant}`);
  };

  /**
   * Función para obtener el variant de un componente
   */
  const getComponentVariant = (componentName) => {
    return componentMapping[componentName] || 'default';
  };

  // Escuchar cambios en localStorage (para sincronizar entre tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'xiwen_card_config') {
        reloadConfig();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <CardConfigContext.Provider value={{
      config,
      reloadConfig,
      componentMapping,
      updateComponentMapping,
      getComponentVariant
    }}>
      {children}
    </CardConfigContext.Provider>
  );
}
