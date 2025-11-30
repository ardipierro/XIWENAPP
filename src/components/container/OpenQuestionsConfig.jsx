/**
 * @fileoverview Configuración de ejercicio "Respuesta Libre / Preguntas Abiertas"
 * @module components/container/OpenQuestionsConfig
 */

import { useState, useEffect } from 'react';
import { Save, MessageSquare, CheckCircle, Type, AlignLeft, Eye, EyeOff } from 'lucide-react';
import { BaseButton, BaseInput, BaseAlert } from '../common';
import { ExercisePreview, OpenQuestionsRenderer } from '../exercises';
import logger from '../../utils/logger';

/**
 * Panel de configuración para ejercicios de respuesta libre
 */
function OpenQuestionsConfig({ onSave }) {
  const [config, setConfig] = useState({
    // Apariencia
    textareaRows: 2,
    textareaMaxLength: 500,
    showCharacterCount: true,

    // Colores
    correctColor: '#10b981',
    incorrectColor: '#ef4444',
    partialColor: '#f59e0b',

    // Validación
    validateAnswers: true,
    caseSensitive: false,
    ignoreAccents: true,
    ignorePunctuation: true,
    acceptPartialMatch: true,
    partialMatchThreshold: 0.7, // 70% de similitud

    // Puntuación
    correctPoints: 10,
    partialPoints: 5,

    // Feedback
    showFeedback: true,
    showCorrectAnswer: true,
    showHints: false,

    // Comportamiento
    autoSave: true,
    allowRetry: true,
    maxRetries: 3,

    // Sonidos
    soundEnabled: true
  });

  const [showPreview, setShowPreview] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Texto de ejemplo para preview
  const exampleQuestions = [
    { question: 'Acá llueve mucho. (mucho ≠ poco)', answer: 'Acá llueve poco.' },
    { question: 'El tiempo es muy agradable.', answer: 'El tiempo es muy desagradable.' },
    { question: 'En primavera hace buen tiempo.', answer: 'En primavera hace mal tiempo.' }
  ];

  /**
   * Guardar configuración
   */
  const handleSave = () => {
    try {
      if (config.textareaRows < 1 || config.textareaRows > 10) {
        setError('Las filas del textarea deben estar entre 1 y 10');
        return;
      }

      localStorage.setItem('openQuestionsConfig', JSON.stringify(config));

      setSuccess('Configuración guardada exitosamente');
      setTimeout(() => setSuccess(null), 3000);

      if (onSave) {
        onSave(config);
      }

      logger.info('Open questions config saved', 'OpenQuestionsConfig', config);
    } catch (err) {
      logger.error('Error saving config:', err, 'OpenQuestionsConfig');
      setError('Error al guardar la configuración');
    }
  };

  /**
   * Cargar configuración guardada
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('openQuestionsConfig');
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch (err) {
      logger.error('Error loading config:', err, 'OpenQuestionsConfig');
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
      <div className="p-6 rounded-lg border-2 border-orange-200 dark:border-orange-800" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Cómo Escribir el Texto
          </h3>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Para ejercicios de <strong>Respuesta Libre</strong>, escribe preguntas <strong>numeradas</strong> o usa el formato con <strong>P:</strong> (pregunta) y <strong>R:</strong> (respuesta). El alumno escribirá oraciones completas. Ideal para transformaciones, contrarios, traducciones, etc.
        </p>

        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10">
            <p className="text-xs font-semibold mb-2 text-orange-700 dark:text-orange-300">
              ✏️ Formato 1: Líneas numeradas
            </p>
            <pre className="text-sm font-mono p-3 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`1. ¿Cómo te llamas?
2. ¿De dónde eres?
3. ¿Qué idiomas hablas?`}
            </pre>
          </div>

          <div className="p-4 rounded-lg bg-pink-50 dark:bg-pink-900/10">
            <p className="text-xs font-semibold mb-2 text-pink-700 dark:text-pink-300">
              ✏️ Formato 2: Con marcador #RESPUESTA_LIBRE
            </p>
            <pre className="text-sm font-mono p-3 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`#RESPUESTA_LIBRE
P: Acá llueve mucho. (mucho ≠ poco)
R: Acá llueve poco.

P: El tiempo es muy agradable.
R: El tiempo es muy desagradable.`}
            </pre>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10">
            <p className="text-xs font-semibold mb-2 text-blue-700 dark:text-blue-300">
              ✅ Resultado:
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              El alumno verá cada pregunta con un <strong>campo de texto amplio</strong> (textarea) donde podrá escribir su respuesta completa. Si incluiste respuestas (R:), se validarán automáticamente.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
            <p className="text-xs font-semibold mb-1 text-yellow-700 dark:text-yellow-300">
              💡 Tip:
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              En la validación puedes configurar si ignoras acentos, puntuación o mayúsculas. También puedes aceptar respuestas parcialmente correctas.
            </p>
          </div>
        </div>
      </div>

      {/* Configuración de apariencia */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <AlignLeft className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Apariencia del Textarea
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput
            label="Filas del textarea"
            type="number"
            value={config.textareaRows}
            onChange={(e) => setConfig({ ...config, textareaRows: parseInt(e.target.value) || 2 })}
            min="1"
            max="10"
          />
          <BaseInput
            label="Máximo de caracteres"
            type="number"
            value={config.textareaMaxLength}
            onChange={(e) => setConfig({ ...config, textareaMaxLength: parseInt(e.target.value) || 500 })}
            min="50"
            max="2000"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer mt-4">
          <input
            type="checkbox"
            checked={config.showCharacterCount}
            onChange={(e) => setConfig({ ...config, showCharacterCount: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span style={{ color: 'var(--color-text-primary)' }}>
            Mostrar contador de caracteres
          </span>
        </label>
      </div>

      {/* Configuración de colores */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Colores
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Respuesta correcta
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
              Respuesta parcial
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

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Respuesta incorrecta
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

      {/* Validación */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Validación de Respuestas
          </h3>
        </div>

        <label className="flex items-center gap-2 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={config.validateAnswers}
            onChange={(e) => setConfig({ ...config, validateAnswers: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span style={{ color: 'var(--color-text-primary)' }}>
            Validar respuestas automáticamente (si hay respuesta correcta definida)
          </span>
        </label>

        {config.validateAnswers && (
          <div className="pl-6 border-l-2 border-green-300 dark:border-green-700 space-y-3">
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
                checked={config.ignoreAccents}
                onChange={(e) => setConfig({ ...config, ignoreAccents: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>
                Ignorar acentos (a = á)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.ignorePunctuation}
                onChange={(e) => setConfig({ ...config, ignorePunctuation: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>
                Ignorar puntuación
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.acceptPartialMatch}
                onChange={(e) => setConfig({ ...config, acceptPartialMatch: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>
                Aceptar coincidencia parcial
              </span>
            </label>

            {config.acceptPartialMatch && (
              <div className="ml-6">
                <BaseInput
                  label="Umbral de similitud (%)"
                  type="number"
                  value={Math.round(config.partialMatchThreshold * 100)}
                  onChange={(e) => setConfig({
                    ...config,
                    partialMatchThreshold: (parseInt(e.target.value) || 70) / 100
                  })}
                  min="50"
                  max="100"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Puntuación */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Puntuación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput
            label="Puntos por respuesta correcta"
            type="number"
            value={config.correctPoints}
            onChange={(e) => setConfig({ ...config, correctPoints: parseInt(e.target.value) || 10 })}
            min="1"
          />
          <BaseInput
            label="Puntos por respuesta parcial"
            type="number"
            value={config.partialPoints}
            onChange={(e) => setConfig({ ...config, partialPoints: parseInt(e.target.value) || 5 })}
            min="0"
          />
        </div>
      </div>

      {/* Feedback */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Feedback
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
              Mostrar feedback visual (colores)
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
              Mostrar respuesta correcta después de verificar
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.allowRetry}
              onChange={(e) => setConfig({ ...config, allowRetry: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Permitir reintentos
            </span>
          </label>

          {config.allowRetry && (
            <div className="ml-6">
              <BaseInput
                label="Máximo de reintentos"
                type="number"
                value={config.maxRetries}
                onChange={(e) => setConfig({ ...config, maxRetries: parseInt(e.target.value) || 3 })}
                min="1"
                max="10"
              />
            </div>
          )}
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
              Vista previa del ejercicio - "Diga lo contrario"
            </h4>
          </div>
          <ExercisePreview
            renderer={OpenQuestionsRenderer}
            exerciseConfig={config}
            questions={exampleQuestions}
            instruction="Transforme las oraciones diciendo lo contrario"
            validateAnswers={config.validateAnswers}
            caseSensitive={config.caseSensitive}
            ignoreAccents={config.ignoreAccents}
            ignorePunctuation={config.ignorePunctuation}
            acceptPartialMatch={config.acceptPartialMatch}
            partialMatchThreshold={config.partialMatchThreshold}
            showCorrectAnswer={config.showCorrectAnswer}
            allowRetry={config.allowRetry}
            maxRetries={config.maxRetries}
            maxLength={config.textareaMaxLength}
            onComplete={(result) => logger.info('Preview completed:', result, 'OpenQuestionsConfig')}
          />
        </div>
      )}
    </div>
  );
}

export default OpenQuestionsConfig;
