/**
 * @fileoverview Voice Recorder Component
 * @module components/VoiceRecorder
 */

import { useState, useRef, useEffect } from 'react';
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

  useEffect(() => {
    startRecording();
    return () => {
      stopTimer();
      // Stop all media tracks to release microphone
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          logger.info('Stopped media track on cleanup', 'VoiceRecorder');
        });
        streamRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  /**
   * Start recording
   */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream; // Save stream reference

      // Try to use Opus codec with higher bitrate for better quality
      let options = { audioBitsPerSecond: 128000 };
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else {
        options.mimeType = 'audio/webm';
      }

      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);

        // Stop all tracks to release microphone immediately
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
            logger.info('Stopped media track after recording', 'VoiceRecorder');
          });
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
    } catch (error) {
      logger.error('Error starting recording:', error);
      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
      handleCancel();
    }
  };

  /**
   * Stop recording
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
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
   * Stop timer
   */
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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
      // Ensure stream is fully released before sending
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          logger.info('Stopped media track before send', 'VoiceRecorder');
        });
        streamRef.current = null;
      }
      onSend(audioBlob, recordingTime);
    }
  };

  /**
   * Handle cancel with cleanup
   */
  const handleCancel = () => {
    // Ensure stream is fully released when canceling
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        logger.info('Stopped media track on cancel', 'VoiceRecorder');
      });
      streamRef.current = null;
    }
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
