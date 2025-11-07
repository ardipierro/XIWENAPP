/**
 * ClaudeProvider - Anthropic Claude API implementation
 * Supports Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
 */

import BaseAIProvider from './BaseAIProvider.js';
import logger from '../../utils/logger';

class ClaudeProvider extends BaseAIProvider {
  constructor(apiKey, model = 'claude-3-5-sonnet-20241022') {
    super(apiKey, model);
    this.baseURL = 'https://api.anthropic.com/v1';
    this.apiVersion = '2023-06-01';
  }

  /**
   * Generate ESL exercises using Anthropic Claude
   * @param {Object} params - Exercise generation parameters
   * @returns {Promise<{success: boolean, data?: string, error?: string}>}
   */
  async generateExercises(params) {
    try {
      if (!this.hasApiKey()) {
        return {
          success: false,
          error: 'Claude API key no configurada. Por favor, añade VITE_CLAUDE_API_KEY a tu archivo .env'
        };
      }

      const prompt = this.buildPrompt(params);

      // Claude uses Messages API format
      const requestBody = {
        model: this.model,
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: `Eres un experto profesor de español como lengua extranjera (ESL/ELE). Generas ejercicios educativos de alta calidad siguiendo formatos específicos.\n\n${prompt}`
          }
        ]
      };

      const response = await fetch(
        `${this.baseURL}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': this.apiVersion
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Error de Claude: ${response.status} - ${errorData.error?.message || 'Error desconocido'}`
        };
      }

      const data = await response.json();

      // Claude response structure
      const generatedText = data.content?.[0]?.text;

      if (!generatedText) {
        return {
          success: false,
          error: 'Claude no generó ningún contenido'
        };
      }

      return {
        success: true,
        data: generatedText.trim()
      };

    } catch (error) {
      logger.error('ClaudeProvider error:', error);
      return {
        success: false,
        error: error.message || 'Error al conectar con Claude'
      };
    }
  }

  /**
   * Test Claude API connection
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async testConnection() {
    try {
      if (!this.hasApiKey()) {
        return {
          success: false,
          error: 'API key no configurada'
        };
      }

      // Test with a minimal request
      const response = await fetch(
        `${this.baseURL}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': this.apiVersion
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: 10,
            messages: [
              {
                role: 'user',
                content: 'Test'
              }
            ]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || 'Error de autenticación con Claude'
        };
      }

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default ClaudeProvider;
