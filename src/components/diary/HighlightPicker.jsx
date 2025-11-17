import React, { useState } from 'react';
import { Highlighter, X } from 'lucide-react';

/**
 * HighlightPicker - Selector de color de resaltado
 *
 * @param {Function} onSelect - Callback cuando se selecciona un color
 * @param {Function} onClear - Callback para quitar resaltado
 */
export function HighlightPicker({ onSelect, onClear }) {
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
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-700
                   border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400
                   dark:hover:border-gray-500 transition-colors"
        title="Resaltador"
      >
        <Highlighter size={16} className="text-gray-600 dark:text-gray-400" />
      </button>

      {/* Dropdown de presets */}
      {showPicker && (
        <div className="absolute top-full mt-2 z-50 bg-white dark:bg-gray-800 rounded-lg
                       shadow-xl border-2 border-gray-200 dark:border-gray-700 p-3 min-w-[200px]">
          {/* Header */}
          <div className="mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-1">
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
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              💡 Selecciona texto primero, luego elige un color
            </p>
          </div>

          {/* Presets */}
          <div className="space-y-2 mb-3">
            {highlightPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  onSelect(preset.value);
                  setShowPicker(false);
                }}
                className="w-full px-3 py-2 rounded-lg text-left font-medium transition-all
                         hover:scale-105 border-2 border-transparent hover:border-gray-300
                         dark:hover:border-gray-600"
                style={{
                  backgroundColor: preset.value,
                  color: preset.textColor
                }}
              >
                {preset.name}
              </button>
            ))}
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
