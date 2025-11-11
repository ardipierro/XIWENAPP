/**
 * @fileoverview Panel de configuración de Text-to-Speech
 * @module components/interactive-book/TTSSettings
 */

import { useState, useEffect } from 'react';
import { Settings, Volume2, Zap, Languages } from 'lucide-react';
import { BaseCard, BaseButton, BaseBadge } from '../common';
import ttsService from '../../services/ttsService';
import PropTypes from 'prop-types';

/**
 * Panel de configuración de TTS
 */
function TTSSettings({ alwaysOpen = false }) {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isOpen, setIsOpen] = useState(alwaysOpen);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = () => {
    const spanishVoices = ttsService.getSpanishVoices();
    setVoices(spanishVoices);

    const currentVoice = ttsService.defaultVoice;
    if (currentVoice) {
      setSelectedVoice(currentVoice);
    }
  };

  const handleVoiceChange = (voice) => {
    ttsService.defaultVoice = voice;
    setSelectedVoice(voice);
  };

  const testVoice = async (voice) => {
    const testText = voice.lang.includes('AR')
      ? '¡Hola! Soy una voz argentina. ¿Cómo andás?'
      : '¡Hola! Esta es una voz en español.';

    try {
      await ttsService.speak(testText, { voice });
    } catch (err) {
      console.error('Error testing voice:', err);
    }
  };

  const getVoiceInfo = () => {
    return ttsService.getVoiceInfo();
  };

  if (!ttsService.isAvailable()) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-900 dark:text-red-100">
          ⚠️ Text-to-Speech no está disponible en este navegador
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header compacto */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
            Configuración de Voz IA
          </span>
        </div>
        <BaseBadge variant="info" size="sm">
          {voices.length} voces
        </BaseBadge>
      </button>

      {/* Panel expandible */}
      {isOpen && (
        <BaseCard
          title="Configuración de Text-to-Speech"
          subtitle="Selecciona la voz para los audios generados por IA"
        >
          {/* Voz actual */}
          {selectedVoice && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Voz actual: {selectedVoice.name}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 mt-1 flex items-center gap-2">
                    <Languages size={12} />
                    {selectedVoice.lang}
                    {selectedVoice.lang.includes('AR') && ' 🇦🇷'}
                  </div>
                </div>
                <BaseButton
                  size="sm"
                  variant="ghost"
                  icon={Volume2}
                  onClick={() => testVoice(selectedVoice)}
                >
                  Probar
                </BaseButton>
              </div>
            </div>
          )}

          {/* Lista de voces disponibles */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Voces disponibles en español
            </h4>

            {voices.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No hay voces en español disponibles. Las voces dependen de tu sistema operativo.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {voices.map((voice, idx) => (
                  <div
                    key={idx}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedVoice?.name === voice.name
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => handleVoiceChange(voice)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {voice.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                          <Languages size={12} />
                          {voice.lang}
                          {voice.lang.includes('AR') && (
                            <BaseBadge variant="success" size="sm">
                              🇦🇷 Argentina
                            </BaseBadge>
                          )}
                          {voice.localService && (
                            <BaseBadge variant="default" size="sm">
                              Local
                            </BaseBadge>
                          )}
                        </div>
                      </div>
                      <BaseButton
                        size="sm"
                        variant="ghost"
                        icon={Volume2}
                        onClick={(e) => {
                          e.stopPropagation();
                          testVoice(voice);
                        }}
                      >
                        Test
                      </BaseButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info adicional */}
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Zap size={16} className="text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-100">
                <p className="font-semibold mb-1">Consejos:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Las voces disponibles dependen de tu sistema operativo</li>
                  <li>En Windows: busca "es-AR" o "Microsoft Helena" (Argentina)</li>
                  <li>En macOS: busca "Mónica" o "Paulina" (español)</li>
                  <li>En Linux: instala espeak-ng con voces en español</li>
                  <li>Los audios se generan en tiempo real usando IA del navegador</li>
                </ul>
              </div>
            </div>
          </div>
        </BaseCard>
      )}
    </div>
  );
}

TTSSettings.propTypes = {
  alwaysOpen: PropTypes.bool
};

export default TTSSettings;
