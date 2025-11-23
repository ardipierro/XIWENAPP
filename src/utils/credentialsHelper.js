/**
 * @fileoverview Helper centralizado para leer credenciales de IA
 * @module utils/credentialsHelper
 *
 * BACKWARD COMPATIBILITY LAYER
 * This file now wraps the centralized CredentialsService
 * for components that haven't been refactored yet.
 *
 * For new code, prefer importing CredentialsService directly:
 * import credentialsService from '@/services/CredentialsService';
 */

import credentialsService from '../services/CredentialsService';
import logger from './logger';

/**
 * Lee una credencial usando el sistema centralizado
 * @param {string} providerId - ID del proveedor ('elevenlabs', 'openai', 'stability', etc.)
 * @returns {Promise<string|null>} - La credencial o null si no existe
 */
export async function getAICredential(providerId) {
  try {
    const credential = await credentialsService.get(providerId);

    // Don't return backend marker as a real credential
    if (credential === '***BACKEND***') {
      logger.info(`Provider ${providerId} uses backend credential (Secret Manager)`, 'credentialsHelper');
      return null; // Client-side code can't use backend credentials directly
    }

    return credential;
  } catch (err) {
    logger.error(`Error loading credential for ${providerId}`, err, 'credentialsHelper');
    return null;
  }
}

/**
 * Verifica si un proveedor tiene credenciales configuradas
 * @param {string} providerId - ID del proveedor
 * @returns {Promise<boolean>}
 */
export async function hasAICredential(providerId) {
  const credential = await getAICredential(providerId);
  return !!credential;
}

/**
 * Guarda una credencial
 * @param {string} providerId - ID del proveedor
 * @param {string} apiKey - API key
 * @returns {Promise<void>}
 */
export async function setAICredential(providerId, apiKey) {
  await credentialsService.set(providerId, apiKey);
}

/**
 * Elimina una credencial
 * @param {string} providerId - ID del proveedor
 * @returns {Promise<void>}
 */
export async function deleteAICredential(providerId) {
  await credentialsService.delete(providerId);
}

/**
 * Obtiene todas las credenciales
 * @returns {Promise<Object>} Mapa de providerId -> credential
 */
export async function getAllAICredentials() {
  return credentialsService.getAll();
}

// Export credentialsService for direct access
export { credentialsService };

export default {
  getAICredential,
  hasAICredential,
  setAICredential,
  deleteAICredential,
  getAllAICredentials
};
