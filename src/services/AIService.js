/**
 * AIService - OpenAI integration for exercise generation
 * Handles communication with OpenAI API for ESL exercise creation
 */

class AIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    this.model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';
  }

  /**
   * Generate ESL exercises using OpenAI
   * @param {Object} params - Exercise generation parameters
   * @param {string} params.theme - Main theme (gramática, vocabulario, pronunciación)
   * @param {string} params.subtheme - Subtheme (verbos, adjetivos, preguntas)
   * @param {string} params.type - Exercise type (gap-fill, drag-to-match, listening)
   * @param {string} params.difficulty - CEFR level (A1, A2, B1, B2, C1, C2)
   * @param {number} params.quantity - Number of exercises (1-10)
   * @param {string} params.context - Optional context (e.g., "usa animales cotidianos")
   * @returns {Promise<{success: boolean, data?: string, error?: string}>}
   */
  async generateExercises(params) {
    const { theme, subtheme, type, difficulty, quantity, context } = params;

    // Build the prompt
    let prompt = `Genera ${quantity} ejercicio${quantity > 1 ? 's' : ''} de ${type} sobre ${subtheme} (tema: ${theme}) para estudiantes de español, nivel ${difficulty}.`;

    if (context && context.trim()) {
      prompt += ` ${context}.`;
    }

    prompt += `

FORMATO OBLIGATORIO (usa EXACTAMENTE estos marcadores):

Para gap-fill (rellenar espacios):
- Usa [___] para espacios en blanco
- Después de cada ejercicio, indica la respuesta correcta con =respuesta=
Ejemplo:
El gato [___] en el sofá.
=duerme=

Para multiple-choice (opción múltiple):
- Escribe la pregunta
- Opciones con --A--, --B--, --C--, --D--
- Marca la correcta con ** antes y después, ejemplo: **--A--**
Ejemplo:
¿Cuál es el verbo correcto?
--A-- como
**--B-- comer**
--C-- comiendo
--D-- comí

Para drag-to-match (arrastrar y emparejar):
- Usa <drag>palabra</drag> para elementos arrastrables
- Usa <drop>respuesta_correcta</drop> para zonas de destino
- Pon las opciones y destinos en líneas separadas
Ejemplo:
Empareja cada animal con su sonido:
<drag>perro</drag> <drag>gato</drag> <drag>vaca</drag>
<drop>guau</drop> <drop>miau</drop> <drop>muu</drop>

Para listening (comprensión auditiva):
- Texto entre <audio>texto_para_leer</audio>
- Preguntas de comprensión después con --A--, --B--, etc.
- Marca respuesta correcta con **
Ejemplo:
<audio>María va al mercado cada domingo por la mañana.</audio>
¿Cuándo va María al mercado?
**--A-- Los domingos**
--B-- Los lunes
--C-- Cada tarde
--D-- Nunca

IMPORTANTE:
- Usa SOLO los marcadores especificados
- Separa cada ejercicio con una línea en blanco
- Nivel ${difficulty} apropiado
- Contenido 100% en español
- Si hay contexto específico, úsalo
- No agregues explicaciones extra, solo los ejercicios`;

    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'API key no configurada. Por favor, añade VITE_OPENAI_API_KEY a tu archivo .env'
        };
      }

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
          error: `Error de API: ${response.status} - ${errorData.error?.message || 'Error desconocido'}`
        };
      }

      const data = await response.json();
      const generatedText = data.choices?.[0]?.message?.content;

      if (!generatedText) {
        return {
          success: false,
          error: 'La IA no generó ningún contenido'
        };
      }

      return {
        success: true,
        data: generatedText.trim()
      };

    } catch (error) {
      console.error('AIService error:', error);
      return {
        success: false,
        error: error.message || 'Error al conectar con la IA'
      };
    }
  }

  /**
   * Test API connection
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async testConnection() {
    try {
      if (!this.apiKey) {
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

// Export singleton instance
export default new AIService();
