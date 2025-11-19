/**
 * @fileoverview Ejercicio de pronunciación con audio generado por IA
 * @module components/designlab/exercises/AIAudioPronunciationExercise
 */

import { useState, useRef } from 'react';
import { Check, X, Star, Volume2, Mic, RotateCcw, Play, Pause, Repeat } from 'lucide-react';
import { BaseButton, BaseBadge, BaseCard } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';
import { useExerciseBuilderConfig } from '../../../hooks/useExerciseBuilderConfig';
import logger from '../../../utils/logger';

/**
 * Ejercicio de pronunciación con audio IA natural
 * @param {Object} props
 * @param {string} props.title - Título del ejercicio
 * @param {Array<Object>} props.phrases - Frases a pronunciar [{text, aiAudioUrl, phonetic, difficulty, tips}]
 * @param {string} props.voiceType - Tipo de voz IA (male, female, neutral)
 * @param {string} props.accent - Acento (spain, mexico, argentina, etc.)
 * @param {string} props.explanation - Explicación
 * @param {string} props.cefrLevel - Nivel CEFR
 * @param {Function} props.onComplete - Callback al completar
 */
export function AIAudioPronunciationExercise({
  title = 'Práctica de Pronunciación',
  phrases = [],
  voiceType = 'female',
  accent = 'spain',
  explanation = '',
  cefrLevel = 'A2',
  onComplete
}) {
  const { config } = useExerciseBuilderConfig();
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedPhrases, setCompletedPhrases] = useState(new Set());
  const [showPhonetic, setShowPhonetic] = useState(false);
  const audioRef = useRef(null);

  const {
    showFeedback,
    checkAnswer,
    resetExercise,
    score,
    stars
  } = useExerciseState({
    exerciseType: 'ai-audio-pronunciation',
    correctAnswer: phrases.length,
    validateFn: (completed, total) => completed === total,
    maxPoints: 100
  });

  const phrase = phrases[currentPhrase];

  const playAudio = () => {
    const audio = audioRef.current;
    if (!audio || !phrase?.aiAudioUrl) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.src = phrase.aiAudioUrl;
      audio.playbackRate = playbackSpeed;
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleSpeedChange = () => {
    const speeds = [0.5, 0.75, 1, 1.25];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const markAsComplete = () => {
    const newCompleted = new Set(completedPhrases);
    newCompleted.add(currentPhrase);
    setCompletedPhrases(newCompleted);

    if (newCompleted.size === phrases.length) {
      // Todas completadas
      setTimeout(() => {
        const result = checkAnswer();
        logger.info('AI Audio Pronunciation Exercise completed:', result);
        if (onComplete) {
          onComplete({
            ...result,
            exerciseType: 'ai-audio-pronunciation',
            phrasesCompleted: newCompleted.size,
            totalPhrases: phrases.length
          });
        }
      }, 500);
    }
  };

  const handleNext = () => {
    if (currentPhrase < phrases.length - 1) {
      setCurrentPhrase(currentPhrase + 1);
      setIsPlaying(false);
      setShowPhonetic(false);
    }
  };

  const handlePrevious = () => {
    if (currentPhrase > 0) {
      setCurrentPhrase(currentPhrase - 1);
      setIsPlaying(false);
      setShowPhonetic(false);
    }
  };

  const handleReset = () => {
    setCurrentPhrase(0);
    setCompletedPhrases(new Set());
    setIsPlaying(false);
    setShowPhonetic(false);
    setPlaybackSpeed(1);
    resetExercise();
  };

  const progressPercent = (completedPhrases.size / phrases.length) * 100;
  const isCurrentCompleted = completedPhrases.has(currentPhrase);

  return (
    <BaseCard
      title={title}
      badges={[
        <BaseBadge key="level" variant="info" size="sm">
          {cefrLevel}
        </BaseBadge>,
        <BaseBadge key="type" variant="default" size="sm">
          Pronunciación IA
        </BaseBadge>,
        <BaseBadge key="voice" variant="primary" size="sm">
          🎙️ {voiceType === 'female' ? 'Voz Femenina' : voiceType === 'male' ? 'Voz Masculina' : 'Voz Neutral'} ({accent})
        </BaseBadge>
      ]}
      className="w-full max-w-4xl mx-auto"
      style={{
        backgroundColor: config.customColors?.exerciseBackground
      }}
    >
      <audio ref={audioRef} onEnded={handleAudioEnded} />

      <div className="space-y-6">
        {/* Progreso general */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Progreso:
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {completedPhrases.size} / {phrases.length} frases
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Frase actual */}
        {phrase && (
          <div className="space-y-4">
            {/* Indicador de frase */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Frase {currentPhrase + 1} de {phrases.length}
              </div>
              {phrase.difficulty && (
                <BaseBadge
                  variant={
                    phrase.difficulty === 'easy'
                      ? 'success'
                      : phrase.difficulty === 'medium'
                      ? 'warning'
                      : 'danger'
                  }
                  size="sm"
                >
                  {phrase.difficulty === 'easy'
                    ? 'Fácil'
                    : phrase.difficulty === 'medium'
                    ? 'Media'
                    : 'Difícil'}
                </BaseBadge>
              )}
            </div>

            {/* Texto de la frase */}
            <div
              className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-center"
              style={{
                backgroundColor: config.customColors?.cardBackground
              }}
            >
              <p
                className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
                style={{
                  fontSize: `${(config.fontSize || 16) * 1.8}px`,
                  letterSpacing: config.customStyles?.letterSpacing || '0.02em'
                }}
              >
                {phrase.text}
              </p>

              {/* Fonética */}
              {phrase.phonetic && (
                <button
                  onClick={() => setShowPhonetic(!showPhonetic)}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                >
                  {showPhonetic ? 'Ocultar' : 'Ver'} fonética
                </button>
              )}
              {showPhonetic && phrase.phonetic && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-lg font-mono text-gray-700 dark:text-gray-300">
                    [{phrase.phonetic}]
                  </p>
                </div>
              )}
            </div>

            {/* Controles de audio */}
            <div className="flex items-center justify-center gap-4">
              <BaseButton
                variant="primary"
                size="lg"
                icon={isPlaying ? Pause : Play}
                onClick={playAudio}
              >
                {isPlaying ? 'Pausar' : 'Reproducir'}
              </BaseButton>

              <BaseButton
                variant="outline"
                icon={Repeat}
                onClick={playAudio}
                disabled={isPlaying}
              >
                Repetir
              </BaseButton>

              <BaseButton
                variant="ghost"
                onClick={handleSpeedChange}
                size="sm"
              >
                {playbackSpeed}x
              </BaseButton>
            </div>

            {/* Tips de pronunciación */}
            {phrase.tips && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Volume2 size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      Consejo de pronunciación:
                    </p>
                    <p className="text-sm text-amber-900 dark:text-amber-100">
                      {phrase.tips}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Marcar como completada */}
            {!isCurrentCompleted && (
              <div className="flex justify-center">
                <BaseButton
                  variant="success"
                  icon={Check}
                  onClick={markAsComplete}
                >
                  Marcar como Completada
                </BaseButton>
              </div>
            )}

            {isCurrentCompleted && (
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <Check size={20} className="text-green-500" strokeWidth={2} />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                    ¡Frase completada!
                  </span>
                </div>
              </div>
            )}

            {/* Navegación */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <BaseButton
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentPhrase === 0}
              >
                ← Anterior
              </BaseButton>

              <div className="flex gap-1">
                {phrases.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhrase(i)}
                    className={`
                      w-3 h-3 rounded-full transition-all
                      ${i === currentPhrase ? 'bg-gray-500 scale-125' : ''}
                      ${completedPhrases.has(i) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
                    `}
                  />
                ))}
              </div>

              <BaseButton
                variant="ghost"
                onClick={handleNext}
                disabled={currentPhrase === phrases.length - 1}
              >
                Siguiente →
              </BaseButton>
            </div>
          </div>
        )}

        {/* Feedback final */}
        {showFeedback && (
          <div className="p-4 rounded-lg border-2 bg-green-50 dark:bg-green-900/20 border-green-500">
            <div className="flex items-start gap-3">
              <Check size={24} className="text-green-500 flex-shrink-0" strokeWidth={2} />
              <div className="flex-1">
                <p className="font-semibold text-base text-gray-900 dark:text-white mb-1">
                  ¡Excelente trabajo! Completaste todas las frases
                </p>
                {explanation && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    {explanation}
                  </p>
                )}
              </div>
            </div>

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
          </div>
        )}

        {/* Actions */}
        {showFeedback && (
          <div className="flex gap-3">
            <BaseButton variant="ghost" onClick={handleReset} icon={RotateCcw} fullWidth>
              Reiniciar Práctica
            </BaseButton>
          </div>
        )}
      </div>
    </BaseCard>
  );
}

export default AIAudioPronunciationExercise;
