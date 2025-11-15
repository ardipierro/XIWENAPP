/**
 * @fileoverview Gestor de voces por personaje
 * Permite asignar diferentes voces, velocidades y configuraciones a cada personaje del diálogo
 * @module components/interactive-book/CharacterVoiceManager
 */

import { useState, useEffect } from 'react';
import { User, Volume2, Settings as SettingsIcon, Play, Sparkles, Globe, Save } from 'lucide-react';
import PropTypes from 'prop-types';
import { BaseButton, BaseBadge } from '../common';
import { UniversalCard } from '../cards';
import ttsService from '../../services/ttsService';
import premiumTTSService from '../../services/premiumTTSService';
import { getAICredential } from '../../utils/credentialsHelper';
import { getVoicePresetsByTeacher } from '../../firebase/voicePresets';
import logger from '../../utils/logger';

const ELEVENLABS_VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sofía (Sarah)', gender: 'female', accent: 'argentino' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', gender: 'female', accent: 'argentino' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Mozo)', gender: 'male', accent: 'argentino' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Andrés)', gender: 'male', accent: 'argentino' }
];

const DEFAULT_CHARACTER_CONFIG = {
  provider: 'browser', // 'elevenlabs' | 'browser'
  voiceId: null,
  voiceName: 'Auto',
  rate: 1.0,
  pitch: 0,
  volume: 1.0
};

/**
 * Gestor de voces por personaje
 */
function CharacterVoiceManager({ characters = [], onConfigChange, alwaysOpen = false, teacherId = null }) {
  const [isOpen, setIsOpen] = useState(alwaysOpen);
  const [characterConfigs, setCharacterConfigs] = useState({});
  const [browserVoices, setBrowserVoices] = useState([]);
  const [testingVoice, setTestingVoice] = useState(null);
  const [hasElevenLabsKey, setHasElevenLabsKey] = useState(false);
  const [voicePresets, setVoicePresets] = useState([]);
  const [loadingPresets, setLoadingPresets] = useState(false);

  useEffect(() => {
    loadConfigs();
    loadBrowserVoices();
    checkElevenLabsKey();
    if (teacherId) {
      loadVoicePresets();
    }

    // Escuchar cambios en configuración (ej: credenciales guardadas en otro lugar)
    const handleSettingsChange = () => {
      checkElevenLabsKey();
      loadConfigs();
      if (teacherId) {
        loadVoicePresets();
      }
    };

    window.addEventListener('xiwen_settings_changed', handleSettingsChange);

    return () => {
      window.removeEventListener('xiwen_settings_changed', handleSettingsChange);
    };
  }, [teacherId]);

  useEffect(() => {
    // Inicializar configs para personajes nuevos
    if (characters.length > 0) {
      const newConfigs = { ...characterConfigs };
      let hasChanges = false;

      characters.forEach(char => {
        if (!newConfigs[char.id]) {
          newConfigs[char.id] = {
            id: char.id,
            name: char.name,
            voiceConfig: { ...DEFAULT_CHARACTER_CONFIG }
          };
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setCharacterConfigs(newConfigs);
      }
    }
  }, [characters]);

  const loadConfigs = () => {
    const saved = localStorage.getItem('xiwen_character_voices');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCharacterConfigs(parsed);
      } catch (err) {
        logger.error('Error loading character voice configs:', err);
      }
    }
  };

  const loadBrowserVoices = () => {
    const voices = ttsService.getSpanishVoices();
    setBrowserVoices(voices);
  };

  const checkElevenLabsKey = async () => {
    try {
      // Usar helper centralizado que lee de Firebase Y localStorage
      const credential = await getAICredential('elevenlabs');

      if (credential) {
        premiumTTSService.setApiKey(credential);
        setHasElevenLabsKey(true);
      } else {
        setHasElevenLabsKey(false);
      }
    } catch (err) {
      logger.error('Error checking ElevenLabs key:', err);
      setHasElevenLabsKey(false);
    }
  };

  const loadVoicePresets = async () => {
    if (!teacherId) return;

    setLoadingPresets(true);
    try {
      const presets = await getVoicePresetsByTeacher(teacherId);
      setVoicePresets(presets);
      logger.info(`Loaded ${presets.length} voice presets`);
    } catch (err) {
      logger.error('Error loading voice presets:', err);
    } finally {
      setLoadingPresets(false);
    }
  };

  const applyPresetToCharacter = (characterId, preset) => {
    const newConfig = {
      provider: 'elevenlabs',
      voiceId: preset.voiceId,
      voiceName: preset.voiceName,
      rate: 1.0, // Mantener rate por defecto o del character actual
      volume: 1.0, // Mantener volumen por defecto o del character actual
      // Guardar los parámetros del preset (aunque no se usan directamente aquí, los guardamos para referencia)
      stability: preset.stability,
      similarity_boost: preset.similarity_boost,
      style: preset.style,
      use_speaker_boost: preset.use_speaker_boost
    };

    updateCharacterVoice(characterId, newConfig);

    logger.info(`Applied preset "${preset.name}" to character ${characterId}`);
  };

  const saveConfigs = (newConfigs) => {
    setCharacterConfigs(newConfigs);
    localStorage.setItem('xiwen_character_voices', JSON.stringify(newConfigs));

    if (onConfigChange) {
      onConfigChange(newConfigs);
    }
  };

  const updateCharacterVoice = (characterId, voiceConfig) => {
    const newConfigs = {
      ...characterConfigs,
      [characterId]: {
        ...characterConfigs[characterId],
        voiceConfig: {
          ...(characterConfigs[characterId]?.voiceConfig || DEFAULT_CHARACTER_CONFIG),
          ...voiceConfig
        }
      }
    };
    saveConfigs(newConfigs);
  };

  const testVoice = async (characterId) => {
    const config = characterConfigs[characterId];
    if (!config) return;

    setTestingVoice(characterId);

    try {
      const testText = `¡Hola! Soy ${config.name}. Esta es mi voz configurada.`;

      if (config.voiceConfig.provider === 'elevenlabs' && hasElevenLabsKey) {
        // Test con ElevenLabs
        const result = await premiumTTSService.generateWithElevenLabs(
          testText,
          config.voiceConfig.voiceId
        );

        if (result.audioUrl) {
          const audio = new Audio(result.audioUrl);
          audio.playbackRate = config.voiceConfig.rate;
          audio.volume = config.voiceConfig.volume;
          audio.play();
          audio.onended = () => {
            premiumTTSService.cleanup(result.audioUrl);
            setTestingVoice(null);
          };
        }
      } else {
        // Test con navegador
        const voice = browserVoices.find(v => v.name === config.voiceConfig.voiceName);
        await ttsService.speak(testText, {
          voice: voice,
          rate: config.voiceConfig.rate,
          volume: config.voiceConfig.volume
        });
        setTestingVoice(null);
      }
    } catch (err) {
      logger.error('Error testing voice:', err);
      setTestingVoice(null);
    }
  };

  const renderCharacterCard = (characterId) => {
    const config = characterConfigs[characterId];
    if (!config) return null;

    const isElevenLabs = config.voiceConfig.provider === 'elevenlabs';

    return (
      <div
        key={characterId}
        className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {config.name}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {isElevenLabs ? (
                  <span className="flex items-center gap-1">
                    <Sparkles size={12} />
                    ElevenLabs Premium
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Globe size={12} />
                    Voz del navegador
                  </span>
                )}
              </div>
            </div>
          </div>
          <BaseButton
            size="sm"
            variant="primary"
            icon={Play}
            onClick={() => testVoice(characterId)}
            disabled={testingVoice === characterId}
          >
            {testingVoice === characterId ? 'Reproduciendo...' : 'Probar'}
          </BaseButton>
        </div>

        {/* Selector de Provider */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Proveedor de voz
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateCharacterVoice(characterId, { provider: 'browser' })}
              className={`p-3 border-2 rounded-lg transition-all ${
                !isElevenLabs
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-2 justify-center">
                <Globe size={18} />
                <span className="text-sm font-medium">Navegador</span>
              </div>
            </button>
            <button
              onClick={() => updateCharacterVoice(characterId, { provider: 'elevenlabs' })}
              disabled={!hasElevenLabsKey}
              className={`p-3 border-2 rounded-lg transition-all ${
                isElevenLabs
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              } ${!hasElevenLabsKey ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2 justify-center">
                <Sparkles size={18} />
                <span className="text-sm font-medium">ElevenLabs</span>
              </div>
            </button>
          </div>
          {!hasElevenLabsKey && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              ⚠️ Configura tu API Key de ElevenLabs en la pestaña "Voz IA"
            </p>
          )}
        </div>

        {/* Selector de Voz */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Voz
          </label>
          {isElevenLabs ? (
            <div className="space-y-2">
              {/* Selector de presets guardados */}
              {voicePresets.length > 0 && (
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Usar preset guardado
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const preset = voicePresets.find(p => p.id === e.target.value);
                        if (preset) {
                          applyPresetToCharacter(characterId, preset);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border-2 border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-2"
                  >
                    <option value="">⭐ Seleccionar preset...</option>
                    {voicePresets.map(preset => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name} ({preset.voiceName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selector manual de voces */}
              <select
                value={config.voiceConfig.voiceId || ''}
                onChange={(e) => {
                  const voice = ELEVENLABS_VOICES.find(v => v.id === e.target.value);
                  updateCharacterVoice(characterId, {
                    voiceId: voice.id,
                    voiceName: voice.name
                  });
                }}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Seleccionar voz manualmente...</option>
                {ELEVENLABS_VOICES.map(voice => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} - {voice.gender === 'female' ? '👩' : '👨'} {voice.accent}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <select
              value={config.voiceConfig.voiceName}
              onChange={(e) => updateCharacterVoice(characterId, { voiceName: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="Auto">Auto (por defecto)</option>
              {browserVoices.map((voice, idx) => (
                <option key={idx} value={voice.name}>
                  {voice.name} {voice.lang.includes('AR') ? '🇦🇷' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Controles de velocidad y volumen */}
        <div className="grid grid-cols-2 gap-4">
          {/* Velocidad */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Velocidad: {config.voiceConfig.rate.toFixed(2)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={config.voiceConfig.rate}
              onChange={(e) => updateCharacterVoice(characterId, { rate: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.5x</span>
              <span>2.0x</span>
            </div>
          </div>

          {/* Volumen */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Volumen: {Math.round(config.voiceConfig.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.voiceConfig.volume}
              onChange={(e) => updateCharacterVoice(characterId, { volume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header compacto - solo si no es alwaysOpen */}
      {!alwaysOpen && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all"
        >
          <div className="flex items-center gap-2">
            <SettingsIcon size={18} className="text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Voces por Personaje
            </span>
          </div>
          <BaseBadge variant="info" size="sm">
            {Object.keys(characterConfigs).length} personajes
          </BaseBadge>
        </button>
      )}

      {/* Panel expandible */}
      {isOpen && (
        <>
          {!alwaysOpen ? (
            <UniversalCard
              variant="default"
              size="md"
              title="Configuración de Voces por Personaje"
              subtitle="Asigna diferentes voces y configuraciones a cada personaje del diálogo"
            >
              <div className="space-y-4">
                {characters.length === 0 ? (
                  <div className="p-6 text-center text-gray-600 dark:text-gray-400">
                    <Volume2 size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No hay personajes disponibles aún.</p>
                    <p className="text-sm mt-2">Los personajes aparecerán automáticamente cuando cargues un diálogo.</p>
                  </div>
                ) : (
                  characters.map(char => renderCharacterCard(char.id))
                )}
              </div>
            </UniversalCard>
          ) : (
            /* Contenido SIN BaseCard cuando alwaysOpen=true */
            <div className="space-y-4">
              {characters.length === 0 ? (
                <div className="p-6 text-center text-gray-600 dark:text-gray-400">
                  <Volume2 size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No hay personajes disponibles aún.</p>
                  <p className="text-sm mt-2">Los personajes aparecerán automáticamente cuando cargues un diálogo.</p>
                </div>
              ) : (
                characters.map(char => renderCharacterCard(char.id))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

CharacterVoiceManager.propTypes = {
  characters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  onConfigChange: PropTypes.func,
  alwaysOpen: PropTypes.bool,
  teacherId: PropTypes.string
};

/**
 * Función helper para obtener la configuración de voz de un personaje
 */
export const getCharacterVoiceConfig = (characterId) => {
  const saved = localStorage.getItem('xiwen_character_voices');
  if (!saved) return DEFAULT_CHARACTER_CONFIG;

  try {
    const configs = JSON.parse(saved);
    return configs[characterId]?.voiceConfig || DEFAULT_CHARACTER_CONFIG;
  } catch (err) {
    logger.error('Error getting character voice config:', err);
    return DEFAULT_CHARACTER_CONFIG;
  }
};

export default CharacterVoiceManager;
