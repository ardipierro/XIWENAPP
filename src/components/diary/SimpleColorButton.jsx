import React, { useState } from 'react';
import { X } from 'lucide-react';

/**
 * SimpleColorButton - Botón de color SIMPLE (solo cuadrado, sin icono)
 *
 * @param {string} value - Color actual
 * @param {Function} onChange - Callback cuando cambia
 * @param {string} label - Label para el menú
 * @param {string} title - Tooltip
 */
export function SimpleColorButton({ value = '#000000', onChange, label = 'Color', title = 'Seleccionar color' }) {
  const [showPicker, setShowPicker] = useState(false);

  // 8 colores esenciales
  const colorPresets = [
    { name: 'Negro', value: '#000000' },
    { name: 'Rojo', value: '#EF4444' },
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Verde', value: '#22C55E' },
    { name: 'Amarillo', value: '#EAB308' },
    { name: 'Púrpura', value: '#A855F7' },
    { name: 'Gris', value: '#6B7280' },
    { name: 'Blanco', value: '#FFFFFF' },
  ];

  const handleColorSelect = (color) => {
    onChange(color);
    setShowPicker(false);
  };

  return (
    <div className="simple-color-button relative">
      {/* Solo cuadrado de color (sin icono) */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600
                   hover:border-gray-400 dark:hover:border-gray-500
                   transition-all shadow-sm hover:shadow-md"
        style={{ backgroundColor: value }}
        title={title}
      />

      {/* Menú compacto (180px) */}
      {showPicker && (
        <div className="absolute top-full left-0 mt-2 z-50
                       w-[180px]
                       bg-white dark:bg-gray-800
                       rounded-lg shadow-xl
                       border-2 border-gray-200 dark:border-gray-700
                       p-3">

          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {label}
            </span>
            <button
              onClick={() => setShowPicker(false)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>

          {/* Presets grid 4x2 */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {colorPresets.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => handleColorSelect(color.value)}
                className={`
                  w-full aspect-square rounded-lg border-2 transition-all
                  hover:scale-110 hover:shadow-md
                  ${value === color.value
                    ? 'border-gray-500 ring-2 ring-gray-300 dark:ring-gray-600 scale-110'
                    : 'border-gray-300 dark:border-gray-600'
                  }
                `}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>

          {/* Color picker nativo */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Personalizado:
            </label>
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-8 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SimpleColorButton;
