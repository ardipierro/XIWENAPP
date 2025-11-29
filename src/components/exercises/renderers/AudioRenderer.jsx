/**
 * @fileoverview AudioRenderer - Renderizador de contenido de audio
 * @module components/exercises/renderers/AudioRenderer
 *
 * Soporta:
 * - Audio local/uploadado
 * - Transcripción sincronizada
 * - Ejercicios de pronunciación
 * - Controles de velocidad
 * - Repetición de segmentos
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Repeat,
  SkipBack,
  SkipForward,
  Check
} from 'lucide-react';
import { BaseBadge, BaseButton } from '../../common';

/**
 * AudioRenderer - Renderiza contenido de audio
 *
 * @param {Object} props
 * @param {string} props.url - URL del audio
 * @param {string} [props.title] - Título
 * @param {string} [props.transcript] - Transcripción del audio
 * @param {Array} [props.segments] - Segmentos [{start, end, text}]
 * @param {boolean} [props.showTranscript] - Mostrar transcripción
 * @param {boolean} [props.allowRecording] - Permitir grabación (pronunciación)
 * @param {boolean} [props.autoplay] - Reproducir automáticamente
 * @param {boolean} [props.loop] - Repetir audio
 * @param {Function} [props.onProgress] - Callback de progreso
 * @param {Function} [props.onComplete] - Callback al completar
 * @param {string} [props.className] - Clases adicionales
 */
export function AudioRenderer({
  url,
  title,
  transcript,
  segments = [],
  showTranscript = true,
  allowRecording = false,
  autoplay = false,
  loop = false,
  onProgress,
  onComplete,
  className = ''
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(loop);
  const [currentSegment, setCurrentSegment] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [error, setError] = useState(null);

  // Media recorder para grabación
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Formatear tiempo
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Play/Pause
  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Mute
  const handleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Seek
  const handleSeek = useCallback((e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  // Skip
  const handleSkip = useCallback((seconds) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime += seconds;
  }, []);

  // Velocidad
  const handlePlaybackRate = useCallback((rate) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  // Loop
  const handleLoop = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.loop = !isLooping;
    setIsLooping(!isLooping);
  }, [isLooping]);

  // Reiniciar
  const handleRestart = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Ir a segmento
  const goToSegment = useCallback((segment) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = segment.start;
    setCurrentTime(segment.start);
    setCurrentSegment(segment);
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Iniciar grabación
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudio(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError('No se pudo acceder al micrófono');
    }
  }, []);

  // Detener grabación
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Reproducir grabación
  const playRecording = useCallback(() => {
    if (recordedAudio) {
      const audio = new Audio(recordedAudio);
      audio.play();
    }
  }, [recordedAudio]);

  // Event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onProgress?.(audio.currentTime / audio.duration);

      // Actualizar segmento actual
      if (segments.length > 0) {
        const current = segments.find(
          s => audio.currentTime >= s.start && audio.currentTime <= s.end
        );
        setCurrentSegment(current || null);
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const onEnded = () => {
      setIsPlaying(false);
      onComplete?.();
    };

    const onError = () => {
      setError('Error al cargar el audio');
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [segments, onProgress, onComplete]);

  // Autoplay
  useEffect(() => {
    if (autoplay && audioRef.current) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [autoplay]);

  // Calcular progreso
  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`audio-renderer w-full ${className}`}
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Audio element (hidden) */}
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Título */}
      {title && (
        <h3
          className="text-xl font-semibold mb-4"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {title}
        </h3>
      )}

      {/* Error */}
      {error && (
        <div
          className="p-4 rounded-lg mb-4"
          style={{
            backgroundColor: 'var(--color-error-bg)',
            color: 'var(--color-error)'
          }}
        >
          {error}
        </div>
      )}

      {/* Player */}
      <div
        className="p-4 rounded-xl"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)'
        }}
      >
        {/* Barra de progreso */}
        <div
          className="h-2 rounded-full cursor-pointer mb-4 relative"
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          onClick={handleSeek}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              backgroundColor: 'var(--color-accent)'
            }}
          />
          {/* Marcadores de segmentos */}
          {segments.map((segment, idx) => (
            <div
              key={idx}
              className="absolute top-0 h-full cursor-pointer hover:opacity-80"
              style={{
                left: `${(segment.start / duration) * 100}%`,
                width: `${((segment.end - segment.start) / duration) * 100}%`,
                backgroundColor: currentSegment === segment ? 'var(--color-accent-bg)' : 'transparent',
                borderLeft: '2px solid var(--color-accent)'
              }}
              onClick={(e) => {
                e.stopPropagation();
                goToSegment(segment);
              }}
              title={segment.text}
            />
          ))}
        </div>

        {/* Tiempo */}
        <div
          className="text-center text-sm font-mono mb-4"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Controles */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {/* Reiniciar */}
          <button
            onClick={handleRestart}
            className="p-2 rounded-full transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)'
            }}
            title="Reiniciar"
          >
            <RotateCcw size={20} />
          </button>

          {/* Skip back */}
          <button
            onClick={() => handleSkip(-5)}
            className="p-2 rounded-full transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)'
            }}
            title="-5s"
          >
            <SkipBack size={20} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            className="p-4 rounded-full transition-colors"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'white'
            }}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>

          {/* Skip forward */}
          <button
            onClick={() => handleSkip(5)}
            className="p-2 rounded-full transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)'
            }}
            title="+5s"
          >
            <SkipForward size={20} />
          </button>

          {/* Loop */}
          <button
            onClick={handleLoop}
            className="p-2 rounded-full transition-colors"
            style={{
              backgroundColor: isLooping ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
              color: isLooping ? 'white' : 'var(--color-text-secondary)',
              ...(isLooping && { boxShadow: '0 0 0 2px var(--color-accent)' })
            }}
            title="Repetir"
          >
            <Repeat size={20} />
          </button>

          {/* Velocidad */}
          <select
            value={playbackRate}
            onChange={(e) => handlePlaybackRate(parseFloat(e.target.value))}
            className="px-2 py-1 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)'
            }}
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>

          {/* Mute */}
          <button
            onClick={handleMute}
            className="p-2 rounded-full transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)'
            }}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </div>

      {/* Transcripción */}
      {showTranscript && transcript && (
        <div
          className="mt-4 p-4 rounded-lg"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <h4
            className="text-sm font-medium mb-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Transcripción
          </h4>
          <p
            className="text-base leading-relaxed"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {transcript}
          </p>
        </div>
      )}

      {/* Segmentos con texto */}
      {segments.length > 0 && (
        <div className="mt-4">
          <h4
            className="text-sm font-medium mb-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Segmentos
          </h4>
          <div className="space-y-2">
            {segments.map((segment, idx) => (
              <button
                key={idx}
                onClick={() => goToSegment(segment)}
                className="w-full text-left p-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: currentSegment === segment
                    ? 'var(--color-accent-bg)'
                    : 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  ...(currentSegment === segment && { boxShadow: '0 0 0 2px var(--color-accent)' })
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-mono px-2 py-1 rounded"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    {formatTime(segment.start)}
                  </span>
                  <span style={{ color: 'var(--color-text-primary)' }}>
                    {segment.text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grabación de pronunciación */}
      {allowRecording && (
        <div
          className="mt-4 p-4 rounded-lg"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <h4
            className="text-sm font-medium mb-3"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Practica tu pronunciación
          </h4>
          <div className="flex items-center gap-3">
            <BaseButton
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? 'danger' : 'primary'}
              icon={isRecording ? MicOff : Mic}
            >
              {isRecording ? 'Detener' : 'Grabar'}
            </BaseButton>

            {recordedAudio && (
              <>
                <BaseButton
                  onClick={playRecording}
                  variant="secondary"
                  icon={Play}
                >
                  Escuchar
                </BaseButton>
                <BaseBadge variant="success" size="sm">
                  <Check size={14} className="mr-1" />
                  Grabación lista
                </BaseBadge>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AudioRenderer;
