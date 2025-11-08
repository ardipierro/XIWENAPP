/**
 * @fileoverview AI Function Card - Vista individual de función de IA
 * @module components/AIFunctionCard
 */

import { Settings, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { BaseButton, BaseBadge } from './common';
import { getProviderById } from '../constants/aiFunctions';
import logger from '../utils/logger';

/**
 * Card de función de IA - soporta vista grid y list
 */
function AIFunctionCard({ aiFunction, config, onConfigure, viewMode = 'grid', credentials = null }) {
  // Usar defaultConfig si no hay config guardada
  const activeConfig = config || aiFunction.defaultConfig;

  const isConfigured = activeConfig?.provider && activeConfig?.model;
  const isEnabled = activeConfig?.enabled || false;
  const provider = activeConfig?.provider ? getProviderById(activeConfig.provider) : null;

  // Check if credentials are configured for this provider
  const hasCredentials = credentials && activeConfig?.provider
    ? credentials[activeConfig.provider] || false
    : false;

  // Debug logging
  logger.debug(`[AIFunctionCard] ${aiFunction.name}:`, {
    isConfigured,
    isEnabled,
    hasCredentials,
    provider: activeConfig?.provider,
    credentials
  });

  const FunctionIcon = aiFunction.icon;
  const ProviderIcon = provider?.icon;

  // Determinar badge de estado
  const getStatusBadge = () => {
    if (!isConfigured) {
      return (
        <BaseBadge variant="default" size="sm" icon={XCircle}>
          Sin configurar
        </BaseBadge>
      );
    }

    // Check credentials status - PRIORITY: If configured with credentials, show green
    if (isConfigured && hasCredentials) {
      return (
        <BaseBadge variant="success" size="sm" icon={CheckCircle}>
          {isEnabled ? 'Activo' : 'Listo'}
        </BaseBadge>
      );
    }

    // If configured but no credentials
    if (isConfigured && !hasCredentials) {
      return (
        <BaseBadge variant="warning" size="sm" icon={AlertCircle}>
          Sin credenciales
        </BaseBadge>
      );
    }

    return (
      <BaseBadge variant="warning" size="sm" icon={AlertCircle}>
        Inactivo
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
                {hasCredentials && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                    <CheckCircle size={12} />
                    Credenciales OK
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Spacer para empujar el botón abajo */}
          <div className="flex-1"></div>

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
                {hasCredentials && (
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle size={12} />
                    Credenciales OK
                  </span>
                )}
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
