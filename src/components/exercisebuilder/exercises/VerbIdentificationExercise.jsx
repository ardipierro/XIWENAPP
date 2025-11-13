/**
 * @fileoverview Ejercicio de identificación de verbos en texto
 * @module components/designlab/exercises/VerbIdentificationExercise
 */

import { useState } from 'react';
import { Check, X, Star, BookOpen, RotateCcw, Eye } from 'lucide-react';
import { BaseButton, BaseBadge, BaseCard } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';
import { useExerciseBuilderConfig } from '../../../hooks/useExerciseBuilderConfig';
import logger from '../../../utils/logger';

/**
 * Ejercicio de identificación de verbos en texto
 * @param {Object} props
 * @param {string} props.instruction - Instrucción del ejercicio
 * @param {string} props.text - Texto completo
 * @param {Array<Object>} props.words - Todas las palabras [{text, start, end, isVerb, conjugation, infinitive}]
 * @param {string} props.explanation - Explicación
 * @param {string} props.cefrLevel - Nivel CEFR
 * @param {number} props.verbsToFind - Número de verbos a encontrar
 * @param {Function} props.onComplete - Callback al completar
 */
export function VerbIdentificationExercise({
  instruction = 'Selecciona todos los verbos en el texto',
  text = '',
  words = [],
  explanation = '',
  cefrLevel = 'A2',
  verbsToFind = null,
  onComplete
}) {
  const { config } = useExerciseBuilderConfig();
  const [selectedWords, setSelectedWords] = useState(new Set());
  const [showConjugationInfo, setShowConjugationInfo] = useState(false);

  // Filtrar solo verbos
  const verbs = words.filter((w) => w.isVerb);
  const correctVerbsSet = new Set(verbs.map((v) => v.text));
  const targetCount = verbsToFind || verbs.length;

  const validateSelection = (selected, correct) => {
    if (!selected || !(selected instanceof Set)) return false;
    const selectedArray = Array.from(selected);
    return (
      selectedArray.length === targetCount &&
      selectedArray.every((word) => correct.has(word))
    );
  };

  const {
    isCorrect,
    showFeedback,
    checkAnswer,
    resetExercise,
    score,
    stars,
    attempts
  } = useExerciseState({
    exerciseType: 'verb-identification',
    correctAnswer: correctVerbsSet,
    validateFn: validateSelection,
    maxPoints: 100
  });

  const handleWordClick = (word) => {
    if (showFeedback) return;

    const newSelected = new Set(selectedWords);
    if (newSelected.has(word.text)) {
      newSelected.delete(word.text);
    } else {
      newSelected.add(word.text);
    }
    setSelectedWords(newSelected);
  };

  const handleCheck = () => {
    const result = checkAnswer(selectedWords);
    logger.info('Verb Identification Exercise checked:', result);

    if (onComplete) {
      onComplete({
        ...result,
        exerciseType: 'verb-identification',
        selectedWords: Array.from(selectedWords),
        correctVerbs: Array.from(correctVerbsSet)
      });
    }
  };

  const handleReset = () => {
    setSelectedWords(new Set());
    setShowConjugationInfo(false);
    resetExercise();
  };

  // Renderizar texto con palabras seleccionables
  const renderText = () => {
    const parts = [];
    let lastIndex = 0;

    const sortedWords = [...words].sort((a, b) => a.start - b.start);

    sortedWords.forEach((word, idx) => {
      // Texto antes de la palabra
      if (word.start > lastIndex) {
        parts.push(
          <span key={`text-${idx}`} className="text-gray-900 dark:text-white">
            {text.substring(lastIndex, word.start)}
          </span>
        );
      }

      const isSelected = selectedWords.has(word.text);
      const isVerb = word.isVerb;
      const isCorrect = showFeedback && isVerb && isSelected;
      const isIncorrect = showFeedback && !isVerb && isSelected;
      const isMissed = showFeedback && isVerb && !isSelected;

      // Palabra seleccionable
      parts.push(
        <button
          key={`word-${idx}`}
          onClick={() => handleWordClick(word)}
          disabled={showFeedback}
          className={`
            relative inline-block px-1 py-0.5 mx-0.5 rounded transition-all
            ${!showFeedback ? 'cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30' : 'cursor-default'}
            ${isSelected && !showFeedback ? 'bg-blue-200 dark:bg-blue-800 font-semibold border-b-2 border-blue-600' : ''}
            ${isCorrect ? 'bg-green-200 dark:bg-green-800 font-semibold border-b-2 border-green-600' : ''}
            ${isIncorrect ? 'bg-red-200 dark:bg-red-800 font-semibold border-b-2 border-red-600' : ''}
            ${isMissed ? 'bg-yellow-200 dark:bg-yellow-800 border-b-2 border-yellow-600 opacity-70' : ''}
          `}
          style={{
            color: config.customColors?.textColor
          }}
        >
          {text.substring(word.start, word.end)}

          {/* Tooltip con información del verbo */}
          {isVerb && (isSelected || showFeedback) && (
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg whitespace-nowrap z-10 shadow-lg pointer-events-none">
              <div className="space-y-1">
                <div className="font-semibold">Infinitivo: {word.infinitive}</div>
                {word.conjugation && (
                  <div className="text-gray-300 dark:text-gray-600">
                    {word.conjugation}
                  </div>
                )}
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
            </span>
          )}
        </button>
      );

      lastIndex = word.end;
    });

    // Texto restante
    if (lastIndex < text.length) {
      parts.push(
        <span key="text-end" className="text-gray-900 dark:text-white">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  const selectedCount = selectedWords.size;
  const correctCount = showFeedback
    ? Array.from(selectedWords).filter((w) => correctVerbsSet.has(w)).length
    : 0;

  return (
    <BaseCard
      title={instruction}
      badges={[
        <BaseBadge key="level" variant="info" size="sm">
          {cefrLevel}
        </BaseBadge>,
        <BaseBadge key="type" variant="default" size="sm">
          Identificar Verbos
        </BaseBadge>
      ]}
      className="w-full max-w-4xl mx-auto"
      style={{
        backgroundColor: config.customColors?.exerciseBackground
      }}
    >
      <div className="space-y-6">
        {/* Contador de progreso */}
        {!showFeedback && (
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-blue-500" strokeWidth={2} />
              <span className="text-sm text-blue-900 dark:text-blue-100">
                Haz clic en las palabras que son verbos
              </span>
            </div>
            <BaseBadge variant="primary" size="sm">
              {selectedCount} / {targetCount} seleccionados
            </BaseBadge>
          </div>
        )}

        {/* Texto con palabras seleccionables */}
        <div
          className="p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 leading-relaxed text-lg"
          style={{
            fontSize: `${config.fontSize}px`,
            borderColor: config.customColors?.borderColor,
            backgroundColor: config.customColors?.cardBackground,
            lineHeight: config.customStyles?.lineHeight || '1.8'
          }}
        >
          {renderText()}
        </div>

        {/* Lista de verbos seleccionados */}
        {!showFeedback && selectedWords.size > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Verbos seleccionados:
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedWords).map((word, i) => (
                <BaseBadge key={i} variant="primary" size="sm">
                  {word}
                </BaseBadge>
              ))}
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
                  : 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
              }
            `}
          >
            <div className="flex items-start gap-3 mb-3">
              {isCorrect ? (
                <Check size={24} className="flex-shrink-0" style={{ color: 'var(--color-success)' }} strokeWidth={2} />
              ) : (
                <X size={24} className="text-orange-500 flex-shrink-0" strokeWidth={2} />
              )}
              <div className="flex-1">
                <p className="font-semibold text-base text-gray-900 dark:text-white mb-1">
                  {isCorrect
                    ? '¡Perfecto! Identificaste todos los verbos'
                    : `${correctCount} de ${targetCount} verbos correctos`}
                </p>
                {explanation && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    {explanation}
                  </p>
                )}
              </div>
            </div>

            {/* Tabla de verbos */}
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Lista de verbos en el texto:
                </p>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  icon={Eye}
                  onClick={() => setShowConjugationInfo(!showConjugationInfo)}
                >
                  {showConjugationInfo ? 'Ocultar' : 'Ver'} Info
                </BaseButton>
              </div>
              <div className="space-y-2">
                {verbs.map((verb, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <div className="flex items-center gap-2">
                      {selectedWords.has(verb.text) ? (
                        <Check size={16} className="" style={{ color: 'var(--color-success)' }} strokeWidth={2} />
                      ) : (
                        <X size={16} className="text-orange-500" strokeWidth={2} />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {verb.text}
                      </span>
                    </div>
                    {showConjugationInfo && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {verb.infinitive} ({verb.conjugation})
                      </div>
                    )}
                  </div>
                ))}
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
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!showFeedback ? (
            <BaseButton
              variant="primary"
              onClick={handleCheck}
              disabled={selectedCount !== targetCount}
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

export default VerbIdentificationExercise;
