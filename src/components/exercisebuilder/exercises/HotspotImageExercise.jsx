/**
 * @fileoverview Ejercicio de imagen interactiva con áreas clickeables (hotspots)
 * @module components/exercisebuilder/exercises/HotspotImageExercise
 */

import { useState } from 'react';
import { CheckCircle, XCircle, Lightbulb, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { BaseButton, BaseCard, BaseBadge, CategoryBadge } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';

/**
 * Ejercicio de Hotspot en Imagen
 * Los estudiantes hacen clic en áreas específicas de una imagen
 *
 * @example
 * <HotspotImageExercise
 *   imageUrl="/images/kitchen.jpg"
 *   instruction="Haz clic en la nevera"
 *   hotspots={[
 *     { id: 'fridge', x: 20, y: 30, width: 15, height: 25, label: 'Nevera', correct: true },
 *     { id: 'oven', x: 50, y: 40, width: 15, height: 20, label: 'Horno', correct: false }
 *   ]}
 *   cefrLevel="A1"
 * />
 */
export function HotspotImageExercise({
  imageUrl = '',
  instruction = 'Haz clic en el objeto correcto',
  hotspots = [],
  hint = '',
  explanation = '',
  cefrLevel = 'A1',
  onComplete = () => {}
}) {
  const correctHotspot = hotspots.find(h => h.correct);
  const [clickedHotspot, setClickedHotspot] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const {
    isCorrect,
    attempts,
    showHint,
    handleCheck: baseHandleCheck,
    handleHint,
    handleReset,
    getFeedbackIcon,
    getStars,
    score
  } = useExerciseState({
    correctAnswers: [correctHotspot?.id],
    maxAttempts: 3,
    onComplete
  });

  const handleHotspotClick = (hotspot) => {
    if (isCorrect !== null) return;

    setClickedHotspot(hotspot);
    baseHandleCheck([hotspot.id]);
  };

  const handleResetExercise = () => {
    handleReset();
    setClickedHotspot(null);
  };

  return (
    <BaseCard className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ImageIcon className="text-zinc-600 dark:text-zinc-400" size={24} />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Imagen Interactiva
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {instruction}
            </p>
          </div>
        </div>
        <CategoryBadge type="cefr" value={cefrLevel} />
      </div>

      {/* Imagen con hotspots */}
      <div className="mb-6 relative">
        {!imageLoaded && (
          <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">Cargando imagen...</p>
          </div>
        )}

        <div className={`relative ${!imageLoaded ? 'hidden' : ''}`}>
          <img
            src={imageUrl}
            alt="Ejercicio interactivo"
            onLoad={() => setImageLoaded(true)}
            className="w-full h-auto rounded-lg"
          />

          {/* Overlay con hotspots */}
          {imageLoaded && hotspots.map((hotspot) => (
            <button
              key={hotspot.id}
              onClick={() => handleHotspotClick(hotspot)}
              disabled={isCorrect !== null}
              className={`
                absolute border-4 rounded-lg transition-all
                ${isCorrect === null
                  ? 'border-blue-400 hover:border-blue-600 hover:bg-blue-500/20 cursor-pointer'
                  : clickedHotspot?.id === hotspot.id
                    ? hotspot.correct
                      ? 'border-green-500 bg-green-500/20'
                      : 'border-red-500 bg-red-500/20'
                    : hotspot.correct
                      ? 'border-orange-400 bg-orange-500/20'
                      : 'border-transparent'
                }
                disabled:cursor-not-allowed
              `}
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                width: `${hotspot.width}%`,
                height: `${hotspot.height}%`
              }}
              title={isCorrect !== null ? hotspot.label : ''}
            >
              {isCorrect !== null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs font-medium">
                    {hotspot.label}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Pista */}
      {showHint && hint && (
        <BaseCard variant="info" className="mb-4">
          <div className="flex gap-3">
            <Lightbulb size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Pista:</p>
              <p className="text-sm text-blue-800 dark:text-blue-200">{hint}</p>
            </div>
          </div>
        </BaseCard>
      )}

      {/* Feedback */}
      {isCorrect !== null && (
        <BaseCard variant={isCorrect ? 'success' : 'error'} className="mb-4">
          <div className="flex items-start gap-3">
            {getFeedbackIcon()}
            <div className="flex-1">
              <p className="font-semibold mb-1">
                {isCorrect ? '¡Correcto!' : 'Intenta de nuevo'}
              </p>
              <p className="text-sm">
                {isCorrect
                  ? `Has identificado correctamente: ${correctHotspot?.label}. Puntuación: ${score}/100`
                  : `Seleccionaste: ${clickedHotspot?.label}. La respuesta correcta es: ${correctHotspot?.label}. Intentos restantes: ${3 - attempts}`
                }
              </p>
              {isCorrect && explanation && (
                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium mb-1">Explicación:</p>
                  <p className="text-sm">{explanation}</p>
                </div>
              )}
            </div>
            {isCorrect && (
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <span key={i} className={`text-2xl ${i < getStars() ? 'text-yellow-400' : 'text-gray-300'}`}>
                    ★
                  </span>
                ))}
              </div>
            )}
          </div>
        </BaseCard>
      )}

      {/* Botones */}
      <div className="flex gap-3">
        {hint && !showHint && isCorrect === null && (
          <BaseButton variant="outline" icon={Lightbulb} onClick={handleHint}>
            Pista
          </BaseButton>
        )}
        <BaseButton
          variant={isCorrect ? 'primary' : 'ghost'}
          icon={RefreshCw}
          onClick={handleResetExercise}
          fullWidth
        >
          {isCorrect ? 'Nuevo Intento' : 'Reiniciar'}
        </BaseButton>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Intentos: {attempts}/3</span>
          {isCorrect !== null && <span>Puntuación: {score}/100</span>}
        </div>
      </div>
    </BaseCard>
  );
}

export default HotspotImageExercise;
