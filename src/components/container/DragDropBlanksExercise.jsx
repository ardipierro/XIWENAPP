/**
 * @fileoverview Drag and Drop Blanks Exercise
 * @module components/container/DragDropBlanksExercise
 *
 * Las palabras entre asteriscos se retiran del texto y se muestran
 * como elementos arrastrables. El alumno debe arrastrarlas a su posición correcta.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Trophy,
  RotateCcw,
  GripVertical
} from 'lucide-react';
import { BaseButton } from '../common';
import QuickDisplayFAB from '../QuickDisplayFAB';
import { getDisplayClasses, getDisplayStyles, mergeDisplaySettings } from '../../constants/displaySettings';
import {
  playCorrectSound,
  playIncorrectSound,
  playCompletionSound,
  initAudio
} from '../../utils/gameSounds';
import logger from '../../utils/logger';

/**
 * Componente de ejercicio Drag and Drop
 */
function DragDropBlanksExercise({ text, config, onComplete, onActionsChange, displaySettings = null, isFullscreen = false, onDisplaySettingsChange, onToggleFullscreen }) {
  const [placedWords, setPlacedWords] = useState({});
  const [draggedWord, setDraggedWord] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Display settings: combina los guardados con los ajustes temporales
  const [liveDisplaySettings, setLiveDisplaySettings] = useState(displaySettings);

  // Sincronizar displaySettings cuando cambie externamente
  useEffect(() => {
    if (displaySettings) {
      setLiveDisplaySettings(displaySettings);
    }
  }, [displaySettings]);

  // Calcular estilos de visualización
  const mergedDisplaySettings = useMemo(
    () => mergeDisplaySettings(liveDisplaySettings, 'exercise'),
    [liveDisplaySettings]
  );
  const displayClasses = useMemo(() => getDisplayClasses(mergedDisplaySettings), [mergedDisplaySettings]);
  const displayStyles = useMemo(() => getDisplayStyles(mergedDisplaySettings), [mergedDisplaySettings]);

  // Handler para cambios de display settings desde el FAB
  const handleDisplaySettingsChange = useCallback((newSettings) => {
    setLiveDisplaySettings(newSettings);
    onDisplaySettingsChange?.(newSettings);
    logger.debug('Display settings actualizados desde FAB', 'DragDropBlanksExercise');
  }, [onDisplaySettingsChange]);

  // Configuración por defecto
  const defaultConfig = {
    correctColor: '#10b981',
    incorrectColor: '#ef4444',
    correctPoints: 10,
    incorrectPoints: -5,
    showFeedback: true,
    instantFeedback: true, // Si false, solo muestra resultado al comprobar
    shuffleWords: true
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
   * Palabras disponibles para arrastrar (mezcladas)
   */
  const availableWords = useMemo(() => {
    const words = parsedContent.blanks.map(b => ({
      id: b.index,
      word: b.word
    }));

    if (finalConfig.shuffleWords) {
      // Fisher-Yates shuffle
      for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
      }
    }

    return words;
  }, [parsedContent.blanks, finalConfig.shuffleWords]);

  /**
   * Palabras que aún no han sido colocadas
   */
  const unplacedWords = useMemo(() => {
    const placedWordsList = Object.values(placedWords);
    return availableWords.filter(w => !placedWordsList.includes(w.word));
  }, [availableWords, placedWords]);

  /**
   * Manejar inicio de drag
   */
  const handleDragStart = (word) => {
    initAudio();
    setDraggedWord(word);
  };

  /**
   * Manejar drop en un blank
   */
  const handleDrop = (blankIndex, correctWord) => {
    if (!draggedWord || isFinished) return;

    const isCorrect = draggedWord === correctWord;

    // Colocar palabra
    setPlacedWords(prev => ({
      ...prev,
      [blankIndex]: draggedWord
    }));

    // Feedback instantáneo si está habilitado
    if (finalConfig.instantFeedback) {
      if (isCorrect) {
        playCorrectSound();
        setFeedback({
          type: 'correct',
          message: '¡Correcto!'
        });
      } else {
        playIncorrectSound();
        setFeedback({
          type: 'incorrect',
          message: 'Intenta de nuevo'
        });
      }
      setTimeout(() => setFeedback(null), 1000);
    }

    setDraggedWord(null);
    logger.info(`Word dropped: ${draggedWord} at blank ${blankIndex}, correct: ${isCorrect}`, 'DragDropBlanksExercise');
  };

  /**
   * Permitir quitar palabra de un blank (click para devolver)
   */
  const handleRemoveWord = (blankIndex) => {
    if (isFinished) return;

    setPlacedWords(prev => {
      const newPlaced = { ...prev };
      delete newPlaced[blankIndex];
      return newPlaced;
    });
  };

  /**
   * Calcular resultado final
   */
  const calculateResults = useCallback(() => {
    let correct = 0;
    let incorrect = 0;

    parsedContent.blanks.forEach(blank => {
      const placedWord = placedWords[blank.index];
      if (placedWord === blank.word) {
        correct++;
      } else if (placedWord) {
        incorrect++;
      }
    });

    const score = (correct * finalConfig.correctPoints) + (incorrect * finalConfig.incorrectPoints);
    const percentage = Math.round((correct / parsedContent.blanks.length) * 100);

    return { correct, incorrect, score, percentage, total: parsedContent.blanks.length };
  }, [placedWords, parsedContent.blanks, finalConfig]);

  /**
   * Comprobar respuestas
   */
  const handleCheck = () => {
    const results = calculateResults();

    setIsFinished(true);
    setShowResults(true);

    // Sonido de finalización
    playCompletionSound(results.percentage);

    if (onComplete) {
      onComplete(results);
    }

    logger.info('Exercise completed:', results, 'DragDropBlanksExercise');
  };

  /**
   * Reiniciar ejercicio
   */
  const handleReset = () => {
    setPlacedWords({});
    setDraggedWord(null);
    setFeedback(null);
    setIsFinished(false);
    setShowResults(false);
  };

  /**
   * Obtener estilo de un blank
   */
  const getBlankStyle = (blankIndex, correctWord) => {
    const placedWord = placedWords[blankIndex];
    const hasWord = !!placedWord;
    const isCorrect = placedWord === correctWord;

    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '80px',
      padding: '4px 12px',
      margin: '0 4px',
      borderRadius: '6px',
      border: '2px dashed',
      transition: 'all 0.2s ease',
      cursor: isFinished ? 'default' : 'pointer'
    };

    if (showResults && hasWord) {
      return {
        ...baseStyle,
        backgroundColor: isCorrect ? `${finalConfig.correctColor}20` : `${finalConfig.incorrectColor}20`,
        borderColor: isCorrect ? finalConfig.correctColor : finalConfig.incorrectColor,
        borderStyle: 'solid'
      };
    }

    if (hasWord) {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: 'rgb(99, 102, 241)',
        borderStyle: 'solid'
      };
    }

    return {
      ...baseStyle,
      backgroundColor: draggedWord ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
      borderColor: draggedWord ? 'rgb(99, 102, 241)' : 'var(--color-border)'
    };
  };

  const results = showResults ? calculateResults() : null;

  /**
   * Notificar acciones al padre (para footer del modal)
   */
  useEffect(() => {
    if (onActionsChange) {
      onActionsChange({
        handleReset,
        handleCheck,
        isFinished,
        placedCount: Object.keys(placedWords).length,
        totalBlanks: parsedContent.blanks.length,
        results
      });
    }
  }, [isFinished, placedWords, onActionsChange]);

  return (
    <>
      <div className={`w-full ${displayClasses.container}`} style={displayStyles}>
        {/* Header */}
      <div className="flex items-center justify-end mb-6">
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {Object.keys(placedWords).length} / {parsedContent.blanks.length} colocadas
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
        </div>
      )}

      {/* Texto con blanks */}
      <div
        className="text-lg leading-relaxed mb-6 p-4 rounded-lg"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          lineHeight: '2.5',
          whiteSpace: 'pre-line'
        }}
      >
        {parsedContent.parts.map((part, index) => {
          if (part.type === 'text') {
            return <span key={index}>{part.content}</span>;
          }

          const placedWord = placedWords[part.index];

          return (
            <span
              key={index}
              style={getBlankStyle(part.index, part.correctWord)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(part.index, part.correctWord)}
              onClick={() => placedWord && handleRemoveWord(part.index)}
              title={placedWord ? 'Clic para quitar' : 'Arrastra una palabra aquí'}
            >
              {placedWord || '___'}
              {showResults && placedWord !== part.correctWord && (
                <span className="ml-1 text-xs opacity-70">({part.correctWord})</span>
              )}
            </span>
          );
        })}
      </div>

      {/* Palabras para arrastrar */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          Palabras disponibles:
        </label>
        <div className="flex flex-wrap gap-2 p-4 rounded-lg min-h-[60px]" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          {unplacedWords.length === 0 ? (
            <span className="text-sm italic" style={{ color: 'var(--color-text-tertiary)' }}>
              Todas las palabras han sido colocadas
            </span>
          ) : (
            unplacedWords.map((item) => (
              <div
                key={item.id}
                draggable={!isFinished}
                onDragStart={() => handleDragStart(item.word)}
                onDragEnd={() => setDraggedWord(null)}
                className={`
                  flex items-center gap-1 px-3 py-2 rounded-lg font-medium
                  ${isFinished ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
                  bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300
                  hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors
                  ${draggedWord === item.word ? 'ring-2 ring-indigo-500 scale-105' : ''}
                `}
              >
                <GripVertical className="w-4 h-4 opacity-50" />
                {item.word}
              </div>
            ))
          )}
        </div>
      </div>
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

export default DragDropBlanksExercise;
