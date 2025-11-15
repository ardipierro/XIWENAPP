/**
 * SelectionSpeakerConfig Component
 * Configuración especializada para pronunciación de texto seleccionado
 * Permite elegir proveedor, voz, velocidad y parámetros de TTS
 */

import React, { useState, useEffect } from 'react';
import { Volume2, Play, Settings, Check, Info } from 'lucide-react';
import PropTypes from 'prop-types';
import logger from '../utils/logger';
import {
  BaseButton,
  BaseSelect,
  BaseAlert,
  BaseBadge
} from './common';

/**
 * Configuración de voces para selection_speaker
 */
const SelectionSpeakerConfig = ({ config, onSave, onClose }) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [testingVoice, setTestingVoice] = useState(null);
  const [saving, setSaving] = useState(false);

  // Update local config when prop changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  /**
   * Get available voices for current provider
   */
  const getAvailableVoices = () => {
    const provider = localConfig.provider || 'edgetts';
    const voices = localConfig.voices?.[provider] || [];
    return voices.map(v => ({
      value: v.id,
      label: `${v.name} ${v.gender === 'female' ? '♀' : '♂'}`,
      voice: v
    }));
  };

  /**
   * Test voice with sample text
   */
  const handleTestVoice = async (voiceId) => {
    try {
      setTestingVoice(voiceId);
      logger.info(`Testing voice: ${voiceId}`, 'SelectionSpeakerConfig');

      // TODO: Implement voice testing with useSpeaker hook
      // For now, just simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setTestingVoice(null);
    } catch (err) {
      logger.error('Error testing voice:', err, 'SelectionSpeakerConfig');
      setTestingVoice(null);
    }
  };

  /**
   * Handle save configuration
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(localConfig);
      logger.info('Selection speaker config saved', 'SelectionSpeakerConfig');
    } catch (err) {
      logger.error('Error saving config:', err, 'SelectionSpeakerConfig');
    } finally {
      setSaving(false);
    }
  };

  const availableVoices = getAvailableVoices();
  const selectedVoice = availableVoices.find(v => v.value === localConfig.selectedVoiceId)?.voice;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Volume2 size={20} />
          Configuración de Pronunciación
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configura cómo se pronunciará el texto seleccionado por los alumnos
        </p>
      </div>

      {/* Provider Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Proveedor de Voz
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Edge TTS - Free */}
          <button
            onClick={() => setLocalConfig(prev => ({
              ...prev,
              provider: 'edgetts',
              selectedVoiceId: 'es-AR-female-1'
            }))}
            className={`
              p-4 rounded-lg border-2 transition-all text-left
              ${localConfig.provider === 'edgetts'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Edge TTS
                  </span>
                  <BaseBadge variant="success" size="sm">GRATIS</BaseBadge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Voces neuronales de Azure. 5 voces disponibles.
                </p>
              </div>
              {localConfig.provider === 'edgetts' && (
                <Check size={20} className="text-blue-500 flex-shrink-0" />
              )}
            </div>
          </button>

          {/* ElevenLabs - Premium */}
          <button
            onClick={() => setLocalConfig(prev => ({
              ...prev,
              provider: 'elevenlabs',
              selectedVoiceId: 'bella-premium'
            }))}
            className={`
              p-4 rounded-lg border-2 transition-all text-left
              ${localConfig.provider === 'elevenlabs'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ElevenLabs
                  </span>
                  <BaseBadge variant="warning" size="sm">PREMIUM</BaseBadge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Voces de alta calidad. Requiere API key.
                </p>
              </div>
              {localConfig.provider === 'elevenlabs' && (
                <Check size={20} className="text-indigo-500 flex-shrink-0" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Voice Selection */}
      {availableVoices.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            Voz Seleccionada
          </label>
          <BaseSelect
            value={localConfig.selectedVoiceId}
            onChange={(e) => setLocalConfig(prev => ({
              ...prev,
              selectedVoiceId: e.target.value
            }))}
            options={availableVoices}
          />

          {/* Voice Details */}
          {selectedVoice && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedVoice.name}
                    </span>
                    <BaseBadge variant="default" size="sm">
                      {selectedVoice.gender === 'female' ? 'Femenina' : 'Masculina'}
                    </BaseBadge>
                    {selectedVoice.accent && (
                      <BaseBadge variant="info" size="sm">
                        {selectedVoice.accent}
                      </BaseBadge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedVoice.description}
                  </p>
                </div>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  icon={Play}
                  onClick={() => handleTestVoice(selectedVoice.id)}
                  loading={testingVoice === selectedVoice.id}
                >
                  Probar
                </BaseButton>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Speed Control */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Velocidad de Habla
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={localConfig.parameters?.rate || 1.0}
            onChange={(e) => setLocalConfig(prev => ({
              ...prev,
              parameters: {
                ...prev.parameters,
                rate: parseFloat(e.target.value)
              }
            }))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>0.5x (Lento)</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {(localConfig.parameters?.rate || 1.0).toFixed(1)}x
            </span>
            <span>2.0x (Rápido)</span>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <BaseAlert variant="info" border>
        <div className="flex gap-2">
          <Info size={16} className="flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">💡 Cómo funciona:</p>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Los alumnos seleccionan texto y hacen clic en "Pronunciar"</li>
              <li>• El audio se genera con la voz configurada aquí</li>
              <li>• Los audios se cachean automáticamente (más rápido y económico)</li>
              <li>• Cache hit rate esperado: 70-85% para palabras comunes</li>
            </ul>
          </div>
        </div>
      </BaseAlert>

      {/* ElevenLabs Warning */}
      {localConfig.provider === 'elevenlabs' && (
        <BaseAlert variant="warning" border>
          <div className="flex gap-2">
            <Settings size={16} className="flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">⚠️ Configuración requerida</p>
              <p className="text-gray-600 dark:text-gray-400">
                Para usar ElevenLabs, configura tu API key en la sección{' '}
                <span className="font-semibold">Configuración → Credenciales</span>.
              </p>
            </div>
          </div>
        </BaseAlert>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <BaseButton
          variant="ghost"
          onClick={onClose}
        >
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          onClick={handleSave}
          loading={saving}
        >
          Guardar Configuración
        </BaseButton>
      </div>
    </div>
  );
};

SelectionSpeakerConfig.propTypes = {
  config: PropTypes.shape({
    enabled: PropTypes.bool,
    provider: PropTypes.string,
    selectedVoiceId: PropTypes.string,
    parameters: PropTypes.object,
    voices: PropTypes.object
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default SelectionSpeakerConfig;
