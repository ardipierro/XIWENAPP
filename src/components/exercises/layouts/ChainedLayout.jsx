/**
 * @fileoverview ChainedLayout - Layout para ejercicios encadenados
 * @module components/exercises/layouts/ChainedLayout
 *
 * Muestra múltiples ejercicios en secuencia.
 * Soporta modo scroll (todos visibles) o galería (uno a la vez).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  CheckCircle,
  Circle,
  AlertCircle
} from 'lucide-react';
import { BaseButton, BaseBadge } from '../../common';

/**
 * ChainedLayout - Layout para múltiples ejercicios
 *
 * @param {Object} props
 * @param {Array} props.exercises - Array de ejercicios a renderizar
 * @param {Function} props.renderExercise - Función para renderizar cada ejercicio
 * @param {string} [props.defaultMode] - 'scroll' | 'gallery'
 * @param {boolean} [props.showModeToggle] - Mostrar toggle de modo
 * @param {boolean} [props.showProgress] - Mostrar barra de progreso
 * @param {string} [props.maxHeight] - Altura máxima en modo scroll
 * @param {Function} [props.onExerciseComplete] - Callback al completar ejercicio
 * @param {Function} [props.onAllComplete] - Callback al completar todos
 * @param {string} [props.className] - Clases adicionales
 */
export function ChainedLayout({
  exercises = [],
  renderExercise,
  defaultMode = 'scroll',
  showModeToggle = true,
  showProgress = true,
  maxHeight = '600px',
  onExerciseComplete,
  onAllComplete,
  className = ''
}) {
  const [viewMode, setViewMode] = useState(defaultMode);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState(new Set());

  const containerRef = useRef(null);

  // Navegación
  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(exercises.length - 1, prev + 1));
  }, [exercises.length]);

  const goToExercise = useCallback((index) => {
    setCurrentIndex(index);
    if (viewMode === 'scroll') {
      const element = document.getElementById(`chained-exercise-${index}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [viewMode]);

  // Marcar como completado
  const markAsComplete = useCallback((index, result) => {
    setCompletedExercises(prev => new Set([...prev, index]));

    if (onExerciseComplete) {
      onExerciseComplete(index, exercises[index], result);
    }

    // Verificar si todos están completos
    const newCompleted = new Set([...completedExercises, index]);
    if (newCompleted.size === exercises.length && onAllComplete) {
      onAllComplete(Array.from(newCompleted));
    }
  }, [completedExercises, exercises, onExerciseComplete, onAllComplete]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewMode !== 'gallery') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, goToPrevious, goToNext]);

  // Progreso
  const progress = (completedExercises.size / exercises.length) * 100;
  const allCompleted = completedExercises.size === exercises.length;

  if (exercises.length === 0) {
    return (
      <div className={`p-8 text-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 ${className}`}>
        <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-400">
          No hay ejercicios para mostrar
        </p>
      </div>
    );
  }

  return (
    <div className={`chained-layout ${className}`}>
      {/* Header con controles */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        {/* Contador */}
        <div className="flex items-center gap-2">
          <BaseBadge variant="primary" size="lg">
            {exercises.length} {exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
          </BaseBadge>

          {showProgress && completedExercises.size > 0 && (
            <BaseBadge variant="success" size="lg">
              {completedExercises.size}/{exercises.length} completados
            </BaseBadge>
          )}
        </div>

        {/* Toggle de modo */}
        {showModeToggle && exercises.length > 1 && (
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('scroll')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'scroll'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <List size={16} />
              Lista
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'gallery'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid size={16} />
              Galería
            </button>
          </div>
        )}
      </div>

      {/* Barra de progreso */}
      {showProgress && (
        <div className="mb-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Banner de completación */}
      {allCompleted && (
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="text-white" size={24} />
              </div>
              <div>
                <p className="font-bold text-green-800 dark:text-green-200">¡Serie Completada!</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Has completado todos los ejercicios ({exercises.length}/{exercises.length})
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini navegación (dots) para galería */}
      {viewMode === 'gallery' && exercises.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-3 mb-4">
          {exercises.map((exercise, index) => {
            const isActive = index === currentIndex;
            const isCompleted = completedExercises.has(index);

            return (
              <button
                key={index}
                onClick={() => goToExercise(index)}
                className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-blue-500 text-white ring-2 ring-offset-2 ring-blue-300'
                    : isCompleted
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title={`Ejercicio ${index + 1}`}
              >
                {isCompleted ? (
                  <CheckCircle size={16} />
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Contenido */}
      {viewMode === 'scroll' ? (
        /* Modo Scroll: todos visibles */
        <div
          ref={containerRef}
          className="space-y-6 overflow-y-auto pr-2"
          style={{ maxHeight }}
        >
          {exercises.map((exercise, index) => (
            <div
              key={exercise.id || index}
              id={`chained-exercise-${index}`}
              className={`rounded-xl border-2 overflow-hidden transition-all ${
                completedExercises.has(index)
                  ? 'border-green-300 dark:border-green-700'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Header del ejercicio */}
              <div className={`px-4 py-3 flex items-center justify-between ${
                completedExercises.has(index)
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-gray-50 dark:bg-gray-800'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                    completedExercises.has(index)
                      ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {completedExercises.has(index) ? <CheckCircle size={16} /> : index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {exercise.title || `Ejercicio ${index + 1}`}
                  </span>
                </div>

                {completedExercises.has(index) && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    ✓ Completado
                  </span>
                )}
              </div>

              {/* Contenido del ejercicio */}
              <div className="p-4 bg-white dark:bg-gray-900">
                {renderExercise(exercise, index, {
                  isCompleted: completedExercises.has(index),
                  onComplete: (result) => markAsComplete(index, result)
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Modo Galería: uno a la vez */
        <div className="relative">
          <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className={`px-4 py-3 flex items-center justify-between ${
              completedExercises.has(currentIndex)
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-gray-50 dark:bg-gray-800'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  completedExercises.has(currentIndex)
                    ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200'
                    : 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
                }`}>
                  {currentIndex + 1}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {exercises[currentIndex]?.title || `Ejercicio ${currentIndex + 1}`}
                </span>
              </div>

              <span className="text-xs text-gray-500 dark:text-gray-400">
                {currentIndex + 1} de {exercises.length}
              </span>
            </div>

            {/* Contenido */}
            <div className="p-4 bg-white dark:bg-gray-900">
              {renderExercise(exercises[currentIndex], currentIndex, {
                isCompleted: completedExercises.has(currentIndex),
                onComplete: (result) => markAsComplete(currentIndex, result)
              })}
            </div>
          </div>

          {/* Navegación */}
          {exercises.length > 1 && (
            <div className="flex items-center justify-between mt-4">
              <BaseButton
                variant="secondary"
                icon={ChevronLeft}
                onClick={goToPrevious}
                disabled={currentIndex === 0}
              >
                Anterior
              </BaseButton>

              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {currentIndex + 1} / {exercises.length}
              </span>

              <BaseButton
                variant="secondary"
                onClick={goToNext}
                disabled={currentIndex === exercises.length - 1}
              >
                Siguiente
                <ChevronRight size={16} className="ml-1" />
              </BaseButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChainedLayout;
