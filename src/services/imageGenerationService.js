/**
 * @fileoverview Servicio de generación de imágenes con IA
 * @module services/imageGenerationService
 *
 * ⚠️ Usa credentialsHelper para leer API keys - NO modificar
 */

import logger from '../utils/logger';
import { getAICredentialSync, getLocalStorageKey } from '../utils/credentialsHelper';

class ImageGenerationService {
  constructor() {
    this.openaiApiKey = null;
    this.stabilityApiKey = null;
    this.hasOpenAI = false;
    this.hasStability = false;

    // Cargar API keys usando el helper centralizado
    this.loadApiKeys();
  }

  /**
   * Cargar API keys usando credentialsHelper (NO localStorage directo)
   */
  loadApiKeys() {
    try {
      // OpenAI para DALL-E - usando helper centralizado
      const openaiKey = getAICredentialSync('openai');
      if (openaiKey) {
        this.openaiApiKey = openaiKey;
        this.hasOpenAI = true;
        logger.info('OpenAI API key cargada para generación de imágenes');
      }

      // Stability AI para Stable Diffusion - usando helper centralizado
      const stabilityKey = getAICredentialSync('stability');
      if (stabilityKey) {
        this.stabilityApiKey = stabilityKey;
        this.hasStability = true;
        logger.info('Stability AI API key cargada');
      }
    } catch (err) {
      logger.warn('⚠️ No se pudieron cargar las API keys de generación de imágenes:', err);
    }
  }

  /**
   * Configurar API key de OpenAI
   */
  setOpenAIKey(key) {
    if (key && key.trim()) {
      this.openaiApiKey = key.trim();
      this.hasOpenAI = true;
      // Usar helper para obtener la clave correcta de localStorage
      const storageKey = getLocalStorageKey('openai');
      if (storageKey) localStorage.setItem(storageKey, key.trim());
      logger.info('🔑 OpenAI API configurada para generación de imágenes');
    }
  }

  /**
   * Configurar API key de Stability AI
   */
  setStabilityKey(key) {
    if (key && key.trim()) {
      this.stabilityApiKey = key.trim();
      this.hasStability = true;
      // Usar helper para obtener la clave correcta de localStorage
      const storageKey = getLocalStorageKey('stability');
      if (storageKey) localStorage.setItem(storageKey, key.trim());
      logger.info('🔑 Stability AI API configurada');
    }
  }

  /**
   * Eliminar API key de OpenAI
   */
  removeOpenAIKey() {
    const storageKey = getLocalStorageKey('openai');
    if (storageKey) localStorage.removeItem(storageKey);
    this.openaiApiKey = null;
    this.hasOpenAI = false;
  }

  /**
   * Eliminar API key de Stability AI
   */
  removeStabilityKey() {
    const storageKey = getLocalStorageKey('stability');
    if (storageKey) localStorage.removeItem(storageKey);
    this.stabilityApiKey = null;
    this.hasStability = false;
  }

  /**
   * Generar imagen usando DALL-E de OpenAI
   */
  async generateWithDALLE(prompt, options = {}) {
    if (!this.hasOpenAI) {
      throw new Error('OpenAI API key no configurada');
    }

    const {
      size = '1024x1024', // 256x256, 512x512, 1024x1024, 1024x1792, 1792x1024
      quality = 'standard', // standard, hd
      style = 'natural', // natural, vivid
      n = 1 // Número de imágenes a generar (1-10)
    } = options;

    try {
      logger.info(`🎨 Generando imagen con DALL-E: "${prompt.substring(0, 50)}..."`);

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

      logger.info('✅ Imagen generada con DALL-E exitosamente');

      return {
        type: 'dall-e',
        provider: 'openai',
        quality: quality,
        images: data.data.map(img => ({
          url: img.url,
          revisedPrompt: img.revised_prompt // DALL-E 3 revisa el prompt
        })),
        created: data.created
      };
    } catch (err) {
      logger.error('❌ Error generando imagen con DALL-E:', err);
      throw err;
    }
  }

  /**
   * Generar imagen usando Stability AI (Stable Diffusion)
   */
  async generateWithStability(prompt, options = {}) {
    if (!this.hasStability) {
      throw new Error('Stability AI API key no configurada');
    }

    const {
      width = 1024,
      height = 1024,
      samples = 1,
      steps = 30,
      style = 'enhance' // enhance, anime, photographic, digital-art, comic-book, fantasy-art
    } = options;

    try {
      logger.info(`🎨 Generando imagen con Stability AI: "${prompt.substring(0, 50)}..."`);

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

      logger.info('✅ Imagen generada con Stability AI exitosamente');

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
      logger.error('❌ Error generando imagen con Stability AI:', err);
      throw err;
    }
  }

  /**
   * Generar imagen con el mejor proveedor disponible
   */
  async generateImage(prompt, options = {}) {
    const { provider = 'auto', ...restOptions } = options;

    // Si se especifica proveedor, usarlo
    if (provider === 'openai' || provider === 'dall-e') {
      return await this.generateWithDALLE(prompt, restOptions);
    }

    if (provider === 'stability') {
      return await this.generateWithStability(prompt, restOptions);
    }

    // Auto: intentar con el primer proveedor disponible
    if (this.hasOpenAI) {
      try {
        return await this.generateWithDALLE(prompt, restOptions);
      } catch (err) {
        logger.warn('⚠️ DALL-E falló, probando Stability AI...');
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
  hasProviders() {
    return this.hasOpenAI || this.hasStability;
  }

  /**
   * Obtener lista de proveedores disponibles
   */
  getAvailableProviders() {
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
