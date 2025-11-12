/**
 * @fileoverview Profile Editor - Create/edit correction profiles
 * @module components/homework/ProfileEditor
 */

import { useState, useEffect } from 'react';
import { Save, X, Info } from 'lucide-react';
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
      }
    }
  });

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
