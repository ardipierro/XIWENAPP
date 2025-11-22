import { useState, useEffect, useRef } from 'react';
import { Key, CheckCircle, XCircle, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { getAIConfig, saveAIConfig } from '../../firebase/aiConfig';
import { BaseAlert, BaseLoading, BaseBadge } from '../common';
import SearchBar from '../common/SearchBar';
import CredentialConfigModal from './CredentialConfigModal';
import AddCustomCredentialModal from './AddCustomCredentialModal';
import logger from '../../utils/logger';
import { UniversalCard } from '../cards';

// ============================================================================
// CACHE EN MEMORIA
// ============================================================================
// Cache para evitar llamadas repetidas durante la sesión
const credentialsCache = {
  config: null,
  backendCreds: null,
  timestamp: null,
  CACHE_DURATION: 5 * 60 * 1000 // 5 minutos
};

function isCacheValid() {
  if (!credentialsCache.timestamp) return false;
  return Date.now() - credentialsCache.timestamp < credentialsCache.CACHE_DURATION;
}

// ============================================================================
// PROVIDER CONFIGURATION
// ============================================================================

const AI_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'ChatGPT, DALL-E 3, Whisper',
    services: ['ChatGPT (GPT-4, GPT-4o)', 'DALL-E 3 (Generación de imágenes)', 'Whisper (Speech-to-Text)'],
    apiKeyField: 'openai_api_key',
    icon: '🤖',
    color: 'emerald',
    docsUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3 (Opus, Sonnet, Haiku)',
    services: ['Claude 3 Opus (Máxima capacidad)', 'Claude 3 Sonnet (Balanceado)', 'Claude 3 Haiku (Rápido)'],
    apiKeyField: 'anthropic_api_key',
    icon: '🧠',
    color: 'orange',
    docsUrl: 'https://console.anthropic.com/settings/keys'
  },
  {
    id: 'stability',
    name: 'Stability AI',
    description: 'Stable Diffusion, ilustraciones',
    services: ['Stable Diffusion XL (Ilustraciones)', 'Stable Image Ultra (Alta calidad)', 'Image Upscaler'],
    apiKeyField: 'stability_api_key',
    icon: '🎨',
    color: 'purple',
    docsUrl: 'https://platform.stability.ai/account/keys'
  },
  {
    id: 'replicate',
    name: 'Replicate',
    description: 'Flux, SDXL, múltiples modelos',
    services: ['Flux Pro (Imágenes realistas)', 'SDXL (Arte generativo)', 'ControlNet'],
    apiKeyField: 'replicate_api_key',
    icon: '🔮',
    color: 'indigo',
    docsUrl: 'https://replicate.com/account/api-tokens'
  },
  {
    id: 'leonardo',
    name: 'Leonardo.ai',
    description: 'Generación de imágenes y arte',
    services: ['Leonardo Diffusion XL', 'PhotoReal', 'Alchemy Upscaler'],
    apiKeyField: 'leonardo_api_key',
    icon: '🖼️',
    color: 'pink',
    docsUrl: 'https://app.leonardo.ai/settings'
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    description: 'Modelos de IA open source',
    services: ['Inference API', 'Stable Diffusion', 'Múltiples modelos'],
    apiKeyField: 'huggingface_api_key',
    icon: '🤗',
    color: 'yellow',
    docsUrl: 'https://huggingface.co/settings/tokens'
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Text-to-Speech premium',
    services: ['Voces naturales multiidioma', 'Clonación de voz', 'Control de emociones'],
    apiKeyField: 'elevenlabs_api_key',
    icon: '🎙️',
    color: 'blue',
    docsUrl: 'https://elevenlabs.io/app/settings/api-keys'
  },
  {
    id: 'google',
    name: 'Google Cloud',
    description: 'Gemini Pro, Cloud TTS',
    services: ['Gemini Pro (Multimodal)', 'Cloud Text-to-Speech', 'Cloud Translation'],
    apiKeyField: 'google_api_key',
    icon: '🔍',
    color: 'red',
    docsUrl: 'https://console.cloud.google.com/apis/credentials'
  },
  {
    id: 'xai',
    name: 'xAI',
    description: 'Grok - Conversación y análisis',
    services: ['Grok (Conversación avanzada)', 'Análisis de contexto', 'Respuestas en tiempo real'],
    apiKeyField: 'grok_api_key',
    icon: '𝕏',
    color: 'slate',
    docsUrl: 'https://console.x.ai/'
  }
];

const PROVIDER_COLORS = {
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' },
  blue: { bg: 'bg-gray-50 dark:bg-gray-800/20', border: 'border-gray-200 dark:border-gray-700' },
  red: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-200 dark:border-pink-800' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800' },
  slate: { bg: 'bg-slate-50 dark:bg-slate-900/20', border: 'border-slate-200 dark:border-slate-800' }
};

// ============================================================================
// NAMING MAPPINGS - CENTRALIZED
// ============================================================================
// Hay 3 fuentes de credenciales, cada una usa nombres diferentes:
// 1. localStorage: ai_credentials_OpenAI, ai_credentials_Claude, etc
// 2. Firestore functions[].provider: openai, claude, google, grok, elevenlabs
// 3. Backend Secret Manager: openai, claude, gemini, grok, elevenlabs

const PROVIDER_MAPPINGS = {
  openai: {
    localStorageName: 'OpenAI',
    firebaseName: 'openai',
    backendName: 'openai'
  },
  anthropic: {
    localStorageName: 'Claude',
    firebaseName: 'claude',
    backendName: 'claude'
  },
  stability: {
    localStorageName: 'Stability',
    firebaseName: 'stability',
    backendName: null
  },
  replicate: {
    localStorageName: 'Replicate',
    firebaseName: 'replicate',
    backendName: null
  },
  leonardo: {
    localStorageName: 'Leonardo',
    firebaseName: 'leonardo',
    backendName: null
  },
  huggingface: {
    localStorageName: 'HuggingFace',
    firebaseName: 'huggingface',
    backendName: null
  },
  elevenlabs: {
    localStorageName: 'elevenlabs',  // lowercase para compatibilidad con premiumTTSService
    firebaseName: 'elevenlabs',
    backendName: 'elevenlabs'
  },
  google: {
    localStorageName: 'Google',
    firebaseName: 'google',
    backendName: 'gemini'  // ⚠️ Backend usa 'gemini', no 'google'
  },
  xai: {
    localStorageName: 'Grok',
    firebaseName: 'grok',
    backendName: 'grok'
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

function CredentialsTab() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [credentials, setCredentials] = useState({});
  const [backendCredentials, setBackendCredentials] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filter, setFilter] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customCredentials, setCustomCredentials] = useState([]);
  const hasLoadedRef = useRef(false);

  // ============================================================================
  // INITIALIZATION - LAZY LOADING
  // ============================================================================
  // Solo cargar cuando el componente se monta por primera vez
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadAllCredentials();
    }
  }, []);

  // Limpiar searchTerm si contiene email (autofill del navegador)
  useEffect(() => {
    if (searchTerm && searchTerm.includes('@')) {
      setSearchTerm('');
    }
  }, [searchTerm]);

  // ============================================================================
  // LOAD CREDENTIALS - UNIFIED FUNCTION
  // ============================================================================
  // Orden de prioridad (mayor a menor):
  // 1. Backend Secret Manager (read-only, máxima seguridad)
  // 2. localStorage (usuario configuró manualmente)
  // 3. Firestore functions[].apiKey (sincronizado entre dispositivos)
  // 4. Firestore credentials{} (legacy, compatibilidad)

  const loadAllCredentials = async () => {
    try {
      setLoading(true);

      // ============================================================
      // USAR CACHE SI ESTÁ DISPONIBLE
      // ============================================================
      if (isCacheValid()) {
        logger.info('✓ Using cached credentials (skip network calls)', 'CredentialsTab');
        setConfig(credentialsCache.config);
        setBackendCredentials(credentialsCache.backendCreds);

        // Construir credenciales desde cache
        const loadedCredentials = buildCredentialsObject(
          credentialsCache.config,
          credentialsCache.backendCreds
        );
        setCredentials(loadedCredentials);
        setLoading(false);
        return;
      }

      // ============================================================
      // 1. CARGAR CONFIGURACIÓN DE FIREBASE (prioritario)
      // ============================================================
      const aiConfig = await getAIConfig();
      setConfig(aiConfig);
      credentialsCache.config = aiConfig;

      // ============================================================
      // 2. CARGAR BACKEND CREDENTIALS (opcional, en segundo plano)
      // ============================================================
      // Primero mostrar credenciales de localStorage/Firebase
      // Luego actualizar con backend en segundo plano
      const loadedCredentials = buildCredentialsObject(aiConfig, {});
      setCredentials(loadedCredentials);
      setLoading(false); // ✅ Dejar de mostrar loading ANTES de checkAICredentials

      // ✅ Cargar backend credentials en segundo plano (no bloquea la UI)
      loadBackendCredentialsInBackground(aiConfig);

      // Actualizar timestamp del cache
      credentialsCache.timestamp = Date.now();

    } catch (err) {
      logger.error('Failed to load credentials', err, 'CredentialsTab');
      setError('Error al cargar credenciales');
      setLoading(false);
    }
  };

  // ============================================================================
  // HELPER: Cargar backend credentials en segundo plano
  // ============================================================================
  const loadBackendCredentialsInBackground = async (aiConfig) => {
    try {
      logger.info('Loading backend credentials in background...', 'CredentialsTab');
      const { checkAICredentials } = await import('../../firebase/aiConfig');
      const backendCreds = await checkAICredentials();

      // Actualizar cache y estado
      credentialsCache.backendCreds = backendCreds;
      setBackendCredentials(backendCreds);

      // Reconstruir credenciales con backend incluido
      const updatedCredentials = buildCredentialsObject(aiConfig, backendCreds);
      setCredentials(updatedCredentials);

      logger.info('✓ Backend credentials loaded in background', 'CredentialsTab');
    } catch (err) {
      logger.warn('Could not load backend credentials (non-blocking)', 'CredentialsTab');
      credentialsCache.backendCreds = {};
    }
  };

  // ============================================================================
  // HELPER: Construir objeto de credenciales
  // ============================================================================
  const buildCredentialsObject = (aiConfig, backendCreds) => {
    const loadedCredentials = {};

    AI_PROVIDERS.forEach(provider => {
      const mapping = PROVIDER_MAPPINGS[provider.id];
      if (!mapping) {
        logger.warn(`No mapping found for provider: ${provider.id}`, 'CredentialsTab');
        return;
      }

      let credentialValue = '';
      let source = 'none';

      // Prioridad 1: Backend Secret Manager (READ-ONLY)
      if (mapping.backendName && backendCreds[mapping.backendName]) {
        credentialValue = '***BACKEND***';
        source = 'backend';
      }
      // Prioridad 2: localStorage (usuario configuró manualmente)
      else {
        const localStorageKey = `ai_credentials_${mapping.localStorageName}`;
        const localValue = localStorage.getItem(localStorageKey);
        if (localValue) {
          credentialValue = localValue;
          source = 'localStorage';
        }
        // Prioridad 3: Firestore functions[].apiKey
        else if (aiConfig?.functions) {
          for (const [funcId, funcConfig] of Object.entries(aiConfig.functions)) {
            if (funcConfig.provider === mapping.firebaseName && funcConfig.apiKey?.trim()) {
              credentialValue = funcConfig.apiKey;
              source = 'firebase_functions';
              break;
            }
          }
        }
        // Prioridad 4: Firestore credentials{} (legacy)
        if (!credentialValue && aiConfig?.credentials?.[provider.apiKeyField]) {
          credentialValue = aiConfig.credentials[provider.apiKeyField];
          source = 'firebase_credentials';
        }
      }

      loadedCredentials[provider.apiKeyField] = credentialValue;

      // Log solo para debugging
      if (provider.id === 'elevenlabs' || provider.id === 'google' || provider.id === 'xai') {
        logger.info(`${provider.name}: ${source} - ${credentialValue ? '✓' : '✗'}`, 'CredentialsTab');
      }
    });

    logger.info('Credentials object built successfully', 'CredentialsTab');
    return loadedCredentials;
  };

  // ============================================================================
  // CUSTOM CREDENTIALS MANAGEMENT
  // ============================================================================

  const CUSTOM_CREDENTIALS_KEY = 'ai_custom_credentials_list';

  const loadCustomCredentials = () => {
    try {
      const stored = localStorage.getItem(CUSTOM_CREDENTIALS_KEY);
      if (stored) {
        const names = JSON.parse(stored);
        const customs = names.map(name => ({
          id: `custom_${name.toLowerCase().replace(/\s+/g, '_')}`,
          name: name,
          description: 'Credencial personalizada',
          apiKeyField: `custom_${name}`,
          icon: '🔑',
          color: 'slate',
          isCustom: true,
          hasKey: !!localStorage.getItem(`ai_credentials_${name}`)
        }));
        setCustomCredentials(customs);
        logger.info(`Loaded ${customs.length} custom credentials`, 'CredentialsTab');
      }
    } catch (err) {
      logger.error('Error loading custom credentials', err, 'CredentialsTab');
    }
  };

  const handleSaveCustomCredential = async (providerName, apiKey) => {
    try {
      // 1. Guardar API key en localStorage
      localStorage.setItem(`ai_credentials_${providerName}`, apiKey);

      // 2. Agregar nombre a la lista de custom credentials
      const stored = localStorage.getItem(CUSTOM_CREDENTIALS_KEY);
      const names = stored ? JSON.parse(stored) : [];
      if (!names.includes(providerName)) {
        names.push(providerName);
        localStorage.setItem(CUSTOM_CREDENTIALS_KEY, JSON.stringify(names));
      }

      // 3. Recargar lista
      loadCustomCredentials();

      // 4. Cerrar modal y mostrar éxito
      setShowAddCustomModal(false);
      setSuccess(`Credencial "${providerName}" guardada exitosamente`);
      setTimeout(() => setSuccess(null), 3000);

      logger.info(`Saved custom credential: ${providerName}`, 'CredentialsTab');
    } catch (err) {
      logger.error('Error saving custom credential', err, 'CredentialsTab');
      throw err;
    }
  };

  const handleDeleteCustomCredential = (providerName) => {
    if (!confirm(`¿Eliminar la credencial "${providerName}"?`)) return;

    try {
      // 1. Eliminar API key
      localStorage.removeItem(`ai_credentials_${providerName}`);

      // 2. Eliminar de la lista
      const stored = localStorage.getItem(CUSTOM_CREDENTIALS_KEY);
      if (stored) {
        const names = JSON.parse(stored).filter(n => n !== providerName);
        localStorage.setItem(CUSTOM_CREDENTIALS_KEY, JSON.stringify(names));
      }

      // 3. Recargar lista
      loadCustomCredentials();

      setSuccess(`Credencial "${providerName}" eliminada`);
      setTimeout(() => setSuccess(null), 3000);

      logger.info(`Deleted custom credential: ${providerName}`, 'CredentialsTab');
    } catch (err) {
      logger.error('Error deleting custom credential', err, 'CredentialsTab');
    }
  };

  // Cargar custom credentials al iniciar
  useEffect(() => {
    loadCustomCredentials();
  }, []);

  // ============================================================================
  // SAVE CREDENTIAL
  // ============================================================================

  const handleSaveCredential = async (apiKeyField, value, providerName) => {
    try {
      // Encontrar provider
      const provider = AI_PROVIDERS.find(p => p.name === providerName);
      if (!provider) {
        throw new Error(`Provider ${providerName} not found`);
      }

      const mapping = PROVIDER_MAPPINGS[provider.id];
      if (!mapping) {
        throw new Error(`No mapping found for provider: ${provider.id}`);
      }

      // 1. Guardar en localStorage
      const localStorageKey = `ai_credentials_${mapping.localStorageName}`;
      const trimmedValue = value?.trim();
      if (trimmedValue) {
        localStorage.setItem(localStorageKey, trimmedValue);
        logger.info(`Saved to localStorage: ${localStorageKey} (length: ${trimmedValue.length})`, 'CredentialsTab');
      } else {
        localStorage.removeItem(localStorageKey);
        logger.info(`Removed from localStorage: ${localStorageKey}`, 'CredentialsTab');
      }

      // 2. Actualizar TODAS las funciones que usan este provider en Firebase
      const updatedConfig = { ...config };

      if (updatedConfig.functions && mapping.firebaseName) {
        for (const [funcId, funcConfig] of Object.entries(updatedConfig.functions)) {
          if (funcConfig.provider === mapping.firebaseName) {
            updatedConfig.functions[funcId] = {
              ...funcConfig,
              apiKey: trimmedValue || ''
            };
          }
        }
      }

      // 3. También guardar en credentials{} para compatibilidad legacy
      if (!updatedConfig.credentials) {
        updatedConfig.credentials = {};
      }
      updatedConfig.credentials[apiKeyField] = trimmedValue;

      // 4. Guardar en Firebase
      await saveAIConfig(updatedConfig);
      logger.info(`Saved to Firebase for provider: ${providerName}`, 'CredentialsTab');

      // 5. Actualizar estado local DIRECTAMENTE (sin recargar)
      setConfig(updatedConfig);
      setCredentials(prev => ({
        ...prev,
        [apiKeyField]: trimmedValue
      }));

      // 6. Invalidar cache para forzar recarga en próxima visita
      credentialsCache.config = updatedConfig;
      credentialsCache.timestamp = Date.now();

      // Success feedback
      setSuccess('Credencial guardada exitosamente');
      setTimeout(() => {
        setSuccess(null);
        setSelectedProvider(null);
      }, 2000);

    } catch (err) {
      logger.error(`Error saving credential for ${providerName}`, err, 'CredentialsTab');
      throw new Error(`Error al guardar: ${err.message}`);
    }
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const isProviderConfigured = (provider) => {
    const value = credentials[provider.apiKeyField];
    return value && value.trim().length > 0;
  };

  const filteredProviders = AI_PROVIDERS.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.description.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'configured') return isProviderConfigured(provider);
    if (filter === 'unconfigured') return !isProviderConfigured(provider);
    return true;
  });

  const configuredCount = AI_PROVIDERS.filter(isProviderConfigured).length;

  // Filtrar custom credentials
  const filteredCustomCredentials = customCredentials.filter(cred => {
    const matchesSearch = cred.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'configured') return cred.hasKey;
    if (filter === 'unconfigured') return !cred.hasKey;
    return true;
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) return <BaseLoading variant="card" text="Cargando..." />;

  return (
    <div className="w-full">
      {/* Alerts */}
      {error && <BaseAlert variant="danger" title="Error" dismissible onDismiss={() => setError(null)}>{error}</BaseAlert>}
      {success && <BaseAlert variant="success" title="Éxito" dismissible onDismiss={() => setSuccess(null)}>{success}</BaseAlert>}

      {/* Search + View Toggle - Envuelto en form para bloquear autofill */}
      <form autoComplete="off" onSubmit={(e) => e.preventDefault()} style={{ margin: 0 }}>
        {/* Hidden decoy inputs para prevenir autofill */}
        <input type="email" name="fake-email" autoComplete="email" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} tabIndex="-1" />
        <input type="text" name="fake-search" autoComplete="off" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} tabIndex="-1" />
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar proveedores..."
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          className="mb-4 w-full"
        />
      </form>

      {/* Filters */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            Todos ({AI_PROVIDERS.length + customCredentials.length})
          </button>
          <button onClick={() => setFilter('configured')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'configured' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            Configurados ({configuredCount + customCredentials.filter(c => c.hasKey).length})
          </button>
          <button onClick={() => setFilter('unconfigured')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'unconfigured' ? 'bg-amber-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            Sin Configurar ({AI_PROVIDERS.length - configuredCount + customCredentials.filter(c => !c.hasKey).length})
          </button>
          <button
            onClick={() => setShowAddCustomModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus size={16} />
            Agregar Credencial
          </button>
        </div>

        <button
          onClick={async () => {
            console.log('=== 🔍 FULL FIRESTORE CONFIG ===');
            const fullConfig = await getAIConfig();
            console.log(JSON.stringify(fullConfig, null, 2));

            console.log('\n=== 📦 LOCALSTORAGE ===');
            const lsKeys = ['ai_credentials_OpenAI', 'ai_credentials_Claude', 'ai_credentials_Google', 'ai_credentials_Grok', 'ai_credentials_elevenlabs'];
            lsKeys.forEach(key => {
              const val = localStorage.getItem(key);
              console.log(`${key}: ${val ? `${val.substring(0, 20)}... (${val.length})` : 'NOT FOUND'}`);
            });
          }}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-800 dark:bg-gray-600 text-white hover:bg-gray-700"
        >
          🐛 Debug Full Config
        </button>
      </div>

      {/* Grid - 5 COLUMNAS */}
      {viewMode === 'grid' ? (
        <div className="w-full grid-responsive-cards gap-4">
          {/* Proveedores predefinidos */}
          {filteredProviders.map((provider) => {
            const isConfigured = isProviderConfigured(provider);
            return (
              <UniversalCard
                key={provider.id}
                variant="default"
                size="sm"
                icon={() => <div className="text-5xl">{provider.icon}</div>}
                title={provider.name}
                description={provider.description}
                badges={[
                  isConfigured
                    ? { variant: 'success', children: <><CheckCircle size={14} className="inline" /> Configurado</> }
                    : { variant: 'warning', children: <><XCircle size={14} className="inline" /> Sin Configurar</> }
                ]}
                actions={
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedProvider(provider);
                    }}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                  >
                    {isConfigured ? 'Editar' : 'Configurar'}
                  </button>
                }
              />
            );
          })}

          {/* Credenciales personalizadas */}
          {filteredCustomCredentials.map((cred) => (
            <UniversalCard
              key={cred.id}
              variant="default"
              size="sm"
              icon={() => <div className="text-5xl">{cred.icon}</div>}
              title={cred.name}
              description={cred.description}
              badges={[
                cred.hasKey
                  ? { variant: 'success', children: <><CheckCircle size={14} className="inline" /> Configurado</> }
                  : { variant: 'warning', children: <><XCircle size={14} className="inline" /> Sin Configurar</> },
                { variant: 'info', children: 'Personalizado' }
              ]}
              actions={
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteCustomCredential(cred.name);
                    }}
                    className="px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <div className="w-full flex flex-col gap-3">
          {/* Proveedores predefinidos - List view con UniversalCard layout="row" */}
          {filteredProviders.map((provider) => {
            const isConfigured = isProviderConfigured(provider);
            return (
              <UniversalCard
                key={provider.id}
                variant="compact"
                layout="row"
                icon={() => <span className="text-4xl">{provider.icon}</span>}
                title={provider.name}
                description={provider.description}
                badges={[
                  isConfigured
                    ? { variant: 'success', children: <><CheckCircle size={14} className="inline mr-1" /> Configurado</> }
                    : { variant: 'warning', children: <><XCircle size={14} className="inline mr-1" /> Sin Configurar</> }
                ]}
                actions={[
                  <button
                    key="config"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProvider(provider);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm"
                  >
                    {isConfigured ? 'Editar' : 'Configurar'}
                  </button>
                ]}
                onClick={() => setSelectedProvider(provider)}
              />
            );
          })}

          {/* Credenciales personalizadas - List view con UniversalCard layout="row" */}
          {filteredCustomCredentials.map((cred) => (
            <UniversalCard
              key={cred.id}
              variant="compact"
              layout="row"
              icon={() => <span className="text-4xl">{cred.icon}</span>}
              title={cred.name}
              description={cred.description}
              badges={[
                cred.hasKey
                  ? { variant: 'success', children: <><CheckCircle size={14} className="inline mr-1" /> Configurado</> }
                  : { variant: 'warning', children: <><XCircle size={14} className="inline mr-1" /> Sin Configurar</> },
                { variant: 'info', children: 'Personalizado' }
              ]}
              actions={[
                <button
                  key="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCustomCredential(cred.name);
                  }}
                  className="px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              ]}
            />
          ))}
        </div>
      )}

      {/* Modal para providers predefinidos */}
      {selectedProvider && (
        <CredentialConfigModal
          provider={selectedProvider}
          initialValue={credentials[selectedProvider.apiKeyField] || ''}
          onSave={handleSaveCredential}
          onClose={() => setSelectedProvider(null)}
        />
      )}

      {/* Modal para agregar credencial personalizada */}
      {showAddCustomModal && (
        <AddCustomCredentialModal
          onSave={handleSaveCustomCredential}
          onClose={() => setShowAddCustomModal(false)}
          existingNames={[
            ...AI_PROVIDERS.map(p => p.name),
            ...customCredentials.map(c => c.name)
          ]}
        />
      )}
    </div>
  );
}

export default CredentialsTab;
