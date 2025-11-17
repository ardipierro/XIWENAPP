import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

/**
 * BaseInput - Componente input base reutilizable (100% Tailwind)
 *
 * Soporta múltiples tipos y estados para cubrir todos los casos de uso.
 *
 * @param {string} type - Tipo de input: 'text', 'email', 'password', 'number', 'url', etc.
 * @param {string} label - Label del input (opcional)
 * @param {string} placeholder - Placeholder
 * @param {string} value - Valor controlado
 * @param {function} onChange - Callback cuando cambia el valor
 * @param {string} error - Mensaje de error (si existe)
 * @param {string} helperText - Texto de ayuda debajo del input
 * @param {boolean} required - Campo requerido
 * @param {boolean} disabled - Campo deshabilitado
 * @param {node} icon - Icono izquierdo (Lucide icon component)
 * @param {node} iconRight - Icono derecho (personalizado)
 * @param {string} size - Tamaño: 'sm', 'md', 'lg'
 * @param {string} className - Clases CSS adicionales
 */
function BaseInput({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  size = 'md',
  className = '',
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  // Size styles (padding values in rem) - consistent with BaseSelect
  const sizeStyles = {
    sm: { pl: '0.75rem', pr: '0.75rem', py: '0.375rem', fontSize: '0.875rem' },
    md: { pl: '1rem', pr: '1rem', py: '0.5rem', fontSize: '1rem' },
    lg: { pl: '1.25rem', pr: '1.25rem', py: '0.75rem', fontSize: '1.125rem' },
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

      {/* Input container */}
      <div className="relative">
        {/* Left icon */}
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            <Icon size={iconSizes[size]} />
          </div>
        )}

        {/* Input field */}
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="w-full rounded-lg border transition-all focus:outline-none focus:ring-2 focus:border-transparent"
          style={{
            backgroundColor: disabled ? 'var(--color-bg-tertiary)' : 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            borderColor: error ? 'var(--color-danger)' : 'var(--color-border)',
            paddingLeft: Icon ? '2.5rem' : sizeStyles[size].pl,
            paddingRight: (isPassword || IconRight) ? '2.5rem' : sizeStyles[size].pr,
            paddingTop: sizeStyles[size].py,
            paddingBottom: sizeStyles[size].py,
            fontSize: sizeStyles[size].fontSize,
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.6 : 1
          }}
          {...rest}
        />

        {/* Right icon (password toggle or custom) */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff size={iconSizes[size]} />
            ) : (
              <Eye size={iconSizes[size]} />
            )}
          </button>
        )}

        {IconRight && !isPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            <IconRight size={iconSizes[size]} />
          </div>
        )}
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

export default BaseInput;
