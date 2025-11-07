/**
 * @fileoverview AI Configuration Panel for Admin
 * @module components/AIConfigPanel
 */

import { useState, useEffect } from 'react';
import { Lightbulb, Save, MessageSquare } from 'lucide-react';
import { getAIConfig, saveAIConfig, callAI } from '../firebase/aiConfig';
import { safeAsync } from '../utils/errorHandler';
import logger from '../utils/logger';

const AI_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    description: 'GPT-4 - El más avanzado y versátil'
  },
  {
    id: 'grok',
    name: 'Grok',
    icon: '🚀',
    description: 'X.AI - Rápido y directo'
  },
  {
    id: 'google',
    name: 'Google',
    icon: '🔍',
    description: 'Gemini - Multimodal y potente'
  }
];

const TONES = [
  { value: 'professional', label: 'Profesional' },
  { value: 'friendly', label: 'Amigable' },
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'enthusiastic', label: 'Entusiasta' }
];

function AIConfigPanel() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingProvider, setTestingProvider] = useState(null);
  const [testPrompt, setTestPrompt] = useState('Explica qué es la fotosíntesis en términos simples.');
  const [testResponse, setTestResponse] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const result = await safeAsync(getAIConfig, {
      context: 'AIConfigPanel',
      onError: (error) => {
        logger.error('Failed to load AI config', error);
      }
    });

    if (result) {
      setConfig(result);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await safeAsync(() => saveAIConfig(config), {
      context: 'AIConfigPanel',
      onError: (error) => {
        logger.error('Failed to save AI config', error);
        alert('Error al guardar la configuración');
      }
    });

    alert('Configuración guardada correctamente');
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
      alert('Por favor, ingresa una clave API primero');
      return;
    }

    setTestingProvider(providerId);
    setTestResponse('');

    const result = await safeAsync(
      () => callAI(providerId, testPrompt, config[providerId]),
      {
        context: 'AIConfigPanel',
        onError: (error) => {
          logger.error('Failed to test AI', error);
          alert(`Error al probar la IA: ${error.message}`);
        }
      }
    );

    if (result) {
      setTestResponse(result);
    }

    setTestingProvider(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Lightbulb className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Configuración de IA
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Configura los asistentes de IA para ayudar a estudiantes y profesores
        </p>
      </div>

      {/* Save Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {AI_PROVIDERS.map((provider) => (
          <div
            key={provider.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700"
          >
            {/* Provider Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{provider.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {provider.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {provider.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Enable Toggle */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Activar
              </span>
              <button
                onClick={() => handleToggle(provider.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config[provider.id].enabled ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config[provider.id].enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* API Key */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Clave API
              </label>
              <input
                type="password"
                value={config[provider.id].apiKey}
                onChange={(e) => handleFieldChange(provider.id, 'apiKey', e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Base Prompt */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Prompt Base
              </label>
              <textarea
                value={config[provider.id].basePrompt}
                onChange={(e) => handleFieldChange(provider.id, 'basePrompt', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Tone Selector */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tono
              </label>
              <select
                value={config[provider.id].tone}
                onChange={(e) => handleFieldChange(provider.id, 'tone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {TONES.map((tone) => (
                  <option key={tone.value} value={tone.value}>
                    {tone.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Button */}
            <button
              onClick={() => handleTest(provider.id)}
              disabled={testingProvider === provider.id || !config[provider.id].apiKey}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageSquare className="w-4 h-4" />
              {testingProvider === provider.id ? 'Probando...' : 'Hablar ahora con este tono'}
            </button>
          </div>
        ))}
      </div>

      {/* Test Section */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Prueba tu IA
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Pregunta de prueba
          </label>
          <textarea
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {testResponse && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Respuesta:
            </h4>
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
              {testResponse}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIConfigPanel;
