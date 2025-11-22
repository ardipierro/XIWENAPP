/**
 * @fileoverview Word Highlight Exercise - Wrapper interactivo para marcar palabras
 * @module components/container/WordHighlightExercise
 *
 * Soporta múltiples modos de juego:
 * - instant: Feedback inmediato al hacer clic
 * - noFeedback: Sin feedback hasta presionar "Comprobar"
 * - exam: Sin feedback, solo puntaje al final
 *
 * Características adicionales:
 * - Contador de palabras encontradas
 * - Palabras desaparecen al acertar
 * - Sistema de pistas automáticas
 * - Temporizador con sistema de overtime
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
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { BaseButton } from '../common';
import logger from '../../utils/logger';
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
} from '../../utils/gameSounds';

/**
 * Componente wrapper para ejercicios de marcar palabras
 * Parsea texto con asteriscos y permite clickear palabras
 */
function WordHighlightExercise({ text, config, onComplete }) {
  const [clickedWords, setClickedWords] = useState(new Set());
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Estados para hints
  const [hintedWords, setHintedWords] = useState(new Set());
  const [nextHintIndex, setNextHintIndex] = useState(0);

  // Estados para timer
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isOvertime, setIsOvertime] = useState(false);
  const [overtimePenalties, setOvertimePenalties] = useState(0);
  const [timerWarning, setTimerWarning] = useState(false);

  // Estado del timer: 'stopped' | 'running' | 'paused'
  const [timerState, setTimerState] = useState('stopped');

  // Estado para sonidos (toggle manual del usuario)
  const [soundMuted, setSoundMuted] = useState(false);

  // Estado para expandir/colapsar el ejercicio
  const [isExpanded, setIsExpanded] = useState(false);

  // Refs para intervals
  const timerRef = useRef(null);
  const hintTimerRef = useRef(null);
  const overtimeIntervalRef = useRef(null);

  // Configuración por defecto
  const defaultConfig = {
    correctColor: '#10b981', // green-500
    incorrectColor: '#ef4444', // red-500
    correctPoints: 10,
    incorrectPoints: -5,
    showFeedback: true,
    showScore: true,
    // Game settings por defecto
    gameSettings: {
      feedbackMode: 'instant', // 'instant' | 'noFeedback' | 'exam'
      showTotalCount: false,
      wordsDisappearOnCorrect: false,
      allowDeselect: true, // Permitir deseleccionar palabras al hacer clic
      // Sonidos
      sound: {
        enabled: true,
        feedbackSounds: true,
        timerSounds: true,
        completionSounds: true,
        timerConfig: {
          startBeepAt: 30,      // Comenzar beeps a 30s
          normalInterval: 5,     // Cada 5 segundos
          warningAt: 10,         // Warning a 10s
          warningInterval: 2,    // Cada 2 segundos
          urgentAt: 5,           // Urgente a 5s
          urgentInterval: 1      // Cada segundo
        }
      },
      // Pistas
      hints: {
        enabled: false,
        delaySeconds: 15,
        type: 'range', // 'range' | 'glow' | 'highlightLine' | 'firstLetter'
        rangeWords: 10  // Palabras antes y después del objetivo
      },
      timer: {
        enabled: false,
        seconds: 60,
        onTimeUp: 'showScore', // 'showScore' | 'warnContinue' | 'blockEnd' | 'overtime'
        overtime: {
          intervalSeconds: 10,
          penaltyType: 'fixed', // 'fixed' | 'oneWord' | 'percentage'
          penaltyValue: 10
        }
      }
    }
  };

  const finalConfig = useMemo(() => {
    const merged = { ...defaultConfig, ...config };
    merged.gameSettings = {
      ...defaultConfig.gameSettings,
      ...(config?.gameSettings || {})
    };
    // Merge sound settings
    if (config?.gameSettings?.sound) {
      merged.gameSettings.sound = {
        ...defaultConfig.gameSettings.sound,
        ...config.gameSettings.sound
      };
      // Merge timerConfig dentro de sound
      if (config?.gameSettings?.sound?.timerConfig) {
        merged.gameSettings.sound.timerConfig = {
          ...defaultConfig.gameSettings.sound.timerConfig,
          ...config.gameSettings.sound.timerConfig
        };
      }
    }
    // Merge hints settings
    if (config?.gameSettings?.hints) {
      merged.gameSettings.hints = {
        ...defaultConfig.gameSettings.hints,
        ...config.gameSettings.hints
      };
    }
    // Merge timer settings
    if (config?.gameSettings?.timer) {
      merged.gameSettings.timer = {
        ...defaultConfig.gameSettings.timer,
        ...config.gameSettings.timer
      };
      if (config?.gameSettings?.timer?.overtime) {
        merged.gameSettings.timer.overtime = {
          ...defaultConfig.gameSettings.timer.overtime,
          ...config.gameSettings.timer.overtime
        };
      }
    }
    return merged;
  }, [config]);

  const { gameSettings } = finalConfig;

  // Extraer configuración de sonido
  const soundConfig = gameSettings.sound || {};

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

  /**
   * Parsear texto y extraer palabras con/sin asteriscos
   */
  const parsedContent = useMemo(() => {
    const parts = [];
    let lastIndex = 0;
    const regex = /\*([^*]+)\*/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        beforeText.split(/\s+/).forEach(word => {
          if (word.trim()) {
            parts.push({ text: word, isTarget: false });
          }
        });
      }
      parts.push({ text: match[1], isTarget: true });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      const afterText = text.slice(lastIndex);
      afterText.split(/\s+/).forEach(word => {
        if (word.trim()) {
          parts.push({ text: word, isTarget: false });
        }
      });
    }

    return parts;
  }, [text]);

  // Contar palabras objetivo
  const targetWords = useMemo(() => {
    return parsedContent.filter(p => p.isTarget);
  }, [parsedContent]);

  const totalTargets = targetWords.length;

  // Contar aciertos
  const correctClicks = useMemo(() => {
    let count = 0;
    parsedContent.forEach((part, index) => {
      const wordKey = `${index}-${part.text}`;
      if (part.isTarget && clickedWords.has(wordKey)) {
        count++;
      }
    });
    return count;
  }, [clickedWords, parsedContent]);

  // Índices de palabras objetivo no encontradas (para hints)
  const unfoundTargetIndices = useMemo(() => {
    const indices = [];
    parsedContent.forEach((part, index) => {
      const wordKey = `${index}-${part.text}`;
      if (part.isTarget && !clickedWords.has(wordKey)) {
        indices.push(index);
      }
    });
    return indices;
  }, [parsedContent, clickedWords]);

  /**
   * Inicializar timer
   */
  useEffect(() => {
    if (gameSettings.timer.enabled && !isFinished) {
      setTimeRemaining(gameSettings.timer.seconds);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (overtimeIntervalRef.current) clearInterval(overtimeIntervalRef.current);
    };
  }, [gameSettings.timer.enabled, gameSettings.timer.seconds]);

  /**
   * Timer countdown con configuración personalizada de sonidos
   * Solo corre cuando timerState === 'running'
   */
  useEffect(() => {
    // Solo ejecutar si el timer está habilitado, en estado 'running', y no ha terminado
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

        // Warning visual cuando quedan warningAt segundos
        if (newTime <= warningAt && !timerWarning) {
          setTimerWarning(true);
        }

        // Sonidos de countdown basados en configuración
        if (isSoundEnabled('timer') && newTime <= startBeepAt) {
          // Modo urgente
          if (newTime <= urgentAt) {
            if (newTime % urgentInterval === 0) {
              playTimerUrgentBeep();
            }
          }
          // Modo warning
          else if (newTime <= warningAt) {
            if (newTime % warningInterval === 0) {
              playTimerWarningBeep();
            }
          }
          // Modo normal
          else {
            if (newTime % normalInterval === 0) {
              playTimerBeep();
            }
          }
        }

        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameSettings.timer.enabled, isFinished, timeRemaining !== null, timerState, isSoundEnabled, soundConfig.timerConfig, timerWarning]);

  /**
   * Funciones de control del timer
   */
  const handleTimerStart = useCallback(() => {
    if (timerState === 'stopped' && timeRemaining === null) {
      // Primera vez: inicializar tiempo
      setTimeRemaining(gameSettings.timer.seconds);
    }
    setTimerState('running');
    initAudio(); // Inicializar audio en interacción del usuario
  }, [timerState, timeRemaining, gameSettings.timer.seconds]);

  const handleTimerPause = useCallback(() => {
    setTimerState('paused');
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const handleTimerStop = useCallback(() => {
    setTimerState('stopped');
    setTimeRemaining(gameSettings.timer.seconds);
    setTimerWarning(false);
    setIsOvertime(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (overtimeIntervalRef.current) {
      clearInterval(overtimeIntervalRef.current);
    }
  }, [gameSettings.timer.seconds]);

  /**
   * Sistema de hints
   */
  useEffect(() => {
    if (!gameSettings.hints.enabled || isFinished || unfoundTargetIndices.length === 0) {
      return;
    }

    hintTimerRef.current = setInterval(() => {
      if (unfoundTargetIndices.length > 0) {
        // Dar hint para la siguiente palabra no encontrada
        const nextUnfoundIndex = unfoundTargetIndices[0];
        if (nextUnfoundIndex !== undefined) {
          setHintedWords(prev => new Set([...prev, nextUnfoundIndex]));
          if (isSoundEnabled('feedback')) playHintSound();
          logger.info(`Hint shown for word at index ${nextUnfoundIndex}`, 'WordHighlightExercise');
        }
      }
    }, gameSettings.hints.delaySeconds * 1000);

    return () => {
      if (hintTimerRef.current) clearInterval(hintTimerRef.current);
    };
  }, [gameSettings.hints.enabled, gameSettings.hints.delaySeconds, isFinished, unfoundTargetIndices, isSoundEnabled]);

  /**
   * Manejar fin de tiempo
   */
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
        // Iniciar penalizaciones periódicas
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
  }, [gameSettings.timer]);

  /**
   * Calcular penalización de overtime
   */
  const calculateOvertimePenalty = (overtime) => {
    switch (overtime.penaltyType) {
      case 'fixed':
        return overtime.penaltyValue;
      case 'oneWord':
        return finalConfig.correctPoints; // Pierde el valor de una palabra
      case 'percentage':
        return Math.round(score * (overtime.penaltyValue / 100));
      default:
        return overtime.penaltyValue;
    }
  };

  /**
   * Manejar click en palabra
   */
  const handleWordClick = (word, isTarget, index) => {
    if (isFinished) return;

    const wordKey = `${index}-${word}`;
    const isAlreadyClicked = clickedWords.has(wordKey);

    // Inicializar audio en primer click (requerido por navegadores)
    initAudio();

    // Si ya está clickeada y allowDeselect está habilitado, deseleccionar
    if (isAlreadyClicked) {
      if (gameSettings.allowDeselect) {
        setClickedWords(prev => {
          const newSet = new Set(prev);
          newSet.delete(wordKey);
          return newSet;
        });

        // Revertir puntos si estamos en modo instant
        if (gameSettings.feedbackMode === 'instant') {
          const points = isTarget ? finalConfig.correctPoints : finalConfig.incorrectPoints;
          setScore(prev => prev - points);
        }

        logger.info(`Word deselected: ${word}`, 'WordHighlightExercise');
      }
      return;
    }

    // Marcar palabra como clickeada
    setClickedWords(prev => new Set([...prev, wordKey]));

    // Calcular puntos
    const isCorrect = isTarget;
    const points = isCorrect ? finalConfig.correctPoints : finalConfig.incorrectPoints;

    // Sonido de feedback (solo en modo instant)
    if (gameSettings.feedbackMode === 'instant' && isSoundEnabled('feedback')) {
      if (isCorrect) {
        playCorrectSound();
      } else {
        playIncorrectSound();
      }
    }

    // Comportamiento según modo de feedback
    if (gameSettings.feedbackMode === 'instant') {
      // Modo instant: feedback y puntos inmediatos
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
    // En modos noFeedback y exam, los puntos se calculan al final

    // Quitar de hints si estaba
    if (hintedWords.has(index)) {
      setHintedWords(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }

    logger.info(`Word clicked: ${word}, isTarget: ${isTarget}, mode: ${gameSettings.feedbackMode}`, 'WordHighlightExercise');
  };

  /**
   * Comprobar respuestas (modo noFeedback)
   */
  const handleCheck = () => {
    // Calcular puntaje final
    let finalScore = 0;
    let correct = 0;
    let incorrect = 0;

    parsedContent.forEach((part, index) => {
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

    // Sonido de finalización según porcentaje
    if (isSoundEnabled('completion') && totalTargets > 0) {
      const percentage = Math.round((correct / totalTargets) * 100);
      playCompletionSound(percentage);
    }

    // Limpiar timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (overtimeIntervalRef.current) clearInterval(overtimeIntervalRef.current);
    if (hintTimerRef.current) clearInterval(hintTimerRef.current);
  };

  /**
   * Obtener estilo de palabra según su estado
   */
  /**
   * Verificar si una palabra está en el rango de hint
   */
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

  const getWordStyle = (index, word, isTarget) => {
    const wordKey = `${index}-${word}`;
    const isClicked = clickedWords.has(wordKey);
    const hasDirectHint = hintedWords.has(index); // Pista directa en esta palabra
    const isInRange = isInHintRange(index);        // Está en el rango de una pista
    const shouldDisappear = gameSettings.wordsDisappearOnCorrect && isClicked && isTarget;

    // Base styles
    const baseStyle = {
      cursor: isFinished ? 'default' : 'pointer',
      padding: '2px 6px',
      borderRadius: '4px',
      transition: 'all 0.3s ease',
      display: 'inline-block',
      margin: '2px',
    };

    // Palabra desaparece al acertar
    if (shouldDisappear && gameSettings.feedbackMode === 'instant') {
      return {
        ...baseStyle,
        opacity: 0,
        transform: 'scale(0.8)',
        pointerEvents: 'none'
      };
    }

    // Mostrar resultados al finalizar (modo noFeedback/exam)
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
        // Mostrar palabras objetivo no encontradas
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

    // Hint styles - tipo rango (resalta zona de palabras)
    if (isInRange && !isClicked) {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        borderRadius: '2px'
      };
    }

    // Hint styles - otros tipos (palabra exacta)
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
        // Solo muestra la primera letra con estilo
        return {
          ...baseStyle,
          backgroundColor: 'rgba(251, 191, 36, 0.1)'
        };
      }
    }

    // Palabra clickeada con feedback instant
    if (isClicked && gameSettings.feedbackMode === 'instant') {
      return {
        ...baseStyle,
        backgroundColor: isTarget ? finalConfig.correctColor + '20' : finalConfig.incorrectColor + '20',
        color: isTarget ? finalConfig.correctColor : finalConfig.incorrectColor,
        fontWeight: 'bold'
      };
    }

    // Palabra clickeada sin feedback (marcada pero sin color)
    if (isClicked && gameSettings.feedbackMode !== 'instant') {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        border: '2px solid rgb(99, 102, 241)',
        fontWeight: 'bold'
      };
    }

    // Palabra no clickeada
    return {
      ...baseStyle,
      backgroundColor: 'transparent'
    };
  };

  /**
   * Renderizar palabra con hint de primera letra
   */
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

  /**
   * Resetear ejercicio
   */
  const handleReset = () => {
    setClickedWords(new Set());
    setScore(0);
    setFeedback(null);
    setIsFinished(false);
    setShowResults(false);
    setHintedWords(new Set());
    setNextHintIndex(0);
    setIsOvertime(false);
    setOvertimePenalties(0);
    setTimerWarning(false);
    setTimerState('stopped');

    if (gameSettings.timer.enabled) {
      setTimeRemaining(gameSettings.timer.seconds);
    }

    // Limpiar intervals
    if (timerRef.current) clearInterval(timerRef.current);
    if (overtimeIntervalRef.current) clearInterval(overtimeIntervalRef.current);
    if (hintTimerRef.current) clearInterval(hintTimerRef.current);
  };

  /**
   * Finalizar ejercicio
   */
  const handleComplete = () => {
    if (gameSettings.feedbackMode !== 'instant' && !isFinished) {
      handleCheck();
      return;
    }

    // Si es modo instant y no ha terminado, finalizar con resultados
    if (!isFinished) {
      setIsFinished(true);
      setShowResults(true);

      // Sonido de finalización
      if (isSoundEnabled('completion') && totalTargets > 0) {
        const percentage = Math.round((correctClicks / totalTargets) * 100);
        playCompletionSound(percentage);
      }

      // Limpiar timers
      if (timerRef.current) clearInterval(timerRef.current);
      if (overtimeIntervalRef.current) clearInterval(overtimeIntervalRef.current);
      if (hintTimerRef.current) clearInterval(hintTimerRef.current);
    }

    if (onComplete) {
      onComplete({
        score: score - overtimePenalties,
        totalClicks: clickedWords.size,
        correctClicks,
        totalTargets,
        isOvertime,
        overtimePenalties
      });
    }
  };

  /**
   * Formatear tiempo
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`p-6 rounded-lg transition-all duration-300 ${
        isExpanded
          ? 'fixed inset-4 z-50 overflow-auto'
          : 'w-full max-w-4xl mx-auto'
      }`}
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        boxShadow: isExpanded ? '0 0 0 9999px rgba(0,0,0,0.5)' : 'none'
      }}
    >
      {/* Estilos para animaciones */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 5px 2px rgba(251, 191, 36, 0.4); }
          50% { box-shadow: 0 0 15px 5px rgba(251, 191, 36, 0.8); }
        }
        @keyframes disappear {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.5); }
        }
      `}</style>

      {/* Header con puntuación y timer */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Marca los verbos
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Haz clic en las palabras que sean verbos
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Expand/Collapse toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg transition-colors bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
            title={isExpanded ? 'Salir de pantalla completa' : 'Expandir a pantalla completa'}
          >
            {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

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

          {/* Timer con controles */}
          {gameSettings.timer.enabled && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isOvertime ? 'bg-red-100 dark:bg-red-900/30' :
              timerWarning ? 'bg-amber-100 dark:bg-amber-900/30' :
              'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              {/* Botón Play/Pause */}
              {!isFinished && (
                <button
                  onClick={timerState === 'running' ? handleTimerPause : handleTimerStart}
                  className={`p-1.5 rounded-md transition-colors ${
                    timerState === 'running'
                      ? 'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-300'
                      : 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-300'
                  }`}
                  title={timerState === 'running' ? 'Pausar' : 'Iniciar'}
                >
                  {timerState === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              )}

              {/* Display del tiempo */}
              <div className="flex items-center gap-1.5">
                <Clock className={`w-5 h-5 ${
                  isOvertime ? 'text-red-500' :
                  timerWarning ? 'text-amber-500 animate-pulse' :
                  timerState === 'paused' ? 'text-amber-500' :
                  'text-blue-500'
                }`} />
                <span className={`font-mono font-bold min-w-[50px] text-center ${
                  isOvertime ? 'text-red-600 dark:text-red-400' :
                  timerWarning ? 'text-amber-600 dark:text-amber-400' :
                  timerState === 'paused' ? 'text-amber-600 dark:text-amber-400 animate-pulse' :
                  'text-blue-600 dark:text-blue-400'
                }`}>
                  {isOvertime ? 'OVERTIME' : formatTime(timeRemaining ?? gameSettings.timer.seconds)}
                </span>
              </div>

              {/* Indicador de estado */}
              {timerState === 'paused' && !isFinished && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  PAUSA
                </span>
              )}

              {/* Botón Stop/Reset */}
              {!isFinished && timerState !== 'stopped' && (
                <button
                  onClick={handleTimerStop}
                  className="p-1.5 rounded-md bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300 hover:bg-red-300 transition-colors"
                  title="Detener y reiniciar timer"
                >
                  <Square className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Contador de palabras */}
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

      {/* Indicador de modo */}
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
          className="fixed top-20 right-6 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in z-50"
          style={{
            backgroundColor: feedback.type === 'correct' ? finalConfig.correctColor :
                           feedback.type === 'incorrect' ? finalConfig.incorrectColor :
                           feedback.type === 'warning' ? '#f59e0b' :
                           '#ef4444',
            color: 'white'
          }}
        >
          {feedback.type === 'correct' && <CheckCircle size={20} />}
          {feedback.type === 'incorrect' && <XCircle size={20} />}
          {feedback.type === 'warning' && <AlertTriangle size={20} />}
          {feedback.type === 'penalty' && <Clock size={20} />}
          <div>
            <div className="font-semibold">{feedback.message}</div>
            {feedback.points && (
              <div className="text-sm opacity-90">
                {feedback.points > 0 ? '+' : ''}{feedback.points} puntos
              </div>
            )}
            {feedback.subMessage && (
              <div className="text-sm opacity-90">{feedback.subMessage}</div>
            )}
          </div>
        </div>
      )}

      {/* Pantalla de resultados */}
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
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {score}
              </div>
              <div className="text-sm text-zinc-500">Puntuación</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white dark:bg-zinc-800">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {Math.round((correctClicks / totalTargets) * 100)}%
              </div>
              <div className="text-sm text-zinc-500">Precisión</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white dark:bg-zinc-800">
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {clickedWords.size}
              </div>
              <div className="text-sm text-zinc-500">Marcadas</div>
            </div>
          </div>

          {overtimePenalties > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Clock className="w-5 h-5" />
                <span>Penalización por overtime: -{overtimePenalties} puntos</span>
              </div>
            </div>
          )}
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
        {parsedContent.map((part, index) => (
          <span
            key={index}
            onClick={() => handleWordClick(part.text, part.isTarget, index)}
            style={getWordStyle(index, part.text, part.isTarget)}
            className="hover:opacity-80 select-none"
          >
            {renderWord(part, index)}{' '}
          </span>
        ))}
      </div>

      {/* Leyenda de hints si están activos */}
      {gameSettings.hints.enabled && hintedWords.size > 0 && !isFinished && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <Lightbulb className="w-5 h-5" />
            <span className="text-sm">
              {gameSettings.hints.type === 'range' && `Busca en la zona resaltada (${gameSettings.hints.rangeWords || 10} palabras alrededor)`}
              {gameSettings.hints.type === 'glow' && 'Las palabras que brillan son pistas'}
              {gameSettings.hints.type === 'highlightLine' && 'Las palabras subrayadas son pistas'}
              {gameSettings.hints.type === 'firstLetter' && 'Se muestra la primera letra como pista'}
            </span>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-3 justify-end">
        <BaseButton
          variant="secondary"
          onClick={handleReset}
        >
          Reintentar
        </BaseButton>

        {gameSettings.feedbackMode !== 'instant' && !isFinished ? (
          <BaseButton
            variant="primary"
            onClick={handleCheck}
          >
            Comprobar
          </BaseButton>
        ) : (
          <BaseButton
            variant="primary"
            onClick={handleComplete}
          >
            {isFinished ? 'Continuar' : 'Finalizar'}
          </BaseButton>
        )}
      </div>

      {/* Estadísticas */}
      <div className="mt-4 pt-4 border-t flex gap-6 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
        <div>
          <span className="font-medium">Palabras marcadas:</span> {clickedWords.size}
        </div>
        <div>
          <span className="font-medium">Total de palabras:</span> {parsedContent.length}
        </div>
        {gameSettings.hints.enabled && (
          <div>
            <span className="font-medium">Pistas mostradas:</span> {hintedWords.size}
          </div>
        )}
      </div>
    </div>
  );
}

export default WordHighlightExercise;
