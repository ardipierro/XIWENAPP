/**
 * @fileoverview Profile Editor - Create/edit correction profiles
 * @module components/homework/ProfileEditor
 */

import { useState, useEffect } from 'react';
import { Save, X, Info, Sliders, Palette, Brain } from 'lucide-react';
import {
  BaseButton,
  BaseModal,
  BaseInput,
  BaseAlert
} from '../common';
import {
  createCorrectionProfile,
  updateCorrectionProfile,
  CHECK_TYPES,
  STRICTNESS_LEVELS
} from '../../firebase/correctionProfiles';
import {
  DEFAULT_ERROR_TYPE_CONFIG,
  DEFAULT_OVERLAY_CONFIG,
  DEFAULT_AI_CONFIG,
} from '../../config/errorTypeConfig';
import logger from '../../utils/logger';

const ICON_OPTIONS = ['🌱', '📚', '🎓', '⭐', '🔥', '💎', '🎯', '📝'];

export default function ProfileEditor({ profile, teacherId, onClose }) {
  const isEditing = !!profile;

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    description: profile?.description || '',
    icon: profile?.icon || '📝',
    settings: {
      checks: profile?.settings?.checks || [CHECK_TYPES.SPELLING],
      strictness: profile?.settings?.strictness || STRICTNESS_LEVELS.MODERATE,
      weights: profile?.settings?.weights || {
        spelling: 0.4,
        grammar: 0.4,
        punctuation: 0.2,
        vocabulary: 0
      },
      minGrade: profile?.settings?.minGrade || 50,
      display: profile?.settings?.display || {
        showDetailedErrors: true,
        showExplanations: true,
        showSuggestions: true,
        highlightOnImage: false
      },
      // AI Parameters
      ai: profile?.settings?.ai || {
        temperature: DEFAULT_AI_CONFIG.temperature,
        feedbackStyle: DEFAULT_AI_CONFIG.feedbackStyle,
      },
      // Overlay Visual Settings
      overlay: profile?.settings?.overlay || {
        colors: Object.keys(DEFAULT_ERROR_TYPE_CONFIG).reduce((acc, key) => {
          acc[key] = DEFAULT_ERROR_TYPE_CONFIG[key].color;
          return acc;
        }, {}),
        wave: { ...DEFAULT_OVERLAY_CONFIG.wave },
        text: { ...DEFAULT_OVERLAY_CONFIG.text },
      }
    }
  });

  // Track which advanced sections are expanded
  const [expandedSections, setExpandedSections] = useState({
    ai: false,
    overlay: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckToggle = (checkType) => {
    const currentChecks = formData.settings.checks;
    let newChecks;

    if (currentChecks.includes(checkType)) {
      // Don't allow removing the last check
      if (currentChecks.length === 1) return;
      newChecks = currentChecks.filter(c => c !== checkType);
    } else {
      newChecks = [...currentChecks, checkType];
    }

    setFormData({
      ...formData,
      settings: {
        ...formData.settings,
        checks: newChecks
      }
    });
  };

  const handleWeightChange = (type, value) => {
    setFormData({
      ...formData,
      settings: {
        ...formData.settings,
        weights: {
          ...formData.settings.weights,
          [type]: parseFloat(value)
        }
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validation
      if (!formData.name.trim()) {
        setError('El nombre es requerido');
        setSaving(false);
        return;
      }

      let result;
      if (isEditing) {
        result = await updateCorrectionProfile(profile.id, formData);
      } else {
        result = await createCorrectionProfile(teacherId, formData);
      }

      if (result.success) {
        logger.info(`Profile ${isEditing ? 'updated' : 'created'}`, 'ProfileEditor');
        onClose(true);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      logger.error('Error saving profile', 'ProfileEditor', err);
      setError('Error al guardar perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={() => onClose(false)}
      title={isEditing ? 'Editar Perfil' : 'Crear Perfil'}
      size="lg"
    >
      <div className="space-y-6">
        {error && (
          <BaseAlert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </BaseAlert>
        )}

        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Información Básica
          </h3>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Icono
            </label>
            <div className="flex gap-2 flex-wrap">
              {ICON_OPTIONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`text-2xl p-2 rounded-lg border-2 transition-colors ${
                    formData.icon === icon
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <BaseInput
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Principiantes (A1-A2)"
            required
          />

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción breve del perfil"
              rows={2}
              className="input"
            />
          </div>
        </div>

        {/* Check Types */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Tipos de Revisión
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.values(CHECK_TYPES).map(checkType => (
              <label
                key={checkType}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  formData.settings.checks.includes(checkType)
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.settings.checks.includes(checkType)}
                  onChange={() => handleCheckToggle(checkType)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-zinc-900 dark:text-white capitalize">
                  {checkType}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Strictness */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Nivel de Exigencia
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {Object.values(STRICTNESS_LEVELS).map(level => (
              <button
                key={level}
                onClick={() => setFormData({
                  ...formData,
                  settings: { ...formData.settings, strictness: level }
                })}
                className={`p-3 rounded-lg border-2 text-sm font-medium capitalize transition-colors ${
                  formData.settings.strictness === level
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Min Grade */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Calificación Mínima
          </h3>
          <BaseInput
            type="number"
            min="0"
            max="100"
            value={formData.settings.minGrade}
            onChange={(e) => setFormData({
              ...formData,
              settings: { ...formData.settings, minGrade: parseInt(e.target.value) }
            })}
          />
        </div>

        {/* Display Options */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Opciones de Visualización
          </h3>
          <div className="space-y-2">
            {Object.entries(formData.settings.display).map(([key, value]) => (
              <label key={key} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      display: {
                        ...formData.settings.display,
                        [key]: e.target.checked
                      }
                    }
                  })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {key === 'showDetailedErrors' && 'Mostrar errores detallados'}
                  {key === 'showExplanations' && 'Mostrar explicaciones'}
                  {key === 'showSuggestions' && 'Mostrar sugerencias'}
                  {key === 'highlightOnImage' && 'Resaltar en imagen'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Advanced: AI Parameters */}
        <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
          <button
            type="button"
            onClick={() => toggleSection('ai')}
            className="flex items-center justify-between w-full text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Brain size={18} />
              Parámetros de IA
            </span>
            <span className="text-xs text-zinc-500">
              {expandedSections.ai ? '▲' : '▼'}
            </span>
          </button>

          {expandedSections.ai && (
            <div className="space-y-4 pl-6 animate-in fade-in duration-200">
              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Temperatura: {formData.settings.ai.temperature}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={formData.settings.ai.temperature}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      ai: { ...formData.settings.ai, temperature: parseFloat(e.target.value) }
                    }
                  })}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                  <span>Consistente (0.1)</span>
                  <span>Creativo (1.0)</span>
                </div>
              </div>

              {/* Feedback Style */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Estilo de Feedback
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DEFAULT_AI_CONFIG.feedbackStyles.map(style => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          ai: { ...formData.settings.ai, feedbackStyle: style.value }
                        }
                      })}
                      className={`p-2 rounded-lg border-2 text-xs font-medium transition-colors ${
                        formData.settings.ai.feedbackStyle === style.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                      }`}
                      title={style.description}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Advanced: Overlay Settings */}
        <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
          <button
            type="button"
            onClick={() => toggleSection('overlay')}
            className="flex items-center justify-between w-full text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Palette size={18} />
              Estilo de Overlay Visual
            </span>
            <span className="text-xs text-zinc-500">
              {expandedSections.overlay ? '▲' : '▼'}
            </span>
          </button>

          {expandedSections.overlay && (
            <div className="space-y-4 pl-6 animate-in fade-in duration-200">
              {/* Error Colors */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Colores de Errores
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(DEFAULT_ERROR_TYPE_CONFIG).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.settings.overlay.colors[key] || config.color}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            overlay: {
                              ...formData.settings.overlay,
                              colors: {
                                ...formData.settings.overlay.colors,
                                [key]: e.target.value
                              }
                            }
                          }
                        })}
                        className="w-8 h-8 rounded border-2 border-zinc-300 dark:border-zinc-600 cursor-pointer"
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {config.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wave Parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Amplitud de Onda: {formData.settings.overlay.wave.amplitude}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={formData.settings.overlay.wave.amplitude}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        overlay: {
                          ...formData.settings.overlay,
                          wave: {
                            ...formData.settings.overlay.wave,
                            amplitude: parseInt(e.target.value)
                          }
                        }
                      }
                    })}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Frecuencia: {formData.settings.overlay.wave.frequency}
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="16"
                    step="2"
                    value={formData.settings.overlay.wave.frequency}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        overlay: {
                          ...formData.settings.overlay,
                          wave: {
                            ...formData.settings.overlay.wave,
                            frequency: parseInt(e.target.value)
                          }
                        }
                      }
                    })}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Font Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Fuente Mínima: {formData.settings.overlay.text.minFontSize}px
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="16"
                    step="1"
                    value={formData.settings.overlay.text.minFontSize}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        overlay: {
                          ...formData.settings.overlay,
                          text: {
                            ...formData.settings.overlay.text,
                            minFontSize: parseInt(e.target.value)
                          }
                        }
                      }
                    })}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Fuente Máxima: {formData.settings.overlay.text.maxFontSize}px
                  </label>
                  <input
                    type="range"
                    min="16"
                    max="28"
                    step="1"
                    value={formData.settings.overlay.text.maxFontSize}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        overlay: {
                          ...formData.settings.overlay,
                          text: {
                            ...formData.settings.overlay.text,
                            maxFontSize: parseInt(e.target.value)
                          }
                        }
                      }
                    })}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <BaseButton
            variant="outline"
            onClick={() => onClose(false)}
            disabled={saving}
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            loading={saving}
            fullWidth
          >
            <Save size={18} strokeWidth={2} />
            {saving ? 'Guardando' : isEditing ? 'Actualizar' : 'Crear'}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}
