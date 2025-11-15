/**
 * AIService - Simplified AI service using Firestore aiConfig
 * Integrates with existing aiConfig.js module
 */

import { getAIConfig, callAI } from '../firebase/aiConfig';
import logger from '../utils/logger';


// AI Provider metadata
const AI_PROVIDERS = [
  { id: 'openai', name: 'openai', label: 'ChatGPT', icon: '🤖', model: 'gpt-4' },
  { id: 'grok', name: 'grok', label: 'Grok', icon: '⚡', model: 'grok-2' },
  { id: 'gemini', name: 'gemini', label: 'Google Gemini', icon: '🔮', model: 'gemini-1.5-pro' },
  { id: 'claude', name: 'claude', label: 'Claude', icon: '💬', model: 'claude-3-sonnet' },
  { id: 'elevenlabs', name: 'elevenlabs', label: 'ElevenLabs TTS', icon: '🎤', model: 'eleven_multilingual_v2' }
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
    this.config = await getAIConfig();

    // Find first enabled provider
    for (const provider of AI_PROVIDERS) {
      if (this.config[provider.id]?.enabled && this.config[provider.id]?.apiKey) {
        this.currentProvider = provider.id;
        break;
      }
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
    return this.currentProvider !== null &&
           this.config[this.currentProvider]?.enabled &&
           !!this.config[this.currentProvider]?.apiKey;
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
      logger.error('AIService error:', error);
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
export default new AIService();
