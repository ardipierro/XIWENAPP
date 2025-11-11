/**
 * BaseBadge - Componente badge/tag base reutilizable (100% Tailwind)
 *
 * Para mostrar tags, estados, categorías, contadores, etc.
 *
 * @param {string} variant - Estilo del badge:
 *   - 'default': Gris neutro
 *   - 'primary': Azul
 *   - 'success': Verde
 *   - 'warning': Ámbar
 *   - 'danger': Rojo
 *   - 'info': Cyan
 * @param {string} size - Tamaño: 'sm', 'md', 'lg'
 * @param {node} icon - Icono izquierdo (Lucide icon component)
 * @param {boolean} dot - Mostrar punto de color a la izquierda
 * @param {boolean} rounded - Badge completamente redondo (pill)
 * @param {function} onRemove - Callback para cerrar/remover (muestra X)
 * @param {node} children - Contenido del badge
 * @param {string} className - Clases CSS adicionales
 */
function BaseBadge({
  variant = 'default',
  size = 'md',
  icon: Icon,
  dot = false,
  rounded = true,
  onRemove,
  children,
  className = '',
}) {
  // Variant styles using CSS variables
  const getVariantStyle = (variant) => {
    const styles = {
      default: {
        backgroundColor: 'var(--badge-info-bg, #e5e7eb)',
        color: 'var(--badge-info-text, #1f2937)'
      },
      primary: {
        backgroundColor: 'var(--badge-primary-bg, #3b82f6)',
        color: 'var(--badge-primary-text, #ffffff)'
      },
      success: {
        backgroundColor: 'var(--badge-success-bg, #10b981)',
        color: 'var(--badge-success-text, #ffffff)'
      },
      warning: {
        backgroundColor: 'var(--badge-warning-bg, #f59e0b)',
        color: 'var(--badge-warning-text, #ffffff)'
      },
      danger: {
        backgroundColor: 'var(--badge-danger-bg, #ef4444)',
        color: 'var(--badge-danger-text, #ffffff)'
      },
      info: {
        backgroundColor: 'var(--badge-info-bg, #8b5cf6)',
        color: 'var(--badge-info-text, #ffffff)'
      }
    };
    return styles[variant] || styles.default;
  };

  // Size styles
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const variantStyle = getVariantStyle(variant);

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium
        ${rounded ? 'rounded-full' : 'rounded-md'}
        ${sizes[size]}
        ${className}
      `}
      style={variantStyle}
    >
      {/* Dot indicator */}
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full opacity-70" />
      )}

      {/* Icon */}
      {Icon && (
        <Icon size={iconSizes[size]} strokeWidth={2} />
      )}

      {/* Content */}
      {children}

      {/* Remove button */}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 transition-opacity"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

export default BaseBadge;
