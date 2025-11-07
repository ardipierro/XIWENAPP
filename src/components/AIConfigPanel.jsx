/**
 * @fileoverview AI Configuration Panel for Admin - Function-based approach
 * @module components/AIConfigPanel
 */

import { useState, useEffect } from 'react';
import { Lightbulb, Save, Filter } from 'lucide-react';
import { getAIConfig, saveAIConfig } from '../firebase/aiConfig';
import logger from '../utils/logger';
import {
  BaseButton,
  BaseLoading,
  BaseAlert,
  BaseBadge
} from './common';
import PageHeader from './common/PageHeader';
import AIFunctionCard from './AIFunctionCard';
import AIFunctionConfigModal from './AIFunctionConfigModal';
import { AI_FUNCTIONS, AI_CATEGORIES } from '../constants/aiFunctions';

function AIConfigPanel() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getAIConfig();

      if (result && result.functions) {
        setConfig(result);
        logger.info('AI config loaded successfully');
      } else {
        // Initialize with default config if none exists
        const defaultConfig = {
          functions: {}
        };

        // Add default config for each function
        AI_FUNCTIONS.forEach(func => {
          defaultConfig.functions[func.id] = func.defaultConfig;
        });

        setConfig(defaultConfig);
        logger.info('Initialized with default AI config');
      }
    } catch (err) {
      logger.error('Failed to load AI config:', err);

      // Fallback to default config on error
      const defaultConfig = {
        functions: {}
      };

      AI_FUNCTIONS.forEach(func => {
        defaultConfig.functions[func.id] = func.defaultConfig;
      });

      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureFunction = (functionId) => {
    const func = AI_FUNCTIONS.find(f => f.id === functionId);
    if (func) {
      setSelectedFunction(func);
      setModalOpen(true);
    }
  };

  const handleSaveFunction = async (functionId, functionConfig) => {
    try {
      const updatedConfig = {
        ...config,
        functions: {
          ...config.functions,
          [functionId]: functionConfig
        }
      };

      await saveAIConfig(updatedConfig);
      setConfig(updatedConfig);
      setSuccess('Configuración guardada exitosamente');
      logger.info('AI function config saved:', functionId);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error('Failed to save AI function config:', err);
      throw err;
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError(null);

      await saveAIConfig(config);
      setSuccess('Toda la configuración guardada exitosamente');
      logger.info('All AI config saved');

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error('Failed to save AI config:', err);
      setError(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getFilteredFunctions = () => {
    if (!selectedCategory) {
      return AI_FUNCTIONS;
    }
    return AI_FUNCTIONS.filter(f => f.category === selectedCategory);
  };

  const getEnabledCount = () => {
    if (!config || !config.functions) return 0;
    return Object.values(config.functions).filter(f => f.enabled).length;
  };

  const getConfiguredCount = () => {
    if (!config || !config.functions) return 0;
    return Object.values(config.functions).filter(f => f.apiKey && f.apiKey.length > 0).length;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner"></div>
        <p className="ml-4 text-zinc-600 dark:text-zinc-300">Cargando configuración de IA...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div>
        <BaseAlert variant="danger" title="Error">
          No se pudo cargar la configuración de IA. Por favor, recarga la página.
        </BaseAlert>
      </div>
    );
  }

  const filteredFunctions = getFilteredFunctions();

  return (
    <div className="ai-config-panel">
      {/* Header */}
      <PageHeader
        icon={Lightbulb}
        title="Configuración de IA"
      />

      {/* Description and Stats */}
      <div className="mb-6">
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          Configura diferentes funciones de IA para tu plataforma educativa
        </p>

        <div className="flex gap-4">
          <BaseBadge variant="success" size="lg">
            {getEnabledCount()} funciones activas
          </BaseBadge>
          <BaseBadge variant="default" size="lg">
            {getConfiguredCount()} de {AI_FUNCTIONS.length} configuradas
          </BaseBadge>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <BaseAlert
          variant="danger"
          title="Error"
          dismissible
          onDismiss={() => setError(null)}
          className="mb-6"
        >
          {error}
        </BaseAlert>
      )}

      {success && (
        <BaseAlert
          variant="success"
          title="Éxito"
          dismissible
          onDismiss={() => setSuccess(null)}
          className="mb-6"
        >
          {success}
        </BaseAlert>
      )}

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        <BaseButton
          variant={selectedCategory === null ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          Todas ({AI_FUNCTIONS.length})
        </BaseButton>
        {AI_CATEGORIES.map(category => {
          const count = AI_FUNCTIONS.filter(f => f.category === category.id).length;
          return (
            <BaseButton
              key={category.id}
              variant={selectedCategory === category.id ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.icon} {category.label} ({count})
            </BaseButton>
          );
        })}
      </div>

      {/* Functions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {filteredFunctions.map(func => (
          <AIFunctionCard
            key={func.id}
            aiFunction={func}
            config={config.functions[func.id]}
            onConfigure={() => handleConfigureFunction(func.id)}
          />
        ))}
      </div>

      {/* Save All Button */}
      <div className="flex justify-end mt-6">
        <BaseButton
          variant="primary"
          icon={Save}
          onClick={handleSaveAll}
          loading={saving}
          size="lg"
        >
          Guardar Toda la Configuración
        </BaseButton>
      </div>

      {/* Configuration Modal */}
      {selectedFunction && modalOpen && (
        <AIFunctionConfigModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedFunction(null);
          }}
          aiFunction={selectedFunction}
          initialConfig={config.functions[selectedFunction.id]}
          onSave={handleSaveFunction}
        />
      )}
    </div>
  );
}

export default AIConfigPanel;
