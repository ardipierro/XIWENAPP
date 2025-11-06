import { AlertCircle } from 'lucide-react';

/**
 * BaseTextarea - Componente textarea base reutilizable (100% Tailwind)
 *
 * @param {string} label - Label del textarea (opcional)
 * @param {string} placeholder - Placeholder
 * @param {string} value - Valor controlado
 * @param {function} onChange - Callback cuando cambia el valor
 * @param {string} error - Mensaje de error (si existe)
 * @param {string} helperText - Texto de ayuda debajo del textarea
 * @param {boolean} required - Campo requerido
 * @param {boolean} disabled - Campo deshabilitado
 * @param {number} rows - Número de filas (altura)
 * @param {number} maxLength - Longitud máxima (muestra contador)
 * @param {boolean} resize - Permitir resize: true, false, 'vertical', 'horizontal'
 * @param {string} size - Tamaño: 'sm', 'md', 'lg'
 * @param {string} className - Clases CSS adicionales
 */
function BaseTextarea({
  label,
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  rows = 4,
  maxLength,
  resize = true,
  size = 'md',
  className = '',
  ...rest
}) {
  // Size styles
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  // Resize styles
  const resizeClasses = {
    true: 'resize',
    false: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
  };

  const charCount = value?.length || 0;
  const showCounter = maxLength && maxLength > 0;

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Textarea field */}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        className={`
          w-full rounded-lg border transition-all
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-white
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent
          disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60
          ${error
            ? 'border-red-500 dark:border-red-600 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600'
          }
          ${sizes[size]}
          ${resizeClasses[resize]}
        `}
        {...rest}
      />

      {/* Footer: Error/Helper + Counter */}
      <div className="flex items-center justify-between mt-1.5">
        {/* Error or helper text */}
        <div className="flex-1">
          {error && (
            <div className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {helperText && !error && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {helperText}
            </p>
          )}
        </div>

        {/* Character counter */}
        {showCounter && (
          <span className={`
            text-sm shrink-0 ml-2
            ${charCount > maxLength * 0.9
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400'
            }
          `}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

export default BaseTextarea;
