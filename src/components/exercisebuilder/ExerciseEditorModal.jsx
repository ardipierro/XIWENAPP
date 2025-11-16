/**
 * @fileoverview Modal para editar ejercicios individuales con configuración de aspecto
 * @module components/exercisebuilder/ExerciseEditorModal
 */

import { useState } from 'react';
import { Edit3, Type, Palette, Settings, Save, X } from 'lucide-react';
import { BaseButton, BaseModal, BaseBadge } from '../common';
import { UniversalCard } from '../cards';
import {
  MultipleChoiceExercise,
  FillInBlankExercise,
  MatchingExercise,
  TrueFalseExercise,
  AudioListeningExercise,
  TextSelectionExercise,
  DragDropOrderExercise,
  DialogueRolePlayExercise,
  VerbIdentificationExercise,
  InteractiveReadingExercise,
  AIAudioPronunciationExercise,
  FreeDragDropExercise,
  ClozeTestExercise,
  SentenceBuilderExercise,
  DictationExercise,
  ErrorDetectionExercise,
  CollocationMatchingExercise,
  GrammarTransformationExercise,
  HotspotImageExercise,
  DialogueCompletionExercise
} from './exercises';

/**
 * Modal de edición de ejercicio individual
 * Permite preview + configuración de aspecto específica
 */
export function ExerciseEditorModal({ exercise, isOpen, onClose, onSave }) {
  const [localExercise, setLocalExercise] = useState(exercise);
  const [settings, setSettings] = useState({
    fontSize: exercise.settings?.fontSize || 16,
    fontFamily: exercise.settings?.fontFamily || 'system',
    lineHeight: exercise.settings?.lineHeight || 1.5,
    feedbackColors: exercise.settings?.feedbackColors || {
      correct: '#10b981',
      incorrect: '#ef4444',
      neutral: '#71717a'
    },
    animations: exercise.settings?.animations !== false,
    soundEffects: exercise.settings?.soundEffects !== false
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleColorChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      feedbackColors: {
        ...prev.feedbackColors,
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    onSave({
      ...localExercise,
      settings
    });
    onClose();
  };

  const renderPreview = () => {
    const previewProps = {
      ...localExercise,
      onComplete: () => {},
      // Aplicar settings al preview
      style: {
        fontSize: `${settings.fontSize}px`,
        fontFamily: settings.fontFamily === 'system' ? 'inherit' : settings.fontFamily,
        lineHeight: settings.lineHeight
      }
    };

    switch (localExercise.type) {
      case 'mcq':
        return <MultipleChoiceExercise {...previewProps} />;
      case 'blank':
        return <FillInBlankExercise {...previewProps} />;
      case 'match':
        return <MatchingExercise {...previewProps} />;
      case 'truefalse':
        return <TrueFalseExercise {...previewProps} />;
      case 'audio-listening':
        return <AudioListeningExercise {...previewProps} />;
      case 'text-selection':
        return <TextSelectionExercise {...previewProps} />;
      case 'dragdrop-order':
        return <DragDropOrderExercise {...previewProps} />;
      case 'dialogue-roleplay':
        return <DialogueRolePlayExercise {...previewProps} />;
      case 'verb-identification':
        return <VerbIdentificationExercise {...previewProps} />;
      case 'interactive-reading':
        return <InteractiveReadingExercise {...previewProps} />;
      case 'ai-audio-pronunciation':
        return <AIAudioPronunciationExercise {...previewProps} />;
      case 'free-dragdrop':
        return <FreeDragDropExercise {...previewProps} />;
      case 'cloze':
        return <ClozeTestExercise {...previewProps} />;
      case 'sentence-builder':
        return <SentenceBuilderExercise {...previewProps} />;
      case 'dictation':
        return <DictationExercise {...previewProps} />;
      case 'error-detection':
        return <ErrorDetectionExercise {...previewProps} />;
      case 'collocation-matching':
        return <CollocationMatchingExercise {...previewProps} />;
      case 'grammar-transformation':
        return <GrammarTransformationExercise {...previewProps} />;
      case 'hotspot-image':
        return <HotspotImageExercise {...previewProps} />;
      case 'dialogue-completion':
        return <DialogueCompletionExercise {...previewProps} />;
      default:
        return (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p className="font-medium mb-2">Preview no disponible</p>
            <p className="text-sm">Tipo de ejercicio: {localExercise.type}</p>
          </div>
        );
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Ejercicio"
      icon={Edit3}
      size="xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Vista Previa
            </h3>
            <BaseBadge variant="default" size="sm">
              {localExercise.type}
            </BaseBadge>
          </div>
          <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 min-h-[400px]">
            {renderPreview()}
          </div>
        </div>

        {/* Columna derecha: Configuración */}
        <div className="space-y-4 overflow-y-auto max-h-[600px]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings size={20} />
            Configuración del Ejercicio
          </h3>

          {/* Tipografía */}
          <UniversalCard variant="default" size="sm" title="Tipografía" icon={Type}>
            <div className="space-y-4">
              {/* Familia de fuente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Familia de Fuente
                </label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  <option value="system">Sistema (predeterminado)</option>
                  <option value="inter">Inter (moderna, sans-serif)</option>
                  <option value="merriweather">Merriweather (lectura, serif)</option>
                  <option value="opendyslexic">OpenDyslexic (accesibilidad)</option>
                </select>
              </div>

              {/* Tamaño de fuente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tamaño de Fuente: {settings.fontSize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="24"
                  step="1"
                  value={settings.fontSize}
                  onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-zinc-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>12px</span>
                  <span>18px</span>
                  <span>24px</span>
                </div>
              </div>

              {/* Espaciado de línea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Espaciado de Línea: {settings.lineHeight}
                </label>
                <div className="flex gap-2">
                  {[1.2, 1.5, 1.8, 2.0].map((height) => (
                    <BaseButton
                      key={height}
                      variant={settings.lineHeight === height ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleSettingChange('lineHeight', height)}
                    >
                      {height}
                    </BaseButton>
                  ))}
                </div>
              </div>
            </div>
          </UniversalCard>

          {/* Colores */}
          <UniversalCard variant="default" size="sm" title="Colores de Feedback" icon={Palette}>
            <div className="space-y-3">
              {[
                { key: 'correct', label: 'Correcto', default: '#10b981' },
                { key: 'incorrect', label: 'Incorrecto', default: '#ef4444' },
                { key: 'neutral', label: 'Neutral', default: '#71717a' }
              ].map((color) => (
                <div key={color.key} className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {color.label}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.feedbackColors[color.key] || color.default}
                      onChange={(e) => handleColorChange(color.key, e.target.value)}
                      className="w-10 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 font-mono w-20">
                      {settings.feedbackColors[color.key] || color.default}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </UniversalCard>

          {/* Efectos */}
          <UniversalCard variant="default" size="sm" title="Efectos Visuales">
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Animaciones
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.animations}
                    onChange={(e) => handleSettingChange('animations', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-zinc-600"></div>
                </div>
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Efectos de Sonido
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.soundEffects}
                    onChange={(e) => handleSettingChange('soundEffects', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-zinc-600"></div>
                </div>
              </label>
            </div>
          </UniversalCard>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <BaseButton
          variant="ghost"
          icon={X}
          onClick={onClose}
          fullWidth
        >
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          icon={Save}
          onClick={handleSave}
          fullWidth
        >
          Guardar Cambios
        </BaseButton>
      </div>
    </BaseModal>
  );
}

export default ExerciseEditorModal;
