/**
 * @fileoverview Layers Panel for ContentReader
 * Panel para controlar visibilidad de capas de anotaciones
 * @module ContentReader/Panels/LayersPanel
 */

import React from 'react';
import { Layers, X } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Panel de control de capas
 */
function LayersPanel({
  layersVisible,
  onToggleLayer,
  annotationCounts,
  onClose
}) {
  const layers = [
    {
      key: 'highlights',
      icon: '🖍️',
      label: 'Subrayados',
      count: annotationCounts.highlights
    },
    {
      key: 'notes',
      icon: '📝',
      label: 'Notas',
      count: annotationCounts.notes
    },
    {
      key: 'drawings',
      icon: '🎨',
      label: 'Dibujos',
      count: annotationCounts.drawings
    },
    {
      key: 'floatingTexts',
      icon: '✍️',
      label: 'Textos',
      count: annotationCounts.floatingTexts
    }
  ];

  return (
    <div className="px-3 py-2 bg-gradient-to-r from-purple-50 to-primary-50 dark:from-purple-900/30 dark:to-primary-800/30 border-t border-primary-200 dark:border-primary-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          <span className="text-xs font-semibold text-primary-900 dark:text-primary-100">
            Capas Visibles
          </span>
        </div>
        <button
          onClick={onClose}
          className="icon-btn text-xs p-1"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Layer Toggles */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {layers.map(layer => (
          <label
            key={layer.key}
            className="flex items-center gap-2 p-2 bg-white dark:bg-primary-900 rounded cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-800 transition-colors"
          >
            <input
              type="checkbox"
              checked={layersVisible[layer.key]}
              onChange={() => onToggleLayer(layer.key)}
              className="w-4 h-4 text-accent-500 rounded focus:ring-2 focus:ring-accent-500"
            />
            <span className="text-xs text-primary-700 dark:text-primary-300">
              {layer.icon} {layer.label} ({layer.count})
            </span>
          </label>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-2 p-2 bg-purple-100 dark:bg-purple-900/30 rounded text-xs text-center">
        <span className="font-semibold text-purple-700 dark:text-purple-300">
          Total: {Object.values(annotationCounts).reduce((sum, count) => sum + count, 0)} anotaciones
        </span>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-700">
        <p className="text-xs text-primary-600 dark:text-primary-400 text-center">
          💡 Atajos: Ctrl+1, Ctrl+2, Ctrl+3, Ctrl+4
        </p>
      </div>
    </div>
  );
}

LayersPanel.propTypes = {
  layersVisible: PropTypes.shape({
    highlights: PropTypes.bool.isRequired,
    notes: PropTypes.bool.isRequired,
    drawings: PropTypes.bool.isRequired,
    floatingTexts: PropTypes.bool.isRequired
  }).isRequired,
  onToggleLayer: PropTypes.func.isRequired,
  annotationCounts: PropTypes.shape({
    highlights: PropTypes.number.isRequired,
    notes: PropTypes.number.isRequired,
    drawings: PropTypes.number.isRequired,
    floatingTexts: PropTypes.number.isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired
};

export default LayersPanel;
