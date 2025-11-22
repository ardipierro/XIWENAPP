/**
 * @fileoverview Configuración de ejercicio "Llenar Palabras"
 * @module components/container/FillBlanksConfig
 */

import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Volume2, Lightbulb, Type } from 'lucide-react';
import { BaseButton, BaseInput, BaseAlert } from '../common';
import FillInBlanksExercise from './FillInBlanksExercise';
import logger from '../../utils/logger';

/**
 * Panel de configuración para ejercicios de completar palabras
 */
function FillBlanksConfig({ onSave }) {
  const [config, setConfig] = useState({
    // Colores
    correctColor: '#10b981',
    incorrectColor: '#ef4444',

    // Puntuación
    correctPoints: 10,
    incorrectPoints: -5,

    // Comportamiento
    showFeedback: true,
    caseSensitive: false,
    trimSpaces: true,
    autoAdvance: true,

    // Pistas
    allowHints: true,
    hintPenalty: 5,

    // Sonidos
    soundEnabled: true
  });

  const [showPreview, setShowPreview] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Texto de ejemplo para preview
  const exampleText = 'Mi nombre es *María* y vivo en *Buenos Aires*. Me gusta *leer* libros.';

  /**
   * Guardar configuración
   */
  const handleSave = () => {
    try {
      if (config.correctPoints <= 0) {
        setError('Los puntos por acierto deben ser mayores a 0');
        return;
      }

      localStorage.setItem('fillBlanksConfig', JSON.stringify(config));

      setSuccess('Configuración guardada exitosamente');
      setTimeout(() => setSuccess(null), 3000);

      if (onSave) {
        onSave(config);
      }

      logger.info('Fill blanks config saved', 'FillBlanksConfig', config);
    } catch (err) {
      logger.error('Error saving config:', err, 'FillBlanksConfig');
      setError('Error al guardar la configuración');
    }
  };

  /**
   * Cargar configuración guardada
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fillBlanksConfig');
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch (err) {
      logger.error('Error loading config:', err, 'FillBlanksConfig');
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

      {/* Info */}
      <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <p className="text-sm text-green-700 dark:text-green-300">
          <strong>Llenar Palabras:</strong> Las palabras entre asteriscos (*palabra*) se convierten en
          campos de texto donde el estudiante debe escribir la palabra correcta.
        </p>
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

      {/* Comportamiento de texto */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Comportamiento de texto
          </h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showFeedback}
              onChange={(e) => setConfig({ ...config, showFeedback: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Mostrar feedback visual
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.caseSensitive}
              onChange={(e) => setConfig({ ...config, caseSensitive: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Distinguir mayúsculas/minúsculas
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.trimSpaces}
              onChange={(e) => setConfig({ ...config, trimSpaces: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Ignorar espacios al inicio/final
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.autoAdvance}
              onChange={(e) => setConfig({ ...config, autoAdvance: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Avanzar al siguiente campo con Enter
            </span>
          </label>
        </div>
      </div>

      {/* Pistas */}
      <div className="p-6 rounded-lg border-2 border-yellow-200 dark:border-yellow-800" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Pistas
          </h3>
        </div>

        <label className="flex items-center gap-2 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={config.allowHints}
            onChange={(e) => setConfig({ ...config, allowHints: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span style={{ color: 'var(--color-text-primary)' }}>
            Permitir pistas (muestra primera letra)
          </span>
        </label>

        {config.allowHints && (
          <div className="pl-6 border-l-2 border-yellow-300 dark:border-yellow-700">
            <BaseInput
              label="Penalización por pista (puntos)"
              type="number"
              value={config.hintPenalty}
              onChange={(e) => setConfig({ ...config, hintPenalty: parseInt(e.target.value) || 0 })}
              min="0"
              max="50"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Puntos que se descuentan por cada pista usada
            </p>
          </div>
        )}
      </div>

      {/* Sonidos */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-5 h-5 text-violet-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Sonidos
          </h3>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.soundEnabled}
            onChange={(e) => setConfig({ ...config, soundEnabled: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span style={{ color: 'var(--color-text-primary)' }}>
            Habilitar sonidos del juego
          </span>
        </label>
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
          <FillInBlanksExercise
            text={exampleText}
            config={config}
            onComplete={(result) => {
              logger.info('Preview completed:', result);
              alert(`Ejercicio completado!\nPuntuación: ${result.score}\nCorrectas: ${result.correct}/${result.total}`);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default FillBlanksConfig;
