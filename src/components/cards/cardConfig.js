/**
 * @fileoverview Configuración centralizada del sistema de cards
 * ⭐ ESTE ES EL ÚNICO LUGAR donde se configuran estilos de cards
 *
 * Para modificar cómo se ven las cards en TODA la app, edita este archivo.
 *
 * @module components/cards/cardConfig
 */

/**
 * Variantes de cards con sus configuraciones
 * Cada variante define el comportamiento visual completo de la card
 */
export const cardVariants = {
  /**
   * DEFAULT - Card estándar para acceso rápido
   * Usado en: Dashboard home, quick access, widgets
   * Reemplaza: QuickAccessCard
   */
  default: {
    // Header
    headerHeight: '128px',         // 32 en Tailwind (h-32)
    headerBg: 'gradient',          // 'gradient' | 'solid' | 'image' | 'transparent'
    headerGradient: 'from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-900',

    // Content
    contentPadding: '20px',        // p-5 en Tailwind

    // Hover Effects
    hoverEnabled: true,
    hoverTransform: '-4px',        // translateY
    hoverShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
    hoverBorderColor: 'var(--color-border-focus)',

    // Normal State
    normalShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
    normalBorderColor: 'var(--color-border)',

    // Transitions
    transitionDuration: '300ms',
    transitionTiming: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Extras
    showIcon: true,
    iconSize: 48,
    showBadges: true,
    showStats: true,
  },

  /**
   * USER - Card para mostrar usuarios/estudiantes
   * Usado en: Lista de estudiantes, gestión de usuarios
   * Reemplaza: StudentCard, UserCard
   */
  user: {
    // Header
    headerHeight: '100px',
    headerBg: 'gradient',
    headerGradient: 'from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-900',

    // Avatar
    showAvatar: true,
    avatarSize: '56px',           // 14 en Tailwind (w-14 h-14)
    avatarFontSize: '22px',

    // Content
    contentPadding: '20px',

    // Badges
    showRoleBadge: true,
    showStatusBadge: true,
    showBadges: true,

    // Stats
    showStats: true,
    statsLayout: 'horizontal',     // 'horizontal' | 'vertical'

    // Hover Effects
    hoverEnabled: true,
    hoverTransform: '-4px',
    hoverShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
    hoverBorderColor: 'var(--color-border-focus)',

    // Normal State
    normalShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
    normalBorderColor: 'var(--color-border)',

    // Transitions
    transitionDuration: '300ms',
    transitionTiming: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  /**
   * CLASS - Card para clases en vivo
   * Usado en: Clases activas, sesiones en vivo
   * Reemplaza: LiveClassCard
   */
  class: {
    // Header
    headerHeight: 'auto',
    headerBg: 'transparent',

    // Content
    contentPadding: '24px',

    // Live Indicator
    showLiveIndicator: true,
    liveIndicatorPosition: 'top-left',  // 'top-left' | 'top-right'
    liveIndicatorPulse: true,

    // Meta Info
    showMeta: true,
    metaIcons: true,

    // Hover Effects
    hoverEnabled: true,
    hoverTransform: '-2px',        // Menos pronunciado que default
    hoverShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
    hoverBorderColor: 'var(--color-border-focus)',

    // Normal State
    normalShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
    normalBorderColor: 'var(--color-border)',

    // Transitions
    transitionDuration: '300ms',
    transitionTiming: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Extras
    showParticipants: true,
    showDuration: true,
  },

  /**
   * CONTENT - Card para contenido educativo (cursos, lecciones)
   * Usado en: Galería de cursos, biblioteca de contenidos
   */
  content: {
    // Header (imagen del curso)
    headerHeight: '192px',         // h-48 (más alto para imágenes)
    headerBg: 'image',
    headerImageFit: 'cover',

    // Content
    contentPadding: '20px',

    // Thumbnail
    showThumbnail: true,

    // Hover Effects
    hoverEnabled: true,
    hoverTransform: '-4px',
    hoverShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
    hoverBorderColor: 'var(--color-border-focus)',

    // Image Hover
    imageScaleOnHover: true,
    imageScale: '1.05',

    // Normal State
    normalShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
    normalBorderColor: 'var(--color-border)',

    // Transitions
    transitionDuration: '300ms',
    transitionTiming: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Extras
    showProgress: true,
    showBadges: true,
    showAuthor: true,
  },

  /**
   * STATS - Card para mostrar estadísticas/métricas
   * Usado en: Dashboard analytics, widgets de stats
   */
  stats: {
    // Header
    headerHeight: '80px',
    headerBg: 'solid',
    headerColor: 'var(--color-bg-tertiary)',

    // Content
    contentPadding: '16px',

    // Big Number Display
    showBigNumber: true,
    bigNumberSize: '36px',
    bigNumberWeight: 'extrabold',

    // Hover Effects (minimal para stats)
    hoverEnabled: false,
    hoverTransform: '0',
    hoverShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',

    // Normal State
    normalShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
    normalBorderColor: 'var(--color-border)',

    // Transitions
    transitionDuration: '200ms',
    transitionTiming: 'ease-in-out',

    // Extras
    showTrend: true,              // Mostrar trend arrow
    showComparisonText: true,     // "vs. mes anterior"
  },

  /**
   * COMPACT - Card compacta para listas densas
   * Usado en: Listas compactas, sidebars
   */
  compact: {
    // Header
    headerHeight: '60px',
    headerBg: 'gradient',
    headerGradient: 'from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800',

    // Content
    contentPadding: '12px',

    // Icon
    showIcon: true,
    iconSize: 24,

    // Hover Effects
    hoverEnabled: true,
    hoverTransform: '-2px',
    hoverShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    hoverBorderColor: 'var(--color-border-focus)',

    // Normal State
    normalShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    normalBorderColor: 'var(--color-border)',

    // Transitions
    transitionDuration: '200ms',
    transitionTiming: 'ease-in-out',

    // Extras
    showBadges: true,
    maxBadges: 2,
  },
};

/**
 * Tamaños de cards
 * Mobile-first: sm es el base, crece con viewport
 */
export const cardSizes = {
  sm: {
    minHeight: '200px',
    padding: '16px',
    titleSize: 'text-base',      // 16px
    subtitleSize: 'text-sm',     // 14px
    descriptionSize: 'text-xs',  // 12px
  },
  md: {
    minHeight: '260px',
    padding: '20px',
    titleSize: 'text-lg',        // 18px
    subtitleSize: 'text-base',   // 16px
    descriptionSize: 'text-sm',  // 14px
  },
  lg: {
    minHeight: '320px',
    padding: '24px',
    titleSize: 'text-xl',        // 20px
    subtitleSize: 'text-lg',     // 18px
    descriptionSize: 'text-base', // 16px
  },
  xl: {
    minHeight: '400px',
    padding: '28px',
    titleSize: 'text-2xl',       // 24px
    subtitleSize: 'text-xl',     // 20px
    descriptionSize: 'text-lg',  // 18px
  },
};

/**
 * Layouts de cards
 * Define la orientación del contenido
 */
export const cardLayouts = {
  vertical: {
    flexDirection: 'flex-col',
    headerPosition: 'top',
  },
  horizontal: {
    flexDirection: 'flex-row',
    headerPosition: 'left',
    headerWidth: '80px',         // Más compacto para horizontal
    avatarSize: '48px',          // Avatar más pequeño en horizontal
    contentPadding: '16px',      // Padding reducido
    statsLayout: 'inline',       // Stats en línea horizontal
  },
};

/**
 * Configuración de grid columns responsive
 * Mobile-first: 1 columna base, crece con viewport
 */
export const gridColumns = {
  default: {
    base: 'grid-cols-1',         // Mobile: 1 columna
    sm: 'sm:grid-cols-2',        // 640px+: 2 columnas
    md: 'md:grid-cols-2',        // 768px+: 2 columnas
    lg: 'lg:grid-cols-3',        // 1024px+: 3 columnas
    xl: 'xl:grid-cols-4',        // 1280px+: 4 columnas
  },
  compact: {
    base: 'grid-cols-1',
    sm: 'sm:grid-cols-2',
    md: 'md:grid-cols-3',
    lg: 'lg:grid-cols-4',
    xl: 'xl:grid-cols-5',
  },
  wide: {
    base: 'grid-cols-1',
    sm: 'sm:grid-cols-1',
    md: 'md:grid-cols-1',
    lg: 'lg:grid-cols-1',
    xl: 'xl:grid-cols-1',
  },
};

/**
 * Helper: Get variant configuration
 */
export function getVariantConfig(variant = 'default') {
  return cardVariants[variant] || cardVariants.default;
}

/**
 * Helper: Get size configuration
 */
export function getSizeConfig(size = 'md') {
  return cardSizes[size] || cardSizes.md;
}

/**
 * Helper: Get layout configuration
 */
export function getLayoutConfig(layout = 'vertical') {
  return cardLayouts[layout] || cardLayouts.vertical;
}

/**
 * Helper: Get grid columns classes
 */
export function getGridColumnsClass(columnsType = 'default') {
  const cols = gridColumns[columnsType] || gridColumns.default;
  return `grid ${cols.base} ${cols.sm} ${cols.md} ${cols.lg} ${cols.xl}`;
}

/**
 * Helper: Generate card classes
 */
export function generateCardClasses(variant, size, layout) {
  const variantConfig = getVariantConfig(variant);
  const sizeConfig = getSizeConfig(size);
  const layoutConfig = getLayoutConfig(layout);

  return {
    container: `
      ${layoutConfig.flexDirection}
      rounded-xl
      overflow-hidden
      transition-all
      ${variantConfig.hoverEnabled ? 'cursor-pointer' : ''}
      animate-fade-in
    `.trim().replace(/\s+/g, ' '),

    header: `
      flex
      items-center
      justify-center
      flex-shrink-0
      ${layout === 'horizontal' ? '' : 'w-full'}
    `.trim().replace(/\s+/g, ' '),

    content: `
      flex
      ${layout === 'horizontal' ? 'flex-row items-center gap-4' : 'flex-col'}
      flex-1
    `.trim().replace(/\s+/g, ' '),

    title: `
      ${layout === 'horizontal' ? 'text-base' : sizeConfig.titleSize}
      font-bold
      ${layout === 'horizontal' ? 'mb-0' : 'mb-2'}
    `.trim().replace(/\s+/g, ' '),

    subtitle: `
      ${layout === 'horizontal' ? 'text-sm' : sizeConfig.subtitleSize}
      font-medium
    `.trim().replace(/\s+/g, ' '),

    description: `
      ${sizeConfig.descriptionSize}
    `.trim().replace(/\s+/g, ' '),
  };
}

/**
 * Helper: Generate card styles (inline styles)
 */
export function generateCardStyles(variant, size, layout = 'vertical') {
  const variantConfig = getVariantConfig(variant);
  const sizeConfig = getSizeConfig(size);
  const layoutConfig = getLayoutConfig(layout);

  return {
    container: {
      backgroundColor: 'var(--color-bg-secondary)',
      border: `1px solid ${variantConfig.normalBorderColor}`,
      boxShadow: variantConfig.normalShadow,
      minHeight: layout === 'horizontal' ? '96px' : sizeConfig.minHeight,
      transitionDuration: variantConfig.transitionDuration,
      transitionTimingFunction: variantConfig.transitionTiming,
    },

    header: {
      height: layout === 'horizontal' ? '100%' : variantConfig.headerHeight,
      width: layout === 'horizontal' ? layoutConfig.headerWidth : 'auto',
    },

    content: {
      padding: layout === 'horizontal' && layoutConfig.contentPadding
        ? layoutConfig.contentPadding
        : sizeConfig.padding,
    },
  };
}

/**
 * Helper: Get hover styles
 */
export function getHoverStyles(variant) {
  const config = getVariantConfig(variant);

  if (!config.hoverEnabled) {
    return null;
  }

  return {
    transform: `translateY(${config.hoverTransform})`,
    boxShadow: config.hoverShadow,
    borderColor: config.hoverBorderColor,
  };
}

/**
 * Helper: Get normal styles (para onMouseLeave)
 */
export function getNormalStyles(variant) {
  const config = getVariantConfig(variant);

  return {
    transform: 'translateY(0)',
    boxShadow: config.normalShadow,
    borderColor: config.normalBorderColor,
  };
}
