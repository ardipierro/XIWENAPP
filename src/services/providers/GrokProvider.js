/**
 * GrokProvider - xAI Grok API implementation
 * Supports Grok-3, Grok-2
 * Compatible with OpenAI API format
 */

import BaseAIProvider from './BaseAIProvider.js';

class GrokProvider extends BaseAIProvider {
  constructor(apiKey, model = 'grok-2-latest') {
    super(apiKey, model);
    this.baseURL = 'https://api.x.ai/v1';
  }

  /**
   * Generate ESL exercises using Grok
   * @param {Object} params - Exercise generation parameters
   * @returns {Promise<{success: boolean, data?: string, error?: string}>}
   */
  async generateExercises(params) {
    try {
      if (!this.hasApiKey()) {
        return {
          success: false,
          error: 'Grok API key no configurada. Por favor, añade VITE_GROK_API_KEY a tu archivo .env'
        };
      }

      const prompt = this.buildPrompt(params);

      // Grok uses OpenAI-compatible format
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
          max_tokens: 2000,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Error de Grok: ${response.status} - ${errorData.error?.message || 'Error desconocido'}`
        };
      }

      const data = await response.json();
      const generatedText = data.choices?.[0]?.message?.content;

      if (!generatedText) {
        return {
          success: false,
          error: 'Grok no generó ningún contenido'
        };
      }

      return {
        success: true,
        data: generatedText.trim()
      };

    } catch (error) {
      console.error('GrokProvider error:', error);
      return {
        success: false,
        error: error.message || 'Error al conectar con Grok'
      };
    }
  }

  /**
   * Test Grok API connection
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

      // Grok doesn't have a /models endpoint, so we test with a minimal completion
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
              role: 'user',
              content: 'Test'
            }
          ],
          max_tokens: 5
        })
      });

      return {
        success: response.ok,
        error: response.ok ? null : 'Error de autenticación con Grok'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default GrokProvider;
