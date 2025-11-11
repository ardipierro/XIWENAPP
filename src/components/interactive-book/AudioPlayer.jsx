/**
 * @fileoverview Reproductor de audio con soporte TTS automático
 * @module components/interactive-book/AudioPlayer
 */

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Mic } from 'lucide-react';
import PropTypes from 'prop-types';
import ttsService from '../../services/ttsService';
import premiumTTSService from '../../services/premiumTTSService';
import logger from '../../utils/logger';

/**
 * Reproductor de audio con fallback a Text-to-Speech
 * Si el archivo de audio no existe, usa TTS automáticamente
 */
function AudioPlayer({
  audioUrl,
  text,
  voice = null,          // Voz específica del personaje (ej: 'es-AR-male-1')
  autoPlay = false,
  showText = true,
  className = '',
  onPlay = null,
  onComplete = null
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [useTTS, setUseTTS] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const audioRef = useRef(null);
  const ttsIntervalRef = useRef(null);

  useEffect(() => {
    // Verificar si TTS está disponible
    setTtsSupported(ttsService.isAvailable());

    // Si no hay texto, no podemos usar TTS
    if (!text) {
      setUseTTS(false);
      return;
    }

    // Si la URL es de tipo /audio/, asumir que no existe y usar TTS
    if (audioUrl.startsWith('/audio/')) {
      setUseTTS(true);
      setDuration(estimateDuration(text));
      logger.info('🎤 Usando TTS para:', text.substring(0, 30) + '...');
      return;
    }

    // Intentar cargar el audio real
    if (audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleEnded);
      audioRef.current.addEventListener('error', handleAudioError);

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('ended', handleEnded);
          audioRef.current.removeEventListener('error', handleAudioError);
        }
      };
    }
  }, [audioUrl, text]);

  useEffect(() => {
    if (autoPlay) {
      playAudio();
    }
  }, [autoPlay]);

  useEffect(() => {
    return () => {
      // Limpiar al desmontar
      if (ttsIntervalRef.current) {
        clearInterval(ttsIntervalRef.current);
      }
      ttsService.stop();
    };
  }, []);

  /**
   * Estima la duración del audio basado en la longitud del texto
   * Aproximadamente 150 palabras por minuto en español
   */
  const estimateDuration = (text) => {
    if (!text) return 0;
    const words = text.split(' ').length;
    const wordsPerMinute = 150;
    return (words / wordsPerMinute) * 60;
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      const prog = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(prog || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    if (onComplete) {
      onComplete();
    }
  };

  const handleAudioError = (e) => {
    logger.error('Error cargando audio, fallback a TTS:', e);
    setUseTTS(true);
    setDuration(estimateDuration(text));
  };

  const playAudio = async () => {
    if (isPlaying) return;

    setIsPlaying(true);

    if (useTTS) {
      playTTS();
    } else if (audioRef.current) {
      try {
        await audioRef.current.play();
      } catch (err) {
        logger.error('Error reproduciendo audio:', err);
        setUseTTS(true);
        playTTS();
      }
    }
  };

  const pauseAudio = () => {
    setIsPlaying(false);

    if (useTTS) {
      ttsService.stop();
      if (ttsIntervalRef.current) {
        clearInterval(ttsIntervalRef.current);
      }
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const resetAudio = () => {
    setProgress(0);
    setCurrentTime(0);

    if (useTTS) {
      ttsService.stop();
      if (ttsIntervalRef.current) {
        clearInterval(ttsIntervalRef.current);
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const playTTS = async () => {
    if (!text) return;

    if (onPlay) {
      onPlay();
    }

    try {
      // Intentar generar con servicio premium (mejor calidad)
      const result = await premiumTTSService.generateSpeech(text, {
        voice: voice,      // Usar voz específica del personaje si está disponible
        gender: 'female',  // Fallback si no hay voice
        preferPremium: true // Usar ElevenLabs si está configurado
      });

      if (result.audioUrl) {
        try {
          // Si se generó un archivo de audio, reproducirlo
          await new Promise((resolve, reject) => {
            const audio = new Audio(result.audioUrl);

            audio.onloadedmetadata = () => {
              setDuration(audio.duration);
            };

            audio.ontimeupdate = () => {
              setCurrentTime(audio.currentTime);
              setProgress((audio.currentTime / audio.duration) * 100);
            };

            audio.onended = () => {
              setIsPlaying(false);
              setProgress(100);
              premiumTTSService.cleanup(result.audioUrl);
              if (onComplete) {
                onComplete();
              }
              resolve();
            };

            audio.onerror = (error) => {
              reject(new Error('Audio file failed to load'));
            };

            audio.play().catch(reject);
          });

          return; // Exit successfully if audio plays
        } catch (audioError) {
          // Si falla el audio, hacer fallback a Web Speech
          logger.warn('Audio playback failed, falling back to Web Speech:', audioError);
          premiumTTSService.cleanup(result.audioUrl);
        }
      }

      // Fallback a Web Speech API (navegador) - ejecuta si no hay audioUrl o si falla
      const estimatedDuration = estimateDuration(text);
      const startTime = Date.now();

      ttsIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const currentProgress = (elapsed / estimatedDuration) * 100;

        if (currentProgress >= 100) {
          clearInterval(ttsIntervalRef.current);
          setProgress(100);
          setCurrentTime(estimatedDuration);
          setTimeout(() => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
            if (onComplete) {
              onComplete();
            }
          }, 100);
        } else {
          setProgress(currentProgress);
          setCurrentTime(elapsed);
        }
      }, 100);

      await ttsService.speak(text, {
        rate: 0.9,
        volume: isMuted ? 0 : 1.0
      });
    } catch (err) {
      logger.error('Error en TTS:', err);
      if (ttsIntervalRef.current) {
        clearInterval(ttsIntervalRef.current);
      }
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`audio-player ${className}`}>
      <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {/* Play/Pause Button */}
        <button
          onClick={isPlaying ? pauseAudio : playAudio}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
          title={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>

        {/* Progress Bar */}
        <div className="flex-1">
          <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-600 dark:text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {useTTS && (
            <div className="text-blue-600 dark:text-blue-400" title="Usando Text-to-Speech">
              <Mic size={18} />
            </div>
          )}

          <button
            onClick={resetAudio}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Reiniciar"
          >
            <RotateCcw size={18} className="text-gray-600 dark:text-gray-400" />
          </button>

          <button
            onClick={toggleMute}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? (
              <VolumeX size={18} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <Volume2 size={18} className="text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Show text if enabled */}
      {showText && text && (
        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 px-3">
          {text}
        </div>
      )}

      {/* Hidden audio element (usado solo si no es TTS) */}
      {!useTTS && audioUrl && (
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
      )}
    </div>
  );
}

AudioPlayer.propTypes = {
  audioUrl: PropTypes.string.isRequired,
  text: PropTypes.string,
  voice: PropTypes.string,  // Voz específica (ej: 'es-AR-male-1', 'es-AR-female-2')
  autoPlay: PropTypes.bool,
  showText: PropTypes.bool,
  className: PropTypes.string,
  onPlay: PropTypes.func,
  onComplete: PropTypes.func
};

export default AudioPlayer;
