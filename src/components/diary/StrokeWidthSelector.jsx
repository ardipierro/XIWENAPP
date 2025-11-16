import React from 'react';
import { Minus, Plus } from 'lucide-react';

/**
 * StrokeWidthSelector - Selector de grosor de trazo para el lápiz
 *
 * @param {number} value - Grosor actual (1-20)
 * @param {Function} onChange - Callback cuando cambia el grosor
 */
export function StrokeWidthSelector({ value = 4, onChange }) {
  const handleDecrease = () => {
    if (value > 1) onChange(value - 1);
  };

  const handleIncrease = () => {
    if (value < 20) onChange(value + 1);
  };

  return (
    <div className="stroke-width-selector flex items-center gap-3 p-3 bg-white dark:bg-gray-800
                   rounded-lg border-2 border-gray-200 dark:border-gray-700">
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
        Grosor:
      </span>

      {/* Botón decrementar */}
      <button
        type="button"
        onClick={handleDecrease}
        disabled={value <= 1}
        className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200
                 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed
                 transition-colors"
        title="Reducir grosor"
      >
        <Minus size={16} className="text-gray-700 dark:text-gray-300" />
      </button>

      {/* Slider */}
      <input
        type="range"
        min="1"
        max="20"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer
                 bg-gray-200 dark:bg-gray-700
                 [&::-webkit-slider-thumb]:appearance-none
                 [&::-webkit-slider-thumb]:w-4
                 [&::-webkit-slider-thumb]:h-4
                 [&::-webkit-slider-thumb]:rounded-full
                 [&::-webkit-slider-thumb]:bg-blue-500
                 [&::-webkit-slider-thumb]:cursor-pointer
                 [&::-webkit-slider-thumb]:shadow-md
                 [&::-webkit-slider-thumb]:hover:bg-blue-600
                 [&::-moz-range-thumb]:w-4
                 [&::-moz-range-thumb]:h-4
                 [&::-moz-range-thumb]:rounded-full
                 [&::-moz-range-thumb]:bg-blue-500
                 [&::-moz-range-thumb]:border-0
                 [&::-moz-range-thumb]:cursor-pointer
                 [&::-moz-range-thumb]:hover:bg-blue-600"
      />

      {/* Botón incrementar */}
      <button
        type="button"
        onClick={handleIncrease}
        disabled={value >= 20}
        className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200
                 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed
                 transition-colors"
        title="Aumentar grosor"
      >
        <Plus size={16} className="text-gray-700 dark:text-gray-300" />
      </button>

      {/* Valor numérico */}
      <div className="flex items-center justify-center min-w-[40px] px-2 py-1 rounded-lg
                     bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700">
        <span className="text-sm font-bold text-blue-900 dark:text-blue-100">
          {value}
        </span>
      </div>

      {/* Preview del trazo */}
      <div className="flex items-center justify-center w-16 h-10 bg-gray-100 dark:bg-gray-700
                     rounded-lg border border-gray-300 dark:border-gray-600">
        <div
          className="bg-gray-800 dark:bg-gray-200 rounded-full transition-all"
          style={{
            width: `${Math.max(value, 2)}px`,
            height: `${Math.max(value, 2)}px`
          }}
        />
      </div>
    </div>
  );
}

export default StrokeWidthSelector;
