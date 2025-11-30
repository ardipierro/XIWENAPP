/**
 * @fileoverview Modal para configurar visualización de contenidos, traductor y pronunciación
 * @module components/settings/ContentDisplayModal
 */

import { useState, useEffect } from 'react';
import { Eye, Save, Volume2 } from 'lucide-react';
import { useCardConfig } from '../../contexts/CardConfigContext';
import { BaseModal, BaseButton, BaseAlert } from '../common';
import TranslatorConfigCard from './TranslatorConfigCard';
import SelectionSpeakerConfig from '../SelectionSpeakerConfig';
import { getAIConfig, saveAIConfig } from '../../firebase/aiConfig';
import logger from '../../utils/logger';

const DEFAULT_TRANSLATOR_CONFIG = {
  mode: 'ai',
  ai: {
    provider: 'openai',
    model: 'gpt-4.1',
    fallbackOnError: true
  },
  dictionary: {
    sources: {
      mdbg: true,
      wordreference: false,
      pleco: false
    },
    priority: 'mdbg',
    fallbackToAI: true
  },
  sections: {
    chinese: true,
    pinyin: true,
    meanings: true,
    meaningsLimit: 3,
    example: false,
    synonyms: false,
    hskLevel: false,
    classifier: false
  },
  display: {
    mode: 'compact',
    popupWidth: 320,
    chineseFontSize: 24,
    showIcons: true,
    animations: true,
    position: 'auto'
  }
};

const DEFAULT_SPEAKER_CONFIG = {
  enabled: true,
  provider: 'edgetts',
  model: 'eleven_multilingual_v2',
  systemPrompt: '',
  parameters: {
    rate: 1.0,
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.5,
    use_speaker_boost: true
  },
  voices: {
    edgetts: [
      { id: 'es-AR-female-1', name: 'Elena (Argentina - Femenina)', voiceId: 'es-AR-ElenaNeural', gender: 'female', accent: 'Argentina', description: 'Voz femenina natural con acento argentino', isDefault: true },
      { id: 'es-AR-male-1', name: 'Tomás (Argentina - Masculina)', voiceId: 'es-AR-TomasNeural', gender: 'male', accent: 'Argentina', description: 'Voz masculina natural con acento argentino' },
      { id: 'es-MX-female-1', name: 'Dalia (México - Femenina)', voiceId: 'es-MX-DaliaNeural', gender: 'female', accent: 'México', description: 'Voz femenina natural con acento mexicano' },
      { id: 'es-MX-male-1', name: 'Jorge (México - Masculina)', voiceId: 'es-MX-JorgeNeural', gender: 'male', accent: 'México', description: 'Voz masculina natural con acento mexicano' },
      { id: 'es-ES-female-1', name: 'Elvira (España - Femenina)', voiceId: 'es-ES-ElviraNeural', gender: 'female', accent: 'España', description: 'Voz femenina natural con acento español' }
    ],
    elevenlabs: [
      { id: 'bella-premium', name: 'Bella (Premium - Femenina)', voiceId: 'EXAVITQu4vr4xnSDxMaL', gender: 'female', description: 'Voz femenina premium de alta calidad', isDefault: true },
      { id: 'adam-premium', name: 'Adam (Premium - Masculina)', voiceId: 'pNInz6obpgDQGcFmaJgB', gender: 'male', description: 'Voz masculina premium de alta calidad' },
      { id: 'domi-premium', name: 'Domi (Premium - Femenina)', voiceId: 'AZnzlk1XvdvUeBnXmlld', gender: 'female', description: 'Voz femenina premium versátil' },
      { id: 'antoni-premium', name: 'Antoni (Premium - Masculina)', voiceId: 'ErXwobaYiN019PkySvjV', gender: 'male', description: 'Voz masculina premium versátil' }
    ]
  },
  selectedVoiceId: 'es-AR-female-1',
  allowStudentSelection: false,
  autoCache: true
};

function ContentDisplayModal({ isOpen, onClose }) {
  const { contentDisplayConfig, updateContentDisplayConfig } = useCardConfig();
  const [translatorConfig, setTranslatorConfig] = useState(DEFAULT_TRANSLATOR_CONFIG);
  const [speakerConfig, setSpeakerConfig] = useState(DEFAULT_SPEAKER_CONFIG);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Cargar configuración del traductor desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('xiwen_translator_config');
      if (saved) {
        setTranslatorConfig(JSON.parse(saved));
        logger.info('Translator config loaded from localStorage', 'ContentDisplayModal');
      }
    } catch (err) {
      logger.error('Error loading translator config', err, 'ContentDisplayModal');
    }
  }, [isOpen]);

  // Cargar configuración del speaker desde Firebase
  useEffect(() => {
    const loadSpeakerConfig = async () => {
      try {
        const aiConfig = await getAIConfig();
        if (aiConfig?.functions?.selection_speaker) {
          setSpeakerConfig(aiConfig.functions.selection_speaker);
          logger.info('Speaker config loaded from Firebase', 'ContentDisplayModal');
        } else {
          logger.info('No speaker config in Firebase, using defaults', 'ContentDisplayModal');
        }
      } catch (err) {
        logger.error('Error loading speaker config', err, 'ContentDisplayModal');
      }
    };

    if (isOpen) {
      loadSpeakerConfig();
    }
  }, [isOpen]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validaciones del traductor
      if (translatorConfig.mode === 'dictionary' || translatorConfig.mode === 'hybrid') {
        const hasSource = Object.values(translatorConfig.dictionary.sources).some(v => v === true);
        if (!hasSource) {
          throw new Error('Debes seleccionar al menos una fuente de diccionario');
        }
      }

      // Guardar configuración del traductor en localStorage
      localStorage.setItem('xiwen_translator_config', JSON.stringify(translatorConfig));
      window.dispatchEvent(new CustomEvent('xiwen_translator_config_changed', { detail: translatorConfig }));

      // Guardar configuración del speaker en Firebase
      const currentAIConfig = await getAIConfig() || { functions: {} };
      const updatedConfig = {
        ...currentAIConfig,
        functions: {
          ...currentAIConfig.functions,
          selection_speaker: speakerConfig
        }
      };
      await saveAIConfig(updatedConfig);

      logger.info('All configurations saved successfully', 'ContentDisplayModal');
      setSuccess('Configuración guardada correctamente');

      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err) {
      logger.error('Error saving configurations', err, 'ContentDisplayModal');
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handler para guardar config del speaker (desde SelectionSpeakerConfig)
  const handleSaveSpeakerConfig = async (newConfig) => {
    setSpeakerConfig(newConfig);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar: Traductor, Pronunciación y Visualización"
      icon={Eye}
      size="xl"
      footer={
        <div className="flex items-center justify-end w-full gap-2">
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
            Guardar
          </BaseButton>
        </div>
      }
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Alerts */}
        {error && (
          <BaseAlert variant="danger" title="Error" dismissible onDismiss={() => setError(null)}>
            {error}
          </BaseAlert>
        )}
        {success && (
          <BaseAlert variant="success" title="Éxito" dismissible onDismiss={() => setSuccess(null)}>
            {success}
          </BaseAlert>
        )}

        {/* SECCIÓN 1: Traductor Visual */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            🌐 Traductor Visual
          </h3>
          <TranslatorConfigCard
            config={translatorConfig}
            onChange={setTranslatorConfig}
          />
        </div>

        {/* Separador */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

        {/* SECCIÓN 2: Visualización de Contenidos */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            👁️ Visualización de Ejercicios y Lecciones
          </h3>

          {/* Modo de visualización */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Modo de visualización
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateContentDisplayConfig({ mode: 'compact' })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  contentDisplayConfig.mode === 'compact'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Compacto
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Sin headers redundantes, solo contenido esencial
                  </div>
                </div>
              </button>

              <button
                onClick={() => updateContentDisplayConfig({ mode: 'detailed' })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  contentDisplayConfig.mode === 'detailed'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Detallado
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Con headers, títulos y estructura completa
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Opciones avanzadas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Mostrar badges de metadata
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Tipo de ejercicio, dificultad, puntos
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={contentDisplayConfig.showMetadataBadges}
                  onChange={(e) => updateContentDisplayConfig({ showMetadataBadges: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Mostrar instrucciones
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Descripción y guía del ejercicio
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={contentDisplayConfig.showInstructions}
                  onChange={(e) => updateContentDisplayConfig({ showInstructions: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

        {/* SECCIÓN 3: Pronunciación */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Volume2 size={20} className="text-indigo-500" />
            Pronunciación de Texto Seleccionado
          </h3>
          <SelectionSpeakerConfig
            config={speakerConfig}
            onSave={handleSaveSpeakerConfig}
            onClose={() => {}}
          />
        </div>
      </div>
    </BaseModal>
  );
}

export default ContentDisplayModal;
