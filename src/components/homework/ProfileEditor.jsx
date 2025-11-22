/**
 * @fileoverview Profile Editor - Create/edit correction profiles
 * @module components/homework/ProfileEditor
 */

import { useState, useEffect } from 'react';
import { Save, X, Info, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  BaseButton,
  BaseModal,
  BaseInput,
  BaseAlert
} from '../common';
import {
  createCorrectionProfile,
  updateCorrectionProfile,
  deleteCorrectionProfile,
  CHECK_TYPES,
  STRICTNESS_LEVELS
} from '../../firebase/correctionProfiles';
import PresetSelector from './PresetSelector';
import { getPreset } from '../../config/correctionPresets';
import logger from '../../utils/logger';

const ICON_OPTIONS = ['🌱', '📚', '🎓', '⭐', '🔥', '💎', '🎯', '📝'];

export default function ProfileEditor({ profile, userId, onClose }) {
  const isEditing = !!profile;
  const [showPresets, setShowPresets] = useState(!isEditing); // Mostrar presets para nuevos perfiles
  const [selectedPreset, setSelectedPreset] = useState(null);

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
      visualization: profile?.settings?.visualization || {
        highlightOpacity: 0.25,
        useWavyUnderline: true,
        showCorrectionText: true,
        correctionTextFont: 'Caveat',
        colors: {
          spelling: '#ef4444',
          grammar: '#f97316',
          punctuation: '#eab308',
          vocabulary: '#5b8fa3'
        },
        strokeWidth: 2,
        strokeOpacity: 0.8
      }
    }
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handle preset selection - loads config from preset
   */
  const handlePresetSelect = (presetId, presetConfig) => {
    const preset = getPreset(presetId);
    if (!preset) return;

    setSelectedPreset(presetId);
    setFormData({
      name: preset.name,
      description: preset.description,
      icon: preset.icon,
      settings: {
        checks: presetConfig.checks,
        strictness: presetConfig.strictness,
        weights: presetConfig.weights,
        minGrade: presetConfig.minGrade,
        display: presetConfig.display,
        visualization: presetConfig.visualization
      }
    });
    setShowPresets(false); // Ocultar presets después de seleccionar
  };

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

  const handleDelete = async () => {
    if (!profile || !profile.id) {
      logger.warn('No se puede eliminar: no hay perfil cargado', 'ProfileEditor');
      return;
    }

    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar el perfil "${formData.name}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await deleteCorrectionProfile(profile.id);
      logger.info(`Perfil eliminado: ${profile.id}`, 'ProfileEditor');

      onClose(true); // true indica que se hizo un cambio
    } catch (err) {
      logger.error('Error al eliminar perfil:', err, 'ProfileEditor');
      setError('Error al eliminar el perfil. Por favor, inténtalo de nuevo.');
      setSaving(false);
    }
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
        // Create universal profile (userId should be admin's ID)
        result = await createCorrectionProfile(userId, formData);
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

        {/* Preset Selector - Solo para nuevos perfiles */}
        {!isEditing && (
          <div className="space-y-3">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center justify-between w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {selectedPreset ? `Basado en: ${getPreset(selectedPreset)?.name || 'Personalizado'}` : 'Usar plantilla predefinida'}
              </span>
              {showPresets ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showPresets && (
              <PresetSelector
                onSelect={handlePresetSelect}
                currentPreset={selectedPreset}
                onCustom={() => setShowPresets(false)}
              />
            )}
          </div>
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

        {/* Visual Style Configuration */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Estilo Visual de Marcado
          </h3>

          {/* Highlight Intensity */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Intensidad de resaltado
            </label>
            <select
              value={formData.settings.visualization.highlightOpacity}
              onChange={(e) => setFormData({
                ...formData,
                settings: {
                  ...formData.settings,
                  visualization: {
                    ...formData.settings.visualization,
                    highlightOpacity: parseFloat(e.target.value)
                  }
                }
              })}
              className="input"
            >
              <option value={0.15}>Baja (15%)</option>
              <option value={0.25}>Media (25%)</option>
              <option value={0.40}>Alta (40%)</option>
            </select>
          </div>

          {/* Underline Style */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Estilo de subrayado
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 flex-1 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:border-zinc-400 dark:hover:border-zinc-500">
                <input
                  type="radio"
                  checked={!formData.settings.visualization.useWavyUnderline}
                  onChange={() => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      visualization: {
                        ...formData.settings.visualization,
                        useWavyUnderline: false
                      }
                    }
                  })}
                  className="w-4 h-4"
                />
                <span className="text-sm">━━━ Recto</span>
              </label>
              <label className="flex items-center gap-2 flex-1 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:border-zinc-400 dark:hover:border-zinc-500">
                <input
                  type="radio"
                  checked={formData.settings.visualization.useWavyUnderline}
                  onChange={() => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      visualization: {
                        ...formData.settings.visualization,
                        useWavyUnderline: true
                      }
                    }
                  })}
                  className="w-4 h-4"
                />
                <span className="text-sm">∿∿∿ Ondulado</span>
              </label>
            </div>
          </div>

          {/* Stroke Width */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Grosor de trazo: {formData.settings.visualization.strokeWidth}px
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={formData.settings.visualization.strokeWidth}
              onChange={(e) => setFormData({
                ...formData,
                settings: {
                  ...formData.settings,
                  visualization: {
                    ...formData.settings.visualization,
                    strokeWidth: parseFloat(e.target.value)
                  }
                }
              })}
              className="w-full"
            />
          </div>

          {/* Stroke Opacity */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Opacidad de trazo: {Math.round(formData.settings.visualization.strokeOpacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formData.settings.visualization.strokeOpacity}
              onChange={(e) => setFormData({
                ...formData,
                settings: {
                  ...formData.settings,
                  visualization: {
                    ...formData.settings.visualization,
                    strokeOpacity: parseFloat(e.target.value)
                  }
                }
              })}
              className="w-full"
            />
          </div>

          {/* AI Correction Text */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.settings.visualization.showCorrectionText}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: {
                    ...formData.settings,
                    visualization: {
                      ...formData.settings.visualization,
                      showCorrectionText: e.target.checked
                    }
                  }
                })}
                className="w-4 h-4"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                Mostrar correcciones escritas por IA
              </span>
            </label>
          </div>

          {/* Font Selector */}
          {formData.settings.visualization.showCorrectionText && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Fuente de correcciones
              </label>
              <select
                value={formData.settings.visualization.correctionTextFont}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: {
                    ...formData.settings,
                    visualization: {
                      ...formData.settings.visualization,
                      correctionTextFont: e.target.value
                    }
                  }
                })}
                className="input"
                style={{ fontFamily: formData.settings.visualization.correctionTextFont }}
              >
                <option value="Caveat" style={{ fontFamily: 'Caveat' }}>Caveat</option>
                <option value="Shadows Into Light" style={{ fontFamily: 'Shadows Into Light' }}>Shadows Into Light</option>
                <option value="Indie Flower" style={{ fontFamily: 'Indie Flower' }}>Indie Flower</option>
                <option value="Patrick Hand" style={{ fontFamily: 'Patrick Hand' }}>Patrick Hand</option>
              </select>
            </div>
          )}

          {/* Error Colors */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Colores por tipo de error
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                  🔴 Ortografía
                </label>
                <input
                  type="color"
                  value={formData.settings.visualization.colors.spelling}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      visualization: {
                        ...formData.settings.visualization,
                        colors: {
                          ...formData.settings.visualization.colors,
                          spelling: e.target.value
                        }
                      }
                    }
                  })}
                  className="w-full h-10 rounded border border-zinc-300 dark:border-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                  🟠 Gramática
                </label>
                <input
                  type="color"
                  value={formData.settings.visualization.colors.grammar}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      visualization: {
                        ...formData.settings.visualization,
                        colors: {
                          ...formData.settings.visualization.colors,
                          grammar: e.target.value
                        }
                      }
                    }
                  })}
                  className="w-full h-10 rounded border border-zinc-300 dark:border-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                  🟡 Puntuación
                </label>
                <input
                  type="color"
                  value={formData.settings.visualization.colors.punctuation}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      visualization: {
                        ...formData.settings.visualization,
                        colors: {
                          ...formData.settings.visualization.colors,
                          punctuation: e.target.value
                        }
                      }
                    }
                  })}
                  className="w-full h-10 rounded border border-zinc-300 dark:border-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                  🔵 Vocabulario
                </label>
                <input
                  type="color"
                  value={formData.settings.visualization.colors.vocabulary}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      visualization: {
                        ...formData.settings.visualization,
                        colors: {
                          ...formData.settings.visualization.colors,
                          vocabulary: e.target.value
                        }
                      }
                    }
                  })}
                  className="w-full h-10 rounded border border-zinc-300 dark:border-zinc-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          {/* Botón Eliminar a la izquierda (solo en modo edición) */}
          <div>
            {isEditing && (
              <BaseButton
                variant="danger"
                onClick={handleDelete}
                disabled={saving}
              >
                <Trash2 size={18} strokeWidth={2} />
                Eliminar
              </BaseButton>
            )}
          </div>

          {/* Botones de acción a la derecha */}
          <div className="flex gap-3">
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
            >
              <Save size={18} strokeWidth={2} />
              {saving ? 'Guardando' : isEditing ? 'Actualizar' : 'Crear'}
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
