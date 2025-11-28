/**
 * @fileoverview VideoRenderer - Renderizador de contenido de video
 * @module components/exercises/renderers/VideoRenderer
 *
 * Soporta:
 * - Videos de YouTube, Vimeo, etc.
 * - Videos locales/uploadados
 * - Controles de reproducción
 * - Subtítulos opcionales
 * - Marcadores de tiempo
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Loader2
} from 'lucide-react';
import { BaseBadge } from '../../common';

/**
 * Extraer ID de video de YouTube
 */
function getYouTubeId(url) {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Extraer ID de video de Vimeo
 */
function getVimeoId(url) {
  if (!url) return null;
  const regex = /vimeo\.com\/(?:video\/)?(\d+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * VideoRenderer - Renderiza contenido de video
 *
 * @param {Object} props
 * @param {string} props.url - URL del video
 * @param {string} [props.title] - Título del video
 * @param {string} [props.description] - Descripción
 * @param {Array} [props.markers] - Marcadores de tiempo [{time, label}]
 * @param {boolean} [props.autoplay] - Reproducir automáticamente
 * @param {boolean} [props.controls] - Mostrar controles nativos
 * @param {boolean} [props.loop] - Repetir video
 * @param {number} [props.startTime] - Tiempo de inicio (segundos)
 * @param {number} [props.endTime] - Tiempo de fin (segundos)
 * @param {Function} [props.onProgress] - Callback de progreso
 * @param {Function} [props.onComplete] - Callback al completar
 * @param {string} [props.className] - Clases adicionales
 */
export function VideoRenderer({
  url,
  title,
  description,
  markers = [],
  autoplay = false,
  controls = true,
  loop = false,
  startTime = 0,
  endTime,
  onProgress,
  onComplete,
  className = ''
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Determinar tipo de video
  const youtubeId = getYouTubeId(url);
  const vimeoId = getVimeoId(url);
  const isEmbed = youtubeId || vimeoId;
  const isLocal = !isEmbed && url;

  // Formatear tiempo
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handlers para video local
  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleSeek = useCallback((e) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const handleSkip = useCallback((seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!videoRef.current) return;
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  const handlePlaybackRate = useCallback((rate) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  // Ir a marcador
  const goToMarker = useCallback((time) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
    if (!isPlaying) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Event listeners para video local
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isEmbed) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onProgress?.(video.currentTime / video.duration);

      // Verificar si llegó al endTime
      if (endTime && video.currentTime >= endTime) {
        video.pause();
        setIsPlaying(false);
        onComplete?.();
      }
    };

    const onLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      if (startTime) {
        video.currentTime = startTime;
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      onComplete?.();
    };

    const onError = () => {
      setError('Error al cargar el video');
      setIsLoading(false);
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
    };
  }, [isEmbed, startTime, endTime, onProgress, onComplete]);

  // Autoplay
  useEffect(() => {
    if (autoplay && videoRef.current && !isEmbed) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [autoplay, isEmbed]);

  // Calcular progreso
  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`video-renderer w-full ${className}`}
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Título y descripción */}
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {title}
            </h3>
          )}
          {description && (
            <p
              className="text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {description}
            </p>
          )}
        </div>
      )}

      {/* Video container */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
        {/* Loading */}
        {isLoading && !isEmbed && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <p className="text-white text-center">
              {error}
            </p>
          </div>
        )}

        {/* YouTube embed */}
        {youtubeId && (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${autoplay ? 1 : 0}&start=${startTime}&loop=${loop ? 1 : 0}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />
        )}

        {/* Vimeo embed */}
        {vimeoId && (
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=${autoplay ? 1 : 0}&loop=${loop ? 1 : 0}#t=${startTime}s`}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />
        )}

        {/* Video local */}
        {isLocal && (
          <>
            <video
              ref={videoRef}
              src={url}
              className="w-full h-full"
              loop={loop}
              playsInline
              controls={false}
              onClick={handlePlayPause}
            />

            {/* Controles personalizados */}
            {controls && !error && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                {/* Barra de progreso */}
                <div
                  className="h-1 bg-white/30 rounded-full cursor-pointer mb-3"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                  {/* Marcadores */}
                  {markers.map((marker, idx) => (
                    <div
                      key={idx}
                      className="absolute top-0 w-1 h-3 bg-yellow-400 rounded -translate-y-1/2 cursor-pointer"
                      style={{ left: `${(marker.time / duration) * 100}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        goToMarker(marker.time);
                      }}
                      title={marker.label}
                    />
                  ))}
                </div>

                {/* Controles */}
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    {/* Play/Pause */}
                    <button
                      onClick={handlePlayPause}
                      className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>

                    {/* Skip back */}
                    <button
                      onClick={() => handleSkip(-10)}
                      className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <SkipBack size={18} />
                    </button>

                    {/* Skip forward */}
                    <button
                      onClick={() => handleSkip(10)}
                      className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <SkipForward size={18} />
                    </button>

                    {/* Tiempo */}
                    <span className="text-sm font-medium">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Velocidad */}
                    <select
                      value={playbackRate}
                      onChange={(e) => handlePlaybackRate(parseFloat(e.target.value))}
                      className="bg-transparent text-white text-sm cursor-pointer"
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
                      className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                    >
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>

                    {/* Fullscreen */}
                    <button
                      onClick={handleFullscreen}
                      className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                    >
                      {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Marcadores de tiempo */}
      {markers.length > 0 && (
        <div className="mt-4">
          <h4
            className="text-sm font-medium mb-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Marcadores
          </h4>
          <div className="flex flex-wrap gap-2">
            {markers.map((marker, idx) => (
              <button
                key={idx}
                onClick={() => goToMarker(marker.time)}
                className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <span className="font-mono mr-2">{formatTime(marker.time)}</span>
                {marker.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoRenderer;
