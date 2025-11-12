/**
 * BaseCard - Componente card base reutilizable (100% Tailwind CSS + CSS Variables)
 *
 * Sistema unificado de cards con soporte para Grid y List views:
 * - Card con imagen superior
 * - Card con icono/avatar
 * - Card con estadísticas
 * - Card con botones de acción
 * - Card clickable
 * - Soporte Grid/List automático
 *
 * @param {string} viewMode - Modo de vista: 'grid' (vertical) o 'list' (horizontal)
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
 * @param {string} borderColor - Color del borde izquierdo (ej: 'var(--color-accent)')
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} hover - Efecto hover (default: true si onClick existe)
 */
function BaseCard({
  // Layout
  viewMode = 'grid', // 'grid' or 'list'

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
  const isList = viewMode === 'list';

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

  // === LIST VIEW (Horizontal Layout) ===
  if (isList) {
    return (
      <div
        className={`
          rounded-xl overflow-hidden
          flex flex-col md:flex-row
          ${isClickable ? 'cursor-pointer' : ''}
          ${hover ? 'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1' : ''}
          min-h-[100px]
          ${className}
        `}
        onClick={onClick}
        style={cardStyle}
        onMouseEnter={(e) => {
          if (hover) {
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
            e.currentTarget.style.borderColor = 'var(--color-border-focus)';
          }
        }}
        onMouseLeave={(e) => {
          if (hover) {
            e.currentTarget.style.boxShadow = cardStyle.boxShadow || '0 1px 3px rgba(0, 0, 0, 0.06)';
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }
        }}
      >
        {/* Imagen/Avatar en LIST (lado izquierdo, más pequeño) */}
        {image && (
          <div className="md:w-[120px] w-full md:h-auto h-[100px] md:min-h-[100px] overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
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

        {/* Avatar en LIST */}
        {(Icon || avatar) && !image && (
          <div className="md:w-[100px] w-full md:h-auto h-[100px] md:min-h-[100px] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center flex-shrink-0">
            {Icon && (
              <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 flex items-center justify-center">
                <Icon size={24} strokeWidth={2} />
              </div>
            )}
            {avatar && (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-[22px] font-extrabold shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                style={{ backgroundColor: avatarColor }}
              >
                {avatar}
              </div>
            )}
          </div>
        )}

        {/* Contenido en LIST (horizontal layout) */}
        <div className="p-4 md:p-4 flex md:flex-row flex-col md:items-center items-start gap-3 md:gap-6 flex-1">
          {/* Título y badges juntos */}
          <div className="flex flex-col gap-2 md:flex-[0_0_auto] md:min-w-[160px] md:max-w-[220px]">
            {title && (
              <h3
                className="text-lg font-bold m-0 line-clamp-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                className="text-sm line-clamp-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {subtitle}
              </p>
            )}
            {badges && (
              <div className="flex flex-wrap gap-2">
                {Array.isArray(badges) ? badges.map((badge, idx) => (
                  <span key={idx}>{badge}</span>
                )) : badges}
              </div>
            )}
          </div>

          {/* Children content en LIST */}
          {children && (
            <div
              className="md:flex-1 md:min-w-[120px] text-sm line-clamp-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {children}
            </div>
          )}

          {/* Stats en LIST (horizontal) */}
          {stats && (
            <div className="flex gap-4 md:flex-[0_0_auto] md:min-w-[160px]">
              {stats}
            </div>
          )}

          {/* Actions en LIST */}
          {actions && (
            <div className="flex gap-2 md:flex-[0_0_auto]">
              {actions}
            </div>
          )}
        </div>
      </div>
    );
  }

  // === GRID VIEW (Vertical Layout) - DEFAULT ===
  return (
    <div
      className={`
        rounded-xl overflow-hidden flex flex-col
        ${isClickable ? 'cursor-pointer' : ''}
        ${hover ? 'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1' : ''}
        h-full
        ${className}
      `}
      onClick={onClick}
      style={cardStyle}
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
          e.currentTarget.style.borderColor = 'var(--color-border-focus)';
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.boxShadow = cardStyle.boxShadow || '0 1px 3px rgba(0, 0, 0, 0.06)';
          e.currentTarget.style.borderColor = 'var(--color-border)';
        }
      }}
    >
      {/* Imagen superior en GRID (full width, altura estándar) */}
      {image && (
        <div className="w-full h-48 overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
          {typeof image === 'string' ? (
            <img
              src={image}
              alt={title || 'Card image'}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            image
          )}
        </div>
      )}

      {/* Avatar/Icono en GRID (arriba, más grande) */}
      {(Icon || avatar) && !image && (
        <div className="w-full h-[140px] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center flex-shrink-0">
          {Icon && (
            <div className="w-16 h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 flex items-center justify-center">
              <Icon size={32} strokeWidth={2} />
            </div>
          )}
          {avatar && (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-[32px] font-extrabold shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
              style={{ backgroundColor: avatarColor }}
            >
              {avatar}
            </div>
          )}
        </div>
      )}

      {/* Contenido principal en GRID (vertical) */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Título y subtítulo */}
        {title && (
          <div className="flex flex-col gap-2">
            <h3
              className="text-xl font-bold m-0"
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
          <div className="flex flex-wrap gap-2">
            {Array.isArray(badges) ? badges.map((badge, idx) => (
              <span key={idx}>{badge}</span>
            )) : badges}
          </div>
        )}

        {/* Children content */}
        {children && (
          <div
            className="flex-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {children}
          </div>
        )}

        {/* Stats en GRID (vertical u horizontal según diseño) */}
        {stats && (
          <div className="flex items-center gap-4 text-sm">
            {stats}
          </div>
        )}

        {/* Actions en GRID */}
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
