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
          focus:outline-none focus:ring-2 focus:border-transparent
          ${resizeClasses[resize]}
        `}
        style={{
          backgroundColor: disabled ? 'var(--color-bg-tertiary)' : 'var(--color-bg-primary)',
          color: 'var(--color-text-primary)',
          borderColor: error ? 'var(--color-danger)' : 'var(--color-border)',
          padding: sizes[size].split(' ').map(s => s.replace('px-', '').replace('py-', '')).join(' '),
          fontSize: sizes[size].includes('text-sm') ? '0.875rem' : sizes[size].includes('text-lg') ? '1.125rem' : '1rem',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.6 : 1
        }}
        {...rest}
      />

      {/* Footer: Error/Helper + Counter */}
      <div className="flex items-center justify-between mt-1.5">
        {/* Error or helper text */}
        <div className="flex-1">
          {error && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-error)' }}>
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
          <span
            className="text-sm shrink-0 ml-2"
            style={{
              color: charCount > maxLength * 0.9
                ? 'var(--color-danger)'
                : 'var(--color-text-secondary)'
            }}
          >
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

export default BaseTextarea;
