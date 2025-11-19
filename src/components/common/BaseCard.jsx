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
  avatarColor = '#5b6b8f',

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

  // Variant styles usando CSS variables
  const getVariantStyle = () => {
    const baseStyle = {
      backgroundColor: 'var(--color-bg-primary)',
      border: '1px solid var(--color-border)'
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        };
      case 'bordered':
        return {
          ...baseStyle,
          borderWidth: '2px'
        };
      case 'flat':
        return {
          backgroundColor: 'var(--color-bg-secondary)',
          border: 'none'
        };
      default:
        return baseStyle;
    }
  };

  const cardStyle = {
    ...getVariantStyle(),
    ...(borderColor ? { borderLeft: `3px solid ${borderColor}` } : {})
  };

  return (
    <div
      className={`
        rounded-xl overflow-hidden flex flex-col
        ${isClickable ? 'cursor-pointer' : ''}
        ${hover ? 'transition-all duration-200' : ''}
        ${className}
      `}
      onClick={onClick}
      style={cardStyle}
    >
      {/* Imagen superior (full width) - Solo si existe */}
      {image && (
        <div className="w-full h-48 overflow-hidden flex-shrink-0">
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
        <div className="p-5 pb-0">
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
      <div className="p-5 flex-1 flex flex-col">
        {/* Título y subtítulo */}
        {title && (
          <div className="mb-3">
            <h3
              className="text-xl font-bold mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {title}
            </h3>
            {subtitle && (
              <p
                className="text-sm"
                style={{ color: 'var(--color-text-secondary)' }}
              >
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
          <div
            className="mb-4 flex-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {children}
          </div>
        )}

        {/* Estadísticas */}
        {stats && (
          <div
            className="flex items-center gap-4 text-sm mb-4"
            style={{ color: 'var(--color-text-secondary)' }}
          >
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
