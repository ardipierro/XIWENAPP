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
 * @param {string} badgeStyle - Estilo de renderizado: 'solid' | 'outline' | 'soft' | 'glass' | 'gradient'
 * @param {string} size - Tamaño: 'xs', 'sm', 'md', 'lg', 'xl'
 * @param {node} icon - Icono izquierdo (Lucide icon component)
 * @param {boolean} dot - Mostrar punto de color a la izquierda
 * @param {boolean} rounded - Badge completamente redondo (pill)
 * @param {function} onRemove - Callback para cerrar/remover (muestra X)
 * @param {node} children - Contenido del badge
 * @param {string} className - Clases CSS adicionales
 */
function BaseBadge({
  variant = 'default',
  badgeStyle = 'solid',
  size = 'md',
  icon: Icon,
  dot = false,
  rounded = true,
  onRemove,
  children,
  className = '',
  style = {},
}) {
  // Variant styles using CSS variables
  const getVariantStyle = (variant, badgeStyle) => {
    const solidStyles = {
      default: {
        backgroundColor: 'var(--badge-info-bg, #e5e7eb)',
        color: 'var(--badge-info-text, #1f2937)',
        border: 'none'
      },
      primary: {
        backgroundColor: 'var(--badge-primary-bg, #3b82f6)',
        color: 'var(--badge-primary-text, #ffffff)',
        border: 'none'
      },
      success: {
        backgroundColor: 'var(--badge-success-bg, #10b981)',
        color: 'var(--badge-success-text, #ffffff)',
        border: 'none'
      },
      warning: {
        backgroundColor: 'var(--badge-warning-bg, #f59e0b)',
        color: 'var(--badge-warning-text, #ffffff)',
        border: 'none'
      },
      danger: {
        backgroundColor: 'var(--badge-danger-bg, #ef4444)',
        color: 'var(--badge-danger-text, #ffffff)',
        border: 'none'
      },
      info: {
        backgroundColor: 'var(--badge-info-bg, #8b5cf6)',
        color: 'var(--badge-info-text, #ffffff)',
        border: 'none'
      }
    };

    const outlineStyles = {
      default: {
        backgroundColor: 'transparent',
        color: 'var(--badge-info-bg, #1f2937)',
        border: '1.5px solid var(--badge-info-bg, #e5e7eb)'
      },
      primary: {
        backgroundColor: 'transparent',
        color: 'var(--badge-primary-bg, #3b82f6)',
        border: '1.5px solid var(--badge-primary-bg, #3b82f6)'
      },
      success: {
        backgroundColor: 'transparent',
        color: 'var(--badge-success-bg, #10b981)',
        border: '1.5px solid var(--badge-success-bg, #10b981)'
      },
      warning: {
        backgroundColor: 'transparent',
        color: 'var(--badge-warning-bg, #f59e0b)',
        border: '1.5px solid var(--badge-warning-bg, #f59e0b)'
      },
      danger: {
        backgroundColor: 'transparent',
        color: 'var(--badge-danger-bg, #ef4444)',
        border: '1.5px solid var(--badge-danger-bg, #ef4444)'
      },
      info: {
        backgroundColor: 'transparent',
        color: 'var(--badge-info-bg, #8b5cf6)',
        border: '1.5px solid var(--badge-info-bg, #8b5cf6)'
      }
    };

    const softStyles = {
      default: {
        backgroundColor: 'rgba(229, 231, 235, 0.3)',
        color: 'var(--badge-info-bg, #1f2937)',
        border: 'none'
      },
      primary: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        color: 'var(--badge-primary-bg, #3b82f6)',
        border: 'none'
      },
      success: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        color: 'var(--badge-success-bg, #10b981)',
        border: 'none'
      },
      warning: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        color: 'var(--badge-warning-bg, #f59e0b)',
        border: 'none'
      },
      danger: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        color: 'var(--badge-danger-bg, #ef4444)',
        border: 'none'
      },
      info: {
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        color: 'var(--badge-info-bg, #8b5cf6)',
        border: 'none'
      }
    };

    const glassStyles = {
      default: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        color: 'var(--color-text-primary)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      },
      primary: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        color: 'var(--badge-primary-bg, #3b82f6)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      },
      success: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        color: 'var(--badge-success-bg, #10b981)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      },
      warning: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        color: 'var(--badge-warning-bg, #f59e0b)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      },
      danger: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: 'var(--badge-danger-bg, #ef4444)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      },
      info: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        color: 'var(--badge-info-bg, #8b5cf6)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }
    };

    const gradientStyles = {
      default: {
        background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
        color: '#1f2937',
        border: 'none'
      },
      primary: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: '#ffffff',
        border: 'none'
      },
      success: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: '#ffffff',
        border: 'none'
      },
      warning: {
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: '#ffffff',
        border: 'none'
      },
      danger: {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: '#ffffff',
        border: 'none'
      },
      info: {
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        color: '#ffffff',
        border: 'none'
      }
    };

    const styleMap = {
      solid: solidStyles,
      outline: outlineStyles,
      soft: softStyles,
      glass: glassStyles,
      gradient: gradientStyles
    };

    const styles = styleMap[badgeStyle] || solidStyles;
    return styles[variant] || styles.default;
  };

  // Size styles
  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
    xl: 'px-4 py-2 text-lg',
  };

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
  };

  const variantStyle = getVariantStyle(variant, badgeStyle);

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium
        ${rounded ? 'rounded-full' : 'rounded-md'}
        ${sizes[size]}
        ${className}
      `}
      style={{ ...variantStyle, ...style }}
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
