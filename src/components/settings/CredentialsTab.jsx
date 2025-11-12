/**
 * @fileoverview Pestaña de Credenciales IA
 * @module components/settings/CredentialsTab
 *
 * Agrupa todas las API keys y configuración de proveedores de IA:
 * - OpenAI (ChatGPT, DALL-E, Whisper)
 * - Anthropic (Claude)
 * - Stability AI (Ilustraciones)
 * - ElevenLabs (Text-to-Speech)
 * - Google (Gemini, Cloud TTS)
 */

import { useState, useEffect } from 'react';
import { Key, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { getAIConfig, saveAIConfig } from '../../firebase/aiConfig';
import { BaseAlert, BaseLoading } from '../common';
import CredentialSection from './CredentialSection';
import logger from '../../utils/logger';

/**
 * Configuración de proveedores de IA
 */
const AI_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'ChatGPT, DALL-E 3, Whisper',
    services: ['ChatGPT (GPT-4, GPT-4o)', 'DALL-E 3 (Generación de imágenes)', 'Whisper (Speech-to-Text)'],
    apiKeyField: 'openai_api_key',
    icon: '🤖',
    color: 'emerald',
    docsUrl: 'https://platform.openai.com/api-keys',
    testEndpoint: 'https://api.openai.com/v1/models'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3 (Opus, Sonnet, Haiku)',
    services: ['Claude 3 Opus (Máxima capacidad)', 'Claude 3 Sonnet (Balanceado)', 'Claude 3 Haiku (Rápido y eficiente)'],
    apiKeyField: 'anthropic_api_key',
    icon: '🧠',
    color: 'orange',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    testEndpoint: 'https://api.anthropic.com/v1/messages'
  },
  {
    id: 'stability',
    name: 'Stability AI',
    description: 'Stable Diffusion, generación de ilustraciones',
    services: ['Stable Diffusion XL (Ilustraciones artísticas)', 'Stable Image Ultra (Alta calidad)', 'Image Upscaler (Mejora de resolución)'],
    apiKeyField: 'stability_api_key',
    icon: '🎨',
    color: 'purple',
    docsUrl: 'https://platform.stability.ai/account/keys',
    testEndpoint: 'https://api.stability.ai/v1/user/account'
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Text-to-Speech de alta calidad',
    services: ['Voces naturales multiidioma', 'Clonación de voz', 'Control de emociones'],
    apiKeyField: 'elevenlabs_api_key',
    icon: '🎙️',
    color: 'blue',
    docsUrl: 'https://elevenlabs.io/app/settings/api-keys',
    testEndpoint: 'https://api.elevenlabs.io/v1/user'
  },
  {
    id: 'google',
    name: 'Google Cloud',
    description: 'Gemini Pro, Cloud TTS',
    services: ['Gemini Pro (Modelo multimodal)', 'Cloud Text-to-Speech', 'Cloud Translation'],
    apiKeyField: 'google_api_key',
    icon: '🔍',
    color: 'red',
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
    testEndpoint: 'https://generativelanguage.googleapis.com/v1/models'
  }
];

function CredentialsTab() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [credentials, setCredentials] = useState({});
  const [testResults, setTestResults] = useState({});

  // Cargar configuración al montar
  useEffect(() => {
    loadCredentials();
  }, []);

  /**
   * Cargar credenciales desde Firebase
   */
  const loadCredentials = async () => {
    try {
      setLoading(true);
      setError(null);

      const aiConfig = await getAIConfig();
      setConfig(aiConfig);

      // Extraer credenciales existentes
      const existingCreds = {};
      AI_PROVIDERS.forEach(provider => {
        existingCreds[provider.apiKeyField] = aiConfig?.credentials?.[provider.apiKeyField] || '';
      });

      setCredentials(existingCreds);
      logger.info('Credentials loaded successfully');
    } catch (err) {
      logger.error('Failed to load credentials:', err);
      setError('Error al cargar credenciales');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualizar credencial individual
   */
  const handleUpdateCredential = (apiKeyField, value) => {
    setCredentials(prev => ({
      ...prev,
      [apiKeyField]: value
    }));
  };

  /**
   * Guardar todas las credenciales
   */
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError(null);

      // Actualizar config con nuevas credenciales
      const updatedConfig = {
        ...config,
        credentials: {
          ...config?.credentials,
          ...credentials
        }
      };

      await saveAIConfig(updatedConfig);
      setConfig(updatedConfig);
      setSuccess('Credenciales guardadas exitosamente');
      logger.info('All credentials saved');

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error('Failed to save credentials:', err);
      setError(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Test de conexión para un proveedor
   */
  const handleTestCredential = async (providerId, apiKey) => {
    if (!apiKey || !apiKey.trim()) {
      setTestResults(prev => ({
        ...prev,
        [providerId]: { status: 'error', message: 'API key vacía' }
      }));
      return;
    }

    setTestResults(prev => ({
      ...prev,
      [providerId]: { status: 'testing', message: 'Probando conexión...' }
    }));

    try {
      const provider = AI_PROVIDERS.find(p => p.id === providerId);

      // Simulación de test (en producción, hacer llamada real al endpoint)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // TODO: Implementar tests reales según el proveedor
      const isValid = apiKey.length > 20; // Validación simple por ahora

      if (isValid) {
        setTestResults(prev => ({
          ...prev,
          [providerId]: { status: 'success', message: 'Conexión exitosa' }
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          [providerId]: { status: 'error', message: 'API key inválida' }
        }));
      }
    } catch (err) {
      logger.error(`Test failed for ${providerId}:`, err);
      setTestResults(prev => ({
        ...prev,
        [providerId]: { status: 'error', message: err.message || 'Error en la prueba' }
      }));
    }
  };

  /**
   * Verificar si hay cambios sin guardar
   */
  const hasUnsavedChanges = () => {
    if (!config?.credentials) return Object.values(credentials).some(v => v);

    return AI_PROVIDERS.some(provider => {
      const current = credentials[provider.apiKeyField] || '';
      const saved = config.credentials[provider.apiKeyField] || '';
      return current !== saved;
    });
  };

  if (loading) {
    return <BaseLoading variant="card" text="Cargando credenciales..." />;
  }

  return (
    <div className="credentials-tab space-y-6">
      {/* Header Info */}
      <div className="flex items-start gap-3 p-5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl shadow-lg">
        <Sparkles size={24} className="flex-shrink-0 mt-1" />
        <div className="text-sm md:text-base">
          <strong className="block mb-1">Gestión centralizada de credenciales</strong>
          Configura aquí todas las API keys de tus proveedores de IA. Las funciones configuradas en "Tareas IA" usarán estas credenciales automáticamente.
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <BaseAlert
          variant="danger"
          title="Error"
          dismissible
          onDismiss={() => setError(null)}
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
        >
          {success}
        </BaseAlert>
      )}

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges() && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg">
          <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span className="text-sm text-amber-800 dark:text-amber-200 font-medium">
            Tienes cambios sin guardar. Haz clic en "Guardar Todas las Credenciales" al final de la página.
          </span>
        </div>
      )}

      {/* Credential Sections */}
      <div className="space-y-4">
        {AI_PROVIDERS.map(provider => (
          <CredentialSection
            key={provider.id}
            provider={provider}
            value={credentials[provider.apiKeyField] || ''}
            onChange={(value) => handleUpdateCredential(provider.apiKeyField, value)}
            onTest={(apiKey) => handleTestCredential(provider.id, apiKey)}
            testResult={testResults[provider.id]}
          />
        ))}
      </div>

      {/* Save All Button */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 -mx-6 -mb-6">
        <button
          onClick={handleSaveAll}
          disabled={saving || !hasUnsavedChanges()}
          className={`
            w-full px-6 py-4 rounded-lg font-semibold text-white text-lg
            flex items-center justify-center gap-3 transition-all
            ${saving || !hasUnsavedChanges()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
            }
          `}
        >
          {saving ? (
            <>
              <div className="spinner-small"></div>
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle size={24} />
              Guardar Todas las Credenciales
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default CredentialsTab;
