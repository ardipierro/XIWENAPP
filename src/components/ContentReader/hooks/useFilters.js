/**
 * @fileoverview Hook for filtering annotations
 * Filtros avanzados por fecha, color, tipo
 * @module hooks/useFilters
 */

import { useState, useCallback, useMemo } from 'react';
import logger from '../../../utils/logger';

/**
 * Custom hook para filtrado de anotaciones
 * @param {Object} annotations - Objeto con highlights, notes, drawings, floatingTexts
 * @returns {Object} Estado y funciones de filtrado
 */
export function useFilters(annotations) {
  const [activeFilters, setActiveFilters] = useState({
    dateFrom: null,
    dateTo: null,
    colors: [], // ['yellow', 'blue', etc.]
    types: [] // ['highlight', 'note', 'drawing', 'floatingText']
  });

  /**
   * Aplicar filtros a las anotaciones
   */
  const filteredAnnotations = useMemo(() => {
    const { dateFrom, dateTo, colors, types } = activeFilters;

    const filtered = {
      highlights: [],
      notes: [],
      drawings: [],
      floatingTexts: []
    };

    // Helper para verificar si pasa los filtros de fecha
    const passesDateFilter = (timestamp) => {
      if (!timestamp) return true;
      const date = new Date(timestamp);
      if (dateFrom && date < new Date(dateFrom)) return false;
      if (dateTo && date > new Date(dateTo)) return false;
      return true;
    };

    // Helper para verificar si pasa los filtros de color
    const passesColorFilter = (color) => {
      if (colors.length === 0) return true;
      return colors.includes(color);
    };

    // Helper para verificar si el tipo está activo
    const isTypeActive = (type) => {
      if (types.length === 0) return true;
      return types.includes(type);
    };

    // Filtrar highlights
    if (isTypeActive('highlight')) {
      filtered.highlights = annotations.highlights.filter(h =>
        passesDateFilter(h.timestamp) && passesColorFilter(h.color)
      );
    }

    // Filtrar notes
    if (isTypeActive('note')) {
      filtered.notes = annotations.notes.filter(n =>
        passesDateFilter(n.timestamp) && passesColorFilter(n.color)
      );
    }

    // Filtrar drawings
    if (isTypeActive('drawing')) {
      filtered.drawings = annotations.drawings.filter(d =>
        passesDateFilter(d.timestamp) && passesColorFilter(d.color)
      );
    }

    // Filtrar floating texts
    if (isTypeActive('floatingText')) {
      filtered.floatingTexts = annotations.floatingTexts.filter(t =>
        passesDateFilter(t.timestamp) && passesColorFilter(t.color)
      );
    }

    return filtered;
  }, [annotations, activeFilters]);

  /**
   * Toggle filtro de tipo
   */
  const toggleTypeFilter = useCallback((type) => {
    setActiveFilters(prev => {
      const types = prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type];

      logger.info(`Type filter toggled: ${type}`, 'useFilters');
      return { ...prev, types };
    });
  }, []);

  /**
   * Toggle filtro de color
   */
  const toggleColorFilter = useCallback((color) => {
    setActiveFilters(prev => {
      const colors = prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color];

      logger.info(`Color filter toggled: ${color}`, 'useFilters');
      return { ...prev, colors };
    });
  }, []);

  /**
   * Establecer rango de fechas
   */
  const setDateRange = useCallback((dateFrom, dateTo) => {
    setActiveFilters(prev => ({
      ...prev,
      dateFrom,
      dateTo
    }));
    logger.info(`Date range set: ${dateFrom} to ${dateTo}`, 'useFilters');
  }, []);

  /**
   * Limpiar todos los filtros
   */
  const clearFilters = useCallback(() => {
    setActiveFilters({
      dateFrom: null,
      dateTo: null,
      colors: [],
      types: []
    });
    logger.info('All filters cleared', 'useFilters');
  }, []);

  /**
   * Limpiar filtros de tipo
   */
  const clearTypeFilters = useCallback(() => {
    setActiveFilters(prev => ({ ...prev, types: [] }));
  }, []);

  /**
   * Limpiar filtros de color
   */
  const clearColorFilters = useCallback(() => {
    setActiveFilters(prev => ({ ...prev, colors: [] }));
  }, []);

  /**
   * Limpiar filtros de fecha
   */
  const clearDateFilters = useCallback(() => {
    setActiveFilters(prev => ({
      ...prev,
      dateFrom: null,
      dateTo: null
    }));
  }, []);

  /**
   * Verificar si un filtro está activo
   */
  const isFilterActive = useCallback((filterType, value) => {
    if (filterType === 'type') {
      return activeFilters.types.includes(value);
    }
    if (filterType === 'color') {
      return activeFilters.colors.includes(value);
    }
    return false;
  }, [activeFilters]);

  /**
   * Estadísticas de filtros
   */
  const stats = useMemo(() => {
    const hasActiveFilters =
      activeFilters.types.length > 0 ||
      activeFilters.colors.length > 0 ||
      activeFilters.dateFrom ||
      activeFilters.dateTo;

    const counts = {
      highlights: filteredAnnotations.highlights.length,
      notes: filteredAnnotations.notes.length,
      drawings: filteredAnnotations.drawings.length,
      floatingTexts: filteredAnnotations.floatingTexts.length
    };

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    const originalTotal =
      annotations.highlights.length +
      annotations.notes.length +
      annotations.drawings.length +
      annotations.floatingTexts.length;

    return {
      hasActiveFilters,
      counts,
      total,
      originalTotal,
      filtered: originalTotal - total
    };
  }, [filteredAnnotations, annotations, activeFilters]);

  return {
    // Filter state
    activeFilters,
    filteredAnnotations,
    stats,

    // Filter actions
    toggleTypeFilter,
    toggleColorFilter,
    setDateRange,
    clearFilters,
    clearTypeFilters,
    clearColorFilters,
    clearDateFilters,
    isFilterActive
  };
}

export default useFilters;
