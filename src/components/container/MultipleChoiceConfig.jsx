/**
 * @fileoverview Configuración de ejercicio "Multiple Choice / Opción Múltiple"
 * @module components/container/MultipleChoiceConfig
 */

import { useState, useEffect } from 'react';
import {
  Save,
  Eye,
  EyeOff,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Timer,
  Volume2,
  Shuffle,
  ListChecks
} from 'lucide-react';
import { BaseButton, BaseInput, BaseAlert } from '../common';
import MultipleChoiceExercise from './MultipleChoiceExercise';
import logger from '../../utils/logger';

const STORAGE_KEY = 'xiwen_multipleChoiceConfig';

const DEFAULT_CONFIG = {
  // Colors
  correctColor: '#10b981',
  incorrectColor: '#ef4444',
  selectedColor: '#3b82f6',
  partialColor: '#f59e0b',

  // Scoring
  correctPoints: 10,
  incorrectPoints: 0,
  partialPoints: 5,

  // Options display
  shuffleOptions: true,
  showOptionLetters: true,

  // Feedback
  showFeedback: true,
  showExplanation: true,
  showCorrectAnswer: true,

  // Game settings
  gameSettings: {
    feedbackMode: 'instant', // 'instant' | 'onSubmit' | 'exam'
    allowRetry: true,
    maxRetries: 2,

    // Hints
    hints: {
      enabled: false,
      delaySeconds: 20,
      type: 'eliminate' // 'eliminate' | 'highlight' | 'text'
    },

    // Timer
    timer: {
      enabled: false,
      secondsPerQuestion: 30,
      onTimeUp: 'showAnswer' // 'nextQuestion' | 'showAnswer' | 'lockAnswer'
    },

    // Sounds
    sound: {
      enabled: true,
      selectSound: true,
      feedbackSounds: true,
      completionSound: true
    }
  }
};

// Example questions for preview
const EXAMPLE_QUESTIONS = [
  {
    question: '¿Cuál es la capital de España?',
    options: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'],
    optionExplanations: ['Es la capital desde 1561', 'Es la capital de Cataluña', null, null],
    correct: 0,
    explanation: 'Madrid es la capital de España desde el siglo XVI.'
  },
  {
    question: '¿Cuáles son verbos en infinitivo?',
    options: ['Comer', 'Como', 'Correr', 'Corro'],
    optionExplanations: ['Termina en -er', 'Es presente', 'Termina en -er', 'Es presente'],
    correct: [0, 2],
    explanation: 'Los infinitivos terminan en -ar, -er, -ir.'
  }
];

/**
 * Panel de configuración para ejercicios de opción múltiple
 */
function MultipleChoiceConfig({ onSave }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [showPreview, setShowPreview] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Load saved config
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
      }
    } catch (err) {
      logger.error('Error loading config:', err, 'MultipleChoiceConfig');
    }
  }, []);

  /**
   * Save configuration
   */
  const handleSave = () => {
    try {
      if (config.correctPoints <= 0) {
        setError('Los puntos por acierto deben ser mayores a 0');
        return;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

      setSuccess('Configuración guardada exitosamente');
      setTimeout(() => setSuccess(null), 3000);

      if (onSave) {
        onSave(config);
      }

      logger.info('Multiple choice config saved', 'MultipleChoiceConfig', config);
    } catch (err) {
      logger.error('Error saving config:', err, 'MultipleChoiceConfig');
      setError('Error al guardar la configuración');
    }
  };

  /**
   * Update nested gameSettings
   */
  const updateGameSettings = (key, value) => {
    setConfig(prev => ({
      ...prev,
      gameSettings: {
        ...prev.gameSettings,
        [key]: value
      }
    }));
  };

  /**
   * Update deeply nested settings (hints, timer, sound)
   */
  const updateNestedSetting = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      gameSettings: {
        ...prev.gameSettings,
        [section]: {
          ...prev.gameSettings[section],
          [key]: value
        }
      }
    }));
  };

  return (
    <div className="w-full space-y-6">
      {/* Alerts */}
      {success && (
        <BaseAlert variant="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </BaseAlert>
      )}
      {error && (
        <BaseAlert variant="danger" dismissible onDismiss={() => setError(null)}>
          {error}
        </BaseAlert>
      )}

      {/* Info */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Multiple Choice:</strong> Preguntas con opciones de respuesta.
          Soporta una o múltiples respuestas correctas.
        </p>
        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-mono">
          <strong>Formato:</strong>
          <pre className="mt-1 p-2 bg-blue-100 dark:bg-blue-900/40 rounded">
{`¿Pregunta?
*Opción correcta :: explicación
Opción incorrecta
*Otra correcta (si hay múltiples)
Opción incorrecta
:: Explicación general`}
          </pre>
        </div>
      </div>

      {/* Colors Section */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Colores
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              <CheckCircle2 className="inline w-4 h-4 mr-1" />
              Correcta
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.correctColor}
                onChange={(e) => setConfig({ ...config, correctColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <BaseInput
                value={config.correctColor}
                onChange={(e) => setConfig({ ...config, correctColor: e.target.value })}
                placeholder="#10b981"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              <XCircle className="inline w-4 h-4 mr-1" />
              Incorrecta
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.incorrectColor}
                onChange={(e) => setConfig({ ...config, incorrectColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <BaseInput
                value={config.incorrectColor}
                onChange={(e) => setConfig({ ...config, incorrectColor: e.target.value })}
                placeholder="#ef4444"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Selección
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.selectedColor}
                onChange={(e) => setConfig({ ...config, selectedColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <BaseInput
                value={config.selectedColor}
                onChange={(e) => setConfig({ ...config, selectedColor: e.target.value })}
                placeholder="#3b82f6"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Parcial (múltiples)
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.partialColor}
                onChange={(e) => setConfig({ ...config, partialColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <BaseInput
                value={config.partialColor}
                onChange={(e) => setConfig({ ...config, partialColor: e.target.value })}
                placeholder="#f59e0b"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scoring Section */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Puntuación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BaseInput
            label="Puntos por acierto"
            type="number"
            value={config.correctPoints}
            onChange={(e) => setConfig({ ...config, correctPoints: parseInt(e.target.value) || 0 })}
            min="1"
          />
          <BaseInput
            label="Puntos por error"
            type="number"
            value={config.incorrectPoints}
            onChange={(e) => setConfig({ ...config, incorrectPoints: parseInt(e.target.value) || 0 })}
          />
          <BaseInput
            label="Puntos parciales (múltiples)"
            type="number"
            value={config.partialPoints}
            onChange={(e) => setConfig({ ...config, partialPoints: parseInt(e.target.value) || 0 })}
            min="0"
          />
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Los puntos parciales se aplican cuando el alumno acierta algunas pero no todas las respuestas correctas.
        </p>
      </div>

      {/* Display Options */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Opciones de Visualización
          </h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.shuffleOptions}
              onChange={(e) => setConfig({ ...config, shuffleOptions: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <Shuffle className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Mezclar orden de opciones
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showOptionLetters}
              onChange={(e) => setConfig({ ...config, showOptionLetters: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Mostrar letras (A, B, C, D...)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showExplanation}
              onChange={(e) => setConfig({ ...config, showExplanation: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Mostrar explicaciones después de verificar
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showCorrectAnswer}
              onChange={(e) => setConfig({ ...config, showCorrectAnswer: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Revelar respuesta correcta al fallar
            </span>
          </label>
        </div>
      </div>

      {/* Feedback Mode */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Modo de Feedback
          </h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="feedbackMode"
              checked={config.gameSettings.feedbackMode === 'instant'}
              onChange={() => updateGameSettings('feedbackMode', 'instant')}
              className="w-4 h-4"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              <strong>Instantáneo</strong> - Feedback inmediato al seleccionar
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="feedbackMode"
              checked={config.gameSettings.feedbackMode === 'onSubmit'}
              onChange={() => updateGameSettings('feedbackMode', 'onSubmit')}
              className="w-4 h-4"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              <strong>Al verificar</strong> - Solo al presionar botón "Verificar"
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="feedbackMode"
              checked={config.gameSettings.feedbackMode === 'exam'}
              onChange={() => updateGameSettings('feedbackMode', 'exam')}
              className="w-4 h-4"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              <strong>Examen</strong> - Sin feedback hasta terminar todo
            </span>
          </label>
        </div>

        {config.gameSettings.feedbackMode !== 'exam' && (
          <div className="mt-4 pl-6 border-l-2 border-purple-300 dark:border-purple-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.gameSettings.allowRetry}
                onChange={(e) => updateGameSettings('allowRetry', e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>
                Permitir reintentar
              </span>
            </label>

            {config.gameSettings.allowRetry && (
              <div className="mt-2">
                <BaseInput
                  label="Máximo de intentos (0 = ilimitados)"
                  type="number"
                  value={config.gameSettings.maxRetries}
                  onChange={(e) => updateGameSettings('maxRetries', parseInt(e.target.value) || 0)}
                  min="0"
                  max="10"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hints Section */}
      <details className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <summary className="cursor-pointer flex items-center gap-2 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Pistas Automáticas
        </summary>

        <div className="mt-4 space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.gameSettings.hints.enabled}
              onChange={(e) => updateNestedSetting('hints', 'enabled', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Activar pistas automáticas
            </span>
          </label>

          {config.gameSettings.hints.enabled && (
            <div className="pl-6 border-l-2 border-yellow-300 dark:border-yellow-700 space-y-4">
              <BaseInput
                label="Mostrar pista después de (segundos)"
                type="number"
                value={config.gameSettings.hints.delaySeconds}
                onChange={(e) => updateNestedSetting('hints', 'delaySeconds', parseInt(e.target.value) || 15)}
                min="5"
                max="120"
              />

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Tipo de pista
                </label>
                <select
                  value={config.gameSettings.hints.type}
                  onChange={(e) => updateNestedSetting('hints', 'type', e.target.value)}
                  className="w-full p-2 rounded border"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value="eliminate">Eliminar opciones incorrectas</option>
                  <option value="highlight">Resaltar pista visual</option>
                  <option value="text">Mostrar texto de ayuda</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </details>

      {/* Timer Section */}
      <details className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <summary className="cursor-pointer flex items-center gap-2 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          <Timer className="w-5 h-5 text-orange-500" />
          Temporizador
        </summary>

        <div className="mt-4 space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.gameSettings.timer.enabled}
              onChange={(e) => updateNestedSetting('timer', 'enabled', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Activar tiempo límite
            </span>
          </label>

          {config.gameSettings.timer.enabled && (
            <div className="pl-6 border-l-2 border-orange-300 dark:border-orange-700 space-y-4">
              <BaseInput
                label="Segundos por pregunta"
                type="number"
                value={config.gameSettings.timer.secondsPerQuestion}
                onChange={(e) => updateNestedSetting('timer', 'secondsPerQuestion', parseInt(e.target.value) || 30)}
                min="5"
                max="300"
              />

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Al terminar el tiempo
                </label>
                <select
                  value={config.gameSettings.timer.onTimeUp}
                  onChange={(e) => updateNestedSetting('timer', 'onTimeUp', e.target.value)}
                  className="w-full p-2 rounded border"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value="showAnswer">Mostrar respuesta correcta</option>
                  <option value="nextQuestion">Pasar a siguiente pregunta</option>
                  <option value="lockAnswer">Bloquear sin mostrar respuesta</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </details>

      {/* Sound Section */}
      <details className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <summary className="cursor-pointer flex items-center gap-2 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          <Volume2 className="w-5 h-5 text-green-500" />
          Sonidos
        </summary>

        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.gameSettings.sound.enabled}
              onChange={(e) => updateNestedSetting('sound', 'enabled', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Activar efectos de sonido
            </span>
          </label>

          {config.gameSettings.sound.enabled && (
            <div className="pl-6 border-l-2 border-green-300 dark:border-green-700 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.gameSettings.sound.selectSound}
                  onChange={(e) => updateNestedSetting('sound', 'selectSound', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span style={{ color: 'var(--color-text-primary)' }}>
                  Sonido al seleccionar opción
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.gameSettings.sound.feedbackSounds}
                  onChange={(e) => updateNestedSetting('sound', 'feedbackSounds', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span style={{ color: 'var(--color-text-primary)' }}>
                  Sonido correcto/incorrecto
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.gameSettings.sound.completionSound}
                  onChange={(e) => updateNestedSetting('sound', 'completionSound', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span style={{ color: 'var(--color-text-primary)' }}>
                  Sonido al completar ejercicio
                </span>
              </label>
            </div>
          )}
        </div>
      </details>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <BaseButton
          variant="secondary"
          onClick={() => setShowPreview(!showPreview)}
          icon={showPreview ? EyeOff : Eye}
        >
          {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
        </BaseButton>

        <BaseButton
          variant="primary"
          onClick={handleSave}
          icon={Save}
        >
          Guardar Configuración
        </BaseButton>
      </div>

      {/* Preview Section */}
      {showPreview && (
        <div className="mt-6 p-6 rounded-lg border-2 border-dashed" style={{ borderColor: 'var(--color-border)' }}>
          <h4 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Preview del Ejercicio
          </h4>
          <MultipleChoiceExercise
            questions={EXAMPLE_QUESTIONS}
            config={config}
            onComplete={(result) => logger.info('Preview completed', 'MultipleChoiceConfig', result)}
          />
        </div>
      )}
    </div>
  );
}

export default MultipleChoiceConfig;
