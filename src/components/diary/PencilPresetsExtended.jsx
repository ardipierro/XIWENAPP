import React, { useState } from 'react';
import { Pen, Check, Plus, X } from 'lucide-react';

/**
 * PencilPresetsExtended - Presets de lápiz expandidos con opciones personalizables
 *
 * @param {Function} onSelect - Callback cuando se selecciona un preset
 * @param {Object} current - Preset actual
 * @param {Function} onSaveCustom - Callback para guardar preset personalizado
 */
export function PencilPresetsExtended({ onSelect, current = {}, onSaveCustom }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customPresets, setCustomPresets] = useState(() => {
    // Cargar presets guardados del localStorage
    try {
      const saved = localStorage.getItem('pencilPresetsCustom');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Presets predefinidos expandidos
  const defaultPresets = [
    // Lápices estándar
    { name: 'Negro', color: '#000000', opacity: 1, size: 4, icon: '🖊️', category: 'Lápiz' },
    { name: 'Azul', color: '#3B82F6', opacity: 1, size: 4, icon: '🖊️', category: 'Lápiz' },
    { name: 'Rojo', color: '#EF4444', opacity: 1, size: 4, icon: '🖊️', category: 'Lápiz' },
    { name: 'Verde', color: '#22C55E', opacity: 1, size: 4, icon: '🖊️', category: 'Lápiz' },

    // Marcadores
    { name: 'Amarillo', color: '#EAB308', opacity: 0.4, size: 8, icon: '🖍️', category: 'Marcador' },
    { name: 'Azul Claro', color: '#3B82F6', opacity: 0.3, size: 8, icon: '🖍️', category: 'Marcador' },
    { name: 'Rosa', color: '#EC4899', opacity: 0.3, size: 8, icon: '🖍️', category: 'Marcador' },
    { name: 'Verde Claro', color: '#22C55E', opacity: 0.3, size: 8, icon: '🖍️', category: 'Marcador' },

    // Tizas (trazo grueso, semitransparente)
    { name: 'Tiza Blanca', color: '#F9FAFB', opacity: 0.8, size: 12, icon: '⬜', category: 'Tiza' },
    { name: 'Tiza Amarilla', color: '#FEF08A', opacity: 0.7, size: 12, icon: '🟨', category: 'Tiza' },
    { name: 'Tiza Azul', color: '#BFDBFE', opacity: 0.7, size: 12, icon: '🟦', category: 'Tiza' },

    // Pincel (trazo muy grueso)
    { name: 'Pincel Negro', color: '#000000', opacity: 0.6, size: 16, icon: '🖌️', category: 'Pincel' },
    { name: 'Pincel Rojo', color: '#EF4444', opacity: 0.5, size: 16, icon: '🖌️', category: 'Pincel' },

    // Pluma fina (trazo muy delgado)
    { name: 'Pluma Fina', color: '#000000', opacity: 1, size: 2, icon: '✒️', category: 'Pluma' },
    { name: 'Pluma Azul', color: '#1E40AF', opacity: 1, size: 2, icon: '✒️', category: 'Pluma' },
  ];

  const allPresets = [...defaultPresets, ...customPresets];

  const isActive = (preset) => {
    return current.color === preset.color &&
           current.opacity === preset.opacity &&
           current.size === preset.size;
  };

  const handleSaveCustomPreset = () => {
    const newPreset = {
      name: `Personalizado ${customPresets.length + 1}`,
      color: current.color,
      opacity: current.opacity,
      size: current.size,
      icon: '⭐',
      category: 'Personalizado',
      custom: true
    };

    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    localStorage.setItem('pencilPresetsCustom', JSON.stringify(updated));

    if (onSaveCustom) {
      onSaveCustom(newPreset);
    }

    setShowCustom(false);
  };

  const handleDeleteCustomPreset = (index) => {
    const updated = customPresets.filter((_, i) => i !== index);
    setCustomPresets(updated);
    localStorage.setItem('pencilPresetsCustom', JSON.stringify(updated));
  };

  // Agrupar por categoría
  const categories = [...new Set(allPresets.map(p => p.category))];

  return (
    <div className="pencil-presets-extended">
      {/* Tabs de categorías */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
        {categories.map(cat => {
          const count = allPresets.filter(p => p.category === cat).length;
          return (
            <button
              key={cat}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap
                       bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                       hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid de presets */}
      <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-2">
        {allPresets.map((preset, index) => (
          <div key={index} className="relative">
            <button
              type="button"
              onClick={() => onSelect(preset)}
              className={`
                relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg
                transition-all hover:scale-105 w-full
                ${isActive(preset)
                  ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 shadow-md'
                  : 'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }
              `}
              title={`${preset.name} - ${preset.size}px - ${Math.round(preset.opacity * 100)}%`}
            >
              {/* Icono del preset */}
              <span className="text-xl">{preset.icon}</span>

              {/* Muestra del color */}
              <div
                className="w-full h-2 rounded"
                style={{
                  backgroundColor: preset.color,
                  opacity: preset.opacity
                }}
              />

              {/* Nombre */}
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center line-clamp-1">
                {preset.name}
              </span>

              {/* Indicador de activo */}
              {isActive(preset) && (
                <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5">
                  <Check size={10} className="text-white" />
                </div>
              )}

              {/* Botón eliminar (solo personalizados) */}
              {preset.custom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCustomPreset(index - defaultPresets.length);
                  }}
                  className="absolute top-1 left-1 bg-red-500 rounded-full p-0.5 opacity-0
                           hover:opacity-100 transition-opacity"
                  title="Eliminar preset"
                >
                  <X size={10} className="text-white" />
                </button>
              )}
            </button>
          </div>
        ))}

        {/* Botón agregar preset personalizado */}
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg
                   border-2 border-dashed border-gray-400 dark:border-gray-600
                   hover:border-blue-500 dark:hover:border-blue-400
                   hover:bg-blue-50 dark:hover:bg-blue-900/20
                   transition-all"
          title="Guardar configuración actual como preset"
        >
          <Plus size={24} className="text-gray-500 dark:text-gray-400" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Guardar
          </span>
        </button>
      </div>

      {/* Modal guardar preset personalizado */}
      {showCustom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
             onClick={() => setShowCustom(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
               onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
              Guardar Preset Personalizado
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Color:</div>
                  <div
                    className="h-10 rounded border-2 border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: current.color }}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Opacidad:</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {Math.round(current.opacity * 100)}%
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Grosor:</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {current.size}px
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCustom(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700
                         dark:hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCustomPreset}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white
                         rounded-lg font-semibold transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border
                     border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          💡 <strong>{allPresets.length} presets</strong> disponibles.
          Haz click en "Guardar" para crear tus propios presets.
        </p>
      </div>
    </div>
  );
}

export default PencilPresetsExtended;
