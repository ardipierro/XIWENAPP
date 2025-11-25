import React, { useState, useEffect } from 'react';
import { Pen, Settings } from 'lucide-react';

/**
 * SimplePencilPresets - Selector SIMPLE de lápiz: UNA línea con grosores y colores
 *
 * @param {Function} onSelect - Callback cuando se selecciona grosor/color
 * @param {Object} current - Configuración actual { color, size }
 */
export function SimplePencilPresets({ onSelect, current = {} }) {
  // Grosores disponibles (5 puntas)
  const strokeSizes = [1, 3, 6, 10, 15];

  // Colores editables (guardados en localStorage)
  const [colors, setColors] = useState(() => {
    try {
      const saved = localStorage.getItem('pencilColors');
      return saved ? JSON.parse(saved) : [
        '#000000', // Negro
        '#EF4444', // Rojo
        '#3B82F6', // Azul
        '#22C55E', // Verde
        '#EAB308'  // Amarillo
      ];
    } catch {
      return ['#000000', '#EF4444', '#3B82F6', '#22C55E', '#EAB308'];
    }
  });

  const [showColorEditor, setShowColorEditor] = useState(false);
  const [editingColorIndex, setEditingColorIndex] = useState(null);

  // Guardar colores cuando cambian
  useEffect(() => {
    localStorage.setItem('pencilColors', JSON.stringify(colors));
  }, [colors]);

  const handleSizeSelect = (size) => {
    onSelect({ color: current.color, size, opacity: 1 });
  };

  const handleColorSelect = (color, index) => {
    onSelect({ color, size: current.size, opacity: 1 });
  };

  const handleColorChange = (index, newColor) => {
    const updated = [...colors];
    updated[index] = newColor;
    setColors(updated);
  };

  return (
    <div className="simple-pencil-presets">
      {/* Barra horizontal única */}
      <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
        {/* Icono */}
        <Pen size={16} className="text-purple-600 dark:text-purple-400" />

        {/* Selector de grosor (5 puntas) */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-purple-800 dark:text-purple-200 mr-1">
            Grosor:
          </span>
          {strokeSizes.map((size) => {
            const isActive = current.size === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => handleSizeSelect(size)}
                className={`
                  flex items-center justify-center w-10 h-10 rounded-lg transition-all
                  ${isActive
                    ? 'bg-purple-500 shadow-lg scale-110 border-2 border-purple-700'
                    : 'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                  }
                `}
                title={`${size}px`}
              >
                <div
                  className={`rounded-full ${isActive ? 'bg-white' : 'bg-gray-800 dark:bg-gray-300'}`}
                  style={{
                    width: `${Math.min(size * 2, 16)}px`,
                    height: `${Math.min(size * 2, 16)}px`
                  }}
                />
              </button>
            );
          })}
        </div>

        <div className="border-l border-purple-300 dark:border-purple-700 h-8" />

        {/* Selector de color (5 colores editables) */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-purple-800 dark:text-purple-200 mr-1">
            Color:
          </span>
          {colors.map((color, index) => {
            const isActive = current.color === color;
            return (
              <div key={index} className="relative">
                <button
                  type="button"
                  onClick={() => handleColorSelect(color, index)}
                  className={`
                    w-10 h-10 rounded-lg transition-all border-2
                    ${isActive
                      ? 'border-purple-700 shadow-lg scale-110'
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-500'
                    }
                  `}
                  style={{ backgroundColor: color }}
                  title={`Color ${index + 1}`}
                />
                {/* Botón editar color (aparece al hover) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingColorIndex(index);
                    setShowColorEditor(true);
                  }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-gray-700 text-white rounded-full
                           opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                  title="Cambiar color"
                >
                  <Settings size={10} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal editar color - Usa clases universales para mobile */}
      {showColorEditor && editingColorIndex !== null && (
        <div
          className="mobile-modal"
          onClick={() => {
            setShowColorEditor(false);
            setEditingColorIndex(null);
          }}
        >
          <div
            className="mobile-modal-box modal-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
              Editar Color {editingColorIndex + 1}
            </h3>

            <div className="space-y-4">
              {/* Color picker nativo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Selecciona un color:
                </label>
                <input
                  type="color"
                  value={colors[editingColorIndex]}
                  onChange={(e) => handleColorChange(editingColorIndex, e.target.value)}
                  className="w-full h-20 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                />
              </div>

              {/* Preview */}
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-gray-400"
                    style={{ backgroundColor: colors[editingColorIndex] }}
                  />
                  <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {colors[editingColorIndex]}
                  </span>
                </div>
              </div>

              {/* Botones */}
              <button
                onClick={() => {
                  setShowColorEditor(false);
                  setEditingColorIndex(null);
                }}
                className="w-full px-4 py-2 bg-gray-500 hover:bg-blue-600 text-white
                         rounded-lg font-semibold transition-colors"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SimplePencilPresets;
