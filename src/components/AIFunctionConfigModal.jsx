/**
 * @fileoverview AI Function Configuration Modal
 * @module components/AIFunctionConfigModal
 */

import { useState, useEffect } from 'react';
import { Save, TestTube, Loader2, CheckCircle, XCircle } from 'lucide-react';
import {
  BaseModal,
  BaseButton,
  BaseInput,
  BaseTextarea,
  BaseSelect,
  BaseAlert,
  BaseBadge
} from './common';
import { AI_PROVIDERS } from '../constants/aiFunctions';
import { callAI } from '../firebase/aiConfig';
import logger from '../utils/logger';

function AIFunctionConfigModal({ isOpen, onClose, aiFunction, initialConfig, onSave }) {
  const [config, setConfig] = useState(aiFunction.defaultConfig);
  const [testing, setTesting] = useState(false);
  const [testPrompt, setTestPrompt] = useState('Hola, ¿puedes ayudarme con español?');
  const [testResponse, setTestResponse] = useState('');
  const [testError, setTestError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load initial config when modal opens
  useEffect(() => {
    if (isOpen && initialConfig) {
      setConfig(initialConfig);
    } else if (isOpen) {
      setConfig(aiFunction.defaultConfig);
    }
  }, [isOpen, initialConfig, aiFunction]);

  // Reset test state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTestResponse('');
      setTestError(null);
      setError(null);
    }
  }, [isOpen]);

  const selectedProvider = AI_PROVIDERS.find(p => p.id === config.provider);

  const handleChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleParameterChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [field]: value
      }
    }));
  };

  const handleTest = async () => {
    if (!config.apiKey) {
      setTestError('Por favor, ingresa una API key primero');
      return;
    }

    if (!testPrompt.trim()) {
      setTestError('Por favor, ingresa un mensaje de prueba');
      return;
    }

    try {
      setTesting(true);
      setTestResponse('');
      setTestError(null);

      const result = await callAI(config.provider, testPrompt, config);

      if (result) {
        setTestResponse(result);
        logger.info('AI test successful for function:', aiFunction.id);
      }
    } catch (err) {
      logger.error('Failed to test AI:', err);
      setTestError(`Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!config.apiKey && config.enabled) {
      setError('No puedes activar la función sin una API key');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await onSave(aiFunction.id, config);
      onClose();
    } catch (err) {
      logger.error('Failed to save AI config:', err);
      setError(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configurar: ${aiFunction.name}`}
      icon={aiFunction.icon}
      size="xl"
      footer={
        <>
          <BaseButton
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="primary"
            icon={Save}
            onClick={handleSave}
            loading={saving}
          >
            Guardar Configuración
          </BaseButton>
        </>
      }
    >
      <div className="space-y-6">
        {error && (
          <BaseAlert variant="danger" title="Error" dismissible onDismiss={() => setError(null)}>
            {error}
          </BaseAlert>
        )}

        {/* Function Description */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            {aiFunction.description}
          </p>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-white">
              Estado de la función
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {config.enabled ? 'Esta función está activa' : 'Esta función está desactivada'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={config.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
            />
            <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Provider Selection */}
        <BaseSelect
          label="Proveedor de IA"
          value={config.provider}
          onChange={(e) => {
            const newProvider = e.target.value;
            const provider = AI_PROVIDERS.find(p => p.id === newProvider);
            handleChange('provider', newProvider);
            // Set default model for new provider
            if (provider && provider.models.length > 0) {
              handleChange('model', provider.models[0].value);
            }
          }}
          options={[
            { value: '', label: 'Selecciona un proveedor...' },
            ...AI_PROVIDERS.map(p => ({ value: p.id, label: `${p.icon} ${p.name}` }))
          ]}
          required
        />

        {/* Model Selection */}
        {selectedProvider && (
          <BaseSelect
            label="Modelo"
            value={config.model}
            onChange={(e) => handleChange('model', e.target.value)}
            options={[
              { value: '', label: 'Selecciona un modelo...' },
              ...selectedProvider.models
            ]}
            required
          />
        )}

        {/* API Key */}
        <BaseInput
          label="API Key"
          type="password"
          value={config.apiKey}
          onChange={(e) => handleChange('apiKey', e.target.value)}
          placeholder="sk-..."
          helperText="Tu API key se guarda de forma segura y solo se usa para esta función"
        />

        {/* System Prompt */}
        <BaseTextarea
          label="System Prompt"
          value={config.systemPrompt}
          onChange={(e) => handleChange('systemPrompt', e.target.value)}
          placeholder="Eres un..."
          rows={4}
          helperText="Define cómo debe comportarse la IA para esta función específica"
        />

        {/* Advanced Parameters */}
        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6">
          <h4 className="font-semibold text-zinc-900 dark:text-white mb-4">
            Parámetros Avanzados
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Temperature ({config.parameters.temperature})
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.parameters.temperature}
                onChange={(e) => handleParameterChange('temperature', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Creatividad (0 = preciso, 2 = creativo)
              </p>
            </div>

            <BaseInput
              label="Max Tokens"
              type="number"
              value={config.parameters.maxTokens}
              onChange={(e) => handleParameterChange('maxTokens', parseInt(e.target.value))}
              min="100"
              max="4000"
              helperText="Longitud máxima de respuesta"
            />

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Top P ({config.parameters.topP})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.parameters.topP}
                onChange={(e) => handleParameterChange('topP', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Diversidad de respuestas
              </p>
            </div>
          </div>
        </div>

        {/* Test Section */}
        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6">
          <h4 className="font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Probar Configuración
          </h4>

          <div className="space-y-4">
            <BaseTextarea
              label="Mensaje de prueba"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Escribe un mensaje para probar la IA..."
              rows={2}
            />

            <BaseButton
              variant="success"
              icon={testing ? Loader2 : TestTube}
              onClick={handleTest}
              loading={testing}
              disabled={!config.apiKey}
              fullWidth
            >
              {testing ? 'Probando...' : 'Probar Ahora'}
            </BaseButton>

            {testError && (
              <BaseAlert variant="danger">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  {testError}
                </div>
              </BaseAlert>
            )}

            {testResponse && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <h5 className="font-semibold text-green-900 dark:text-green-100">
                    Respuesta exitosa:
                  </h5>
                </div>
                <p className="text-sm text-green-900 dark:text-green-100 whitespace-pre-wrap">
                  {testResponse}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

export default AIFunctionConfigModal;
