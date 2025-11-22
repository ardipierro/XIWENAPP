/**
 * @fileoverview Google Translate API Service
 * Servicio para traducción español ↔ chino simplificado usando Google Cloud Translation API
 * @module services/googleTranslateService
 */

import logger from '../utils/logger';

// Configuración de la API
const GOOGLE_TRANSLATE_API = 'https://translation.googleapis.com/language/translate/v2';

// Clave para localStorage
const GOOGLE_API_KEY_STORAGE = 'ai_credentials_google_translate';

/**
 * Obtiene la API key de Google Translate
 * Prioridad: localStorage > parámetro > null
 * @returns {string|null}
 */
export function getGoogleTranslateApiKey() {
  try {
    // Intentar localStorage primero
    const stored = localStorage.getItem(GOOGLE_API_KEY_STORAGE);
    if (stored && stored.trim()) {
      return stored.trim();
    }

    // También buscar en la clave genérica de Google
    const googleKey = localStorage.getItem('ai_credentials_google');
    if (googleKey && googleKey.trim()) {
      return googleKey.trim();
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
export function setGoogleTranslateApiKey(apiKey) {
  try {
    if (apiKey && apiKey.trim()) {
      localStorage.setItem(GOOGLE_API_KEY_STORAGE, apiKey.trim());
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
 * @param {string} options.apiKey - API key (opcional, usa localStorage si no se provee)
 * @returns {Promise<Object>} Resultado de traducción
 */
export async function translateWithGoogle(text, options = {}) {
  const {
    source = 'es',      // Español
    target = 'zh-CN',   // Chino simplificado
    apiKey = null
  } = options;

  // Obtener API key
  const key = apiKey || getGoogleTranslateApiKey();

  if (!key) {
    throw new Error('Google Translate API key no configurada. Configúrala en Ajustes > Credenciales.');
  }

  if (!text || !text.trim()) {
    throw new Error('No se proporcionó texto para traducir');
  }

  const trimmedText = text.trim();

  logger.info(`Translating with Google: "${trimmedText.substring(0, 50)}..."`, 'googleTranslateService');

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

    return {
      success: true,
      originalText: trimmedText,
      translatedText: translation,
      sourceLang: source,
      targetLang: target,
      source: 'google-translate'
    };

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
 * @returns {boolean}
 */
export function isGoogleTranslateConfigured() {
  const key = getGoogleTranslateApiKey();
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
