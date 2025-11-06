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
  // Variant styles
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  };

  // Dot colors (para dot indicator)
  const dotColors = {
    default: 'bg-gray-400 dark:bg-gray-500',
    primary: 'bg-blue-500 dark:bg-blue-400',
    success: 'bg-green-500 dark:bg-green-400',
    warning: 'bg-amber-500 dark:bg-amber-400',
    danger: 'bg-red-500 dark:bg-red-400',
    info: 'bg-cyan-500 dark:bg-cyan-400',
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

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium
        ${rounded ? 'rounded-full' : 'rounded-md'}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {/* Dot indicator */}
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
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
