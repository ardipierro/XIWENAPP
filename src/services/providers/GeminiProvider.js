/**
 * GeminiProvider - Google Gemini API implementation
 * Supports Gemini 2.0 Flash, Gemini Pro
 */

import BaseAIProvider from './BaseAIProvider.js';

class GeminiProvider extends BaseAIProvider {
  constructor(apiKey, model = 'gemini-2.0-flash-exp') {
    super(apiKey, model);
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * Generate ESL exercises using Google Gemini
   * @param {Object} params - Exercise generation parameters
   * @returns {Promise<{success: boolean, data?: string, error?: string}>}
   */
  async generateExercises(params) {
    try {
      if (!this.hasApiKey()) {
        return {
          success: false,
          error: 'Gemini API key no configurada. Por favor, añade VITE_GEMINI_API_KEY a tu archivo .env'
        };
      }

      const prompt = this.buildPrompt(params);

      // Gemini uses a different request format
      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Eres un experto profesor de español como lengua extranjera (ESL/ELE). Generas ejercicios educativos de alta calidad siguiendo formatos específicos.\n\n${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
          topP: 0.95,
          topK: 40
        }
      };

      const response = await fetch(
        `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Error de Gemini: ${response.status} - ${errorData.error?.message || 'Error desconocido'}`
        };
      }

      const data = await response.json();

      // Gemini response structure is different
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        return {
          success: false,
          error: 'Gemini no generó ningún contenido'
        };
      }

      return {
        success: true,
        data: generatedText.trim()
      };

    } catch (error) {
      console.error('GeminiProvider error:', error);
      return {
        success: false,
        error: error.message || 'Error al conectar con Gemini'
      };
    }
  }

  /**
   * Test Gemini API connection
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

      // Test with a simple request
      const response = await fetch(
        `${this.baseURL}/models?key=${this.apiKey}`,
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: 'Error de autenticación con Gemini'
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

export default GeminiProvider;
