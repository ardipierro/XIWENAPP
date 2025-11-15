/**
 * @fileoverview Filters Panel for ContentReader
 * Panel de filtros avanzados por tipo, color y fecha
 * @module ContentReader/Panels/FiltersPanel
 */

import React from 'react';
import { Filter, X } from 'lucide-react';
import PropTypes from 'prop-types';
import { COLORS } from '../constants';

/**
 * Panel de filtros avanzados
 */
function FiltersPanel({
  activeFilters,
  onToggleTypeFilter,
  onToggleColorFilter,
  onDateChange,
  onClearFilters,
  onClose
}) {
  const hasActiveFilters =
    activeFilters.types.length > 0 ||
    activeFilters.colors.length > 0 ||
    activeFilters.dateFrom ||
    activeFilters.dateTo;

  const typeOptions = [
    { key: 'highlight', icon: '🖍️', label: 'Subrayados' },
    { key: 'note', icon: '📝', label: 'Notas' },
    { key: 'drawing', icon: '🎨', label: 'Dibujos' },
    { key: 'floatingText', icon: '✍️', label: 'Textos' }
  ];

  return (
    <div className="px-3 py-2 bg-gradient-to-r from-green-50 to-primary-50 dark:from-green-900/30 dark:to-primary-800/30 border-t border-primary-200 dark:border-primary-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-xs font-semibold text-primary-900 dark:text-primary-100">
            Filtros Avanzados
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              title="Limpiar todos los filtros"
            >
              Limpiar
            </button>
          )}
          <button
            onClick={onClose}
            className="icon-btn text-xs p-1"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filtros por tipo */}
      <div className="mb-3">
        <span className="text-xs font-medium text-primary-700 dark:text-primary-300 block mb-2">
          Por tipo:
        </span>
        <div className="grid grid-cols-2 gap-2">
          {typeOptions.map(option => (
            <label
              key={option.key}
              className="flex items-center gap-2 p-2 bg-white dark:bg-primary-900 rounded cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-800 transition-colors"
            >
              <input
                type="checkbox"
                checked={activeFilters.types.includes(option.key)}
                onChange={() => onToggleTypeFilter(option.key)}
                className="w-4 h-4 text-green-500 rounded focus:ring-2 focus:ring-green-500"
              />
              <span className="text-xs text-primary-700 dark:text-primary-300">
                {option.icon} {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Filtros por color */}
      <div className="mb-3">
        <span className="text-xs font-medium text-primary-700 dark:text-primary-300 block mb-2">
          Por color:
        </span>
        <div className="flex flex-wrap gap-2">
          {Object.entries(COLORS).map(([colorKey, colorData]) => (
            <button
              key={colorKey}
              onClick={() => onToggleColorFilter(colorKey)}
              className={`px-2 py-1 text-xs rounded border-2 transition-all ${
                activeFilters.colors.includes(colorKey)
                  ? 'border-green-500 scale-110 shadow-md'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: colorData.hex }}
              title={colorData.name}
              aria-label={`Filtrar por color ${colorData.name}`}
            >
              {activeFilters.colors.includes(colorKey) && (
                <span className="text-white font-bold drop-shadow">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros por fecha */}
      <div>
        <span className="text-xs font-medium text-primary-700 dark:text-primary-300 block mb-2">
          Por fecha:
        </span>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-primary-600 dark:text-primary-400 block mb-1">
              Desde:
            </label>
            <input
              type="date"
              value={activeFilters.dateFrom || ''}
              onChange={(e) => onDateChange('from', e.target.value)}
              className="w-full px-2 py-1 text-xs bg-white dark:bg-primary-900 border border-primary-300 dark:border-primary-600 rounded focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="text-xs text-primary-600 dark:text-primary-400 block mb-1">
              Hasta:
            </label>
            <input
              type="date"
              value={activeFilters.dateTo || ''}
              onChange={(e) => onDateChange('to', e.target.value)}
              className="w-full px-2 py-1 text-xs bg-white dark:bg-primary-900 border border-primary-300 dark:border-primary-600 rounded focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Indicador de filtros activos */}
      {hasActiveFilters && (
        <div className="mt-3 p-2 bg-green-100 dark:bg-green-900/30 rounded text-xs text-center">
          <span className="font-semibold text-green-700 dark:text-green-300">
            🔍 Filtros activos - Mostrando resultados filtrados
          </span>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-700">
        <p className="text-xs text-primary-600 dark:text-primary-400 text-center">
          💡 Atajo: Ctrl+Shift+F
        </p>
      </div>
    </div>
  );
}

FiltersPanel.propTypes = {
  activeFilters: PropTypes.shape({
    types: PropTypes.arrayOf(PropTypes.string).isRequired,
    colors: PropTypes.arrayOf(PropTypes.string).isRequired,
    dateFrom: PropTypes.string,
    dateTo: PropTypes.string
  }).isRequired,
  onToggleTypeFilter: PropTypes.func.isRequired,
  onToggleColorFilter: PropTypes.func.isRequired,
  onDateChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default FiltersPanel;
