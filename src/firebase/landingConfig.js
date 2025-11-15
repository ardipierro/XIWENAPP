/**
 * @fileoverview Firebase operations for Landing Page configuration
 * @module firebase/landingConfig
 */

import { db } from './config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import logger from '../utils/logger';

const LANDING_CONFIG_ID = 'main';

/**
 * Get default landing page configuration
 * @returns {Object} Default configuration
 */
function getDefaultConfig() {
  return {
    hero: {
      title: 'Plataforma Educativa',
      titleGradient: ' Todo en Uno',
      subtitle: 'La solución completa para instituciones educativas modernas. Gestión académica, pagos, comunicación, ejercicios interactivos y más, todo en una sola plataforma.',
      stats: [
        { number: '8+', label: 'Tipos de Ejercicios' },
        { number: '4', label: 'Roles de Usuario' },
        { number: '100%', label: 'Online & PWA' }
      ]
    },
    features: [
      {
        id: 'content-reader',
        icon: 'BookText',
        title: '8 Tipos de Ejercicios',
        description: 'Opción múltiple, verdadero/falso, completar, matching, y más. Content Reader interactivo con anotaciones y TTS.'
      },
      {
        id: 'videochat',
        icon: 'Video',
        title: 'VideoChat Integrado',
        description: 'Clases en vivo con LiveKit. Sala de espera virtual, compartir pantalla y comunicación en tiempo real.'
      },
      {
        id: 'payments',
        icon: 'CreditCard',
        title: 'Sistema de Pagos',
        description: 'MercadoPago integrado. Gestión de matrículas, cuotas mensuales, becas y descuentos familiares automáticos.'
      },
      {
        id: 'gamification',
        icon: 'Gamepad2',
        title: 'Gamificación',
        description: 'Sistema de puntos, niveles, badges y racha de días consecutivos. Leaderboard para motivar a estudiantes.'
      },
      {
        id: 'messaging',
        icon: 'MessageSquare',
        title: 'Mensajería Interna',
        description: 'Comunicación directa entre profesores, estudiantes y tutores. Notificaciones en tiempo real y sistema de alertas.'
      },
      {
        id: 'calendar',
        icon: 'Calendar',
        title: 'Calendario Integrado',
        description: 'Vista completa de asignaciones, fechas de entrega y eventos. Recordatorios automáticos y sincronización.'
      },
      {
        id: 'dark-mode',
        icon: 'Moon',
        title: 'Modo Oscuro & Temas',
        description: 'Interfaz adaptable con modo oscuro completo. Múltiples temas: Ocean, Forest, Sunset y Midnight.'
      },
      {
        id: 'designlab',
        icon: 'Layout',
        title: 'DesignLab & Whiteboard',
        description: 'Espacio colaborativo para crear ejercicios personalizados. Herramientas de diseño integradas para profesores.'
      },
      {
        id: 'analytics',
        icon: 'BarChart3',
        title: 'Analytics Avanzado',
        description: 'Dashboard completo con métricas de progreso, rendimiento individual y reportes exportables a PDF/Excel.'
      }
    ],
    faqs: [
      {
        id: 'faq-1',
        question: '¿Qué tipos de ejercicios puedo crear en la plataforma?',
        answer: 'XIWEN soporta 8 tipos diferentes de ejercicios: opción múltiple, verdadero/falso, completar espacios, matching, drag & drop, identificación de verbos, lectura interactiva y pronunciación con IA. Además, incluye un Content Reader con funciones de TTS (text-to-speech) y anotaciones.'
      },
      {
        id: 'faq-2',
        question: '¿Cómo funciona el sistema de pagos integrado?',
        answer: 'La plataforma integra MercadoPago (Argentina) para gestionar matrículas y cuotas mensuales automáticamente. Incluye sistema de becas, descuentos familiares (20% segundo hermano, 30% tercero en adelante), y un dashboard completo para administradores. Los tutores pueden ver y gestionar pagos desde su panel.'
      },
      {
        id: 'faq-3',
        question: '¿Funciona en dispositivos móviles?',
        answer: 'Sí, XIWEN es una Progressive Web App (PWA) completamente responsiva. Funciona perfectamente en celulares, tablets y computadoras. Incluso puede instalarse como aplicación nativa y funcionar offline. La interfaz se adapta automáticamente a cualquier tamaño de pantalla.'
      },
      {
        id: 'faq-4',
        question: '¿Qué roles de usuario están disponibles?',
        answer: 'La plataforma soporta 4 roles: Administrador (gestión completa y control de pagos), Profesor (creación de cursos, ejercicios y calificaciones), Estudiante (acceso a contenido y actividades), y Tutor/Padre (seguimiento académico y gestión de pagos). Cada rol tiene su propio dashboard personalizado.'
      },
      {
        id: 'faq-5',
        question: '¿Incluye videoconferencia para clases en vivo?',
        answer: 'Sí, la plataforma integra LiveKit para videochat en tiempo real. Incluye sala de espera virtual, compartir pantalla, audio y video de alta calidad. Además, hay un sistema de mensajería interna para comunicación asíncrona entre profesores, estudiantes y tutores.'
      }
    ],
    cta: {
      title: '¿Listo para Transformar tu Institución?',
      subtitle: 'Plataforma todo-en-uno para gestión académica, pagos, comunicación y más. Comienza tu prueba gratuita de 30 días.',
      primaryButtonText: 'Solicitar Demo',
      secondaryButtonText: 'Iniciar Sesión'
    },
    featuredContent: {
      enabled: true,
      exercises: [], // Array of exercise IDs
      videos: [], // Array of {url, title, thumbnail}
      rotationSpeed: 5000 // milliseconds
    },
    lastUpdated: null,
    updatedBy: null
  };
}

/**
 * Get landing page configuration
 * @returns {Promise<Object>} Landing configuration
 */
export async function getLandingConfig() {
  try {
    const docRef = doc(db, 'landing_config', LANDING_CONFIG_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      logger.debug('Landing config loaded from Firebase');
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      logger.debug('Landing config not found, returning defaults');
      return getDefaultConfig();
    }
  } catch (error) {
    logger.error('Error loading landing config:', error);
    // Return defaults on error to prevent app crash
    return getDefaultConfig();
  }
}

/**
 * Update landing page configuration
 * @param {Object} config - Configuration object
 * @param {string} userId - User ID making the update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateLandingConfig(config, userId) {
  try {
    const docRef = doc(db, 'landing_config', LANDING_CONFIG_ID);

    const updateData = {
      ...config,
      lastUpdated: serverTimestamp(),
      updatedBy: userId
    };

    await setDoc(docRef, updateData, { merge: true });

    logger.info('Landing config updated successfully', { userId });
    return { success: true };
  } catch (error) {
    logger.error('Error updating landing config:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update specific section of landing config
 * @param {string} section - Section name (hero, features, faqs, cta, featuredContent)
 * @param {Object} data - Section data
 * @param {string} userId - User ID making the update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateLandingSection(section, data, userId) {
  try {
    const docRef = doc(db, 'landing_config', LANDING_CONFIG_ID);

    const updateData = {
      [section]: data,
      lastUpdated: serverTimestamp(),
      updatedBy: userId
    };

    await setDoc(docRef, updateData, { merge: true });

    logger.info(`Landing section "${section}" updated successfully`, { userId });
    return { success: true };
  } catch (error) {
    logger.error(`Error updating landing section "${section}":`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Reset landing config to defaults
 * @param {string} userId - User ID making the reset
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function resetLandingConfig(userId) {
  try {
    const docRef = doc(db, 'landing_config', LANDING_CONFIG_ID);
    const defaultConfig = getDefaultConfig();

    const updateData = {
      ...defaultConfig,
      lastUpdated: serverTimestamp(),
      updatedBy: userId
    };

    await setDoc(docRef, updateData);

    logger.info('Landing config reset to defaults', { userId });
    return { success: true };
  } catch (error) {
    logger.error('Error resetting landing config:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save a version to history before updating
 * @param {Object} config - Current configuration to save
 * @param {string} userId - User ID making the save
 * @returns {Promise<{success: boolean, versionId?: string, error?: string}>}
 */
export async function saveLandingHistory(config, userId) {
  try {
    const historyRef = doc(db, 'landing_config_history', `${Date.now()}_${userId}`);

    await setDoc(historyRef, {
      config,
      savedAt: serverTimestamp(),
      savedBy: userId,
      version: Date.now()
    });

    logger.info('Landing config version saved to history');
    return { success: true, versionId: historyRef.id };
  } catch (error) {
    logger.error('Error saving landing history:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get landing config history
 * @param {number} limit - Number of versions to retrieve (default: 10)
 * @returns {Promise<Array>} Array of historical versions
 */
export async function getLandingHistory(limit = 10) {
  try {
    const { collection, query, orderBy, getDocs, limitToLast } = await import('firebase/firestore');

    const historyRef = collection(db, 'landing_config_history');
    const q = query(historyRef, orderBy('savedAt', 'desc'), limitToLast(limit));
    const snapshot = await getDocs(q);

    const history = [];
    snapshot.forEach(doc => {
      history.push({ id: doc.id, ...doc.data() });
    });

    logger.debug('Landing config history loaded:', history.length);
    return history;
  } catch (error) {
    logger.error('Error loading landing history:', error);
    return [];
  }
}

/**
 * Restore a specific version from history
 * @param {string} versionId - Version ID to restore
 * @param {string} userId - User ID making the restore
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function restoreLandingVersion(versionId, userId) {
  try {
    const { getDoc } = await import('firebase/firestore');

    const versionRef = doc(db, 'landing_config_history', versionId);
    const versionSnap = await getDoc(versionRef);

    if (!versionSnap.exists()) {
      return { success: false, error: 'Versión no encontrada' };
    }

    const versionData = versionSnap.data();
    const result = await updateLandingConfig(versionData.config, userId);

    if (result.success) {
      logger.info('Landing config restored from version:', versionId);
    }

    return result;
  } catch (error) {
    logger.error('Error restoring landing version:', error);
    return { success: false, error: error.message };
  }
}
