/**
 * @fileoverview Image Overlay Controls - Control panel for error visualization
 * @module components/homework/ImageOverlayControls
 */

import PropTypes from 'prop-types';
import {
  Eye,
  EyeOff
} from 'lucide-react';

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
    color: 'bg-gray-500',
    icon: '🔵'
  }
};

/**
 * Image Overlay Controls Component
 * Simplified control panel for error visualization
 *
 * @param {Object} props
 * @param {Object} props.visibleErrorTypes - Current visible error types
 * @param {function} props.onVisibleErrorTypesChange - Callback when types change
 * @param {number} props.highlightOpacity - Current opacity (0-1)
 * @param {function} props.onOpacityChange - Callback when opacity changes
 * @param {boolean} props.useWavyUnderline - Use wavy underlines
 * @param {function} props.onWavyUnderlineChange - Callback when wavy toggle changes
 * @param {boolean} props.showCorrectionText - Show AI correction text below errors
 * @param {function} props.onShowCorrectionTextChange - Callback when correction text toggle changes
 * @param {string} props.correctionTextFont - Font family for correction text
 * @param {function} props.onCorrectionTextFontChange - Callback when font changes
 * @param {Object} props.errorCounts - Count of each error type {spelling: 5, grammar: 3, ...}
 */
export default function ImageOverlayControls({
  visibleErrorTypes,
  onVisibleErrorTypesChange,
  highlightOpacity,
  onOpacityChange,
  useWavyUnderline,
  onWavyUnderlineChange,
  showCorrectionText = true,
  onShowCorrectionTextChange,
  correctionTextFont = 'Caveat',
  onCorrectionTextFontChange,
  errorCounts = {}
}) {
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

  const allVisible = Object.values(visibleErrorTypes).every(v => v);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3">
      {/* Error Type Toggles */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Filtrar errores
          </span>
          <button
            onClick={handleToggleAll}
            className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
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

      {/* Simplified Style Controls */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Estilo de resaltado
        </span>

        <div className="grid grid-cols-2 gap-2">
          {/* Intensity Selector */}
          <select
            value={highlightOpacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value={0.15}>Intensidad: Baja</option>
            <option value={0.25}>Intensidad: Media</option>
            <option value={0.40}>Intensidad: Alta</option>
          </select>

          {/* Wavy Toggle */}
          <select
            value={useWavyUnderline ? 'wavy' : 'straight'}
            onChange={(e) => onWavyUnderlineChange(e.target.value === 'wavy')}
            className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="straight">Subrayado: Recto</option>
            <option value="wavy">Subrayado: Ondulado</option>
          </select>
        </div>
      </div>

      {/* AI Correction Text Controls */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Correcciones escritas por IA
        </span>

        <div className="grid grid-cols-2 gap-2">
          {/* Show Correction Text Toggle */}
          <select
            value={showCorrectionText ? 'show' : 'hide'}
            onChange={(e) => onShowCorrectionTextChange(e.target.value === 'show')}
            className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="show">✍️ Mostrar texto</option>
            <option value="hide">👁️ Ocultar texto</option>
          </select>

          {/* Font Selector - Only enabled when correction text is shown */}
          <select
            value={correctionTextFont}
            onChange={(e) => onCorrectionTextFontChange(e.target.value)}
            disabled={!showCorrectionText}
            className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: showCorrectionText ? correctionTextFont : undefined }}
          >
            <option value="Caveat" style={{ fontFamily: 'Caveat' }}>Fuente: Caveat</option>
            <option value="Shadows Into Light" style={{ fontFamily: 'Shadows Into Light' }}>Fuente: Shadows</option>
            <option value="Indie Flower" style={{ fontFamily: 'Indie Flower' }}>Fuente: Indie</option>
            <option value="Patrick Hand" style={{ fontFamily: 'Patrick Hand' }}>Fuente: Patrick</option>
          </select>
        </div>

        {showCorrectionText && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            💡 La IA escribe la corrección debajo de cada error con fuente manuscrita
          </p>
        )}
      </div>
    </div>
  );
}

ImageOverlayControls.propTypes = {
  visibleErrorTypes: PropTypes.object.isRequired,
  onVisibleErrorTypesChange: PropTypes.func.isRequired,
  highlightOpacity: PropTypes.number.isRequired,
  onOpacityChange: PropTypes.func.isRequired,
  useWavyUnderline: PropTypes.bool.isRequired,
  onWavyUnderlineChange: PropTypes.func.isRequired,
  showCorrectionText: PropTypes.bool,
  onShowCorrectionTextChange: PropTypes.func,
  correctionTextFont: PropTypes.string,
  onCorrectionTextFontChange: PropTypes.func,
  errorCounts: PropTypes.object
};
