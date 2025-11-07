/**
 * @fileoverview AI Configuration Panel for Admin - Function-based approach
 * @module components/AIConfigPanel
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Lightbulb, Filter, Settings, Plus } from 'lucide-react';
import { getAIConfig, saveAIConfig } from '../firebase/aiConfig';
import logger from '../utils/logger';
import {
  BaseButton,
  BaseAlert,
  BaseBadge,
  BaseEmptyState
} from './common';
import PageHeader from './common/PageHeader';
import SearchBar from './common/SearchBar';
import AIFunctionCard from './AIFunctionCard';
import AIFunctionConfigModal from './AIFunctionConfigModal';
import { AI_FUNCTIONS, AI_CATEGORIES } from '../constants/aiFunctions';

function AIConfigPanel() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
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

  const handleConfigureFunction = useCallback((functionId) => {
    const func = AI_FUNCTIONS.find(f => f.id === functionId);
    if (func) {
      setSelectedFunction(func);
      setModalOpen(true);
    }
  }, []);

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


  const getFilteredFunctions = () => {
    let filtered = AI_FUNCTIONS;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(f => f.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(search) ||
        f.description.toLowerCase().includes(search)
      );
    }

    return filtered;
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
        actionLabel="+ Crear Nueva Configuración"
        onAction={() => {
          // TODO: Implementar creación de nueva función
          logger.info('Create new AI function clicked');
        }}
      />

      {/* Description and Stats */}
      <div className="mb-6">
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          Configura diferentes funciones de IA para tu plataforma educativa
        </p>

        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-4">
            <BaseBadge variant="success" size="lg">
              {getEnabledCount()} funciones activas
            </BaseBadge>
            <BaseBadge variant="default" size="lg">
              {getConfiguredCount()} de {AI_FUNCTIONS.length} configuradas
            </BaseBadge>
          </div>
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

      {/* Search Bar */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar funciones de IA..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        className="mb-6"
      />

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
          const CategoryIcon = category.icon;
          return (
            <BaseButton
              key={category.id}
              variant={selectedCategory === category.id ? 'primary' : 'secondary'}
              size="sm"
              icon={CategoryIcon}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label} ({count})
            </BaseButton>
          );
        })}
      </div>

      {/* Functions Grid/List or Empty State */}
      {filteredFunctions.length === 0 ? (
        <BaseEmptyState
          icon={Settings}
          title={searchTerm ? "No se encontraron funciones" : "No hay funciones en esta categoría"}
          description={searchTerm ? "Intenta con otros términos de búsqueda" : "Selecciona otra categoría para ver las funciones disponibles"}
          size="lg"
        />
      ) : viewMode === 'grid' ? (
        /* Vista Grilla */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {filteredFunctions.map(func => (
            <AIFunctionCard
              key={func.id}
              aiFunction={func}
              config={config.functions[func.id]}
              onConfigure={() => handleConfigureFunction(func.id)}
              viewMode="grid"
            />
          ))}
        </div>
      ) : (
        /* Vista Lista */
        <div className="flex flex-col gap-3 mb-6">
          {filteredFunctions.map(func => (
            <AIFunctionCard
              key={func.id}
              aiFunction={func}
              config={config.functions[func.id]}
              onConfigure={() => handleConfigureFunction(func.id)}
              viewMode="list"
            />
          ))}
        </div>
      )}

      {/* Configuration Modal - usando Portal */}
      {selectedFunction && createPortal(
        <AIFunctionConfigModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedFunction(null);
          }}
          aiFunction={selectedFunction}
          initialConfig={config.functions[selectedFunction.id]}
          onSave={handleSaveFunction}
        />,
        document.body
      )}
    </div>
  );
}

export default AIConfigPanel;
