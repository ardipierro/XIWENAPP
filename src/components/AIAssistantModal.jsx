/**
 * @fileoverview AI Assistant Modal
 * @module components/AIAssistantModal
 */

import { useState, useEffect } from 'react';
import { Send, Lightbulb, Sparkles } from 'lucide-react';
import { getActiveAIProvider, getAIConfig, callAI } from '../firebase/aiConfig';
import { safeAsync } from '../utils/errorHandler';
import logger from '../utils/logger';
import { BaseModal, BaseButton, BaseTextarea, BaseBadge, BaseCard } from './common';

const AI_MODES = [
  {
    id: 'exercise',
    title: 'Responder ejercicio',
    icon: '✍️',
    description: 'Obtén ayuda para resolver un ejercicio',
    placeholder: 'Describe el ejercicio que necesitas resolver...'
  },
  {
    id: 'explain',
    title: 'Explicar tema',
    icon: '📚',
    description: 'Explora un tema en detalle',
    placeholder: 'Escribe el tema que quieres entender...'
  },
  {
    id: 'correct',
    title: 'Corregir texto',
    icon: '✅',
    description: 'Mejora tu gramática y estilo',
    placeholder: 'Pega el texto que quieres corregir...'
  }
];

function AIAssistantModal({ isOpen, onClose }) {
  const [selectedMode, setSelectedMode] = useState(null);
  const [inputText, setInputText] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState(null);
  const [providerConfig, setProviderConfig] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadAIProvider();
    } else {
      // Reset on close
      setSelectedMode(null);
      setInputText('');
      setResponse('');
    }
  }, [isOpen]);

  const loadAIProvider = async () => {
    const config = await safeAsync(getAIConfig, {
      context: 'AIAssistantModal'
    });

    if (!config) {
      alert('No hay ninguna IA configurada. Contacta al administrador.');
      onClose();
      return;
    }

    // Check if there's a function configured (new structure)
    if (config.functions) {
      const chatAssistant = config.functions.chat_assistant;
      if (chatAssistant && chatAssistant.enabled) {
        setActiveProvider(chatAssistant.provider);
        setProviderConfig(chatAssistant);
        return;
      }

      // If chat_assistant is not enabled, try to find any enabled function
      const enabledFunction = Object.values(config.functions).find(f => f.enabled);
      if (enabledFunction) {
        setActiveProvider(enabledFunction.provider);
        setProviderConfig(enabledFunction);
        return;
      }
    }

    // Legacy structure - check individual providers
    const provider = await safeAsync(getActiveAIProvider, {
      context: 'AIAssistantModal'
    });

    if (!provider) {
      alert('No hay ninguna IA configurada. Contacta al administrador.');
      onClose();
      return;
    }

    setActiveProvider(provider);

    // Build a config object with defaults for legacy structure
    const legacyConfig = {
      provider: provider,
      model: getDefaultModel(provider),
      systemPrompt: config[provider]?.basePrompt || 'Eres un asistente educativo experto.',
      parameters: {
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1
      }
    };

    setProviderConfig(legacyConfig);
  };

  const getDefaultModel = (provider) => {
    switch (provider) {
      case 'openai': return 'gpt-4';
      case 'claude': return 'claude-sonnet-4-5';
      case 'grok': return 'grok-2';
      case 'google': return 'gemini-pro';
      default: return 'gpt-4';
    }
  };

  const handleSubmit = async () => {
    if (!inputText.trim() || !selectedMode) return;

    setLoading(true);
    setResponse('');

    // Build context-aware prompt
    let contextPrompt = '';
    switch (selectedMode.id) {
      case 'exercise':
        contextPrompt = `Ayúdame a resolver este ejercicio paso a paso:\n\n${inputText}`;
        break;
      case 'explain':
        contextPrompt = `Explícame este tema de manera clara y didáctica:\n\n${inputText}`;
        break;
      case 'correct':
        contextPrompt = `Corrige este texto mejorando gramática, ortografía y estilo:\n\n${inputText}`;
        break;
    }

    const result = await safeAsync(
      () => callAI(activeProvider, contextPrompt, providerConfig),
      {
        context: 'AIAssistantModal',
        onError: (error) => {
          logger.error('Failed to call AI', error);
          alert('Error al comunicarse con la IA. Intenta de nuevo.');
        }
      }
    );

    if (result) {
      setResponse(result);
    }

    setLoading(false);
  };

  const handleReset = () => {
    setSelectedMode(null);
    setInputText('');
    setResponse('');
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <Lightbulb className="w-6 h-6 text-amber-500" />
          <span>Asistente IA</span>
          {activeProvider && (
            <BaseBadge variant="default" size="sm">
              {activeProvider.toUpperCase()}
            </BaseBadge>
          )}
        </div>
      }
      size="xl"
      icon={Sparkles}
    >
      <div className="space-y-6">
        {!selectedMode ? (
          // Mode Selection
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              ¿En qué puedo ayudarte hoy?
            </p>

            <div className="grid gap-4">
              {AI_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode)}
                  className="w-full p-4 text-left bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{mode.icon}</span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {mode.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-12">
                    {mode.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Input & Response
          <div className="space-y-4">
            {/* Mode Header */}
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <span className="text-2xl">{selectedMode.icon}</span>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {selectedMode.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedMode.description}
                </p>
              </div>
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={handleReset}
              >
                Cambiar
              </BaseButton>
            </div>

            {/* Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tu consulta
              </label>
              <BaseTextarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={selectedMode.placeholder}
                rows={6}
              />
            </div>

            {/* Submit Button */}
            <BaseButton
              variant="primary"
              onClick={handleSubmit}
              disabled={!inputText.trim() || loading}
              loading={loading}
              icon={Send}
              fullWidth
            >
              {loading ? 'Procesando...' : 'Enviar'}
            </BaseButton>

            {/* Response */}
            {response && (
              <BaseCard
                title="Respuesta"
                variant="bordered"
              >
                <div className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                  {response}
                </div>
              </BaseCard>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
}

export default AIAssistantModal;
