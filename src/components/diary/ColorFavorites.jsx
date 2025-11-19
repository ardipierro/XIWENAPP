import React, { useState, useEffect } from 'react';
import { Star, Plus, X } from 'lucide-react';

/**
 * ColorFavorites - Galería de colores favoritos guardados
 *
 * @param {Function} onSelectColor - Callback cuando se selecciona un color
 * @param {string} currentColor - Color actual
 */
export function ColorFavorites({ onSelectColor, currentColor }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('colorFavorites');
      return saved ? JSON.parse(saved) : [
        '#000000', '#FFFFFF', '#EF4444', '#3B82F6',
        '#22C55E', '#EAB308', '#A855F7', '#EC4899'
      ];
    } catch {
      return ['#000000', '#FFFFFF', '#EF4444', '#3B82F6'];
    }
  });

  const [showAdd, setShowAdd] = useState(false);

  // Guardar en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem('colorFavorites', JSON.stringify(favorites));
  }, [favorites]);

  const handleAddFavorite = () => {
    if (currentColor && !favorites.includes(currentColor)) {
      setFavorites([...favorites, currentColor]);
      setShowAdd(false);
    }
  };

  const handleRemoveFavorite = (color) => {
    setFavorites(favorites.filter(c => c !== color));
  };

  return (
    <div className="color-favorites p-3 bg-white dark:bg-gray-800 rounded-lg
                   border-2 border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-yellow-500" fill="currentColor" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Colores Favoritos
          </span>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Agregar color actual a favoritos"
        >
          <Plus size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Grid de colores favoritos */}
      <div className="grid grid-cols-8 gap-2">
        {favorites.map((color, index) => (
          <div key={index} className="relative group">
            <button
              onClick={() => onSelectColor(color)}
              className={`
                w-full aspect-square rounded-lg transition-all hover:scale-110
                ${currentColor === color
                  ? 'ring-2 ring-gray-500 ring-offset-2 dark:ring-offset-gray-800'
                  : 'border-2 border-gray-300 dark:border-gray-600'
                }
              `}
              style={{ backgroundColor: color }}
              title={color}
            />

            {/* Botón eliminar (visible al hover) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFavorite(color);
              }}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5
                       opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              title="Eliminar de favoritos"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>

      {/* Contador */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        {favorites.length} / 24 colores guardados
      </div>

      {/* Modal agregar */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
             onClick={() => setShowAdd(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4"
               onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
              Agregar a Favoritos
            </h3>

            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-16 h-16 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: currentColor }}
                />
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Color seleccionado:
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {currentColor}
                  </div>
                </div>
              </div>
            </div>

            {favorites.includes(currentColor) && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg
                           border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Este color ya está en tus favoritos
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700
                         dark:hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddFavorite}
                disabled={favorites.includes(currentColor)}
                className="flex-1 px-4 py-2 bg-gray-500 hover:bg-blue-600 text-white
                         rounded-lg font-semibold transition-colors
                         disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ColorFavorites;
