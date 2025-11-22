/**
 * @fileoverview Preset Selector - Quick selection of correction presets
 * @module components/homework/PresetSelector
 *
 * Allows teachers to quickly select a pre-configured correction profile
 * or choose to create a custom one.
 */

import { useState } from 'react';
import { Check, Sliders, Sparkles, Target, BookOpen, Zap, MessageSquare } from 'lucide-react';
import { BaseButton, BaseCard } from '../common';
import { getAllPresets, DISPLAY_MODES } from '../../config/correctionPresets';

// Icon mapping for presets
const PRESET_ICONS = {
  kids_friendly: Sparkles,
  standard_intermediate: BookOpen,
  exam_prep: Target,
  grammar_focus: BookOpen,
  quick_review: Zap,
  vocabulary_builder: MessageSquare
};

/**
 * PresetSelector Component
 * @param {Function} onSelect - Callback when preset is selected (presetId, config)
 * @param {string} currentPreset - Currently selected preset ID
 * @param {Function} onCustom - Callback to open custom editor
 * @param {string} className - Additional CSS classes
 */
export default function PresetSelector({
  onSelect,
  currentPreset = null,
  onCustom,
  className = ''
}) {
  const [hoveredPreset, setHoveredPreset] = useState(null);
  const presets = getAllPresets();

  const handleSelect = (preset) => {
    if (onSelect) {
      onSelect(preset.id, preset.config);
    }
  };

  const getDisplayModeLabel = (mode) => {
    switch (mode) {
      case DISPLAY_MODES.OVERLAY: return 'Con overlay';
      case DISPLAY_MODES.QUICK: return 'Solo texto';
      case DISPLAY_MODES.BOTH: return 'Ambos';
      default: return mode;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Seleccionar Perfil
        </h3>
        {onCustom && (
          <BaseButton
            variant="ghost"
            size="sm"
            icon={Sliders}
            onClick={onCustom}
          >
            Personalizado
          </BaseButton>
        )}
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {presets.map((preset) => {
          const Icon = PRESET_ICONS[preset.id] || BookOpen;
          const isSelected = currentPreset === preset.id;
          const isHovered = hoveredPreset === preset.id;

          return (
            <div
              key={preset.id}
              className={`
                relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                }
                ${isHovered && !isSelected ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''}
              `}
              onClick={() => handleSelect(preset)}
              onMouseEnter={() => setHoveredPreset(preset.id)}
              onMouseLeave={() => setHoveredPreset(null)}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}

              {/* Icon and Title */}
              <div className="flex items-start gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center text-xl
                  ${isSelected
                    ? 'bg-blue-100 dark:bg-blue-800'
                    : 'bg-zinc-100 dark:bg-zinc-800'
                  }
                `}>
                  {preset.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`
                    font-medium truncate
                    ${isSelected
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-zinc-900 dark:text-zinc-100'
                    }
                  `}>
                    {preset.name}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                    {preset.description}
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-3">
                {/* Display mode tag */}
                <span className={`
                  inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                  ${preset.config.displayMode === DISPLAY_MODES.QUICK
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : preset.config.displayMode === DISPLAY_MODES.BOTH
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }
                `}>
                  {getDisplayModeLabel(preset.config.displayMode)}
                </span>

                {/* Strictness tag */}
                <span className={`
                  inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                  ${preset.config.strictness === 'lenient'
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                    : preset.config.strictness === 'strict'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                  }
                `}>
                  {preset.config.strictness === 'lenient' ? 'Suave' :
                   preset.config.strictness === 'strict' ? 'Estricto' : 'Moderado'}
                </span>
              </div>

              {/* Hover details - Información completa del preset */}
              {isHovered && (
                <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700 space-y-2">
                  {/* Checks */}
                  <div className="flex flex-wrap gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-medium">Revisa:</span>
                    {preset.config.checks.map(check => (
                      <span
                        key={check}
                        className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded"
                      >
                        {check === 'spelling' ? '📝 Ortografía' :
                         check === 'grammar' ? '📚 Gramática' :
                         check === 'punctuation' ? '❗ Puntuación' : '💬 Vocabulario'}
                      </span>
                    ))}
                  </div>

                  {/* AI Config details */}
                  {preset.config.aiConfig && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-xs space-y-1">
                      <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">🤖 Config IA:</div>
                      <div className="grid grid-cols-2 gap-1 text-zinc-600 dark:text-zinc-400">
                        <span>
                          🎯 Temp: <b>{preset.config.aiConfig.temperature}</b>
                          {preset.config.aiConfig.temperature <= 0.4 ? ' (Preciso)' :
                           preset.config.aiConfig.temperature >= 0.8 ? ' (Creativo)' : ''}
                        </span>
                        <span>
                          📝 Tokens: <b>{preset.config.aiConfig.maxTokens}</b>
                        </span>
                        <span className="col-span-2">
                          💬 Estilo: <b>
                            {preset.config.aiConfig.feedbackStyle === 'playful' ? '🎈 Divertido' :
                             preset.config.aiConfig.feedbackStyle === 'encouraging' ? '💪 Motivador' :
                             preset.config.aiConfig.feedbackStyle === 'neutral' ? '📋 Neutral' :
                             preset.config.aiConfig.feedbackStyle === 'strict' ? '📏 Directo' :
                             preset.config.aiConfig.feedbackStyle === 'academic' ? '🎓 Académico' :
                             preset.config.aiConfig.feedbackStyle}
                          </b>
                        </span>
                        {(preset.config.aiConfig.includeSynonyms || preset.config.aiConfig.includeExamples) && (
                          <span className="col-span-2">
                            Extras:
                            {preset.config.aiConfig.includeSynonyms && ' 📚 Sinónimos'}
                            {preset.config.aiConfig.includeExamples && ' 💡 Ejemplos'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Custom option card */}
        {onCustom && (
          <div
            className={`
              relative p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
              border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500
              hover:bg-zinc-50 dark:hover:bg-zinc-800/50
              ${currentPreset === 'custom' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
            `}
            onClick={onCustom}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Sliders className="w-5 h-5 text-zinc-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                  Personalizado
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Crea tu propia configuración
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
