import React, { useState } from 'react';
import { Highlighter, X } from 'lucide-react';
import { UnifiedToolbarButton } from './UnifiedToolbarButton';

/**
 * HighlightPicker - Selector de resaltado SIMPLIFICADO (sin modo activo)
 *
 * LÓGICA SIMPLE:
 * 1. Click en botón → Abre menú
 * 2. Selecciona color → Resalta texto seleccionado → Cierra menú
 * 3. Click en "Quitar resaltado" → Quita resaltado → Cierra menú
 *
 * @param {Function} onSelect - Callback cuando se selecciona un color
 * @param {Function} onClear - Callback para quitar resaltado
 */
export function HighlightPicker({ onSelect, onClear }) {
  const [showPicker, setShowPicker] = useState(false);

  // 6 colores de resaltado
  const highlightPresets = [
    { name: 'Amarillo', value: '#FEF08A' },
    { name: 'Verde', value: '#BBF7D0' },
    { name: 'Azul', value: '#BFDBFE' },
    { name: 'Rosa', value: '#FBCFE8' },
    { name: 'Púrpura', value: '#E9D5FF' },
    { name: 'Naranja', value: '#FED7AA' },
  ];

  const handleColorSelect = (color) => {
    onSelect(color);
    setShowPicker(false);
  };

  const handleClear = () => {
    onClear();
    setShowPicker(false);
  };

  return (
    <div className="highlight-picker-container relative">
      {/* Botón trigger unificado */}
      <UnifiedToolbarButton
        onClick={() => setShowPicker(!showPicker)}
        active={showPicker}
        title="Resaltador de texto"
        icon={Highlighter}
      />

      {/* Menú compacto (180px) */}
      {showPicker && (
        <div className="absolute top-full left-0 mt-2 z-50
                       w-[180px]
                       bg-white dark:bg-gray-800
                       rounded-lg shadow-xl
                       border-2 border-gray-200 dark:border-gray-700
                       p-3">

          {/* Header compacto */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
              Resaltador
            </span>
            <button
              onClick={() => setShowPicker(false)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>

          {/* Colores en grid 3x2 (compacto) */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {highlightPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleColorSelect(preset.value)}
                className="w-full aspect-square rounded-lg border-2 border-gray-300
                         dark:border-gray-600 transition-all hover:scale-110 hover:shadow-md"
                style={{ backgroundColor: preset.value }}
                title={preset.name}
              />
            ))}
          </div>

          {/* Botón quitar resaltado */}
          <button
            type="button"
            onClick={handleClear}
            className="w-full px-3 py-2 rounded-lg text-xs font-semibold
                     bg-gray-100 dark:bg-gray-700
                     hover:bg-gray-200 dark:hover:bg-gray-600
                     text-gray-700 dark:text-gray-300
                     transition-colors
                     flex items-center justify-center gap-2
                     border-2 border-gray-300 dark:border-gray-600"
          >
            <X size={14} />
            Sin resaltado
          </button>
        </div>
      )}
    </div>
  );
}

export default HighlightPicker;
