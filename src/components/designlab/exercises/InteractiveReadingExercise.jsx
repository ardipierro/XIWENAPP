/**
 * @fileoverview Ejercicio de lectura interactiva con modales de traducción
 * @module components/designlab/exercises/InteractiveReadingExercise
 */

import { useState, useRef, useEffect } from 'react';
import { Check, X, Star, BookText, Volume2, Eye, EyeOff, Languages, RotateCcw } from 'lucide-react';
import { BaseButton, BaseBadge, BaseCard } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';
import { useDesignLabConfig } from '../../../hooks/useDesignLabConfig';
import logger from '../../../utils/logger';

/**
 * Ejercicio de lectura interactiva con modales/tooltips de traducción al clickear
 * @param {Object} props
 * @param {string} props.title - Título de la lectura
 * @param {string} props.text - Texto completo
 * @param {Array<Object>} props.vocabulary - Palabras/expresiones [{spanish, english, chinese, start, end, context, audioUrl}]
 * @param {Array<Object>} props.questions - Preguntas de comprensión opcionales
 * @param {string} props.explanation - Explicación
 * @param {string} props.cefrLevel - Nivel CEFR
 * @param {Function} props.onComplete - Callback al completar
 */
export function InteractiveReadingExercise({
  title = 'Lectura Interactiva',
  text = '',
  vocabulary = [],
  questions = [],
  explanation = '',
  cefrLevel = 'B1',
  onComplete
}) {
  const { config } = useDesignLabConfig();
  const [clickedWord, setClickedWord] = useState(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [clickedWords, setClickedWords] = useState(new Set());
  const [showTranslations, setShowTranslations] = useState(true);
  const [answers, setAnswers] = useState({});
  const [showQuestions, setShowQuestions] = useState(questions.length > 0);
  const modalRef = useRef(null);

  const {
    isCorrect,
    showFeedback,
    checkAnswer,
    resetExercise,
    score,
    stars
  } = useExerciseState({
    exerciseType: 'interactive-reading',
    correctAnswer: questions.reduce((acc, q, i) => {
      acc[i] = q.correctAnswer;
      return acc;
    }, {}),
    validateFn: (userAnswers, correct) => {
      if (questions.length === 0) return true; // Sin preguntas = automáticamente correcto
      return JSON.stringify(userAnswers) === JSON.stringify(correct);
    },
    maxPoints: 100
  });

  // Cerrar modal al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setClickedWord(null);
      }
    };

    if (clickedWord) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clickedWord]);

  const handleWordClick = (word, event) => {
    const rect = event.target.getBoundingClientRect();

    // Posicionar modal cerca de la palabra clickeada
    setModalPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });

    setClickedWord(word);

    // Marcar palabra como vista
    setClickedWords(new Set([...clickedWords, word.spanish]));
  };

  const playAudio = (audioUrl) => {
    if (!audioUrl) return;
    try {
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      logger.error('Error playing audio:', error);
    }
  };

  const handleCheck = () => {
    const result = checkAnswer();
    logger.info('Interactive Reading Exercise checked:', result);

    if (onComplete) {
      onComplete({
        ...result,
        exerciseType: 'interactive-reading',
        wordsViewed: clickedWords.size,
        totalWords: vocabulary.length,
        answers
      });
    }
  };

  const handleReset = () => {
    setClickedWord(null);
    setClickedWords(new Set());
    setAnswers({});
    resetExercise();
  };

  // Renderizar texto con palabras clickeables
  const renderText = () => {
    const parts = [];
    let lastIndex = 0;

    const sortedVocab = [...vocabulary].sort((a, b) => a.start - b.start);

    sortedVocab.forEach((word, idx) => {
      // Texto antes de la palabra
      if (word.start > lastIndex) {
        parts.push(
          <span key={`text-${idx}`} className="text-gray-900 dark:text-white">
            {text.substring(lastIndex, word.start)}
          </span>
        );
      }

      const isViewed = clickedWords.has(word.spanish);

      // Palabra clickeable
      parts.push(
        <button
          key={`word-${idx}`}
          onClick={(e) => showTranslations && handleWordClick(word, e)}
          className={`
            relative inline-block px-1 py-0.5 mx-0.5 rounded transition-all
            ${showTranslations ? 'cursor-pointer' : 'cursor-default'}
            ${showTranslations ? 'border-b-2 border-dotted border-blue-400 dark:border-blue-500' : ''}
            ${showTranslations ? 'hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-solid' : ''}
            ${isViewed ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
          `}
          style={{
            color: config.customColors?.textColor
          }}
        >
          {text.substring(word.start, word.end)}
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

  const progressPercent = vocabulary.length > 0 ? (clickedWords.size / vocabulary.length) * 100 : 0;

  return (
    <BaseCard
      title={title}
      badges={[
        <BaseBadge key="level" variant="info" size="sm">
          {cefrLevel}
        </BaseBadge>,
        <BaseBadge key="type" variant="default" size="sm">
          Lectura Interactiva
        </BaseBadge>
      ]}
      className="w-full max-w-5xl mx-auto"
      style={{
        backgroundColor: config.customColors?.exerciseBackground
      }}
    >
      <div className="space-y-6">
        {/* Controles */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <BookText size={18} className="text-gray-500" strokeWidth={2} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Haz clic en las palabras subrayadas para ver su traducción
            </span>
          </div>
          <BaseButton
            variant="ghost"
            size="sm"
            icon={showTranslations ? Eye : EyeOff}
            onClick={() => setShowTranslations(!showTranslations)}
          >
            {showTranslations ? 'Ocultar' : 'Mostrar'} Ayuda
          </BaseButton>
        </div>

        {/* Barra de progreso de vocabulario explorado */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Vocabulario explorado:
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {clickedWords.size} / {vocabulary.length}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Texto con palabras interactivas */}
        <div
          className="p-8 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 leading-relaxed text-lg shadow-sm"
          style={{
            fontSize: `${config.fontSize}px`,
            borderColor: config.customColors?.borderColor,
            backgroundColor: config.customColors?.cardBackground,
            lineHeight: config.customStyles?.lineHeight || '2',
            letterSpacing: config.customStyles?.letterSpacing || 'normal'
          }}
        >
          {renderText()}
        </div>

        {/* Modal de traducción */}
        {clickedWord && (
          <div
            ref={modalRef}
            className="fixed z-50 transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${modalPosition.x}px`,
              top: `${modalPosition.y}px`
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-blue-500 dark:border-blue-400 p-4 max-w-sm animate-in fade-in duration-200">
              {/* Palabra en español */}
              <div className="mb-3">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {clickedWord.spanish}
                </div>
                {clickedWord.audioUrl && (
                  <BaseButton
                    variant="ghost"
                    size="sm"
                    icon={Volume2}
                    onClick={() => playAudio(clickedWord.audioUrl)}
                  >
                    Escuchar
                  </BaseButton>
                )}
              </div>

              {/* Traducciones */}
              <div className="space-y-2 mb-3">
                {clickedWord.english && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      🇬🇧 EN:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {clickedWord.english}
                    </span>
                  </div>
                )}
                {clickedWord.chinese && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      🇨🇳 ZH:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white" style={{ fontFamily: 'serif' }}>
                      {clickedWord.chinese}
                    </span>
                  </div>
                )}
              </div>

              {/* Contexto */}
              {clickedWord.context && (
                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300 italic">
                  "{clickedWord.context}"
                </div>
              )}

              {/* Flecha apuntando a la palabra */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-blue-500"></div>
            </div>
          </div>
        )}

        {/* Preguntas de comprensión */}
        {showQuestions && questions.length > 0 && !showFeedback && (
          <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
              Preguntas de Comprensión
            </h3>
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="space-y-2">
                <p className="font-medium text-gray-900 dark:text-white">
                  {qIdx + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setAnswers({ ...answers, [qIdx]: option.value })}
                      className={`
                        w-full p-3 rounded-lg border-2 text-left transition-all
                        ${
                          answers[qIdx] === option.value
                            ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
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
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <Check size={24} className="text-green-500 flex-shrink-0" strokeWidth={2} />
              ) : (
                <X size={24} className="text-orange-500 flex-shrink-0" strokeWidth={2} />
              )}
              <div className="flex-1">
                <p className="font-semibold text-base text-gray-900 dark:text-white mb-1">
                  {isCorrect ? '¡Excelente comprensión!' : 'Revisa tus respuestas'}
                </p>
                {explanation && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    {explanation}
                  </p>
                )}
              </div>
            </div>

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
          {questions.length > 0 && !showFeedback && (
            <BaseButton
              variant="primary"
              onClick={handleCheck}
              disabled={Object.keys(answers).length !== questions.length}
              fullWidth
            >
              Verificar Respuestas
            </BaseButton>
          )}
          {showFeedback && (
            <BaseButton variant="ghost" onClick={handleReset} icon={RotateCcw} fullWidth>
              Reintentar
            </BaseButton>
          )}
          {questions.length === 0 && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 w-full">
              Ejercicio de lectura libre. Explora todo el vocabulario.
            </div>
          )}
        </div>
      </div>
    </BaseCard>
  );
}

export default InteractiveReadingExercise;
