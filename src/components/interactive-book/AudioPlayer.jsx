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
      setUseTTS(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setCurrentTime(current);
      setProgress((current / dur) * 100);
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
    logger.warn('⚠️ Audio no disponible, usando TTS:', e);
    if (text && ttsSupported) {
      setUseTTS(true);
      setDuration(estimateDuration(text));
    }
  };

  const playAudio = async () => {
    try {
      if (useTTS) {
        await playTTS();
      } else if (audioRef.current) {
        await audioRef.current.play();
        setIsPlaying(true);
        if (onPlay) {
          onPlay();
        }
      }
    } catch (err) {
      logger.error('Error al reproducir:', err);
      // Intentar con TTS como fallback
      if (text && ttsSupported && !useTTS) {
        setUseTTS(true);
        await playTTS();
      }
    }
  };

  const playTTS = async () => {
    if (!text) return;

    setIsPlaying(true);
    setProgress(0);
    setCurrentTime(0);

    if (onPlay) {
      onPlay();
    }

    try {
      // Intentar generar con servicio premium (mejor calidad)
      const result = await premiumTTSService.generateSpeech(text, {
        gender: 'female',
        preferPremium: false // Cambiar a true si tienes API key de ElevenLabs
      });

      if (result.audioUrl) {
        // Si se generó un archivo de audio, reproducirlo
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
          setProgress(0);
          setCurrentTime(0);
          premiumTTSService.cleanup(result.audioUrl);
          if (onComplete) {
            onComplete();
          }
        };
        audio.volume = isMuted ? 0 : 1.0;
        await audio.play();
      } else if (result.type === 'responsivevoice') {
        // ResponsiveVoice maneja su propia reproducción
        // Simular progreso
        const estimatedDuration = estimateDuration(text);
        const startTime = Date.now();

        ttsIntervalRef.current = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          const currentProgress = (elapsed / estimatedDuration) * 100;

          if (currentProgress >= 100) {
            clearInterval(ttsIntervalRef.current);
            setProgress(100);
            setCurrentTime(estimatedDuration);
          } else {
            setProgress(currentProgress);
            setCurrentTime(elapsed);
          }
        }, 100);
      } else {
        // Fallback a Web Speech API
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
      }
    } catch (err) {
      logger.error('Error en TTS:', err);
      if (ttsIntervalRef.current) {
        clearInterval(ttsIntervalRef.current);
      }
      setIsPlaying(false);
    }
  };

  const pauseAudio = () => {
    if (useTTS) {
      ttsService.pause();
      setIsPlaying(false);
      if (ttsIntervalRef.current) {
        clearInterval(ttsIntervalRef.current);
      }
    } else if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const toggleMute = () => {
    if (useTTS) {
      setIsMuted(!isMuted);
    } else if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const restart = () => {
    if (useTTS) {
      ttsService.stop();
      if (ttsIntervalRef.current) {
        clearInterval(ttsIntervalRef.current);
      }
      setProgress(0);
      setCurrentTime(0);
      playTTS();
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      setCurrentTime(0);
      playAudio();
    }
  };

  const handleProgressClick = (e) => {
    if (useTTS) {
      // TTS no soporta seek, reiniciar desde el principio
      restart();
    } else if (audioRef.current) {
      const bounds = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const width = bounds.width;
      const percentage = x / width;
      const newTime = percentage * duration;
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 ${className}`}>
      {/* Audio element (solo si no usamos TTS) */}
      {!useTTS && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

      <div className="flex items-center gap-3">
        {/* Controles */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>

          <button
            onClick={toggleMute}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
          >
            {isMuted ? (
              <VolumeX size={18} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <Volume2 size={18} className="text-blue-600 dark:text-blue-400" />
            )}
          </button>

          <button
            onClick={restart}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
          >
            <RotateCcw size={16} className="text-gray-600 dark:text-gray-400" />
          </button>

          {/* Indicador TTS */}
          {useTTS && (
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Mic size={12} className="text-purple-600 dark:text-purple-400" />
              <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                IA
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="flex-1">
          <div
            onClick={handleProgressClick}
            className="h-2 bg-blue-200 dark:bg-blue-800 rounded-full cursor-pointer overflow-hidden"
          >
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Texto */}
      {showText && text && (
        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          {text}
        </div>
      )}

      {/* Info TTS */}
      {useTTS && (
        <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
          <Mic size={12} />
          <span>Voz generada por IA (Text-to-Speech)</span>
        </div>
      )}
    </div>
  );
}

AudioPlayer.propTypes = {
  audioUrl: PropTypes.string.isRequired,
  text: PropTypes.string,
  autoPlay: PropTypes.bool,
  showText: PropTypes.bool,
  className: PropTypes.string,
  onPlay: PropTypes.func,
  onComplete: PropTypes.func
};

export default AudioPlayer;
