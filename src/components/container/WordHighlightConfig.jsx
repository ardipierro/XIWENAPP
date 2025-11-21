/**
 * @fileoverview Configuración de ejercicio "Marcar Palabras"
 * @module components/container/WordHighlightConfig
 */

import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff } from 'lucide-react';
import { BaseButton, BaseInput, BaseAlert } from '../common';
import WordHighlightExercise from './WordHighlightExercise';
import logger from '../../utils/logger';

/**
 * Panel de configuración para ejercicios de marcar palabras
 */
function WordHighlightConfig({ onSave }) {
  const [config, setConfig] = useState({
    correctColor: '#10b981',
    incorrectColor: '#ef4444',
    correctPoints: 10,
    incorrectPoints: -5,
    showFeedback: true,
    showScore: true
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
