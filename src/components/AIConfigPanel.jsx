/**
 * @fileoverview AI Configuration Panel for Admin
 * @module components/AIConfigPanel
 */

import { useState, useEffect } from 'react';
import { Lightbulb, Save, MessageSquare } from 'lucide-react';
import { getAIConfig, saveAIConfig, callAI } from '../firebase/aiConfig';
import logger from '../utils/logger';
import {
  BaseButton,
  BaseCard,
  BaseInput,
  BaseTextarea,
  BaseSelect,
  BaseBadge,
  BaseLoading,
  BaseAlert
} from './common';

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
  },
  {
    id: 'claude',
    name: 'Claude',
    icon: '🧠',
    description: 'Anthropic - Razonamiento avanzado'
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

      if (result) {
        setConfig(result);
        logger.info('AI config loaded successfully');
      }
    } catch (err) {
      logger.error('Failed to load AI config:', err);
      setError('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await saveAIConfig(config);

      setSuccess('Configuración guardada correctamente');
      logger.info('AI config saved successfully');
    } catch (err) {
      logger.error('Failed to save AI config:', err);
      setError('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
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
      setError('Por favor, ingresa una clave API primero');
      return;
    }

    try {
      setTestingProvider(providerId);
      setTestResponse('');
      setError(null);

      const result = await callAI(providerId, testPrompt, config[providerId]);

      if (result) {
        setTestResponse(result);
        logger.info('AI test successful for provider:', providerId);
      }
    } catch (err) {
      logger.error('Failed to test AI:', err);
      setError(`Error al probar la IA: ${err.message}`);
    } finally {
      setTestingProvider(null);
    }
  };

  if (loading) {
    return <BaseLoading variant="fullscreen" text="Cargando configuración..." />;
  }

  return (
    <div className="p-6 bg-zinc-50 dark:bg-zinc-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Lightbulb className="w-8 h-8 text-amber-500" strokeWidth={2} />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Configuración de IA
          </h1>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Configura los asistentes de IA para ayudar a estudiantes y profesores
        </p>
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

      {/* Save Button */}
      <div className="mb-6 flex justify-end">
        <BaseButton
          variant="primary"
          icon={Save}
          onClick={handleSave}
          loading={saving}
        >
          Guardar Configuración
        </BaseButton>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {AI_PROVIDERS.map((provider) => (
          <BaseCard
            key={provider.id}
            variant="bordered"
          >
            <div className="space-y-4">
              {/* Provider Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{provider.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                      {provider.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {provider.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <span className="font-medium text-zinc-700 dark:text-zinc-300 text-sm">
                  Activar
                </span>
                <button
                  onClick={() => handleToggle(provider.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config[provider.id].enabled
                      ? 'bg-green-500'
                      : 'bg-zinc-300 dark:bg-zinc-600'
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
              <BaseInput
                type="password"
                label="Clave API"
                value={config[provider.id].apiKey}
                onChange={(e) => handleFieldChange(provider.id, 'apiKey', e.target.value)}
                placeholder="sk-..."
              />

              {/* Base Prompt */}
              <BaseTextarea
                label="Prompt Base"
                value={config[provider.id].basePrompt}
                onChange={(e) => handleFieldChange(provider.id, 'basePrompt', e.target.value)}
                rows={4}
              />

              {/* Tone Selector */}
              <BaseSelect
                label="Tono"
                value={config[provider.id].tone}
                onChange={(e) => handleFieldChange(provider.id, 'tone', e.target.value)}
                options={TONES}
              />

              {/* Test Button */}
              <BaseButton
                variant="success"
                icon={MessageSquare}
                onClick={() => handleTest(provider.id)}
                loading={testingProvider === provider.id}
                disabled={!config[provider.id].apiKey}
                fullWidth
              >
                {testingProvider === provider.id ? 'Probando...' : 'Hablar ahora con este tono'}
              </BaseButton>
            </div>
          </BaseCard>
        ))}
      </div>

      {/* Test Section */}
      <BaseCard
        title="Prueba tu IA"
        className="mt-6"
      >
        <div className="space-y-4">
          <BaseTextarea
            label="Pregunta de prueba"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            rows={2}
          />

          {testResponse && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Respuesta:
              </h4>
              <p className="text-zinc-900 dark:text-white whitespace-pre-wrap">
                {testResponse}
              </p>
            </div>
          )}
        </div>
      </BaseCard>
    </div>
  );
}

export default AIConfigPanel;
