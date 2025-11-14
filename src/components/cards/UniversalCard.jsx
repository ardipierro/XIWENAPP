/**
 * @fileoverview UniversalCard - Componente de card universal
 * Reemplaza: QuickAccessCard, StudentCard, UserCard, LiveClassCard, AIFunctionCard
 *
 * Un solo componente para TODAS las cards de la aplicación
 * Configuración centralizada en cardConfig.js
 *
 * @module components/cards/UniversalCard
 */

import { useState } from 'react';
import { BaseBadge } from '../common';
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
 */
export function UniversalCard({
  // Layout & Variant
  variant = 'default',      // 'default' | 'user' | 'class' | 'content' | 'stats' | 'compact'
  size = 'md',             // 'sm' | 'md' | 'lg' | 'xl'
  layout = 'vertical',     // 'vertical' | 'horizontal'

  // Header
  image,                   // Image URL (para variant='content')
  icon: Icon,              // Lucide icon component (para variant='default')
  avatar,                  // Avatar text o URL (para variant='user')
  avatarColor,             // Custom avatar background color
  headerColor,             // Custom header background color
  badge,                   // Badge en top-right del header

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
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Get configurations
  const variantConfig = getVariantConfig(variant);
  const sizeConfig = getSizeConfig(size);
  const layoutConfig = getLayoutConfig(layout);

  // Generate classes and styles
  const classes = generateCardClasses(variant, size, layout);
  const styles = generateCardStyles(variant, size);

  /**
   * Handle mouse enter
   */
  const handleMouseEnter = (e) => {
    if (!variantConfig.hoverEnabled || disabled) return;
    setIsHovered(true);

    const hoverStyles = getHoverStyles(variant);
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

    const normalStyles = getNormalStyles(variant);
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
        {avatar && variantConfig.showAvatar && (
          <div
            className="relative z-10 rounded-full flex items-center justify-center text-white font-extrabold shadow-lg"
            style={{
              width: variantConfig.avatarSize,
              height: variantConfig.avatarSize,
              fontSize: variantConfig.avatarFontSize,
              backgroundColor: avatarColor || '#3b82f6',
            }}
          >
            {typeof avatar === 'string' && avatar.length <= 2
              ? avatar.toUpperCase()
              : avatar}
          </div>
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
      <div className="flex flex-wrap gap-2 mt-3">
        {badges.map((badgeProps, index) => (
          <BaseBadge key={index} {...badgeProps} />
        ))}
      </div>
    );
  };

  /**
   * Render Stats
   */
  const renderStats = () => {
    if (!stats || stats.length === 0 || !variantConfig.showStats) return null;

    const isHorizontal = variantConfig.statsLayout === 'horizontal';

    return (
      <div
        className={`flex ${
          isHorizontal ? 'flex-row' : 'flex-col'
        } gap-4 mt-4 pt-4 border-t`}
        style={{ borderColor: 'var(--color-border)' }}
      >
        {stats.map((stat, index) => {
          const StatIcon = stat.icon;
          return (
            <div
              key={index}
              className={`flex items-center gap-2 ${isHorizontal ? 'flex-1' : ''}`}
            >
              {StatIcon && (
                <StatIcon
                  size={18}
                  className="flex-shrink-0"
                  style={{ color: 'var(--color-text-secondary)' }}
                />
              )}
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
      <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
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

  return (
    <article
      className={`${classes.container} ${className} ${
        selected ? 'ring-2 ring-primary-500' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{
        ...styles.container,
        ...style,
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={ariaLabel || title}
      role={role}
      aria-disabled={disabled}
    >
      {/* Live Indicator (absolute position) */}
      {renderLiveIndicator()}

      {/* Header */}
      {renderHeader()}

      {/* Content */}
      <div className={classes.content} style={styles.content}>
        {/* Text Content */}
        <div className="card-text">
          {title && (
            <h3 className={classes.title} style={{ color: 'var(--color-text-primary)' }}>
              {title}
            </h3>
          )}

          {subtitle && (
            <p
              className={classes.subtitle}
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {subtitle}
            </p>
          )}

          {description && (
            <p
              className={`${classes.description} mt-2`}
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Meta Info (variant='class') */}
        {renderMeta()}

        {/* Badges */}
        {renderBadges()}

        {/* Stats */}
        {renderStats()}

        {/* Big Number (variant='stats') */}
        {renderBigNumber()}

        {/* Custom Children */}
        {children}

        {/* Actions */}
        {renderActions()}
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
