/**
 * @fileoverview Fill in the Blanks Exercise
 * @module components/container/FillInBlanksExercise
 *
 * Las palabras entre asteriscos se convierten en campos de texto
 * donde el alumno debe escribir la palabra correcta.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Trophy,
  RotateCcw,
  Lightbulb
} from 'lucide-react';
import { BaseButton } from '../common';
import QuickDisplayFAB from '../QuickDisplayFAB';
import { getDisplayClasses, getDisplayStyles, mergeDisplaySettings } from '../../constants/displaySettings';
import {
  playCorrectSound,
  playIncorrectSound,
  playCompletionSound,
  playHintSound,
  initAudio
} from '../../utils/gameSounds';
import logger from '../../utils/logger';

/**
 * Componente de ejercicio Fill in the Blanks
 */
function FillInBlanksExercise({ text, config, onComplete, onActionsChange, displaySettings = null, isFullscreen = false, onDisplaySettingsChange, onToggleFullscreen }) {
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [hints, setHints] = useState({});
  const inputRefs = useRef({});

  // Display settings
  const [liveDisplaySettings, setLiveDisplaySettings] = useState(displaySettings);

  useEffect(() => {
    if (displaySettings) {
      setLiveDisplaySettings(displaySettings);
    }
  }, [displaySettings]);

  const mergedDisplaySettings = useMemo(
    () => mergeDisplaySettings(liveDisplaySettings, 'exercise'),
    [liveDisplaySettings]
  );
  const displayClasses = useMemo(() => getDisplayClasses(mergedDisplaySettings), [mergedDisplaySettings]);
  const displayStyles = useMemo(() => getDisplayStyles(mergedDisplaySettings), [mergedDisplaySettings]);

  const handleDisplaySettingsChange = useCallback((newSettings) => {
    setLiveDisplaySettings(newSettings);
    onDisplaySettingsChange?.(newSettings);
    logger.debug('Display settings actualizados desde FAB', 'FillInBlanksExercise');
  }, [onDisplaySettingsChange]);

  // Configuración por defecto
  const defaultConfig = {
    correctColor: '#10b981',
    incorrectColor: '#ef4444',
    correctPoints: 10,
    incorrectPoints: -5,
    showFeedback: true,
    caseSensitive: false,       // Si true, distingue mayúsculas
    trimSpaces: true,           // Eliminar espacios al comparar
    allowHints: true,           // Permitir pistas
    hintPenalty: 5,             // Puntos que se pierden por pista
    autoAdvance: true           // Avanzar al siguiente campo automáticamente
  };

  const finalConfig = useMemo(() => ({
    ...defaultConfig,
    ...config
  }), [config]);

  /**
   * Parsear texto y extraer palabras objetivo (entre asteriscos)
   */
  const parsedContent = useMemo(() => {
    const parts = [];
    const blanks = [];
    let lastIndex = 0;
    const regex = /\*([^*]+)\*/g;
    let match;
    let blankIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      // Agregar texto antes del match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      // Agregar blank
      parts.push({
        type: 'blank',
        index: blankIndex,
        correctWord: match[1]
      });

      blanks.push({
        index: blankIndex,
        word: match[1]
      });

      blankIndex++;
      lastIndex = regex.lastIndex;
    }

    // Agregar texto restante
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return { parts, blanks };
  }, [text]);

  /**
   * Comparar respuesta con la correcta
   */
  const compareAnswer = (answer, correct) => {
    let a = answer || '';
    let c = correct || '';

    if (finalConfig.trimSpaces) {
      a = a.trim();
      c = c.trim();
    }

    if (!finalConfig.caseSensitive) {
      a = a.toLowerCase();
      c = c.toLowerCase();
    }

    return a === c;
  };

  /**
   * Manejar cambio en un input
   */
  const handleInputChange = (blankIndex, value) => {
    if (isFinished) return;

    initAudio();

    setAnswers(prev => ({
      ...prev,
      [blankIndex]: value
    }));
  };

  /**
   * Manejar Enter para avanzar al siguiente campo
   */
  const handleKeyDown = (e, blankIndex) => {
    if (e.key === 'Enter' && finalConfig.autoAdvance) {
      e.preventDefault();
      const nextIndex = blankIndex + 1;
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      } else {
        // Si es el último, comprobar
        if (Object.keys(answers).length === parsedContent.blanks.length) {
          handleCheck();
        }
      }
    }
  };

  /**
   * Mostrar pista para un blank
   */
  const handleShowHint = (blankIndex, correctWord) => {
    if (isFinished || hints[blankIndex]) return;

    playHintSound();

    // Mostrar primera letra
    setHints(prev => ({
      ...prev,
      [blankIndex]: correctWord[0] + '...'
    }));

    logger.info(`Hint shown for blank ${blankIndex}`, 'FillInBlanksExercise');
  };

  /**
   * Calcular resultado final
   */
  const calculateResults = useCallback(() => {
    let correct = 0;
    let incorrect = 0;
    const hintCount = Object.keys(hints).length;

    parsedContent.blanks.forEach(blank => {
      const answer = answers[blank.index];
      if (compareAnswer(answer, blank.word)) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const baseScore = (correct * finalConfig.correctPoints) + (incorrect * finalConfig.incorrectPoints);
    const hintPenalty = hintCount * finalConfig.hintPenalty;
    const score = baseScore - hintPenalty;
    const percentage = Math.round((correct / parsedContent.blanks.length) * 100);

    return { correct, incorrect, score, percentage, total: parsedContent.blanks.length, hintCount, hintPenalty };
  }, [answers, parsedContent.blanks, finalConfig, hints]);

  /**
   * Comprobar respuestas
   */
  const handleCheck = () => {
    const results = calculateResults();

    setIsFinished(true);
    setShowResults(true);

    // Sonido de finalización
    playCompletionSound(results.percentage);

    // Sonidos de feedback por cada respuesta
    parsedContent.blanks.forEach(blank => {
      const answer = answers[blank.index];
      if (compareAnswer(answer, blank.word)) {
        // Correcto
      } else {
        // Incorrecto
      }
    });

    if (onComplete) {
      onComplete(results);
    }

    logger.info('Exercise completed:', results, 'FillInBlanksExercise');
  };

  /**
   * Reiniciar ejercicio
   */
  const handleReset = () => {
    setAnswers({});
    setFeedback(null);
    setIsFinished(false);
    setShowResults(false);
    setHints({});

    // Focus en primer input
    setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 100);
  };

  /**
   * Obtener estilo de un input
   */
  const getInputStyle = (blankIndex, correctWord) => {
    const answer = answers[blankIndex];
    const isCorrect = compareAnswer(answer, correctWord);

    if (showResults) {
      return {
        backgroundColor: isCorrect ? `${finalConfig.correctColor}20` : `${finalConfig.incorrectColor}20`,
        borderColor: isCorrect ? finalConfig.correctColor : finalConfig.incorrectColor,
        color: isCorrect ? finalConfig.correctColor : finalConfig.incorrectColor
      };
    }

    return {
      backgroundColor: 'var(--color-bg-primary)',
      borderColor: 'var(--color-border)',
      color: 'var(--color-text-primary)'
    };
  };

  const results = showResults ? calculateResults() : null;
  const filledCount = Object.values(answers).filter(a => a && a.trim()).length;

  /**
   * Notificar acciones al padre (para footer del modal)
   */
  useEffect(() => {
    if (onActionsChange) {
      onActionsChange({
        handleReset,
        handleCheck,
        isFinished,
        filledCount,
        totalBlanks: parsedContent.blanks.length,
        results
      });
    }
  }, [isFinished, filledCount, onActionsChange]);

  return (
    <>
      <div className={`w-full ${displayClasses.container}`} style={displayStyles}>
        {/* Header */}
      <div className="flex items-center justify-end mb-6">
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {filledCount} / {parsedContent.blanks.length} completados
        </div>
      </div>

      {/* Feedback flotante */}
      {feedback && (
        <div
          className="fixed top-20 right-6 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50"
          style={{
            backgroundColor: feedback.type === 'correct' ? finalConfig.correctColor : finalConfig.incorrectColor,
            color: 'white'
          }}
        >
          {feedback.type === 'correct' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Resultados */}
      {showResults && results && (
        <div className="mb-6 p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                ¡Ejercicio completado!
              </h3>
              <p className="text-emerald-600 dark:text-emerald-400">
                Acertaste {results.correct} de {results.total} palabras
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 rounded-lg bg-white dark:bg-zinc-800">
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {results.score}
              </div>
              <div className="text-sm text-zinc-500">Puntuación</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white dark:bg-zinc-800">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {results.percentage}%
              </div>
              <div className="text-sm text-zinc-500">Precisión</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white dark:bg-zinc-800">
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {results.correct}
              </div>
              <div className="text-sm text-zinc-500">Correctas</div>
            </div>
          </div>

          {results.hintCount > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                <Lightbulb className="w-4 h-4" />
                <span>Usaste {results.hintCount} pista{results.hintCount !== 1 ? 's' : ''} (-{results.hintPenalty} pts)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Texto con inputs */}
      <div
        className="text-lg leading-relaxed mb-6 p-4 rounded-lg"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          lineHeight: '2.8',
          whiteSpace: 'pre-line'
        }}
      >
        {parsedContent.parts.map((part, index) => {
          if (part.type === 'text') {
            return <span key={index}>{part.content}</span>;
          }

          const answer = answers[part.index] || '';
          const hasHint = hints[part.index];
          const inputWidth = Math.max(80, part.correctWord.length * 12);

          return (
            <span key={index} className="inline-flex items-center mx-1">
              <input
                ref={el => inputRefs.current[part.index] = el}
                type="text"
                value={answer}
                onChange={(e) => handleInputChange(part.index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, part.index)}
                disabled={isFinished}
                placeholder={hasHint || '___'}
                style={{
                  width: inputWidth,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '2px solid',
                  textAlign: 'center',
                  fontWeight: '500',
                  ...getInputStyle(part.index, part.correctWord)
                }}
                className="focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {finalConfig.allowHints && !isFinished && !hasHint && (
                <button
                  onClick={() => handleShowHint(part.index, part.correctWord)}
                  className="ml-1 p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-500"
                  title="Ver pista (-5 pts)"
                >
                  <Lightbulb className="w-4 h-4" />
                </button>
              )}
              {showResults && !compareAnswer(answer, part.correctWord) && (
                <span className="ml-1 text-xs font-medium" style={{ color: finalConfig.correctColor }}>
                  ({part.correctWord})
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Instrucciones */}
      {!isFinished && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Presiona <kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">Enter</kbd> para avanzar al siguiente campo.
            {finalConfig.allowHints && (
              <> Usa el icono <Lightbulb className="w-3 h-3 inline" /> para ver pistas (penalización: -{finalConfig.hintPenalty} pts).</>
            )}
          </p>
        </div>
      )}
      </div>

      {/* QuickDisplayFAB para ajustes rápidos de visualización */}
      <QuickDisplayFAB
        initialSettings={displaySettings}
        onSettingsChange={handleDisplaySettingsChange}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
      />
    </>
  );
}

export default FillInBlanksExercise;
