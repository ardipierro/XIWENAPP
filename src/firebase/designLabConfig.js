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
  theme: 'light',
  fontSize: 16,
  feedbackColors: {
    correct: '#10b981', // green-500
    incorrect: '#ef4444', // red-500
    neutral: '#71717a' // zinc-500
  },
  customColors: {
    textColor: null, // null = usar default de Tailwind
    exerciseBackground: null, // null = usar default
    cardBackground: null,
    borderColor: null
  },
  animations: true,
  soundEffects: true,
  autoCorrect: false,
  showHints: true,
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
