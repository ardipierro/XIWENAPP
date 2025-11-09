/**
 * @fileoverview Ejercicio de selección de texto con traducción al chino simplificado
 * @module components/designlab/exercises/TextSelectionExercise
 */

import { useState } from 'react';
import { Check, X, Star, Languages, HelpCircle, RotateCcw } from 'lucide-react';
import { BaseButton, BaseBadge, BaseCard } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';
import { useDesignLabConfig } from '../../../hooks/useDesignLabConfig';
import logger from '../../../utils/logger';

/**
 * Ejercicio de selección de texto con traducción al chino simplificado
 * @param {Object} props
 * @param {string} props.instruction - Instrucción del ejercicio
 * @param {string} props.text - Texto completo en español
 * @param {Array<Object>} props.words - Palabras/frases [{spanish, chinese, start, end}]
 * @param {string} props.targetWord - Palabra objetivo a seleccionar (en español)
 * @param {string} props.explanation - Explicación
 * @param {string} props.cefrLevel - Nivel CEFR
 * @param {Function} props.onComplete - Callback al completar
 */
export function TextSelectionExercise({
  instruction = 'Selecciona la palabra correcta en el texto',
  text = '',
  words = [],
  targetWord = '',
  explanation = '',
  cefrLevel = 'A2',
  onComplete
}) {
  const { config } = useDesignLabConfig();
  const [selectedWord, setSelectedWord] = useState(null);
  const [hoveredWord, setHoveredWord] = useState(null);

  const {
    isCorrect,
    showFeedback,
    checkAnswer,
    resetExercise,
    score,
    stars,
    attempts
  } = useExerciseState({
    exerciseType: 'text-selection',
    correctAnswer: targetWord,
    validateFn: (answer, correct) => {
      return answer?.spanish?.toLowerCase() === correct.toLowerCase();
    },
    maxPoints: 100
  });

  // Generar spans con palabras seleccionables
  const renderText = () => {
    const parts = [];
    let lastIndex = 0;

    // Ordenar palabras por posición
    const sortedWords = [...words].sort((a, b) => a.start - b.start);

    sortedWords.forEach((word, idx) => {
      // Agregar texto antes de la palabra
      if (word.start > lastIndex) {
        parts.push(
          <span key={`text-${idx}`} className="text-gray-900 dark:text-white">
            {text.substring(lastIndex, word.start)}
          </span>
        );
      }

      const isSelected = selectedWord?.spanish === word.spanish;
      const isHovered = hoveredWord?.spanish === word.spanish;
      const isCorrectWord = word.spanish.toLowerCase() === targetWord.toLowerCase();
      const showCorrect = showFeedback && isCorrectWord;
      const showIncorrect = showFeedback && isSelected && !isCorrect;

      // Agregar palabra seleccionable
      parts.push(
        <span
          key={`word-${idx}`}
          onClick={() => !showFeedback && setSelectedWord(word)}
          onMouseEnter={() => setHoveredWord(word)}
          onMouseLeave={() => setHoveredWord(null)}
          className={`
            relative inline-block px-1 py-0.5 mx-0.5 rounded cursor-pointer transition-all
            ${!showFeedback ? 'hover:bg-blue-100 dark:hover:bg-blue-900/30' : ''}
            ${isSelected && !showFeedback ? 'bg-blue-200 dark:bg-blue-800 font-semibold' : ''}
            ${showCorrect ? 'bg-green-200 dark:bg-green-800 font-semibold border-b-2 border-green-600' : ''}
            ${showIncorrect ? 'bg-red-200 dark:bg-red-800 font-semibold border-b-2 border-red-600' : ''}
          `}
          style={{
            color: config.customColors?.textColor
          }}
        >
          {text.substring(word.start, word.end)}

          {/* Tooltip con traducción al chino */}
          {(isHovered || isSelected) && (
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg whitespace-nowrap z-10 shadow-lg">
              <div className="flex items-center gap-2">
                <Languages size={14} strokeWidth={2} />
                <span className="font-medium" style={{ fontFamily: 'serif' }}>
                  {word.chinese}
                </span>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
            </span>
          )}
        </span>
      );

      lastIndex = word.end;
    });

    // Agregar texto restante
    if (lastIndex < text.length) {
      parts.push(
        <span key="text-end" className="text-gray-900 dark:text-white">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  const handleCheck = () => {
    const result = checkAnswer();
    logger.info('Text Selection Exercise checked:', result);

    if (onComplete) {
      onComplete({
        ...result,
        exerciseType: 'text-selection',
        selectedWord: selectedWord?.spanish,
        targetWord
      });
    }
  };

  const handleReset = () => {
    setSelectedWord(null);
    setHoveredWord(null);
    resetExercise();
  };

  const targetWordData = words.find(
    (w) => w.spanish.toLowerCase() === targetWord.toLowerCase()
  );

  return (
    <BaseCard
      title={instruction}
      badges={[
        <BaseBadge key="level" variant="info" size="sm">
          {cefrLevel}
        </BaseBadge>,
        <BaseBadge key="type" variant="default" size="sm">
          Selección de Texto
        </BaseBadge>,
        <BaseBadge key="lang" variant="primary" size="sm">
          🇨🇳 Chino Simplificado
        </BaseBadge>
      ]}
      className="w-full max-w-4xl mx-auto"
      style={{
        backgroundColor: config.customColors?.exerciseBackground
      }}
    >
      <div className="space-y-6">
        {/* Instrucción de uso */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <HelpCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Pasa el cursor sobre las palabras para ver su traducción al chino. Haz clic para seleccionar.
            </p>
          </div>
        </div>

        {/* Texto con palabras seleccionables */}
        <div
          className="p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 leading-relaxed text-lg"
          style={{
            fontSize: `${config.fontSize}px`,
            borderColor: config.customColors?.borderColor,
            backgroundColor: config.customColors?.cardBackground
          }}
        >
          {renderText()}
        </div>

        {/* Palabra seleccionada */}
        {selectedWord && !showFeedback && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Palabra seleccionada:
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {selectedWord.spanish}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-lg font-medium text-blue-900 dark:text-blue-100" style={{ fontFamily: 'serif' }}>
                    {selectedWord.chinese}
                  </span>
                </div>
              </div>
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={() => setSelectedWord(null)}
              >
                Cambiar
              </BaseButton>
            </div>
          </div>
        )}

        {/* Feedback */}
        {showFeedback && (
          <div
            className={`
              p-4 rounded-lg border-2
              ${
                isCorrect
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-500'
              }
            `}
          >
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <Check size={24} className="text-green-500 flex-shrink-0" strokeWidth={2} />
              ) : (
                <X size={24} className="text-red-500 flex-shrink-0" strokeWidth={2} />
              )}
              <div className="flex-1">
                <p className="font-semibold text-base text-gray-900 dark:text-white mb-2">
                  {isCorrect ? '¡Correcto!' : 'Incorrecto'}
                </p>

                {!isCorrect && targetWordData && (
                  <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      La palabra correcta era:
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {targetWordData.spanish}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-lg font-medium text-gray-900 dark:text-white" style={{ fontFamily: 'serif' }}>
                        {targetWordData.chinese}
                      </span>
                    </div>
                  </div>
                )}

                {explanation && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {explanation}
                  </p>
                )}
              </div>
            </div>

            {/* Score */}
            {isCorrect && (
              <div className="mt-3 flex items-center gap-4 pt-3 border-t border-green-200 dark:border-green-800">
                <div className="flex items-center gap-1">
                  {[...Array(3)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      strokeWidth={2}
                      className={
                        i < stars
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-gray-300 dark:text-gray-600'
                      }
                    />
                  ))}
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {score} puntos
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {attempts === 1 ? '1er intento' : `${attempts} intentos`}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Glosario de referencia */}
        <details className="group">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750">
              <Languages size={18} className="text-gray-500" strokeWidth={2} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Ver glosario completo (Español → 中文)
              </span>
              <span className="ml-auto text-gray-400 group-open:rotate-180 transition-transform">
                ▼
              </span>
            </div>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {words.map((word, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {word.spanish}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300" style={{ fontFamily: 'serif' }}>
                    {word.chinese}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </details>

        {/* Actions */}
        <div className="flex gap-3">
          {!showFeedback ? (
            <BaseButton
              variant="primary"
              onClick={handleCheck}
              disabled={!selectedWord}
              fullWidth
            >
              Verificar Selección
            </BaseButton>
          ) : (
            <BaseButton variant="ghost" onClick={handleReset} icon={RotateCcw} fullWidth>
              Reintentar
            </BaseButton>
          )}
        </div>
      </div>
    </BaseCard>
  );
}

export default TextSelectionExercise;
