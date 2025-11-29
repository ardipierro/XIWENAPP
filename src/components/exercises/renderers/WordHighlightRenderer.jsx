/**
 * @fileoverview WordHighlightRenderer - Renderizador COMPLETO de marcar palabras
 * @module components/exercises/renderers/WordHighlightRenderer
 *
 * Renderer completo con TODAS las features del componente original:
 * - Timer configurable con play/pause/stop
 * - Sistema de hints (4 tipos: range, glow, highlightLine, firstLetter)
 * - Sonidos configurables (feedback, timer, completion)
 * - Overtime mode con penalizaciones
 * - 3 modos de feedback (instant, noFeedback, exam)
 * - Estadísticas avanzadas
 * - DisplaySettings integration
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Lightbulb,
  Eye,
  AlertTriangle,
  Trophy,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  RotateCcw
} from 'lucide-react';
import { BaseButton } from '../../common';
import QuickDisplayFAB from '../../QuickDisplayFAB';
import { useExercise, FEEDBACK_MODES } from '../core/ExerciseContext';
import logger from '../../../utils/logger';
import {
  playCorrectSound,
  playIncorrectSound,
  playCompletionSound,
  playTimeUpSound,
  playPenaltySound,
  playHintSound,
  playTimerBeep,
  playTimerWarningBeep,
  playTimerUrgentBeep,
  initAudio
} from '../../../utils/gameSounds';

/**
 * Parsear texto y extraer palabras con/sin asteriscos
 * Preserva saltos de línea para mostrar oraciones separadas
 */
function parseTextContent(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const parts = [];
  let lastIndex = 0;
  const regex = /\*([^*]+)\*/g;
  let match;

  const processTextFragment = (fragment) => {
    if (!fragment) return;
    const tokenRegex = /(\S+)|(\n)/g;
    let tokenMatch;
    while ((tokenMatch = tokenRegex.exec(fragment)) !== null) {
      if (tokenMatch[1]) {
        parts.push({ text: tokenMatch[1], isTarget: false, isLineBreak: false });
      } else if (tokenMatch[2]) {
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
 * WordHighlightRenderer - Renderer COMPLETO con todas las features
 */
export function WordHighlightRenderer({
  text,
  config: externalConfig = {},
  displaySettings = null,
  isFullscreen = false,
  onDisplaySettingsChange,
  onToggleFullscreen,
  className = ''
}) {
  const {
    userAnswer,
    setAnswer,
    showingFeedback,
    config: contextConfig,
    submitAnswer
  } = useExercise();

  // Merge external config con context config
  const finalConfig = useMemo(() => {
    const defaultGameSettings = {
      feedbackMode: 'instant',
      showTotalCount: false,
      wordsDisappearOnCorrect: false,
      allowDeselect: true,
      sound: {
        enabled: true,
        feedbackSounds: true,
        timerSounds: true,
        completionSounds: true,
        timerConfig: {
          startBeepAt: 30,
          normalInterval: 5,
          warningAt: 10,
          warningInterval: 2,
          urgentAt: 5,
          urgentInterval: 1
        }
      },
      hints: {
        enabled: false,
        delaySeconds: 15,
        type: 'range',
        rangeWords: 10
      },
      timer: {
        enabled: false,
        seconds: 60,
        onTimeUp: 'showScore',
        overtime: {
          intervalSeconds: 10,
          penaltyType: 'fixed',
          penaltyValue: 10
        }
      }
    };

    const merged = {
      correctColor: '#10b981',
      incorrectColor: '#ef4444',
      correctPoints: 10,
      incorrectPoints: -5,
      showFeedback: true,
      showScore: true,
      ...contextConfig,
      ...externalConfig
    };

    merged.gameSettings = {
      ...defaultGameSettings,
      ...(externalConfig?.gameSettings || {})
    };

    // Deep merge sound
    if (externalConfig?.gameSettings?.sound) {
      merged.gameSettings.sound = {
        ...defaultGameSettings.sound,
        ...externalConfig.gameSettings.sound,
        timerConfig: {
          ...defaultGameSettings.sound.timerConfig,
          ...(externalConfig.gameSettings.sound.timerConfig || {})
        }
      };
    }

    // Deep merge hints
    if (externalConfig?.gameSettings?.hints) {
      merged.gameSettings.hints = {
        ...defaultGameSettings.hints,
        ...externalConfig.gameSettings.hints
      };
    }

    // Deep merge timer
    if (externalConfig?.gameSettings?.timer) {
      merged.gameSettings.timer = {
        ...defaultGameSettings.timer,
        ...externalConfig.gameSettings.timer,
        overtime: {
          ...defaultGameSettings.timer.overtime,
          ...(externalConfig.gameSettings.timer.overtime || {})
        }
      };
    }

    return merged;
  }, [contextConfig, externalConfig]);

  const { gameSettings } = finalConfig;
  const soundConfig = gameSettings.sound || {};

  // Estados
  const [clickedWords, setClickedWords] = useState(new Set());
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [liveDisplaySettings, setLiveDisplaySettings] = useState(displaySettings);
  const [hintedWords, setHintedWords] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isOvertime, setIsOvertime] = useState(false);
  const [overtimePenalties, setOvertimePenalties] = useState(0);
  const [timerWarning, setTimerWarning] = useState(false);
  const [timerState, setTimerState] = useState('stopped');
  const [soundMuted, setSoundMuted] = useState(false);

  // Refs
  const timerRef = useRef(null);
  const hintTimerRef = useRef(null);
  const overtimeIntervalRef = useRef(null);

  // Parsear texto
  const parsedContent = useMemo(() => parseTextContent(text), [text]);

  // Palabras objetivo
  const targetWords = useMemo(() => {
    return parsedContent.filter(p => p && p.isTarget);
  }, [parsedContent]);

  const totalTargets = targetWords.length || 0;

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

  // Palabras objetivo no encontradas (para hints)
  const unfoundTargetIndices = useMemo(() => {
    const indices = [];
    parsedContent.forEach((part, index) => {
      if (!part) return;
      const wordKey = `${index}-${part.text}`;
      if (part.isTarget && !clickedWords.has(wordKey)) {
        indices.push(index);
      }
    });
    return indices;
  }, [parsedContent, clickedWords]);

  // Helper para verificar si un tipo de sonido está habilitado
  const isSoundEnabled = useCallback((type) => {
    if (soundMuted) return false;
    if (!soundConfig.enabled) return false;
    switch (type) {
      case 'feedback': return soundConfig.feedbackSounds !== false;
      case 'timer': return soundConfig.timerSounds !== false;
      case 'completion': return soundConfig.completionSounds !== false;
      default: return true;
    }
  }, [soundMuted, soundConfig]);

  // Inicializar timer
  useEffect(() => {
    if (gameSettings.timer.enabled && !isFinished) {
      setTimeRemaining(gameSettings.timer.seconds);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (overtimeIntervalRef.current) clearInterval(overtimeIntervalRef.current);
    };
  }, [gameSettings.timer.enabled, gameSettings.timer.seconds]);

  // Timer countdown
  useEffect(() => {
    if (!gameSettings.timer.enabled || isFinished || timeRemaining === null || timerState !== 'running') {
      return;
    }

    const timerConfig = soundConfig.timerConfig || {};
    const {
      startBeepAt = 30,
      normalInterval = 5,
      warningAt = 10,
      warningInterval = 2,
      urgentAt = 5,
      urgentInterval = 1
    } = timerConfig;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimerState('stopped');
          handleTimeUp();
          if (isSoundEnabled('timer')) playTimeUpSound();
          return 0;
        }

        const newTime = prev - 1;

        if (newTime <= warningAt && !timerWarning) {
          setTimerWarning(true);
        }

        if (isSoundEnabled('timer') && newTime <= startBeepAt) {
          if (newTime <= urgentAt) {
            if (newTime % urgentInterval === 0) playTimerUrgentBeep();
          } else if (newTime <= warningAt) {
            if (newTime % warningInterval === 0) playTimerWarningBeep();
          } else {
            if (newTime % normalInterval === 0) playTimerBeep();
          }
        }

        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameSettings.timer.enabled, isFinished, timeRemaining, timerState, isSoundEnabled, soundConfig.timerConfig, timerWarning]);

  // Sistema de hints
  useEffect(() => {
    if (!gameSettings.hints.enabled || isFinished || unfoundTargetIndices.length === 0) {
      return;
    }

    hintTimerRef.current = setInterval(() => {
      if (unfoundTargetIndices.length > 0) {
        const nextUnfoundIndex = unfoundTargetIndices[0];
        if (nextUnfoundIndex !== undefined) {
          setHintedWords(prev => new Set([...prev, nextUnfoundIndex]));
          if (isSoundEnabled('feedback')) playHintSound();
        }
      }
    }, gameSettings.hints.delaySeconds * 1000);

    return () => {
      if (hintTimerRef.current) clearInterval(hintTimerRef.current);
    };
  }, [gameSettings.hints.enabled, gameSettings.hints.delaySeconds, isFinished, unfoundTargetIndices, isSoundEnabled]);

  // Funciones de control del timer
  const handleTimerStart = useCallback(() => {
    if (timerState === 'stopped' && timeRemaining === null) {
      setTimeRemaining(gameSettings.timer.seconds);
    }
    setTimerState('running');
    initAudio();
  }, [timerState, timeRemaining, gameSettings.timer.seconds]);

  const handleTimerPause = useCallback(() => {
    setTimerState('paused');
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handleTimerStop = useCallback(() => {
    setTimerState('stopped');
    setTimeRemaining(gameSettings.timer.seconds);
    setTimerWarning(false);
    setIsOvertime(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (overtimeIntervalRef.current) clearInterval(overtimeIntervalRef.current);
  }, [gameSettings.timer.seconds]);

  // Manejar fin de tiempo
  const handleTimeUp = useCallback(() => {
    const { onTimeUp, overtime } = gameSettings.timer;

    switch (onTimeUp) {
      case 'showScore':
        setIsFinished(true);
        setShowResults(true);
        break;

      case 'warnContinue':
        setTimerWarning(true);
        setFeedback({
          type: 'warning',
          message: '¡Tiempo agotado!',
          subMessage: 'Puedes continuar sin límite'
        });
        setTimeout(() => setFeedback(null), 3000);
        break;

      case 'blockEnd':
        setIsFinished(true);
        setShowResults(true);
        break;

      case 'overtime':
        setIsOvertime(true);
        overtimeIntervalRef.current = setInterval(() => {
          const penalty = calculateOvertimePenalty(overtime);
          setOvertimePenalties(prev => prev + penalty);
          setScore(prev => prev - penalty);
          if (isSoundEnabled('timer')) playPenaltySound();
          setFeedback({
            type: 'penalty',
            message: `Overtime: -${penalty} pts`,
            subMessage: 'Apúrate para no perder más puntos'
          });
          setTimeout(() => setFeedback(null), 2000);
        }, overtime.intervalSeconds * 1000);
        break;
    }
  }, [gameSettings.timer, isSoundEnabled]);

  const calculateOvertimePenalty = (overtime) => {
    switch (overtime.penaltyType) {
      case 'fixed':
        return overtime.penaltyValue;
      case 'oneWord':
        return finalConfig.correctPoints;
      case 'percentage':
        return Math.round(score * (overtime.penaltyValue / 100));
      default:
        return overtime.penaltyValue;
    }
  };

  // Manejar click en palabra
  const handleWordClick = (word, isTarget, index) => {
    if (isFinished) return;

    const wordKey = `${index}-${word}`;
    const isAlreadyClicked = clickedWords.has(wordKey);

    initAudio();

    if (isAlreadyClicked) {
      if (gameSettings.allowDeselect) {
        setClickedWords(prev => {
          const newSet = new Set(prev);
          newSet.delete(wordKey);
          return newSet;
        });

        if (gameSettings.feedbackMode === 'instant') {
          const points = isTarget ? finalConfig.correctPoints : finalConfig.incorrectPoints;
          setScore(prev => prev - points);
        }
      }
      return;
    }

    setClickedWords(prev => new Set([...prev, wordKey]));

    const isCorrect = isTarget;
    const points = isCorrect ? finalConfig.correctPoints : finalConfig.incorrectPoints;

    if (gameSettings.feedbackMode === 'instant' && isSoundEnabled('feedback')) {
      if (isCorrect) {
        playCorrectSound();
      } else {
        playIncorrectSound();
      }
    }

    if (gameSettings.feedbackMode === 'instant') {
      setScore(prev => prev + points);

      if (finalConfig.showFeedback) {
        setFeedback({
          type: isCorrect ? 'correct' : 'incorrect',
          message: isCorrect ? '¡Correcto!' : 'Incorrecto',
          points: points
        });
        setTimeout(() => setFeedback(null), 1000);
      }
    }

    if (hintedWords.has(index)) {
      setHintedWords(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  // Comprobar respuestas
  const handleCheck = () => {
    let finalScore = 0;
    let correct = 0;
    let incorrect = 0;

    parsedContent.forEach((part, index) => {
      if (!part) return;
      const wordKey = `${index}-${part.text}`;
      if (clickedWords.has(wordKey)) {
        if (part.isTarget) {
          finalScore += finalConfig.correctPoints;
          correct++;
        } else {
          finalScore += finalConfig.incorrectPoints;
          incorrect++;
        }
      }
    });

    setScore(finalScore - overtimePenalties);
    setIsFinished(true);
    setShowResults(true);

    if (isSoundEnabled('completion') && totalTargets > 0) {
      const percentage = Math.round((correct / totalTargets) * 100);
      playCompletionSound(percentage);
    }

    if (timerRef.current) clearInterval(timerRef.current);
    if (overtimeIntervalRef.current) clearInterval(overtimeIntervalRef.current);
    if (hintTimerRef.current) clearInterval(hintTimerRef.current);
  };

  // Verificar si palabra está en rango de hint
  const isInHintRange = (wordIndex) => {
    if (gameSettings.hints.type !== 'range') return false;
    const rangeSize = gameSettings.hints.rangeWords || 10;

    for (const hintedIndex of hintedWords) {
      if (Math.abs(wordIndex - hintedIndex) <= rangeSize) {
        return true;
      }
    }
    return false;
  };

  // Obtener estilo de palabra
  const getWordStyle = (index, word, isTarget) => {
    const wordKey = `${index}-${word}`;
    const isClicked = clickedWords.has(wordKey);
    const hasDirectHint = hintedWords.has(index);
    const isInRange = isInHintRange(index);
    const shouldDisappear = gameSettings.wordsDisappearOnCorrect && isClicked && isTarget;

    const baseStyle = {
      cursor: isFinished ? 'default' : 'pointer',
      padding: '2px 6px',
      borderRadius: '4px',
      transition: 'all 0.3s ease',
      display: 'inline-block',
      margin: '2px',
    };

    if (shouldDisappear && gameSettings.feedbackMode === 'instant') {
      return {
        ...baseStyle,
        opacity: 0,
        transform: 'scale(0.8)',
        pointerEvents: 'none'
      };
    }

    if (isFinished && showResults) {
      if (isClicked) {
        return {
          ...baseStyle,
          backgroundColor: isTarget ? finalConfig.correctColor + '30' : finalConfig.incorrectColor + '30',
          color: isTarget ? finalConfig.correctColor : finalConfig.incorrectColor,
          fontWeight: 'bold',
          border: `2px solid ${isTarget ? finalConfig.correctColor : finalConfig.incorrectColor}`
        };
      } else if (isTarget) {
        return {
          ...baseStyle,
          backgroundColor: '#fbbf2430',
          color: '#b45309',
          fontWeight: 'bold',
          border: '2px dashed #fbbf24',
          textDecoration: 'underline'
        };
      }
    }

    if (isInRange && !isClicked) {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        borderRadius: '2px'
      };
    }

    if (hasDirectHint && !isClicked) {
      const hintType = gameSettings.hints.type;

      if (hintType === 'glow') {
        return {
          ...baseStyle,
          animation: 'pulse-glow 1.5s ease-in-out infinite',
          boxShadow: '0 0 10px 3px rgba(251, 191, 36, 0.6)',
          backgroundColor: 'rgba(251, 191, 36, 0.2)'
        };
      } else if (hintType === 'highlightLine') {
        return {
          ...baseStyle,
          borderBottom: '3px solid #fbbf24',
          backgroundColor: 'rgba(251, 191, 36, 0.1)'
        };
      } else if (hintType === 'firstLetter') {
        return {
          ...baseStyle,
          backgroundColor: 'rgba(251, 191, 36, 0.1)'
        };
      }
    }

    if (isClicked && gameSettings.feedbackMode === 'instant') {
      return {
        ...baseStyle,
        backgroundColor: isTarget ? finalConfig.correctColor + '20' : finalConfig.incorrectColor + '20',
        color: isTarget ? finalConfig.correctColor : finalConfig.incorrectColor,
        fontWeight: 'bold'
      };
    }

    if (isClicked && gameSettings.feedbackMode !== 'instant') {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        border: '2px solid rgb(99, 102, 241)',
        fontWeight: 'bold'
      };
    }

    return {
      ...baseStyle,
      backgroundColor: 'transparent'
    };
  };

  // Renderizar palabra con hint
  const renderWord = (part, index) => {
    const hasHint = hintedWords.has(index);
    const isClicked = clickedWords.has(`${index}-${part.text}`);

    if (hasHint && !isClicked && gameSettings.hints.type === 'firstLetter') {
      return (
        <span>
          <span style={{ color: '#b45309', fontWeight: 'bold' }}>
            {part.text[0]}
          </span>
          <span style={{ opacity: 0.3 }}>
            {'_'.repeat(part.text.length - 1)}
          </span>
        </span>
      );
    }

    return part.text;
  };

  // Reset
  const handleReset = () => {
    setClickedWords(new Set());
    setScore(0);
    setFeedback(null);
    setIsFinished(false);
    setShowResults(false);
    setHintedWords(new Set());
    setIsOvertime(false);
    setOvertimePenalties(0);
    setTimerWarning(false);
    setTimerState('stopped');

    if (gameSettings.timer.enabled) {
      setTimeRemaining(gameSettings.timer.seconds);
    }

    if (timerRef.current) clearInterval(timerRef.current);
    if (overtimeIntervalRef.current) clearInterval(overtimeIntervalRef.current);
    if (hintTimerRef.current) clearInterval(hintTimerRef.current);
  };

  // Completar ejercicio
  const handleComplete = () => {
    if (gameSettings.feedbackMode !== 'instant' && !isFinished) {
      handleCheck();
      return;
    }

    if (!isFinished) {
      setIsFinished(true);
      setShowResults(true);

      if (isSoundEnabled('completion') && totalTargets > 0) {
        const percentage = Math.round((correctClicks / totalTargets) * 100);
        playCompletionSound(percentage);
      }

      if (timerRef.current) clearInterval(timerRef.current);
      if (overtimeIntervalRef.current) clearInterval(overtimeIntervalRef.current);
      if (hintTimerRef.current) clearInterval(hintTimerRef.current);
    }

    submitAnswer({
      score: score - overtimePenalties,
      totalClicks: clickedWords.size,
      correctClicks,
      totalTargets,
      isOvertime,
      overtimePenalties
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className={`word-highlight-renderer w-full ${className}`}>
        <style>{`
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 5px 2px rgba(251, 191, 36, 0.4); }
            50% { box-shadow: 0 0 15px 5px rgba(251, 191, 36, 0.8); }
          }
        `}</style>

        {/* Header con puntuación y timer */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Sound toggle */}
            <button
              onClick={() => setSoundMuted(!soundMuted)}
              className={`p-2 rounded-lg transition-colors ${
                !soundMuted
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
              }`}
              title={soundMuted ? 'Activar sonidos' : 'Silenciar sonidos'}
            >
              {soundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Timer */}
            {gameSettings.timer.enabled && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isOvertime ? 'bg-red-100 dark:bg-red-900/30' :
                timerWarning ? 'bg-amber-100 dark:bg-amber-900/30' :
                'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                {!isFinished && (
                  <button
                    onClick={timerState === 'running' ? handleTimerPause : handleTimerStart}
                    className={`p-1.5 rounded-md transition-colors ${
                      timerState === 'running'
                        ? 'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300'
                        : 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {timerState === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                )}

                <div className="flex items-center gap-1.5">
                  <Clock className={`w-5 h-5 ${
                    isOvertime ? 'text-red-500' :
                    timerWarning ? 'text-amber-500 animate-pulse' :
                    'text-blue-500'
                  }`} />
                  <span className={`font-mono font-bold ${
                    isOvertime ? 'text-red-600 dark:text-red-400' :
                    timerWarning ? 'text-amber-600 dark:text-amber-400' :
                    'text-blue-600 dark:text-blue-400'
                  }`}>
                    {isOvertime ? 'OVERTIME' : formatTime(timeRemaining ?? gameSettings.timer.seconds)}
                  </span>
                </div>

                {!isFinished && timerState !== 'stopped' && (
                  <button
                    onClick={handleTimerStop}
                    className="p-1.5 rounded-md bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Contador */}
            {gameSettings.showTotalCount && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Eye className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {correctClicks}/{totalTargets}
                </span>
              </div>
            )}

            {/* Puntuación */}
            {finalConfig.showScore && gameSettings.feedbackMode === 'instant' && (
              <div className="text-right">
                <div className="text-2xl font-bold" style={{
                  color: score >= 0 ? finalConfig.correctColor : finalConfig.incorrectColor
                }}>
                  {score}
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  puntos
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modo indicator */}
        {gameSettings.feedbackMode !== 'instant' && !isFinished && (
          <div className="mb-4 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">
                {gameSettings.feedbackMode === 'noFeedback'
                  ? 'Modo sin feedback: Marca todas las palabras y presiona "Comprobar"'
                  : 'Modo examen: El resultado se mostrará al finalizar'}
              </span>
            </div>
          </div>
        )}

        {/* Feedback flotante */}
        {feedback && (
          <div
            className="fixed top-20 right-6 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50"
            style={{
              backgroundColor: feedback.type === 'correct' ? finalConfig.correctColor :
                             feedback.type === 'incorrect' ? finalConfig.incorrectColor :
                             feedback.type === 'warning' ? '#f59e0b' : '#ef4444',
              color: 'white'
            }}
          >
            {feedback.type === 'correct' && <CheckCircle size={20} />}
            {feedback.type === 'incorrect' && <XCircle size={20} />}
            {feedback.type === 'warning' && <AlertTriangle size={20} />}
            {feedback.type === 'penalty' && <Clock size={20} />}
            <div>
              <div className="font-semibold">{feedback.message}</div>
              {feedback.points && <div className="text-sm">{feedback.points > 0 ? '+' : ''}{feedback.points} puntos</div>}
              {feedback.subMessage && <div className="text-sm">{feedback.subMessage}</div>}
            </div>
          </div>
        )}

        {/* Resultados */}
        {showResults && (
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
                  Has encontrado {correctClicks} de {totalTargets} palabras
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 rounded-lg bg-white dark:bg-zinc-800">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{score}</div>
                <div className="text-sm text-zinc-500">Puntuación</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-white dark:bg-zinc-800">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round((correctClicks / totalTargets) * 100)}%
                </div>
                <div className="text-sm text-zinc-500">Precisión</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-white dark:bg-zinc-800">
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{clickedWords.size}</div>
                <div className="text-sm text-zinc-500">Marcadas</div>
              </div>
            </div>
          </div>
        )}

        {/* Texto del ejercicio */}
        <div
          className="text-lg leading-relaxed mb-6 p-4 rounded-lg"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            lineHeight: '2.2'
          }}
        >
          {parsedContent.map((part, index) => {
            if (!part) return null;
            if (part.isLineBreak) return <br key={index} />;

            return (
              <span
                key={index}
                onClick={() => handleWordClick(part.text, part.isTarget, index)}
                style={getWordStyle(index, part.text, part.isTarget)}
                className="hover:opacity-80 select-none"
              >
                {renderWord(part, index)}{' '}
              </span>
            );
          })}
        </div>

        {/* Leyenda de hints */}
        {gameSettings.hints.enabled && hintedWords.size > 0 && !isFinished && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <Lightbulb className="w-5 h-5" />
              <span className="text-sm">
                {gameSettings.hints.type === 'range' && `Busca en la zona resaltada`}
                {gameSettings.hints.type === 'glow' && 'Las palabras que brillan son pistas'}
                {gameSettings.hints.type === 'highlightLine' && 'Las palabras subrayadas son pistas'}
                {gameSettings.hints.type === 'firstLetter' && 'Se muestra la primera letra como pista'}
              </span>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2 mt-4">
          {!isFinished && gameSettings.feedbackMode !== 'instant' && (
            <BaseButton onClick={handleCheck} variant="primary">
              Comprobar
            </BaseButton>
          )}
          {!isFinished && (
            <BaseButton onClick={handleReset} variant="ghost" icon={RotateCcw}>
              Reiniciar
            </BaseButton>
          )}
          {isFinished && (
            <BaseButton onClick={handleComplete} variant="primary">
              Finalizar
            </BaseButton>
          )}
        </div>
      </div>

      {/* QuickDisplayFAB */}
      {onDisplaySettingsChange && (
        <QuickDisplayFAB
          initialSettings={displaySettings}
          onSettingsChange={onDisplaySettingsChange}
          isFullscreen={isFullscreen}
          onToggleFullscreen={onToggleFullscreen}
        />
      )}
    </>
  );
}

export default WordHighlightRenderer;
