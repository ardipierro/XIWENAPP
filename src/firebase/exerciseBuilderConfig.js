/**
 * @fileoverview Servicio para gestionar configuraciones del Exercise Builder en Firestore
 * @module firebase/exerciseBuilderConfig
 */

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';
import logger from '../utils/logger';

/**
 * Temas predefinidos con paletas de colores completas
 * @constant
 */
export const PRESET_THEMES = {
  light: {
    name: 'Claro',
    colors: {
      bg: '#ffffff',
      bgSecondary: '#f5f5f5',
      text: '#18181b',
      textSecondary: '#71717a',
      border: '#e4e4e7',
      accent: '#3b82f6'
    }
  },
  dark: {
    name: 'Oscuro',
    colors: {
      bg: '#18181b',
      bgSecondary: '#27272a',
      text: '#fafafa',
      textSecondary: '#a1a1aa',
      border: '#3f3f46',
      accent: '#60a5fa'
    }
  },
  ocean: {
    name: 'Océano',
    colors: {
      bg: '#f0f9ff',
      bgSecondary: '#e0f2fe',
      text: '#0c4a6e',
      textSecondary: '#075985',
      border: '#bae6fd',
      accent: '#0ea5e9'
    }
  },
  forest: {
    name: 'Bosque',
    colors: {
      bg: '#f0fdf4',
      bgSecondary: '#dcfce7',
      text: '#14532d',
      textSecondary: '#166534',
      border: '#bbf7d0',
      accent: '#22c55e'
    }
  },
  sunset: {
    name: 'Atardecer',
    colors: {
      bg: '#fff7ed',
      bgSecondary: '#ffedd5',
      text: '#7c2d12',
      textSecondary: '#9a3412',
      border: '#fed7aa',
      accent: '#f97316'
    }
  }
};

/**
 * Packs de sonidos disponibles
 * @constant
 */
export const SOUND_PACKS = {
  classic: {
    name: 'Clásico',
    correct: '/sounds/classic-correct.mp3',
    incorrect: '/sounds/classic-incorrect.mp3',
    click: '/sounds/classic-click.mp3'
  },
  playful: {
    name: 'Divertido',
    correct: '/sounds/playful-correct.mp3',
    incorrect: '/sounds/playful-incorrect.mp3',
    click: '/sounds/playful-click.mp3'
  },
  minimal: {
    name: 'Minimalista',
    correct: '/sounds/minimal-correct.mp3',
    incorrect: '/sounds/minimal-incorrect.mp3',
    click: '/sounds/minimal-click.mp3'
  },
  nature: {
    name: 'Naturaleza',
    correct: '/sounds/nature-correct.mp3',
    incorrect: '/sounds/nature-incorrect.mp3',
    click: '/sounds/nature-click.mp3'
  },
  futuristic: {
    name: 'Futurista',
    correct: '/sounds/futuristic-correct.mp3',
    incorrect: '/sounds/futuristic-incorrect.mp3',
    click: '/sounds/futuristic-click.mp3'
  }
};

/**
 * Configuración por defecto del Exercise Builder
 * @constant
 */
export const DEFAULT_CONFIG = {
  // VISUAL
  theme: 'light', // light|dark|ocean|forest|sunset
  fontSize: 16, // 12-24px
  fontFamily: 'system', // system|inter|merriweather|opendyslexic
  lineHeight: 1.5, // 1.2|1.5|1.8|2.0
  feedbackColors: {
    correct: '#10b981', // green-500
    incorrect: '#ef4444', // red-500
    neutral: '#71717a' // zinc-500
  },

  // ANIMACIONES Y SONIDO
  animations: true,
  animationSpeed: 'normal', // slow|normal|fast|off
  soundEffects: true,
  soundPack: 'classic', // classic|playful|minimal|nature|futuristic

  // PEDAGOGÍA
  autoCorrect: false,
  showHints: true,
  progressiveHints: true, // Pistas progresivas de 3 niveles
  difficultyLevel: 'intermediate', // beginner|intermediate|advanced
  language: 'es',
  cefrLevel: 'A1', // A1|A2|B1|B2|C1|C2

  // MODO DE PRÁCTICA/EVALUACIÓN
  practiceMode: true, // true = práctica (ilimitado), false = evaluación (limitado)
  maxAttempts: 3, // Intentos permitidos en modo evaluación

  // TEMPORIZADOR
  timerMode: 'off', // off|soft|hard
  timeLimit: 300, // Tiempo límite en segundos (5 min)
  showTimer: true, // Mostrar temporizador visible

  // FEEDBACK
  feedbackDetail: 'detailed', // minimal|medium|detailed|extensive
  showCorrectAnswer: true, // Mostrar respuesta correcta si falla
  showExplanation: true // Mostrar explicación pedagógica
};

/**
 * Obtiene la configuración del Exercise Builder para un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Configuración del usuario
 */
export async function getExerciseBuilderConfig(userId) {
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
 * Guarda la configuración del Exercise Builder para un usuario
 * @param {string} userId - ID del usuario
 * @param {Object} config - Configuración a guardar
 * @returns {Promise<void>}
 */
export async function saveExerciseBuilderConfig(userId, config) {
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
export async function updateExerciseBuilderConfigField(userId, field, value) {
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
export async function resetExerciseBuilderConfig(userId) {
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
