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
  // Variant styles
  const variants = {
    primary: 'bg-zinc-800 hover:bg-zinc-900 text-white dark:bg-zinc-700 dark:hover:bg-zinc-600 shadow-sm',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700 shadow-sm',
    danger: 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 shadow-sm',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700 shadow-sm',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-800 dark:text-gray-300',
    outline: 'border-2 border-gray-300 hover:border-gray-400 bg-transparent text-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50',
  };

  // Size styles
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  // Icon sizes
  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
    xl: 24,
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500
        active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
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
