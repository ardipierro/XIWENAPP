/**
 * AIService - Multi-provider AI service for exercise generation
 * Supports: OpenAI, Google Gemini, xAI Grok, Anthropic Claude
 * Uses factory pattern for provider selection
 */

import OpenAIProvider from './providers/OpenAIProvider.js';
import GeminiProvider from './providers/GeminiProvider.js';
import GrokProvider from './providers/GrokProvider.js';
import ClaudeProvider from './providers/ClaudeProvider.js';
import logger from '../utils/logger';

class AIService {
  constructor() {
    this.currentProviderName = null;
    this.provider = null;
    this._initDefaultProvider();
  }

  /**
   * Initialize default provider from environment
   * @private
   */
  _initDefaultProvider() {
    const defaultProvider = import.meta.env.VITE_AI_PROVIDER || 'openai';
    this.setProvider(defaultProvider);
  }

  /**
   * Get API key for a provider (checks localStorage first, then .env)
   * @private
   * @param {string} providerName - Provider name
   * @param {string} envKey - Environment variable API key
   * @returns {string} API key
   */
  _getApiKey(providerName, envKey) {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem(`ai_credentials_${providerName}`);
      if (storedKey) {
        return storedKey;
      }
    }
    return envKey;
  }

  /**
   * Create a provider instance
   * @private
   * @param {string} providerName - Provider name (openai, gemini, grok, claude)
   * @returns {BaseAIProvider} Provider instance
   */
  _createProvider(providerName) {
    switch (providerName.toLowerCase()) {
      case 'gemini':
        return new GeminiProvider(
          this._getApiKey('gemini', import.meta.env.VITE_GEMINI_API_KEY),
          import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash-exp'
        );

      case 'grok':
        return new GrokProvider(
          this._getApiKey('grok', import.meta.env.VITE_GROK_API_KEY),
          import.meta.env.VITE_GROK_MODEL || 'grok-2-latest'
        );

      case 'claude':
        return new ClaudeProvider(
          this._getApiKey('claude', import.meta.env.VITE_CLAUDE_API_KEY),
          import.meta.env.VITE_CLAUDE_MODEL || 'claude-sonnet-4-5'
        );

      case 'openai':
      default:
        return new OpenAIProvider(
          this._getApiKey('openai', import.meta.env.VITE_OPENAI_API_KEY),
          import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'
        );
    }
  }

  /**
   * Set the active AI provider
   * @param {string} providerName - Provider name (openai, gemini, grok, claude)
   */
  setProvider(providerName) {
    this.currentProviderName = providerName.toLowerCase();
    this.provider = this._createProvider(this.currentProviderName);
    logger.info(`AIService: Switched to ${this.provider.getProviderName()} provider`);
  }

  /**
   * Get current provider name
   * @returns {string}
   */
  getCurrentProvider() {
    return this.currentProviderName;
  }

  /**
   * Get current provider instance
   * @returns {BaseAIProvider}
   */
  getProvider() {
    return this.provider;
  }

  /**
   * Get list of available providers with their configuration status
   * @returns {Array<{name: string, label: string, configured: boolean, model: string}>}
   */
  getAvailableProviders() {
    const providers = [
      {
        name: 'openai',
        label: 'OpenAI (ChatGPT)',
        icon: '🤖',
        model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
        apiKey: import.meta.env.VITE_OPENAI_API_KEY
      },
      {
        name: 'gemini',
        label: 'Google Gemini',
        icon: '✨',
        model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash-exp',
        apiKey: import.meta.env.VITE_GEMINI_API_KEY
      },
      {
        name: 'grok',
        label: 'xAI Grok',
        icon: '🚀',
        model: import.meta.env.VITE_GROK_MODEL || 'grok-2-latest',
        apiKey: import.meta.env.VITE_GROK_API_KEY
      },
      {
        name: 'claude',
        label: 'Anthropic Claude',
        icon: '🧠',
        model: import.meta.env.VITE_CLAUDE_MODEL || 'claude-sonnet-4-5',
        apiKey: import.meta.env.VITE_CLAUDE_API_KEY
      }
    ];

    return providers.map(p => {
      // Check localStorage first, then .env
      const storedKey = typeof window !== 'undefined' ? localStorage.getItem(`ai_credentials_${p.name}`) : null;
      const apiKey = storedKey || p.apiKey;

      return {
        name: p.name,
        label: p.label,
        icon: p.icon,
        model: p.model,
        configured: !!(apiKey && apiKey !== 'your-api-key-here' && apiKey !== 'your-key-here')
      };
    });
  }

  /**
   * Check if current provider is configured
   * @returns {boolean}
   */
  isConfigured() {
    return this.provider && this.provider.hasApiKey();
  }

  /**
   * Generate ESL exercises using current provider
   * @param {Object} params - Exercise generation parameters
   * @param {string} params.theme - Main theme (gramática, vocabulario, pronunciación)
   * @param {string} params.subtheme - Subtheme (verbos, adjetivos, preguntas)
   * @param {string} params.type - Exercise type (gap-fill, drag-to-match, listening)
   * @param {string} params.difficulty - CEFR level (A1, A2, B1, B2, C1, C2)
   * @param {number} params.quantity - Number of exercises (1-10)
   * @param {string} params.context - Optional context (e.g., "usa animales cotidianos")
   * @returns {Promise<{success: boolean, data?: string, error?: string, provider?: string}>}
   */
  async generateExercises(params) {
    if (!this.provider) {
      return {
        success: false,
        error: 'No hay proveedor de IA configurado'
      };
    }

    const result = await this.provider.generateExercises(params);

    // Add provider info to result
    return {
      ...result,
      provider: this.currentProviderName
    };
  }

  /**
   * Test current provider API connection
   * @returns {Promise<{success: boolean, error?: string, provider?: string}>}
   */
  async testConnection() {
    if (!this.provider) {
      return {
        success: false,
        error: 'No hay proveedor de IA configurado'
      };
    }

    const result = await this.provider.testConnection();

    return {
      ...result,
      provider: this.currentProviderName
    };
  }

  /**
   * Test all providers and return their status
   * @returns {Promise<Array<{provider: string, success: boolean, error?: string}>>}
   */
  async testAllProviders() {
    const providers = ['openai', 'gemini', 'grok', 'claude'];
    const results = [];

    for (const providerName of providers) {
      const originalProvider = this.currentProviderName;

      try {
        this.setProvider(providerName);
        const result = await this.testConnection();
        results.push({
          provider: providerName,
          ...result
        });
      } catch (error) {
        results.push({
          provider: providerName,
          success: false,
          error: error.message
        });
      }

      // Restore original provider
      this.setProvider(originalProvider);
    }

    return results;
  }
}

// Export singleton instance
export default new AIService();
