/**
 * @fileoverview Servicio para gestionar configuraciones del Design Lab en Firestore
 * @module firebase/designLabConfig
 */

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';
import logger from '../utils/logger';

/**
 * Configuración por defecto del Design Lab
 * @constant
 */
export const DEFAULT_CONFIG = {
  // Tema y modo
  theme: 'light',

  // Tipografía
  fontSize: 16,
  fontFamily: 'sans-serif', // 'sans-serif', 'serif', 'mono', 'dyslexic'
  lineHeight: 1.6, // 1.4 (compact), 1.6 (normal), 1.8 (comfortable), 2.0 (spacious)
  letterSpacing: 'normal', // 'tight', 'normal', 'wide'
  fontWeight: 'normal', // 'light', 'normal', 'medium', 'semibold', 'bold'

  // Colores de feedback (ya existentes)
  feedbackColors: {
    correct: '#10b981', // green-500
    incorrect: '#ef4444', // red-500
    neutral: '#71717a' // zinc-500
  },

  // Colores personalizados (expandido)
  customColors: {
    textColor: null,
    exerciseBackground: null,
    cardBackground: null,
    borderColor: null,
    primaryAccent: null, // Color principal de acento
    secondaryAccent: null, // Color secundario
    successColor: null, // Override para success
    warningColor: null, // Override para warning
    errorColor: null, // Override para error
    infoColor: null, // Override para info
    linkColor: null, // Color de enlaces
    hoverColor: null, // Color al hacer hover
    focusColor: null, // Color de focus
    gradientStart: null, // Inicio de gradientes
    gradientEnd: null // Fin de gradientes
  },

  // Estilos personalizados
  customStyles: {
    borderRadius: 'normal', // 'sharp' (0), 'slight' (4px), 'normal' (8px), 'rounded' (12px), 'pill' (999px)
    borderWidth: 'normal', // 'thin' (1px), 'normal' (2px), 'thick' (3px)
    shadowIntensity: 'normal', // 'none', 'subtle', 'normal', 'strong'
    padding: 'normal', // 'compact', 'normal', 'comfortable', 'spacious'
    cardWidth: 'normal', // 'narrow', 'normal', 'wide', 'full'
    buttonSize: 'normal', // 'sm', 'normal', 'lg', 'xl'
    iconSize: 'normal', // 'sm', 'normal', 'lg', 'xl'
    badgeStyle: 'filled', // 'filled', 'outlined', 'soft'
    progressBarStyle: 'gradient', // 'solid', 'gradient', 'striped'
    hoverEffect: 'normal', // 'none', 'subtle', 'normal', 'strong'
    transitionSpeed: 'normal', // 'instant', 'fast', 'normal', 'slow'
    contentDensity: 'normal' // 'compact', 'normal', 'comfortable'
  },

  // Efectos visuales
  visualEffects: {
    blur: false, // Efectos de blur
    gradients: true, // Usar gradientes
    glassmorphism: false, // Efecto glass/frosted
    neumorphism: false // Efecto neumórfico
  },

  // Opciones de interacción (ya existentes)
  animations: true,
  soundEffects: true,
  autoCorrect: false,
  showHints: true,

  // Accesibilidad
  accessibility: {
    highContrast: false, // Modo alto contraste
    reducedMotion: false, // Reducir animaciones
    focusIndicators: 'normal', // 'subtle', 'normal', 'strong'
    underlineLinks: false, // Subrayar enlaces
    largerClickTargets: false, // Aumentar área de click
    screenReaderOptimized: false // Optimizar para lectores de pantalla
  },

  // Configuración general
  difficultyLevel: 'intermediate', // beginner, intermediate, advanced
  language: 'es',
  cefrLevel: 'A1' // A1, A2, B1, B2, C1, C2
};

/**
 * Obtiene la configuración del Design Lab para un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Configuración del usuario
 */
export async function getDesignLabConfig(userId) {
  try {
    if (!userId) {
      logger.warn('getDesignLabConfig: No userId provided, returning default config');
      return DEFAULT_CONFIG;
    }

    const configRef = doc(db, 'users', userId, 'configs', 'designLab');
    const configSnap = await getDoc(configRef);

    if (configSnap.exists()) {
      logger.debug('Design Lab config loaded for user:', userId);
      return { ...DEFAULT_CONFIG, ...configSnap.data() };
    }

    // Si no existe, crear con config por defecto
    await setDoc(configRef, {
      ...DEFAULT_CONFIG,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    logger.info('Created default Design Lab config for user:', userId);
    return DEFAULT_CONFIG;
  } catch (error) {
    logger.error('Error getting Design Lab config:', error);
    return DEFAULT_CONFIG; // Fallback a config por defecto
  }
}

/**
 * Guarda la configuración del Design Lab para un usuario
 * @param {string} userId - ID del usuario
 * @param {Object} config - Configuración a guardar
 * @returns {Promise<void>}
 */
export async function saveDesignLabConfig(userId, config) {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const configRef = doc(db, 'users', userId, 'configs', 'designLab');
    const configSnap = await getDoc(configRef);

    const dataToSave = {
      ...config,
      updatedAt: new Date()
    };

    if (configSnap.exists()) {
      await updateDoc(configRef, dataToSave);
      logger.debug('Design Lab config updated for user:', userId);
    } else {
      await setDoc(configRef, {
        ...dataToSave,
        createdAt: new Date()
      });
      logger.info('Design Lab config created for user:', userId);
    }
  } catch (error) {
    logger.error('Error saving Design Lab config:', error);
    throw error;
  }
}

/**
 * Actualiza un campo específico de la configuración
 * @param {string} userId - ID del usuario
 * @param {string} field - Campo a actualizar
 * @param {any} value - Valor nuevo
 * @returns {Promise<void>}
 */
export async function updateDesignLabConfigField(userId, field, value) {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const configRef = doc(db, 'users', userId, 'configs', 'designLab');
    await updateDoc(configRef, {
      [field]: value,
      updatedAt: new Date()
    });

    logger.debug(`Design Lab config field '${field}' updated for user:`, userId);
  } catch (error) {
    logger.error('Error updating Design Lab config field:', error);
    throw error;
  }
}

/**
 * Resetea la configuración a valores por defecto
 * @param {string} userId - ID del usuario
 * @returns {Promise<void>}
 */
export async function resetDesignLabConfig(userId) {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const configRef = doc(db, 'users', userId, 'configs', 'designLab');
    await setDoc(configRef, {
      ...DEFAULT_CONFIG,
      updatedAt: new Date(),
      resetAt: new Date()
    });

    logger.info('Design Lab config reset for user:', userId);
  } catch (error) {
    logger.error('Error resetting Design Lab config:', error);
    throw error;
  }
}
