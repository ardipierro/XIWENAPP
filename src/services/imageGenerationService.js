/**
 * @fileoverview Servicio de generación de imágenes con IA
 * @module services/imageGenerationService
 *
 * Refactored to use centralized CredentialsService
 */

import logger from '../utils/logger';
import credentialsService, { CREDENTIALS_CHANGED_EVENT } from './CredentialsService';

class ImageGenerationService {
  constructor() {
    this.openaiApiKey = null;
    this.stabilityApiKey = null;
    this.hasOpenAI = false;
    this.hasStability = false;
    this._initialized = false;

    // Listen for credential changes
    this._setupCredentialListener();
  }

  /**
   * Setup listener for credential changes
   */
  _setupCredentialListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener(CREDENTIALS_CHANGED_EVENT, () => {
        logger.info('Credentials changed, reloading API keys', 'ImageGenerationService');
        this.loadApiKeys();
      });
    }
  }

  /**
   * Ensure API keys are loaded
   */
  async ensureInitialized() {
    if (!this._initialized) {
      await this.loadApiKeys();
      this._initialized = true;
    }
  }

  /**
   * Cargar API keys desde el sistema centralizado de credenciales
   */
  async loadApiKeys() {
    try {
      // Initialize credentials service
      await credentialsService.initialize();

      // Get OpenAI key for DALL-E
      const openaiKey = await credentialsService.get('openai');
      if (openaiKey && openaiKey.trim() && openaiKey !== '***BACKEND***') {
        this.openaiApiKey = openaiKey.trim();
        this.hasOpenAI = true;
        logger.info('OpenAI API key loaded for image generation', 'ImageGenerationService');
      } else {
        this.openaiApiKey = null;
        this.hasOpenAI = false;
      }

      // Get Stability AI key
      const stabilityKey = await credentialsService.get('stability');
      if (stabilityKey && stabilityKey.trim() && stabilityKey !== '***BACKEND***') {
        this.stabilityApiKey = stabilityKey.trim();
        this.hasStability = true;
        logger.info('Stability AI API key loaded', 'ImageGenerationService');
      } else {
        this.stabilityApiKey = null;
        this.hasStability = false;
      }

    } catch (err) {
      logger.warn('Could not load image generation API keys', 'ImageGenerationService', err);
    }
  }

  /**
   * Configurar API key de OpenAI
   */
  async setOpenAIKey(key) {
    if (key && key.trim()) {
      await credentialsService.set('openai', key.trim());
      this.openaiApiKey = key.trim();
      this.hasOpenAI = true;
      logger.info('OpenAI API configured for image generation', 'ImageGenerationService');
    }
  }

  /**
   * Configurar API key de Stability AI
   */
  async setStabilityKey(key) {
    if (key && key.trim()) {
      await credentialsService.set('stability', key.trim());
      this.stabilityApiKey = key.trim();
      this.hasStability = true;
      logger.info('Stability AI API configured', 'ImageGenerationService');
    }
  }

  /**
   * Eliminar API key de OpenAI
   */
  async removeOpenAIKey() {
    await credentialsService.delete('openai');
    this.openaiApiKey = null;
    this.hasOpenAI = false;
  }

  /**
   * Eliminar API key de Stability AI
   */
  async removeStabilityKey() {
    await credentialsService.delete('stability');
    this.stabilityApiKey = null;
    this.hasStability = false;
  }

  /**
   * Generar imagen usando DALL-E de OpenAI
   */
  async generateWithDALLE(prompt, options = {}) {
    await this.ensureInitialized();

    if (!this.hasOpenAI) {
      throw new Error('OpenAI API key no configurada');
    }

    const {
      size = '1024x1024',
      quality = 'standard',
      style = 'natural',
      n = 1
    } = options;

    try {
      logger.info(`Generating image with DALL-E: "${prompt.substring(0, 50)}..."`, 'ImageGenerationService');

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: quality === 'hd' ? 'dall-e-3' : 'dall-e-2',
          prompt: prompt,
          n: n,
          size: size,
          quality: quality,
          style: style,
          response_format: 'url'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `DALL-E API error: ${response.status}`);
      }

      const data = await response.json();

      logger.info('Image generated with DALL-E successfully', 'ImageGenerationService');

      return {
        type: 'dall-e',
        provider: 'openai',
        quality: quality,
        images: data.data.map(img => ({
          url: img.url,
          revisedPrompt: img.revised_prompt
        })),
        created: data.created
      };
    } catch (err) {
      logger.error('Error generating image with DALL-E', err, 'ImageGenerationService');
      throw err;
    }
  }

  /**
   * Generar imagen usando Stability AI (Stable Diffusion)
   */
  async generateWithStability(prompt, options = {}) {
    await this.ensureInitialized();

    if (!this.hasStability) {
      throw new Error('Stability AI API key no configurada');
    }

    const {
      width = 1024,
      height = 1024,
      samples = 1,
      steps = 30,
      style = 'enhance'
    } = options;

    try {
      logger.info(`Generating image with Stability AI: "${prompt.substring(0, 50)}..."`, 'ImageGenerationService');

      const response = await fetch(
        'https://api.stability.ai/v2beta/stable-image/generate/core',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.stabilityApiKey}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            prompt: prompt,
            width: width,
            height: height,
            samples: samples,
            steps: steps,
            style_preset: style,
            output_format: 'png'
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Stability AI error: ${response.status}`);
      }

      const data = await response.json();

      logger.info('Image generated with Stability AI successfully', 'ImageGenerationService');

      return {
        type: 'stable-diffusion',
        provider: 'stability',
        images: data.artifacts.map(artifact => ({
          base64: artifact.base64,
          seed: artifact.seed,
          finishReason: artifact.finishReason
        }))
      };
    } catch (err) {
      logger.error('Error generating image with Stability AI', err, 'ImageGenerationService');
      throw err;
    }
  }

  /**
   * Generar imagen con el mejor proveedor disponible
   */
  async generateImage(prompt, options = {}) {
    await this.ensureInitialized();

    const { provider = 'auto', ...restOptions } = options;

    if (provider === 'openai' || provider === 'dall-e') {
      return await this.generateWithDALLE(prompt, restOptions);
    }

    if (provider === 'stability') {
      return await this.generateWithStability(prompt, restOptions);
    }

    // Auto: use first available provider
    if (this.hasOpenAI) {
      try {
        return await this.generateWithDALLE(prompt, restOptions);
      } catch (err) {
        logger.warn('DALL-E failed, trying Stability AI...', 'ImageGenerationService');
        if (this.hasStability) {
          return await this.generateWithStability(prompt, restOptions);
        }
        throw err;
      }
    }

    if (this.hasStability) {
      return await this.generateWithStability(prompt, restOptions);
    }

    throw new Error('No hay proveedores de generación de imágenes configurados. Configura OpenAI o Stability AI.');
  }

  /**
   * Generar prompt mejorado para imágenes educativas
   */
  generateEducationalPrompt(context, options = {}) {
    const {
      subject = 'español',
      theme = 'conversación',
      style = 'ilustración moderna',
      setting = 'argentina',
      colorScheme = 'colores cálidos',
      details = ''
    } = options;

    let enhancedPrompt = `Una ${style} educativa de alta calidad para aprender ${subject}. `;
    enhancedPrompt += `Tema: ${theme}. `;
    enhancedPrompt += `Ambientación: ${setting}. `;
    enhancedPrompt += `Contexto: ${context}. `;
    enhancedPrompt += `Estilo visual: ${colorScheme}, amigable, profesional, claro y atractivo. `;

    if (details) {
      enhancedPrompt += `Detalles adicionales: ${details}. `;
    }

    enhancedPrompt += `La imagen debe ser culturalmente apropiada, inclusiva y visualmente atractiva para estudiantes.`;

    return enhancedPrompt;
  }

  /**
   * Verificar si hay proveedores configurados
   */
  async hasProviders() {
    await this.ensureInitialized();
    return this.hasOpenAI || this.hasStability;
  }

  /**
   * Obtener lista de proveedores disponibles
   */
  async getAvailableProviders() {
    await this.ensureInitialized();
    return [
      {
        id: 'openai',
        name: 'DALL-E (OpenAI)',
        configured: this.hasOpenAI,
        quality: 'Alta',
        models: ['DALL-E 2', 'DALL-E 3'],
        features: ['Prompts naturales', 'Revisión automática de prompts', 'Alta calidad']
      },
      {
        id: 'stability',
        name: 'Stable Diffusion (Stability AI)',
        configured: this.hasStability,
        quality: 'Muy Alta',
        models: ['SDXL Core'],
        features: ['Control preciso', 'Múltiples estilos', 'Código abierto']
      }
    ];
  }
}

const imageGenerationService = new ImageGenerationService();

export default imageGenerationService;
