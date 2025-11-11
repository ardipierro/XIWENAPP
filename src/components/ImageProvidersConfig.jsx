/**
 * @fileoverview Image Providers Configuration Component
 * @module components/ImageProvidersConfig
 *
 * Panel de configuración para proveedores de imágenes (DALL-E, Stability AI)
 */

import { useState, useEffect } from 'react';
import { Image, Palette, Sparkles, Check, X, Download, Play } from 'lucide-react';
import logger from '../utils/logger';
import imageService from '../services/imageService';
import { getAIConfig } from '../firebase/aiConfig';
import { AI_FUNCTIONS, getProviderById } from '../constants/aiFunctions';
import ImageGenerationDemo from './ImageGenerationDemo';
import { BaseButton, BaseCard, BaseLoading, BaseBadge } from './common';

function ImageProvidersConfig() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [generatedImages, setGeneratedImages] = useState({});
  const [showDemo, setShowDemo] = useState(false);
  const [customPrompts, setCustomPrompts] = useState({
    image_generator: '',
    illustration_creator: '',
    visual_vocabulary: ''
  });

  // Load configuration
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      await imageService.initialize();
      const aiConfig = await getAIConfig();
      setConfig(aiConfig);
    } catch (error) {
      logger.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get image-related functions
  const imageFunctions = AI_FUNCTIONS.filter(
    fn => fn.category === 'content' && ['dalle', 'stability'].includes(fn.defaultConfig.provider)
  );

  const getFunctionStatus = (functionId) => {
    if (!config || !config.functions || !config.functions[functionId]) {
      return 'unconfigured';
    }
    const fn = config.functions[functionId];
    if (fn.enabled && fn.apiKey) {
      return 'active';
    }
    return 'configured';
  };

  const handleTestGeneration = async (functionId) => {
    setTestResults(prev => ({ ...prev, [functionId]: 'loading' }));
    setGeneratedImages(prev => ({ ...prev, [functionId]: null }));

    try {
      const functionConfig = AI_FUNCTIONS.find(f => f.id === functionId);
      const providerId = functionConfig?.defaultConfig.provider;

      const result = await imageService.testGeneration(providerId);

      if (result.success) {
        setTestResults(prev => ({ ...prev, [functionId]: 'success' }));
        setGeneratedImages(prev => ({
          ...prev,
          [functionId]: result.images[0]?.url || result.images[0]?.b64_json
        }));
      } else {
        setTestResults(prev => ({ ...prev, [functionId]: 'error' }));
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [functionId]: 'error' }));
      logger.error('Error generating test image:', error);
      alert(`Error al generar imagen: ${error.message}`);
    }
  };

  const handleCustomGeneration = async (functionId) => {
    const prompt = customPrompts[functionId];
    if (!prompt.trim()) {
      alert('Por favor ingresa una descripción');
      return;
    }

    setTestResults(prev => ({ ...prev, [functionId]: 'loading' }));
    setGeneratedImages(prev => ({ ...prev, [functionId]: null }));

    try {
      const result = await imageService.generateImage({
        prompt,
        functionId,
        size: '1024x1024'
      });

      if (result.success) {
        setTestResults(prev => ({ ...prev, [functionId]: 'success' }));
        setGeneratedImages(prev => ({
          ...prev,
          [functionId]: result.images[0]?.url || result.images[0]?.b64_json
        }));
      } else {
        setTestResults(prev => ({ ...prev, [functionId]: 'error' }));
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [functionId]: 'error' }));
      logger.error('Error generating custom image:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const getProviderIcon = (providerId) => {
    const icons = {
      dalle: Image,
      stability: Palette
    };
    return icons[providerId] || Sparkles;
  };

  const getStatusBadge = (status) => {
    const badges = {
      unconfigured: { variant: 'danger', label: 'Sin configurar' },
      configured: { variant: 'default', label: 'Configurado' },
      active: { variant: 'success', label: 'Activo' }
    };
    return badges[status] || badges.unconfigured;
  };

  if (loading) {
    return <BaseLoading variant="fullscreen" text="Cargando configuración..." />;
  }

  // Si está en modo demo, mostrar el componente de demostración
  if (showDemo) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <BaseButton
          variant="outline"
          onClick={() => setShowDemo(false)}
          className="mb-6"
        >
          ← Volver a Configuración
        </BaseButton>
        <ImageGenerationDemo />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-6 mb-8">
        <div className="flex items-center gap-4 md:gap-6 flex-1">
          <Palette size={32} className="text-primary-600 dark:text-primary-400 flex-shrink-0" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white m-0">
              Proveedores de Imágenes IA
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1 m-0">
              Configura DALL-E y Stability AI para generar imágenes educativas
            </p>
          </div>
        </div>
        <BaseButton
          variant="primary"
          icon={Play}
          onClick={() => setShowDemo(true)}
          className="w-full md:w-auto whitespace-nowrap"
        >
          Tareas de Demostración
        </BaseButton>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 md:gap-4 p-4 md:p-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl mb-8 shadow-lg">
        <Sparkles size={20} className="flex-shrink-0 mt-0.5" />
        <div className="text-sm md:text-base">
          <strong>Nota importante:</strong> Para configurar las API keys, ve a{' '}
          <strong>Tareas IA</strong> en el menú lateral y configura las funciones de imagen.
        </div>
      </div>

      {/* Image Functions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-12">
        {imageFunctions.map((fn) => {
          const status = getFunctionStatus(fn.id);
          const statusBadge = getStatusBadge(status);
          const IconComponent = fn.icon;
          const ProviderIcon = getProviderIcon(fn.defaultConfig.provider);
          const provider = getProviderById(fn.defaultConfig.provider);
          const testState = testResults[fn.id];
          const generatedImage = generatedImages[fn.id];

          return (
            <BaseCard
              key={fn.id}
              hover
              className="flex flex-col h-full"
            >
              {/* Card Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl text-white flex-shrink-0">
                  <IconComponent size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 m-0">
                    {fn.name}
                  </h3>
                  <BaseBadge variant={statusBadge.variant}>
                    {statusBadge.label}
                  </BaseBadge>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 m-0">
                {fn.description}
              </p>

              {/* Provider Info */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4 text-sm">
                <ProviderIcon size={16} className="text-primary-600 dark:text-primary-400" />
                <span className="text-gray-700 dark:text-gray-300">{provider?.name || 'Unknown'}</span>
                <span className="ml-auto text-xs font-mono text-gray-500 dark:text-gray-400">
                  {fn.defaultConfig.model}
                </span>
              </div>

              {/* Prompt Input */}
              <div className="mb-4 flex-grow">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción de la imagen:
                </label>
                <textarea
                  placeholder="Ej: Un gato jugando con una pelota, estilo cartoon colorido"
                  value={customPrompts[fn.id]}
                  onChange={(e) =>
                    setCustomPrompts((prev) => ({
                      ...prev,
                      [fn.id]: e.target.value
                    }))
                  }
                  disabled={status === 'unconfigured'}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-vertical focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <BaseButton
                  variant="outline"
                  size="sm"
                  icon={Sparkles}
                  onClick={() => handleTestGeneration(fn.id)}
                  disabled={status === 'unconfigured' || testState === 'loading'}
                  loading={testState === 'loading'}
                  className="flex-1"
                >
                  Prueba Rápida
                </BaseButton>
                <BaseButton
                  variant="primary"
                  size="sm"
                  icon={Image}
                  onClick={() => handleCustomGeneration(fn.id)}
                  disabled={
                    status === 'unconfigured' ||
                    testState === 'loading' ||
                    !customPrompts[fn.id]?.trim()
                  }
                  loading={testState === 'loading'}
                  className="flex-1"
                >
                  Generar
                </BaseButton>
              </div>

              {/* Generated Image Preview */}
              {testState === 'success' && generatedImage && (
                <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 group">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full h-auto block"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={generatedImage}
                      download={`${fn.id}-${Date.now()}.png`}
                      className="w-12 h-12 flex items-center justify-center bg-white rounded-full text-primary-600 hover:scale-110 transition-transform"
                    >
                      <Download size={20} />
                    </a>
                  </div>
                </div>
              )}

              {/* Result Messages */}
              {testState === 'success' && !generatedImage && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm">
                  <Check size={20} className="text-green-600 dark:text-green-400" />
                  <span className="text-green-700 dark:text-green-300 font-medium">
                    Generación exitosa
                  </span>
                </div>
              )}

              {testState === 'error' && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm">
                  <X size={20} className="text-red-600 dark:text-red-400" />
                  <span className="text-red-700 dark:text-red-300 font-medium">
                    Error en la generación
                  </span>
                </div>
              )}
            </BaseCard>
          );
        })}
      </div>

      {/* Guide Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6 m-0">
          Guía de Uso
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
            <Image size={24} className="text-primary-600 dark:text-primary-400 mb-4" />
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2 m-0">
              Generador de Imágenes
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 m-0 leading-relaxed">
              Usa DALL-E para crear imágenes educativas simples y claras. Ideal
              para ilustrar conceptos básicos y vocabulario.
            </p>
          </div>
          <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
            <Palette size={24} className="text-primary-600 dark:text-primary-400 mb-4" />
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2 m-0">
              Creador de Ilustraciones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 m-0 leading-relaxed">
              Usa Stability AI para ilustraciones artísticas más complejas. Gran
              control sobre estilo y detalles.
            </p>
          </div>
          <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
            <Sparkles size={24} className="text-primary-600 dark:text-primary-400 mb-4" />
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2 m-0">
              Vocabulario Visual
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 m-0 leading-relaxed">
              Genera imágenes específicas para enseñar palabras. Cada imagen debe
              mostrar claramente el concepto sin ambigüedad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageProvidersConfig;
