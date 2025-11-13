/**
 * @fileoverview Helper centralizado para leer credenciales de IA
 * @module utils/credentialsHelper
 *
 * Usa la misma lógica que CredentialsTab para evitar inconsistencias.
 * Prioridad: Backend Secret Manager > localStorage > Firebase functions > Firebase credentials
 */

import { getAIConfig } from '../firebase/aiConfig';
import logger from './logger';

// Mapeos de nombres entre sistemas (idéntico a CredentialsTab)
const PROVIDER_MAPPINGS = {
  elevenlabs: {
    localStorageName: 'elevenlabs',
    firebaseName: 'elevenlabs',
    backendName: 'elevenlabs',
    apiKeyField: 'elevenlabs_api_key'
  },
  openai: {
    localStorageName: 'OpenAI',
    firebaseName: 'openai',
    backendName: 'openai',
    apiKeyField: 'openai_api_key'
  },
  stability: {
    localStorageName: 'Stability',
    firebaseName: 'stability',
    backendName: null,
    apiKeyField: 'stability_api_key'
  }
};

/**
 * Lee una credencial usando la misma lógica que CredentialsTab
 * @param {string} providerId - ID del proveedor ('elevenlabs', 'openai', 'stability')
 * @returns {Promise<string|null>} - La credencial o null si no existe
 */
export async function getAICredential(providerId) {
  try {
    const mapping = PROVIDER_MAPPINGS[providerId];
    if (!mapping) {
      logger.warn(`No mapping found for provider: ${providerId}`, 'credentialsHelper');
      return null;
    }

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
        return credential.trim();
      }
    }

    return null;

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
