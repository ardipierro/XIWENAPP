/**
 * @fileoverview Helper CENTRALIZADO para leer credenciales de IA
 * @module utils/credentialsHelper
 *
 * BACKWARD COMPATIBILITY LAYER
 * This file now wraps the centralized CredentialsService
 * for components that haven't been refactored yet.
 *
 * For new code, prefer importing CredentialsService directly:
 * import credentialsService from '../services/CredentialsService';
 */

import credentialsService from '../services/CredentialsService';
import logger from './logger';

// ============================================================================
// LEGACY SUPPORT - For sync operations that can't use async/await
// ============================================================================

// Mappings for sync operations (localStorage only)
const PROVIDER_MAPPINGS = {
  openai: { localStorageName: 'OpenAI' },
  anthropic: { localStorageName: 'Claude' },
  google: { localStorageName: 'Google' },
  google_translate: { localStorageName: 'Google Cloud Translate API' },
  xai: { localStorageName: 'Grok' },
  grok: { localStorageName: 'Grok' },
  stability: { localStorageName: 'Stability' },
  replicate: { localStorageName: 'Replicate' },
  leonardo: { localStorageName: 'Leonardo' },
  huggingface: { localStorageName: 'HuggingFace' },
  elevenlabs: { localStorageName: 'elevenlabs' }
};

// Aliases for common names
const PROVIDER_ALIASES = {
  'eleven labs': 'elevenlabs',
  'eleven_labs': 'elevenlabs',
  'claude': 'anthropic',
  'gemini': 'google',
  'x.ai': 'xai'
};

/**
 * Normaliza el ID del proveedor
 */
function normalizeProviderId(providerId) {
  if (!providerId) return null;
  const normalized = providerId.toLowerCase().trim();
  if (PROVIDER_MAPPINGS[normalized]) return normalized;
  if (PROVIDER_ALIASES[normalized]) return PROVIDER_ALIASES[normalized];
  return normalized;
}

/**
 * Lee una credencial de forma SINCRÓNICA (solo localStorage)
 * Usar cuando no se puede usar async/await
 */
export function getAICredentialSync(providerId) {
  try {
    const normalizedId = normalizeProviderId(providerId);
    if (!normalizedId) return null;

    const mapping = PROVIDER_MAPPINGS[normalizedId];
    if (!mapping) return null;

    const localStorageKey = `ai_credentials_${mapping.localStorageName}`;
    const localValue = localStorage.getItem(localStorageKey);

    if (localValue && localValue.trim()) {
      return localValue.trim();
    }

    return null;
  } catch (err) {
    logger.error(`Error sync loading ${providerId}`, err, 'credentialsHelper');
    return null;
  }
}

/**
 * Lee una credencial de forma ASINCRÓNICA usando CredentialsService
 */
export async function getAICredential(providerId) {
  try {
    const credential = await credentialsService.get(providerId);

    // Don't return backend marker as a real credential
    if (credential === '***BACKEND***') {
      logger.info(`Provider ${providerId} uses backend credential (Secret Manager)`, 'credentialsHelper');
      return null;
    }

    return credential;
  } catch (err) {
    logger.error(`Error loading ${providerId}`, err, 'credentialsHelper');
    return null;
  }
}

/**
 * Verifica si un proveedor tiene credenciales configuradas (async)
 */
export async function hasAICredential(providerId) {
  const credential = await getAICredential(providerId);
  return !!credential;
}

/**
 * Verifica si un proveedor tiene credenciales configuradas (sync)
 */
export function hasAICredentialSync(providerId) {
  const credential = getAICredentialSync(providerId);
  return !!credential;
}

/**
 * Guarda una credencial
 */
export async function setAICredential(providerId, apiKey) {
  await credentialsService.set(providerId, apiKey);
}

/**
 * Elimina una credencial
 */
export async function deleteAICredential(providerId) {
  await credentialsService.delete(providerId);
}

/**
 * Obtiene todas las credenciales
 */
export async function getAllAICredentials() {
  return credentialsService.getAll();
}

/**
 * Obtiene la clave de localStorage para un proveedor
 */
export function getLocalStorageKey(providerId) {
  const normalizedId = normalizeProviderId(providerId);
  if (!normalizedId) return null;
  const mapping = PROVIDER_MAPPINGS[normalizedId];
  if (!mapping) return null;
  return `ai_credentials_${mapping.localStorageName}`;
}

/**
 * Lista todos los providers disponibles
 */
export function getAvailableProviders() {
  return Object.keys(PROVIDER_MAPPINGS);
}

// Export credentialsService for direct access
export { credentialsService, normalizeProviderId };

export default {
  getAICredential,
  getAICredentialSync,
  hasAICredential,
  hasAICredentialSync,
  setAICredential,
  deleteAICredential,
  getAllAICredentials,
  getLocalStorageKey,
  getAvailableProviders,
  normalizeProviderId
};
