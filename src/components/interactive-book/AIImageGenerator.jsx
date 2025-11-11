/**
 * @fileoverview Generador de imágenes con IA para contenido educativo
 * @module components/interactive-book/AIImageGenerator
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Image, Sparkles, Download, RefreshCw, Key, Zap, Settings as SettingsIcon } from 'lucide-react';
import { BaseCard, BaseButton, BaseBadge, BaseInput, BaseTextarea, BaseSelect, BaseLoading, BaseAlert } from '../common';
import imageGenerationService from '../../services/imageGenerationService';
import logger from '../../utils/logger';

/**
 * Componente para generar imágenes con IA
 */
function AIImageGenerator({ bookContent = null, alwaysOpen = false }) {
  const [isOpen, setIsOpen] = useState(alwaysOpen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Configuración de API keys
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [stabilityApiKey, setStabilityApiKey] = useState('');
  const [hasOpenAI, setHasOpenAI] = useState(false);
  const [hasStability, setHasStability] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Parámetros de generación
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState('auto');
  const [quality, setQuality] = useState('standard');
  const [style, setStyle] = useState('natural');
  const [size, setSize] = useState('1024x1024');

  // Resultado
  const [generatedImages, setGeneratedImages] = useState([]);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = () => {
    const openai = localStorage.getItem('ai_credentials_openai');
    const stability = localStorage.getItem('ai_credentials_stability');

    if (openai && openai.trim()) {
      setHasOpenAI(true);
      setOpenaiApiKey('••••••••••••••••');
    }

    if (stability && stability.trim()) {
      setHasStability(true);
      setStabilityApiKey('••••••••••••••••');
    }
  };

  const handleSaveOpenAIKey = () => {
    if (openaiApiKey && openaiApiKey !== '••••••••••••••••') {
      imageGenerationService.setOpenAIKey(openaiApiKey);
      setHasOpenAI(true);
      setOpenaiApiKey('••••••••••••••••');
      setShowSettings(false);
    }
  };

  const handleSaveStabilityKey = () => {
    if (stabilityApiKey && stabilityApiKey !== '••••••••••••••••') {
      imageGenerationService.setStabilityKey(stabilityApiKey);
      setHasStability(true);
      setStabilityApiKey('••••••••••••••••');
      setShowSettings(false);
    }
  };

  const handleRemoveOpenAIKey = () => {
    imageGenerationService.removeOpenAIKey();
    setHasOpenAI(false);
    setOpenaiApiKey('');
  };

  const handleRemoveStabilityKey = () => {
    imageGenerationService.removeStabilityKey();
    setHasStability(false);
    setStabilityApiKey('');
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setError('Por favor, escribe una descripción de la imagen');
      return;
    }

    if (!hasOpenAI && !hasStability) {
      setError('Configura al menos un proveedor de IA (OpenAI o Stability AI)');
      setShowSettings(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const options = {
        provider,
        size,
        quality,
        style
      };

      const result = await imageGenerationService.generateImage(prompt, options);

      setGeneratedImages(result.images);
      setSuccess(true);
      logger.info('✅ Imagen generada exitosamente:', result);

    } catch (err) {
      logger.error('❌ Error generando imagen:', err);
      setError(err.message || 'Error al generar imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImage = (imageUrl) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `xiwen-ai-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePromptFromBookContent = () => {
    if (!bookContent) return;

    const enhancedPrompt = imageGenerationService.generateEducationalPrompt(
      bookContent.text || bookContent.description || '',
      {
        subject: 'español argentino',
        theme: bookContent.theme || 'conversación',
        style: 'ilustración moderna y colorida',
        setting: 'Buenos Aires, Argentina',
        colorScheme: 'colores cálidos y amigables'
      }
    );

    setPrompt(enhancedPrompt);
  };

  return (
    <div className="space-y-4">
      {/* Header compacto - solo si no es alwaysOpen */}
      {!alwaysOpen && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Image size={18} className="text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Generador de Imágenes con IA
            </span>
          </div>
          <div className="flex items-center gap-2">
            {(hasOpenAI || hasStability) && (
              <BaseBadge variant="success" size="sm">Configurado</BaseBadge>
            )}
          </div>
        </button>
      )}

      {/* Panel principal */}
      {isOpen && (
        <BaseCard
          icon={Image}
          title="Generador de Imágenes con IA"
          subtitle="Crea imágenes educativas basadas en el contenido del libro"
        >
          {/* Configuración de API Keys */}
          {showSettings && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Configuración de Proveedores
                </h4>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                >
                  Cerrar
                </BaseButton>
              </div>

              {/* OpenAI DALL-E */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Key size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    OpenAI (DALL-E)
                  </span>
                  {hasOpenAI && <BaseBadge variant="success" size="sm">Configurado</BaseBadge>}
                </div>
                {!hasOpenAI ? (
                  <div className="flex gap-2">
                    <BaseInput
                      type="password"
                      placeholder="sk-..."
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                      className="flex-1"
                    />
                    <BaseButton
                      variant="primary"
                      size="sm"
                      onClick={handleSaveOpenAIKey}
                      disabled={!openaiApiKey || openaiApiKey === '••••••••••••••••'}
                    >
                      Guardar
                    </BaseButton>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">••••••••••••••••</span>
                    <BaseButton variant="danger" size="sm" onClick={handleRemoveOpenAIKey}>
                      Eliminar
                    </BaseButton>
                  </div>
                )}
              </div>

              {/* Stability AI */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Key size={16} className="text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Stability AI (Stable Diffusion)
                  </span>
                  {hasStability && <BaseBadge variant="success" size="sm">Configurado</BaseBadge>}
                </div>
                {!hasStability ? (
                  <div className="flex gap-2">
                    <BaseInput
                      type="password"
                      placeholder="sk-..."
                      value={stabilityApiKey}
                      onChange={(e) => setStabilityApiKey(e.target.value)}
                      className="flex-1"
                    />
                    <BaseButton
                      variant="primary"
                      size="sm"
                      onClick={handleSaveStabilityKey}
                      disabled={!stabilityApiKey || stabilityApiKey === '••••••••••••••••'}
                    >
                      Guardar
                    </BaseButton>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">••••••••••••••••</span>
                    <BaseButton variant="danger" size="sm" onClick={handleRemoveStabilityKey}>
                      Eliminar
                    </BaseButton>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Formulario de generación */}
          <div className="space-y-4">
            {/* Botón de configuración */}
            {!showSettings && (
              <div className="flex justify-end">
                <BaseButton
                  variant="ghost"
                  size="sm"
                  icon={SettingsIcon}
                  onClick={() => setShowSettings(true)}
                >
                  Configurar Proveedores
                </BaseButton>
              </div>
            )}

            {/* Prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Descripción de la imagen
                </label>
                {bookContent && (
                  <BaseButton
                    variant="ghost"
                    size="sm"
                    icon={Sparkles}
                    onClick={generatePromptFromBookContent}
                  >
                    Generar desde contenido
                  </BaseButton>
                )}
              </div>
              <BaseTextarea
                placeholder="Una ilustración moderna de dos personas conversando en un café de Buenos Aires, con colores cálidos y ambiente acogedor..."
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={1000}
              />
            </div>

            {/* Parámetros de generación */}
            <div className="grid grid-cols-2 gap-3">
              <BaseSelect
                label="Proveedor"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                options={[
                  { value: 'auto', label: 'Automático' },
                  { value: 'openai', label: 'DALL-E (OpenAI)', disabled: !hasOpenAI },
                  { value: 'stability', label: 'Stable Diffusion', disabled: !hasStability }
                ]}
              />

              <BaseSelect
                label="Tamaño"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                options={[
                  { value: '256x256', label: '256x256 (pequeño)' },
                  { value: '512x512', label: '512x512 (mediano)' },
                  { value: '1024x1024', label: '1024x1024 (grande)' },
                  { value: '1024x1792', label: '1024x1792 (vertical)' },
                  { value: '1792x1024', label: '1792x1024 (horizontal)' }
                ]}
              />

              <BaseSelect
                label="Calidad"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                options={[
                  { value: 'standard', label: 'Estándar' },
                  { value: 'hd', label: 'Alta Definición (HD)' }
                ]}
              />

              <BaseSelect
                label="Estilo"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                options={[
                  { value: 'natural', label: 'Natural' },
                  { value: 'vivid', label: 'Vívido' }
                ]}
              />
            </div>

            {/* Botón de generación */}
            <BaseButton
              variant="primary"
              icon={Sparkles}
              onClick={handleGenerateImage}
              loading={loading}
              disabled={!prompt.trim() || (!hasOpenAI && !hasStability)}
              fullWidth
            >
              {loading ? 'Generando imagen...' : 'Generar Imagen'}
            </BaseButton>
          </div>

          {/* Alertas */}
          {error && (
            <BaseAlert variant="danger" dismissible onDismiss={() => setError(null)}>
              {error}
            </BaseAlert>
          )}

          {success && (
            <BaseAlert variant="success" dismissible onDismiss={() => setSuccess(false)}>
              ✅ Imagen generada exitosamente
            </BaseAlert>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center p-8">
              <BaseLoading variant="dots" size="lg" text="Generando imagen con IA..." />
            </div>
          )}

          {/* Imágenes generadas */}
          {generatedImages.length > 0 && !loading && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Imágenes Generadas ({generatedImages.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedImages.map((image, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
                  >
                    {image.url && (
                      <img
                        src={image.url}
                        alt={`Imagen generada ${idx + 1}`}
                        className="w-full h-auto"
                      />
                    )}
                    {image.base64 && (
                      <img
                        src={`data:image/png;base64,${image.base64}`}
                        alt={`Imagen generada ${idx + 1}`}
                        className="w-full h-auto"
                      />
                    )}
                    <div className="p-3 space-y-2">
                      {image.revisedPrompt && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <strong>Prompt revisado:</strong> {image.revisedPrompt}
                        </p>
                      )}
                      <BaseButton
                        variant="primary"
                        size="sm"
                        icon={Download}
                        onClick={() => handleDownloadImage(image.url || `data:image/png;base64,${image.base64}`)}
                        fullWidth
                      >
                        Descargar
                      </BaseButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Zap size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-xs text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-1">Consejos:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Sé específico en la descripción: colores, estilo, ambiente, personajes</li>
                  <li>Menciona el contexto educativo y la ubicación (Buenos Aires, Argentina)</li>
                  <li>DALL-E 3 es mejor para prompts en lenguaje natural</li>
                  <li>Stable Diffusion ofrece más control técnico y estilos artísticos</li>
                  <li>Las imágenes se pueden usar para enriquecer el contenido del libro</li>
                </ul>
              </div>
            </div>
          </div>
        </BaseCard>
      )}
    </div>
  );
}

AIImageGenerator.propTypes = {
  bookContent: PropTypes.shape({
    text: PropTypes.string,
    description: PropTypes.string,
    theme: PropTypes.string
  }),
  alwaysOpen: PropTypes.bool
};

export default AIImageGenerator;
