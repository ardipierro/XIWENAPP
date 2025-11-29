/**
 * @fileoverview DragDropRenderer - Renderizador unificado de arrastrar y soltar
 * @module components/exercises/renderers/DragDropRenderer
 *
 * UNIFICA:
 * - container/DragDropBlanksExercise.jsx (diseño de referencia)
 *
 * Funcionalidades:
 * - Palabras marcadas con *palabra* se extraen
 * - Se muestran como elementos arrastrables
 * - Usuario arrastra a espacios en blanco en el texto
 * - Validación automática o manual
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Check, X, GripVertical, RotateCcw, Trophy } from 'lucide-react';
import { BaseBadge, BaseButton } from '../../common';
import { useExercise, FEEDBACK_MODES } from '../core/ExerciseContext';

// ✅ ELIMINADO: colores hardcoded - ahora usa variables CSS del tema
// Los colores se obtienen de globals.css (--color-success, --color-error, etc.)

/**
 * Parsear texto y extraer blanks
 * Formato: *palabra* marca la palabra para extraer
 */
function parseTextWithBlanks(text) {
  if (!text || typeof text !== 'string') {
    return { segments: [], words: [] };
  }

  const segments = [];
  const words = [];
  let lastIndex = 0;
  const regex = /\*([^*]+)\*/g;
  let match;
  let blankIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    // Texto antes del blank
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }

    // El blank
    const word = match[1].trim();
    segments.push({
      type: 'blank',
      index: blankIndex,
      correctWord: word
    });

    words.push({
      index: blankIndex,
      word: word
    });

    blankIndex++;
    lastIndex = regex.lastIndex;
  }

  // Texto restante
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  return { segments, words };
}

/**
 * Mezclar array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * DragDropRenderer - Renderiza ejercicio de arrastrar y soltar
 *
 * @param {Object} props
 * @param {string} props.text - Texto con palabras marcadas (*palabra*)
 * @param {string} [props.instruction] - Instrucción del ejercicio
 * @param {boolean} [props.shuffleWords] - Mezclar palabras
 * @param {boolean} [props.showWordBank] - Mostrar banco de palabras
 * @param {Object} [props.colors] - Colores personalizados
 * @param {string} [props.className] - Clases adicionales
 */
export function DragDropRenderer({
  text,
  instruction,
  shuffleWords = true,
  showWordBank = true,
  colors = {},
  className = ''
}) {
  const {
    userAnswer,
    setAnswer,
    showingFeedback,
    config,
    checkAnswer
  } = useExercise();

  // Parsear texto
  const { segments, words } = useMemo(() => parseTextWithBlanks(text), [text]);

  // Palabras disponibles (mezclarlas si está habilitado)
  const availableWords = useMemo(() => {
    const wordList = words.map(w => ({ ...w }));
    return shuffleWords ? shuffleArray(wordList) : wordList;
  }, [words, shuffleWords]);

  // Estado de blanks colocados: { blankIndex: wordIndex }
  const [placedWords, setPlacedWords] = useState({});

  // Estado de validación: { blankIndex: boolean }
  const [validation, setValidation] = useState({});

  // Palabra siendo arrastrada
  const [draggedWordIndex, setDraggedWordIndex] = useState(null);

  // Sincronizar con context
  useEffect(() => {
    setAnswer(placedWords);
  }, [placedWords, setAnswer]);

  /**
   * Handlers de drag and drop
   */
  const handleDragStart = useCallback((e, wordIndex) => {
    setDraggedWordIndex(wordIndex);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e, blankIndex) => {
    e.preventDefault();
    if (draggedWordIndex === null || showingFeedback) return;

    // Remover palabra de otro blank si ya estaba colocada
    const updatedPlacements = { ...placedWords };
    Object.keys(updatedPlacements).forEach(key => {
      if (updatedPlacements[key] === draggedWordIndex) {
        delete updatedPlacements[key];
      }
    });

    // Colocar en nuevo blank
    updatedPlacements[blankIndex] = draggedWordIndex;

    setPlacedWords(updatedPlacements);
    setDraggedWordIndex(null);
  }, [draggedWordIndex, placedWords, showingFeedback]);

  const handleDragEnd = useCallback(() => {
    setDraggedWordIndex(null);
  }, []);

  /**
   * Remover palabra de un blank
   */
  const handleRemoveWord = useCallback((blankIndex) => {
    if (showingFeedback) return;

    setPlacedWords(prev => {
      const next = { ...prev };
      delete next[blankIndex];
      return next;
    });
  }, [showingFeedback]);

  /**
   * Reset
   */
  const handleReset = useCallback(() => {
    setPlacedWords({});
    setValidation({});
  }, []);

  // Palabras usadas
  const usedWordIndices = useMemo(() => new Set(Object.values(placedWords)), [placedWords]);

  // Calcular progreso
  const blanksCount = segments.filter(s => s.type === 'blank').length;
  const placedCount = Object.keys(placedWords).length;
  const correctCount = showingFeedback ? Object.values(validation).filter(v => v).length : 0;

  /**
   * Obtener estilo de blank
   */
  const getBlankStyle = (blankIndex) => {
    const hasWord = placedWords[blankIndex] !== undefined;
    const isCorrect = validation[blankIndex];

    if (showingFeedback) {
      if (isCorrect) {
        return {
          backgroundColor: 'var(--color-success-bg)',
          borderColor: 'var(--color-success)',
          color: 'var(--color-success)'
        };
      }
      if (hasWord) {
        return {
          backgroundColor: 'var(--color-error-bg)',
          borderColor: 'var(--color-error)',
          color: 'var(--color-error)'
        };
      }
      return {
        backgroundColor: 'transparent',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-muted)'
      };
    }

    if (hasWord) {
      return {
        backgroundColor: 'var(--color-bg-tertiary)',
        borderColor: 'var(--color-accent)',
        color: 'var(--color-text-primary)'
      };
    }

    return {
      backgroundColor: 'transparent',
      borderColor: 'var(--color-border)',
      borderStyle: 'dashed',
      color: 'var(--color-text-muted)'
    };
  };

  return (
    <div className={`drag-drop-renderer w-full ${className}`}>
      {/* Instrucción */}
      {instruction && (
        <div
          className="mb-4 p-3 rounded-lg"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {instruction}
          </p>
        </div>
      )}

      {/* Header con progreso y botón verificar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {placedCount}/{blanksCount} colocadas
        </span>

        <div className="flex items-center gap-2">
          {!showingFeedback && placedCount > 0 && (
            <>
              <BaseButton
                size="sm"
                variant="ghost"
                icon={RotateCcw}
                onClick={handleReset}
              >
                Reiniciar
              </BaseButton>

              {placedCount === blanksCount && !showingFeedback && (
                <BaseButton
                  size="sm"
                  variant="primary"
                  icon={Check}
                  onClick={() => {
                    // Construir respuestas para validar
                    const correctAnswers = {};
                    const userAnswers = {};
                    const results = {};

                    segments.forEach(seg => {
                      if (seg.type === 'blank') {
                        correctAnswers[seg.index] = seg.correctWord;
                        const placedWordIdx = placedWords[seg.index];
                        if (placedWordIdx !== undefined) {
                          const placedWord = words.find(w => w.index === placedWordIdx);
                          userAnswers[seg.index] = placedWord?.word || '';
                          results[seg.index] = placedWord?.word === seg.correctWord;
                        } else {
                          userAnswers[seg.index] = '';
                          results[seg.index] = false;
                        }
                      }
                    });

                    // Actualizar validación visual
                    setValidation(results);

                    // Reportar al ExerciseProvider
                    checkAnswer(correctAnswers, userAnswers);
                  }}
                >
                  Verificar
                </BaseButton>
              )}
            </>
          )}
        </div>
      </div>

      {/* Banco de palabras */}
      {showWordBank && (
        <div
          className="mb-6 p-4 rounded-lg"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Arrastra las palabras:
          </p>
          <div className="flex flex-wrap gap-2">
            {availableWords.map(word => {
              const isUsed = usedWordIndices.has(word.index);

              return (
                <div
                  key={word.index}
                  draggable={!isUsed && !showingFeedback}
                  onDragStart={(e) => handleDragStart(e, word.index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all ${
                    isUsed ? 'opacity-40 cursor-not-allowed' : 'cursor-move hover:shadow-md'
                  }`}
                  style={{
                    backgroundColor: isUsed ? 'transparent' : 'var(--color-bg-primary)',
                    borderColor: isUsed ? 'transparent' : 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {!isUsed && <GripVertical size={14} className="opacity-50" />}
                  <span className="font-medium">{word.word}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Texto con blanks */}
      <div
        className={`p-4 rounded-lg leading-relaxed ${className}`}
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)'
        }}
      >
        {segments.map((segment, idx) => {
          if (segment.type === 'text') {
            return <span key={idx}>{segment.content}</span>;
          }

          // Blank
          const placedWordIdx = placedWords[segment.index];
          const placedWord = placedWordIdx !== undefined
            ? words.find(w => w.index === placedWordIdx)
            : null;
          const blankStyle = getBlankStyle(segment.index);
          const isCorrect = validation[segment.index];

          return (
            <span
              key={idx}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, segment.index)}
              className="inline-flex items-center mx-1 px-3 py-1 rounded border-2 min-w-[80px] justify-center relative"
              style={{
                verticalAlign: 'middle',
                ...blankStyle
              }}
            >
              {placedWord ? (
                <>
                  <span className="font-medium">{placedWord.word}</span>
                  {!showingFeedback && (
                    <button
                      onClick={() => handleRemoveWord(segment.index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X size={14} />
                    </button>
                  )}
                  {showingFeedback && (
                    <span className="ml-2">
                      {isCorrect ? (
                        <Check size={14} style={{ color: 'var(--color-success)' }} />
                      ) : (
                        <X size={14} style={{ color: 'var(--color-error)' }} />
                      )}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs opacity-50">___</span>
              )}

              {/* Mostrar palabra correcta si falló */}
              {showingFeedback && !isCorrect && config.showCorrectAnswer !== false && (
                <span
                  className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap"
                  style={{ color: 'var(--color-success)' }}
                >
                  ({segment.correctWord})
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Resultados cuando showingFeedback */}
      {showingFeedback && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Check size={16} style={{ color: 'var(--color-success)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>
                {correctCount} correctas
              </span>
            </div>
            <div className="flex items-center gap-1">
              <X size={16} style={{ color: 'var(--color-error)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-error)' }}>
                {blanksCount - correctCount} incorrectas
              </span>
            </div>
          </div>

          {/* Result Badge */}
          <div>
            {correctCount === blanksCount ? (
              <BaseBadge variant="success" size="lg" className="text-base px-4 py-2">
                <Trophy className="w-4 h-4 inline mr-1" />
                ¡Perfecto! +{(config.correctPoints || 10) * blanksCount}pts
              </BaseBadge>
            ) : correctCount > 0 ? (
              <BaseBadge variant="warning" size="lg" className="text-base px-4 py-2">
                {Math.round((correctCount / blanksCount) * 100)}% correcto
              </BaseBadge>
            ) : (
              <BaseBadge variant="danger" size="lg" className="text-base px-4 py-2">
                Intenta de nuevo
              </BaseBadge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DragDropRenderer;
