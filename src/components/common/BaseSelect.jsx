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
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {label}
          {required && (
            <span className="ml-1" style={{ color: 'var(--color-danger)' }}>*</span>
          )}
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
            focus:outline-none focus:ring-2 focus:border-transparent
            ${Icon ? 'pl-10' : ''}
            pr-10
          `}
          style={{
            backgroundColor: disabled ? 'var(--color-bg-tertiary)' : 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            borderColor: error ? 'var(--color-danger)' : 'var(--color-border)',
            padding: sizes[size].split(' ').map(s => s.replace('px-', '').replace('py-', '')).join(' '),
            fontSize: sizes[size].includes('text-sm') ? '0.875rem' : sizes[size].includes('text-lg') ? '1.125rem' : '1rem',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            paddingRight: '2.5rem'
          }}
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
