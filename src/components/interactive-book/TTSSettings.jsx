/**
 * @fileoverview Panel de configuración de Text-to-Speech
 * @module components/interactive-book/TTSSettings
 */

import { useState, useEffect } from 'react';
import { Settings, Volume2, Zap, Languages, Key, Sparkles, CheckCircle } from 'lucide-react';
import { BaseCard, BaseButton, BaseBadge, BaseInput } from '../common';
import ttsService from '../../services/ttsService';
import premiumTTSService from '../../services/premiumTTSService';
import { getAICredential } from '../../utils/credentialsHelper';
import PropTypes from 'prop-types';

/**
 * Panel de configuración de TTS
 */
function TTSSettings({ alwaysOpen = false }) {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isOpen, setIsOpen] = useState(alwaysOpen);
  const [activeTab, setActiveTab] = useState('browser'); // 'browser' | 'elevenlabs'
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  const [hasElevenLabsKey, setHasElevenLabsKey] = useState(false);

  useEffect(() => {
    loadVoices();
    loadElevenLabsKey();

    // Escuchar cambios en configuración (ej: credenciales guardadas en otro lugar)
    const handleSettingsChange = () => {
      loadElevenLabsKey();
    };

    window.addEventListener('xiwen_settings_changed', handleSettingsChange);

    return () => {
      window.removeEventListener('xiwen_settings_changed', handleSettingsChange);
    };
  }, []);

  const loadVoices = () => {
    const spanishVoices = ttsService.getSpanishVoices();
    setVoices(spanishVoices);

    const currentVoice = ttsService.defaultVoice;
    if (currentVoice) {
      setSelectedVoice(currentVoice);
    }
  };

  const loadElevenLabsKey = async () => {
    try {
      // Usar helper centralizado que lee de Firebase Y localStorage
      const credential = await getAICredential('elevenlabs');

      if (credential) {
        premiumTTSService.setApiKey(credential);
        setHasElevenLabsKey(true);
        setElevenLabsApiKey('••••••••••••••••');
      } else {
        setHasElevenLabsKey(false);
      }
    } catch (err) {
      console.error('Error loading ElevenLabs key:', err);
      setHasElevenLabsKey(false);
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

  const handleSaveElevenLabsKey = () => {
    if (elevenLabsApiKey && elevenLabsApiKey !== '••••••••••••••••') {
      premiumTTSService.setApiKey(elevenLabsApiKey);
      setHasElevenLabsKey(true);
      setElevenLabsApiKey('••••••••••••••••');
    }
  };

  const handleRemoveElevenLabsKey = () => {
    localStorage.removeItem('ai_credentials_elevenlabs');
    setHasElevenLabsKey(false);
    setElevenLabsApiKey('');
    premiumTTSService.apiKey = null;
    premiumTTSService.useElevenLabs = false;
  };

  const testElevenLabsVoice = async (voiceId, voiceName) => {
    const testText = '¡Hola! Esta es una voz premium de ElevenLabs con acento argentino.';
    try {
      const result = await premiumTTSService.generateWithElevenLabs(testText, voiceId);
      if (result.audioUrl) {
        const audio = new Audio(result.audioUrl);
        audio.play();
        audio.onended = () => {
          premiumTTSService.cleanup(result.audioUrl);
        };
      }
    } catch (err) {
      console.error('Error testing ElevenLabs voice:', err);
      alert('Error al probar la voz: ' + err.message);
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
      {/* Header compacto - solo si no es alwaysOpen */}
      {!alwaysOpen && (
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
      )}

      {/* Panel expandible */}
      {isOpen && (
        <>
          {/* ✅ Solo mostrar BaseCard cuando NO es alwaysOpen */}
          {!alwaysOpen ? (
            <BaseCard
              title="Configuración de Text-to-Speech"
              subtitle="Selecciona la voz para los audios generados por IA"
            >
          {/* Tabs: Navegador vs ElevenLabs */}
          <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('browser')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'browser'
                  ? 'border-zinc-600 text-zinc-900 dark:text-white'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Languages size={16} />
                Voces del Navegador
              </div>
            </button>
            <button
              onClick={() => setActiveTab('elevenlabs')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'elevenlabs'
                  ? 'border-zinc-600 text-zinc-900 dark:text-white'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} />
                ElevenLabs Premium
                {hasElevenLabsKey && <BaseBadge variant="success" size="sm">Configurado</BaseBadge>}
              </div>
            </button>
          </div>

          {/* Tab: Voces del Navegador */}
          {activeTab === 'browser' && (
            <div className="space-y-4">
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
                            ? 'border-zinc-600 bg-zinc-50 dark:bg-zinc-900/20'
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
            </div>
          )}

          {/* Tab: ElevenLabs Premium */}
          {activeTab === 'elevenlabs' && (
            <div className="space-y-4">
              {/* Configuración de API Key */}
              {!hasElevenLabsKey ? (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <Key size={20} className="text-purple-600 dark:text-purple-400 mt-1" />
                    <div>
                      <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                        Configurar ElevenLabs API Key
                      </h4>
                      <p className="text-xs text-purple-800 dark:text-purple-200">
                        Obtén tu API key en <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="underline">elevenlabs.io</a>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <BaseInput
                      type="password"
                      placeholder="sk-..."
                      value={elevenLabsApiKey}
                      onChange={(e) => setElevenLabsApiKey(e.target.value)}
                      className="flex-1"
                    />
                    <BaseButton
                      variant="primary"
                      onClick={handleSaveElevenLabsKey}
                      disabled={!elevenLabsApiKey || elevenLabsApiKey === '••••••••••••••••'}
                    >
                      Guardar
                    </BaseButton>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key size={18} className="text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-900 dark:text-green-100">
                        API Key configurada
                      </span>
                    </div>
                    <BaseButton
                      variant="danger"
                      size="sm"
                      onClick={handleRemoveElevenLabsKey}
                    >
                      Eliminar
                    </BaseButton>
                  </div>
                </div>
              )}

              {/* Voces Premium de ElevenLabs */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
                  Voces Premium con Acento Argentino
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Voz Femenina 1 - Sofía */}
                  <div className="p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-zinc-600 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          Sofía (Sarah)
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          🇦🇷 Femenina Principal
                        </div>
                      </div>
                      <BaseBadge variant="success" size="sm">Premium</BaseBadge>
                    </div>
                    <BaseButton
                      size="sm"
                      variant="ghost"
                      icon={Volume2}
                      onClick={() => testElevenLabsVoice('EXAVITQu4vr4xnSDxMaL', 'Sofía')}
                      disabled={!hasElevenLabsKey}
                      fullWidth
                    >
                      Probar
                    </BaseButton>
                  </div>

                  {/* Voz Femenina 2 - Matilda */}
                  <div className="p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-zinc-600 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          Matilda
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          🇦🇷 Femenina Alternativa
                        </div>
                      </div>
                      <BaseBadge variant="success" size="sm">Premium</BaseBadge>
                    </div>
                    <BaseButton
                      size="sm"
                      variant="ghost"
                      icon={Volume2}
                      onClick={() => testElevenLabsVoice('XrExE9yKIg1WjnnlVkGX', 'Matilda')}
                      disabled={!hasElevenLabsKey}
                      fullWidth
                    >
                      Probar
                    </BaseButton>
                  </div>

                  {/* Voz Masculina 1 - Mozo */}
                  <div className="p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-zinc-600 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          Adam (Mozo)
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          🇦🇷 Masculina Grave
                        </div>
                      </div>
                      <BaseBadge variant="success" size="sm">Premium</BaseBadge>
                    </div>
                    <BaseButton
                      size="sm"
                      variant="ghost"
                      icon={Volume2}
                      onClick={() => testElevenLabsVoice('pNInz6obpgDQGcFmaJgB', 'Adam')}
                      disabled={!hasElevenLabsKey}
                      fullWidth
                    >
                      Probar
                    </BaseButton>
                  </div>

                  {/* Voz Masculina 2 - Andrés */}
                  <div className="p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-zinc-600 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          Antoni (Andrés)
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          🇦🇷 Masculina Versátil
                        </div>
                      </div>
                      <BaseBadge variant="success" size="sm">Premium</BaseBadge>
                    </div>
                    <BaseButton
                      size="sm"
                      variant="ghost"
                      icon={Volume2}
                      onClick={() => testElevenLabsVoice('ErXwobaYiN019PkySvjV', 'Antoni')}
                      disabled={!hasElevenLabsKey}
                      fullWidth
                    >
                      Probar
                    </BaseButton>
                  </div>
                </div>
              </div>

              {/* Info de ElevenLabs */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Zap size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-xs text-blue-900 dark:text-blue-100">
                    <p className="font-semibold mb-1">Características de ElevenLabs:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Calidad ultra-natural con inteligencia artificial</li>
                      <li>Soporte específico para acento argentino rioplatense</li>
                      <li>Expresividad y entonación mejorada</li>
                      <li>Requiere API key (obtén una gratis en elevenlabs.io)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
            </BaseCard>
          ) : (
            /* ✅ Contenido SIN BaseCard cuando alwaysOpen=true */
            <div className="space-y-4">
              {/* Tabs: Navegador vs ElevenLabs */}
              <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('browser')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === 'browser'
                      ? 'border-zinc-600 text-zinc-900 dark:text-white'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Languages size={16} />
                    Voces del Navegador
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('elevenlabs')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === 'elevenlabs'
                      ? 'border-zinc-600 text-zinc-900 dark:text-white'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} />
                    ElevenLabs Premium
                    {hasElevenLabsKey && <BaseBadge variant="success" size="sm">Configurado</BaseBadge>}
                  </div>
                </button>
              </div>

              {/* Tab: Voces del Navegador - MISMO CONTENIDO */}
              {activeTab === 'browser' && (
                <div className="space-y-4">
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
                                ? 'border-zinc-600 bg-zinc-50 dark:bg-zinc-900/20'
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
                </div>
              )}

              {/* Tab: ElevenLabs Premium - SIN CAMPOS DE CREDENCIALES */}
              {activeTab === 'elevenlabs' && (
                <div className="space-y-4">
                  {/* Mensaje de credenciales - SOLO SI NO HAY KEY */}
                  {!hasElevenLabsKey && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Key size={20} className="text-purple-600 dark:text-purple-400 mt-1" />
                        <div>
                          <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                            Configurar credenciales ElevenLabs
                          </h4>
                          <p className="text-xs text-purple-800 dark:text-purple-200">
                            Para usar voces premium de ElevenLabs, configura tu API key en:<br />
                            <strong>Menú Lateral → Configuración → Credenciales IA</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mensaje de éxito - SOLO SI HAY KEY */}
                  {hasElevenLabsKey && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle size={20} className="text-green-600 dark:text-green-400 mt-1" />
                        <div>
                          <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                            ✓ ElevenLabs configurado correctamente
                          </h4>
                          <p className="text-xs text-green-800 dark:text-green-200">
                            Las voces premium están disponibles. Puedes probarlas a continuación.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Voces Premium preview (solo visual) */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
                      Voces Premium Disponibles
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Vista de voces (deshabilitadas si no hay key) */}
                      <div className={`p-3 border-2 rounded-lg ${!hasElevenLabsKey && 'opacity-50'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              Sofía (Sarah)
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              🇦🇷 Femenina Principal
                            </div>
                          </div>
                          <BaseBadge variant="success" size="sm">Premium</BaseBadge>
                        </div>
                        <BaseButton
                          size="sm"
                          variant="ghost"
                          icon={Volume2}
                          onClick={() => testElevenLabsVoice('EXAVITQu4vr4xnSDxMaL', 'Sofía')}
                          disabled={!hasElevenLabsKey}
                          fullWidth
                        >
                          {hasElevenLabsKey ? 'Probar' : 'Requiere API Key'}
                        </BaseButton>
                      </div>

                      <div className={`p-3 border-2 rounded-lg ${!hasElevenLabsKey && 'opacity-50'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              Adam (Mozo)
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              🇦🇷 Masculina Grave
                            </div>
                          </div>
                          <BaseBadge variant="success" size="sm">Premium</BaseBadge>
                        </div>
                        <BaseButton
                          size="sm"
                          variant="ghost"
                          icon={Volume2}
                          onClick={() => testElevenLabsVoice('pNInz6obpgDQGcFmaJgB', 'Adam')}
                          disabled={!hasElevenLabsKey}
                          fullWidth
                        >
                          {hasElevenLabsKey ? 'Probar' : 'Requiere API Key'}
                        </BaseButton>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

TTSSettings.propTypes = {
  alwaysOpen: PropTypes.bool
};

export default TTSSettings;
