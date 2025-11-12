/**
 * @fileoverview Sección de credencial individual (componente reutilizable)
 * @module components/settings/CredentialSection
 *
 * Componente que muestra la configuración de un proveedor de IA específico:
 * - Información del proveedor
 * - Campo de API key con show/hide
 * - Botón de test de conexión
 * - Lista de servicios disponibles
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Eye,
  EyeOff,
  ExternalLink,
  Loader,
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react';
import { BaseCard, BaseButton, BaseBadge } from '../common';

/**
 * Colores por proveedor
 */
const PROVIDER_COLORS = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: 'text-emerald-600 dark:text-emerald-400'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    icon: 'text-orange-600 dark:text-orange-400'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    icon: 'text-purple-600 dark:text-purple-400'
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-600 dark:text-blue-400'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    icon: 'text-red-600 dark:text-red-400'
  }
};

function CredentialSection({ provider, value, onChange, onTest, testResult }) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const colors = PROVIDER_COLORS[provider.color] || PROVIDER_COLORS.purple;
  const hasValue = value && value.trim().length > 0;

  /**
   * Manejar test de conexión
   */
  const handleTest = () => {
    if (onTest) {
      onTest(value);
    }
  };

  /**
   * Renderizar estado del test
   */
  const renderTestStatus = () => {
    if (!testResult) return null;

    const statusConfig = {
      testing: {
        icon: Loader,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800'
      },
      success: {
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800'
      },
      error: {
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800'
      }
    };

    const config = statusConfig[testResult.status];
    if (!config) return null;

    const StatusIcon = config.icon;

    return (
      <div className={`flex items-center gap-2 p-3 rounded-lg border ${config.bgColor} ${config.borderColor} mt-3`}>
        <StatusIcon
          size={20}
          className={`flex-shrink-0 ${config.color} ${testResult.status === 'testing' ? 'animate-spin' : ''}`}
        />
        <span className={`text-sm font-medium ${config.color}`}>
          {testResult.message}
        </span>
      </div>
    );
  };

  return (
    <BaseCard className="overflow-hidden">
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 cursor-pointer ${colors.bg} ${colors.border} border-b`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="text-3xl flex-shrink-0">
            {provider.icon}
          </div>

          {/* Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white m-0 flex items-center gap-2">
              {provider.name}
              {hasValue && (
                <BaseBadge variant="success" size="sm">
                  Configurado
                </BaseBadge>
              )}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 m-0">
              {provider.description}
            </p>
          </div>
        </div>

        {/* Expand Arrow */}
        <div className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Content (Expandible) */}
      {isExpanded && (
        <div className="p-6 space-y-4">
          {/* API Key Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={`Ingresa tu ${provider.name} API key`}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <BaseButton
                variant="outline"
                onClick={handleTest}
                disabled={!hasValue || testResult?.status === 'testing'}
                loading={testResult?.status === 'testing'}
              >
                Probar
              </BaseButton>
            </div>
          </div>

          {/* Test Result */}
          {renderTestStatus()}

          {/* Documentation Link */}
          <a
            href={provider.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
          >
            <ExternalLink size={16} />
            ¿Dónde obtengo mi API key?
          </a>

          {/* Services List */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className={colors.icon} />
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 m-0">
                Servicios disponibles:
              </h4>
            </div>
            <ul className="space-y-2">
              {provider.services.map((service, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <CheckCircle size={16} className={`flex-shrink-0 mt-0.5 ${colors.icon}`} />
                  {service}
                </li>
              ))}
            </ul>
          </div>

          {/* Info Banner */}
          <div className={`flex items-start gap-2 p-3 rounded-lg ${colors.bg} ${colors.border} border`}>
            <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`text-xs ${colors.text} m-0`}>
              Las credenciales se guardan de forma segura en Firebase. Las funciones de IA configuradas en "Tareas IA" usarán automáticamente estas API keys.
            </p>
          </div>
        </div>
      )}
    </BaseCard>
  );
}

CredentialSection.propTypes = {
  provider: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    services: PropTypes.arrayOf(PropTypes.string).isRequired,
    apiKeyField: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    color: PropTypes.oneOf(['emerald', 'orange', 'purple', 'blue', 'red']).isRequired,
    docsUrl: PropTypes.string.isRequired,
    testEndpoint: PropTypes.string
  }).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onTest: PropTypes.func,
  testResult: PropTypes.shape({
    status: PropTypes.oneOf(['testing', 'success', 'error']).isRequired,
    message: PropTypes.string.isRequired
  })
};

export default CredentialSection;
