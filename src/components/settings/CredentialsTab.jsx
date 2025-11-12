import { useState, useEffect } from 'react';
import { Key, Sparkles, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { getAIConfig, saveAIConfig } from '../../firebase/aiConfig';
import { BaseAlert, BaseLoading } from '../common';
import SearchBar from '../common/SearchBar';
import CredentialConfigModal from './CredentialConfigModal';
import logger from '../../utils/logger';

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
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
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

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    loadAllCredentials();
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

      // 1. Cargar configuración de Firebase
      const aiConfig = await getAIConfig();
      setConfig(aiConfig);

      // 2. Cargar credenciales del backend (Secret Manager)
      let backendCreds = {};
      try {
        const { checkAICredentials } = await import('../../firebase/aiConfig');
        backendCreds = await checkAICredentials();
        setBackendCredentials(backendCreds);
        logger.info('Backend credentials loaded', 'CredentialsTab');
      } catch (err) {
        logger.warn('Could not load backend credentials', 'CredentialsTab');
      }

      // 3. Construir objeto de credenciales con prioridad correcta
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

      setCredentials(loadedCredentials);
      logger.info('All credentials loaded successfully', 'CredentialsTab');

    } catch (err) {
      logger.error('Failed to load credentials', err, 'CredentialsTab');
      setError('Error al cargar credenciales');
    } finally {
      setLoading(false);
    }
  };

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
      if (value && value.trim()) {
        localStorage.setItem(localStorageKey, value);
        logger.info(`Saved to localStorage: ${localStorageKey}`, 'CredentialsTab');
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
              apiKey: value || ''
            };
          }
        }
      }

      // 3. También guardar en credentials{} para compatibilidad legacy
      if (!updatedConfig.credentials) {
        updatedConfig.credentials = {};
      }
      updatedConfig.credentials[apiKeyField] = value;

      // 4. Guardar en Firebase
      await saveAIConfig(updatedConfig);
      logger.info(`Saved to Firebase for provider: ${providerName}`, 'CredentialsTab');

      // 5. Actualizar estado local DIRECTAMENTE (sin recargar)
      setConfig(updatedConfig);
      setCredentials(prev => ({
        ...prev,
        [apiKeyField]: value
      }));

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

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) return <BaseLoading variant="card" text="Cargando..." />;

  return (
    <div className="w-full">
      {/* Banner Info */}
      <div className="w-full flex items-start gap-3 p-5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl shadow-lg mb-6">
        <Sparkles size={24} className="flex-shrink-0" />
        <div className="text-sm md:text-base">
          <strong className="block mb-1">Gestión de credenciales IA</strong>
          Configura las API keys de tus proveedores de IA
        </div>
      </div>

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
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            Todos ({AI_PROVIDERS.length})
          </button>
          <button onClick={() => setFilter('configured')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'configured' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            Configurados ({configuredCount})
          </button>
          <button onClick={() => setFilter('unconfigured')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'unconfigured' ? 'bg-amber-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            Sin Configurar ({AI_PROVIDERS.length - configuredCount})
          </button>
        </div>
      </div>

      {/* Grid - 4 COLUMNAS */}
      {viewMode === 'grid' ? (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProviders.map((provider) => {
            const colors = PROVIDER_COLORS[provider.color];
            const isConfigured = isProviderConfigured(provider);
            return (
              <div key={provider.id} className="card transition-all hover:shadow-lg" style={{ padding: 0 }}>
                <div className={`p-6 ${colors.bg} ${colors.border} border-b flex flex-col items-center text-center`}>
                  <div className="text-5xl mb-3">{provider.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{provider.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{provider.description}</p>
                  {isConfigured ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                      <CheckCircle size={14} />Configurado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-full">
                      <XCircle size={14} />Sin Configurar
                    </span>
                  )}
                </div>
                <div className="p-4">
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
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="w-full flex flex-col gap-3">
          {filteredProviders.map((provider) => {
            const colors = PROVIDER_COLORS[provider.color];
            const isConfigured = isProviderConfigured(provider);
            return (
              <div
                key={provider.id}
                className="card cursor-pointer transition-all hover:shadow-lg"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedProvider(provider);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{provider.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{provider.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{provider.description}</p>
                  </div>
                  {isConfigured ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                      <CheckCircle size={16} />Configurado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full">
                      <XCircle size={16} />Sin Configurar
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedProvider && (
        <CredentialConfigModal
          provider={selectedProvider}
          initialValue={credentials[selectedProvider.apiKeyField] || ''}
          onSave={handleSaveCredential}
          onClose={() => setSelectedProvider(null)}
        />
      )}
    </div>
  );
}

export default CredentialsTab;
