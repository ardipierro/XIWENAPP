/**
 * @fileoverview useMediaQuery - Hook para detectar media queries y responsive breakpoints
 * @module hooks/useMediaQuery
 */

import { useState, useEffect } from 'react';

/**
 * Hook para detectar si una media query coincide
 * @param {string} query - Media query a evaluar (ej: '(max-width: 768px)')
 * @returns {boolean} - true si la media query coincide
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
 * const isDesktop = useMediaQuery('(min-width: 1025px)');
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    // Actualizar estado inicial
    setMatches(mediaQuery.matches);

    // Handler para cambios
    const handler = (event) => setMatches(event.matches);

    // Escuchar cambios (API moderna)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Fallback para navegadores antiguos
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
}

/**
 * Hook preconfigurado para detectar dispositivos móviles
 * @returns {boolean} - true si el viewport es móvil (≤768px)
 *
 * @example
 * const isMobile = useIsMobile();
 * if (isMobile) {
 *   // Renderizar versión móvil
 * }
 */
export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)');
}

/**
 * Hook preconfigurado para detectar tablets
 * @returns {boolean} - true si el viewport es tablet (769px - 1024px)
 */
export function useIsTablet() {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

/**
 * Hook preconfigurado para detectar desktop
 * @returns {boolean} - true si el viewport es desktop (≥1025px)
 */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 1025px)');
}

/**
 * Hook que retorna el breakpoint actual
 * @returns {'mobile' | 'tablet' | 'desktop'} - Breakpoint actual
 *
 * @example
 * const breakpoint = useBreakpoint();
 * if (breakpoint === 'mobile') {
 *   // Código específico para móvil
 * }
 */
export function useBreakpoint() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}

// Export default para compatibilidad
export default useMediaQuery;
