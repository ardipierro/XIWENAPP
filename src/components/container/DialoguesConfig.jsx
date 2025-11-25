/**
 * @fileoverview Configuración de Diálogos Interactivos
 * @module components/container/DialoguesConfig
 *
 * Panel de configuración para ejercicios de diálogo estilo chat.
 * Reutiliza DialogueBubble y AudioPlayer del libro interactivo.
 */

import { useState, useEffect } from 'react';
import {
  MessageCircle,
  Volume2,
  Languages,
  Palette,
  User,
  Settings,
  Eye,
  Zap,
  Trophy,
  Save,
  RotateCcw
} from 'lucide-react';
import { BaseBadge } from '../common';
import logger from '../../utils/logger';

// Configuración por defecto
const DEFAULT_CONFIG = {
  // Display
  showAvatars: true,
  showCharacterNames: true,
  bubbleStyle: 'rounded', // 'rounded', 'square', 'modern'

  // Colores de burbujas (alternadas)
  leftBubbleColor: '#f3f4f6',
  rightBubbleColor: '#dbeafe',
  leftTextColor: '#1f2937',
  rightTextColor: '#1e40af',

  // Audio/TTS
  ttsEnabled: true,
  autoPlayAudio: false,
  playbackSpeed: 1.0,

  // Traducciones
  showTranslations: true,
  translationLanguage: 'zh', // chino por defecto

  // Modo de ejercicio
  exerciseMode: 'read', // 'read', 'fill-blank', 'comprehension', 'order'

  // Gamificación
  pointsPerCorrect: 10,
  showScore: true,
  soundEffects: true,

  // Feedback
  feedbackMode: 'instant', // 'instant', 'end', 'none'
  showHints: true
};

const STORAGE_KEY = 'xiwen_dialogues_config';

/**
 * Panel de configuración para ejercicios de diálogo
 */
function DialoguesConfig({ onSave }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar configuración guardada
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
      }
    } catch (e) {
      logger.error('Error loading dialogues config:', e);
    }
  }, []);

  // Actualizar config
  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Guardar configuración
  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setHasChanges(false);
      onSave?.(config);
      logger.info('Dialogues config saved:', config);
    } catch (e) {
      logger.error('Error saving dialogues config:', e);
    }
  };

  // Resetear a defaults
  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-cyan-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Configuración de Diálogos
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <RotateCcw size={14} />
            Resetear
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              hasChanges
                ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700'
            }`}
          >
            <Save size={14} />
            Guardar
          </button>
        </div>
      </div>

      {/* Sección: Visualización */}
      <section className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Eye size={18} className="text-blue-500" />
          <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Visualización</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mostrar avatares */}
          <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <User size={16} className="text-gray-500" />
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Mostrar avatares</span>
            </div>
            <input
              type="checkbox"
              checked={config.showAvatars}
              onChange={(e) => updateConfig('showAvatars', e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>

          {/* Mostrar nombres */}
          <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Mostrar nombres de personajes</span>
            <input
              type="checkbox"
              checked={config.showCharacterNames}
              onChange={(e) => updateConfig('showCharacterNames', e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>

          {/* Estilo de burbuja */}
          <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <label className="text-sm mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
              Estilo de burbujas
            </label>
            <select
              value={config.bubbleStyle}
              onChange={(e) => updateConfig('bubbleStyle', e.target.value)}
              className="w-full px-3 py-2 rounded border text-sm"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="rounded">Redondeado</option>
              <option value="square">Cuadrado</option>
              <option value="modern">Moderno</option>
            </select>
          </div>
        </div>
      </section>

      {/* Sección: Colores */}
      <section className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Palette size={18} className="text-purple-500" />
          <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Colores de Burbujas</h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              Burbuja Izq. (fondo)
            </label>
            <input
              type="color"
              value={config.leftBubbleColor}
              onChange={(e) => updateConfig('leftBubbleColor', e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              Burbuja Izq. (texto)
            </label>
            <input
              type="color"
              value={config.leftTextColor}
              onChange={(e) => updateConfig('leftTextColor', e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              Burbuja Der. (fondo)
            </label>
            <input
              type="color"
              value={config.rightBubbleColor}
              onChange={(e) => updateConfig('rightBubbleColor', e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              Burbuja Der. (texto)
            </label>
            <input
              type="color"
              value={config.rightTextColor}
              onChange={(e) => updateConfig('rightTextColor', e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* Sección: Audio/TTS */}
      <section className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Volume2 size={18} className="text-green-500" />
          <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Audio y TTS</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Habilitar Text-to-Speech</span>
            <input
              type="checkbox"
              checked={config.ttsEnabled}
              onChange={(e) => updateConfig('ttsEnabled', e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Auto-reproducir audio</span>
            <input
              type="checkbox"
              checked={config.autoPlayAudio}
              onChange={(e) => updateConfig('autoPlayAudio', e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>

          <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 col-span-full">
            <label className="text-sm mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
              Velocidad de reproducción: {config.playbackSpeed}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={config.playbackSpeed}
              onChange={(e) => updateConfig('playbackSpeed', parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>
      </section>

      {/* Sección: Traducciones */}
      <section className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Languages size={18} className="text-amber-500" />
          <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Traducciones</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Mostrar traducciones</span>
            <input
              type="checkbox"
              checked={config.showTranslations}
              onChange={(e) => updateConfig('showTranslations', e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>

          <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <label className="text-sm mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
              Idioma de traducción
            </label>
            <select
              value={config.translationLanguage}
              onChange={(e) => updateConfig('translationLanguage', e.target.value)}
              className="w-full px-3 py-2 rounded border text-sm"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="zh">中文 (Chino)</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </div>
        </div>
      </section>

      {/* Sección: Modo de Ejercicio */}
      <section className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-indigo-500" />
          <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Modo de Ejercicio</h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: 'read', label: 'Lectura', desc: 'Solo leer diálogo' },
            { value: 'fill-blank', label: 'Completar', desc: 'Rellenar blancos' },
            { value: 'comprehension', label: 'Comprensión', desc: 'Preguntas al final' },
            { value: 'order', label: 'Ordenar', desc: 'Ordenar líneas' }
          ].map(mode => (
            <button
              key={mode.value}
              onClick={() => updateConfig('exerciseMode', mode.value)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                config.exerciseMode === mode.value
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {mode.label}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                {mode.desc}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Sección: Gamificación */}
      <section className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-yellow-500" />
          <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Gamificación</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <label className="text-sm mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
              Puntos por respuesta correcta
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={config.pointsPerCorrect}
              onChange={(e) => updateConfig('pointsPerCorrect', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded border text-sm"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Mostrar puntuación</span>
            <input
              type="checkbox"
              checked={config.showScore}
              onChange={(e) => updateConfig('showScore', e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Efectos de sonido</span>
            <input
              type="checkbox"
              checked={config.soundEffects}
              onChange={(e) => updateConfig('soundEffects', e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>

          <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <label className="text-sm mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
              Modo de feedback
            </label>
            <select
              value={config.feedbackMode}
              onChange={(e) => updateConfig('feedbackMode', e.target.value)}
              className="w-full px-3 py-2 rounded border text-sm"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="instant">Inmediato</option>
              <option value="end">Al finalizar</option>
              <option value="none">Sin feedback</option>
            </select>
          </div>
        </div>
      </section>

      {/* Preview del formato */}
      <section className="p-4 rounded-lg border-2 border-dashed" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Zap size={18} className="text-cyan-500" />
          <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Formato de Contenido</h4>
        </div>

        <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
          <pre style={{ color: 'var(--color-text-primary)' }}>
{`#DIALOGO
Mozo: Buenas noches. ¿Tienen reserva?
Sofía: Sí, a nombre de *Sofía Torres*.
Mozo: Perfecto, síganme por *favor*.

---
Las palabras entre *asteriscos* se
convierten en blancos para completar.`}
          </pre>
        </div>

        <div className="mt-3 flex gap-2">
          <BaseBadge variant="info" size="sm">Personaje: texto</BaseBadge>
          <BaseBadge variant="warning" size="sm">*palabra* = blank</BaseBadge>
        </div>
      </section>
    </div>
  );
}

// Exportar también la config por defecto y key
export { DEFAULT_CONFIG, STORAGE_KEY };
export default DialoguesConfig;
