/**
 * @fileoverview Panel de configuración visual del Design Lab
 * @module components/designlab/SettingsPanel
 */

import { useState } from 'react';
import { Settings, Sun, Moon, Type, Palette, Sparkles, Volume2, RotateCcw, Save } from 'lucide-react';
import { BaseButton, BaseCard, BaseModal, BaseBadge, BaseAlert } from '../common';
import { useDesignLabConfig } from '../../hooks/useDesignLabConfig';
import logger from '../../utils/logger';

/**
 * Panel de configuración del Design Lab
 */
export function SettingsPanel() {
  const { config, loading, saving, updateField, resetConfig } = useDesignLabConfig();
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
            <div className="flex gap-3">
              <BaseButton
                variant={config.theme === 'light' ? 'primary' : 'outline'}
                icon={Sun}
                onClick={() => updateField('theme', 'light')}
                size="sm"
              >
                Claro
              </BaseButton>
              <BaseButton
                variant={config.theme === 'dark' ? 'primary' : 'outline'}
                icon={Moon}
                onClick={() => updateField('theme', 'dark')}
                size="sm"
              >
                Oscuro
              </BaseButton>
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
