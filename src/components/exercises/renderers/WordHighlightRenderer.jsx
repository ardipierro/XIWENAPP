/**
 * @fileoverview WordHighlightRenderer - Renderizador unificado de marcar palabras
 * @module components/exercises/renderers/WordHighlightRenderer
 *
 * UNIFICA:
 * - container/WordHighlightExercise.jsx (diseño de referencia)
 *
 * Funcionalidades principales:
 * - Parseo de palabras marcadas con *palabra*
 * - Click para marcar/desmarcar
 * - Feedback según modo (instant, onSubmit)
 * - Score tracking
 * - Palabras desaparecen al acertar (opcional)
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Check, X, Eye, Trophy } from 'lucide-react';
import { BaseBadge, BaseButton } from '../../common';
import { useExercise, FEEDBACK_MODES } from '../core/ExerciseContext';

// Colores por defecto
const DEFAULT_COLORS = {
  correctColor: '#10b981',
  incorrectColor: '#ef4444',
  selectedColor: '#3b82f6',
  targetColor: '#f59e0b'
};

/**
 * Parsear texto con palabras marcadas
 * Formato: *palabra* marca la palabra como objetivo
 */
function parseTextWithTargets(text) {
  if (!text || typeof text !== 'string') {
    return { words: [], targets: [] };
  }

  const words = [];
  const targets = [];

  // Regex para detectar *palabra*
  const regex = /\*([^*]+)\*/g;
  let lastIndex = 0;
  let match;
  let wordIndex = 0;

  // Helper para procesar fragmento de texto
  const processFragment = (fragment) => {
    // Dividir en palabras preservando espacios y saltos de línea
    const tokens = fragment.split(/(\s+)/);
    tokens.forEach(token => {
      if (token.match(/\S/)) {
        // Es una palabra (tiene contenido no-espacio)
        words.push({
          text: token,
          isTarget: false,
          index: wordIndex,
          isLineBreak: false
        });
        wordIndex++;
      } else if (token.includes('\n')) {
        // Es un salto de línea
        words.push({
          text: '\n',
          isTarget: false,
          index: -1,
          isLineBreak: true
        });
      } else if (token) {
        // Es espacio
        words.push({
          text: ' ',
          isTarget: false,
          index: -1,
          isLineBreak: false
        });
      }
    });
  };

  while ((match = regex.exec(text)) !== null) {
    // Procesar texto antes del match
    if (match.index > lastIndex) {
      processFragment(text.slice(lastIndex, match.index));
    }

    // Agregar palabra objetivo
    const targetWord = match[1].trim();
    words.push({
      text: targetWord,
      isTarget: true,
      index: wordIndex,
      isLineBreak: false
    });

    targets.push({
      word: targetWord,
      index: wordIndex
    });

    wordIndex++;
    lastIndex = regex.lastIndex;
  }

  // Procesar texto restante
  if (lastIndex < text.length) {
    processFragment(text.slice(lastIndex));
  }

  return { words, targets };
}

/**
 * WordHighlightRenderer - Renderiza ejercicio de marcar palabras
 *
 * @param {Object} props
 * @param {string} props.text - Texto con palabras marcadas (*palabra*)
 * @param {string} [props.instruction] - Instrucción del ejercicio
 * @param {boolean} [props.wordsDisappear] - Palabras desaparecen al acertar
 * @param {boolean} [props.allowDeselect] - Permitir deseleccionar palabras
 * @param {boolean} [props.showTargetCount] - Mostrar contador de objetivos
 * @param {Object} [props.colors] - Colores personalizados
 * @param {string} [props.className] - Clases adicionales
 */
export function WordHighlightRenderer({
  text,
  instruction,
  wordsDisappear = false,
  allowDeselect = true,
  showTargetCount = true,
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

  // Merge colors with defaults
  const colorConfig = { ...DEFAULT_COLORS, ...colors };

  // Parsear texto
  const { words, targets } = useMemo(() => parseTextWithTargets(text), [text]);

  // Estado de palabras clickeadas (Set de índices)
  const [clickedWords, setClickedWords] = useState(new Set());

  // Estado de palabras correctas verificadas (para modo instant)
  const [verifiedCorrect, setVerifiedCorrect] = useState(new Set());

  // Sincronizar con context
  useEffect(() => {
    setAnswer(Array.from(clickedWords));
  }, [clickedWords, setAnswer]);

  /**
   * Handler de click en palabra
   */
  const handleWordClick = useCallback((wordIndex, isTarget) => {
    if (showingFeedback && !config.allowRetry) return;

    // Si ya fue verificada como correcta y desaparecen, no permitir click
    if (wordsDisappear && verifiedCorrect.has(wordIndex)) return;

    setClickedWords(prev => {
      const next = new Set(prev);

      if (next.has(wordIndex)) {
        // Deseleccionar si está permitido
        if (allowDeselect) {
          next.delete(wordIndex);
        }
      } else {
        // Seleccionar
        next.add(wordIndex);

        // En modo instant, verificar inmediatamente
        if (config.feedbackMode === FEEDBACK_MODES.INSTANT) {
          setTimeout(() => {
            if (isTarget) {
              setVerifiedCorrect(prev => new Set([...prev, wordIndex]));
            }
          }, 100);
        }
      }

      return next;
    });
  }, [showingFeedback, config, allowDeselect, wordsDisappear, verifiedCorrect]);

  /**
   * Obtener estilo de una palabra
   */
  const getWordStyle = (word) => {
    const isClicked = clickedWords.has(word.index);
    const isVerified = verifiedCorrect.has(word.index);

    // Palabra correcta verificada (en modo instant)
    if (isVerified && wordsDisappear) {
      return {
        opacity: 0.3,
        textDecoration: 'line-through',
        color: colorConfig.correctColor,
        cursor: 'not-allowed'
      };
    }

    if (showingFeedback) {
      if (word.isTarget) {
        // Es objetivo: mostrar como correcto si fue clickeado
        if (isClicked) {
          return {
            backgroundColor: `${colorConfig.correctColor}30`,
            color: colorConfig.correctColor,
            borderBottom: `2px solid ${colorConfig.correctColor}`,
            fontWeight: '600',
            cursor: 'default'
          };
        }
        // Objetivo no clickeado: mostrar con color de advertencia
        return {
          backgroundColor: `${colorConfig.targetColor}20`,
          borderBottom: `2px dashed ${colorConfig.targetColor}`,
          cursor: 'default'
        };
      } else {
        // No es objetivo: si fue clickeado, mostrar como error
        if (isClicked) {
          return {
            backgroundColor: `${colorConfig.incorrectColor}30`,
            color: colorConfig.incorrectColor,
            borderBottom: `2px solid ${colorConfig.incorrectColor}`,
            cursor: 'default'
          };
        }
        return { cursor: 'default' };
      }
    }

    // Antes de checking
    if (isClicked) {
      return {
        backgroundColor: `${colorConfig.selectedColor}30`,
        borderBottom: `2px solid ${colorConfig.selectedColor}`,
        fontWeight: '500',
        cursor: 'pointer'
      };
    }

    return {
      cursor: 'pointer',
      transition: 'all 0.2s'
    };
  };

  // Calcular estadísticas
  const targetIndices = useMemo(() => new Set(targets.map(t => t.index)), [targets]);
  const clickedTargets = Array.from(clickedWords).filter(idx => targetIndices.has(idx));
  const clickedNonTargets = Array.from(clickedWords).filter(idx => !targetIndices.has(idx));
  const missedTargets = targets.filter(t => !clickedWords.has(t.index));

  const correctCount = clickedTargets.length;
  const incorrectCount = clickedNonTargets.length;
  const totalTargets = targets.length;
  const progress = totalTargets > 0 ? (correctCount / totalTargets) * 100 : 0;

  return (
    <div className={`word-highlight-renderer w-full ${className}`}>
      {/* Instrucción */}
      {instruction && (
        <div
          className="mb-4 p-3 rounded-lg"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {instruction}
          </p>
        </div>
      )}

      {/* Header con contador */}
      {showTargetCount && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye size={18} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Encuentra {totalTargets} {totalTargets === 1 ? 'palabra' : 'palabras'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {correctCount}/{totalTargets}
            </span>
            <div
              className="w-24 h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            >
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: colorConfig.correctColor
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Texto con palabras clickeables */}
      <div
        className="p-6 rounded-lg leading-relaxed"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          fontSize: '1.1rem',
          lineHeight: '1.8'
        }}
      >
        {words.map((word, idx) => {
          if (word.isLineBreak) {
            return <br key={idx} />;
          }

          if (word.index === -1) {
            // Espacio o separador
            return <span key={idx}>{word.text}</span>;
          }

          const style = getWordStyle(word);

          return (
            <span
              key={idx}
              onClick={() => handleWordClick(word.index, word.isTarget)}
              className="inline-block px-1 rounded transition-all"
              style={{
                ...style,
                userSelect: 'none'
              }}
            >
              {word.text}
            </span>
          );
        })}
      </div>

      {/* Feedback después de checking */}
      {showingFeedback && (
        <div className="mt-4 space-y-3">
          {/* Estadísticas */}
          <div className="flex items-center justify-around p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Check size={18} style={{ color: colorConfig.correctColor }} />
                <span className="text-2xl font-bold" style={{ color: colorConfig.correctColor }}>
                  {correctCount}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Correctas</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <X size={18} style={{ color: colorConfig.incorrectColor }} />
                <span className="text-2xl font-bold" style={{ color: colorConfig.incorrectColor }}>
                  {incorrectCount}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Incorrectas</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Eye size={18} style={{ color: colorConfig.targetColor }} />
                <span className="text-2xl font-bold" style={{ color: colorConfig.targetColor }}>
                  {missedTargets.length}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Omitidas</p>
            </div>
          </div>

          {/* Resultado */}
          <div className="flex justify-center">
            {correctCount === totalTargets && incorrectCount === 0 ? (
              <BaseBadge variant="success" size="lg" className="text-base px-4 py-2">
                <Trophy className="w-4 h-4 inline mr-1" />
                ¡Perfecto! {config.correctPoints * correctCount || correctCount * 10}pts
              </BaseBadge>
            ) : correctCount > 0 ? (
              <BaseBadge variant="warning" size="lg" className="text-base px-4 py-2">
                {Math.round(progress)}% correcto
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

export default WordHighlightRenderer;
