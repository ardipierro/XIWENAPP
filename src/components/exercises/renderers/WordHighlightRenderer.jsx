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
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Check, X, Eye, Trophy, RotateCcw } from 'lucide-react';
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
 * Parsear texto y extraer palabras con/sin asteriscos
 * Preserva saltos de línea para mostrar oraciones separadas
 * Basado en el componente original WordHighlightExercise
 */
function parseTextContent(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const parts = [];
  let lastIndex = 0;
  const regex = /\*([^*]+)\*/g;
  let match;

  /**
   * Procesa un fragmento de texto extrayendo palabras y saltos de línea
   */
  const processTextFragment = (fragment) => {
    if (!fragment) return;

    // Regex que captura palabras O saltos de línea como elementos separados
    const tokenRegex = /(\S+)|(\n)/g;
    let tokenMatch;
    while ((tokenMatch = tokenRegex.exec(fragment)) !== null) {
      if (tokenMatch[1]) {
        // Es una palabra
        parts.push({ text: tokenMatch[1], isTarget: false, isLineBreak: false });
      } else if (tokenMatch[2]) {
        // Es un salto de línea
        parts.push({ text: '\n', isTarget: false, isLineBreak: true });
      }
    }
  };

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      processTextFragment(beforeText);
    }
    parts.push({ text: match[1], isTarget: true, isLineBreak: false });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const afterText = text.slice(lastIndex);
    processTextFragment(afterText);
  }

  return parts;
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
  const parsedContent = useMemo(() => parseTextContent(text), [text]);

  // Contar palabras objetivo
  const targetWords = useMemo(() => {
    return parsedContent.filter(p => p && p.isTarget);
  }, [parsedContent]);

  const totalTargets = targetWords.length || 0;

  // Estado de palabras clickeadas (Set de claves "index-text")
  const [clickedWords, setClickedWords] = useState(new Set());

  // Sincronizar con context
  useEffect(() => {
    setAnswer(Array.from(clickedWords));
  }, [clickedWords, setAnswer]);

  // Contar aciertos
  const correctClicks = useMemo(() => {
    let count = 0;
    parsedContent.forEach((part, index) => {
      if (!part) return;
      const wordKey = `${index}-${part.text}`;
      if (part.isTarget && clickedWords.has(wordKey)) {
        count++;
      }
    });
    return count;
  }, [clickedWords, parsedContent]);

  /**
   * Handler de click en palabra
   */
  const handleWordClick = useCallback((word, isTarget, index) => {
    if (showingFeedback && !config.allowRetry) return;

    const wordKey = `${index}-${word}`;
    const isAlreadyClicked = clickedWords.has(wordKey);

    // Si ya está clickeada y allowDeselect está habilitado, deseleccionar
    if (isAlreadyClicked && allowDeselect) {
      setClickedWords(prev => {
        const newSet = new Set(prev);
        newSet.delete(wordKey);
        return newSet;
      });
      return;
    }

    // Marcar palabra como clickeada
    if (!isAlreadyClicked) {
      setClickedWords(prev => new Set([...prev, wordKey]));
    }
  }, [showingFeedback, config, allowDeselect, clickedWords]);

  /**
   * Obtener estilo de una palabra
   */
  const getWordStyle = (index, word, isTarget) => {
    const wordKey = `${index}-${word}`;
    const isClicked = clickedWords.has(wordKey);
    const shouldDisappear = wordsDisappear && isClicked && isTarget && showingFeedback;

    // Base styles
    const baseStyle = {
      cursor: showingFeedback ? 'default' : 'pointer',
      padding: '2px 6px',
      borderRadius: '4px',
      transition: 'all 0.3s ease',
      display: 'inline-block',
      margin: '2px',
    };

    // Palabra desaparece al acertar
    if (shouldDisappear && config.feedbackMode === FEEDBACK_MODES.INSTANT) {
      return {
        ...baseStyle,
        opacity: 0.3,
        textDecoration: 'line-through',
        pointerEvents: 'none'
      };
    }

    // Mostrar resultados al finalizar
    if (showingFeedback) {
      if (isClicked) {
        return {
          ...baseStyle,
          backgroundColor: isTarget ? `${colorConfig.correctColor}30` : `${colorConfig.incorrectColor}30`,
          color: isTarget ? colorConfig.correctColor : colorConfig.incorrectColor,
          fontWeight: 'bold',
          border: `2px solid ${isTarget ? colorConfig.correctColor : colorConfig.incorrectColor}`
        };
      } else if (isTarget) {
        // Mostrar palabras objetivo no encontradas
        return {
          ...baseStyle,
          backgroundColor: `${colorConfig.targetColor}20`,
          border: `2px dashed ${colorConfig.targetColor}`,
          textDecoration: 'underline'
        };
      }
    }

    // Palabra clickeada (antes de checking)
    if (isClicked) {
      return {
        ...baseStyle,
        backgroundColor: `${colorConfig.selectedColor}30`,
        borderBottom: `2px solid ${colorConfig.selectedColor}`,
        fontWeight: '500'
      };
    }

    // Palabra no clickeada
    return {
      ...baseStyle,
      backgroundColor: 'transparent'
    };
  };

  // Calcular estadísticas
  const clickedNonTargets = Array.from(clickedWords).filter((wordKey, idx) => {
    const index = parseInt(wordKey.split('-')[0]);
    const part = parsedContent[index];
    return part && !part.isTarget;
  }).length;

  const incorrectCount = clickedNonTargets;
  const missedTargets = totalTargets - correctClicks;
  const progress = totalTargets > 0 ? (correctClicks / totalTargets) * 100 : 0;

  /**
   * Reset
   */
  const handleReset = useCallback(() => {
    setClickedWords(new Set());
  }, []);

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
              {correctClicks}/{totalTargets}
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

            {!showingFeedback && clickedWords.size > 0 && (
              <BaseButton
                size="sm"
                variant="ghost"
                icon={RotateCcw}
                onClick={handleReset}
              >
                Reiniciar
              </BaseButton>
            )}
          </div>
        </div>
      )}

      {/* Texto con palabras clickeables */}
      <div
        className="p-6 rounded-lg leading-relaxed"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          fontSize: '1.1rem',
          lineHeight: '2.2'
        }}
      >
        {parsedContent.map((part, index) => {
          if (!part) return null;

          // Renderizar saltos de línea
          if (part.isLineBreak) {
            return <br key={index} />;
          }

          const style = getWordStyle(index, part.text, part.isTarget);

          return (
            <span
              key={index}
              onClick={() => handleWordClick(part.text, part.isTarget, index)}
              className="hover:opacity-80 select-none"
              style={style}
            >
              {part.text}{' '}
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
                  {correctClicks}
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
                  {missedTargets}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Omitidas</p>
            </div>
          </div>

          {/* Resultado */}
          <div className="flex justify-center">
            {correctClicks === totalTargets && incorrectCount === 0 ? (
              <BaseBadge variant="success" size="lg" className="text-base px-4 py-2">
                <Trophy className="w-4 h-4 inline mr-1" />
                ¡Perfecto! {config.correctPoints * correctClicks || correctClicks * 10}pts
              </BaseBadge>
            ) : correctClicks > 0 ? (
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
