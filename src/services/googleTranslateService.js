/**
 * @fileoverview Google Translate API Service
 * Servicio para traducción español ↔ chino simplificado usando Google Cloud Translation API
 * @module services/googleTranslateService
 *
 * Refactored to use centralized CredentialsService
 */

import logger from '../utils/logger';
import credentialsService from './CredentialsService';
import googleTranslateCache from '../utils/googleTranslateCache';

// Configuración de la API
const GOOGLE_TRANSLATE_API = 'https://translation.googleapis.com/language/translate/v2';

// Cache for API key
let _apiKeyCache = null;
let _apiKeyCacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Obtiene la API key de Google Translate
 * Uses centralized CredentialsService
 * @returns {Promise<string|null>}
 */
export async function getGoogleTranslateApiKey() {
  try {
    // Check cache first
    if (_apiKeyCache && _apiKeyCacheTimestamp && (Date.now() - _apiKeyCacheTimestamp < CACHE_DURATION)) {
      return _apiKeyCache;
    }

    // Initialize service
    await credentialsService.initialize();

    // Try 'google_translate' provider first (specific for Translation API)
    let key = await credentialsService.get('google_translate');

    // If not found or is backend marker, try custom credentials
    if (!key || key === '***BACKEND***') {
      // Check for custom Google Translate credentials
      const customCredentials = await credentialsService.getCustomCredentials();
      const googleTranslateCustom = customCredentials.find(c =>
        c.displayName?.toLowerCase().includes('google') &&
        c.displayName?.toLowerCase().includes('translate')
      );

      if (googleTranslateCustom?.apiKey?.trim()) {
        key = googleTranslateCustom.apiKey.trim();
      }
    }

    // Update cache
    if (key && key !== '***BACKEND***') {
      _apiKeyCache = key;
      _apiKeyCacheTimestamp = Date.now();
      logger.info('Google API key loaded from centralized service', 'googleTranslateService');
      return key;
    }

    return null;
  } catch (error) {
    logger.error('Error getting Google API key', error, 'googleTranslateService');
    return null;
  }
}

/**
 * Guarda la API key de Google Translate
 * @param {string} apiKey - La API key a guardar
 */
export async function setGoogleTranslateApiKey(apiKey) {
  try {
    if (apiKey && apiKey.trim()) {
      await credentialsService.set('google_translate', apiKey.trim());
      _apiKeyCache = apiKey.trim();
      _apiKeyCacheTimestamp = Date.now();
      logger.info('Google Translate API key saved', 'googleTranslateService');
    }
  } catch (error) {
    logger.error('Error saving Google API key', error, 'googleTranslateService');
  }
}

/**
 * Traduce texto usando Google Translate API
 * @param {string} text - Texto a traducir
 * @param {Object} options - Opciones de traducción
 * @param {string} options.source - Idioma origen (default: 'es')
 * @param {string} options.target - Idioma destino (default: 'zh-CN')
 * @param {string} options.apiKey - API key (opcional, usa CredentialsService si no se provee)
 * @returns {Promise<Object>} Resultado de traducción
 */
export async function translateWithGoogle(text, options = {}) {
  const {
    source = 'es',      // Español
    target = 'zh-CN',   // Chino simplificado
    apiKey = null
  } = options;

  if (!text || !text.trim()) {
    throw new Error('No se proporcionó texto para traducir');
  }

  const trimmedText = text.trim();

  // Check cache first
  const cached = googleTranslateCache.getCachedTranslation(trimmedText, source, target);
  if (cached) {
    logger.info(`Using cached Google translation for: "${trimmedText.substring(0, 50)}..."`, 'googleTranslateService');
    return cached;
  }

  // Obtener API key
  const key = apiKey || await getGoogleTranslateApiKey();

  if (!key) {
    throw new Error('Google Translate API key no configurada. Configúrala en Ajustes > Credenciales.');
  }

  logger.info(`Translating with Google API: "${trimmedText.substring(0, 50)}..."`, 'googleTranslateService');

  try {
    const response = await fetch(`${GOOGLE_TRANSLATE_API}?key=${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: trimmedText,
        source: source,
        target: target,
        format: 'text'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`;

      // Manejar errores comunes
      if (response.status === 403) {
        throw new Error('API key inválida o sin permisos. Verifica tu clave de Google Cloud.');
      }
      if (response.status === 429) {
        throw new Error('Límite de traducción alcanzado. Intenta más tarde.');
      }

      throw new Error(`Error de Google Translate: ${errorMessage}`);
    }

    const data = await response.json();

    if (!data.data?.translations?.[0]?.translatedText) {
      throw new Error('Respuesta inválida de Google Translate');
    }

    const translation = data.data.translations[0].translatedText;

    logger.info(`Google translation result: "${translation}"`, 'googleTranslateService');

    const result = {
      success: true,
      originalText: trimmedText,
      translatedText: translation,
      sourceLang: source,
      targetLang: target,
      source: 'google-translate'
    };

    // Cache the result
    googleTranslateCache.setCachedTranslation(trimmedText, result, source, target);

    return result;

  } catch (error) {
    logger.error('Google Translate API error', error, 'googleTranslateService');
    throw error;
  }
}

/**
 * Traduce de español a chino simplificado (atajo)
 * @param {string} text - Texto en español
 * @returns {Promise<Object>} Resultado de traducción
 */
export async function translateSpanishToChinese(text) {
  return translateWithGoogle(text, { source: 'es', target: 'zh-CN' });
}

/**
 * Traduce de chino a español (atajo)
 * @param {string} text - Texto en chino
 * @returns {Promise<Object>} Resultado de traducción
 */
export async function translateChineseToSpanish(text) {
  return translateWithGoogle(text, { source: 'zh-CN', target: 'es' });
}

/**
 * Detecta el idioma y traduce automáticamente
 * Si detecta chino, traduce a español; si detecta español, traduce a chino
 * @param {string} text - Texto a traducir
 * @returns {Promise<Object>} Resultado de traducción
 */
export async function autoTranslate(text) {
  // Detectar si contiene caracteres chinos
  const hasChineseChars = /[\u4e00-\u9fa5]/.test(text);

  if (hasChineseChars) {
    return translateChineseToSpanish(text);
  } else {
    return translateSpanishToChinese(text);
  }
}

/**
 * Verifica si Google Translate está configurado
 * @returns {Promise<boolean>}
 */
export async function isGoogleTranslateConfigured() {
  const key = await getGoogleTranslateApiKey();
  return key !== null && key.length > 10;
}

export default {
  translateWithGoogle,
  translateSpanishToChinese,
  translateChineseToSpanish,
  autoTranslate,
  getGoogleTranslateApiKey,
  setGoogleTranslateApiKey,
  isGoogleTranslateConfigured
};
