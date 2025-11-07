/**
 * @fileoverview AI Function Card Component
 * @module components/AIFunctionCard
 */

import { Settings, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { BaseButton, BaseBadge } from './common';
import { getProviderById } from '../constants/aiFunctions';

function AIFunctionCard({ aiFunction, config, onConfigure, viewMode = 'grid' }) {
  const isConfigured = config?.apiKey && config?.apiKey.length > 0;
  const isEnabled = config?.enabled || false;
  const provider = config?.provider ? getProviderById(config.provider) : null;
  const FunctionIcon = aiFunction.icon;
  const ProviderIcon = provider?.icon;

  const getStatusBadge = () => {
    if (!isConfigured) {
      return (
        <BaseBadge variant="default" size="sm">
          <XCircle className="w-3 h-3 mr-1" />
          Sin configurar
        </BaseBadge>
      );
    }

    if (isEnabled) {
      return (
        <BaseBadge variant="success" size="sm">
          <CheckCircle className="w-3 h-3 mr-1" />
          Activo
        </BaseBadge>
      );
    }

    return (
      <BaseBadge variant="warning" size="sm">
        <AlertCircle className="w-3 h-3 mr-1" />
        Inactivo
      </BaseBadge>
    );
  };

  // Grid View
  if (viewMode === 'grid') {
    return (
      <div
        className="card card-grid-item flex flex-col cursor-pointer transition-all duration-300 overflow-hidden"
        style={{ padding: 0 }}
        onClick={onConfigure}
        title="Click para configurar función"
      >
        {/* Image Placeholder - Top half */}
        <div className="card-image-large-placeholder">
          {FunctionIcon && <FunctionIcon size={64} strokeWidth={1.5} className="text-zinc-400 dark:text-zinc-500" />}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-4">
          {/* Header with badge */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="card-title flex-1">{aiFunction.name}</h3>
            {getStatusBadge()}
          </div>

          {/* Description */}
          <p className="card-description mb-3">
            {aiFunction.description}
          </p>

          {/* Provider Info */}
          {isConfigured && provider && (
            <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg mb-3">
              {ProviderIcon && <ProviderIcon size={18} strokeWidth={2} className="text-zinc-600 dark:text-zinc-400" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-900 dark:text-white truncate">
                  {provider.name}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                  {config.model}
                </p>
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Configure Button */}
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

  // List View
  return (
    <div
      className="card card-list cursor-pointer transition-all duration-300"
      onClick={onConfigure}
      title="Click para configurar función"
    >
      {/* Icon pequeño */}
      <div className="card-image-placeholder-sm">
        {FunctionIcon && <FunctionIcon size={32} strokeWidth={2} className="text-zinc-400 dark:text-zinc-500" />}
      </div>

      {/* Content principal */}
      <div className="flex-1 min-w-0 p-4">
        <div className="flex gap-4 items-start">
          <div className="flex-1 min-w-0">
            <h3 className="card-title">{aiFunction.name}</h3>
            <p className="card-description">{aiFunction.description}</p>

            {/* Provider info inline */}
            {isConfigured && provider && (
              <div className="flex items-center gap-2 mt-2">
                {ProviderIcon && <ProviderIcon size={14} strokeWidth={2} className="text-zinc-600 dark:text-zinc-400" />}
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {provider.name} · {config.model}
                </span>
              </div>
            )}
          </div>

          {/* Badge and button */}
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
