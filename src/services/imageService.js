/**
 * @fileoverview Image Generation Service
 * @module services/imageService
 *
 * Servicio para generar imágenes usando DALL-E y Stability AI
 */

import { getAIConfig, callAI } from '../firebase/aiConfig';
import { getProviderById } from '../constants/aiFunctions';

class ImageService {
  constructor() {
    this.config = null;
  }

  /**
   * Initialize service (load config from Firestore)
   */
  async initialize() {
    this.config = await getAIConfig();
    return this.config !== null;
  }

  /**
   * Check if a specific image provider is configured
   */
  isProviderConfigured(providerId) {
    if (!this.config || !this.config.functions) return false;

    const imageFunction = Object.values(this.config.functions).find(
      fn => fn.provider === providerId && fn.enabled
    );

    return imageFunction !== undefined;
  }

  /**
   * Get list of configured image providers
   */
  getConfiguredProviders() {
    const providers = ['dalle', 'stability'];
    return providers.map(providerId => ({
      id: providerId,
      configured: this.isProviderConfigured(providerId),
      provider: getProviderById(providerId)
    })).filter(p => p.provider);
  }

  /**
   * Generate image using DALL-E
   *
   * @param {Object} params
   * @param {string} params.prompt - Description of the image to generate
   * @param {string} params.size - Image size (1024x1024, 1024x1792, 1792x1024)
   * @param {string} params.quality - Image quality (standard, hd)
   * @param {number} params.n - Number of images to generate (1-10)
   * @param {string} params.functionId - AI function ID to use
   */
  async generateWithDALLE(params) {
    const {
      prompt,
      size = '1024x1024',
      quality = 'standard',
      n = 1,
      functionId = 'image_generator'
    } = params;

    if (!this.config || !this.config.functions || !this.config.functions[functionId]) {
      throw new Error('DALL-E no está configurado. Configura la función en Tareas IA.');
    }

    const functionConfig = this.config.functions[functionId];

    if (functionConfig.provider !== 'dalle') {
      throw new Error(`La función ${functionId} no está configurada para usar DALL-E`);
    }

    try {
      // Llamar a Cloud Function que manejará la llamada a DALL-E
      const response = await callAI('dalle', prompt, {
        ...functionConfig,
        parameters: {
          size,
          quality,
          n
        }
      });

      return {
        success: true,
        images: response.data || [],
        provider: 'dalle',
        model: functionConfig.model
      };
    } catch (error) {
      console.error('Error generating image with DALL-E:', error);
      return {
        success: false,
        error: error.message || 'Error al generar imagen con DALL-E'
      };
    }
  }

  /**
   * Generate image using Stability AI
   *
   * @param {Object} params
   * @param {string} params.prompt - Description of the image to generate
   * @param {string} params.negativePrompt - What to avoid in the image
   * @param {string} params.size - Image size
   * @param {number} params.steps - Number of diffusion steps (10-50)
   * @param {number} params.cfgScale - Prompt strength (0-35)
   * @param {string} params.functionId - AI function ID to use
   */
  async generateWithStability(params) {
    const {
      prompt,
      negativePrompt = '',
      size = '1024x1024',
      steps = 30,
      cfgScale = 7,
      functionId = 'illustration_creator'
    } = params;

    if (!this.config || !this.config.functions || !this.config.functions[functionId]) {
      throw new Error('Stability AI no está configurado. Configura la función en Tareas IA.');
    }

    const functionConfig = this.config.functions[functionId];

    if (functionConfig.provider !== 'stability') {
      throw new Error(`La función ${functionId} no está configurada para usar Stability AI`);
    }

    try {
      // Llamar a Cloud Function que manejará la llamada a Stability AI
      const response = await callAI('stability', prompt, {
        ...functionConfig,
        parameters: {
          size,
          steps,
          cfg_scale: cfgScale,
          negative_prompt: negativePrompt
        }
      });

      return {
        success: true,
        images: response.artifacts || [],
        provider: 'stability',
        model: functionConfig.model
      };
    } catch (error) {
      console.error('Error generating image with Stability:', error);
      return {
        success: false,
        error: error.message || 'Error al generar imagen con Stability AI'
      };
    }
  }

  /**
   * Generate image with automatic provider selection
   * Uses the first configured provider
   */
  async generateImage(params) {
    const { prompt, functionId } = params;

    if (!functionId) {
      throw new Error('Se requiere functionId para generar imágenes');
    }

    if (!this.config || !this.config.functions || !this.config.functions[functionId]) {
      throw new Error('Función de IA no configurada');
    }

    const functionConfig = this.config.functions[functionId];
    const provider = functionConfig.provider;

    if (provider === 'dalle') {
      return this.generateWithDALLE(params);
    } else if (provider === 'stability') {
      return this.generateWithStability(params);
    } else {
      throw new Error(`Proveedor ${provider} no soportado para generación de imágenes`);
    }
  }

  /**
   * Generate educational image for vocabulary
   */
  async generateVocabularyImage(word, level = 'A1', context = '') {
    const prompt = `Educational illustration for Spanish word "${word}" (CEFR level ${level}). ${context}. Clear, simple, colorful, appropriate for language learning. Cartoon style, friendly, no text in image.`;

    return this.generateImage({
      prompt,
      functionId: 'visual_vocabulary',
      size: '1024x1024',
      quality: 'hd'
    });
  }

  /**
   * Generate illustration for lesson content
   */
  async generateLessonIllustration(topic, description, style = 'friendly') {
    const prompt = `Educational illustration for Spanish lesson about "${topic}". ${description}. Style: ${style}, colorful, engaging, appropriate for all ages. No text in image.`;

    return this.generateImage({
      prompt,
      functionId: 'illustration_creator',
      size: '1024x1024',
      steps: 40
    });
  }

  /**
   * Generate multiple images for exercise
   */
  async generateExerciseImages(exerciseType, items, level = 'A1') {
    const results = [];

    for (const item of items) {
      try {
        const result = await this.generateVocabularyImage(item, level, `for ${exerciseType} exercise`);
        results.push({
          item,
          ...result
        });
      } catch (error) {
        results.push({
          item,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Test image generation with a simple prompt
   */
  async testGeneration(providerId) {
    const testPrompts = {
      dalle: 'A simple red apple on a white background, educational illustration style',
      stability: 'A colorful butterfly on a flower, cartoon style, educational illustration'
    };

    const functionId = providerId === 'dalle' ? 'image_generator' : 'illustration_creator';

    return this.generateImage({
      prompt: testPrompts[providerId],
      functionId,
      size: '1024x1024'
    });
  }
}

// Export singleton instance
export default new ImageService();
