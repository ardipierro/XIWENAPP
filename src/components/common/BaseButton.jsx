import { useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * BaseButton - Componente botón base reutilizable (100% Tailwind)
 *
 * Soporta múltiples variantes y tamaños para cubrir todos los casos de uso.
 *
 * @param {string} variant - Estilo del botón:
 *   - 'primary': Azul principal (default)
 *   - 'secondary': Gris secundario
 *   - 'success': Verde éxito
 *   - 'danger': Rojo peligro
 *   - 'warning': Ámbar advertencia
 *   - 'ghost': Transparente con hover
 *   - 'outline': Borde sin fondo
 *   - 'white': Botón blanco (para fondos oscuros/de color)
 * @param {string} size - Tamaño: 'sm', 'md', 'lg', 'xl'
 * @param {boolean} loading - Estado de carga (muestra spinner)
 * @param {boolean} disabled - Botón deshabilitado
 * @param {boolean} fullWidth - Ancho completo
 * @param {node} icon - Icono izquierdo (Lucide icon component)
 * @param {node} iconRight - Icono derecho
 * @param {node} children - Texto del botón
 * @param {function} onClick - Callback al hacer click
 * @param {string} type - Tipo HTML: 'button', 'submit', 'reset'
 * @param {string} className - Clases CSS adicionales
 */
function BaseButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconRight: IconRight,
  children,
  onClick,
  type = 'button',
  className = '',
  ...rest
}) {
  // Variant styles usando CSS variables
  const getVariantStyles = () => {
    const baseStyles = {
      primary: {
        backgroundColor: 'var(--color-accent)', // Fix: usar accent en vez de primary
        color: 'white',
        hover: { backgroundColor: 'var(--color-accent-dark)' }
      },
      secondary: {
        backgroundColor: 'var(--color-bg-tertiary)',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border)',
        hover: {
          backgroundColor: 'var(--color-bg-hover)',
          border: '1px solid var(--color-border-focus)'
        }
      },
      success: {
        backgroundColor: 'var(--color-success)',
        color: 'white',
        hover: { backgroundColor: 'var(--color-success-dark)' }
      },
      danger: {
        backgroundColor: 'var(--color-error)', // Fix: usar error en vez de danger
        color: 'white',
        hover: { backgroundColor: 'var(--color-error-dark)' }
      },
      warning: {
        backgroundColor: '#f59e0b', // amber-500 - Fix: valor directo (no existe variable)
        color: 'white',
        hover: { backgroundColor: '#d97706' } // amber-600
      },
      ghost: {
        backgroundColor: 'var(--color-bg-secondary)', // Fondo sutil visible
        color: 'var(--color-text-primary)',
        border: '1px solid transparent',
        hover: {
          backgroundColor: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border)'
        }
      },
      outline: {
        backgroundColor: 'transparent',
        color: 'var(--color-text-primary)',
        border: '2px solid var(--color-border)',
        hover: {
          backgroundColor: 'var(--color-bg-tertiary)',
          border: '2px solid var(--color-border-focus)'
        }
      },
      white: {
        backgroundColor: 'white',
        color: '#18181b',
        border: '2px solid white',
        hover: {
          backgroundColor: '#f4f4f5',
          border: '2px solid #f4f4f5'
        }
      }
    };
    return baseStyles[variant] || baseStyles.primary;
  };

  const variantStyles = getVariantStyles();
  const [isHovered, setIsHovered] = useState(false);

  // Size styles
  const sizes = {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
    md: { padding: '0.5rem 1rem', fontSize: '1rem' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' },
    xl: { padding: '1rem 2rem', fontSize: '1.25rem' },
  };

  // Icon sizes
  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
    xl: 24,
  };

  const isDisabled = disabled || loading;

  // Construir el estilo completo del botón
  const buttonStyle = {
    ...variantStyles,
    ...(variantStyles.hover && isHovered && !isDisabled ? variantStyles.hover : {}),
    ...sizes[size],
    width: fullWidth ? '100%' : 'auto',
    opacity: isDisabled ? 0.5 : 1,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transform: !isDisabled && isHovered ? 'scale(0.98)' : 'scale(1)',
    transition: 'all 0.2s ease'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => !isDisabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-lg
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${className}
      `}
      style={{
        ...buttonStyle,
        boxShadow: isHovered && !isDisabled ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
      }}
      {...rest}
    >
      {/* Loading spinner */}
      {loading && (
        <Loader2 size={iconSizes[size]} className="animate-spin" />
      )}

      {/* Left icon */}
      {!loading && Icon && (
        <Icon size={iconSizes[size]} strokeWidth={2} />
      )}

      {/* Button text */}
      {children}

      {/* Right icon */}
      {!loading && IconRight && (
        <IconRight size={iconSizes[size]} strokeWidth={2} />
      )}
    </button>
  );
}

export default BaseButton;
