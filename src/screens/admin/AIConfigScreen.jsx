import { useState, useEffect } from 'react';
import { BaseCard, BaseButton } from '../../components/base';
import { Save, Lightbulb, MessageSquare, Key, FileText, Sparkles } from 'lucide-react';
import { getAIConfig, saveAIConfig, callAI, AI_PROVIDERS, TONES } from '../../firebase/aiConfig';

/**
 * AIConfigScreen - Admin AI configuration management
 *
 * Features:
 * - Configure 3 AI providers (OpenAI, Grok, Google)
 * - Enable/disable providers
 * - API key management
 * - Custom prompts and tones
 * - Test each provider live
 */
function AIConfigScreen() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingProvider, setTestingProvider] = useState(null);
  const [testPrompt, setTestPrompt] = useState('Explica qué es la fotosíntesis en términos simples');
  const [testResponse, setTestResponse] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const data = await getAIConfig();
    setConfig(data);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAIConfig(config);
      alert('✅ Configuración guardada correctamente');
    } catch (error) {
      alert('❌ Error al guardar: ' + error.message);
    }
    setSaving(false);
  };

  const handleToggle = (providerId) => {
    setConfig({
      ...config,
      [providerId]: {
        ...config[providerId],
        enabled: !config[providerId].enabled
      }
    });
  };

  const handleFieldChange = (providerId, field, value) => {
    setConfig({
      ...config,
      [providerId]: {
        ...config[providerId],
        [field]: value
      }
    });
  };

  const handleTest = async (providerId) => {
    if (!config[providerId].apiKey) {
      alert('⚠️ Ingresa una clave API primero');
      return;
    }

    setTestingProvider(providerId);
    setTestResponse('');

    try {
      const response = await callAI(providerId, testPrompt, config[providerId]);
      setTestResponse(response);
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }

    setTestingProvider(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mx-auto mb-4" />
          <p className="text-text-secondary dark:text-neutral-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Lightbulb className="w-8 h-8 text-accent-500" />
          <div>
            <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse">Configuración de IA</h1>
            <p className="text-text-secondary dark:text-neutral-400">Configura asistentes de IA para estudiantes y profesores</p>
          </div>
        </div>
        <BaseButton variant="primary" iconLeft={<Save size={18} />} onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </BaseButton>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {AI_PROVIDERS.map((provider) => (
          <BaseCard key={provider.id} className="!p-0 overflow-hidden">
            {/* Provider Header */}
            <div className={`p-6 bg-gradient-to-br from-${provider.color}-500 to-${provider.color}-600`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{provider.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-white">{provider.name}</h3>
                  <p className="text-sm text-white/90">{provider.description}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary dark:bg-primary-800">
                <span className="font-semibold text-text-primary dark:text-text-inverse">Activar</span>
                <button
                  onClick={() => handleToggle(provider.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config[provider.id].enabled ? 'bg-accent-500' : 'bg-neutral-400'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config[provider.id].enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* API Key */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">
                  <Key size={14} />
                  Clave API
                </label>
                <input
                  type="password"
                  value={config[provider.id].apiKey}
                  onChange={(e) => handleFieldChange(provider.id, 'apiKey', e.target.value)}
                  placeholder={provider.id === 'openai' ? 'sk-...' : provider.id === 'google' ? 'AI...' : 'xai-...'}
                  className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                />
              </div>

              {/* Base Prompt */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">
                  <FileText size={14} />
                  Prompt Base
                </label>
                <textarea
                  value={config[provider.id].basePrompt}
                  onChange={(e) => handleFieldChange(provider.id, 'basePrompt', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none text-sm"
                />
              </div>

              {/* Tone Selector */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">
                  <Sparkles size={14} />
                  Tono
                </label>
                <select
                  value={config[provider.id].tone}
                  onChange={(e) => handleFieldChange(provider.id, 'tone', e.target.value)}
                  className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                >
                  {TONES.map((tone) => (
                    <option key={tone.value} value={tone.value}>{tone.label}</option>
                  ))}
                </select>
              </div>

              {/* Test Button */}
              <BaseButton
                variant="secondary"
                iconLeft={<MessageSquare size={16} />}
                onClick={() => handleTest(provider.id)}
                disabled={testingProvider === provider.id || !config[provider.id].apiKey}
                fullWidth
              >
                {testingProvider === provider.id ? 'Probando...' : 'Probar ahora'}
              </BaseButton>
            </div>
          </BaseCard>
        ))}
      </div>

      {/* Test Section */}
      <BaseCard title="🧪 Zona de Pruebas">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">
              Pregunta de prueba
            </label>
            <textarea
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              placeholder="Escribe una pregunta para probar la IA..."
            />
          </div>

          {testResponse && (
            <div className="p-4 rounded-lg bg-bg-secondary dark:bg-primary-800">
              <h4 className="font-semibold text-text-primary dark:text-text-inverse mb-2 flex items-center gap-2">
                <MessageSquare size={16} />
                Respuesta:
              </h4>
              <p className="text-text-primary dark:text-text-inverse whitespace-pre-wrap text-sm">
                {testResponse}
              </p>
            </div>
          )}

          {!testResponse && (
            <div className="text-center p-8 text-text-secondary dark:text-neutral-400">
              <Sparkles size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Haz click en "Probar ahora" en cualquier proveedor para ver la respuesta aquí</p>
            </div>
          )}
        </div>
      </BaseCard>
    </div>
  );
}

export default AIConfigScreen;
