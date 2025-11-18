/**
 * @fileoverview Logo Configuration - Guardar y cargar configuración del logo en Firebase
 * @module firebase/logoConfig
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';
import logger from '../utils/logger';

const LOGO_CONFIG_DOC = 'system/logoConfig';

/**
 * Cargar configuración del logo desde Firebase
 * @returns {Promise<Object|null>} Configuración del logo o null si no existe
 */
export async function loadLogoConfig() {
  try {
    const docRef = doc(db, LOGO_CONFIG_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      logger.info('[LogoConfig] Configuración cargada desde Firebase', data);
      return data;
    }

    logger.info('[LogoConfig] No hay configuración guardada en Firebase');
    return null;
  } catch (error) {
    logger.error('[LogoConfig] Error al cargar configuración:', error);
    return null;
  }
}

/**
 * Guardar configuración del logo en Firebase
 * @param {Object} config - Configuración del logo
 * @param {string} config.font - Familia de fuente
 * @param {string} config.weight - Peso de fuente (normal/bold)
 * @param {number} config.size - Tamaño en rem
 * @returns {Promise<boolean>} true si se guardó exitosamente
 */
export async function saveLogoConfig(config) {
  try {
    const { font, weight, size } = config;

    if (!font || !weight || !size) {
      logger.error('[LogoConfig] Configuración incompleta:', config);
      return false;
    }

    const docRef = doc(db, LOGO_CONFIG_DOC);
    await setDoc(docRef, {
      font,
      weight,
      size,
      updatedAt: Date.now()
    });

    logger.info('[LogoConfig] Configuración guardada en Firebase', config);
    return true;
  } catch (error) {
    logger.error('[LogoConfig] Error al guardar configuración:', error);
    return false;
  }
}

/**
 * Resetear configuración del logo a valores por defecto
 * @returns {Promise<boolean>} true si se reseteó exitosamente
 */
export async function resetLogoConfig() {
  try {
    const defaultConfig = {
      font: "'Microsoft YaHei', sans-serif",
      weight: 'bold',
      size: 1.25
    };

    const docRef = doc(db, LOGO_CONFIG_DOC);
    await setDoc(docRef, {
      ...defaultConfig,
      updatedAt: Date.now()
    });

    logger.info('[LogoConfig] Configuración reseteada a defaults');
    return true;
  } catch (error) {
    logger.error('[LogoConfig] Error al resetear configuración:', error);
    return false;
  }
}
