/**
 * AIService - Simplified AI service using Firestore aiConfig
 * Integrates with existing aiConfig.js module
 */

import { getAIConfig, callAI } from '../firebase/aiConfig';
import logger from '../utils/logger';

// AI Provider metadata
// IMPORTANT: credentialsField must match the field name in Firestore credentials object
// IMPORTANT: localStorageName must match the exact casing used by CredentialsTab
const AI_PROVIDERS = [
  { id: 'openai', name: 'openai', label: 'ChatGPT', icon: '🤖', model: 'gpt-4', credentialsField: 'openai_api_key', localStorageName: 'OpenAI', type: 'text' },
  { id: 'grok', name: 'grok', label: 'Grok', icon: '⚡', model: 'grok-2', credentialsField: 'grok_api_key', localStorageName: 'Grok', type: 'text' },
  { id: 'gemini', name: 'gemini', label: 'Google Gemini', icon: '🔮', model: 'gemini-1.5-pro', credentialsField: 'google_api_key', localStorageName: 'Google', type: 'text' },
  { id: 'claude', name: 'claude', label: 'Claude', icon: '💬', model: 'claude-3-sonnet', credentialsField: 'anthropic_api_key', localStorageName: 'Claude', type: 'text' },
  { id: 'elevenlabs', name: 'elevenlabs', label: 'ElevenLabs TTS', icon: '🎤', model: 'eleven_multilingual_v2', credentialsField: 'elevenlabs_api_key', localStorageName: 'elevenlabs', type: 'tts' }
];

class AIService {
  constructor() {
    this.config = null;
    this.currentProvider = null;
  }

  /**
   * Initialize service (load config from Firestore)
   */
  async initialize() {
    const rawConfig = await getAIConfig();

    // Adapt config structure from credentials format to expected format
    // Firestore stores: { credentials: { openai_api_key: "...", gemini_api_key: "..." } }
    // We need: { openai: { enabled: true, apiKey: "..." }, gemini: { ... } }
    this.config = {};

    // Build config from credentials (Firestore) + localStorage fallback
    for (const provider of AI_PROVIDERS) {
      const apiKeyField = provider.credentialsField || `${provider.id}_api_key`;

      // Try Firestore first
      let apiKey = rawConfig.credentials?.[apiKeyField];

      // Fallback to localStorage (legacy)
      if (!apiKey && provider.localStorageName) {
        const localStorageKey = `ai_credentials_${provider.localStorageName}`;
        apiKey = localStorage.getItem(localStorageKey);
        if (apiKey) {
          logger.info(`Found ${provider.id} API key in localStorage: ${localStorageKey}`, 'AIService');
        }
      }

      if (apiKey) {
        this.config[provider.id] = {
          enabled: true,
          apiKey: apiKey,
          basePrompt: rawConfig[provider.id]?.basePrompt || 'Eres un asistente educativo experto.',
          tone: rawConfig[provider.id]?.tone || 'professional'
        };
      }
    }

    // Debug: Show full config status for each provider
    const configStatus = AI_PROVIDERS.map(provider => ({
      id: provider.id,
      enabled: this.config[provider.id]?.enabled || false,
      hasApiKey: !!this.config[provider.id]?.apiKey,
      apiKeyLength: this.config[provider.id]?.apiKey?.length || 0
    }));

    console.table(configStatus);
    logger.info('AI Config loaded (see table above):', 'AIService');

    // Find first enabled TEXT provider (skip TTS-only providers like elevenlabs)
    for (const provider of AI_PROVIDERS) {
      if (provider.type === 'text' &&
          this.config[provider.id]?.enabled &&
          this.config[provider.id]?.apiKey) {
        this.currentProvider = provider.id;
        logger.info(`Selected AI provider: ${provider.id}`, 'AIService');
        break;
      }
    }

    if (!this.currentProvider) {
      logger.warn('No TEXT AI provider found with API key. Only TTS providers available?', 'AIService');
    }

    return this.currentProvider !== null;
  }

  /**
   * Set active provider
   */
  setProvider(providerId) {
    if (this.config[providerId]?.enabled && this.config[providerId]?.apiKey) {
      this.currentProvider = providerId;
      return true;
    }
    return false;
  }

  /**
   * Get current provider name
   */
  getCurrentProvider() {
    return this.currentProvider;
  }

  /**
   * Get list of available configured providers
   */
  getAvailableProviders() {
    return AI_PROVIDERS.map(provider => ({
      name: provider.name,
      label: provider.label,
      icon: provider.icon,
      model: provider.model,
      configured: this.config ? (this.config[provider.id]?.enabled && !!this.config[provider.id]?.apiKey) : false,
      active: this.currentProvider === provider.id
    }));
  }

  /**
   * Check if service is configured
   */
  isConfigured() {
    const isConfigured = this.currentProvider !== null &&
           this.config[this.currentProvider]?.enabled &&
           !!this.config[this.currentProvider]?.apiKey;

    // Debug logging
    logger.info('AI Service Configuration Check:', 'AIService', {
      currentProvider: this.currentProvider,
      hasConfig: !!this.config,
      providerEnabled: this.config?.[this.currentProvider]?.enabled,
      hasApiKey: !!this.config?.[this.currentProvider]?.apiKey,
      isConfigured
    });

    return isConfigured;
  }

  /**
   * Generate ESL exercises using current provider
   */
  async generateExercises(params) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'No hay proveedor de IA configurado. Por favor, configura un proveedor en Admin > AI Config.'
      };
    }

    try {
      // Build prompt for exercise generation
      const prompt = this._buildExercisePrompt(params);

      // Call AI
      const response = await callAI(
        this.currentProvider,
        prompt,
        this.config[this.currentProvider]
      );

      return {
        success: true,
        data: response,
        provider: this.currentProvider
      };
    } catch (error) {
      logger.error('AIService error:', 'AIService', error);
      return {
        success: false,
        error: error.message || 'Error al generar ejercicios'
      };
    }
  }

  /**
   * Build exercise generation prompt
   * @private
   */
  _buildExercisePrompt(params) {
    const { theme, subtheme, type, difficulty, quantity, context } = params;

    let prompt = `Genera ${quantity} ejercicio(s) de ${theme}`;

    if (subtheme) {
      prompt += ` enfocado en ${subtheme}`;
    }

    prompt += ` de nivel ${difficulty} (CEFR).`;

    if (context) {
      prompt += ` Contexto adicional: ${context}.`;
    }

    prompt += `\n\nTipo de ejercicio: ${type}`;

    // Add format instructions based on type
    if (type === 'gap-fill' || type === 'fill-in') {
      prompt += `\n\nFormato requerido para cada ejercicio:
SENTENCE: [frase con [___] donde va la palabra faltante]
ANSWER: [respuesta correcta]
EXPLANATION: [explicación breve opcional]

Ejemplo:
SENTENCE: I [___] to school every day.
ANSWER: go
EXPLANATION: Presente simple con "I"`;
    } else if (type === 'multiple-choice') {
      prompt += `\n\nFormato requerido para cada ejercicio:
QUESTION: [pregunta]
OPTIONS: [opción A] | [opción B] | [opción C] | [opción D]
CORRECT: [índice de la respuesta correcta: 0, 1, 2, o 3]
EXPLANATION: [explicación breve opcional]

Ejemplo:
QUESTION: What is the past tense of "go"?
OPTIONS: goed | went | gone | going
CORRECT: 1
EXPLANATION: "Went" es el pasado simple de "go"`;
    } else if (type === 'drag-to-match') {
      prompt += `\n\nFormato requerido para cada ejercicio:
PAIRS: [término 1] = [definición 1] | [término 2] = [definición 2] | ...

Ejemplo:
PAIRS: cat = animal doméstico felino | dog = animal doméstico canino | bird = animal que vuela`;
    }

    prompt += `\n\nGenera exactamente ${quantity} ejercicio(s) siguiendo el formato especificado.`;

    return prompt;
  }

  /**
   * Test current provider connection
   */
  async testConnection() {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'No provider configured'
      };
    }

    try {
      const response = await callAI(
        this.currentProvider,
        'Di "test exitoso" en español',
        this.config[this.currentProvider]
      );

      return {
        success: true,
        message: response,
        provider: this.currentProvider
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: this.currentProvider
      };
    }
  }
}

// Export singleton instance
const aiServiceInstance = new AIService();
export default aiServiceInstance;

/**
 * Generate exercises from text or with custom prompt
 * Funciona con cualquier proveedor de IA configurado
 *
 * @param {string} promptOrText - Prompt completo o texto base
 * @param {Object} options - Options
 * @param {string} options.exerciseType - Tipo de ejercicio (word-marking, mcq, etc.)
 * @param {string} options.cefrLevel - Nivel CEFR (A1-C2)
 * @param {string} options.wordType - Tipo de palabra para word-marking
 * @param {number} options.quantity - Cantidad de ejercicios (default: 1)
 * @returns {Promise<Array>} Array de ejercicios generados
 */
export async function generateExercisesFromText(promptOrText, options = {}) {
  const {
    exerciseType = 'word-marking',
    cefrLevel = 'A2',
    wordType = 'verb',
    quantity = 1
  } = options;

  try {
    // Inicializar servicio
    await aiServiceInstance.initialize();

    if (!aiServiceInstance.isConfigured()) {
      // Lanzar error descriptivo cuando no hay IA configurada
      logger.info('No AI provider configured', 'AIService');
      throw new Error('No hay proveedores de IA configurados. Ve a Configuración > IA para configurar OpenAI, Gemini, Claude o Grok.');
    }

    // Usar el prompt directamente (ya viene formateado desde WordMarkingExerciseCreator)
    const result = await aiServiceInstance.generateExercises({
      theme: 'ELE', // Español como Lengua Extranjera
      type: exerciseType,
      difficulty: cefrLevel,
      quantity,
      context: promptOrText
    });

    if (!result.success) {
      logger.error('AI generation failed:', 'AIService', result.error);
      return [];
    }

    // Parsear respuesta de la IA
    const rawResponse = result.data;

    // Si la respuesta es un string, crear ejercicio a partir del texto
    if (typeof rawResponse === 'string') {
      // Detectar si tiene marcadores de palabras (*)
      const hasMarkers = rawResponse.includes('*');

      if (hasMarkers && exerciseType === 'word-marking') {
        // Retornar el texto marcado para que sea parseado por el componente
        return [{
          type: 'word-marking',
          text: rawResponse,
          cefrLevel,
          wordType,
          aiGenerated: true
        }];
      }

      // Si no tiene marcadores, retornar texto plano
      return [{
        type: exerciseType,
        text: rawResponse,
        cefrLevel,
        aiGenerated: true
      }];
    }

    // Si la respuesta es un objeto/array, retornarla
    if (Array.isArray(rawResponse)) {
      return rawResponse.map(ex => ({
        ...ex,
        cefrLevel,
        aiGenerated: true
      }));
    }

    if (typeof rawResponse === 'object') {
      return [{
        ...rawResponse,
        cefrLevel,
        aiGenerated: true
      }];
    }

    return [];

  } catch (error) {
    logger.error('Error in generateExercisesFromText:', 'AIService', error);
    return [];
  }
}
