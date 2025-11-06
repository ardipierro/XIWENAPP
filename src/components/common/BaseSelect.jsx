import { AlertCircle, ChevronDown } from 'lucide-react';

/**
 * BaseSelect - Componente select base reutilizable (100% Tailwind)
 *
 * @param {string} label - Label del select (opcional)
 * @param {string} value - Valor seleccionado
 * @param {function} onChange - Callback cuando cambia la selección
 * @param {array} options - Array de opciones: [{ value, label }, ...]
 * @param {string} placeholder - Placeholder cuando no hay selección
 * @param {string} error - Mensaje de error (si existe)
 * @param {string} helperText - Texto de ayuda debajo del select
 * @param {boolean} required - Campo requerido
 * @param {boolean} disabled - Campo deshabilitado
 * @param {node} icon - Icono izquierdo (Lucide icon component)
 * @param {string} size - Tamaño: 'sm', 'md', 'lg'
 * @param {string} className - Clases CSS adicionales
 */
function BaseSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
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

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select container */}
      <div className="relative">
        {/* Left icon */}
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none z-10">
            <Icon size={iconSizes[size]} />
          </div>
        )}

        {/* Select field */}
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`
            w-full rounded-lg border transition-all appearance-none
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent
            disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60
            ${error
              ? 'border-red-500 dark:border-red-600 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600'
            }
            ${sizes[size]}
            ${Icon ? 'pl-10' : ''}
            pr-10
          `}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Chevron icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
          <ChevronDown size={iconSizes[size]} />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
}

export default BaseSelect;
