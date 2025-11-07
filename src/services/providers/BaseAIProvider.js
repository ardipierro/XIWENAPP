/**
 * BaseAIProvider - Abstract base class for AI providers
 * All AI provider implementations should extend this class
 */

class BaseAIProvider {
  constructor(apiKey, model) {
    if (this.constructor === BaseAIProvider) {
      throw new Error('BaseAIProvider is abstract and cannot be instantiated directly');
    }

    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Build the ESL exercise generation prompt
   * @param {Object} params - Exercise parameters
   * @returns {string} - Formatted prompt
   */
  buildPrompt(params) {
    const { theme, subtheme, type, difficulty, quantity, context } = params;

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

    return prompt;
  }

  /**
   * Generate ESL exercises
   * @param {Object} params - Exercise generation parameters
   * @returns {Promise<{success: boolean, data?: string, error?: string}>}
   */
  async generateExercises(params) {
    throw new Error('generateExercises() must be implemented by subclass');
  }

  /**
   * Test API connection
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async testConnection() {
    throw new Error('testConnection() must be implemented by subclass');
  }

  /**
   * Check if API key is configured
   * @returns {boolean}
   */
  hasApiKey() {
    return !!this.apiKey && this.apiKey !== 'your-api-key-here';
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getProviderName() {
    return this.constructor.name.replace('Provider', '');
  }
}

export default BaseAIProvider;
