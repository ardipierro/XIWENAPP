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
          className={`
            w-full rounded-lg border transition-all
            focus:outline-none focus:ring-2 focus:border-transparent
            ${Icon ? 'pl-10' : ''}
            ${isPassword || IconRight ? 'pr-10' : ''}
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
        <div className="flex items-center gap-1.5 mt-1.5 text-sm" style={{ color: 'var(--color-error)' }}>
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
