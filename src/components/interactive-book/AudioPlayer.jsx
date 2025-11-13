/**
 * @fileoverview Reproductor de audio con soporte TTS automático
 * @module components/interactive-book/AudioPlayer
 */

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Mic, User, Globe, Sparkles } from 'lucide-react';
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
  voice = null,          // Voz específica del personaje (ej: 'es-AR-male-1') - DEPRECATED
  voiceConfig = null,    // Configuración completa de voz del personaje
  characterName = null,  // Nombre del personaje (para logs)
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
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // 0.5 - 2.0
  const audioRef = useRef(null);
  const ttsIntervalRef = useRef(null);
  const ttsAudioRef = useRef(null); // Audio generado por TTS/ElevenLabs

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

  // ✅ Aplicar velocidad de reproducción cuando cambie (audio real Y TTS)
  useEffect(() => {
    if (audioRef.current && !useTTS) {
      audioRef.current.playbackRate = playbackSpeed;
    }
    if (ttsAudioRef.current) {
      ttsAudioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, useTTS]);

  useEffect(() => {
    return () => {
      // ✅ Limpiar al desmontar
      if (ttsIntervalRef.current) {
        clearInterval(ttsIntervalRef.current);
      }
      ttsService.stop();
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
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
      // ✅ Pausar audio generado por TTS/ElevenLabs
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
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
      // ✅ Reiniciar audio generado por TTS/ElevenLabs
      if (ttsAudioRef.current) {
        ttsAudioRef.current.currentTime = 0;
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

    // Usar voiceConfig si está disponible, sino fallback a voice o config default
    const effectiveVoiceConfig = voiceConfig || {
      provider: 'browser',
      voiceId: voice,
      rate: playbackSpeed,
      volume: 1.0
    };

    const speedToUse = effectiveVoiceConfig.rate || playbackSpeed;
    const volumeToUse = isMuted ? 0 : (effectiveVoiceConfig.volume || 1.0);

    logger.info(`🎤 TTS para ${characterName || 'personaje'}: provider=${effectiveVoiceConfig.provider}, rate=${speedToUse}x`);

    try {
      // Si está configurado para usar ElevenLabs y tiene voiceId
      if (effectiveVoiceConfig.provider === 'elevenlabs' && effectiveVoiceConfig.voiceId) {
        const result = await premiumTTSService.generateWithElevenLabs(
          text,
          effectiveVoiceConfig.voiceId
        );

        if (result.audioUrl) {
          try {
            // Si se generó un archivo de audio, reproducirlo con velocidad ajustable
            await new Promise((resolve, reject) => {
              const audio = new Audio(result.audioUrl);
              ttsAudioRef.current = audio;

              // ✅ APLICAR VELOCIDAD Y VOLUMEN DE LA CONFIG
              audio.playbackRate = speedToUse;
              audio.volume = volumeToUse;

              audio.onloadedmetadata = () => {
                setDuration(audio.duration);
              };

              // ✅ PROGRESO CONTINUO REAL (no estimado)
              audio.ontimeupdate = () => {
                setCurrentTime(audio.currentTime);
                const prog = (audio.currentTime / audio.duration) * 100;
                setProgress(prog || 0);
              };

              audio.onended = () => {
                setIsPlaying(false);
                setProgress(0);
                setCurrentTime(0);
                premiumTTSService.cleanup(result.audioUrl);
                ttsAudioRef.current = null;
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
            logger.warn('ElevenLabs audio playback failed, falling back to Web Speech:', audioError);
            premiumTTSService.cleanup(result.audioUrl);
            ttsAudioRef.current = null;
          }
        }
      }

      // Fallback a Web Speech API (navegador) o si no hay ElevenLabs configurado
      const result = await premiumTTSService.generateSpeech(text, {
        voice: effectiveVoiceConfig.voiceName || voice,
        gender: 'female',
        preferPremium: false // Forzar uso de navegador
      });

      if (result.audioUrl) {
        try {
          // Si se generó un archivo de audio, reproducirlo con velocidad ajustable
          await new Promise((resolve, reject) => {
            const audio = new Audio(result.audioUrl);
            ttsAudioRef.current = audio;

            // ✅ APLICAR VELOCIDAD DE REPRODUCCIÓN
            audio.playbackRate = playbackSpeed;
            audio.volume = isMuted ? 0 : 1.0;

            audio.onloadedmetadata = () => {
              setDuration(audio.duration);
            };

            // ✅ PROGRESO CONTINUO REAL (no estimado)
            audio.ontimeupdate = () => {
              setCurrentTime(audio.currentTime);
              const prog = (audio.currentTime / audio.duration) * 100;
              setProgress(prog || 0);
            };

            audio.onended = () => {
              setIsPlaying(false);
              setProgress(0);
              setCurrentTime(0);
              premiumTTSService.cleanup(result.audioUrl);
              ttsAudioRef.current = null;
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
          ttsAudioRef.current = null;
        }
      }

      // Web Speech API (navegador) - buscar voz específica si está configurada
      const estimatedDuration = estimateDuration(text) / speedToUse;
      const startTime = Date.now();

      // ✅ Progreso suave (cada 50ms para mejor fluidez)
      ttsIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const currentProgress = Math.min((elapsed / estimatedDuration) * 100, 100);
        setProgress(currentProgress);
        setCurrentTime(elapsed);

        if (currentProgress >= 100) {
          clearInterval(ttsIntervalRef.current);
        }
      }, 50);

      // Buscar voz específica del navegador si está configurada
      let selectedVoice = null;
      if (effectiveVoiceConfig.voiceName && effectiveVoiceConfig.voiceName !== 'Auto') {
        const voices = ttsService.getSpanishVoices();
        selectedVoice = voices.find(v => v.name === effectiveVoiceConfig.voiceName);
      }

      // ✅ VELOCIDAD Y VOLUMEN APLICADOS a Web Speech
      await ttsService.speak(text, {
        voice: selectedVoice,
        rate: speedToUse,
        volume: volumeToUse
      });

      // Limpiar cuando termina
      if (ttsIntervalRef.current) {
        clearInterval(ttsIntervalRef.current);
      }
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      logger.error('Error en TTS:', err);
      if (ttsIntervalRef.current) {
        clearInterval(ttsIntervalRef.current);
      }
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (audioRef.current) {
      audioRef.current.muted = newMuted;
    }
    // ✅ Aplicar mute a audio generado por TTS/ElevenLabs
    if (ttsAudioRef.current) {
      ttsAudioRef.current.muted = newMuted;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determinar el provider actual basado en voiceConfig
  const effectiveVoiceConfig = voiceConfig || { provider: 'browser', rate: playbackSpeed };
  const isElevenLabs = effectiveVoiceConfig.provider === 'elevenlabs';
  const currentSpeed = effectiveVoiceConfig.rate || playbackSpeed;

  return (
    <div className={`audio-player ${className}`}>
      <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Header con info del personaje y provider */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {characterName && (
              <>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {characterName}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Badge de velocidad */}
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs font-bold">
              {currentSpeed.toFixed(2)}x
            </span>
            {/* Badge de provider */}
            {useTTS && (
              <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                isElevenLabs
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              }`}>
                {isElevenLabs ? (
                  <>
                    <Sparkles size={12} />
                    ElevenLabs
                  </>
                ) : (
                  <>
                    <Globe size={12} />
                    Navegador
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Controles principales */}
        <div className="flex items-center gap-3">
          {/* Play/Pause Button - Hero style con animación de pulso */}
          <button
            onClick={isPlaying ? pauseAudio : playAudio}
            className={`flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900 dark:from-zinc-600 dark:to-zinc-800 hover:from-zinc-600 hover:to-zinc-800 dark:hover:from-zinc-500 dark:hover:to-zinc-700 text-white rounded-full transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${
              isPlaying ? 'animate-pulse' : ''
            }`}
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
          </button>

          {/* Progress Bar - Modernizada */}
          <div className="flex-1 space-y-2">
            {/* Barra de progreso con animación */}
            <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden group">
            {/* Background glow effect */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-zinc-400 via-zinc-500 to-zinc-600 dark:from-zinc-500 dark:via-zinc-600 dark:to-zinc-700 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
              style={{ width: `${progress}%` }}
            />

            {/* Progress fill con gradiente */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-zinc-600 via-zinc-700 to-zinc-800 dark:from-zinc-500 dark:via-zinc-600 dark:to-zinc-700 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            >
              {/* Animated shine effect */}
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                     style={{
                       backgroundSize: '200% 100%',
                       animation: 'shimmer 2s linear infinite'
                     }}
                />
              )}
            </div>

            {/* Progress indicator dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-gray-100 rounded-full shadow-md border-2 border-zinc-700 dark:border-zinc-600 transition-all duration-300 opacity-0 group-hover:opacity-100"
              style={{ left: `calc(${progress}% - 8px)` }}
            />
          </div>

            {/* Time indicators */}
            <div className="flex justify-between items-center text-xs font-medium text-gray-600 dark:text-gray-400">
              <span className="tabular-nums">{formatTime(currentTime)}</span>
              <span className="tabular-nums">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
          {useTTS && (
            <div
              className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg"
              title="Usando Text-to-Speech con IA"
            >
              <Mic size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
          )}

          <button
            onClick={resetAudio}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Reiniciar"
          >
            <RotateCcw size={18} className="text-gray-600 dark:text-gray-400" />
          </button>

          <button
            onClick={toggleMute}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? (
              <VolumeX size={18} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <Volume2 size={18} className="text-gray-600 dark:text-gray-400" />
            )}
          </button>

            {/* Control de velocidad - Mejorado */}
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              title="Velocidad de reproducción"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1.0">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2.0">2x</option>
            </select>
          </div>
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
  voice: PropTypes.string,  // Voz específica (ej: 'es-AR-male-1') - DEPRECATED
  voiceConfig: PropTypes.shape({
    provider: PropTypes.oneOf(['browser', 'elevenlabs']),
    voiceId: PropTypes.string,
    voiceName: PropTypes.string,
    rate: PropTypes.number,
    pitch: PropTypes.number,
    volume: PropTypes.number
  }),
  characterName: PropTypes.string,
  autoPlay: PropTypes.bool,
  showText: PropTypes.bool,
  className: PropTypes.string,
  onPlay: PropTypes.func,
  onComplete: PropTypes.func
};

export default AudioPlayer;
