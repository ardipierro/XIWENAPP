import React, { useState } from 'react';
import { Highlighter, X } from 'lucide-react';

/**
 * HighlightPicker - Selector de color de resaltado con MODO ACTIVO
 *
 * @param {Function} onSelect - Callback cuando se selecciona un color
 * @param {Function} onClear - Callback para quitar resaltado
 * @param {boolean} activeMode - Si el modo resaltador está activo
 * @param {Function} onToggleMode - Callback para activar/desactivar modo
 * @param {string} currentColor - Color actual del resaltador
 */
export function HighlightPicker({
  onSelect,
  onClear,
  activeMode = false,
  onToggleMode,
  currentColor = '#FEF08A'
}) {
  const [showPicker, setShowPicker] = useState(false);

  // Presets de colores de resaltado
  const highlightPresets = [
    { name: 'Amarillo', value: '#FEF08A', textColor: '#713F12' },
    { name: 'Verde', value: '#BBF7D0', textColor: '#14532D' },
    { name: 'Azul', value: '#BFDBFE', textColor: '#1E3A8A' },
    { name: 'Rosa', value: '#FBCFE8', textColor: '#831843' },
    { name: 'Púrpura', value: '#E9D5FF', textColor: '#581C87' },
    { name: 'Naranja', value: '#FED7AA', textColor: '#7C2D12' },
  ];

  return (
    <div className="highlight-picker-container relative">
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg transition-all
          ${activeMode
            ? 'bg-yellow-400 text-yellow-900 border-2 border-yellow-600 shadow-lg scale-110'
            : 'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
        `}
        title={activeMode ? "Modo resaltador ACTIVO - Click para configurar" : "Resaltador"}
      >
        <Highlighter size={16} className={activeMode ? 'text-yellow-900' : 'text-gray-600 dark:text-gray-400'} />
        {activeMode && <span className="text-xs font-bold">ON</span>}
      </button>

      {/* Dropdown de presets */}
      {showPicker && (
        <div className="absolute top-full mt-2 z-50 bg-white dark:bg-gray-800 rounded-lg
                       shadow-xl border-2 border-gray-200 dark:border-gray-700 p-3 min-w-[240px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b
                         border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Resaltador
            </span>
            <button
              onClick={() => setShowPicker(false)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Botón activar/desactivar modo resaltador */}
          <button
            type="button"
            onClick={() => {
              if (onToggleMode) {
                onToggleMode(!activeMode);
              }
            }}
            className={`
              w-full px-3 py-2.5 rounded-lg text-center font-bold mb-3
              flex items-center justify-center gap-2 transition-all
              ${activeMode
                ? 'bg-yellow-400 text-yellow-900 border-2 border-yellow-600 shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600'
              }
            `}
          >
            <Highlighter size={18} />
            {activeMode ? '✓ Modo ACTIVO - Click para desactivar' : 'Activar Modo Resaltador'}
          </button>

          {activeMode && (
            <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                💡 Selecciona texto y se resaltará automáticamente con el color elegido
              </p>
            </div>
          )}

          {/* Presets */}
          <div className="space-y-2 mb-3">
            {highlightPresets.map((preset) => {
              const isSelected = preset.value === currentColor;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    onSelect(preset.value);
                    if (!activeMode) {
                      setShowPicker(false);
                    }
                  }}
                  className={`
                    w-full px-3 py-2 rounded-lg text-left font-medium transition-all
                    hover:scale-105 border-2
                    ${isSelected
                      ? 'border-gray-900 dark:border-white shadow-lg scale-105'
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                  style={{
                    backgroundColor: preset.value,
                    color: preset.textColor
                  }}
                >
                  {isSelected && '✓ '}{preset.name}
                </button>
              );
            })}
          </div>

          {/* Botón quitar resaltado */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                onClear();
                setShowPicker(false);
              }}
              className="w-full px-3 py-2 rounded-lg text-center font-medium
                       bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                       text-gray-700 dark:text-gray-300 transition-colors
                       flex items-center justify-center gap-2"
            >
              <X size={16} />
              Quitar Resaltado
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HighlightPicker;
