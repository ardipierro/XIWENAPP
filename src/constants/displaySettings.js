/**
 * @fileoverview Constantes para configuración de visualización de contenidos
 * @module constants/displaySettings
 *
 * Define opciones de layout, tamaño, alineación y presets por tipo de ejercicio
 */

// ============================================
// LAYOUT OPTIONS
// ============================================

export const LAYOUT_OPTIONS = {
  COMPACT: 'compact',      // Más denso, menos padding
  NORMAL: 'normal',        // Estándar
  EXPANDED: 'expanded',    // Más espacio, más padding
  FULLSCREEN: 'fullscreen' // Ocupa toda la pantalla
};

export const LAYOUT_LABELS = {
  [LAYOUT_OPTIONS.COMPACT]: 'Compacto',
  [LAYOUT_OPTIONS.NORMAL]: 'Normal',
  [LAYOUT_OPTIONS.EXPANDED]: 'Expandido',
  [LAYOUT_OPTIONS.FULLSCREEN]: 'Pantalla Completa'
};

// ============================================
// CONTENT WIDTH OPTIONS
// ============================================

export const WIDTH_OPTIONS = {
  NARROW: 'narrow',   // max-w-xl (centrado, estrecho)
  MEDIUM: 'medium',   // max-w-3xl (centrado, medio)
  WIDE: 'wide',       // max-w-5xl (centrado, ancho)
  FULL: 'full'        // 100% (borde a borde)
};

export const WIDTH_LABELS = {
  [WIDTH_OPTIONS.NARROW]: 'Estrecho',
  [WIDTH_OPTIONS.MEDIUM]: 'Medio',
  [WIDTH_OPTIONS.WIDE]: 'Ancho',
  [WIDTH_OPTIONS.FULL]: 'Borde a Borde'
};

export const WIDTH_CLASSES = {
  [WIDTH_OPTIONS.NARROW]: 'max-w-xl mx-auto',
  [WIDTH_OPTIONS.MEDIUM]: 'max-w-3xl mx-auto',
  [WIDTH_OPTIONS.WIDE]: 'max-w-5xl mx-auto',
  [WIDTH_OPTIONS.FULL]: 'w-full'
};

// ============================================
// TEXT ALIGNMENT OPTIONS
// ============================================

export const ALIGN_OPTIONS = {
  LEFT: 'left',
  CENTER: 'center',
  JUSTIFY: 'justify'
};

export const ALIGN_LABELS = {
  [ALIGN_OPTIONS.LEFT]: 'Izquierda',
  [ALIGN_OPTIONS.CENTER]: 'Centrado',
  [ALIGN_OPTIONS.JUSTIFY]: 'Justificado'
};

export const ALIGN_CLASSES = {
  [ALIGN_OPTIONS.LEFT]: 'text-left',
  [ALIGN_OPTIONS.CENTER]: 'text-center',
  [ALIGN_OPTIONS.JUSTIFY]: 'text-justify'
};

// ============================================
// FONT SIZE OPTIONS
// ============================================

export const FONT_SIZE_OPTIONS = {
  SM: 'sm',       // 14px
  BASE: 'base',   // 16px
  LG: 'lg',       // 18px
  XL: 'xl',       // 20px
  XXL: '2xl'      // 24px
};

export const FONT_SIZE_LABELS = {
  [FONT_SIZE_OPTIONS.SM]: 'Pequeño',
  [FONT_SIZE_OPTIONS.BASE]: 'Normal',
  [FONT_SIZE_OPTIONS.LG]: 'Grande',
  [FONT_SIZE_OPTIONS.XL]: 'Extra Grande',
  [FONT_SIZE_OPTIONS.XXL]: 'Muy Grande'
};

export const FONT_SIZE_CLASSES = {
  [FONT_SIZE_OPTIONS.SM]: 'text-sm',
  [FONT_SIZE_OPTIONS.BASE]: 'text-base',
  [FONT_SIZE_OPTIONS.LG]: 'text-lg',
  [FONT_SIZE_OPTIONS.XL]: 'text-xl',
  [FONT_SIZE_OPTIONS.XXL]: 'text-2xl'
};

export const FONT_SIZE_PX = {
  [FONT_SIZE_OPTIONS.SM]: '14px',
  [FONT_SIZE_OPTIONS.BASE]: '16px',
  [FONT_SIZE_OPTIONS.LG]: '18px',
  [FONT_SIZE_OPTIONS.XL]: '20px',
  [FONT_SIZE_OPTIONS.XXL]: '24px'
};

// ============================================
// PADDING OPTIONS
// ============================================

export const PADDING_OPTIONS = {
  TIGHT: 'tight',     // p-2
  NORMAL: 'normal',   // p-4
  RELAXED: 'relaxed'  // p-6
};

export const PADDING_LABELS = {
  [PADDING_OPTIONS.TIGHT]: 'Ajustado',
  [PADDING_OPTIONS.NORMAL]: 'Normal',
  [PADDING_OPTIONS.RELAXED]: 'Relajado'
};

export const PADDING_CLASSES = {
  [PADDING_OPTIONS.TIGHT]: 'p-2',
  [PADDING_OPTIONS.NORMAL]: 'p-4',
  [PADDING_OPTIONS.RELAXED]: 'p-6'
};

// ============================================
// DEFAULT DISPLAY SETTINGS
// ============================================

export const DEFAULT_DISPLAY_SETTINGS = {
  layout: LAYOUT_OPTIONS.NORMAL,
  contentWidth: WIDTH_OPTIONS.MEDIUM,
  textAlign: ALIGN_OPTIONS.LEFT,
  fontSize: FONT_SIZE_OPTIONS.BASE,
  padding: PADDING_OPTIONS.NORMAL
};

// ============================================
// PRESETS BY EXERCISE/CONTENT TYPE
// ============================================

/**
 * Presets inteligentes según el tipo de ejercicio o contenido
 * Cada tipo tiene configuración optimizada para su caso de uso
 */
export const DISPLAY_PRESETS = {
  // Ejercicios de marcar palabras - necesitan texto grande y ancho completo
  'word-highlight': {
    layout: LAYOUT_OPTIONS.EXPANDED,
    contentWidth: WIDTH_OPTIONS.FULL,
    textAlign: ALIGN_OPTIONS.LEFT,
    fontSize: FONT_SIZE_OPTIONS.LG,
    padding: PADDING_OPTIONS.RELAXED
  },

  // Drag & Drop - necesita espacio para arrastrar
  'drag-drop': {
    layout: LAYOUT_OPTIONS.NORMAL,
    contentWidth: WIDTH_OPTIONS.WIDE,
    textAlign: ALIGN_OPTIONS.LEFT,
    fontSize: FONT_SIZE_OPTIONS.BASE,
    padding: PADDING_OPTIONS.NORMAL
  },

  // Fill in blanks - campos de texto
  'fill-blank': {
    layout: LAYOUT_OPTIONS.NORMAL,
    contentWidth: WIDTH_OPTIONS.WIDE,
    textAlign: ALIGN_OPTIONS.LEFT,
    fontSize: FONT_SIZE_OPTIONS.BASE,
    padding: PADDING_OPTIONS.NORMAL
  },

  // Multiple choice - opciones centradas
  'multiple-choice': {
    layout: LAYOUT_OPTIONS.NORMAL,
    contentWidth: WIDTH_OPTIONS.MEDIUM,
    textAlign: ALIGN_OPTIONS.LEFT,
    fontSize: FONT_SIZE_OPTIONS.BASE,
    padding: PADDING_OPTIONS.NORMAL
  },

  // Open questions - respuesta libre
  'open-questions': {
    layout: LAYOUT_OPTIONS.NORMAL,
    contentWidth: WIDTH_OPTIONS.WIDE,
    textAlign: ALIGN_OPTIONS.LEFT,
    fontSize: FONT_SIZE_OPTIONS.BASE,
    padding: PADDING_OPTIONS.NORMAL
  },

  // Info table - tablas informativas
  'info-table': {
    layout: LAYOUT_OPTIONS.NORMAL,
    contentWidth: WIDTH_OPTIONS.WIDE,
    textAlign: ALIGN_OPTIONS.LEFT,
    fontSize: FONT_SIZE_OPTIONS.BASE,
    padding: PADDING_OPTIONS.NORMAL
  },

  // Dialogues - estilo chat, columna central
  'dialogues': {
    layout: LAYOUT_OPTIONS.COMPACT,
    contentWidth: WIDTH_OPTIONS.NARROW,
    textAlign: ALIGN_OPTIONS.LEFT,
    fontSize: FONT_SIZE_OPTIONS.BASE,
    padding: PADDING_OPTIONS.NORMAL
  },

  // Reading - lecturas largas
  'reading': {
    layout: LAYOUT_OPTIONS.EXPANDED,
    contentWidth: WIDTH_OPTIONS.MEDIUM,
    textAlign: ALIGN_OPTIONS.JUSTIFY,
    fontSize: FONT_SIZE_OPTIONS.LG,
    padding: PADDING_OPTIONS.RELAXED
  },

  // Lesson - lecciones
  'lesson': {
    layout: LAYOUT_OPTIONS.NORMAL,
    contentWidth: WIDTH_OPTIONS.MEDIUM,
    textAlign: ALIGN_OPTIONS.LEFT,
    fontSize: FONT_SIZE_OPTIONS.BASE,
    padding: PADDING_OPTIONS.NORMAL
  },

  // Video - centrado
  'video': {
    layout: LAYOUT_OPTIONS.NORMAL,
    contentWidth: WIDTH_OPTIONS.WIDE,
    textAlign: ALIGN_OPTIONS.CENTER,
    fontSize: FONT_SIZE_OPTIONS.BASE,
    padding: PADDING_OPTIONS.NORMAL
  },

  // Default fallback
  'default': DEFAULT_DISPLAY_SETTINGS
};

/**
 * Obtiene el preset para un tipo de contenido/ejercicio
 * @param {string} type - Tipo de contenido o ejercicio
 * @returns {Object} Configuración de display
 */
export function getPresetForType(type) {
  return DISPLAY_PRESETS[type] || DISPLAY_PRESETS['default'];
}

/**
 * Combina settings del usuario con los defaults
 * @param {Object} userSettings - Settings personalizados (puede ser parcial)
 * @param {string} type - Tipo para usar como base de preset
 * @returns {Object} Settings completos
 */
export function mergeDisplaySettings(userSettings, type = null) {
  const base = type ? getPresetForType(type) : DEFAULT_DISPLAY_SETTINGS;
  return {
    ...base,
    ...userSettings
  };
}

/**
 * Genera clases CSS basadas en displaySettings
 * @param {Object} settings - Configuración de display
 * @returns {Object} Objeto con clases para container, content y text
 */
export function getDisplayClasses(settings) {
  const s = mergeDisplaySettings(settings);

  return {
    // Clase para el contenedor principal
    container: [
      s.layout === LAYOUT_OPTIONS.FULLSCREEN ? 'fixed inset-0 z-50 bg-white dark:bg-zinc-900' : '',
      PADDING_CLASSES[s.padding] || PADDING_CLASSES[PADDING_OPTIONS.NORMAL]
    ].filter(Boolean).join(' '),

    // Clase para el wrapper del contenido
    content: [
      WIDTH_CLASSES[s.contentWidth] || WIDTH_CLASSES[WIDTH_OPTIONS.MEDIUM]
    ].join(' '),

    // Clase para el texto
    text: [
      FONT_SIZE_CLASSES[s.fontSize] || FONT_SIZE_CLASSES[FONT_SIZE_OPTIONS.BASE],
      ALIGN_CLASSES[s.textAlign] || ALIGN_CLASSES[ALIGN_OPTIONS.LEFT]
    ].join(' ')
  };
}

/**
 * Genera estilos inline basados en displaySettings
 * @param {Object} settings - Configuración de display
 * @returns {Object} Objeto de estilos CSS inline
 */
export function getDisplayStyles(settings) {
  const s = mergeDisplaySettings(settings);

  return {
    fontSize: FONT_SIZE_PX[s.fontSize] || FONT_SIZE_PX[FONT_SIZE_OPTIONS.BASE],
    textAlign: s.textAlign || ALIGN_OPTIONS.LEFT
  };
}
