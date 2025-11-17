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
 * Hook para acceder a la configuración de cards
 */
export function useCardConfig() {
  const context = useContext(CardConfigContext);
  if (!context) {
    // Si no hay provider, retornar config por defecto
    return { config: cardVariants, reloadConfig: () => {} };
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
    <CardConfigContext.Provider value={{ config, reloadConfig }}>
      {children}
    </CardConfigContext.Provider>
  );
}
