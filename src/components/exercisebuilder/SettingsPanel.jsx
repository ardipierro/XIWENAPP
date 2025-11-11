/**
 * @fileoverview Panel de configuración visual del Design Lab
 * @module components/designlab/SettingsPanel
 */

import { useState } from 'react';
import { Settings, Sun, Moon, Type, Palette, Sparkles, Volume2, RotateCcw, Zap, Music } from 'lucide-react';
import { BaseButton, BaseCard, BaseModal, BaseBadge, BaseAlert } from '../common';
import { useExerciseBuilderConfig } from '../../hooks/useExerciseBuilderConfig';
import { PRESET_THEMES, SOUND_PACKS } from '../../firebase/exerciseBuilderConfig';
import logger from '../../utils/logger';

/**
 * Panel de configuración del Design Lab
 */
export function SettingsPanel() {
  const { config, loading, saving, updateField, resetConfig } = useExerciseBuilderConfig();
  const [showModal, setShowModal] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleFontSizeChange = (e) => {
    const size = parseInt(e.target.value, 10);
    updateField('fontSize', size);
  };

  const handleColorChange = (field, value) => {
    updateField('feedbackColors', {
      ...config.feedbackColors,
      [field]: value
    });
  };

  const handleReset = async () => {
    await resetConfig();
    setResetConfirm(false);
    logger.info('Design Lab config reset');
  };

  if (loading) {
    return (
      <BaseButton variant="ghost" icon={Settings} disabled>
        Configuración
      </BaseButton>
    );
  }

  return (
    <>
      <BaseButton
        variant="outline"
        icon={Settings}
        onClick={() => setShowModal(true)}
      >
        Configuración
      </BaseButton>

      <BaseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Configuración del Design Lab"
        icon={Settings}
        size="lg"
      >
        <div className="space-y-6">
          {/* Tema */}
          <BaseCard title="Tema" variant="flat">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PRESET_THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => updateField('theme', key)}
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${config.theme === key
                      ? 'border-zinc-500 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }
                  `}
                  style={{ backgroundColor: theme.colors.bg }}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span
                      className="text-xs font-medium"
                      style={{ color: theme.colors.text }}
                    >
                      {theme.name}
                    </span>
                    <div className="flex gap-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: theme.colors.bgSecondary }}
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: theme.colors.border }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </BaseCard>

          {/* Tipografía */}
          <BaseCard title="Tipografía" icon={Type} variant="flat">
            <div className="space-y-4">
              {/* Familia de fuente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Familia de Fuente
                </label>
                <select
                  value={config.fontFamily}
                  onChange={(e) => updateField('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  <option value="system">Sistema (predeterminado)</option>
                  <option value="inter">Inter (moderna, sans-serif)</option>
                  <option value="merriweather">Merriweather (lectura, serif)</option>
                  <option value="opendyslexic">OpenDyslexic (accesibilidad)</option>
                </select>
              </div>

              {/* Espaciado de línea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Espaciado de Línea: {config.lineHeight}
                </label>
                <div className="flex gap-2">
                  {[1.2, 1.5, 1.8, 2.0].map((height) => (
                    <BaseButton
                      key={height}
                      variant={config.lineHeight === height ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => updateField('lineHeight', height)}
                    >
                      {height}
                    </BaseButton>
                  ))}
                </div>
              </div>
            </div>
          </BaseCard>

          {/* Tamaño de fuente */}
          <BaseCard title="Tamaño de Fuente" variant="flat">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {config.fontSize}px
                </span>
                <BaseBadge variant="default" size="sm">
                  Base: 16px
                </BaseBadge>
              </div>
              <input
                type="range"
                min="12"
                max="24"
                step="1"
                value={config.fontSize}
                onChange={handleFontSizeChange}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-zinc-500"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>12px</span>
                <span>18px</span>
                <span>24px</span>
              </div>
            </div>
          </BaseCard>

          {/* Colores de feedback */}
          <BaseCard title="Colores de Feedback" icon={Palette} variant="flat">
            <div className="space-y-4">
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
                      value={config.feedbackColors[color.key] || color.default}
                      onChange={(e) => handleColorChange(color.key, e.target.value)}
                      className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 font-mono w-20">
                      {config.feedbackColors[color.key] || color.default}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </BaseCard>

          {/* Opciones de interacción */}
          <BaseCard title="Interacción" icon={Sparkles} variant="flat">
            <div className="space-y-3">
              {[
                { key: 'animations', label: 'Animaciones', icon: Sparkles },
                { key: 'soundEffects', label: 'Efectos de sonido', icon: Volume2 },
                { key: 'autoCorrect', label: 'Corrección automática', icon: null },
                { key: 'showHints', label: 'Mostrar pistas', icon: null }
              ].map((option) => (
                <label
                  key={option.key}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {option.icon && <option.icon size={16} strokeWidth={2} />}
                    {option.label}
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={config[option.key]}
                      onChange={(e) => updateField(option.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-zinc-600"></div>
                  </div>
                </label>
              ))}
            </div>
          </BaseCard>

          {/* Velocidad de Animación */}
          <BaseCard title="Velocidad de Animación" icon={Zap} variant="flat">
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'slow', label: 'Lenta', desc: '500ms' },
                { value: 'normal', label: 'Normal', desc: '300ms' },
                { value: 'fast', label: 'Rápida', desc: '150ms' },
                { value: 'off', label: 'Sin', desc: '0ms' }
              ].map((speed) => (
                <button
                  key={speed.value}
                  onClick={() => updateField('animationSpeed', speed.value)}
                  className={`
                    p-3 rounded-lg border-2 transition-all text-center
                    ${config.animationSpeed === speed.value
                      ? 'border-zinc-500 bg-zinc-50 dark:bg-zinc-900'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {speed.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {speed.desc}
                  </div>
                </button>
              ))}
            </div>
          </BaseCard>

          {/* Pack de Sonidos */}
          <BaseCard title="Pack de Sonidos" icon={Music} variant="flat">
            <div className="space-y-2">
              {Object.entries(SOUND_PACKS).map(([key, pack]) => (
                <label
                  key={key}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${config.soundPack === key
                      ? 'border-zinc-500 bg-zinc-50 dark:bg-zinc-900'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="soundPack"
                      checked={config.soundPack === key}
                      onChange={() => updateField('soundPack', key)}
                      className="text-zinc-600"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {pack.name}
                    </span>
                  </div>
                  {config.soundPack === key && (
                    <BaseBadge variant="success" size="sm">
                      Activo
                    </BaseBadge>
                  )}
                </label>
              ))}
            </div>
          </BaseCard>

          {/* Nivel CEFR */}
          <BaseCard title="Nivel de Dificultad" variant="flat">
            <div className="grid grid-cols-3 gap-2">
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
                <BaseButton
                  key={level}
                  variant={config.cefrLevel === level ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => updateField('cefrLevel', level)}
                >
                  {level}
                </BaseButton>
              ))}
            </div>
          </BaseCard>

          {/* Modo Práctica vs Evaluación */}
          <BaseCard title="Modo de Ejercicio" variant="flat">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateField('practiceMode', true)}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${config.practiceMode
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    🎯 Práctica
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Intentos ilimitados, con pistas
                  </div>
                </button>
                <button
                  onClick={() => updateField('practiceMode', false)}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${!config.practiceMode
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    📝 Evaluación
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Intentos limitados, sin pistas
                  </div>
                </button>
              </div>
              {!config.practiceMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Intentos máximos: {config.maxAttempts}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={config.maxAttempts}
                    onChange={(e) => updateField('maxAttempts', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-zinc-500"
                  />
                </div>
              )}
            </div>
          </BaseCard>

          {/* Temporizador */}
          <BaseCard title="Temporizador" variant="flat">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'off', label: 'Sin Timer', icon: '⏸️' },
                  { value: 'soft', label: 'Informativo', icon: '⏱️' },
                  { value: 'hard', label: 'Límite Estricto', icon: '⏰' }
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => updateField('timerMode', mode.value)}
                    className={`
                      p-3 rounded-lg border-2 transition-all text-center
                      ${config.timerMode === mode.value
                        ? 'border-zinc-500 bg-zinc-50 dark:bg-zinc-900'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="text-2xl mb-1">{mode.icon}</div>
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {mode.label}
                    </div>
                  </button>
                ))}
              </div>
              {config.timerMode !== 'off' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tiempo límite: {Math.floor(config.timeLimit / 60)}:{String(config.timeLimit % 60).padStart(2, '0')} minutos
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="600"
                    step="30"
                    value={config.timeLimit}
                    onChange={(e) => updateField('timeLimit', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-zinc-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 min</span>
                    <span>5 min</span>
                    <span>10 min</span>
                  </div>
                </div>
              )}
            </div>
          </BaseCard>

          {/* Nivel de Feedback */}
          <BaseCard title="Nivel de Feedback" variant="flat">
            <div className="space-y-2">
              {[
                { value: 'minimal', label: 'Mínimo', desc: 'Solo correcto/incorrecto' },
                { value: 'medium', label: 'Medio', desc: '+ Respuesta correcta' },
                { value: 'detailed', label: 'Detallado', desc: '+ Explicación' },
                { value: 'extensive', label: 'Extenso', desc: '+ Ejemplos y recursos' }
              ].map((level) => (
                <label
                  key={level.value}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${config.feedbackDetail === level.value
                      ? 'border-zinc-500 bg-zinc-50 dark:bg-zinc-900'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="feedbackDetail"
                      checked={config.feedbackDetail === level.value}
                      onChange={() => updateField('feedbackDetail', level.value)}
                      className="text-zinc-600"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {level.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {level.desc}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </BaseCard>

          {/* Guardar/Resetear */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {!resetConfirm ? (
              <>
                <BaseButton
                  variant="ghost"
                  icon={RotateCcw}
                  onClick={() => setResetConfirm(true)}
                  size="sm"
                >
                  Resetear
                </BaseButton>
                <BaseButton
                  variant="primary"
                  onClick={() => setShowModal(false)}
                  fullWidth
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Cerrar'}
                </BaseButton>
              </>
            ) : (
              <BaseAlert variant="warning" className="w-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm">¿Resetear a valores por defecto?</span>
                  <div className="flex gap-2">
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setResetConfirm(false)}
                    >
                      Cancelar
                    </BaseButton>
                    <BaseButton variant="danger" size="sm" onClick={handleReset}>
                      Confirmar
                    </BaseButton>
                  </div>
                </div>
              </BaseAlert>
            )}
          </div>

          {/* Info de guardado automático */}
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Los cambios se guardan automáticamente
            </p>
          </div>
        </div>
      </BaseModal>
    </>
  );
}

export default SettingsPanel;
