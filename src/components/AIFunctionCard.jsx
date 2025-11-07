/**
 * @fileoverview AI Function Card Component
 * @module components/AIFunctionCard
 */

import { Settings, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { BaseCard, BaseButton, BaseBadge } from './common';
import { getProviderById } from '../constants/aiFunctions';

function AIFunctionCard({ aiFunction, config, onConfigure }) {
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

  return (
    <BaseCard hover>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {FunctionIcon && <FunctionIcon size={32} strokeWidth={2} className="text-zinc-600 dark:text-zinc-400" />}
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                {aiFunction.name}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                {aiFunction.description}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Provider Info */}
        {isConfigured && provider && (
          <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            {ProviderIcon && <ProviderIcon size={24} strokeWidth={2} className="text-zinc-600 dark:text-zinc-400" />}
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                {provider.name}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {config.model}
              </p>
            </div>
          </div>
        )}

        {/* Configure Button */}
        <BaseButton
          variant={isConfigured ? "secondary" : "primary"}
          icon={Settings}
          onClick={onConfigure}
          fullWidth
        >
          {isConfigured ? 'Configurar' : 'Configurar función'}
        </BaseButton>
      </div>
    </BaseCard>
  );
}

export default AIFunctionCard;
