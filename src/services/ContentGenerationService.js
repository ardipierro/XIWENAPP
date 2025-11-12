/**
 * @fileoverview Content Generation Service - Generates educational content with AI
 * @module services/ContentGenerationService
 */

import { callAI } from '../firebase/aiConfig';
import logger from '../utils/logger';

class ContentGenerationService {
  /**
   * Generate exercises with AI
   * @param {Object} params - Generation parameters
   * @param {string} params.topic - Topic of exercises
   * @param {string} params.difficulty - Difficulty level
   * @param {number} params.quantity - Number of exercises
   * @param {string} params.type - Exercise type
   * @returns {Promise<Object>} Generated exercises
   */
  async generateExercises(params) {
    try {
      logger.info('Generating exercises', 'ContentGenerationService', params);

      const {
        topic = 'vocabulario básico',
        difficulty = 'beginner',
        quantity = 5,
        type = 'multiple-choice'
      } = params;

      // Build prompt based on exercise type
      const prompt = this._buildExercisePrompt(topic, difficulty, quantity, type);

      // Get AI config
      const { getAIConfig } = await import('../firebase/aiConfig');
      const config = await getAIConfig();

      // Find first enabled provider
      let provider = null;
      const providers = ['claude', 'openai', 'gemini', 'grok'];
      for (const p of providers) {
        if (config[p]?.enabled && config[p]?.apiKey) {
          provider = p;
          break;
        }
      }

      if (!provider) {
        throw new Error('No hay proveedor de IA configurado');
      }

      // Generate exercises
      const response = await callAI(provider, prompt, config[provider]);

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se pudo extraer JSON de la respuesta de IA');
      }

      const exercises = JSON.parse(jsonMatch[0]);

      logger.info('Exercises generated successfully', 'ContentGenerationService', {
        count: exercises.exercises?.length || 0
      });

      return {
        success: true,
        exercises: exercises.exercises || [],
        metadata: {
          topic,
          difficulty,
          type,
          generatedAt: new Date().toISOString(),
          provider
        }
      };

    } catch (error) {
      logger.error('Error generating exercises', 'ContentGenerationService', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate lesson content with AI
   * @param {Object} params - Generation parameters
   * @param {string} params.topic - Topic of lesson
   * @param {string} params.difficulty - Difficulty level
   * @param {string} params.focus - Focus area (grammar, vocabulary, etc.)
   * @returns {Promise<Object>} Generated lesson
   */
  async generateLesson(params) {
    try {
      logger.info('Generating lesson', 'ContentGenerationService', params);

      const {
        topic = 'introducción',
        difficulty = 'beginner',
        focus = 'vocabulario y gramática'
      } = params;

      const prompt = `Crea una lección de chino mandarín en español.

Tema: ${topic}
Nivel: ${difficulty}
Enfoque: ${focus}

La lección debe incluir:
1. Introducción breve al tema
2. 5-7 palabras o frases clave en chino con pinyin y traducción
3. 2-3 puntos gramaticales importantes
4. Ejemplos de uso en oraciones
5. Consejos culturales relevantes

Responde en JSON con esta estructura:
{
  "title": "Título de la lección",
  "introduction": "Introducción al tema",
  "vocabulary": [
    {
      "chinese": "汉字",
      "pinyin": "hànzì",
      "spanish": "caracteres chinos",
      "example": "Ejemplo de uso en oración"
    }
  ],
  "grammar": [
    {
      "point": "Punto gramatical",
      "explanation": "Explicación detallada",
      "examples": ["Ejemplo 1", "Ejemplo 2"]
    }
  ],
  "culturalNotes": ["Nota cultural 1", "Nota cultural 2"]
}`;

      const { getAIConfig } = await import('../firebase/aiConfig');
      const config = await getAIConfig();

      let provider = null;
      const providers = ['claude', 'openai', 'gemini', 'grok'];
      for (const p of providers) {
        if (config[p]?.enabled && config[p]?.apiKey) {
          provider = p;
          break;
        }
      }

      if (!provider) {
        throw new Error('No hay proveedor de IA configurado');
      }

      const response = await callAI(provider, prompt, config[provider]);
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No se pudo extraer JSON de la respuesta de IA');
      }

      const lesson = JSON.parse(jsonMatch[0]);

      logger.info('Lesson generated successfully', 'ContentGenerationService');

      return {
        success: true,
        lesson,
        metadata: {
          topic,
          difficulty,
          focus,
          generatedAt: new Date().toISOString(),
          provider
        }
      };

    } catch (error) {
      logger.error('Error generating lesson', 'ContentGenerationService', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build exercise generation prompt
   * @param {string} topic - Topic
   * @param {string} difficulty - Difficulty level
   * @param {number} quantity - Number of exercises
   * @param {string} type - Exercise type
   * @returns {string} Prompt
   */
  _buildExercisePrompt(topic, difficulty, quantity, type) {
    const difficultyMap = {
      beginner: 'principiante (HSK 1-2)',
      intermediate: 'intermedio (HSK 3-4)',
      advanced: 'avanzado (HSK 5-6)'
    };

    const difficultyDesc = difficultyMap[difficulty] || difficulty;

    if (type === 'multiple-choice' || type === 'mcq') {
      return `Crea ${quantity} ejercicios de opción múltiple sobre ${topic} en chino mandarín.

Nivel: ${difficultyDesc}

Cada ejercicio debe tener:
- Una pregunta en español
- 4 opciones de respuesta
- Una opción correcta
- Una explicación breve

Responde en JSON:
{
  "exercises": [
    {
      "question": "¿Cómo se dice 'hola' en chino?",
      "options": ["你好", "再见", "谢谢", "对不起"],
      "correctAnswer": 0,
      "explanation": "你好 (nǐ hǎo) es el saludo más común"
    }
  ]
}`;
    }

    if (type === 'fill-in-blank' || type === 'blank') {
      return `Crea ${quantity} ejercicios de completar espacios sobre ${topic} en chino mandarín.

Nivel: ${difficultyDesc}

Cada ejercicio debe tener:
- Una oración en chino con un espacio en blanco (usa _____)
- La respuesta correcta
- Una pista opcional
- Una explicación

Responde en JSON:
{
  "exercises": [
    {
      "sentence": "我 _____ 学生。",
      "answer": "是",
      "hint": "Verbo ser/estar en chino",
      "explanation": "是 (shì) significa 'ser/estar'"
    }
  ]
}`;
    }

    if (type === 'matching' || type === 'match') {
      return `Crea ${quantity} pares para emparejar sobre ${topic} en chino mandarín.

Nivel: ${difficultyDesc}

Responde en JSON:
{
  "exercises": [
    {
      "pairs": [
        {"left": "你好", "right": "Hola"},
        {"left": "谢谢", "right": "Gracias"},
        {"left": "再见", "right": "Adiós"}
      ],
      "explanation": "Saludos y despedidas básicas en chino"
    }
  ]
}`;
    }

    // Default: true/false
    return `Crea ${quantity} ejercicios de verdadero/falso sobre ${topic} en chino mandarín.

Nivel: ${difficultyDesc}

Responde en JSON:
{
  "exercises": [
    {
      "statement": "El carácter 好 significa 'bueno'",
      "answer": true,
      "explanation": "好 (hǎo) significa 'bueno' o 'bien'"
    }
  ]
}`;
  }

  /**
   * Generate vocabulary list
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} Generated vocabulary
   */
  async generateVocabulary(params) {
    try {
      logger.info('Generating vocabulary', 'ContentGenerationService', params);

      const {
        topic = 'vocabulario básico',
        difficulty = 'beginner',
        quantity = 10
      } = params;

      const prompt = `Crea una lista de ${quantity} palabras/frases de vocabulario en chino mandarín sobre ${topic}.

Nivel: ${difficulty}

Para cada palabra incluye:
- Caracteres chinos
- Pinyin
- Traducción al español
- Ejemplo de uso en una oración
- Nivel HSK aproximado

Responde en JSON:
{
  "vocabulary": [
    {
      "chinese": "你好",
      "pinyin": "nǐ hǎo",
      "spanish": "hola",
      "example": "你好，我是王老师。(Hola, soy el profesor Wang)",
      "hskLevel": "HSK1"
    }
  ]
}`;

      const { getAIConfig } = await import('../firebase/aiConfig');
      const config = await getAIConfig();

      let provider = null;
      const providers = ['claude', 'openai', 'gemini', 'grok'];
      for (const p of providers) {
        if (config[p]?.enabled && config[p]?.apiKey) {
          provider = p;
          break;
        }
      }

      if (!provider) {
        throw new Error('No hay proveedor de IA configurado');
      }

      const response = await callAI(provider, prompt, config[provider]);
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No se pudo extraer JSON de la respuesta de IA');
      }

      const vocabulary = JSON.parse(jsonMatch[0]);

      logger.info('Vocabulary generated successfully', 'ContentGenerationService', {
        count: vocabulary.vocabulary?.length || 0
      });

      return {
        success: true,
        vocabulary: vocabulary.vocabulary || [],
        metadata: {
          topic,
          difficulty,
          quantity,
          generatedAt: new Date().toISOString(),
          provider
        }
      };

    } catch (error) {
      logger.error('Error generating vocabulary', 'ContentGenerationService', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new ContentGenerationService();
