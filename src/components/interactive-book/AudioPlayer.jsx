/**
 * @fileoverview Reproductor de audio para el libro interactivo
 * @module components/interactive-book/AudioPlayer
 */

import logger from '../../utils/logger';
import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { BaseButton } from '../common';
import PropTypes from 'prop-types';

/**
 * Reproductor de audio simple con controles
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
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleEnded);
      audioRef.current.addEventListener('error', handleError);

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('ended', handleEnded);
          audioRef.current.removeEventListener('error', handleError);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      playAudio();
    }
  }, [autoPlay]);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
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
    if (onComplete) {
      onComplete();
    }
  };

  const handleError = (e) => {
    logger.error('Error loading audio:', e);
    setError('No se pudo cargar el audio');
    setIsPlaying(false);
  };

  const playAudio = async () => {
    try {
      if (audioRef.current) {
        await audioRef.current.play();
        setIsPlaying(true);
        if (onPlay) {
          onPlay();
        }
      }
    } catch (err) {
      logger.error('Error playing audio:', err);
      setError('Error al reproducir');
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
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
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      playAudio();
    }
  };

  const handleProgressClick = (e) => {
    if (audioRef.current) {
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

  // Fallback para URLs de audio de ejemplo
  const actualAudioUrl = audioUrl.startsWith('/audio/')
    ? `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3` // URL de ejemplo temporal
    : audioUrl;

  return (
    <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 ${className}`}>
      <audio ref={audioRef} src={actualAudioUrl} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* Controles */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            disabled={error !== null}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>

          <button
            onClick={toggleMute}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
          >
            {isMuted ? <VolumeX size={18} className="text-gray-600 dark:text-gray-400" /> : <Volume2 size={18} className="text-blue-600 dark:text-blue-400" />}
          </button>

          <button
            onClick={restart}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
          >
            <RotateCcw size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
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

      {/* Error */}
      {error && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
          {error} (Usando audio de demostración)
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
