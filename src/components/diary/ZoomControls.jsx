import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

/**
 * ZoomControls - Controles de zoom para el canvas de dibujo
 *
 * @param {number} zoom - Nivel de zoom actual (0.5 - 3)
 * @param {Function} onZoomChange - Callback cuando cambia el zoom
 */
export function ZoomControls({ zoom = 1, onZoomChange }) {
  const handleZoomIn = () => {
    if (zoom < 3) onZoomChange(Math.min(zoom + 0.25, 3));
  };

  const handleZoomOut = () => {
    if (zoom > 0.5) onZoomChange(Math.max(zoom - 0.25, 0.5));
  };

  const handleReset = () => {
    onZoomChange(1);
  };

  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div className="zoom-controls flex items-center gap-2 p-2 bg-white dark:bg-gray-800
                   rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-md">
      {/* Botón Zoom Out */}
      <button
        type="button"
        onClick={handleZoomOut}
        disabled={zoom <= 0.5}
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200
                 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed
                 transition-colors"
        title="Alejar (Zoom Out)"
      >
        <ZoomOut size={18} className="text-gray-700 dark:text-gray-300" />
      </button>

      {/* Porcentaje de zoom */}
      <div className="flex items-center justify-center min-w-[60px] px-3 py-1.5 rounded-lg
                     bg-gray-100 dark:bg-blue-900 border border-gray-300 dark:border-gray-600">
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {zoomPercentage}%
        </span>
      </div>

      {/* Botón Zoom In */}
      <button
        type="button"
        onClick={handleZoomIn}
        disabled={zoom >= 3}
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200
                 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed
                 transition-colors"
        title="Acercar (Zoom In)"
      >
        <ZoomIn size={18} className="text-gray-700 dark:text-gray-300" />
      </button>

      {/* Botón Reset */}
      <button
        type="button"
        onClick={handleReset}
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200
                 dark:hover:bg-gray-600 transition-colors"
        title="Restablecer zoom (100%)"
      >
        <Maximize2 size={18} className="text-gray-700 dark:text-gray-300" />
      </button>
    </div>
  );
}

export default ZoomControls;
