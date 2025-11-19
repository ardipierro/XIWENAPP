/**
 * @fileoverview Voice Recorder Component
 * @module components/VoiceRecorder
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Send, X, Play, Pause } from 'lucide-react';
import logger from '../utils/logger';
import { BaseButton } from './common';

/**
 * Voice Recorder Component
 * @param {Object} props
 * @param {Function} props.onSend - Callback with audio blob and duration
 * @param {Function} props.onCancel - Callback to cancel recording
 */
function VoiceRecorder({ onSend, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const startTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);
  const streamRef = useRef(null);

  /**
   * Release media stream and free microphone
   */
  const releaseMediaStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        logger.info(`Stopped media track: ${track.kind}, readyState: ${track.readyState}`, 'VoiceRecorder');
      });
      streamRef.current = null;
      logger.info('Media stream released', 'VoiceRecorder');
    }
  }, []);

  /**
   * Stop timer
   */
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // CRITICAL CLEANUP: Release microphone immediately
      logger.info('VoiceRecorder unmounting - cleaning up...', 'VoiceRecorder');

      stopTimer();

      // Stop MediaRecorder first
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
          logger.info('MediaRecorder stopped during cleanup', 'VoiceRecorder');
        } catch (error) {
          logger.error('Error stopping MediaRecorder during cleanup', error, 'VoiceRecorder');
        }
      }

      // IMMEDIATELY stop all media tracks to release microphone
      releaseMediaStream();

      // Revoke object URL to free memory
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl, releaseMediaStream, stopTimer]);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    try {
      // Request high-quality audio with balanced constraints
      // Note: Some browsers don't support high sampleRate, so we use 'ideal'
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Use ideal instead of exact to allow browser flexibility
          sampleRate: { ideal: 48000 },
          sampleSize: { ideal: 16 },
          channelCount: 1 // Mono for voice
        }
      });
      streamRef.current = stream;

      // Log actual audio settings received
      const audioTrack = stream.getAudioTracks()[0];
      const settings = audioTrack.getSettings();
      logger.info(`Audio track settings: sampleRate=${settings.sampleRate}Hz, sampleSize=${settings.sampleSize}bit, channels=${settings.channelCount}`, 'VoiceRecorder');

      // Determine the best available audio codec with VERY high bitrate
      let options = { audioBitsPerSecond: 256000 }; // 256kbps for excellent quality

      // Try different codecs in order of preference
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
        logger.info('Using Opus codec (best for voice)', 'VoiceRecorder');
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
        logger.info('Using WebM', 'VoiceRecorder');
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        options.mimeType = 'audio/ogg;codecs=opus';
        logger.info('Using OGG Opus', 'VoiceRecorder');
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4';
        logger.info('Using MP4', 'VoiceRecorder');
      } else {
        logger.warn('No preferred audio format supported, using browser default', 'VoiceRecorder');
      }

      logger.info(`Creating MediaRecorder with bitrate: ${options.audioBitsPerSecond / 1000}kbps`, 'VoiceRecorder');

      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          logger.info(`Data chunk received: ${(event.data.size / 1024).toFixed(2)} KB`, 'VoiceRecorder');
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);

        const sizeKB = (blob.size / 1024).toFixed(2);
        const durationSec = recordingTime || 1;
        const bitrate = ((blob.size * 8) / durationSec / 1000).toFixed(0);
        logger.info(`Recording stopped: ${sizeKB}KB, ${durationSec}s, ~${bitrate}kbps actual bitrate, Type: ${mimeType}`, 'VoiceRecorder');

        // CRITICAL: Release microphone IMMEDIATELY
        releaseMediaStream();
      };

      mediaRecorder.onerror = (event) => {
        logger.error('MediaRecorder error:', event.error, 'VoiceRecorder');
        releaseMediaStream();
      };

      // Start recording with timeslice for better quality and data availability
      // Collect data every 1000ms instead of only at the end
      mediaRecorder.start(1000);
      setIsRecording(true);
      startTimer();

      logger.info('Recording started with timeslice=1000ms', 'VoiceRecorder');
    } catch (error) {
      logger.error('Error starting recording:', error, 'VoiceRecorder');
      releaseMediaStream(); // Make sure to clean up on error
      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
      onCancel(); // Use onCancel directly to avoid circular dependency
    }
  }, [recordingTime, releaseMediaStream, onCancel]);

  // Start recording on mount
  useEffect(() => {
    startRecording();
  }, [startRecording]);

  /**
   * Stop recording
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      logger.info('Stopping recording...', 'VoiceRecorder');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();

      // CRITICAL: Also release stream here as backup
      // onstop event might be delayed or not fire in some edge cases
      setTimeout(() => {
        if (streamRef.current) {
          logger.warn('Stream still active after stop - releasing now', 'VoiceRecorder');
          releaseMediaStream();
        }
      }, 500);
    }
  };

  /**
   * Pause recording
   */
  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      pausedTimeRef.current = Date.now();
      stopTimer();
    }
  };

  /**
   * Resume recording
   */
  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimeRef.current += Date.now() - pausedTimeRef.current;
      startTimer();
    }
  };

  /**
   * Start timer
   */
  const startTimer = () => {
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setRecordingTime(elapsed);

      // Auto-stop at 5 minutes
      if (elapsed >= 300) {
        stopRecording();
      }
    }, 1000);
  };


  /**
   * Format time
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Play/pause audio
   */
  const togglePlayback = () => {
    const player = audioPlayerRef.current;
    if (!player) return;

    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  /**
   * Handle send
   */
  const handleSend = () => {
    if (audioBlob) {
      logger.info('Sending audio message...', 'VoiceRecorder');

      // CRITICAL: Ensure stream is fully released before sending
      releaseMediaStream();

      // Stop MediaRecorder if still active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          logger.error('Error stopping MediaRecorder on send', error, 'VoiceRecorder');
        }
      }

      onSend(audioBlob, recordingTime);
    }
  };

  /**
   * Handle cancel with cleanup
   */
  const handleCancel = () => {
    logger.info('Canceling recording...', 'VoiceRecorder');

    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        logger.error('Error stopping MediaRecorder on cancel', error, 'VoiceRecorder');
      }
    }

    // CRITICAL: Ensure stream is fully released when canceling
    releaseMediaStream();

    stopTimer();

    onCancel();
  };

  return (
    <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 animate-[slideUp_0.3s_ease]">
      <div className="flex items-center gap-4">
        {/* Recording indicator */}
        <div className={`w-10 h-10 rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'} flex items-center justify-center transition-all duration-300`}>
          <Mic size={20} />
        </div>

        {/* Timer */}
        <div className="text-lg font-bold text-zinc-900 dark:text-zinc-50 min-w-[60px] font-mono">
          {formatTime(recordingTime)}
        </div>

        {/* Waveform visualization (simplified) */}
        <div className="flex-1 h-10 flex items-center justify-center gap-1">
          {isRecording && !isPaused && (
            <>
              <span className="w-1 bg-primary-900 rounded-sm animate-[wave_1s_ease-in-out_infinite] [animation-delay:0s]"></span>
              <span className="w-1 bg-primary-900 rounded-sm animate-[wave_1s_ease-in-out_infinite] [animation-delay:0.1s]"></span>
              <span className="w-1 bg-primary-900 rounded-sm animate-[wave_1s_ease-in-out_infinite] [animation-delay:0.2s]"></span>
              <span className="w-1 bg-primary-900 rounded-sm animate-[wave_1s_ease-in-out_infinite] [animation-delay:0.3s]"></span>
              <span className="w-1 bg-primary-900 rounded-sm animate-[wave_1s_ease-in-out_infinite] [animation-delay:0.4s]"></span>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {isRecording ? (
            <>
              <BaseButton
                onClick={isPaused ? resumeRecording : pauseRecording}
                variant="primary"
                size="sm"
                icon={isPaused ? Play : Pause}
                title={isPaused ? "Reanudar" : "Pausar"}
                className="!w-10 !h-10 !rounded-full !p-0"
              />

              <BaseButton
                onClick={stopRecording}
                variant="warning"
                size="sm"
                icon={Square}
                title="Detener"
                className="!w-10 !h-10 !rounded-full !p-0"
              />
            </>
          ) : audioBlob ? (
            <>
              <BaseButton
                onClick={togglePlayback}
                variant="primary"
                size="sm"
                icon={isPlaying ? Pause : Play}
                title={isPlaying ? 'Pausar' : 'Reproducir'}
                className="!w-10 !h-10 !rounded-full !p-0"
              />

              <audio
                ref={audioPlayerRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                style={{ display: 'none' }}
              />

              <BaseButton
                onClick={handleSend}
                variant="success"
                size="sm"
                icon={Send}
                title="Enviar"
                className="!w-10 !h-10 !rounded-full !p-0"
              />
            </>
          ) : null}

          <BaseButton
            onClick={handleCancel}
            variant="danger"
            size="sm"
            icon={X}
            title="Cancelar"
            className="!w-10 !h-10 !rounded-full !p-0"
          />
        </div>
      </div>
    </div>
  );
}

export default VoiceRecorder;
