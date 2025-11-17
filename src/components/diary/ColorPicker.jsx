import React, { useState } from 'react';
import { Palette, X } from 'lucide-react';

/**
 * ColorPicker - Selector de color con presets y color picker personalizado
 *
 * @param {string} value - Color actual seleccionado
 * @param {Function} onChange - Callback cuando cambia el color
 * @param {string} label - Etiqueta del selector
 */
export function ColorPicker({ value = '#000000', onChange, label = 'Color' }) {
  const [showPicker, setShowPicker] = useState(false);

  // Presets de colores comunes
  const colorPresets = [
    { name: 'Negro', value: '#000000' },
    { name: 'Gris', value: '#6B7280' },
    { name: 'Rojo', value: '#EF4444' },
    { name: 'Naranja', value: '#F97316' },
    { name: 'Amarillo', value: '#EAB308' },
    { name: 'Verde', value: '#22C55E' },
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Índigo', value: '#6366F1' },
    { name: 'Púrpura', value: '#A855F7' },
    { name: 'Rosa', value: '#EC4899' },
    { name: 'Marrón', value: '#92400E' },
    { name: 'Blanco', value: '#FFFFFF' },
  ];

  return (
    <div className="color-picker-container relative">
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-700
                   border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400
                   dark:hover:border-gray-500 transition-colors"
        title={label}
      >
        <div
          className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-500"
          style={{ backgroundColor: value }}
        />
        <Palette size={16} className="text-gray-600 dark:text-gray-400" />
      </button>

      {/* Dropdown de presets */}
      {showPicker && (
        <div className="absolute top-full mt-2 z-50 bg-white dark:bg-gray-800 rounded-lg
                       shadow-xl border-2 border-gray-200 dark:border-gray-700 p-3 min-w-[240px]">
          {/* Header */}
          <div className="mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {label}
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

          {/* Presets en grid */}
          <div className="grid grid-cols-6 gap-2 mb-3">
            {colorPresets.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => {
                  onChange(color.value);
                  setShowPicker(false);
                }}
                className={`
                  w-8 h-8 rounded-lg border-2 transition-all hover:scale-110
                  ${value === color.value
                    ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                    : 'border-gray-300 dark:border-gray-600'
                  }
                `}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>

          {/* Color picker personalizado */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Color personalizado:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600
                         cursor-pointer"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-24 px-2 py-1 text-xs font-mono rounded border-2
                         border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900
                         text-gray-900 dark:text-gray-100"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ColorPicker;
