/**
 * @fileoverview Image Providers Configuration Component
 * @module components/ImageProvidersConfig
 *
 * Panel de configuración para proveedores de imágenes (DALL-E, Stability AI)
 */

import { useState, useEffect } from 'react';
import { Image, Palette, Sparkles, Check, X, Loader, Download, Play } from 'lucide-react';
import imageService from '../services/imageService';
import { getAIConfig } from '../firebase/aiConfig';
import { AI_FUNCTIONS, getProviderById } from '../constants/aiFunctions';
import ImageGenerationDemo from './ImageGenerationDemo';
import './ImageProvidersConfig.css';

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
      console.error('Error loading config:', error);
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
      unconfigured: { label: 'Sin configurar', className: 'status-unconfigured' },
      configured: { label: 'Configurado', className: 'status-configured' },
      active: { label: 'Activo', className: 'status-active' }
    };
    return badges[status] || badges.unconfigured;
  };

  if (loading) {
    return (
      <div className="image-providers-loading">
        <Loader className="spinner" size={32} />
        <p>Cargando configuración...</p>
      </div>
    );
  }

  // Si está en modo demo, mostrar el componente de demostración
  if (showDemo) {
    return (
      <div className="image-providers-container">
        <button
          onClick={() => setShowDemo(false)}
          className="btn-back"
        >
          ← Volver a Configuración
        </button>
        <ImageGenerationDemo />
      </div>
    );
  }

  return (
    <div className="image-providers-container">
      <div className="image-providers-header">
        <div className="header-content">
          <Palette size={32} />
          <div>
            <h1>Proveedores de Imágenes IA</h1>
            <p>Configura DALL-E y Stability AI para generar imágenes educativas</p>
          </div>
        </div>
        <button
          className="btn-demo"
          onClick={() => setShowDemo(true)}
        >
          <Play size={20} />
          Tareas de Demostración
        </button>
      </div>

      <div className="providers-info-banner">
        <Sparkles size={20} />
        <div>
          <strong>Nota importante:</strong> Para configurar las API keys, ve a{' '}
          <strong>Tareas IA</strong> en el menú lateral y configura las funciones de imagen.
        </div>
      </div>

      <div className="image-functions-grid">
        {imageFunctions.map((fn) => {
          const status = getFunctionStatus(fn.id);
          const statusBadge = getStatusBadge(status);
          const IconComponent = fn.icon;
          const ProviderIcon = getProviderIcon(fn.defaultConfig.provider);
          const provider = getProviderById(fn.defaultConfig.provider);
          const testState = testResults[fn.id];
          const generatedImage = generatedImages[fn.id];

          return (
            <div key={fn.id} className="image-function-card">
              <div className="card-header">
                <div className="card-icon">
                  <IconComponent size={24} />
                </div>
                <div className="card-title">
                  <h3>{fn.name}</h3>
                  <span className={`status-badge ${statusBadge.className}`}>
                    {statusBadge.label}
                  </span>
                </div>
              </div>

              <p className="card-description">{fn.description}</p>

              <div className="card-provider">
                <ProviderIcon size={16} />
                <span>{provider?.name || 'Unknown'}</span>
                <span className="provider-model">
                  {fn.defaultConfig.model}
                </span>
              </div>

              <div className="card-prompt">
                <label>Descripción de la imagen:</label>
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
                />
              </div>

              <div className="card-actions">
                <button
                  className="btn-secondary"
                  onClick={() => handleTestGeneration(fn.id)}
                  disabled={status === 'unconfigured' || testState === 'loading'}
                >
                  {testState === 'loading' ? (
                    <>
                      <Loader className="spinner" size={16} />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Prueba Rápida
                    </>
                  )}
                </button>

                <button
                  className="btn-primary"
                  onClick={() => handleCustomGeneration(fn.id)}
                  disabled={
                    status === 'unconfigured' ||
                    testState === 'loading' ||
                    !customPrompts[fn.id]?.trim()
                  }
                >
                  {testState === 'loading' ? (
                    <>
                      <Loader className="spinner" size={16} />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Image size={16} />
                      Generar
                    </>
                  )}
                </button>
              </div>

              {testState === 'success' && generatedImage && (
                <div className="generated-image-preview">
                  <img
                    src={
                      generatedImage.startsWith('data:')
                        ? generatedImage
                        : generatedImage
                    }
                    alt="Generated"
                  />
                  <div className="image-overlay">
                    <a
                      href={generatedImage}
                      download={`${fn.id}-${Date.now()}.png`}
                      className="download-btn"
                    >
                      <Download size={20} />
                    </a>
                  </div>
                </div>
              )}

              {testState === 'success' && !generatedImage && (
                <div className="test-result success">
                  <Check size={20} />
                  <span>Generación exitosa</span>
                </div>
              )}

              {testState === 'error' && (
                <div className="test-result error">
                  <X size={20} />
                  <span>Error en la generación</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="providers-guide">
        <h2>Guía de Uso</h2>
        <div className="guide-grid">
          <div className="guide-card">
            <Image size={24} />
            <h3>Generador de Imágenes</h3>
            <p>
              Usa DALL-E para crear imágenes educativas simples y claras. Ideal
              para ilustrar conceptos básicos y vocabulario.
            </p>
          </div>
          <div className="guide-card">
            <Palette size={24} />
            <h3>Creador de Ilustraciones</h3>
            <p>
              Usa Stability AI para ilustraciones artísticas más complejas. Gran
              control sobre estilo y detalles.
            </p>
          </div>
          <div className="guide-card">
            <Sparkles size={24} />
            <h3>Vocabulario Visual</h3>
            <p>
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
