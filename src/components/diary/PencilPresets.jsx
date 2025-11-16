import React from 'react';
import { Pen, Check } from 'lucide-react';

/**
 * PencilPresets - Presets de colores y estilos para el lápiz
 *
 * @param {Function} onSelect - Callback cuando se selecciona un preset
 * @param {Object} current - Preset actual { color, opacity, size }
 */
export function PencilPresets({ onSelect, current = {} }) {
  // Presets de lápiz con diferentes estilos
  const pencilPresets = [
    {
      name: 'Negro',
      color: '#000000',
      opacity: 1,
      size: 4,
      icon: '🖊️'
    },
    {
      name: 'Azul',
      color: '#3B82F6',
      opacity: 1,
      size: 4,
      icon: '🖊️'
    },
    {
      name: 'Rojo',
      color: '#EF4444',
      opacity: 1,
      size: 4,
      icon: '🖊️'
    },
    {
      name: 'Verde',
      color: '#22C55E',
      opacity: 1,
      size: 4,
      icon: '🖊️'
    },
    {
      name: 'Marcador Amarillo',
      color: '#EAB308',
      opacity: 0.4,
      size: 8,
      icon: '🖍️'
    },
    {
      name: 'Marcador Azul',
      color: '#3B82F6',
      opacity: 0.3,
      size: 8,
      icon: '🖍️'
    },
    {
      name: 'Marcador Rosa',
      color: '#EC4899',
      opacity: 0.3,
      size: 8,
      icon: '🖍️'
    },
    {
      name: 'Marcador Verde',
      color: '#22C55E',
      opacity: 0.3,
      size: 8,
      icon: '🖍️'
    },
  ];

  const isActive = (preset) => {
    return current.color === preset.color &&
           current.opacity === preset.opacity &&
           current.size === preset.size;
  };

  return (
    <div className="pencil-presets-container">
      <div className="grid grid-cols-4 gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg
                     border-2 border-gray-200 dark:border-gray-700">
        {pencilPresets.map((preset, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(preset)}
            className={`
              relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg
              transition-all hover:scale-105
              ${isActive(preset)
                ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 shadow-md'
                : 'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }
            `}
            title={preset.name}
          >
            {/* Icono del preset */}
            <span className="text-2xl">{preset.icon}</span>

            {/* Muestra del color */}
            <div
              className="w-full h-2 rounded"
              style={{
                backgroundColor: preset.color,
                opacity: preset.opacity
              }}
            />

            {/* Nombre */}
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
              {preset.name}
            </span>

            {/* Indicador de activo */}
            {isActive(preset) && (
              <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5">
                <Check size={12} className="text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Leyenda */}
      <div className="mt-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg
                     border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          💡 <strong>Consejo:</strong> Los marcadores tienen trazo más grueso y son semitransparentes,
          ideales para resaltar sin ocultar el texto.
        </p>
      </div>
    </div>
  );
}

export default PencilPresets;
