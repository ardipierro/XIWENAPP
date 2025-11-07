/**
 * @fileoverview AI Assistant Modal
 * @module components/AIAssistantModal
 */

import { useState, useEffect } from 'react';
import { X, Send, Loader, Lightbulb } from 'lucide-react';
import { getActiveAIProvider, getAIConfig, callAI } from '../firebase/aiConfig';
import { safeAsync } from '../utils/errorHandler';
import logger from '../utils/logger';

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
    }
  }, [isOpen]);

  const loadAIProvider = async () => {
    const provider = await safeAsync(getActiveAIProvider, {
      context: 'AIAssistantModal'
    });

    if (!provider) {
      alert('No hay ninguna IA configurada. Contacta al administrador.');
      onClose();
      return;
    }

    setActiveProvider(provider);

    const config = await safeAsync(getAIConfig, {
      context: 'AIAssistantModal'
    });

    if (config) {
      setProviderConfig(config[provider]);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Asistente IA
            </h2>
            {activeProvider && (
              <span className="px-3 py-1 text-xs font-semibold bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full">
                {activeProvider.toUpperCase()}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedMode ? (
            // Mode Selection
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                ¿En qué puedo ayudarte hoy?
              </p>
              {AI_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode)}
                  className="w-full p-4 text-left bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-2 border-transparent hover:border-indigo-500"
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
          ) : (
            // Input & Response
            <div className="space-y-4">
              {/* Mode Header */}
              <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900 rounded-xl">
                <span className="text-2xl">{selectedMode.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {selectedMode.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedMode.description}
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="ml-auto text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Cambiar
                </button>
              </div>

              {/* Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tu consulta
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={selectedMode.placeholder}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!inputText.trim() || loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar
                  </>
                )}
              </button>

              {/* Response */}
              {response && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Respuesta:
                  </h4>
                  <div className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                    {response}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIAssistantModal;
