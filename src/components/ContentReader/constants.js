/**
 * @fileoverview Constantes para ContentReader
 * @module ContentReader/constants
 */

/**
 * Colores disponibles para anotaciones
 */
export const COLORS = {
  yellow: { bg: 'bg-yellow-200', text: 'text-yellow-900', hex: '#fef08a', name: 'Amarillo' },
  green: { bg: 'bg-green-200', text: 'text-green-900', hex: '#bbf7d0', name: 'Verde' },
  blue: { bg: 'bg-blue-200', text: 'text-blue-900', hex: '#bfdbfe', name: 'Azul' },
  pink: { bg: 'bg-pink-200', text: 'text-pink-900', hex: '#fbcfe8', name: 'Rosa' },
  purple: { bg: 'bg-purple-200', text: 'text-purple-900', hex: '#e9d5ff', name: 'Púrpura' },
  orange: { bg: 'bg-orange-200', text: 'text-orange-900', hex: '#fed7aa', name: 'Naranja' },
  red: { bg: 'bg-red-200', text: 'text-red-900', hex: '#fecaca', name: 'Rojo' },
  black: { bg: 'bg-gray-700', text: 'text-white', hex: '#374151', name: 'Negro' },
};

/**
 * Estilos de resaltador
 */
export const HIGHLIGHTER_STYLES = {
  classic: { name: 'Clásico', class: 'px-0.5 rounded' },
  underline: { name: 'Subrayado', class: 'border-b-2' },
  doubleUnderline: { name: 'Doble Subrayado', class: 'border-b-4 border-double' },
  wavy: { name: 'Ondulado', class: 'underline decoration-wavy decoration-2' },
  box: { name: 'Cuadro', class: 'border-2 px-1 rounded' },
};

/**
 * Tipos de pincel con soporte para resaltador
 */
export const BRUSH_TYPES = {
  thin: { name: 'Fino', width: 2, alpha: 1.0 },
  medium: { name: 'Medio', width: 4, alpha: 1.0 },
  thick: { name: 'Grueso', width: 6, alpha: 1.0 },
  marker: { name: 'Marcador', width: 10, alpha: 1.0 },
  highlighter: { name: 'Resaltador', width: 20, alpha: 0.3 },
};

/**
 * Rangos de zoom
 */
export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 72;
export const FONT_SIZE_STEP = 2;

/**
 * Fuentes disponibles
 */
export const FONTS = {
  sans: { name: 'Sans Serif', class: 'font-sans' },
  serif: { name: 'Serif', class: 'font-serif' },
  mono: { name: 'Monospace', class: 'font-mono' },
  montserrat: { name: 'Montserrat', style: 'Montserrat, sans-serif' },
  arial: { name: 'Arial', style: 'Arial, sans-serif' },
  times: { name: 'Times New Roman', style: 'Times New Roman, serif' },
  georgia: { name: 'Georgia', style: 'Georgia, serif' },
  courier: { name: 'Courier', style: 'Courier New, monospace' },
  verdana: { name: 'Verdana', style: 'Verdana, sans-serif' },
};

/**
 * Templates de notas predefinidos
 */
export const NOTE_TEMPLATES = {
  blank: { name: 'En blanco', icon: '📝', text: '' },
  important: { name: 'Importante', icon: '⭐', text: '⭐ IMPORTANTE: ' },
  question: { name: 'Pregunta', icon: '❓', text: '❓ Pregunta: ' },
  idea: { name: 'Idea', icon: '💡', text: '💡 Idea: ' },
  todo: { name: 'Tarea', icon: '✅', text: '✅ TODO: ' },
  warning: { name: 'Advertencia', icon: '⚠️', text: '⚠️ Advertencia: ' },
  remember: { name: 'Recordar', icon: '🔔', text: '🔔 Recordar: ' },
  summary: { name: 'Resumen', icon: '📋', text: '📋 Resumen: ' },
};

/**
 * Herramientas disponibles
 */
export const TOOLS = {
  SELECT: 'select',
  HIGHLIGHT: 'highlight',
  NOTE: 'note',
  DRAW: 'draw',
  TEXT: 'text',
  ERASE: 'erase',
};

/**
 * Tamaños de borrador
 */
export const ERASER_SIZES = {
  small: { name: 'Pequeño', size: 10 },
  medium: { name: 'Mediano', size: 20 },
  large: { name: 'Grande', size: 30 },
};

/**
 * Tipos de capa
 */
export const LAYER_TYPES = {
  HIGHLIGHTS: 'highlights',
  NOTES: 'notes',
  DRAWINGS: 'drawings',
  FLOATING_TEXTS: 'floatingTexts',
};

/**
 * Configuración de canvas
 */
export const CANVAS_CONFIG = {
  MIN_PRESSURE: 0.1,
  MAX_PRESSURE: 1.0,
  DEFAULT_PRESSURE: 0.5,
  SMOOTHING_FACTOR: 0.5,
};

/**
 * Atajos de teclado
 */
export const KEYBOARD_SHORTCUTS = {
  SAVE: 'ctrl+s',
  UNDO: 'ctrl+z',
  REDO: 'ctrl+y',
  DELETE: 'delete',
  ESCAPE: 'escape',
  SELECT: 'v',
  HIGHLIGHT: 'h',
  NOTE: 'n',
  DRAW: 'd',
  TEXT: 't',
  ERASE: 'e',
};
