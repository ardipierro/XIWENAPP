/**
 * @fileoverview Utilidad para generar hashes únicos de audios
 * Usado para cachear audios generados por TTS
 * @module utils/audioHash
 */

/**
 * Genera un hash SHA-256 único para un audio basado en sus parámetros
 * El hash incluye:
 * - Texto (normalizado, sin espacios extra, lowercase)
 * - Provider (elevenlabs, browser, etc.)
 * - VoiceId (ID de la voz específica)
 * - Rate (velocidad, redondeada a 2 decimales)
 *
 * NO incluye volume porque no afecta el archivo generado
 *
 * @param {string} text - Texto a convertir en audio
 * @param {Object} voiceConfig - Configuración de voz
 * @param {string} voiceConfig.provider - Proveedor (elevenlabs, browser)
 * @param {string} voiceConfig.voiceId - ID de la voz
 * @param {number} voiceConfig.rate - Velocidad de reproducción
 * @returns {Promise<string>} Hash SHA-256 en formato hexadecimal
 */
export async function generateAudioHash(text, voiceConfig) {
  // Normalizar el texto: trim, lowercase, eliminar espacios múltiples
  const normalizedText = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  // Crear objeto con parámetros que afectan la generación del audio
  const params = {
    text: normalizedText,
    provider: voiceConfig?.provider || 'browser',
    voiceId: voiceConfig?.voiceId || 'default',
    rate: (voiceConfig?.rate || 1.0).toFixed(2)
    // NO incluir volume - no afecta el archivo generado
    // NO incluir pitch en ElevenLabs - no es un parámetro expuesto
  };

  // Serializar a JSON de forma determinística
  const dataString = JSON.stringify(params);

  // Generar hash SHA-256 usando Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convertir buffer a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Genera un hash corto (primeros 16 caracteres) para uso en logs
 * @param {string} text - Texto a convertir en audio
 * @param {Object} voiceConfig - Configuración de voz
 * @returns {Promise<string>} Hash corto (16 caracteres)
 */
export async function generateShortHash(text, voiceConfig) {
  const fullHash = await generateAudioHash(text, voiceConfig);
  return fullHash.substring(0, 16);
}

/**
 * Valida que los parámetros sean válidos para generar un hash
 * @param {string} text - Texto a validar
 * @param {Object} voiceConfig - Configuración de voz
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateHashParams(text, voiceConfig) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { valid: false, error: 'Text is required and must be a non-empty string' };
  }

  if (!voiceConfig || typeof voiceConfig !== 'object') {
    return { valid: false, error: 'voiceConfig is required and must be an object' };
  }

  if (text.length > 5000) {
    return { valid: false, error: 'Text is too long (max 5000 characters)' };
  }

  return { valid: true };
}
