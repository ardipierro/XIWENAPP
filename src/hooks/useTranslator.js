/**
 * useTranslator Hook
 * Custom hook for translating text using AI or Dictionaries with caching
 */

import { useState, useCallback } from 'react';
import { callAI, getAIConfig } from '../firebase/aiConfig';
import {
  getCachedTranslation,
  setCachedTranslation
} from '../utils/translationCache';
import { searchInDictionaries } from '../services/dictionaryService';
import logger from '../utils/logger';

/**
 * Hook for translating text with AI
 * @returns {Object} Translation utilities
 */
export function useTranslator() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);
  const [lastTranslation, setLastTranslation] = useState(null);

  /**
   * Parse AI response to extract translation data
   * @param {string} response - AI response text
   * @param {string} originalText - Original text that was translated
   * @returns {Object} Parsed translation object
   */
  const parseAIResponse = useCallback((response, originalText) => {
    try {
      // Try to parse as JSON first (if AI returns structured data)
      try {
        const parsed = JSON.parse(response);
        return {
          word: originalText,
          chinese: parsed.chinese || parsed.translation || '',
          pinyin: parsed.pinyin || '',
          meanings: parsed.meanings || [],
          example: parsed.example || null,
          rawResponse: response
        };
      } catch {
        // If not JSON, parse text response
        const lines = response.split('\n').filter(line => line.trim());

        // Extract Chinese translation (first line usually)
        let chinese = '';
        let pinyin = '';
        let meanings = [];
        let example = null;

        lines.forEach((line, index) => {
          // Look for Chinese characters
          if (/[\u4e00-\u9fa5]/.test(line) && !chinese) {
            // Extract Chinese and pinyin if present
            const match = line.match(/([^\u4e00-\u9fa5]*)([\u4e00-\u9fa5]+)[\s,]*([a-zāáǎàēéěèīíǐìōóǒòūúǔùüǖǘǚǜ\s]*)/i);
            if (match) {
              chinese = match[2].trim();
              pinyin = match[3].trim();
            }
          }

          // Look for meanings/definitions (lines with bullet points or numbers)
          if (line.match(/^[\s-•*\d.]/)) {
            const meaning = line.replace(/^[\s-•*\d.]+/, '').trim();
            if (meaning) meanings.push(meaning);
          }

          // Look for examples
          if (line.toLowerCase().includes('ejemplo') || line.toLowerCase().includes('example')) {
            const nextLine = lines[index + 1];
            if (nextLine) {
              const exampleMatch = nextLine.match(/(.+?)[=→:](.+)/);
              if (exampleMatch) {
                example = {
                  spanish: exampleMatch[1].trim(),
                  chinese: exampleMatch[2].trim()
                };
              }
            }
          }
        });

        return {
          word: originalText,
          chinese: chinese || response.match(/[\u4e00-\u9fa5]+/)?.[0] || '',
          pinyin: pinyin,
          meanings: meanings.length > 0 ? meanings : [response.split('\n')[0]],
          example: example,
          rawResponse: response
        };
      }
    } catch (error) {
      logger.error('Error parsing AI response', error, 'useTranslator');
      return {
        word: originalText,
        chinese: '',
        pinyin: '',
        meanings: [response],
        example: null,
        rawResponse: response,
        parseError: true
      };
    }
  }, []);

  /**
   * Helper: Translate using AI
   */
  const translateWithAI = async (trimmedText, config) => {
    // Get AI configuration
    const aiConfig = await getAIConfig();

    // Get translator function config (functions is an object, not an array)
    const translatorConfig = aiConfig.functions?.translator;

    if (!translatorConfig || !translatorConfig.enabled) {
      throw new Error('El traductor no está habilitado. Por favor, configúralo en la sección de AI.');
    }

    // Use provider from content config if specified, otherwise use translator config
    const provider = config.ai?.provider || translatorConfig.provider;
    const model = config.ai?.model || translatorConfig.model;

    // Build the prompt
    const prompt = `Traduce la siguiente palabra o frase del español al chino simplificado.
Proporciona:
1. La traducción en chino (caracteres simplificados)
2. La pronunciación en pinyin
3. Al menos 2-3 significados o usos diferentes
4. Un ejemplo de uso en contexto (español → chino)

Texto a traducir: "${trimmedText}"

Formato de respuesta (JSON):
{
  "chinese": "工作",
  "pinyin": "gōngzuò",
  "meanings": ["Trabajo, empleo", "Labor, tarea", "Obra"],
  "example": {
    "spanish": "Voy al trabajo",
    "chinese": "我去上班"
  }
}`;

    // Call AI
    logger.info(`Translating with AI (${provider}): ${trimmedText}`, 'useTranslator');
    const response = await callAI(
      provider,
      prompt,
      {
        model: model,
        systemPrompt: translatorConfig.systemPrompt,
        parameters: translatorConfig.parameters
      }
    );

    // Parse response
    return parseAIResponse(response, trimmedText);
  };

  /**
   * Translate text from Spanish to Chinese
   * @param {string} text - Text to translate
   * @param {string} sourceLang - Source language (default: 'es')
   * @param {string} targetLang - Target language (default: 'zh')
   * @returns {Promise<Object>} Translation object
   */
  const translate = useCallback(async (text, sourceLang = 'es', targetLang = 'zh') => {
    if (!text || !text.trim()) {
      throw new Error('No text provided for translation');
    }

    const trimmedText = text.trim();
    setIsTranslating(true);
    setError(null);

    try {
      // Load translator configuration FIRST
      const configStr = localStorage.getItem('xiwen_translator_config');
      const config = configStr ? JSON.parse(configStr) : { mode: 'ai' };

      logger.info(`Translation mode: ${config.mode}`, 'useTranslator');

      // SOLO verificar caché para traducciones de IA (costosas)
      // NO cachear búsquedas de diccionario (instantáneas < 10ms)
      if (config.mode === 'ai') {
        const cached = getCachedTranslation(trimmedText, sourceLang, targetLang);
        if (cached) {
          logger.info(`Using cached AI translation for: ${trimmedText}`, 'useTranslator');
          setLastTranslation(cached);
          setIsTranslating(false);
          return cached;
        }
      }

      let translationData = null;

      // MODO DICTIONARY: Solo usar diccionarios
      if (config.mode === 'dictionary') {
        translationData = await searchInDictionaries(trimmedText, config.dictionary);

        if (!translationData) {
          throw new Error('Palabra no encontrada en el diccionario. Prueba con el modo Híbrido o IA.');
        }
      }
      // MODO HYBRID: Diccionario primero, AI como fallback
      else if (config.mode === 'hybrid') {
        // Intentar con diccionario
        translationData = await searchInDictionaries(trimmedText, config.dictionary);

        // Si no encuentra y tiene fallback habilitado, usar AI
        if (!translationData && config.dictionary?.fallbackToAI !== false) {
          logger.info('Dictionary not found, falling back to AI', 'useTranslator');
          translationData = await translateWithAI(trimmedText, config);
        } else if (!translationData) {
          throw new Error('Palabra no encontrada en el diccionario.');
        }
      }
      // MODO AI (default): Solo usar IA
      else {
        translationData = await translateWithAI(trimmedText, config);
      }

      // SOLO cachear traducciones de IA (costosas)
      // NO cachear búsquedas de diccionario (instantáneas)
      if (config.mode === 'ai' || (config.mode === 'hybrid' && translationData?.source !== 'cedict')) {
        setCachedTranslation(trimmedText, translationData, sourceLang, targetLang);
        logger.info('Cached AI translation', 'useTranslator');
      }

      setLastTranslation(translationData);
      setIsTranslating(false);

      return translationData;

    } catch (err) {
      logger.error('Translation error', err, 'useTranslator');
      setError(err.message || 'Error al traducir');
      setIsTranslating(false);
      throw err;
    }
  }, [parseAIResponse]);

  /**
   * Clear translation error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset translator state
   */
  const reset = useCallback(() => {
    setIsTranslating(false);
    setError(null);
    setLastTranslation(null);
  }, []);

  return {
    translate,
    isTranslating,
    error,
    lastTranslation,
    clearError,
    reset
  };
}

export default useTranslator;
