/**
 * @fileoverview OpenQuestionsRenderer - Renderizador unificado de respuesta libre
 * @module components/exercises/renderers/OpenQuestionsRenderer
 *
 * UNIFICA:
 * - container/OpenQuestionsExercise.jsx
 * - ChainedExerciseViewer.jsx → OpenQuestionsContent
 * - ContentRenderer.jsx → renderizado de open_questions
 *
 * Soporta:
 * - Múltiples preguntas
 * - Respuestas esperadas opcionales
 * - Modo editable vs solo lectura
 * - Auto-guardado de respuestas
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Check, Save, AlertCircle } from 'lucide-react';
import { useExercise } from '../core/ExerciseContext';
import { BaseButton } from '../../common';

/**
 * OpenQuestionsRenderer - Renderiza preguntas de respuesta libre
 *
 * @param {Object} props
 * @param {Array} props.questions - Array de {question, answer?, hint?, points?}
 * @param {string} [props.instruction] - Instrucción general
 * @param {boolean} [props.showExpectedAnswers] - Mostrar respuestas esperadas
 * @param {boolean} [props.autoSave] - Auto-guardar respuestas
 * @param {number} [props.minLength] - Longitud mínima de respuesta
 * @param {number} [props.maxLength] - Longitud máxima de respuesta
 * @param {string} [props.layout] - 'cards' | 'simple' | 'compact'
 * @param {Function} [props.onSave] - Callback al guardar
 * @param {string} [props.className] - Clases adicionales
 */
export function OpenQuestionsRenderer({
  questions = [],
  instruction,
  showExpectedAnswers = false,
  autoSave = true,
  minLength = 0,
  maxLength = 1000,
  layout = 'cards',
  onSave,
  className = ''
}) {
  const {
    userAnswer,
    setAnswer,
    showingFeedback,
    config
  } = useExercise();

  // Estado local de respuestas
  const [responses, setResponses] = useState(() =>
    questions.reduce((acc, _, idx) => {
      acc[idx] = '';
      return acc;
    }, {})
  );

  // Estado de guardado
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Timer para auto-save
  const autoSaveTimer = useRef(null);

  // Sincronizar con context
  useEffect(() => {
    setAnswer(responses);
  }, [responses, setAnswer]);

  // Handler de cambio en textarea
  const handleChange = useCallback((index, value) => {
    // Limitar longitud
    if (maxLength && value.length > maxLength) {
      value = value.slice(0, maxLength);
    }

    setResponses(prev => ({
      ...prev,
      [index]: value
    }));

    setSaved(false);

    // Auto-save con debounce
    if (autoSave && onSave) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      autoSaveTimer.current = setTimeout(() => {
        handleSave();
      }, 2000);
    }
  }, [maxLength, autoSave, onSave]);

  // Handler de guardado
  const handleSave = useCallback(async () => {
    if (!onSave) return;

    setSaving(true);
    try {
      await onSave(responses);
      setSaved(true);
    } catch (error) {
      console.error('Error saving responses:', error);
    } finally {
      setSaving(false);
    }
  }, [responses, onSave]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  // Verificar si todas las preguntas tienen respuesta
  const allAnswered = Object.values(responses).every(r => r.trim().length >= minLength);

  // Contador de caracteres
  const getCharCount = (index) => {
    const length = responses[index]?.length || 0;
    if (maxLength) {
      return `${length}/${maxLength}`;
    }
    return length;
  };

  // Renderizar pregunta individual
  const renderQuestion = (question, index) => {
    const isAnswered = responses[index]?.trim().length >= minLength;

    if (layout === 'compact') {
      return (
        <div key={index} className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-bold">
              {index + 1}
            </span>
            <p className="text-gray-900 dark:text-white flex-1">
              {question.question}
            </p>
          </div>
          <textarea
            value={responses[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            disabled={showingFeedback}
            placeholder="Escribe tu respuesta..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
      );
    }

    if (layout === 'simple') {
      return (
        <div key={index} className="space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
              {index + 1}
            </span>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {question.question}
              </p>
              {question.hint && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  💡 {question.hint}
                </p>
              )}
            </div>
          </div>
          <textarea
            value={responses[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            disabled={showingFeedback}
            placeholder="Escribe tu respuesta..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          />
        </div>
      );
    }

    // Layout 'cards' (default)
    return (
      <div
        key={index}
        className={`rounded-xl border-2 overflow-hidden transition-colors ${
          isAnswered
            ? 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }`}
      >
        {/* Header */}
        <div className={`px-4 py-3 flex items-center justify-between ${
          isAnswered
            ? 'bg-green-50 dark:bg-green-900/20'
            : 'bg-gray-50 dark:bg-gray-800/50'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              isAnswered
                ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              {isAnswered ? <Check size={18} /> : index + 1}
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pregunta {index + 1} de {questions.length}
            </span>
          </div>

          {question.points && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              {question.points} pts
            </span>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-4">
          {/* Pregunta */}
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            {question.question}
          </p>

          {/* Hint */}
          {question.hint && (
            <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <MessageSquare size={16} className="flex-shrink-0 mt-0.5" />
              <span>{question.hint}</span>
            </div>
          )}

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={responses[index] || ''}
              onChange={(e) => handleChange(index, e.target.value)}
              disabled={showingFeedback}
              placeholder="Escribe tu respuesta aquí..."
              rows={4}
              className={`w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors resize-y ${
                isAnswered
                  ? 'border-green-300 dark:border-green-700 focus:ring-green-200 dark:focus:ring-green-800'
                  : 'border-gray-200 dark:border-gray-700 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-500'
              }`}
            />

            {/* Contador de caracteres */}
            <span className={`absolute bottom-3 right-3 text-xs ${
              responses[index]?.length >= maxLength * 0.9
                ? 'text-orange-500'
                : 'text-gray-400'
            }`}>
              {getCharCount(index)}
            </span>
          </div>

          {/* Respuesta esperada (si está habilitado y en feedback) */}
          {showExpectedAnswers && question.answer && showingFeedback && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm">
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  Respuesta esperada:
                </span>
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  {question.answer}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`open-questions-renderer ${className}`}>
      {/* Instrucción */}
      {instruction && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-blue-800 dark:text-blue-200">
            {instruction}
          </p>
        </div>
      )}

      {/* Lista de preguntas */}
      <div className={`space-y-${layout === 'compact' ? '4' : '6'}`}>
        {questions.map((question, index) => renderQuestion(question, index))}
      </div>

      {/* Footer con estado y acciones */}
      <div className="mt-6 flex items-center justify-between">
        {/* Progreso */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Check size={16} className={allAnswered ? 'text-green-500' : 'text-gray-400'} />
            <span>
              {Object.values(responses).filter(r => r.trim().length >= minLength).length} / {questions.length} respondidas
            </span>
          </div>

          {/* Indicador de guardado */}
          {autoSave && (
            <span className={`text-xs ${
              saving ? 'text-blue-500' : saved ? 'text-green-500' : 'text-transparent'
            }`}>
              {saving ? 'Guardando...' : saved ? '✓ Guardado' : ''}
            </span>
          )}
        </div>

        {/* Botón guardar manual */}
        {onSave && !autoSave && (
          <BaseButton
            variant="secondary"
            size="sm"
            icon={Save}
            onClick={handleSave}
            loading={saving}
            disabled={!allAnswered}
          >
            Guardar respuestas
          </BaseButton>
        )}
      </div>

      {/* Nota informativa */}
      {minLength > 0 && (
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <AlertCircle size={12} />
          Cada respuesta debe tener al menos {minLength} caracteres
        </p>
      )}
    </div>
  );
}

export default OpenQuestionsRenderer;
