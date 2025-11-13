/**
 * @fileoverview Ejercicio de comprensión auditiva con audio de español rioplatense
 * @module components/designlab/exercises/AudioListeningExercise
 */

import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Pause, Play, RotateCcw, Check, X, Star, HelpCircle } from 'lucide-react';
import { BaseButton, BaseBadge, BaseCard } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';
import { useExerciseBuilderConfig } from '../../../hooks/useExerciseBuilderConfig';
import logger from '../../../utils/logger';

/**
 * Ejercicio de comprensión auditiva con audio de español rioplatense
 * @param {Object} props
 * @param {string} props.title - Título del ejercicio
 * @param {string} props.audioUrl - URL del audio (español rioplatense)
 * @param {string} props.transcript - Transcripción del audio
 * @param {Array<Object>} props.questions - Preguntas de comprensión [{question, options, correctAnswer}]
 * @param {string} props.explanation - Explicación cultural/lingüística
 * @param {string} props.cefrLevel - Nivel CEFR
 * @param {boolean} props.showTranscript - Mostrar transcripción inicialmente
 * @param {Function} props.onComplete - Callback al completar
 */
export function AudioListeningExercise({
  title = 'Comprensión Auditiva',
  audioUrl,
  transcript = '',
  questions = [],
  explanation = '',
  cefrLevel = 'B1',
  showTranscript: initialShowTranscript = false,
  onComplete
}) {
  const { config } = useExerciseBuilderConfig();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showTranscript, setShowTranscript] = useState(initialShowTranscript);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  // Calcular respuestas correctas
  const correctAnswers = questions.reduce((acc, q, i) => {
    acc[i] = q.correctAnswer;
    return acc;
  }, {});

  const {
    isCorrect,
    showFeedback,
    checkAnswer,
    resetExercise,
    score,
    stars,
    attempts
  } = useExerciseState({
    exerciseType: 'audio-listening',
    correctAnswer: correctAnswers,
    validateFn: (userAnswers, correct) => {
      return JSON.stringify(userAnswers) === JSON.stringify(correct);
    },
    maxPoints: 100
  });

  // Audio controls
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = () => {
    const speeds = [0.75, 1, 1.25, 1.5];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const percent = e.target.value;
    audio.currentTime = (percent / 100) * duration;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionIndex, answer) => {
    setAnswers({ ...answers, [questionIndex]: answer });
  };

  const handleSubmit = () => {
    const allAnswered = questions.every((_, i) => answers[i] !== undefined);
    if (!allAnswered) return;

    const result = checkAnswer();
    setShowResults(true);
    logger.info('Audio Listening Exercise completed:', result);

    if (onComplete) {
      onComplete({
        ...result,
        exerciseType: 'audio-listening',
        answers,
        correctAnswers,
        audioUrl
      });
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setShowResults(false);
    setShowTranscript(initialShowTranscript);
    resetExercise();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const correctCount = Object.keys(answers).filter((i) => answers[i] === correctAnswers[i]).length;

  return (
    <BaseCard
      title={title}
      badges={[
        <BaseBadge key="level" variant="info" size="sm">
          {cefrLevel}
        </BaseBadge>,
        <BaseBadge key="type" variant="default" size="sm">
          Comprensión Auditiva
        </BaseBadge>,
        <BaseBadge key="accent" variant="primary" size="sm">
          🇦🇷 Español Rioplatense
        </BaseBadge>
      ]}
      className="w-full max-w-4xl mx-auto"
      style={{
        backgroundColor: config.customColors?.exerciseBackground,
        color: config.customColors?.textColor
      }}
    >
      <div className="space-y-6">
        {/* Audio Player */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
          <audio ref={audioRef} src={audioUrl} preload="metadata" />

          {/* Waveform visualization (simplified) */}
          <div className="mb-4">
            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                style={{ width: `${progress}%` }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BaseButton
                variant="primary"
                size="lg"
                icon={isPlaying ? Pause : Play}
                onClick={togglePlay}
                disabled={!audioUrl}
              >
                {isPlaying ? 'Pausar' : 'Reproducir'}
              </BaseButton>

              <BaseButton
                variant="outline"
                size="sm"
                onClick={handleSpeedChange}
              >
                {playbackSpeed}x
              </BaseButton>

              <div className="text-sm font-mono text-gray-600 dark:text-gray-400">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <BaseButton
              variant="ghost"
              size="sm"
              icon={showTranscript ? VolumeX : Volume2}
              onClick={() => setShowTranscript(!showTranscript)}
            >
              {showTranscript ? 'Ocultar' : 'Ver'} Transcripción
            </BaseButton>
          </div>
        </div>

        {/* Transcripción */}
        {showTranscript && transcript && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <Volume2 size={18} className="dark:text-amber-400 flex-shrink-0 mt-1" style={{ color: 'var(--color-warning)' }} strokeWidth={2} />
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Transcripción
              </h4>
            </div>
            <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed italic">
              "{transcript}"
            </p>
          </div>
        )}

        {/* Questions */}
        {!showResults && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Preguntas de Comprensión
            </h3>

            {questions.map((question, qIndex) => (
              <div key={qIndex} className="space-y-3">
                <p className="font-medium text-gray-900 dark:text-white">
                  {qIndex + 1}. {question.question}
                </p>

                <div className="space-y-2">
                  {question.options.map((option, oIndex) => {
                    const isSelected = answers[qIndex] === option.value;

                    return (
                      <button
                        key={option.value}
                        onClick={() => handleAnswerSelect(qIndex, option.value)}
                        className={`
                          w-full p-3 rounded-lg border-2 text-left transition-all
                          ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`
                              w-5 h-5 rounded-full border-2 flex-shrink-0
                              ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'}
                            `}
                          >
                            {isSelected && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                          <span className="text-base text-gray-900 dark:text-white">
                            {option.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {showResults && (
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
            <div className="flex items-start gap-3 mb-4">
              {isCorrect ? (
                <Check size={24} className="flex-shrink-0" style={{ color: 'var(--color-success)' }} strokeWidth={2} />
              ) : (
                <HelpCircle size={24} className="text-orange-500 flex-shrink-0" strokeWidth={2} />
              )}
              <div className="flex-1">
                <p className="font-semibold text-base text-gray-900 dark:text-white mb-1">
                  {isCorrect
                    ? '¡Excelente comprensión!'
                    : `${correctCount} de ${questions.length} respuestas correctas`}
                </p>
                {explanation && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    {explanation}
                  </p>
                )}
              </div>
            </div>

            {/* Review de respuestas */}
            <div className="space-y-3 mb-4">
              {questions.map((q, i) => {
                const userAnswer = answers[i];
                const correct = userAnswer === q.correctAnswer;
                const correctOption = q.options.find((o) => o.value === q.correctAnswer);

                return (
                  <div
                    key={i}
                    className={`
                      p-3 rounded-lg border
                      ${correct ? 'border-green-300 bg-green-50 dark:bg-green-900/10' : 'border-red-300 bg-red-50 dark:bg-red-900/10'}
                    `}
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {i + 1}. {q.question}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      {correct ? (
                        <Check size={16} className="" style={{ color: 'var(--color-success)' }} strokeWidth={2} />
                      ) : (
                        <X size={16} className="" style={{ color: 'var(--color-error)' }} strokeWidth={2} />
                      )}
                      <span className="text-gray-700 dark:text-gray-300">
                        {correct ? 'Correcto' : `Correcto: ${correctOption?.label}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Score */}
            {isCorrect && (
              <div className="flex items-center gap-4 pt-3 border-t border-green-200 dark:border-green-800">
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
          {!showResults ? (
            <BaseButton
              variant="primary"
              onClick={handleSubmit}
              disabled={Object.keys(answers).length !== questions.length}
              fullWidth
            >
              Verificar Respuestas
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

export default AudioListeningExercise;
