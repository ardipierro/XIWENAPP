/**
 * @fileoverview Search Panel for ContentReader
 * Panel de búsqueda en anotaciones
 * @module ContentReader/Panels/SearchPanel
 */

import React from 'react';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Panel de búsqueda en anotaciones
 */
function SearchPanel({
  searchQuery,
  onSearchChange,
  searchResults,
  currentSearchIndex,
  onNavigate,
  onClose
}) {
  const currentResult = searchResults[currentSearchIndex];

  /**
   * Obtener icono del tipo de resultado
   */
  const getResultIcon = (type) => {
    switch (type) {
      case 'highlight': return '🖍️ Subrayado';
      case 'note': return '📝 Nota';
      case 'floatingText': return '✍️ Texto';
      default: return '📄';
    }
  };

  return (
    <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-primary-50 dark:from-blue-900/30 dark:to-primary-800/30 border-t border-primary-200 dark:border-primary-700">
      {/* Search Input */}
      <div className="flex items-center gap-3">
        <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar en anotaciones..."
          className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-primary-900 border border-primary-300 dark:border-primary-600 rounded focus:ring-2 focus:ring-blue-500"
          autoFocus
        />

        {/* Navigation Controls */}
        {searchResults.length > 0 && (
          <>
            <span className="text-xs text-primary-700 dark:text-primary-300 whitespace-nowrap">
              {currentSearchIndex + 1} / {searchResults.length}
            </span>
            <button
              onClick={() => onNavigate('prev')}
              className="icon-btn text-xs p-1"
              title="Anterior (Shift+Enter)"
              disabled={searchResults.length === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('next')}
              className="icon-btn text-xs p-1"
              title="Siguiente (Enter)"
              disabled={searchResults.length === 0}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="icon-btn text-xs p-1"
          title="Cerrar (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Current Result Preview */}
      {searchResults.length > 0 && currentResult && (
        <div className="mt-2 p-2 bg-white dark:bg-primary-900 rounded text-xs">
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {getResultIcon(currentResult.type)}
          </span>
          <p className="mt-1 text-primary-700 dark:text-primary-300">
            {currentResult.preview}
            {currentResult.preview.length >= 100 && '...'}
          </p>
        </div>
      )}

      {/* No Results */}
      {searchQuery && searchResults.length === 0 && (
        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-center">
          <span className="text-yellow-700 dark:text-yellow-300">
            No se encontraron resultados para "{searchQuery}"
          </span>
        </div>
      )}
    </div>
  );
}

SearchPanel.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  searchResults: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    text: PropTypes.string,
    preview: PropTypes.string
  })).isRequired,
  currentSearchIndex: PropTypes.number.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default SearchPanel;
