import React, { useState } from 'react';
import { Palette, X } from 'lucide-react';
import { UnifiedToolbarButton } from './UnifiedToolbarButton';

/**
 * ColorPicker - Selector de color COMPACTO (180px)
 *
 * @param {string} value - Color actual seleccionado
 * @param {Function} onChange - Callback cuando cambia el color
 * @param {string} label - Etiqueta del selector
 */
export function ColorPicker({ value = '#000000', onChange, label = 'Color' }) {
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
    <div className="color-picker-container relative">
      {/* Botón trigger unificado */}
      <UnifiedToolbarButton
        onClick={() => setShowPicker(!showPicker)}
        active={showPicker}
        title={label}
        icon={Palette}
        className="relative"
      >
        {/* Indicador de color actual */}
        <div
          className="absolute bottom-1 left-1 w-3 h-3 rounded-sm border border-white shadow-sm"
          style={{ backgroundColor: value }}
        />
      </UnifiedToolbarButton>

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
              {label}
            </span>
            <button
              onClick={() => setShowPicker(false)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>

          {/* Presets en grid 4x2 (compacto) */}
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

          {/* Color picker nativo compacto */}
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

export default ColorPicker;
