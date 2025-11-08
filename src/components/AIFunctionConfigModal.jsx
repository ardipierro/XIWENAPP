/**
 * @fileoverview AI Function Configuration Modal
 * @module components/AIFunctionConfigModal
 */

import { useState, useEffect } from 'react';
import { Save, TestTube, Loader2, XCircle } from 'lucide-react';
import {
  BaseModal,
  BaseButton,
  BaseInput,
  BaseTextarea,
  BaseSelect,
  BaseAlert
} from './common';
import { AI_PROVIDERS } from '../constants/aiFunctions';
import { callAI } from '../firebase/aiConfig';
import logger from '../utils/logger';

/**
 * Modal de configuración de función de IA
 */
function AIFunctionConfigModal({ isOpen, onClose, aiFunction, initialConfig, onSave }) {
  // Estado interno del formulario
  const [config, setConfig] = useState(aiFunction.defaultConfig);
  const [testing, setTesting] = useState(false);
  const [testPrompt, setTestPrompt] = useState('Hola, ¿puedes ayudarme con español?');
  const [testResponse, setTestResponse] = useState('');
  const [testError, setTestError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Cargar config inicial cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setConfig(initialConfig || aiFunction.defaultConfig);
      // Limpiar estados de test
      setTestResponse('');
      setTestError(null);
      setError(null);
    }
  }, [isOpen, initialConfig, aiFunction.defaultConfig]);

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
        logger.info('AI test successful:', aiFunction.id);
      }
    } catch (err) {
      logger.error('AI test failed:', err);
      setTestError(`Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Guardar configuración
      await onSave(aiFunction.id, config);

      // Cerrar modal
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
        {/* Error alert */}
        {error && (
          <BaseAlert variant="danger" title="Error" dismissible onDismiss={() => setError(null)}>
            {error}
          </BaseAlert>
        )}

        {/* Descripción de la función */}
        <BaseAlert variant="info">
          {aiFunction.description}
        </BaseAlert>

        {/* Toggle Enabled/Disabled */}
        <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-white">
              Estado de la función
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {config.enabled ? 'Esta función está activa' : 'Esta función está desactivada'}
            </p>
          </div>
          <BaseButton
            variant={config.enabled ? 'success' : 'secondary'}
            size="sm"
            onClick={() => handleChange('enabled', !config.enabled)}
          >
            {config.enabled ? 'Activo' : 'Inactivo'}
          </BaseButton>
        </div>

        {/* Provider Selection */}
        <BaseSelect
          label="Proveedor de IA"
          value={config.provider}
          onChange={(e) => {
            const newProvider = e.target.value;
            const provider = AI_PROVIDERS.find(p => p.id === newProvider);
            handleChange('provider', newProvider);
            // Setear modelo default del proveedor
            if (provider && provider.models.length > 0) {
              handleChange('model', provider.models[0].value);
            }
          }}
          options={AI_PROVIDERS.map(p => ({ value: p.id, label: p.name }))}
          required
          helperText={selectedProvider?.description}
        />

        {/* Model Selection */}
        {selectedProvider && (
          <BaseSelect
            label="Modelo"
            value={config.model}
            onChange={(e) => handleChange('model', e.target.value)}
            options={selectedProvider.models}
            required
          />
        )}

        {/* System Prompt */}
        <BaseTextarea
          label="System Prompt"
          value={config.systemPrompt}
          onChange={(e) => handleChange('systemPrompt', e.target.value)}
          placeholder="Eres un..."
          rows={4}
          helperText="Define cómo debe comportarse la IA para esta función"
        />

        {/* Advanced Parameters */}
        {selectedProvider && (
          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6">
            <h4 className="font-semibold text-zinc-900 dark:text-white mb-4">
              Parámetros Avanzados
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Temperature */}
              {selectedProvider.supportsTemperature && (
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
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-zinc-600 dark:accent-zinc-400"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    Creatividad (0 = preciso, 2 = creativo)
                  </p>
                </div>
              )}

              {/* Max Tokens */}
              {selectedProvider.supportsMaxTokens && (
                <BaseInput
                  label="Max Tokens"
                  type="number"
                  value={config.parameters.maxTokens}
                  onChange={(e) => handleParameterChange('maxTokens', parseInt(e.target.value))}
                  min="100"
                  max="4000"
                  helperText="Longitud máxima de respuesta"
                />
              )}

              {/* Top P */}
              {selectedProvider.supportsTopP && (
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
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-zinc-600 dark:accent-zinc-400"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    Diversidad de respuestas
                  </p>
                </div>
              )}
            </div>

            {/* Warning for Claude */}
            {selectedProvider.id === 'claude' && (
              <BaseAlert variant="info" className="mt-4">
                ℹ️ Claude no soporta el parámetro Top P. Solo puedes ajustar Temperature.
              </BaseAlert>
            )}
          </div>
        )}

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
              <BaseAlert variant="success" title="Respuesta exitosa:">
                <p className="text-sm whitespace-pre-wrap mt-2">
                  {testResponse}
                </p>
              </BaseAlert>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

export default AIFunctionConfigModal;
