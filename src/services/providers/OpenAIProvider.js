/**
 * OpenAIProvider - OpenAI API implementation
 * Supports GPT-4o, GPT-4o-mini, GPT-3.5-turbo
 */

import BaseAIProvider from './BaseAIProvider.js';
import logger from '../../utils/logger';

class OpenAIProvider extends BaseAIProvider {
  constructor(apiKey, model = 'gpt-4o-mini') {
    super(apiKey, model);
    this.baseURL = 'https://api.openai.com/v1';
  }

  /**
   * Generate ESL exercises using OpenAI
   * @param {Object} params - Exercise generation parameters
   * @returns {Promise<{success: boolean, data?: string, error?: string}>}
   */
  async generateExercises(params) {
    try {
      if (!this.hasApiKey()) {
        return {
          success: false,
          error: 'OpenAI API key no configurada. Por favor, añade VITE_OPENAI_API_KEY a tu archivo .env'
        };
      }

      const prompt = this.buildPrompt(params);

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Eres un experto profesor de español como lengua extranjera (ESL/ELE). Generas ejercicios educativos de alta calidad siguiendo formatos específicos.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Error de OpenAI: ${response.status} - ${errorData.error?.message || 'Error desconocido'}`
        };
      }

      const data = await response.json();
      const generatedText = data.choices?.[0]?.message?.content;

      if (!generatedText) {
        return {
          success: false,
          error: 'OpenAI no generó ningún contenido'
        };
      }

      return {
        success: true,
        data: generatedText.trim()
      };

    } catch (error) {
      logger.error('OpenAIProvider error:', error);
      return {
        success: false,
        error: error.message || 'Error al conectar con OpenAI'
      };
    }
  }

  /**
   * Test OpenAI API connection
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

      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return {
        success: response.ok,
        error: response.ok ? null : 'Error de autenticación con OpenAI'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default OpenAIProvider;
