/**
 * @fileoverview Hook for searching in content and annotations
 * Búsqueda en contenido, highlights, notes, y textos flotantes
 * @module hooks/useSearch
 */

import { useState, useCallback, useMemo } from 'react';
import logger from '../../../utils/logger';

/**
 * Custom hook para búsqueda en anotaciones
 * @param {Object} annotations - Objeto con highlights, notes, drawings, floatingTexts
 * @returns {Object} Estado y funciones de búsqueda
 */
export function useSearch(annotations) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  /**
   * Realizar búsqueda en todas las anotaciones
   */
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const results = [];
    const lowerQuery = searchQuery.toLowerCase();

    // Buscar en highlights
    annotations.highlights.forEach(highlight => {
      if (highlight.text && highlight.text.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'highlight',
          id: highlight.id,
          text: highlight.text,
          preview: highlight.text.substring(0, 100),
          timestamp: highlight.timestamp
        });
      }
    });

    // Buscar en notas
    annotations.notes.forEach(note => {
      if (note.text && note.text.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'note',
          id: note.id,
          text: note.text,
          preview: note.text.substring(0, 100),
          timestamp: note.timestamp
        });
      }
    });

    // Buscar en textos flotantes
    annotations.floatingTexts.forEach(text => {
      if (text.text && text.text.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'floatingText',
          id: text.id,
          text: text.text,
          preview: text.text,
          timestamp: text.timestamp
        });
      }
    });

    // Ordenar por timestamp (más recientes primero)
    results.sort((a, b) => b.timestamp - a.timestamp);

    return results;
  }, [searchQuery, annotations]);

  /**
   * Realizar búsqueda
   */
  const search = useCallback((query) => {
    setSearchQuery(query);
    setCurrentSearchIndex(0);
    logger.info(`Searching for: "${query}" - Found ${searchResults.length} results`, 'useSearch');
  }, [searchResults.length]);

  /**
   * Limpiar búsqueda
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setCurrentSearchIndex(0);
  }, []);

  /**
   * Navegar al siguiente resultado
   */
  const nextResult = useCallback(() => {
    if (searchResults.length === 0) return;

    setCurrentSearchIndex(prev => (prev + 1) % searchResults.length);
  }, [searchResults.length]);

  /**
   * Navegar al resultado anterior
   */
  const previousResult = useCallback(() => {
    if (searchResults.length === 0) return;

    setCurrentSearchIndex(prev => prev === 0 ? searchResults.length - 1 : prev - 1);
  }, [searchResults.length]);

  /**
   * Ir a un resultado específico
   */
  const goToResult = useCallback((index) => {
    if (index >= 0 && index < searchResults.length) {
      setCurrentSearchIndex(index);
    }
  }, [searchResults.length]);

  /**
   * Obtener resultado actual
   */
  const currentResult = useMemo(() => {
    if (searchResults.length === 0) return null;
    return searchResults[currentSearchIndex];
  }, [searchResults, currentSearchIndex]);

  /**
   * Estadísticas de búsqueda
   */
  const stats = useMemo(() => ({
    total: searchResults.length,
    currentIndex: currentSearchIndex + 1,
    hasResults: searchResults.length > 0,
    byType: {
      highlights: searchResults.filter(r => r.type === 'highlight').length,
      notes: searchResults.filter(r => r.type === 'note').length,
      floatingTexts: searchResults.filter(r => r.type === 'floatingText').length
    }
  }), [searchResults, currentSearchIndex]);

  return {
    // Search state
    searchQuery,
    setSearchQuery,
    searchResults,
    currentSearchIndex,
    currentResult,
    stats,

    // Search actions
    search,
    clearSearch,
    nextResult,
    previousResult,
    goToResult
  };
}

export default useSearch;
