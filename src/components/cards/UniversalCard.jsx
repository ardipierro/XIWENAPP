/**
 * @fileoverview UniversalCard - Componente de card universal
 * Reemplaza: QuickAccessCard, StudentCard, UserCard, LiveClassCard, AIFunctionCard
 *
 * Un solo componente para TODAS las cards de la aplicación
 * Configuración centralizada en cardConfig.js
 *
 * @module components/cards/UniversalCard
 */

import { useState, useMemo, useRef } from 'react';
import { BaseBadge } from '../common';
import { useCardConfig } from '../../contexts/CardConfigContext';
import UserAvatar from '../UserAvatar';
import CardDeleteButton from './CardDeleteButton';
import {
  getVariantConfig,
  getSizeConfig,
  getLayoutConfig,
  generateCardClasses,
  generateCardStyles,
  getHoverStyles,
  getNormalStyles,
} from './cardConfig';

/**
 * UniversalCard - Card universal con todas las variantes
 *
 * @example
 * // Card de usuario
 * <UniversalCard
 *   variant="user"
 *   size="md"
 *   avatar="JP"
 *   title="Juan Pérez"
 *   subtitle="juan@example.com"
 *   badges={[{ variant: 'success', children: 'Student' }]}
 *   stats={[
 *     { label: 'Cursos', value: 12, icon: BookOpen },
 *     { label: 'Créditos', value: 450 }
 *   ]}
 *   onClick={handleClick}
 * />
 *
 * @example
 * // Card de clase en vivo
 * <UniversalCard
 *   variant="class"
 *   title="Clase de Matemáticas"
 *   subtitle="Prof. María García"
 *   showLiveIndicator
 *   meta={[
 *     { icon: '👥', text: '15/30 participantes' },
 *     { icon: '⏱️', text: 'Hace 15 min' }
 *   ]}
 * />
 *
 * @example
 * // Card con contenido custom (SIN header - auto-detectado)
 * <UniversalCard variant="default" size="sm">
 *   <div className="flex items-center justify-between">
 *     <span>Contenido custom</span>
 *     <span>123</span>
 *   </div>
 * </UniversalCard>
 *
 * @example
 * // Forzar mostrar header vacío (poco común)
 * <UniversalCard variant="default" showHeader={true}>
 *   <div>Mi contenido</div>
 * </UniversalCard>
 */
export function UniversalCard({
  // Layout & Variant
  variant = 'default',      // 'default' | 'user' | 'class' | 'content' | 'stats' | 'compact'
  size = 'md',             // 'sm' | 'md' | 'lg' | 'xl'
  layout = 'vertical',     // 'vertical' | 'horizontal' | 'row'

  // Header
  image,                   // Image URL (para variant='content')
  icon: Icon,              // Lucide icon component (para variant='default')
  avatar,                  // Avatar text o URL (para variant='user') - DEPRECATED: use userId instead
  avatarColor,             // Custom avatar background color - DEPRECATED when using userId
  userId,                  // User ID para cargar avatar desde Firebase (recomendado)
  userName,                // User name para fallback de iniciales
  userEmail,               // User email para fallback de iniciales
  headerColor,             // Custom header background color
  badge,                   // Badge en top-right del header
  showHeader,              // Control manual del header: true=forzar mostrar, false=forzar ocultar, undefined=auto-detectar

  // Content
  title,                   // Required
  subtitle,
  description,
  badges = [],             // Array of badge props { variant, children }
  stats = [],              // Array of stats { label, value, icon }
  meta = [],               // Array of meta info { icon, text } (para variant='class')

  // Special: Live Indicator (variant='class')
  showLiveIndicator = false,
  liveText = 'EN VIVO',

  // Special: Big Number (variant='stats')
  bigNumber,               // Main number to display
  trend,                   // Trend direction: 'up' | 'down' | 'neutral'
  trendText,               // Text below trend "vs. mes anterior"

  // Actions
  actions,                 // Array of action components or single JSX
  onClick,
  onDelete,                // Callback para eliminar (auto-renderiza CardDeleteButton)
  deleteConfirmMessage,    // Mensaje de confirmación personalizado para eliminar

  // States
  loading = false,
  selected = false,
  disabled = false,

  // Children (custom content)
  children,

  // Accessibility
  ariaLabel,
  role = 'article',

  // Advanced
  className = '',
  style = {},
  customConfig,            // Custom config override (para preview/testing)
}) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  // Get global saved config (si existe)
  const { config: globalConfig } = useCardConfig();

  // Get configurations con merge correcto (memoizado para evitar loops)
  const variantConfig = useMemo(() => {
    if (customConfig) return customConfig;

    const defaultVariantConfig = getVariantConfig(variant);
    return {
      ...defaultVariantConfig,
      ...(globalConfig && globalConfig[variant])
    };
  }, [variant, customConfig, globalConfig]);

  const sizeConfig = getSizeConfig(size);
  const layoutConfig = getLayoutConfig(layout);

  // Generate classes and styles - PASS RESOLVED variantConfig object (BUG FIX)
  const classes = generateCardClasses(variantConfig, size, layout);
  const styles = useMemo(() => {
    // Determinar minHeight según layout y variant
    let minHeight;
    if (layout === 'row') {
      // Layout row: altura basada en el tipo de variant
      if (variant === 'user') {
        minHeight = layoutConfig.minHeightUser || '96px';
      } else if (variant === 'compact') {
        minHeight = layoutConfig.minHeightCompact || '80px';
      } else {
        minHeight = layoutConfig.minHeight || '140px';
      }
    } else if (layout === 'horizontal') {
      minHeight = '96px';
    } else {
      minHeight = sizeConfig.minHeight;
    }

    return {
      container: {
        backgroundColor: 'var(--color-bg-secondary)',
        border: `1px solid ${variantConfig.normalBorderColor}`,
        boxShadow: variantConfig.normalShadow,
        display: 'flex',
        flexDirection: layout === 'row' || layout === 'horizontal' ? 'row' : 'column',
        alignItems: layout === 'row' ? 'stretch' : undefined,
        ...(variantConfig.cardHeight && layout !== 'row'
          ? { height: variantConfig.cardHeight, minHeight: 'unset', overflow: 'hidden' }
          : { minHeight }
        ),
        transitionDuration: variantConfig.transitionDuration,
        transitionTimingFunction: variantConfig.transitionTiming,
      },
      header: {
        height: layout === 'horizontal' || layout === 'row' ? '100%' : variantConfig.headerHeight,
        width: layout === 'horizontal' || layout === 'row' ? layoutConfig.headerWidth : 'auto',
      },
      content: {
        padding: (layout === 'horizontal' || layout === 'row') && layoutConfig.contentPadding
          ? layoutConfig.contentPadding
          : variantConfig.contentPadding,
      },
    };
  }, [variantConfig, layout, variant, sizeConfig, layoutConfig]);

  /**
   * Handle mouse enter
   */
  const handleMouseEnter = (e) => {
    if (!variantConfig.hoverEnabled || disabled) return;
    setIsHovered(true);

    const hoverStyles = getHoverStyles(variantConfig);
    if (hoverStyles) {
      Object.assign(e.currentTarget.style, hoverStyles);
    }
  };

  /**
   * Handle mouse leave
   */
  const handleMouseLeave = (e) => {
    if (!variantConfig.hoverEnabled) return;
    setIsHovered(false);

    const normalStyles = getNormalStyles(variantConfig);
    Object.assign(e.currentTarget.style, normalStyles);
  };

  /**
   * Handle click
   */
  const handleClick = (e) => {
    if (disabled) return;
    if (onClick) {
      onClick(e);
    }
  };

  /**
   * Render Header
   */
  const renderHeader = () => {
    // Skip header si es transparent (variant='class')
    if (variantConfig.headerBg === 'transparent') {
      return null;
    }

    // Auto-detectar si el header tiene contenido visual REAL
    // Badge solo NO cuenta como contenido visual
    const hasVisualContent = image || Icon || avatar || userId;

    // Determinar si mostrar el header:
    // - Si showHeader es explícito (true/false), usarlo
    // - Si es undefined, auto-detectar basado en contenido VISUAL
    const shouldShowHeader = showHeader !== undefined
      ? showHeader
      : hasVisualContent;

    // Si no debe mostrarse, retornar null
    if (!shouldShowHeader) {
      return null;
    }

    return (
      <div
        className={`${classes.header} relative`}
        style={{
          height: variantConfig.headerHeight,
          backgroundColor: headerColor || 'transparent',
        }}
      >
        {/* Gradient background */}
        {variantConfig.headerBg === 'gradient' && (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${variantConfig.headerGradient}`}
          />
        )}

        {/* Image (variant='content') */}
        {image && variantConfig.headerBg === 'image' && (
          <img
            src={image}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
            style={{
              transform: isHovered && variantConfig.imageScaleOnHover
                ? `scale(${variantConfig.imageScale})`
                : 'scale(1)',
            }}
            loading="lazy"
          />
        )}

        {/* Icon (variant='default') */}
        {Icon && variantConfig.showIcon && (
          <div className="relative z-10 text-zinc-500 dark:text-zinc-400">
            <Icon size={variantConfig.iconSize} strokeWidth={2} />
          </div>
        )}

        {/* Avatar (variant='user') */}
        {(avatar || userId) && variantConfig.showAvatar && (
          userId ? (
            // New approach: Use UserAvatar component for consistent user avatars
            <div className="relative z-10">
              <UserAvatar
                userId={userId}
                name={userName || title}
                email={userEmail || subtitle}
                size={layout === 'horizontal' ? 'md' : 'lg'}
              />
            </div>
          ) : (
            // Legacy approach: Manual avatar for backward compatibility
            <div
              className="relative z-10 rounded-full flex items-center justify-center text-white font-extrabold shadow-lg"
              style={{
                width: layout === 'horizontal' && layoutConfig.avatarSize
                  ? layoutConfig.avatarSize
                  : variantConfig.avatarSize,
                height: layout === 'horizontal' && layoutConfig.avatarSize
                  ? layoutConfig.avatarSize
                  : variantConfig.avatarSize,
                fontSize: layout === 'horizontal' ? '18px' : variantConfig.avatarFontSize,
                backgroundColor: avatarColor || '#5b8fa3',
              }}
            >
              {typeof avatar === 'string' && avatar.length <= 2
                ? avatar.toUpperCase()
                : avatar}
            </div>
          )
        )}

        {/* Top-right badge */}
        {badge && (
          <div className="absolute top-2 right-2 z-20">
            {typeof badge === 'string' ? (
              <BaseBadge variant="primary" size="sm">
                {badge}
              </BaseBadge>
            ) : (
              badge
            )}
          </div>
        )}
      </div>
    );
  };

  /**
   * Render Live Indicator (variant='class')
   */
  const renderLiveIndicator = () => {
    if (!showLiveIndicator || !variantConfig.showLiveIndicator) return null;

    return (
      <div
        className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-bold shadow-lg"
      >
        <span
          className={`w-2 h-2 rounded-full bg-white ${
            variantConfig.liveIndicatorPulse ? 'animate-pulse' : ''
          }`}
        />
        <span>{liveText}</span>
      </div>
    );
  };

  /**
   * Render Badges
   */
  const renderBadges = () => {
    if (!badges || badges.length === 0 || !variantConfig.showBadges) return null;

    return (
      <div className={`flex flex-wrap ${layout === 'horizontal' ? 'gap-1' : 'gap-2'}`}>
        {badges.map((badge, index) => {
          // Soportar tanto componentes JSX como objetos de props
          if (typeof badge === 'object' && badge.type) {
            // Es un componente JSX (ej: <CategoryBadge />)
            return <div key={index}>{badge}</div>;
          } else {
            // Es un objeto de props para BaseBadge
            const { key, ...restProps } = badge;
            return (
              <BaseBadge key={index} size="sm" {...restProps} />
            );
          }
        })}
      </div>
    );
  };

  /**
   * Render Stats
   */
  const renderStats = () => {
    if (!stats || stats.length === 0 || !variantConfig.showStats) return null;

    const isHorizontal = variantConfig.statsLayout === 'horizontal' || layout === 'horizontal';
    const isCompact = layout === 'horizontal';

    return (
      <div
        className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} ${isCompact ? 'gap-3' : 'gap-4'}`}
      >
        {stats.map((stat, index) => {
          const StatIcon = stat.icon;
          return (
            <div
              key={index}
              className={`flex items-center gap-1.5 ${isHorizontal ? 'flex-1' : ''}`}
            >
              {StatIcon && (
                <StatIcon
                  size={isCompact ? 14 : 18}
                  className="flex-shrink-0"
                  style={{ color: 'var(--color-text-secondary)' }}
                />
              )}
              {isCompact ? (
                // Modo horizontal compacto: inline
                <span
                  className="text-sm font-semibold whitespace-nowrap"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {stat.value}
                </span>
              ) : (
                // Modo vertical: columna con label
                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-xl font-extrabold leading-none"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {stat.value}
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {stat.label}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * Render Meta Info (variant='class')
   */
  const renderMeta = () => {
    if (!meta || meta.length === 0 || !variantConfig.showMeta) return null;

    return (
      <div className="flex flex-wrap gap-3 mt-3">
        {meta.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-1.5 text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {item.icon && <span>{item.icon}</span>}
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Render Big Number (variant='stats')
   */
  const renderBigNumber = () => {
    if (bigNumber === undefined || !variantConfig.showBigNumber) return null;

    return (
      <div className="flex flex-col gap-2 mt-2">
        <div
          className="text-4xl font-extrabold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {bigNumber}
        </div>

        {trend && variantConfig.showTrend && (
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-semibold ${
                trend === 'up'
                  ? 'text-green-500'
                  : trend === 'down'
                  ? 'text-red-500'
                  : 'text-gray-500'
              }`}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </span>
            {trendText && (
              <span
                className="text-xs"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {trendText}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  /**
   * Render Actions
   */
  const renderActions = () => {
    if (!actions) return null;

    return (
      <div className="flex gap-2">
        {Array.isArray(actions) ? (
          actions.map((action, index) => (
            <div key={index} onClick={(e) => e.stopPropagation()}>
              {action}
            </div>
          ))
        ) : (
          <div onClick={(e) => e.stopPropagation()}>{actions}</div>
        )}
      </div>
    );
  };

  // ⭐ Para layout="row", usar clases Tailwind directamente para consistencia
  const isRowLayout = layout === 'row' && layoutConfig.useTailwindClasses;
  const rowContainerClasses = isRowLayout
    ? `${layoutConfig.containerClass} ${layoutConfig.bgClass} ${layoutConfig.borderClass} ${layoutConfig.hoverClass}`
    : '';

  return (
    <article
      ref={cardRef}
      className={`${isRowLayout ? rowContainerClasses : classes.container} ${className} ${
        selected ? 'ring-2 ring-primary-500' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={isRowLayout ? style : { ...styles.container, ...style }}
      onClick={handleClick}
      onMouseEnter={isRowLayout ? undefined : handleMouseEnter}
      onMouseLeave={isRowLayout ? undefined : handleMouseLeave}
      aria-label={ariaLabel || title}
      role={role}
      aria-disabled={disabled}
    >
      {/* Live Indicator (absolute position) */}
      {renderLiveIndicator()}

      {/* Header - Solo en modo vertical */}
      {layout === 'vertical' && renderHeader()}

      {/* Content - FORZAR flex-1 para que use todo el espacio restante */}
      <div
        className={isRowLayout
          ? 'flex-1 flex flex-row items-stretch'
          : `${classes.content} flex-1 flex ${layout === 'horizontal' ? 'flex-row items-center' : 'flex-col'}`
        }
        style={{
          ...(isRowLayout ? {} : styles.content),
          minHeight: isRowLayout
            ? (variant === 'user' ? layoutConfig.minHeightUser :
               variant === 'compact' ? layoutConfig.minHeightCompact :
               layoutConfig.minHeightCompact) // Usar compacto por defecto en row
            : 0,
          overflow: 'hidden'
        }}
      >
        {layout === 'row' ? (
          <>
            {/* ROW Layout - Vista de Lista Estirada */}

            {/* Sección 1: Imagen/Avatar/Ícono cuadrado (ancho = alto de la fila) */}
            <div
              className={`flex-shrink-0 overflow-hidden flex items-center justify-center ${
                isRowLayout && !image ? layoutConfig.iconBgClass : ''
              }`}
              style={{
                height: '100%',
                aspectRatio: '1 / 1',
                ...(!isRowLayout && (variant === 'user' || !image) ? { backgroundColor: 'var(--color-bg-tertiary)' } : {}),
              }}
            >
              {/* Imagen (variant='content') */}
              {image && (
                <img
                  src={image}
                  alt={title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}

              {/* Avatar (variant='user') */}
              {!image && (avatar || userId) && (
                userId ? (
                  <UserAvatar
                    userId={userId}
                    name={userName || title}
                    email={userEmail || subtitle}
                    size="lg"
                  />
                ) : (
                  <div
                    className="rounded-full flex items-center justify-center text-white font-extrabold shadow-lg"
                    style={{
                      width: '64px',
                      height: '64px',
                      fontSize: '24px',
                      backgroundColor: avatarColor || '#3b82f6',
                    }}
                  >
                    {typeof avatar === 'string' && avatar.length <= 2
                      ? avatar.toUpperCase()
                      : avatar}
                  </div>
                )
              )}

              {/* Ícono (variant='default', 'compact', etc.) */}
              {!image && !avatar && !userId && Icon && (
                <Icon size={48} className="text-gray-500 dark:text-gray-400" strokeWidth={2} />
              )}
            </div>

            {/* Sección 2: Contenido principal (flex-1, se estira) */}
            <div className="flex-1 min-w-0 flex flex-col justify-center" style={{ padding: styles.content.padding }}>
              {/* Badges */}
              {variantConfig.showBadges && badges && badges.length > 0 && (
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {renderBadges()}
                </div>
              )}

              {/* Título */}
              {title && (
                <h3 className="text-lg font-bold truncate mb-1 text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}

              {/* Subtitle */}
              {subtitle && (
                <p className="text-sm line-clamp-1 mb-2 text-gray-600 dark:text-gray-400">
                  {subtitle}
                </p>
              )}

              {/* Description */}
              {description && (
                <p className="text-sm line-clamp-1 mb-2 text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              )}

              {/* Meta Info (para variant='class') */}
              {renderMeta()}

              {/* Children custom */}
              {children}
            </div>

            {/* Sección 3: Stats (si existen) */}
            {stats && stats.length > 0 && variantConfig.showStats && (
              <div className="flex-shrink-0 flex items-center gap-6 px-5">
                {renderStats()}
              </div>
            )}

            {/* Sección 4: Actions (botones al final) */}
            <div className="flex-shrink-0 flex items-center gap-2 pr-4" onClick={(e) => e.stopPropagation()}>
              {actions && renderActions()}

              {/* Delete Button */}
              {onDelete && variantConfig.deleteButton?.enabled && (
                <CardDeleteButton
                  onDelete={onDelete}
                  variant={variantConfig.deleteButton.variant || 'solid'}
                  size={variantConfig.deleteButton.size || 'md'}
                  confirmMessage={deleteConfirmMessage}
                  requireConfirm={variantConfig.deleteButton.requireConfirm}
                  disabled={disabled}
                />
              )}
            </div>
          </>
        ) : layout === 'horizontal' ? (
          <>
            {/* Horizontal Layout - Avatar/Icono pequeño a la izquierda */}

            {/* Avatar/Icono/Imagen a la izquierda (48px) */}
            {(avatar || Icon || image) && (
              <div className="flex-shrink-0 mr-3">
                {/* Avatar */}
                {avatar && (
                  <div
                    className="rounded-full flex items-center justify-center text-white font-bold shadow-md"
                    style={{
                      width: '48px',
                      height: '48px',
                      fontSize: '18px',
                      backgroundColor: avatarColor || '#5b8fa3',
                    }}
                  >
                    {typeof avatar === 'string' && avatar.length <= 2
                      ? avatar.toUpperCase()
                      : avatar}
                  </div>
                )}

                {/* Icono */}
                {Icon && !avatar && (
                  <div
                    className="rounded-lg flex items-center justify-center"
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'var(--color-bg-tertiary)',
                    }}
                  >
                    <Icon size={24} style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                )}

                {/* Imagen */}
                {image && !avatar && !Icon && (
                  <img
                    src={image}
                    alt={title}
                    className="rounded-lg object-cover"
                    style={{
                      width: '48px',
                      height: '48px',
                    }}
                  />
                )}
              </div>
            )}

            {/* Sección 1: Texto principal (flex-1) */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
              {title && (
                <h3 className={classes.title} style={{ color: 'var(--color-text-primary)' }}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  className={`${classes.subtitle} truncate`}
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {subtitle}
                </p>
              )}
            </div>

            {/* Sección 2: Stats (espacio medio si existen) */}
            {stats && stats.length > 0 && (
              <div className="flex-shrink-0 px-2">
                {renderStats()}
              </div>
            )}

            {/* Sección 3: Badges (espacio medio si existen) */}
            {badges && badges.length > 0 && (
              <div className="flex-shrink-0 px-2">
                {renderBadges()}
              </div>
            )}

            {/* Sección 4: Actions (al final) */}
            {actions && (
              <div className={`flex-shrink-0 flex ${layout === 'horizontal' ? 'gap-1.5' : 'gap-2'}`}>
                {Array.isArray(actions) ? (
                  actions.map((action, index) => (
                    <div key={index} onClick={(e) => e.stopPropagation()}>
                      {action}
                    </div>
                  ))
                ) : (
                  <div onClick={(e) => e.stopPropagation()}>{actions}</div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Vertical Layout - STICKY FOOTER FIX */}

            {/* Contenido principal + Children - Con scroll si es muy largo */}
            <div
              className="flex-1"
              style={{
                minHeight: 0,
                overflowY: variantConfig.contentOverflow || 'auto'
              }}
            >
              <div className="card-text">
                {title && (
                  <h3 className={classes.title} style={{ color: 'var(--color-text-primary)' }}>
                    {title}
                  </h3>
                )}

                {subtitle && (
                  <div
                    className={classes.subtitle}
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {subtitle}
                  </div>
                )}

                {description && (
                  <p
                    className={`${classes.description} mt-2 line-clamp-3`}
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {description}
                  </p>
                )}
              </div>

              {/* Meta Info (variant='class') */}
              {renderMeta()}

              {/* Big Number (variant='stats') */}
              {renderBigNumber()}

              {/* Custom Children */}
              {children && (
                <div className="mt-3">
                  {children}
                </div>
              )}
            </div>

            {/* Footer sticky - FUERA del área scrolleable */}
            {(badges?.length > 0 || stats?.length > 0 || actions || (onDelete && variantConfig.deleteButton?.enabled)) && variantConfig.footerSticky && (
              <div className={`flex-shrink-0 pt-4 flex flex-col ${variantConfig.footerSpacing}`}>
                {/* Badges */}
                {renderBadges()}

                {/* Stats */}
                {renderStats()}

                {/* Actions Row: DeleteButton (left) + Regular Actions (right) */}
                {(actions || (onDelete && variantConfig.deleteButton?.enabled)) && (
                  <div className="flex items-center justify-between gap-2">
                    {/* Delete Button - Esquina inferior IZQUIERDA */}
                    {onDelete && variantConfig.deleteButton?.enabled && (
                      <CardDeleteButton
                        onDelete={onDelete}
                        variant={variantConfig.deleteButton.variant || 'solid'}
                        size={variantConfig.deleteButton.size || 'md'}
                        confirmMessage={deleteConfirmMessage}
                        requireConfirm={variantConfig.deleteButton.requireConfirm}
                        disabled={disabled}
                      />
                    )}

                    {/* Regular Actions - Lado derecho */}
                    {actions && (
                      <div className="flex gap-2 ml-auto">
                        {renderActions()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Footer NO sticky (para stats cards y otros que no necesitan) */}
            {(badges?.length > 0 || stats?.length > 0 || actions || (onDelete && variantConfig.deleteButton?.enabled)) && !variantConfig.footerSticky && (
              <div className={`flex-shrink-0 pt-4 flex flex-col ${variantConfig.footerSpacing}`}>
                {/* Badges */}
                {renderBadges()}

                {/* Stats */}
                {renderStats()}

                {/* Actions Row: DeleteButton (left) + Regular Actions (right) */}
                {(actions || (onDelete && variantConfig.deleteButton?.enabled)) && (
                  <div className="flex items-center justify-between gap-2">
                    {/* Delete Button - Esquina inferior IZQUIERDA */}
                    {onDelete && variantConfig.deleteButton?.enabled && (
                      <CardDeleteButton
                        onDelete={onDelete}
                        variant={variantConfig.deleteButton.variant || 'solid'}
                        size={variantConfig.deleteButton.size || 'md'}
                        confirmMessage={deleteConfirmMessage}
                        requireConfirm={variantConfig.deleteButton.requireConfirm}
                        disabled={disabled}
                      />
                    )}

                    {/* Regular Actions - Lado derecho */}
                    {actions && (
                      <div className="flex gap-2 ml-auto">
                        {renderActions()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center backdrop-blur-sm rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      )}
    </article>
  );
}

export default UniversalCard;
