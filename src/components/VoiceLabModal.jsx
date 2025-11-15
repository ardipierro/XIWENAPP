/**
 * @fileoverview Voice Lab Modal - Explora y configura voces de ElevenLabs
 * @module components/VoiceLabModal
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Volume2,
  Play,
  Save,
  Trash2,
  Copy,
  RefreshCw,
  Filter,
  Search,
  Sliders,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Edit3,
  X
} from 'lucide-react';
import {
  BaseModal,
  BaseButton,
  BaseInput,
  BaseTextarea,
  BaseAlert,
  BaseBadge,
  BaseEmptyState,
  BaseTabs
} from './common';
import premiumTTSService from '../services/premiumTTSService';
import {
  getVoicePresetsByTeacher,
  createVoicePreset,
  updateVoicePreset,
  deleteVoicePreset,
  duplicateVoicePreset
} from '../firebase/voicePresets';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';

/**
 * Voice Lab Modal - Interfaz completa para gestionar voces
 */
function VoiceLabModal({ isOpen, onClose, aiFunction, initialConfig, onSave }) {
  const { user } = useAuth();

  // Estado de configuración
  const [config, setConfig] = useState(aiFunction.defaultConfig);

  // Estado de voces disponibles
  const [voices, setVoices] = useState([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [voicesError, setVoicesError] = useState(null);

  // Estado de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(null);

  // Estado de test de voz
  const [testText, setTestText] = useState('¡Hola! Soy una voz argentina. ¿Cómo andás?');
  const [testingVoiceId, setTestingVoiceId] = useState(null); // ID de la voz que se está probando
  const [testError, setTestError] = useState(null);

  // Estado de presets
  const [presets, setPresets] = useState([]);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [editingPreset, setEditingPreset] = useState(null);

  // Estado de tabs
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'presets'

  // Estado general
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      setConfig(initialConfig || aiFunction.defaultConfig);
      loadVoices();
      loadPresets();

      // Limpiar estados
      setError(null);
      setSuccess(null);
      setTestError(null);
    }
  }, [isOpen, initialConfig]);

  /**
   * Cargar todas las voces desde ElevenLabs
   */
  const loadVoices = async () => {
    setLoadingVoices(true);
    setVoicesError(null);

    try {
      const allVoices = await premiumTTSService.getAllVoices();
      setVoices(allVoices);
      logger.info(`Loaded ${allVoices.length} voices from ElevenLabs`);
    } catch (err) {
      logger.error('Error loading voices:', err);
      setVoicesError(err.message || 'Error al cargar voces');
    } finally {
      setLoadingVoices(false);
    }
  };

  /**
   * Cargar presets del profesor
   */
  const loadPresets = async () => {
    if (!user?.uid) return;

    setLoadingPresets(true);
    try {
      const teacherPresets = await getVoicePresetsByTeacher(user.uid);
      setPresets(teacherPresets);
      logger.info(`Loaded ${teacherPresets.length} voice presets`);
    } catch (err) {
      logger.error('Error loading presets:', err);
    } finally {
      setLoadingPresets(false);
    }
  };

  /**
   * Probar voz con configuración actual
   */
  const handleTestVoice = async (voice) => {
    if (!testText.trim()) {
      setTestError('Por favor, ingresa texto para probar');
      return;
    }

    setTestingVoiceId(voice.voice_id);
    setTestError(null);

    try {
      const voiceSettings = {
        stability: config.parameters.stability,
        similarity_boost: config.parameters.similarity_boost,
        style: config.parameters.style,
        use_speaker_boost: config.parameters.use_speaker_boost
      };

      const result = await premiumTTSService.generateWithElevenLabs(
        testText,
        voice.voice_id,
        voiceSettings
      );

      if (result.audioUrl) {
        const audio = new Audio(result.audioUrl);
        audio.play();
        audio.onended = () => {
          premiumTTSService.cleanup(result.audioUrl);
          setTestingVoiceId(null);
        };
      }

      logger.info('Voice test successful:', voice.name);
    } catch (err) {
      logger.error('Voice test failed:', err);
      setTestError(err.message || 'Error al probar la voz');
    } finally {
      setTestingVoiceId(null);
    }
  };

  /**
   * Actualizar parámetro de configuración
   */
  const updateParameter = (param, value) => {
    setConfig(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [param]: value
      }
    }));
  };

  /**
   * Seleccionar voz
   */
  const handleSelectVoice = (voice) => {
    setSelectedVoice(voice);
    setConfig(prev => ({
      ...prev,
      selectedVoiceId: voice.voice_id,
      selectedVoiceName: voice.name
    }));
  };

  /**
   * Guardar preset
   */
  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      setError('Por favor, ingresa un nombre para el preset');
      return;
    }

    if (!selectedVoice) {
      setError('Por favor, selecciona una voz primero');
      return;
    }

    setSavingPreset(true);
    setError(null);

    try {
      const preset = {
        name: presetName.trim(),
        teacherId: user.uid,
        voiceId: selectedVoice.voice_id,
        voiceName: selectedVoice.name,
        model: config.model,
        stability: config.parameters.stability,
        similarity_boost: config.parameters.similarity_boost,
        style: config.parameters.style,
        use_speaker_boost: config.parameters.use_speaker_boost
      };

      if (editingPreset) {
        await updateVoicePreset(editingPreset.id, preset);
        setSuccess('Preset actualizado exitosamente');
      } else {
        await createVoicePreset(preset);
        setSuccess('Preset guardado exitosamente');
      }

      setPresetName('');
      setEditingPreset(null);
      await loadPresets();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error('Error saving preset:', err);
      setError(err.message || 'Error al guardar preset');
    } finally {
      setSavingPreset(false);
    }
  };

  /**
   * Cargar preset
   */
  const handleLoadPreset = (preset) => {
    const voice = voices.find(v => v.voice_id === preset.voiceId);
    if (voice) {
      setSelectedVoice(voice);
    }

    setConfig(prev => ({
      ...prev,
      selectedVoiceId: preset.voiceId,
      selectedVoiceName: preset.voiceName,
      model: preset.model,
      parameters: {
        stability: preset.stability,
        similarity_boost: preset.similarity_boost,
        style: preset.style,
        use_speaker_boost: preset.use_speaker_boost
      }
    }));

    setSuccess(`Preset "${preset.name}" cargado`);
    setTimeout(() => setSuccess(null), 3000);
  };

  /**
   * Eliminar preset
   */
  const handleDeletePreset = async (presetId) => {
    if (!confirm('¿Estás seguro de eliminar este preset?')) return;

    try {
      await deleteVoicePreset(presetId);
      setSuccess('Preset eliminado');
      await loadPresets();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error('Error deleting preset:', err);
      setError('Error al eliminar preset');
    }
  };

  /**
   * Duplicar preset
   */
  const handleDuplicatePreset = async (preset) => {
    const newName = `${preset.name} (copia)`;

    try {
      await duplicateVoicePreset(preset.id, newName);
      setSuccess('Preset duplicado');
      await loadPresets();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error('Error duplicating preset:', err);
      setError('Error al duplicar preset');
    }
  };

  /**
   * Guardar configuración general
   */
  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      setError(null);

      await onSave(aiFunction.id, config);
      setSuccess('Configuración guardada');

      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err) {
      logger.error('Error saving config:', err);
      setError(err.message || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  // Filtrar voces
  const filteredVoices = voices.filter(voice =>
    voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voice.labels?.language?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Laboratorio de Voces"
      icon={Volume2}
      size="lg"
      footer={
        <>
          <BaseButton
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cerrar
          </BaseButton>
          <BaseButton
            variant="primary"
            icon={Save}
            onClick={handleSaveConfig}
            loading={saving}
          >
            Guardar Configuración
          </BaseButton>
        </>
      }
    >
      <div className="space-y-6">
        {/* Alertas */}
        {error && (
          <BaseAlert variant="danger" title="Error" dismissible onDismiss={() => setError(null)}>
            {error}
          </BaseAlert>
        )}

        {success && (
          <BaseAlert variant="success" dismissible onDismiss={() => setSuccess(null)}>
            {success}
          </BaseAlert>
        )}

        {/* Descripción */}
        <BaseAlert variant="info" icon={Sparkles}>
          Explora todas las voces disponibles en tu cuenta de ElevenLabs, pruébalas con diferentes parámetros y guarda tus configuraciones favoritas como presets.
        </BaseAlert>

        {/* Tabs */}
        <BaseTabs
          tabs={[
            { id: 'explore', label: 'Explorar Voces', icon: Search, badge: voices.length },
            { id: 'presets', label: 'Mis Presets', icon: Save, badge: presets.length }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="underline"
          size="sm"
        />

        {/* TAB: Explorar Voces */}
        {activeTab === 'explore' && (
          <div className="space-y-6">
            {/* Barra de búsqueda y reload */}
            <div className="flex gap-2">
              <div className="flex-1">
                <BaseInput
                  placeholder="Buscar por nombre o idioma..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={Search}
                />
              </div>
              <BaseButton
                variant="secondary"
                icon={RefreshCw}
                onClick={loadVoices}
                disabled={loadingVoices}
              >
                Recargar
              </BaseButton>
            </div>

            {/* Error de carga */}
            {voicesError && (
              <BaseAlert variant="danger" icon={AlertCircle}>
                {voicesError}
              </BaseAlert>
            )}

            {/* Loading */}
            {loadingVoices && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-purple-500" size={48} />
              </div>
            )}

            {/* Grid de voces */}
            {!loadingVoices && !voicesError && filteredVoices.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                {filteredVoices.map((voice) => (
                  <div
                    key={voice.voice_id}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedVoice?.voice_id === voice.voice_id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => handleSelectVoice(voice)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {voice.name}
                        </h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {voice.labels?.accent && (
                            <BaseBadge variant="info" size="sm">
                              {voice.labels.accent}
                            </BaseBadge>
                          )}
                          {voice.labels?.gender && (
                            <BaseBadge variant="default" size="sm">
                              {voice.labels.gender}
                            </BaseBadge>
                          )}
                          {voice.labels?.age && (
                            <BaseBadge variant="default" size="sm">
                              {voice.labels.age}
                            </BaseBadge>
                          )}
                        </div>
                      </div>
                      {selectedVoice?.voice_id === voice.voice_id && (
                        <CheckCircle className="text-purple-500 flex-shrink-0" size={18} />
                      )}
                    </div>

                    <BaseButton
                      size="sm"
                      variant="ghost"
                      icon={Play}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestVoice(voice);
                      }}
                      disabled={testingVoiceId === voice.voice_id}
                      fullWidth
                    >
                      {testingVoiceId === voice.voice_id ? 'Reproduciendo...' : 'Probar voz'}
                    </BaseButton>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loadingVoices && !voicesError && filteredVoices.length === 0 && (
              <BaseEmptyState
                icon={Search}
                title="No se encontraron voces"
                description="Intenta con otro término de búsqueda"
              />
            )}

            {/* Controles de parámetros */}
            {selectedVoice && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sliders size={18} />
                  Configuración de Voz
                </h3>

                {/* Campo de texto de prueba */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Texto de prueba
                  </label>
                  <BaseTextarea
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    rows={2}
                    placeholder="Escribe el texto que quieres escuchar..."
                  />
                </div>

                {/* Stability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estabilidad: {config.parameters.stability.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={config.parameters.stability}
                    onChange={(e) => updateParameter('stability', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Mayor estabilidad = menos variación en la voz
                  </p>
                </div>

                {/* Similarity Boost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fidelidad: {config.parameters.similarity_boost.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={config.parameters.similarity_boost}
                    onChange={(e) => updateParameter('similarity_boost', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Mayor fidelidad = más parecida a la voz original
                  </p>
                </div>

                {/* Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expresividad: {config.parameters.style.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={config.parameters.style}
                    onChange={(e) => updateParameter('style', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Mayor expresividad = más emoción en la voz
                  </p>
                </div>

                {/* Speaker Boost */}
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Speaker Boost
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Mejora claridad y nitidez
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.parameters.use_speaker_boost}
                    onChange={(e) => updateParameter('use_speaker_boost', e.target.checked)}
                    className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                {/* Error de test */}
                {testError && (
                  <BaseAlert variant="danger" size="sm" dismissible onDismiss={() => setTestError(null)}>
                    {testError}
                  </BaseAlert>
                )}

                {/* Botón de test grande */}
                <BaseButton
                  variant="primary"
                  icon={Play}
                  onClick={() => handleTestVoice(selectedVoice)}
                  disabled={testingVoiceId !== null || !testText.trim()}
                  loading={testingVoiceId !== null}
                  fullWidth
                  size="lg"
                >
                  {testingVoiceId !== null ? 'Reproduciendo...' : 'Probar con esta configuración'}
                </BaseButton>

                {/* Guardar como preset */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Guardar configuración actual como preset
                  </h4>
                  <div className="flex gap-2">
                    <BaseInput
                      placeholder="Nombre del preset..."
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                    />
                    <BaseButton
                      variant="primary"
                      icon={editingPreset ? Edit3 : Save}
                      onClick={handleSavePreset}
                      disabled={savingPreset || !presetName.trim()}
                      loading={savingPreset}
                    >
                      {editingPreset ? 'Actualizar' : 'Guardar'}
                    </BaseButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Presets Guardados */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            {loadingPresets && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-purple-500" size={48} />
              </div>
            )}

            {!loadingPresets && presets.length === 0 && (
              <BaseEmptyState
                icon={Save}
                title="No tienes presets guardados"
                description="Crea tu primer preset explorando voces y ajustando parámetros"
                action={
                  <BaseButton
                    variant="primary"
                    icon={Plus}
                    onClick={() => setActiveTab('explore')}
                  >
                    Explorar Voces
                  </BaseButton>
                }
              />
            )}

            {!loadingPresets && presets.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {preset.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {preset.voiceName}
                        </p>
                      </div>
                      {preset.usageCount > 0 && (
                        <BaseBadge variant="info" size="sm">
                          {preset.usageCount} usos
                        </BaseBadge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-600 dark:text-gray-400">
                      <div>Estabilidad: {preset.stability.toFixed(2)}</div>
                      <div>Fidelidad: {preset.similarity_boost.toFixed(2)}</div>
                      <div>Expresividad: {preset.style.toFixed(2)}</div>
                      <div>Boost: {preset.use_speaker_boost ? 'Sí' : 'No'}</div>
                    </div>

                    <div className="flex gap-2">
                      <BaseButton
                        size="sm"
                        variant="primary"
                        icon={CheckCircle}
                        onClick={() => handleLoadPreset(preset)}
                        fullWidth
                      >
                        Usar
                      </BaseButton>
                      <BaseButton
                        size="sm"
                        variant="secondary"
                        icon={Copy}
                        onClick={() => handleDuplicatePreset(preset)}
                      >
                        Duplicar
                      </BaseButton>
                      <BaseButton
                        size="sm"
                        variant="danger"
                        icon={Trash2}
                        onClick={() => handleDeletePreset(preset.id)}
                      >
                        Eliminar
                      </BaseButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
}

VoiceLabModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  aiFunction: PropTypes.object.isRequired,
  initialConfig: PropTypes.object,
  onSave: PropTypes.func.isRequired
};

export default VoiceLabModal;
