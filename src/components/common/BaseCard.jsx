/**
 * BaseCard - Componente card base reutilizable (100% Tailwind)
 *
 * Sistema de slots flexible para diferentes tipos de cards:
 * - Card con imagen superior
 * - Card con icono/avatar
 * - Card con estadísticas
 * - Card con botones de acción
 * - Card clickable
 *
 * @param {node} image - Imagen superior (full width)
 * @param {node} icon - Icono en header (Lucide icon component)
 * @param {string} avatar - URL o inicial para avatar
 * @param {string} avatarColor - Color de fondo del avatar
 * @param {string} title - Título principal
 * @param {string} subtitle - Subtítulo secundario
 * @param {node} badges - Badges/tags (array o elemento)
 * @param {node} children - Contenido principal
 * @param {node} stats - Área de estadísticas
 * @param {node} actions - Botones de acción
 * @param {function} onClick - Callback si el card es clickable
 * @param {string} variant - Estilo: 'default', 'elevated', 'bordered', 'flat'
 * @param {string} borderColor - Color del borde izquierdo (ej: '#3f3f46')
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} hover - Efecto hover (default: true si onClick existe)
 */
function BaseCard({
  // Header options
  image,
  icon: Icon,
  avatar,
  avatarColor = '#6366f1',

  // Content
  title,
  subtitle,
  badges,
  children,

  // Footer options
  stats,
  actions,

  // Behavior
  onClick,
  variant = 'default',
  borderColor,
  className = '',
  hover = onClick ? true : false
}) {
  const isClickable = !!onClick;

  // Variant styles
  const variants = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
    bordered: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600',
    flat: 'bg-gray-50 dark:bg-gray-900'
  };

  return (
    <div
      className={`
        rounded-xl overflow-hidden flex flex-col
        ${variants[variant]}
        ${isClickable ? 'cursor-pointer' : ''}
        ${hover ? 'transition-all hover:border-zinc-500 dark:hover:border-zinc-400' : ''}
        ${className}
      `}
      onClick={onClick}
      style={borderColor ? { borderLeft: `3px solid ${borderColor}` } : {}}
    >
      {/* Imagen superior (full width) */}
      {image && (
        <div className="w-full h-48 overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
          {typeof image === 'string' ? (
            <img
              src={image}
              alt={title || 'Card image'}
              className="w-full h-full object-cover"
            />
          ) : (
            image
          )}
        </div>
      )}

      {/* Header con icono o avatar */}
      {(Icon || avatar) && !image && (
        <div className="p-6 pb-0">
          {Icon && (
            <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 flex items-center justify-center">
              <Icon size={24} strokeWidth={2} />
            </div>
          )}
          {avatar && (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: avatarColor }}
            >
              {avatar}
            </div>
          )}
        </div>
      )}

      {/* Contenido principal */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Título y subtítulo */}
        {title && (
          <div className="mb-3">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Badges */}
        {badges && (
          <div className="flex flex-wrap gap-2 mb-3">
            {Array.isArray(badges) ? badges.map((badge, idx) => (
              <span key={idx}>{badge}</span>
            )) : badges}
          </div>
        )}

        {/* Descripción/contenido */}
        {children && (
          <div className="text-gray-600 dark:text-gray-300 mb-4 flex-1">
            {children}
          </div>
        )}

        {/* Estadísticas */}
        {stats && (
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
            {stats}
          </div>
        )}

        {/* Botones de acción */}
        {actions && (
          <div className="flex gap-2 mt-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default BaseCard;
