/**
 * AIService - Simplified AI service using Firestore aiConfig
 * Integrates with existing aiConfig.js module
 */

import { getAIConfig, callAI } from '../firebase/aiConfig';

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
      console.error('AIService error:', error);
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
 * Generate exercises from source text
 * Función exportable para compatibilidad con AIExerciseGenerator
 *
 * @param {string} sourceText - Texto fuente para generar ejercicios
 * @param {Object} options - Opciones de generación
 * @param {string} options.exerciseType - Tipo de ejercicio (mcq, blank, truefalse, cloze)
 * @param {number} options.quantity - Cantidad de ejercicios a generar
 * @param {string} options.cefrLevel - Nivel CEFR (A1, A2, B1, B2, C1, C2)
 * @returns {Promise<Array>} Array de ejercicios generados
 */
export async function generateExercisesFromText(sourceText, options = {}) {
  const {
    exerciseType = 'mcq',
    quantity = 3,
    cefrLevel = 'A2'
  } = options;

  try {
    // Intentar usar IA si está configurada
    await aiServiceInstance.initialize();

    if (aiServiceInstance.isConfigured()) {
      // Usar proveedor de IA configurado
      const result = await aiServiceInstance.generateExercises({
        theme: 'Español ELE',
        context: sourceText,
        type: exerciseType,
        difficulty: cefrLevel,
        quantity: quantity
      });

      if (result.success) {
        // Parsear respuesta de IA y convertir a formato de ejercicio
        return parseAIResponseToExercises(result.data, exerciseType, quantity);
      } else {
        console.warn('AI generation failed, using fallback:', result.error);
        // Si falla IA, usar fallback
        return generateFallbackExercises(sourceText, options);
      }
    } else {
      // No hay IA configurada, usar generación basada en reglas
      console.info('No AI configured, using rule-based generation');
      return generateFallbackExercises(sourceText, options);
    }
  } catch (error) {
    console.error('Error in generateExercisesFromText:', error);
    // En caso de error, usar fallback
    return generateFallbackExercises(sourceText, options);
  }
}

/**
 * Parsear respuesta de IA a formato de ejercicios
 * @private
 */
function parseAIResponseToExercises(aiResponse, exerciseType, quantity) {
  try {
    // La respuesta de IA puede venir en diferentes formatos
    // Intentar parsear JSON si es posible
    let parsed;
    if (typeof aiResponse === 'string') {
      // Intentar extraer JSON de la respuesta
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        // Si no hay JSON, parsear como texto
        return parseAITextResponse(aiResponse, exerciseType, quantity);
      }
    } else {
      parsed = aiResponse;
    }

    // Convertir a formato estándar
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return [];
  }
}

/**
 * Parsear respuesta de texto de IA
 * @private
 */
function parseAITextResponse(text, exerciseType, quantity) {
  const exercises = [];
  const lines = text.split('\n').filter(l => l.trim());

  // Implementación simple para MCQ
  if (exerciseType === 'mcq') {
    let currentExercise = null;
    for (const line of lines) {
      if (line.toLowerCase().includes('question:') || line.toLowerCase().includes('pregunta:')) {
        if (currentExercise) exercises.push(currentExercise);
        currentExercise = {
          type: 'mcq',
          question: line.split(':')[1]?.trim() || line,
          options: [],
          correctAnswer: null
        };
      } else if (line.toLowerCase().includes('options:') || line.toLowerCase().includes('opciones:')) {
        const optionsText = line.split(':')[1]?.trim() || '';
        const options = optionsText.split('|').map(opt => opt.trim());
        if (currentExercise) {
          currentExercise.options = options.map((opt, i) => ({
            value: `option${i}`,
            label: opt.replace('*', '').trim()
          }));
          // La opción con * es la correcta
          const correctIndex = options.findIndex(opt => opt.includes('*'));
          if (correctIndex >= 0) {
            currentExercise.correctAnswer = `option${correctIndex}`;
          }
        }
      }
    }
    if (currentExercise) exercises.push(currentExercise);
  }

  return exercises.slice(0, quantity);
}

/**
 * Generar ejercicios basados en reglas cuando no hay IA configurada
 * @private
 */
function generateFallbackExercises(sourceText, options) {
  const {
    exerciseType = 'mcq',
    quantity = 3,
    cefrLevel = 'A2'
  } = options;

  const exercises = [];

  // Dividir texto en oraciones
  const sentences = sourceText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10)
    .slice(0, quantity * 2); // Obtener más oraciones de las necesarias

  if (sentences.length === 0) {
    return [{
      type: exerciseType,
      question: '¿Qué significa esta palabra?',
      options: [
        { value: 'option0', label: 'Opción A' },
        { value: 'option1', label: 'Opción B' },
        { value: 'option2', label: 'Opción C' }
      ],
      correctAnswer: 'option0',
      explanation: 'Ejercicio de ejemplo. Pega texto con contenido para generar ejercicios reales.',
      cefrLevel: cefrLevel
    }];
  }

  switch (exerciseType) {
    case 'mcq':
      // Generar preguntas de comprensión sobre las oraciones
      for (let i = 0; i < Math.min(quantity, sentences.length); i++) {
        const sentence = sentences[i];
        const words = sentence.split(' ').filter(w => w.length > 4);
        const targetWord = words[Math.floor(Math.random() * words.length)] || 'palabra';

        exercises.push({
          type: 'mcq',
          question: `Según el texto: "${sentence.substring(0, 50)}..." ¿Qué palabra aparece?`,
          options: [
            { value: 'option0', label: targetWord },
            { value: 'option1', label: 'otra palabra' },
            { value: 'option2', label: 'ninguna' }
          ],
          correctAnswer: 'option0',
          explanation: `La palabra "${targetWord}" aparece en el texto.`,
          cefrLevel: cefrLevel
        });
      }
      break;

    case 'blank':
      // Generar ejercicios de completar espacios
      for (let i = 0; i < Math.min(quantity, sentences.length); i++) {
        const sentence = sentences[i];
        const words = sentence.split(' ').filter(w => w.length > 3);
        if (words.length > 2) {
          const targetIndex = Math.floor(words.length / 2);
          const targetWord = words[targetIndex];
          const sentenceWithBlank = sentence.replace(targetWord, '___');

          exercises.push({
            type: 'blank',
            sentence: sentenceWithBlank,
            correctAnswer: targetWord,
            explanation: `La palabra correcta es "${targetWord}".`,
            cefrLevel: cefrLevel
          });
        }
      }
      break;

    case 'truefalse':
      // Generar afirmaciones verdadero/falso
      for (let i = 0; i < Math.min(quantity, sentences.length); i++) {
        const sentence = sentences[i];
        const isTrue = i % 2 === 0;

        exercises.push({
          type: 'truefalse',
          statement: isTrue ? sentence : `${sentence} (modificado)`,
          correctAnswer: isTrue,
          explanation: isTrue
            ? 'Esta afirmación está en el texto original.'
            : 'Esta afirmación NO está exactamente así en el texto.',
          cefrLevel: cefrLevel
        });
      }
      break;

    case 'cloze':
      // Generar cloze test
      if (sentences.length > 0) {
        const sentence = sentences[0];
        const words = sentence.split(' ');
        const blanks = [];
        const answers = [];

        // Remover cada 3ra palabra
        for (let i = 1; i < words.length; i += 3) {
          if (words[i].length > 3) {
            answers.push(words[i]);
            blanks.push(i);
          }
        }

        const textWithBlanks = words.map((word, i) =>
          blanks.includes(i) ? '[___]' : word
        ).join(' ');

        exercises.push({
          type: 'cloze',
          text: textWithBlanks,
          correctAnswers: answers,
          wordBank: [...answers, 'otra', 'palabra', 'más'],
          explanation: 'Completa el texto con las palabras correctas.',
          cefrLevel: cefrLevel
        });
      }
      break;

    default:
      // Para tipos no soportados, generar MCQ básico
      exercises.push({
        type: exerciseType,
        question: `Comprensión del texto: "${sentences[0]?.substring(0, 50)}..."`,
        note: `Tipo "${exerciseType}" requiere generación con IA. Mostrando ejercicio básico.`,
        cefrLevel: cefrLevel
      });
  }

  return exercises;
}
