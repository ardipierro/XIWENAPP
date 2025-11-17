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
  // Size styles (padding values in rem)
  const sizeStyles = {
    sm: { pl: '0.75rem', pr: '2.5rem', py: '0.375rem', fontSize: '0.875rem' },
    md: { pl: '1rem', pr: '2.5rem', py: '0.5rem', fontSize: '1rem' },
    lg: { pl: '1.25rem', pr: '2.5rem', py: '0.75rem', fontSize: '1.125rem' },
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
          className="w-full rounded-lg border transition-all appearance-none focus:outline-none focus:ring-2 focus:border-transparent"
          style={{
            backgroundColor: disabled ? 'var(--color-bg-tertiary)' : 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            borderColor: error ? 'var(--color-danger)' : 'var(--color-border)',
            paddingLeft: Icon ? '2.5rem' : sizeStyles[size].pl,
            paddingRight: sizeStyles[size].pr,
            paddingTop: sizeStyles[size].py,
            paddingBottom: sizeStyles[size].py,
            fontSize: sizeStyles[size].fontSize,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
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
