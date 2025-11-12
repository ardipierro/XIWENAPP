/**
 * @fileoverview AI Function Card - Vista individual de función de IA
 * @module components/AIFunctionCard
 */

import { useState } from 'react';
import { Settings, CheckCircle, AlertCircle, XCircle, Image as ImageIcon, Sparkles } from 'lucide-react';
import { BaseButton, BaseBadge } from './common';
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

  // Determinar badge de estado (simplificado)
  const getStatusBadge = () => {
    if (!isConfigured) {
      return (
        <BaseBadge variant="default" size="sm" icon={XCircle}>
          Sin configurar
        </BaseBadge>
      );
    }

    if (isEnabled) {
      return (
        <BaseBadge variant="success" size="sm" icon={CheckCircle}>
          Activo
        </BaseBadge>
      );
    }

    return (
      <BaseBadge variant="default" size="sm" icon={CheckCircle}>
        Configurado
      </BaseBadge>
    );
  };

  // Vista Grid (vertical)
  if (viewMode === 'grid') {
    return (
      <div
        className="card card-grid-item flex flex-col cursor-pointer transition-all duration-300 overflow-hidden hover:border-zinc-500 dark:hover:border-zinc-400"
        style={{ padding: 0 }}
        onClick={onConfigure}
      >
        {/* Icono grande superior */}
        <div className="card-image-large-placeholder">
          {FunctionIcon && (
            <FunctionIcon
              size={64}
              strokeWidth={1.5}
              className="text-zinc-400 dark:text-zinc-500"
            />
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 flex flex-col p-4">
          {/* Header con título y badge */}
          <div className="flex items-start justify-between mb-2 gap-2">
            <h3 className="card-title flex-1">{aiFunction.name}</h3>
            {getStatusBadge()}
          </div>

          {/* Descripción */}
          <p className="card-description mb-3">
            {aiFunction.description}
          </p>

          {/* Info de proveedor si está configurado */}
          {isConfigured && provider && (
            <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg mb-3">
              {ProviderIcon && (
                <ProviderIcon
                  size={18}
                  strokeWidth={2}
                  className="text-zinc-600 dark:text-zinc-400"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-900 dark:text-white truncate">
                  {provider.name}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                  {activeConfig.model}
                </p>
              </div>
            </div>
          )}

          {/* Preview de imagen generada (solo para funciones de imagen) */}
          {isImageFunction && generatedImageUrl && (
            <div className="mb-3 rounded-lg overflow-hidden border-2 border-purple-300 dark:border-purple-700">
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

          {/* Spacer para empujar el botón abajo */}
          <div className="flex-1"></div>

          {/* Botones - Quick test para imágenes */}
          {isImageFunction && isConfigured && (
            <BaseButton
              variant="outline"
              icon={Sparkles}
              onClick={handleQuickImageTest}
              disabled={testingImage}
              loading={testingImage}
              fullWidth
              size="sm"
              className="mb-2"
            >
              {testingImage ? 'Generando...' : 'Prueba Rápida'}
            </BaseButton>
          )}

          {/* Botón configurar */}
          <BaseButton
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
        </div>
      </div>
    );
  }

  // Vista List (horizontal)
  return (
    <div
      className="card card-list cursor-pointer transition-all duration-300 hover:border-zinc-500 dark:hover:border-zinc-400"
      onClick={onConfigure}
    >
      {/* Icono pequeño */}
      <div className="card-image-placeholder-sm">
        {FunctionIcon && (
          <FunctionIcon
            size={32}
            strokeWidth={2}
            className="text-zinc-400 dark:text-zinc-500"
          />
        )}
      </div>

      {/* Contenido principal */}
      <div className="flex-1 min-w-0 p-4">
        <div className="flex gap-4 items-start">
          <div className="flex-1 min-w-0">
            <h3 className="card-title">{aiFunction.name}</h3>
            <p className="card-description">{aiFunction.description}</p>

            {/* Info de proveedor inline */}
            {isConfigured && provider && (
              <div className="flex items-center gap-2 mt-2">
                {ProviderIcon && (
                  <ProviderIcon
                    size={14}
                    strokeWidth={2}
                    className="text-zinc-600 dark:text-zinc-400"
                  />
                )}
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {provider.name} · {activeConfig.model}
                </span>
              </div>
            )}
          </div>

          {/* Badge y botón a la derecha */}
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge()}
            <BaseButton
              variant={isConfigured ? "secondary" : "primary"}
              icon={Settings}
              onClick={(e) => {
                e.stopPropagation();
                onConfigure();
              }}
              size="sm"
            >
              Configurar
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIFunctionCard;
