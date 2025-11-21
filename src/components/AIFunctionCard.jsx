/**
 * @fileoverview AI Function Card - Vista individual de función de IA
 * @module components/AIFunctionCard
 */

import { useState } from 'react';
import { Settings, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { BaseButton, BaseBadge } from './common';
import { UniversalCard } from './cards';
import { getProviderById } from '../constants/aiFunctions';
import logger from '../utils/logger';
import imageService from '../services/imageService';

/**
 * Card de función de IA - soporta vista grid y list
 */
function AIFunctionCard({ aiFunction, config, onConfigure, viewMode = 'grid' }) {
  // Estado local para preview de imágenes
  const [testingImage, setTestingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [imageError, setImageError] = useState(null);

  // Usar defaultConfig si no hay config guardada
  const activeConfig = config || aiFunction.defaultConfig;

  const isConfigured = activeConfig?.provider && activeConfig?.model;
  const isEnabled = activeConfig?.enabled || false;
  const provider = activeConfig?.provider ? getProviderById(activeConfig.provider) : null;

  // Detectar si es una función de imagen
  const isImageFunction = ['dalle', 'stability'].includes(activeConfig?.provider);

  logger.debug(`[AIFunctionCard] ${aiFunction.name}:`, {
    isConfigured,
    isEnabled,
    provider: activeConfig?.provider,
    isImageFunction
  });

  const FunctionIcon = aiFunction.icon;
  const ProviderIcon = provider?.icon;

  /**
   * Test rápido de generación de imagen
   */
  const handleQuickImageTest = async (e) => {
    e.stopPropagation();

    if (!isConfigured) {
      setImageError('Configura la función primero');
      return;
    }

    setTestingImage(true);
    setImageError(null);
    setGeneratedImageUrl(null);

    try {
      const result = await imageService.testGeneration(activeConfig.provider);

      if (result.success && result.images && result.images[0]) {
        setGeneratedImageUrl(result.images[0].url || result.images[0].b64_json);
      } else {
        setImageError(result.error || 'Error generando imagen');
      }
    } catch (error) {
      logger.error('Quick image test failed:', error);
      setImageError(error.message || 'Error al generar imagen');
    } finally {
      setTestingImage(false);
    }
  };

  // Determinar badge de estado (retorna JSX, no objeto)
  const getStatusBadge = () => {
    if (!isConfigured) {
      return (
        <BaseBadge variant="default" size="sm">
          Sin configurar
        </BaseBadge>
      );
    }
    if (isEnabled) {
      return (
        <BaseBadge variant="success" size="sm">
          Activo
        </BaseBadge>
      );
    }
    return (
      <BaseBadge variant="default" size="sm">
        Configurado
      </BaseBadge>
    );
  };

  // Renderizar botones para el footer (actions)
  const renderActions = () => {
    const buttons = [];

    // Quick test para imágenes
    if (isImageFunction && isConfigured) {
      buttons.push(
        <BaseButton
          key="test"
          variant="outline"
          icon={Sparkles}
          onClick={handleQuickImageTest}
          disabled={testingImage}
          loading={testingImage}
          fullWidth
          size="sm"
        >
          {testingImage ? 'Generando...' : 'Prueba Rápida'}
        </BaseButton>
      );
    }

    // Botón configurar (siempre presente)
    buttons.push(
      <BaseButton
        key="configure"
        variant={isConfigured ? "secondary" : "primary"}
        icon={Settings}
        onClick={(e) => {
          e.stopPropagation();
          onConfigure();
        }}
        fullWidth
        size="sm"
      >
        {isConfigured ? 'Configurar' : 'Configurar función'}
      </BaseButton>
    );

    return (
      <div className="flex flex-col gap-2 w-full">
        {buttons}
      </div>
    );
  };

  return (
    <UniversalCard
      variant={viewMode === 'grid' ? 'default' : 'compact'}
      size="md"
      layout={viewMode === 'grid' ? 'vertical' : 'horizontal'}
      icon={FunctionIcon}
      title={aiFunction.name}
      subtitle={aiFunction.description}
      badge={getStatusBadge()}
      onClick={onConfigure}
      actions={renderActions()}
    >
      {/* Info de proveedor si está configurado */}
      {isConfigured && provider && (
        <div
          className="flex items-center gap-2 p-2 rounded-lg mb-3"
          style={{ background: 'var(--color-bg-tertiary)' }}
        >
          {ProviderIcon && (
            <ProviderIcon
              size={18}
              strokeWidth={2}
              style={{ color: 'var(--color-text-secondary)' }}
            />
          )}
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-medium truncate"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {provider.name}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {activeConfig.model}
            </p>
          </div>
        </div>
      )}

      {/* Preview de imagen generada (solo para funciones de imagen) */}
      {isImageFunction && generatedImageUrl && (
        <div
          className="mb-3 rounded-lg overflow-hidden border-2"
          style={{ borderColor: 'var(--color-accent)' }}
        >
          <img
            src={generatedImageUrl}
            alt="Generated preview"
            className="w-full h-auto"
          />
        </div>
      )}

      {/* Error de imagen */}
      {isImageFunction && imageError && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400 m-0">
            {imageError}
          </p>
        </div>
      )}
    </UniversalCard>
  );
}

export default AIFunctionCard;
