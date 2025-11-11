/**
 * @fileoverview AI Configuration Panel - Panel principal de configuración de IA
 * @module components/AIConfigPanel
 */

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Lightbulb, Filter, Settings } from 'lucide-react';
import { getAIConfig, saveAIConfig, checkAICredentials } from '../firebase/aiConfig';
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
  // ============================================================================
  // ESTADO - Definir TODO el estado al principio
  // ============================================================================
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [credentials, setCredentials] = useState({
    claude: true,
    openai: true,
    gemini: true,
    grok: true
  });


  // ============================================================================
  // EFECTOS - Cargar config al montar
  // ============================================================================
  useEffect(() => {
    loadConfig();
    loadCredentials();
  }, []);

  /**
   * Cargar estado de credenciales desde Secret Manager Y localStorage
   */
  const loadCredentials = async () => {
    try {
      logger.info('[AIConfigPanel] Loading credentials...');

      // PASO 1: Cargar desde Firebase Secret Manager
      const firebaseCredentials = await checkAICredentials();
      logger.info('[AIConfigPanel] Firebase credentials loaded:', firebaseCredentials);

      // PASO 2: Verificar localStorage para todos los proveedores
      // IMPORTANTE: localStorage usa provider.name (ej: "Google") no provider.id (ej: "google")
      // DEBUG: Imprimir TODAS las keys de localStorage que empiecen con ai_credentials_
      console.log('🔍 [DEBUG] All localStorage keys:', Object.keys(localStorage));
      const allAIKeys = Object.keys(localStorage).filter(k => k.startsWith('ai_credentials_'));
      console.log('🔍 [DEBUG] AI credential keys found:', allAIKeys);

      const localGoogleCred = localStorage.getItem('ai_credentials_Google');
      const localClaudeCred = localStorage.getItem('ai_credentials_Claude');
      const localOpenAICred = localStorage.getItem('ai_credentials_OpenAI');
      const localGrokCred = localStorage.getItem('ai_credentials_Grok');

      console.log('🔍 [DEBUG] localStorage values:', {
        'ai_credentials_Google': localGoogleCred ? '✅ EXISTS' : '❌ NULL',
        'ai_credentials_Claude': localClaudeCred ? '✅ EXISTS' : '❌ NULL',
        'ai_credentials_OpenAI': localOpenAICred ? '✅ EXISTS' : '❌ NULL',
        'ai_credentials_Grok': localGrokCred ? '✅ EXISTS' : '❌ NULL'
      });

      // PASO 3: Combinar ambas fuentes
      // Provider ID en config (minúscula) -> localStorage key (PascalCase)
      const combinedCredentials = {
        ...firebaseCredentials,
        // Si hay credenciales en localStorage O en Firebase, marcar como true
        google: firebaseCredentials.google || !!localGoogleCred,
        claude: firebaseCredentials.claude || !!localClaudeCred,
        openai: firebaseCredentials.openai || !!localOpenAICred,
        grok: firebaseCredentials.grok || !!localGrokCred
      };

      console.log('🔍 [DEBUG] Combined credentials:', combinedCredentials);
      logger.info('[AIConfigPanel] Combined credentials:', combinedCredentials);
      setCredentials(combinedCredentials);
      logger.info('AI credentials status loaded:', combinedCredentials);
    } catch (err) {
      logger.error('[AIConfigPanel] Failed to load credentials:', err);
      logger.error('Failed to load credentials status:', err);

      // FALLBACK: Verificar al menos localStorage
      const localGoogleCred = localStorage.getItem('ai_credentials_Google');
      const localClaudeCred = localStorage.getItem('ai_credentials_Claude');
      const localOpenAICred = localStorage.getItem('ai_credentials_OpenAI');
      const localGrokCred = localStorage.getItem('ai_credentials_Grok');

      const fallbackCreds = {
        claude: !!localClaudeCred,
        openai: !!localOpenAICred,
        google: !!localGoogleCred,
        grok: !!localGrokCred
      };

      console.log('🔍 [DEBUG] Fallback credentials:', fallbackCreds);
      setCredentials(fallbackCreds);
      logger.info('[AIConfigPanel] Using localStorage fallback credentials');
      logger.info('Using localStorage fallback credentials status');
    }
  };

  // ============================================================================
  // FUNCIONES - Lógica de negocio
  // ============================================================================

  /**
   * Cargar configuración desde Firebase
   * CRÍTICO: Siempre inicializar con estructura válida
   */
  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getAIConfig();

      // PASO 1: Crear config default con todas las funciones
      const defaultConfig = { functions: {} };
      AI_FUNCTIONS.forEach(func => {
        defaultConfig.functions[func.id] = func.defaultConfig;
      });

      // PASO 2: Mergear con config de Firebase si existe
      if (result && result.functions) {
        const mergedConfig = {
          functions: {
            ...defaultConfig.functions,
            ...result.functions
          }
        };
        setConfig(mergedConfig);
        logger.info('AI config loaded and merged');
      } else {
        // Si no hay config en Firebase, usar default
        setConfig(defaultConfig);
        logger.info('Using default AI config');
      }
    } catch (err) {
      logger.error('Failed to load AI config:', err);
      setError('Error al cargar configuración');

      // FALLBACK: Usar config default incluso en error
      const defaultConfig = { functions: {} };
      AI_FUNCTIONS.forEach(func => {
        defaultConfig.functions[func.id] = func.defaultConfig;
      });
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Abrir modal de configuración
   */
  const handleConfigureFunction = (functionId) => {
    const func = AI_FUNCTIONS.find(f => f.id === functionId);
    if (func) {
      setSelectedFunction(func);
      setModalOpen(true);
    }
  };

  /**
   * Guardar configuración de función
   * CRÍTICO: Actualizar estado inmediatamente después de guardar en Firebase
   */
  const handleSaveFunction = async (functionId, functionConfig) => {
    try {
      // PASO 1: Crear nuevo config con la función actualizada
      const updatedConfig = {
        ...config,
        functions: {
          ...config.functions,
          [functionId]: functionConfig
        }
      };

      // PASO 2: Guardar en Firebase
      await saveAIConfig(updatedConfig);

      // PASO 3: Actualizar estado local INMEDIATAMENTE
      // Esto previene que las cards desaparezcan
      setConfig(updatedConfig);

      setSuccess('Configuración guardada exitosamente');
      logger.info('AI function config saved:', functionId);

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error('Failed to save AI function config:', err);
      setError(`Error al guardar: ${err.message}`);
      throw err;
    }
  };

  /**
   * Cerrar modal
   * CRÍTICO: NO modificar config aquí, solo cerrar
   */
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedFunction(null);
    setSearchTerm(''); // Limpiar búsqueda al cerrar modal
  };

  /**
   * Filtrar funciones por categoría y búsqueda
   */
  const getFilteredFunctions = () => {
    let filtered = [...AI_FUNCTIONS];

    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filtered.filter(f => f.category === selectedCategory);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(search) ||
        f.description.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  /**
   * Stats helpers
   */
  const getEnabledCount = () => {
    if (!config || !config.functions) return 0;
    return Object.values(config.functions).filter(f => f.enabled).length;
  };

  const getConfiguredCount = () => {
    if (!config || !config.functions) return 0;
    return Object.values(config.functions).filter(f => f.provider && f.model).length;
  };

  // ============================================================================
  // HOOKS MEMOIZADOS - ANTES de returns condicionales
  // ============================================================================
  const filteredFunctions = useMemo(() => {
    return getFilteredFunctions();
  }, [selectedCategory, searchTerm]);

  // ============================================================================
  // RENDERS CONDICIONALES - Después de todos los hooks
  // ============================================================================
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner"></div>
        <p className="ml-4 text-zinc-600 dark:text-zinc-300">
          Cargando configuración de IA...
        </p>
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

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================
  return (
    <div className="ai-config-panel">
      {/* Header */}
      <PageHeader
        icon={Lightbulb}
        title="Configuración de IA"
        actionLabel="+ Crear Nueva Configuración"
        onAction={() => {
          const newFunction = {
            id: `custom_${Date.now()}`,
            name: 'Nueva Función de IA',
            description: 'Configura esta función personalizada',
            icon: Settings,
            category: 'content',
            defaultConfig: {
              enabled: false,
              provider: '',
              model: '',
              apiKey: '',
              systemPrompt: '',
              parameters: {
                temperature: 0.7,
                maxTokens: 2000,
                topP: 1
              }
            }
          };
          setSelectedFunction(newFunction);
          setModalOpen(true);
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
          description={searchTerm ? "Intenta con otros términos de búsqueda" : "Selecciona otra categoría"}
          size="lg"
        />
      ) : viewMode === 'grid' ? (
        /* Vista Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {filteredFunctions.map(func => (
            <AIFunctionCard
              key={func.id}
              aiFunction={func}
              config={config.functions[func.id]}
              onConfigure={() => handleConfigureFunction(func.id)}
              viewMode="grid"
              credentials={credentials}
            />
          ))}
        </div>
      ) : (
        /* Vista List */
        <div className="flex flex-col gap-3 mb-6">
          {filteredFunctions.map(func => (
            <AIFunctionCard
              key={func.id}
              aiFunction={func}
              config={config.functions[func.id]}
              onConfigure={() => handleConfigureFunction(func.id)}
              viewMode="list"
              credentials={credentials}
            />
          ))}
        </div>
      )}

      {/* Configuration Modal - Portal */}
      {modalOpen && selectedFunction && createPortal(
        <AIFunctionConfigModal
          key={selectedFunction.id}
          isOpen={modalOpen}
          onClose={handleCloseModal}
          aiFunction={selectedFunction}
          initialConfig={config.functions[selectedFunction.id] || selectedFunction.defaultConfig}
          onSave={handleSaveFunction}
        />,
        document.body
      )}
    </div>
  );
}

export default AIConfigPanel;
