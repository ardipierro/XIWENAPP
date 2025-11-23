/**
 * @fileoverview Helper CENTRALIZADO para leer credenciales de IA
 * @module utils/credentialsHelper
 *
 * ⚠️ IMPORTANTE: TODOS los servicios deben usar este helper.
 * NO leer localStorage directamente para credenciales de IA.
 *
 * Prioridad de lectura:
 * 1. localStorage (ai_credentials_XXX)
 * 2. Firebase functions[].apiKey
 * 3. Firebase credentials{} (legacy)
 */

import { getAIConfig } from '../firebase/aiConfig';
import logger from './logger';

// ============================================================================
// MAPPINGS CENTRALIZADOS - ÚNICA FUENTE DE VERDAD
// ============================================================================
// Estos mappings DEBEN coincidir con CredentialsTab.jsx

const PROVIDER_MAPPINGS = {
  // === TEXTO / CHAT ===
  openai: {
    localStorageName: 'OpenAI',
    firebaseName: 'openai',
    backendName: 'openai',
    apiKeyField: 'openai_api_key'
  },
  anthropic: {
    localStorageName: 'Claude',
    firebaseName: 'claude',
    backendName: 'claude',
    apiKeyField: 'anthropic_api_key'
  },
  google: {
    localStorageName: 'Google',
    firebaseName: 'google',
    backendName: 'gemini',
    apiKeyField: 'google_api_key'
  },
  xai: {
    localStorageName: 'Grok',  // Coincide con CredentialsTab
    firebaseName: 'grok',
    backendName: 'grok',
    apiKeyField: 'grok_api_key'
  },

  // === IMÁGENES ===
  stability: {
    localStorageName: 'Stability',
    firebaseName: 'stability',
    backendName: null,
    apiKeyField: 'stability_api_key'
  },
  replicate: {
    localStorageName: 'Replicate',
    firebaseName: 'replicate',
    backendName: null,
    apiKeyField: 'replicate_api_key'
  },
  leonardo: {
    localStorageName: 'Leonardo',
    firebaseName: 'leonardo',
    backendName: null,
    apiKeyField: 'leonardo_api_key'
  },
  huggingface: {
    localStorageName: 'HuggingFace',
    firebaseName: 'huggingface',
    backendName: null,
    apiKeyField: 'huggingface_api_key'
  },

  // === AUDIO / TTS ===
  elevenlabs: {
    localStorageName: 'elevenlabs',  // lowercase para compatibilidad
    firebaseName: 'elevenlabs',
    backendName: 'elevenlabs',
    apiKeyField: 'elevenlabs_api_key'
  }
};

// Aliases para nombres comunes (case-insensitive)
const PROVIDER_ALIASES = {
  'eleven labs': 'elevenlabs',
  'eleven_labs': 'elevenlabs',
  'elevenlabs': 'elevenlabs',
  'openai': 'openai',
  'open ai': 'openai',
  'claude': 'anthropic',
  'anthropic': 'anthropic',
  'stability': 'stability',
  'stability ai': 'stability',
  'stabilityai': 'stability',
  'replicate': 'replicate',
  'leonardo': 'leonardo',
  'leonardo.ai': 'leonardo',
  'leonardoai': 'leonardo',
  'huggingface': 'huggingface',
  'hugging face': 'huggingface',
  'hf': 'huggingface',
  'google': 'google',
  'gemini': 'google',
  'xai': 'xai',
  'grok': 'xai',
  'x.ai': 'xai'
};

/**
 * Normaliza el ID del proveedor a su forma canónica
 * @param {string} providerId - ID o nombre del proveedor
 * @returns {string|null} - ID normalizado o null si no se reconoce
 */
function normalizeProviderId(providerId) {
  if (!providerId) return null;

  const normalized = providerId.toLowerCase().trim();

  // Primero verificar si es un ID directo
  if (PROVIDER_MAPPINGS[normalized]) {
    return normalized;
  }

  // Luego verificar aliases
  if (PROVIDER_ALIASES[normalized]) {
    return PROVIDER_ALIASES[normalized];
  }

  return null;
}

/**
 * Lee una credencial de forma SINCRÓNICA (solo localStorage)
 * Usar cuando no se puede usar async/await
 *
 * @param {string} providerId - ID del proveedor ('elevenlabs', 'openai', etc.)
 * @returns {string|null} - La credencial o null si no existe
 */
export function getAICredentialSync(providerId) {
  try {
    const normalizedId = normalizeProviderId(providerId);
    if (!normalizedId) {
      logger.warn(`[credentialsHelper] Provider no reconocido: ${providerId}`);
      return null;
    }

    const mapping = PROVIDER_MAPPINGS[normalizedId];

    // Solo buscar en localStorage (sincrónico)
    const localStorageKey = `ai_credentials_${mapping.localStorageName}`;
    const localValue = localStorage.getItem(localStorageKey);

    if (localValue && localValue.trim()) {
      return localValue.trim();
    }

    return null;

  } catch (err) {
    logger.error(`[credentialsHelper] Error sync loading ${providerId}`, err);
    return null;
  }
}

/**
 * Lee una credencial de forma ASINCRÓNICA (localStorage + Firebase)
 *
 * @param {string} providerId - ID del proveedor ('elevenlabs', 'openai', etc.)
 * @returns {Promise<string|null>} - La credencial o null si no existe
 */
export async function getAICredential(providerId) {
  try {
    const normalizedId = normalizeProviderId(providerId);
    if (!normalizedId) {
      logger.warn(`[credentialsHelper] Provider no reconocido: ${providerId}`);
      return null;
    }

    const mapping = PROVIDER_MAPPINGS[normalizedId];

    // 1. Intentar cargar desde localStorage primero (más rápido)
    const localStorageKey = `ai_credentials_${mapping.localStorageName}`;
    const localValue = localStorage.getItem(localStorageKey);
    if (localValue && localValue.trim()) {
      return localValue.trim();
    }

    // 2. Si no está en localStorage, cargar desde Firebase
    const aiConfig = await getAIConfig();
    if (!aiConfig) {
      return null;
    }

    // 3. Buscar en functions[] primero
    if (aiConfig.functions) {
      for (const funcConfig of Object.values(aiConfig.functions)) {
        if (funcConfig.provider === mapping.firebaseName && funcConfig.apiKey?.trim()) {
          // Guardar en localStorage para próxima vez
          localStorage.setItem(localStorageKey, funcConfig.apiKey.trim());
          logger.info(`[credentialsHelper] Cached ${normalizedId} from Firebase functions`);
          return funcConfig.apiKey.trim();
        }
      }
    }

    // 4. Buscar en credentials{} (legacy)
    if (aiConfig.credentials?.[mapping.apiKeyField]) {
      const credential = aiConfig.credentials[mapping.apiKeyField];
      if (credential && credential.trim()) {
        // Guardar en localStorage para próxima vez
        localStorage.setItem(localStorageKey, credential.trim());
        logger.info(`[credentialsHelper] Cached ${normalizedId} from Firebase credentials`);
        return credential.trim();
      }
    }

    return null;

  } catch (err) {
    logger.error(`[credentialsHelper] Error loading ${providerId}`, err);
    return null;
  }
}

/**
 * Verifica si un proveedor tiene credenciales configuradas (async)
 * @param {string} providerId - ID del proveedor
 * @returns {Promise<boolean>}
 */
export async function hasAICredential(providerId) {
  const credential = await getAICredential(providerId);
  return !!credential;
}

/**
 * Verifica si un proveedor tiene credenciales configuradas (sync, solo localStorage)
 * @param {string} providerId - ID del proveedor
 * @returns {boolean}
 */
export function hasAICredentialSync(providerId) {
  const credential = getAICredentialSync(providerId);
  return !!credential;
}

/**
 * Obtiene la clave de localStorage correcta para un proveedor
 * Útil para debugging o cuando se necesita guardar manualmente
 * @param {string} providerId - ID del proveedor
 * @returns {string|null} - La clave de localStorage o null
 */
export function getLocalStorageKey(providerId) {
  const normalizedId = normalizeProviderId(providerId);
  if (!normalizedId) return null;

  const mapping = PROVIDER_MAPPINGS[normalizedId];
  return `ai_credentials_${mapping.localStorageName}`;
}

/**
 * Lista todos los providers disponibles
 * @returns {string[]} - Array de IDs de providers
 */
export function getAvailableProviders() {
  return Object.keys(PROVIDER_MAPPINGS);
}

// Export por defecto para conveniencia
export default {
  getAICredential,
  getAICredentialSync,
  hasAICredential,
  hasAICredentialSync,
  getLocalStorageKey,
  getAvailableProviders,
  normalizeProviderId
};
