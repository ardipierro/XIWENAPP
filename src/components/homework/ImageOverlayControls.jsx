/**
 * @fileoverview Image Overlay Controls - Control panel for error visualization
 * @module components/homework/ImageOverlayControls
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { BaseButton } from '../common';

/**
 * Error type configuration
 */
const ERROR_TYPE_CONFIG = {
  spelling: {
    label: 'Ortografía',
    color: 'bg-red-500',
    icon: '🔴'
  },
  grammar: {
    label: 'Gramática',
    color: 'bg-orange-500',
    icon: '🟠'
  },
  punctuation: {
    label: 'Puntuación',
    color: 'bg-yellow-500',
    icon: '🟡'
  },
  vocabulary: {
    label: 'Vocabulario',
    color: 'bg-blue-500',
    icon: '🔵'
  }
};

/**
 * Image Overlay Controls Component
 * Control panel for adjusting error visualization
 *
 * @param {Object} props
 * @param {Object} props.visibleErrorTypes - Current visible error types
 * @param {function} props.onVisibleErrorTypesChange - Callback when types change
 * @param {number} props.highlightOpacity - Current opacity (0-1)
 * @param {function} props.onOpacityChange - Callback when opacity changes
 * @param {number} props.zoom - Current zoom level
 * @param {function} props.onZoomChange - Callback when zoom changes
 * @param {boolean} props.useWavyUnderline - Use wavy underlines
 * @param {function} props.onWavyUnderlineChange - Callback when wavy toggle changes
 * @param {boolean} props.showCorrectionText - Show AI correction text below errors
 * @param {function} props.onShowCorrectionTextChange - Callback when correction text toggle changes
 * @param {string} props.correctionTextFont - Font family for correction text
 * @param {function} props.onCorrectionTextFontChange - Callback when font changes
 * @param {Object} props.errorCounts - Count of each error type {spelling: 5, grammar: 3, ...}
 * @param {boolean} props.compact - Compact mode (no labels)
 */
export default function ImageOverlayControls({
  visibleErrorTypes,
  onVisibleErrorTypesChange,
  highlightOpacity,
  onOpacityChange,
  zoom,
  onZoomChange,
  useWavyUnderline,
  onWavyUnderlineChange,
  showCorrectionText = true,
  onShowCorrectionTextChange,
  correctionTextFont = 'Caveat',
  onCorrectionTextFontChange,
  errorCounts = {},
  compact = false
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggleErrorType = (type) => {
    onVisibleErrorTypesChange({
      ...visibleErrorTypes,
      [type]: !visibleErrorTypes[type]
    });
  };

  const handleToggleAll = () => {
    const allVisible = Object.values(visibleErrorTypes).every(v => v);
    const newState = {};
    Object.keys(visibleErrorTypes).forEach(type => {
      newState[type] = !allVisible;
    });
    onVisibleErrorTypesChange(newState);
  };

  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom + 0.25, 3));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    onZoomChange(1);
  };

  const allVisible = Object.values(visibleErrorTypes).every(v => v);
  const someVisible = Object.values(visibleErrorTypes).some(v => v);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3">
      {/* Error Type Toggles */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Tipos de Error
          </span>
          <button
            onClick={handleToggleAll}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {allVisible ? 'Ocultar todo' : 'Mostrar todo'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(ERROR_TYPE_CONFIG).map(([type, config]) => {
            const count = errorCounts[type] || 0;
            const isVisible = visibleErrorTypes[type];

            return (
              <button
                key={type}
                onClick={() => handleToggleErrorType(type)}
                disabled={count === 0}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isVisible
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-500 border-2 border-transparent'
                  }
                  ${count === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'}
                `}
              >
                {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                <span className={`w-3 h-3 rounded-full ${config.color}`} />
                <span className="flex-1 text-left">{config.label}</span>
                <span className="text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Zoom
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {(zoom * 100).toFixed(0)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          <BaseButton
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut size={16} />
          </BaseButton>

          <input
            type="range"
            min="50"
            max="300"
            step="25"
            value={zoom * 100}
            onChange={(e) => onZoomChange(e.target.value / 100)}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />

          <BaseButton
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <ZoomIn size={16} />
          </BaseButton>

          {zoom !== 1 && (
            <BaseButton
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
            >
              <Maximize2 size={16} />
            </BaseButton>
          )}
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center justify-between w-full px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <span className="flex items-center gap-1">
          <Settings size={14} />
          Configuración Avanzada
        </span>
        {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          {/* Opacity Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Intensidad del Resaltado
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {(highlightOpacity * 100).toFixed(0)}%
              </span>
            </div>

            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={highlightOpacity * 100}
              onChange={(e) => onOpacityChange(e.target.value / 100)}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Wavy Underline Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Subrayado Ondulado
            </span>
            <button
              onClick={() => onWavyUnderlineChange(!useWavyUnderline)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${useWavyUnderline ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${useWavyUnderline ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {useWavyUnderline
              ? '✨ Subrayado estilo Word activado'
              : 'Subrayado recto activado'
            }
          </p>

          {/* Correction Text Toggle */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Mostrar Correcciones Escritas
              </span>
              <button
                onClick={() => onShowCorrectionTextChange(!showCorrectionText)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${showCorrectionText ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${showCorrectionText ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {showCorrectionText
                ? '✍️ La IA escribe correcciones debajo de errores'
                : 'Correcciones escritas ocultas'
              }
            </p>
          </div>

          {/* Font Selector - Only shown when correction text is enabled */}
          {showCorrectionText && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Fuente de Escritura
              </label>
              <select
                value={correctionTextFont}
                onChange={(e) => onCorrectionTextFontChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ fontFamily: correctionTextFont }}
              >
                <option value="Caveat" style={{ fontFamily: 'Caveat' }}>
                  Caveat (Semicursiva profesional)
                </option>
                <option value="Shadows Into Light" style={{ fontFamily: 'Shadows Into Light' }}>
                  Shadows Into Light (Cursiva clara)
                </option>
                <option value="Indie Flower" style={{ fontFamily: 'Indie Flower' }}>
                  Indie Flower (Natural manuscrita)
                </option>
                <option value="Patrick Hand" style={{ fontFamily: 'Patrick Hand' }}>
                  Patrick Hand (Handwriting casual)
                </option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                La fuente se ajusta automáticamente al tamaño del error
              </p>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>
            {Object.values(visibleErrorTypes).filter(v => v).length} de {Object.keys(visibleErrorTypes).length} tipos visibles
          </span>
          <span>
            {Object.values(errorCounts).reduce((sum, count) => sum + count, 0)} errores totales
          </span>
        </div>
      </div>
    </div>
  );
}

ImageOverlayControls.propTypes = {
  visibleErrorTypes: PropTypes.object.isRequired,
  onVisibleErrorTypesChange: PropTypes.func.isRequired,
  highlightOpacity: PropTypes.number.isRequired,
  onOpacityChange: PropTypes.func.isRequired,
  zoom: PropTypes.number.isRequired,
  onZoomChange: PropTypes.func.isRequired,
  useWavyUnderline: PropTypes.bool.isRequired,
  onWavyUnderlineChange: PropTypes.func.isRequired,
  showCorrectionText: PropTypes.bool,
  onShowCorrectionTextChange: PropTypes.func,
  correctionTextFont: PropTypes.string,
  onCorrectionTextFontChange: PropTypes.func,
  errorCounts: PropTypes.object,
  compact: PropTypes.bool
};
