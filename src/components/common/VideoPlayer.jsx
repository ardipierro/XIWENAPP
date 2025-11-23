/**
 * @fileoverview VideoPlayer component with HLS streaming support
 * @module components/common/VideoPlayer
 *
 * Supports:
 * - HLS streams (.m3u8) via hls.js or native Safari support
 * - Standard video files (mp4, webm, etc.)
 * - YouTube and Vimeo embeds (via iframe)
 * - Full PWA/iOS compatibility with proper audio
 */

import { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Detect if URL is an HLS stream
 * @param {string} url - Video URL
 * @returns {boolean}
 */
const isHlsUrl = (url) => {
  if (!url) return false;
  return url.includes('.m3u8') || url.includes('playlist.m3u8');
};

/**
 * Detect if URL is a YouTube video
 * @param {string} url - Video URL
 * @returns {boolean}
 */
const isYouTubeUrl = (url) => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

/**
 * Detect if URL is a Vimeo video
 * @param {string} url - Video URL
 * @returns {boolean}
 */
const isVimeoUrl = (url) => {
  if (!url) return false;
  return url.includes('vimeo.com');
};

/**
 * Extract YouTube video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string|null}
 */
const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Extract Vimeo video ID from URL
 * @param {string} url - Vimeo URL
 * @returns {string|null}
 */
const getVimeoId = (url) => {
  if (!url) return null;
  const regExp = /vimeo.*\/(\d+)/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

/**
 * VideoPlayer Component
 * Universal video player with HLS, native video, and embed support
 *
 * @param {Object} props
 * @param {string} props.src - Video source URL
 * @param {string} props.title - Video title (for accessibility)
 * @param {string} props.poster - Poster image URL
 * @param {boolean} props.autoPlay - Auto-play video (default: false)
 * @param {boolean} props.controls - Show native controls (default: true)
 * @param {boolean} props.muted - Start muted (default: false)
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onError - Error callback
 * @param {Function} props.onPlay - Play callback
 * @param {Function} props.onPause - Pause callback
 * @param {Function} props.onEnded - Ended callback
 */
function VideoPlayer({
  src,
  title = 'Video',
  poster,
  autoPlay = false,
  controls = true,
  muted = false,
  className = '',
  onError,
  onPlay,
  onPause,
  onEnded
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCustomControls, setShowCustomControls] = useState(false);

  // Cleanup HLS instance on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  // Initialize HLS or native video
  useEffect(() => {
    if (!src || !videoRef.current) return;

    const video = videoRef.current;
    setError(null);
    setIsLoading(true);

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Handle HLS streams
    if (isHlsUrl(src)) {
      // Check if browser supports HLS natively (Safari)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari/iOS)
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
          if (autoPlay) {
            video.play().catch(() => {
              // Autoplay blocked, show play button
              setShowCustomControls(true);
            });
          }
        });
      } else if (Hls.isSupported()) {
        // Use hls.js for other browsers
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          // Optimize for mobile
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000, // 60MB
        });

        hlsRef.current = hls;

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          if (autoPlay) {
            video.play().catch(() => {
              setShowCustomControls(true);
            });
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError('Error de red al cargar el video');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError('Error de media');
                hls.recoverMediaError();
                break;
              default:
                setError('Error fatal al reproducir el video');
                hls.destroy();
                break;
            }
            onError?.(data);
          }
        });
      } else {
        setError('Tu navegador no soporta reproducción de video HLS');
        setIsLoading(false);
      }
    } else {
      // Standard video file (mp4, webm, etc.)
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
      });
    }

    // Video event listeners
    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleError = (e) => {
      setError('Error al cargar el video');
      setIsLoading(false);
      onError?.(e);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [src, autoPlay, onError, onPlay, onPause, onEnded]);

  // Handle play/pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((err) => {
        setError('No se pudo reproducir el video');
      });
    }
  };

  // Handle mute toggle
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen?.() ||
        videoRef.current.webkitRequestFullscreen?.() ||
        videoRef.current.msRequestFullscreen?.();
    }
  };

  // Render YouTube embed
  if (isYouTubeUrl(src)) {
    const videoId = getYouTubeId(src);
    if (!videoId) {
      return (
        <div className={`aspect-video flex items-center justify-center bg-zinc-900 rounded-lg ${className}`}>
          <p className="text-red-500">URL de YouTube inválida</p>
        </div>
      );
    }

    return (
      <div className={`aspect-video w-full rounded-lg overflow-hidden bg-zinc-900 ${className}`}>
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  // Render Vimeo embed
  if (isVimeoUrl(src)) {
    const videoId = getVimeoId(src);
    if (!videoId) {
      return (
        <div className={`aspect-video flex items-center justify-center bg-zinc-900 rounded-lg ${className}`}>
          <p className="text-red-500">URL de Vimeo inválida</p>
        </div>
      );
    }

    return (
      <div className={`aspect-video w-full rounded-lg overflow-hidden bg-zinc-900 ${className}`}>
        <iframe
          width="100%"
          height="100%"
          src={`https://player.vimeo.com/video/${videoId}?byline=0&portrait=0`}
          title={title}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  // Render native/HLS video player
  return (
    <div className={`relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-900 ${className}`}>
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        muted={isMuted}
        controls={controls && !showCustomControls}
        playsInline
        webkit-playsinline="true"
        x-webkit-airplay="allow"
        title={title}
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4">
          <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
          <p className="text-red-500 text-center">{error}</p>
          <button
            onClick={() => {
              setError(null);
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
            className="mt-4 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Custom controls overlay (for autoplay blocked scenarios) */}
      {showCustomControls && !isPlaying && !error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <button
            onClick={togglePlay}
            className="w-20 h-20 flex items-center justify-center bg-white/90 rounded-full
                       hover:bg-white hover:scale-110 transition-all shadow-xl"
            aria-label="Reproducir"
          >
            <Play className="w-10 h-10 text-zinc-900 ml-1" />
          </button>
        </div>
      )}

      {/* Custom control bar (optional, for more control) */}
      {showCustomControls && isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent
                        flex items-center gap-3 opacity-0 hover:opacity-100 transition-opacity">
          <button
            onClick={togglePlay}
            className="p-2 text-white hover:text-zinc-300 transition-colors"
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            onClick={toggleMute}
            className="p-2 text-white hover:text-zinc-300 transition-colors"
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          <div className="flex-1" />

          <button
            onClick={toggleFullscreen}
            className="p-2 text-white hover:text-zinc-300 transition-colors"
            aria-label="Pantalla completa"
          >
            <Maximize size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
