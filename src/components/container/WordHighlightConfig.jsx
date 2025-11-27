/**
 * @fileoverview Configuración de ejercicio "Marcar Palabras"
 * @module components/container/WordHighlightConfig
 */

import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Gamepad2, Timer, Lightbulb, Sparkles, Volume2, CheckSquare } from 'lucide-react';
import { BaseButton, BaseInput, BaseAlert } from '../common';
import WordHighlightExercise from './WordHighlightExercise';
import logger from '../../utils/logger';

/**
 * Panel de configuración para ejercicios de marcar palabras
 */
function WordHighlightConfig({ onSave }) {
  const [config, setConfig] = useState({
    // Colores y puntos (existente)
    correctColor: '#10b981',
    incorrectColor: '#ef4444',
    correctPoints: 10,
    incorrectPoints: -5,
    showFeedback: true,
    showScore: true,

    // Nuevas opciones de modo de juego
    gameSettings: {
      feedbackMode: 'instant', // 'instant' | 'noFeedback' | 'exam'
      showTotalCount: false,
      wordsDisappearOnCorrect: false,

      // Interacción
      allowDeselect: true, // Permitir deseleccionar palabras al hacer clic de nuevo

      // Sonidos
      sound: {
        enabled: true,
        feedbackSounds: true,    // Sonidos de correcto/incorrecto
        timerSounds: true,       // Beeps del countdown
        completionSounds: true,  // Fanfarria al terminar
        // Configuración detallada del timer
        timerConfig: {
          startBeepAt: 30,       // Empezar beeps cuando quedan X segundos
          normalInterval: 5,     // Intervalo normal (cada X segundos)
          warningAt: 10,         // Cambiar a warning cuando quedan X segundos
          warningInterval: 2,    // Intervalo en warning
          urgentAt: 5,           // Cambiar a urgente cuando quedan X segundos
          urgentInterval: 1      // Intervalo urgente (cada segundo)
        }
      },

      // Pistas
      hints: {
        enabled: false,
        delaySeconds: 15,
        type: 'range', // 'range' | 'glow' | 'highlightLine' | 'firstLetter'
        rangeWords: 10 // Cantidad de palabras antes y después del objetivo
      },

      // Temporizador
      timer: {
        enabled: false,
        seconds: 60,
        onTimeUp: 'showScore', // 'showScore' | 'warnContinue' | 'blockEnd' | 'overtime'
        overtime: {
          intervalSeconds: 10,
          penaltyType: 'fixed', // 'fixed' | 'oneWord' | 'percentage'
          penaltyValue: 10
        }
      }
    }
  });

  const [showPreview, setShowPreview] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Texto de ejemplo para preview
  const exampleText = 'Yo *como* manzanas y *bebo* agua. Mi hermano *corre* en el parque cada mañana.';

  /**
   * Guardar configuración
   */
  const handleSave = () => {
    try {
      // Validar valores
      if (config.correctPoints <= 0) {
        setError('Los puntos por acierto deben ser mayores a 0');
        return;
      }

      // Guardar en localStorage (por ahora)
      localStorage.setItem('wordHighlightConfig', JSON.stringify(config));

      setSuccess('✅ Configuración guardada exitosamente');
      setTimeout(() => setSuccess(null), 3000);

      if (onSave) {
        onSave(config);
      }

      logger.info('Word highlight config saved', 'WordHighlightConfig', config);
    } catch (err) {
      logger.error('Error saving config:', err, 'WordHighlightConfig');
      setError('Error al guardar la configuración');
    }
  };

  /**
   * Cargar configuración guardada
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wordHighlightConfig');
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch (err) {
      logger.error('Error loading config:', err, 'WordHighlightConfig');
    }
  }, []);

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

      {/* Guía de formato */}
      <div className="p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-3">
          <CheckSquare className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Cómo Escribir el Texto
          </h3>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Para que el ejercicio de <strong>Marcar Palabras</strong> funcione correctamente, escribe el texto y coloca <strong>asteriscos (*)</strong> alrededor de las palabras que deben ser marcadas.
        </p>

        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10">
            <p className="text-xs font-semibold mb-2 text-blue-700 dark:text-blue-300">
              ✏️ Ejemplo de texto:
            </p>
            <pre className="text-sm font-mono p-3 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`Yo *como* manzanas y *bebo* agua.
Mi hermano *corre* en el parque.`}
            </pre>
          </div>

          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10">
            <p className="text-xs font-semibold mb-2 text-green-700 dark:text-green-300">
              ✅ Resultado:
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              Las palabras <strong className="text-blue-600">como</strong>, <strong className="text-blue-600">bebo</strong> y <strong className="text-blue-600">corre</strong> serán clicables y el alumno deberá marcarlas.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
            <p className="text-xs font-semibold mb-1 text-yellow-700 dark:text-yellow-300">
              💡 Tip:
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Usa <code className="px-1 py-0.5 bg-white dark:bg-gray-800 rounded">*palabra*</code> para marcar verbos, sustantivos, adjetivos, o cualquier tipo de palabra que quieras que el alumno identifique.
            </p>
          </div>
        </div>
      </div>

      {/* Configuración de colores */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Colores
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Color respuesta correcta
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
              Color respuesta incorrecta
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
        </div>
      </div>

      {/* Configuración de puntuación */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Puntuación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div>

      {/* Opciones de visualización */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Opciones de visualización
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showFeedback}
              onChange={(e) => setConfig({ ...config, showFeedback: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Mostrar feedback al hacer clic
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showScore}
              onChange={(e) => setConfig({ ...config, showScore: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Mostrar puntuación
            </span>
          </label>
        </div>
      </div>

      {/* ========== MODO DE JUEGO ========== */}
      <div className="p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Gamepad2 className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Modo de Juego
          </h3>
        </div>

        {/* Modo base */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Tipo de feedback
          </label>
          <select
            value={config.gameSettings.feedbackMode}
            onChange={(e) => setConfig({
              ...config,
              gameSettings: { ...config.gameSettings, feedbackMode: e.target.value }
            })}
            className="w-full px-3 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)'
            }}
          >
            <option value="instant">Instantáneo - Feedback inmediato al clickear</option>
            <option value="noFeedback">Sin feedback - Revelar todo al comprobar</option>
            <option value="exam">Examen - Sin feedback + 1 solo intento por palabra</option>
          </select>
        </div>

        {/* Opciones adicionales */}
        <div className="space-y-3 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.gameSettings.showTotalCount}
              onChange={(e) => setConfig({
                ...config,
                gameSettings: { ...config.gameSettings, showTotalCount: e.target.checked }
              })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Mostrar contador total (ej: "3/10 verbos")
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.gameSettings.wordsDisappearOnCorrect}
              onChange={(e) => setConfig({
                ...config,
                gameSettings: { ...config.gameSettings, wordsDisappearOnCorrect: e.target.checked }
              })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Palabras desaparecen al acertar
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.gameSettings.allowDeselect ?? true}
              onChange={(e) => setConfig({
                ...config,
                gameSettings: { ...config.gameSettings, allowDeselect: e.target.checked }
              })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Permitir deseleccionar palabras (clic para quitar)
            </span>
          </label>
        </div>
      </div>

      {/* ========== PISTAS ========== */}
      <div className="p-6 rounded-lg border-2 border-yellow-200 dark:border-yellow-800" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Pistas Automáticas
          </h3>
        </div>

        <label className="flex items-center gap-2 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={config.gameSettings.hints.enabled}
            onChange={(e) => setConfig({
              ...config,
              gameSettings: {
                ...config.gameSettings,
                hints: { ...config.gameSettings.hints, enabled: e.target.checked }
              }
            })}
            className="w-4 h-4 rounded"
          />
          <span style={{ color: 'var(--color-text-primary)' }}>
            Habilitar pistas automáticas
          </span>
        </label>

        {config.gameSettings.hints.enabled && (
          <div className="pl-6 space-y-4 border-l-2 border-yellow-300 dark:border-yellow-700">
            <BaseInput
              label="Mostrar pista después de (segundos)"
              type="number"
              value={config.gameSettings.hints.delaySeconds}
              onChange={(e) => setConfig({
                ...config,
                gameSettings: {
                  ...config.gameSettings,
                  hints: { ...config.gameSettings.hints, delaySeconds: parseInt(e.target.value) || 10 }
                }
              })}
              min="5"
              max="120"
            />

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Tipo de pista
              </label>
              <select
                value={config.gameSettings.hints.type}
                onChange={(e) => setConfig({
                  ...config,
                  gameSettings: {
                    ...config.gameSettings,
                    hints: { ...config.gameSettings.hints, type: e.target.value }
                  }
                })}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <option value="range">Resaltar zona (rango de palabras)</option>
                <option value="glow">Pulso/glow en la palabra exacta</option>
                <option value="highlightLine">Subrayar la palabra</option>
                <option value="firstLetter">Mostrar primera letra</option>
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                {config.gameSettings.hints.type === 'range' &&
                  'Resalta un área de palabras alrededor del objetivo (menos obvio)'}
                {config.gameSettings.hints.type === 'glow' &&
                  'La palabra exacta brilla (muy obvio)'}
                {config.gameSettings.hints.type === 'highlightLine' &&
                  'Subraya la palabra objetivo (muy obvio)'}
                {config.gameSettings.hints.type === 'firstLetter' &&
                  'Muestra solo la primera letra'}
              </p>
            </div>

            {/* Rango de palabras - solo si type es 'range' */}
            {config.gameSettings.hints.type === 'range' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Palabras alrededor del objetivo: {config.gameSettings.hints.rangeWords || 10}
                </label>
                <input
                  type="range"
                  min="5"
                  max="20"
                  value={config.gameSettings.hints.rangeWords || 10}
                  onChange={(e) => setConfig({
                    ...config,
                    gameSettings: {
                      ...config.gameSettings,
                      hints: { ...config.gameSettings.hints, rangeWords: parseInt(e.target.value) }
                    }
                  })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>5 (más preciso)</span>
                  <span>20 (zona amplia)</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========== TEMPORIZADOR ========== */}
      <div className="p-6 rounded-lg border-2 border-red-200 dark:border-red-800" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Timer className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Temporizador
          </h3>
        </div>

        <label className="flex items-center gap-2 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={config.gameSettings.timer.enabled}
            onChange={(e) => setConfig({
              ...config,
              gameSettings: {
                ...config.gameSettings,
                timer: { ...config.gameSettings.timer, enabled: e.target.checked }
              }
            })}
            className="w-4 h-4 rounded"
          />
          <span style={{ color: 'var(--color-text-primary)' }}>
            Habilitar temporizador
          </span>
        </label>

        {config.gameSettings.timer.enabled && (
          <div className="pl-6 space-y-4 border-l-2 border-red-300 dark:border-red-700">
            <BaseInput
              label="Tiempo inicial (segundos)"
              type="number"
              value={config.gameSettings.timer.seconds}
              onChange={(e) => setConfig({
                ...config,
                gameSettings: {
                  ...config.gameSettings,
                  timer: { ...config.gameSettings.timer, seconds: parseInt(e.target.value) || 60 }
                }
              })}
              min="10"
              max="600"
            />

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Al terminar el tiempo
              </label>
              <select
                value={config.gameSettings.timer.onTimeUp}
                onChange={(e) => setConfig({
                  ...config,
                  gameSettings: {
                    ...config.gameSettings,
                    timer: { ...config.gameSettings.timer, onTimeUp: e.target.value }
                  }
                })}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <option value="showScore">Mostrar puntaje (ver resultados con botón)</option>
                <option value="warnContinue">Solo avisar, dejar continuar</option>
                <option value="blockEnd">Bloquear y mostrar puntaje final</option>
                <option value="overtime">Overtime: seguir pero descontar puntos</option>
              </select>
            </div>

            {/* Opciones de Overtime */}
            {config.gameSettings.timer.onTimeUp === 'overtime' && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 space-y-4">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <Sparkles size={18} />
                  <span className="font-medium">Configuración de Overtime</span>
                </div>

                <BaseInput
                  label="Descontar cada (segundos)"
                  type="number"
                  value={config.gameSettings.timer.overtime.intervalSeconds}
                  onChange={(e) => setConfig({
                    ...config,
                    gameSettings: {
                      ...config.gameSettings,
                      timer: {
                        ...config.gameSettings.timer,
                        overtime: {
                          ...config.gameSettings.timer.overtime,
                          intervalSeconds: parseInt(e.target.value) || 10
                        }
                      }
                    }
                  })}
                  min="5"
                  max="60"
                />

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Tipo de penalización
                  </label>
                  <select
                    value={config.gameSettings.timer.overtime.penaltyType}
                    onChange={(e) => setConfig({
                      ...config,
                      gameSettings: {
                        ...config.gameSettings,
                        timer: {
                          ...config.gameSettings.timer,
                          overtime: {
                            ...config.gameSettings.timer.overtime,
                            penaltyType: e.target.value
                          }
                        }
                      }
                    })}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <option value="fixed">Fija (puntos fijos)</option>
                    <option value="oneWord">Una palabra (puntos de 1 acierto)</option>
                    <option value="percentage">Porcentaje del total</option>
                  </select>
                </div>

                <BaseInput
                  label={
                    config.gameSettings.timer.overtime.penaltyType === 'percentage'
                      ? 'Porcentaje a descontar (%)'
                      : 'Puntos a descontar'
                  }
                  type="number"
                  value={config.gameSettings.timer.overtime.penaltyValue}
                  onChange={(e) => setConfig({
                    ...config,
                    gameSettings: {
                      ...config.gameSettings,
                      timer: {
                        ...config.gameSettings.timer,
                        overtime: {
                          ...config.gameSettings.timer.overtime,
                          penaltyValue: parseInt(e.target.value) || 10
                        }
                      }
                    }
                  })}
                  min="1"
                  max={config.gameSettings.timer.overtime.penaltyType === 'percentage' ? 50 : 100}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========== SONIDOS ========== */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-5 h-5 text-violet-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Sonidos
          </h3>
        </div>

        <label className="flex items-center gap-2 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={config.gameSettings.sound?.enabled ?? true}
            onChange={(e) => setConfig({
              ...config,
              gameSettings: {
                ...config.gameSettings,
                sound: { ...config.gameSettings.sound, enabled: e.target.checked }
              }
            })}
            className="w-4 h-4 rounded"
          />
          <span style={{ color: 'var(--color-text-primary)' }}>
            Habilitar sonidos del juego
          </span>
        </label>

        {config.gameSettings.sound?.enabled && (
          <div className="pl-6 space-y-3 border-l-2 border-violet-300 dark:border-violet-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.gameSettings.sound?.feedbackSounds ?? true}
                onChange={(e) => setConfig({
                  ...config,
                  gameSettings: {
                    ...config.gameSettings,
                    sound: { ...config.gameSettings.sound, feedbackSounds: e.target.checked }
                  }
                })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                Sonidos de correcto/incorrecto
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.gameSettings.sound?.timerSounds ?? true}
                onChange={(e) => setConfig({
                  ...config,
                  gameSettings: {
                    ...config.gameSettings,
                    sound: { ...config.gameSettings.sound, timerSounds: e.target.checked }
                  }
                })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                Beeps del temporizador (countdown)
              </span>
            </label>

            {/* Configuración detallada del timer */}
            {config.gameSettings.sound?.timerSounds && (
              <div className="ml-6 mt-2 p-3 rounded-lg space-y-3" style={{ backgroundColor: 'var(--color-bg-tertiary, rgba(0,0,0,0.05))' }}>
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Configuración del countdown:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Empezar beeps a los (seg)
                    </label>
                    <input
                      type="number"
                      value={config.gameSettings.sound?.timerConfig?.startBeepAt ?? 30}
                      onChange={(e) => setConfig({
                        ...config,
                        gameSettings: {
                          ...config.gameSettings,
                          sound: {
                            ...config.gameSettings.sound,
                            timerConfig: {
                              ...config.gameSettings.sound?.timerConfig,
                              startBeepAt: parseInt(e.target.value) || 30
                            }
                          }
                        }
                      })}
                      min="5"
                      max="120"
                      className="w-full px-2 py-1 text-sm rounded border"
                      style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Intervalo normal (seg)
                    </label>
                    <input
                      type="number"
                      value={config.gameSettings.sound?.timerConfig?.normalInterval ?? 5}
                      onChange={(e) => setConfig({
                        ...config,
                        gameSettings: {
                          ...config.gameSettings,
                          sound: {
                            ...config.gameSettings.sound,
                            timerConfig: {
                              ...config.gameSettings.sound?.timerConfig,
                              normalInterval: parseInt(e.target.value) || 5
                            }
                          }
                        }
                      })}
                      min="1"
                      max="30"
                      className="w-full px-2 py-1 text-sm rounded border"
                      style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Warning a los (seg)
                    </label>
                    <input
                      type="number"
                      value={config.gameSettings.sound?.timerConfig?.warningAt ?? 10}
                      onChange={(e) => setConfig({
                        ...config,
                        gameSettings: {
                          ...config.gameSettings,
                          sound: {
                            ...config.gameSettings.sound,
                            timerConfig: {
                              ...config.gameSettings.sound?.timerConfig,
                              warningAt: parseInt(e.target.value) || 10
                            }
                          }
                        }
                      })}
                      min="3"
                      max="60"
                      className="w-full px-2 py-1 text-sm rounded border"
                      style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Intervalo warning (seg)
                    </label>
                    <input
                      type="number"
                      value={config.gameSettings.sound?.timerConfig?.warningInterval ?? 2}
                      onChange={(e) => setConfig({
                        ...config,
                        gameSettings: {
                          ...config.gameSettings,
                          sound: {
                            ...config.gameSettings.sound,
                            timerConfig: {
                              ...config.gameSettings.sound?.timerConfig,
                              warningInterval: parseInt(e.target.value) || 2
                            }
                          }
                        }
                      })}
                      min="1"
                      max="10"
                      className="w-full px-2 py-1 text-sm rounded border"
                      style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Urgente a los (seg)
                    </label>
                    <input
                      type="number"
                      value={config.gameSettings.sound?.timerConfig?.urgentAt ?? 5}
                      onChange={(e) => setConfig({
                        ...config,
                        gameSettings: {
                          ...config.gameSettings,
                          sound: {
                            ...config.gameSettings.sound,
                            timerConfig: {
                              ...config.gameSettings.sound?.timerConfig,
                              urgentAt: parseInt(e.target.value) || 5
                            }
                          }
                        }
                      })}
                      min="1"
                      max="30"
                      className="w-full px-2 py-1 text-sm rounded border"
                      style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Intervalo urgente (seg)
                    </label>
                    <input
                      type="number"
                      value={config.gameSettings.sound?.timerConfig?.urgentInterval ?? 1}
                      onChange={(e) => setConfig({
                        ...config,
                        gameSettings: {
                          ...config.gameSettings,
                          sound: {
                            ...config.gameSettings.sound,
                            timerConfig: {
                              ...config.gameSettings.sound?.timerConfig,
                              urgentInterval: parseInt(e.target.value) || 1
                            }
                          }
                        }
                      })}
                      min="1"
                      max="5"
                      className="w-full px-2 py-1 text-sm rounded border"
                      style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.gameSettings.sound?.completionSounds ?? true}
                onChange={(e) => setConfig({
                  ...config,
                  gameSettings: {
                    ...config.gameSettings,
                    sound: { ...config.gameSettings.sound, completionSounds: e.target.checked }
                  }
                })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                Fanfarria al completar
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 justify-end">
        <BaseButton
          variant="secondary"
          icon={showPreview ? EyeOff : Eye}
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Ocultar' : 'Mostrar'} Preview
        </BaseButton>
        <BaseButton
          variant="primary"
          icon={Save}
          onClick={handleSave}
        >
          Guardar Configuración
        </BaseButton>
      </div>

      {/* Preview del ejercicio */}
      {showPreview && (
        <div className="mt-6 p-6 rounded-lg border-2 border-dashed" style={{ borderColor: 'var(--color-border)' }}>
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Vista previa del ejercicio
            </h4>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Texto de ejemplo: {exampleText}
            </p>
          </div>
          <WordHighlightExercise
            text={exampleText}
            config={config}
            onComplete={(result) => {
              logger.info('Preview completed:', result);
              alert(`Ejercicio completado!\nPuntuación: ${result.score}\nPalabras marcadas: ${result.totalClicks}`);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default WordHighlightConfig;
