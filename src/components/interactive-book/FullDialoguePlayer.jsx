/**
 * @fileoverview Reproductor de diálogo completo con sistema unificado de audio
 * Reproduce todo el diálogo línea por línea antes de ver detalles individuales
 * @module components/interactive-book/FullDialoguePlayer
 */

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, SkipForward, List, User, AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import ttsService from '../../services/ttsService';
import premiumTTSService from '../../services/premiumTTSService';
import { getCharacterVoiceConfig } from './CharacterVoiceManager';
import { BaseButton } from '../common';
import logger from '../../utils/logger';

/**
 * Reproductor de diálogo completo con TTS unificado
 */
function FullDialoguePlayer({ dialogue, onComplete }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const isPlayingRef = useRef(false);
  const ttsAudioRef = useRef(null);
  const timeIntervalRef = useRef(null);

  useEffect(() => {
    // Limpiar al desmontar
    return () => {
      stopPlayback();
    };
  }, []);

  /**
   * Estima la duración de una línea basado en su longitud
   */
  const estimateLineDuration = (text, rate = 1.0) => {
    if (!text) return 0;
    const words = text.split(' ').length;
    const wordsPerMinute = 150 * rate;
    return (words / wordsPerMinute) * 60;
  };

  /**
   * Calcula duración total estimada del diálogo
   */
  useEffect(() => {
    if (dialogue?.lines) {
      const total = dialogue.lines.reduce((sum, line) => {
        const character = dialogue.characters?.find(c => c.id === line.character);
        const voiceConfig = getCharacterVoiceConfig(character?.id || line.character);
        const rate = voiceConfig?.rate || 1.0;
        return sum + estimateLineDuration(line.text, rate) + 0.5; // +0.5s pausa entre líneas
      }, 0);
      setTotalDuration(total);
    }
  }, [dialogue]);

  /**
   * Reproduce un audio generado por TTS
   */
  const playAudioFile = (audioUrl, rate = 1.0) => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      ttsAudioRef.current = audio;
      audio.playbackRate = rate;

      audio.onended = () => {
        resolve();
      };

      audio.onerror = (error) => {
        reject(error);
      };

      audio.play().catch(reject);
    });
  };

  /**
   * Reproduce una línea individual con su configuración de voz
   */
  const playLine = async (line, character) => {
    const voiceConfig = getCharacterVoiceConfig(character?.id || line.character);
    const speedToUse = voiceConfig?.rate || 1.0;
    const volumeToUse = voiceConfig?.volume || 1.0;

    logger.info(`🎤 Reproduciendo línea de ${line.character}: ${line.text.substring(0, 30)}...`);

    try {
      // Si está configurado para usar ElevenLabs
      if (voiceConfig?.provider === 'elevenlabs' && voiceConfig?.voiceId) {
        const result = await premiumTTSService.generateWithElevenLabs(
          line.text,
          voiceConfig.voiceId
        );

        if (result.audioUrl) {
          try {
            await playAudioFile(result.audioUrl, speedToUse);
            premiumTTSService.cleanup(result.audioUrl);
            return;
          } catch (audioError) {
            logger.warn('ElevenLabs playback failed, falling back to Web Speech:', audioError);
            premiumTTSService.cleanup(result.audioUrl);
          }
        }
      }

      // Fallback a Web Speech API (navegador)
      const result = await premiumTTSService.generateSpeech(line.text, {
        voice: voiceConfig?.voiceName,
        gender: 'female',
        preferPremium: false
      });

      if (result.audioUrl) {
        try {
          await playAudioFile(result.audioUrl, speedToUse);
          premiumTTSService.cleanup(result.audioUrl);
          return;
        } catch (audioError) {
          logger.warn('Audio playback failed, falling back to Web Speech:', audioError);
          premiumTTSService.cleanup(result.audioUrl);
        }
      }

      // Web Speech API directo
      let selectedVoice = null;
      if (voiceConfig?.voiceName && voiceConfig.voiceName !== 'Auto') {
        const voices = ttsService.getSpanishVoices();
        selectedVoice = voices.find(v => v.name === voiceConfig.voiceName);
      }

      await ttsService.speak(line.text, {
        voice: selectedVoice,
        rate: speedToUse,
        volume: volumeToUse
      });
    } catch (err) {
      logger.error('Error reproduciendo línea:', err);
      throw err;
    }
  };

  /**
   * Reproduce el diálogo completo
   */
  const playFullDialogue = async () => {
    if (!dialogue || !dialogue.lines || dialogue.lines.length === 0) {
      logger.warn('No hay líneas para reproducir');
      return;
    }

    setIsPlaying(true);
    isPlayingRef.current = true;
    setCurrentLineIndex(0);
    setProgress(0);
    setCurrentTime(0);

    const totalLines = dialogue.lines.length;
    let accumulatedTime = 0;

    // Timer para actualizar el progreso
    const startTime = Date.now();
    timeIntervalRef.current = setInterval(() => {
      if (isPlayingRef.current) {
        const elapsed = (Date.now() - startTime) / 1000;
        setCurrentTime(elapsed);
        const progressPct = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
        setProgress(Math.min(progressPct, 100));
      }
    }, 100);

    for (let i = 0; i < totalLines && isPlayingRef.current; i++) {
      const line = dialogue.lines[i];
      const character = dialogue.characters?.find(c => c.id === line.character);

      setCurrentLineIndex(i);

      try {
        await playLine(line, character);

        // Pausa entre líneas (excepto la última)
        if (i < totalLines - 1 && isPlayingRef.current) {
          await sleep(500);
        }
      } catch (err) {
        logger.error('Error reproduciendo línea:', err);
        // Continuar con la siguiente línea
      }
    }

    // Limpiar
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
    }

    setIsPlaying(false);
    isPlayingRef.current = false;
    setProgress(100);

    if (onComplete) {
      onComplete();
    }
  };

  /**
   * Detiene la reproducción
   */
  const stopPlayback = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);

    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
    }

    ttsService.stop();

    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
  };

  /**
   * Salta a la siguiente línea
   */
  const skipToNextLine = () => {
    ttsService.stop();
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
  };

  /**
   * Helper: Sleep
   */
  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  /**
   * Formatea tiempo en MM:SS
   */
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Si no hay diálogo, no mostrar nada
  if (!dialogue?.lines || dialogue.lines.length === 0) {
    return (
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-lg mb-6">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">No hay diálogo disponible para reproducir</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-xl mb-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 dark:bg-purple-500 rounded-full flex items-center justify-center shadow-md">
            <List size={20} className="text-white" />
          </div>
          <div>
            <h4 className="text-md font-bold text-purple-900 dark:text-purple-100">
              Escuchar Diálogo Completo
            </h4>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              {dialogue.lines.length} líneas • {formatTime(totalDuration)} estimado
            </p>
          </div>
        </div>
      </div>

      {/* Línea actual (solo cuando está reproduciendo) */}
      {isPlaying && dialogue.lines[currentLineIndex] && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-purple-200 dark:border-purple-700">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {dialogue.lines[currentLineIndex].character}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Línea {currentLineIndex + 1} de {dialogue.lines.length}
                </span>
              </div>
              <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                {dialogue.lines[currentLineIndex].text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="h-3 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 dark:from-purple-400 dark:via-purple-500 dark:to-purple-600 transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          >
            {isPlaying && (
              <div
                className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s linear infinite'
                }}
              />
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 px-1">
          <span className="text-xs font-medium text-purple-700 dark:text-purple-300 tabular-nums">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs font-medium text-purple-700 dark:text-purple-300 tabular-nums">
            {formatTime(totalDuration)}
          </span>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-3">
        {!isPlaying ? (
          <BaseButton
            variant="primary"
            size="md"
            icon={Play}
            onClick={playFullDialogue}
            className="flex-1"
          >
            Reproducir Diálogo Completo
          </BaseButton>
        ) : (
          <>
            <BaseButton
              variant="danger"
              size="md"
              icon={Pause}
              onClick={stopPlayback}
              className="flex-1"
            >
              Detener
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="md"
              icon={SkipForward}
              onClick={skipToNextLine}
              title="Saltar a la siguiente línea"
            >
              Siguiente
            </BaseButton>
          </>
        )}

        <div className="flex items-center gap-1.5 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Volume2 size={16} className="text-purple-600 dark:text-purple-400" />
          <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
            Voz IA
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
          <span className="text-base">💡</span>
          <span>
            Escuchá la conversación completa antes de practicar línea por línea.
            Cada personaje usa su voz configurada.
          </span>
        </p>
      </div>
    </div>
  );
}

FullDialoguePlayer.propTypes = {
  dialogue: PropTypes.shape({
    characters: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        voice: PropTypes.string
      })
    ),
    lines: PropTypes.arrayOf(
      PropTypes.shape({
        character: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired
      })
    ).isRequired
  }).isRequired,
  onComplete: PropTypes.func
};

export default FullDialoguePlayer;
