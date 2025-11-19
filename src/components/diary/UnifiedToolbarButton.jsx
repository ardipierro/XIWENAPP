import React from 'react';

/**
 * UnifiedToolbarButton - Botón unificado para toda la toolbar
 *
 * ESTILOS CONSISTENTES:
 * - Padding: px-3 py-2
 * - Border radius: rounded-lg
 * - Iconos: size={16}
 * - Transiciones suaves
 *
 * @param {Function} onClick - Callback al hacer click
 * @param {boolean} active - Si el botón está activo
 * @param {boolean} disabled - Si está deshabilitado
 * @param {string} variant - default | primary | danger | success | ghost
 * @param {ReactNode} icon - Icono (Lucide component)
 * @param {string} label - Texto del botón (opcional)
 * @param {string} title - Tooltip
 * @param {string} className - Clases adicionales
 */
export function UnifiedToolbarButton({
  onClick,
  active = false,
  disabled = false,
  variant = 'default',
  icon: Icon,
  label,
  title,
  className = '',
  children
}) {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && onClick) {
      onClick();
    }
  };

  // Estilos base CONSISTENTES
  const baseStyles = `
    px-3 py-2 rounded-lg transition-all duration-200
    font-semibold text-sm
    flex items-center justify-center gap-2
    border-2
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `;

  // Variantes de color
  const variantStyles = {
    default: active
      ? 'bg-gray-500 text-white border-gray-500 shadow-md'
      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600',

    primary: active
      ? 'bg-blue-600 text-white border-gray-600 shadow-lg'
      : 'bg-gray-500 text-white border-gray-500 hover:bg-blue-600 shadow-md',

    danger: active
      ? 'bg-red-600 text-white border-red-700 shadow-lg'
      : 'bg-red-500 text-white border-red-600 hover:bg-red-600 shadow-md',

    success: active
      ? 'bg-green-600 text-white border-green-700 shadow-lg'
      : 'bg-green-500 text-white border-green-600 hover:bg-green-600 shadow-md',

    ghost: active
      ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500'
      : 'bg-transparent text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()} // Prevenir pérdida de foco
      disabled={disabled}
      title={title}
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.default}`}
    >
      {Icon && <Icon size={16} />}
      {label && <span>{label}</span>}
      {children}
    </button>
  );
}

export default UnifiedToolbarButton;
