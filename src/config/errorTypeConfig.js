/**
 * @fileoverview Sistema Centralizado de Tipos de Error para Corrección de Tareas
 *
 * ⭐ ESTE ES EL ÚNICO LUGAR donde se definen:
 * - Tipos de error de corrección (spelling, grammar, punctuation, vocabulary)
 * - Colores por defecto de cada tipo
 * - Íconos Lucide asociados
 * - Configuración de overlay visual
 *
 * Los admins pueden personalizar desde el ProfileEditor
 *
 * @module config/errorTypeConfig
 */

import {
  Pencil,
  BookOpen,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

// ============================================
// CONFIGURACIÓN BASE DE TIPOS DE ERROR
// ============================================

/**
 * Configuración por defecto de tipos de error
 * Estructura: { key: { label, color, bgColor, icon, iconComponent, description } }
 */
export const DEFAULT_ERROR_TYPE_CONFIG = {
  spelling: {
    key: 'spelling',
    label: 'Ortografía',
    labelShort: 'Ort.',
    color: '#ef4444',           // red-500
    bgColor: 'bg-red-500',
    bgColorLight: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-500',
    icon: 'Pencil',
    iconComponent: Pencil,
    description: 'Errores de escritura y ortografía',
    order: 1,
  },
  grammar: {
    key: 'grammar',
    label: 'Gramática',
    labelShort: 'Gram.',
    color: '#f97316',           // orange-500
    bgColor: 'bg-orange-500',
    bgColorLight: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-600 dark:text-orange-400',
    borderColor: 'border-orange-500',
    icon: 'BookOpen',
    iconComponent: BookOpen,
    description: 'Errores gramaticales y de estructura',
    order: 2,
  },
  punctuation: {
    key: 'punctuation',
    label: 'Puntuación',
    labelShort: 'Punt.',
    color: '#eab308',           // yellow-500
    bgColor: 'bg-yellow-500',
    bgColorLight: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    borderColor: 'border-yellow-500',
    icon: 'AlertCircle',
    iconComponent: AlertCircle,
    description: 'Errores de puntuación y acentuación',
    order: 3,
  },
  vocabulary: {
    key: 'vocabulary',
    label: 'Vocabulario',
    labelShort: 'Vocab.',
    color: '#3b82f6',           // blue-500
    bgColor: 'bg-blue-500',
    bgColorLight: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500',
    icon: 'MessageSquare',
    iconComponent: MessageSquare,
    description: 'Uso incorrecto de palabras o expresiones',
    order: 4,
  },
};

/**
 * Color por defecto para tipos no reconocidos
 */
export const DEFAULT_ERROR_COLOR = '#8b5cf6'; // purple-500

// ============================================
// CONFIGURACIÓN DE OVERLAY VISUAL
// ============================================

/**
 * Configuración por defecto del overlay de corrección
 */
export const DEFAULT_OVERLAY_CONFIG = {
  // Parámetros de onda para subrayado
  wave: {
    amplitude: 2,               // Altura de la onda (1-5)
    frequency: 8,               // Pixels entre picos (4-16)
  },

  // Parámetros de texto de corrección
  text: {
    minFontSize: 12,            // Tamaño mínimo (8-16)
    maxFontSize: 20,            // Tamaño máximo (16-28)
    charWidthRatio: 0.55,       // Ancho de caracter relativo (0.4-0.7)
    maxChars: 30,               // Máximo de caracteres visibles (20-50)
    defaultFont: 'Caveat',
  },

  // Niveles de opacidad disponibles
  opacityLevels: [
    { value: 0.15, label: 'Baja' },
    { value: 0.25, label: 'Media' },
    { value: 0.40, label: 'Alta' },
  ],

  // Fuentes manuscritas disponibles
  availableFonts: [
    { value: 'Caveat', label: 'Caveat' },
    { value: 'Shadows Into Light', label: 'Shadows' },
    { value: 'Indie Flower', label: 'Indie' },
    { value: 'Patrick Hand', label: 'Patrick' },
  ],
};

// ============================================
// CONFIGURACIÓN DE IA
// ============================================

/**
 * Configuración por defecto para análisis de IA
 */
export const DEFAULT_AI_CONFIG = {
  temperature: 0.4,             // 0.1-1.0 (menor = más consistente)
  maxTokens: 4000,              // 1000-8000
  feedbackStyle: 'encouraging', // encouraging | neutral | academic

  // Opciones de estilo de feedback
  feedbackStyles: [
    { value: 'encouraging', label: 'Motivador', description: 'Feedback positivo y alentador' },
    { value: 'neutral', label: 'Neutral', description: 'Feedback objetivo y directo' },
    { value: 'academic', label: 'Académico', description: 'Feedback formal y detallado' },
  ],
};

// ============================================
// STORAGE KEYS
// ============================================

export const ERROR_TYPE_CONFIG_STORAGE_KEY = 'xiwen_error_type_config';
export const OVERLAY_SETTINGS_STORAGE_KEY = 'xiwen_overlay_settings';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtiene la configuración actual de tipos de error (defaults + customs)
 * @returns {Object} Configuración de tipos de error
 */
export function getErrorTypeConfig() {
  const saved = localStorage.getItem(ERROR_TYPE_CONFIG_STORAGE_KEY);
  if (saved) {
    try {
      const custom = JSON.parse(saved);
      // Merge con defaults para mantener estructura
      return Object.keys(DEFAULT_ERROR_TYPE_CONFIG).reduce((acc, key) => {
        acc[key] = {
          ...DEFAULT_ERROR_TYPE_CONFIG[key],
          ...(custom[key] || {}),
        };
        return acc;
      }, {});
    } catch (err) {
      console.error('Error loading error type config:', err);
      return DEFAULT_ERROR_TYPE_CONFIG;
    }
  }
  return DEFAULT_ERROR_TYPE_CONFIG;
}

/**
 * Guarda la configuración de tipos de error
 * @param {Object} config - Nueva configuración
 * @returns {boolean} Si se guardó correctamente
 */
export function saveErrorTypeConfig(config) {
  try {
    localStorage.setItem(ERROR_TYPE_CONFIG_STORAGE_KEY, JSON.stringify(config));
    // Disparar evento para notificar cambios
    window.dispatchEvent(new CustomEvent('errorTypeConfigChange', { detail: config }));
    return true;
  } catch (err) {
    console.error('Error saving error type config:', err);
    return false;
  }
}

/**
 * Restaura la configuración por defecto
 */
export function resetErrorTypeConfig() {
  localStorage.removeItem(ERROR_TYPE_CONFIG_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('errorTypeConfigChange', { detail: DEFAULT_ERROR_TYPE_CONFIG }));
  return DEFAULT_ERROR_TYPE_CONFIG;
}

/**
 * Obtiene la configuración de un tipo de error específico
 * @param {string} type - Tipo de error (spelling, grammar, etc.)
 * @returns {Object} Configuración del tipo de error
 */
export function getErrorType(type) {
  const config = getErrorTypeConfig();
  return config[type] || {
    key: type,
    label: type,
    color: DEFAULT_ERROR_COLOR,
    bgColor: 'bg-purple-500',
    bgColorLight: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-500',
    icon: 'AlertCircle',
    iconComponent: AlertCircle,
    description: 'Tipo de error desconocido',
    order: 99,
  };
}

/**
 * Obtiene el color hex de un tipo de error
 * @param {string} type - Tipo de error
 * @returns {string} Color en formato hex
 */
export function getErrorColor(type) {
  const errorType = getErrorType(type);
  return errorType.color;
}

/**
 * Obtiene el componente de ícono Lucide para un tipo de error
 * @param {string} type - Tipo de error
 * @returns {React.Component} Componente Lucide
 */
export function getErrorIcon(type) {
  const errorType = getErrorType(type);
  return errorType.iconComponent;
}

/**
 * Obtiene todos los tipos de error ordenados
 * @returns {Array} Array de configuraciones ordenadas por 'order'
 */
export function getErrorTypesOrdered() {
  const config = getErrorTypeConfig();
  return Object.values(config).sort((a, b) => a.order - b.order);
}

/**
 * Obtiene el mapa de colores para ImageOverlay (formato hex)
 * @returns {Object} Mapa { type: hexColor }
 */
export function getErrorColorsMap() {
  const config = getErrorTypeConfig();
  return Object.keys(config).reduce((acc, key) => {
    acc[key] = config[key].color;
    return acc;
  }, { default: DEFAULT_ERROR_COLOR });
}

/**
 * Actualiza el color de un tipo de error
 * @param {string} type - Tipo de error
 * @param {string} color - Nuevo color hex
 * @returns {boolean} Si se actualizó correctamente
 */
export function updateErrorColor(type, color) {
  const config = getErrorTypeConfig();
  if (!config[type]) {
    console.warn('Error type not found:', type);
    return false;
  }

  config[type].color = color;
  return saveErrorTypeConfig(config);
}

// ============================================
// OVERLAY SETTINGS HELPERS
// ============================================

/**
 * Obtiene la configuración de overlay guardada
 * @returns {Object} Configuración de overlay
 */
export function getOverlaySettings() {
  const saved = localStorage.getItem(OVERLAY_SETTINGS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (err) {
      console.error('Error loading overlay settings:', err);
    }
  }
  return {
    highlightOpacity: 0.25,
    useWavyUnderline: true,
    showCorrectionText: true,
    correctionTextFont: 'Caveat',
    visibleErrorTypes: {
      spelling: true,
      grammar: true,
      punctuation: true,
      vocabulary: true,
    },
  };
}

/**
 * Guarda la configuración de overlay
 * @param {Object} settings - Nueva configuración
 * @returns {boolean} Si se guardó correctamente
 */
export function saveOverlaySettings(settings) {
  try {
    localStorage.setItem(OVERLAY_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (err) {
    console.error('Error saving overlay settings:', err);
    return false;
  }
}

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Inicializa el sistema de tipos de error
 * Aplica configuración guardada o defaults
 */
export function initErrorTypeSystem() {
  // Verificar que existan las configuraciones
  getErrorTypeConfig();
  getOverlaySettings();
}
