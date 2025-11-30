/**
 * @fileoverview Configuración de ejercicio "Drag & Drop"
 * @module components/container/DragDropConfig
 */

import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Volume2, Shuffle, Move } from 'lucide-react';
import { BaseButton, BaseInput, BaseAlert } from '../common';
import { ExercisePreview, DragDropRenderer } from '../exercises';
import logger from '../../utils/logger';

// Texto de ejemplo para preview
const EXAMPLE_TEXT = `El *perro* ladra y el *gato* maúlla.
Los *pájaros* cantan en el *árbol*.`;

/**
 * Panel de configuración para ejercicios de arrastrar y soltar
 */
function DragDropConfig({ onSave }) {
  const [config, setConfig] = useState({
    // Colores
    correctColor: '#10b981',
    incorrectColor: '#ef4444',

    // Puntuación
    correctPoints: 10,
    incorrectPoints: -5,

    // Comportamiento
    showFeedback: true,
    instantFeedback: true,
    shuffleWords: true,

    // Sonidos
    soundEnabled: true
  });

  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  /**
   * Guardar configuración
   */
  const handleSave = () => {
    try {
      if (config.correctPoints <= 0) {
        setError('Los puntos por acierto deben ser mayores a 0');
        return;
      }

      localStorage.setItem('dragDropConfig', JSON.stringify(config));

      setSuccess('Configuración guardada exitosamente');
      setTimeout(() => setSuccess(null), 3000);

      if (onSave) {
        onSave(config);
      }

      logger.info('Drag drop config saved', 'DragDropConfig', config);
    } catch (err) {
      logger.error('Error saving config:', err, 'DragDropConfig');
      setError('Error al guardar la configuración');
    }
  };

  /**
   * Cargar configuración guardada
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dragDropConfig');
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch (err) {
      logger.error('Error loading config:', err, 'DragDropConfig');
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
      <div className="p-6 rounded-lg border-2 border-purple-200 dark:border-purple-800" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Move className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Cómo Escribir el Texto
          </h3>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Para ejercicios de <strong>Drag & Drop</strong>, escribe el texto y coloca <strong>asteriscos (*)</strong> alrededor de las palabras que deben ser arrastradas. Las palabras marcadas se retirarán del texto y aparecerán como elementos arrastrables.
        </p>

        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/10">
            <p className="text-xs font-semibold mb-2 text-purple-700 dark:text-purple-300">
              ✏️ Ejemplo de texto:
            </p>
            <pre className="text-sm font-mono p-3 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`El *perro* ladra y el *gato* maúlla.
Los *pájaros* cantan en el *árbol*.`}
            </pre>
          </div>

          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10">
            <p className="text-xs font-semibold mb-2 text-green-700 dark:text-green-300">
              ✅ Resultado:
            </p>
            <p className="text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
              El texto aparecerá con espacios vacíos:
            </p>
            <p className="text-sm italic bg-white dark:bg-gray-800 p-2 rounded" style={{ color: 'var(--color-text-secondary)' }}>
              "El _____ ladra y el _____ maúlla. Los _____ cantan en el _____."
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              Y las palabras <strong className="text-purple-600">perro</strong>, <strong className="text-purple-600">gato</strong>, <strong className="text-purple-600">pájaros</strong> y <strong className="text-purple-600">árbol</strong> estarán disponibles para arrastrar.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
            <p className="text-xs font-semibold mb-1 text-yellow-700 dark:text-yellow-300">
              💡 Tip:
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Las palabras se mezclan automáticamente si tienes habilitada la opción "Mezclar palabras".
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

      {/* Comportamiento */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Shuffle className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Comportamiento
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
              checked={config.instantFeedback}
              onChange={(e) => setConfig({ ...config, instantFeedback: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Feedback instantáneo al soltar (si no, solo al comprobar)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.shuffleWords}
              onChange={(e) => setConfig({ ...config, shuffleWords: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Mezclar palabras aleatoriamente
            </span>
          </label>
        </div>
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
          {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
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
          <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Vista previa del ejercicio
          </h4>
          <ExercisePreview
            renderer={DragDropRenderer}
            exerciseConfig={config}
            text={EXAMPLE_TEXT}
            instruction="Arrastra las palabras al lugar correcto"
            shuffleWords={config.shuffleWords}
            onComplete={(result) => logger.info('Preview completed:', result, 'DragDropConfig')}
          />
        </div>
      )}
    </div>
  );
}

export default DragDropConfig;
