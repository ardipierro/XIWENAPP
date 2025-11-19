/**
 * @fileoverview Voice Recorder Component V2 - Reescrito desde cero
 * @module components/VoiceRecorderV2
 *
 * SOLUCIONES IMPLEMENTADAS:
 * 1. useReducer para estado predecible y sincrónico
 * 2. Cleanup GARANTIZADO con Promise-based approach
 * 3. No unmount hasta que MediaRecorder termine completamente
 * 4. Configuración de audio conservadora y probada
 */

import { useReducer, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Send, X, Play, Pause } from 'lucide-react';
import logger from '../utils/logger';
import { BaseButton } from './common';

// Estados posibles del recorder
const RECORDER_STATES = {
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  RECORDING: 'recording',
  PAUSED: 'paused',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
  ERROR: 'error'
};

// Reducer para manejar estado del recorder
function recorderReducer(state, action) {
  switch (action.type) {
    case 'INIT_START':
      return { ...state, status: RECORDER_STATES.INITIALIZING };

    case 'INIT_SUCCESS':
      return { ...state, status: RECORDER_STATES.RECORDING, error: null };

    case 'INIT_ERROR':
      return { ...state, status: RECORDER_STATES.ERROR, error: action.error };

    case 'PAUSE':
      return { ...state, status: RECORDER_STATES.PAUSED };

    case 'RESUME':
      return { ...state, status: RECORDER_STATES.RECORDING };

    case 'STOP_START':
      return { ...state, status: RECORDER_STATES.STOPPING };

    case 'STOP_SUCCESS':
      return {
        ...state,
        status: RECORDER_STATES.STOPPED,
        audioBlob: action.blob,
        audioUrl: action.url
      };

    case 'UPDATE_TIME':
      return { ...state, recordingTime: action.time };

    case 'SET_PLAYING':
      return { ...state, isPlaying: action.value };

    default:
      return state;
  }
}

const initialState = {
  status: RECORDER_STATES.IDLE,
  recordingTime: 0,
  audioBlob: null,
  audioUrl: null,
  isPlaying: false,
  error: null
};

/**
 * Voice Recorder V2 Component
 */
function VoiceRecorderV2({ onSend, onCancel }) {
  const [state, dispatch] = useReducer(recorderReducer, initialState);

  // Refs para evitar race conditions
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);
  const audioPlayerRef = useRef(null);
  const isCleaningUpRef = useRef(false);
  const stopPromiseRef = useRef(null);

  /**
   * CRÍTICO: Cleanup completo y sincrónico del stream
   * Esta función DEBE ser llamada y ESPERADA antes de desmontar
   */
  const cleanupMediaStream = useCallback(() => {
    return new Promise((resolve) => {
      logger.info('🧹 Starting media stream cleanup...', 'VoiceRecorderV2');

      // Prevenir múltiples cleanups simultáneos
      if (isCleaningUpRef.current) {
        logger.warn('Cleanup already in progress, skipping', 'VoiceRecorderV2');
        resolve();
        return;
      }

      isCleaningUpRef.current = true;

      // 1. Detener el timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      // 2. Detener MediaRecorder si está activo
      const recorder = mediaRecorderRef.current;
      if (recorder) {
        if (recorder.state === 'recording' || recorder.state === 'paused') {
          logger.info('📹 Stopping MediaRecorder...', 'VoiceRecorderV2');

          // Esperar el evento onstop antes de continuar
          recorder.onstop = () => {
            logger.info('✅ MediaRecorder stopped', 'VoiceRecorderV2');

            // 3. Detener TODOS los tracks del stream
            if (streamRef.current) {
              const tracks = streamRef.current.getTracks();
              logger.info(`🎤 Stopping ${tracks.length} media tracks...`, 'VoiceRecorderV2');

              tracks.forEach((track, index) => {
                logger.info(`  Track ${index + 1}: ${track.kind} (${track.readyState})`, 'VoiceRecorderV2');
                track.stop();
              });

              streamRef.current = null;
              logger.info('✅ All media tracks stopped', 'VoiceRecorderV2');
            }

            mediaRecorderRef.current = null;
            isCleaningUpRef.current = false;
            resolve();
          };

          recorder.stop();
        } else {
          logger.info('MediaRecorder already inactive', 'VoiceRecorderV2');

          // Aún así detener los tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }

          isCleaningUpRef.current = false;
          resolve();
        }
      } else {
        // No hay recorder, solo detener tracks si existen
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        isCleaningUpRef.current = false;
        resolve();
      }
    });
  }, []);

  /**
   * Inicializar y comenzar grabación
   */
  const startRecording = useCallback(async () => {
    try {
      dispatch({ type: 'INIT_START' });
      logger.info('🎙️ Requesting microphone access...', 'VoiceRecorderV2');

      // Configuración CONSERVADORA que funciona en todos los navegadores
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Configuración minimalista - dejar que el navegador use defaults
          echoCancellation: true,   // Activado para mejor calidad en llamadas
          noiseSuppression: true,   // Activado para reducir ruido de fondo
          autoGainControl: true,    // Activado para volumen consistente
          // NO especificar sampleRate - el navegador lo ignora de todos modos
        }
      });

      streamRef.current = stream;
      logger.info('✅ Microphone access granted', 'VoiceRecorderV2');

      // Configuración del MediaRecorder
      // Chrome limita a 128kbps, así que no tiene sentido pedir más
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000  // 128kbps es el máximo efectivo en Chrome
      };

      // Verificar soporte
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        logger.warn('audio/webm;codecs=opus not supported, falling back to audio/webm', 'VoiceRecorderV2');
        options.mimeType = 'audio/webm';
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          logger.debug(`📦 Chunk received: ${event.data.size} bytes`, 'VoiceRecorderV2');
        }
      };

      mediaRecorder.onstop = () => {
        logger.info('🎬 MediaRecorder onstop fired', 'VoiceRecorderV2');

        // Solo procesar si hay chunks
        if (chunksRef.current.length > 0) {
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);

          logger.info(`✅ Audio blob created: ${(blob.size / 1024).toFixed(2)} KB`, 'VoiceRecorderV2');

          dispatch({
            type: 'STOP_SUCCESS',
            blob,
            url
          });
        }
      };

      mediaRecorder.onerror = (event) => {
        logger.error('MediaRecorder error:', event.error, 'VoiceRecorderV2');
        dispatch({ type: 'INIT_ERROR', error: event.error?.message || 'Error de grabación' });
      };

      // Iniciar grabación con timeslice de 1000ms (1 segundo)
      // Esto es más estable que 100ms y evita chunks demasiado pequeños
      mediaRecorder.start(1000);

      dispatch({ type: 'INIT_SUCCESS' });

      // Iniciar timer
      startTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        dispatch({ type: 'UPDATE_TIME', time: elapsed });

        // Auto-stop a los 5 minutos
        if (elapsed >= 300) {
          stopRecording();
        }
      }, 1000);

      logger.info('🔴 Recording started', 'VoiceRecorderV2');

    } catch (error) {
      logger.error('Failed to start recording:', error, 'VoiceRecorderV2');
      dispatch({
        type: 'INIT_ERROR',
        error: error.message || 'No se pudo acceder al micrófono'
      });

      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');

      // Cleanup en caso de error
      await cleanupMediaStream();
      onCancel();
    }
  }, [onCancel, cleanupMediaStream]);

  /**
   * Detener grabación
   */
  const stopRecording = useCallback(() => {
    if (state.status !== RECORDER_STATES.RECORDING && state.status !== RECORDER_STATES.PAUSED) {
      return;
    }

    logger.info('⏹️ Stopping recording...', 'VoiceRecorderV2');
    dispatch({ type: 'STOP_START' });

    const recorder = mediaRecorderRef.current;
    if (recorder && (recorder.state === 'recording' || recorder.state === 'paused')) {
      // Detener el timer inmediatamente
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      recorder.stop();
      // El onstop handler se encargará del resto
    }
  }, [state.status]);

  /**
   * Pausar grabación
   */
  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.pause();
      dispatch({ type: 'PAUSE' });

      pausedTimeRef.current = Date.now();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, []);

  /**
   * Reanudar grabación
   */
  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'paused') {
      recorder.resume();
      dispatch({ type: 'RESUME' });

      // Ajustar tiempo por pausa
      startTimeRef.current += (Date.now() - pausedTimeRef.current);

      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        dispatch({ type: 'UPDATE_TIME', time: elapsed });

        if (elapsed >= 300) {
          stopRecording();
        }
      }, 1000);
    }
  }, [stopRecording]);

  /**
   * Toggle audio playback
   */
  const togglePlayback = useCallback(() => {
    const player = audioPlayerRef.current;
    if (!player) return;

    if (state.isPlaying) {
      player.pause();
      dispatch({ type: 'SET_PLAYING', value: false });
    } else {
      player.play();
      dispatch({ type: 'SET_PLAYING', value: true });
    }
  }, [state.isPlaying]);

  /**
   * Enviar audio
   */
  const handleSend = useCallback(async () => {
    if (!state.audioBlob) return;

    logger.info('📤 Sending audio...', 'VoiceRecorderV2');

    // CRÍTICO: Esperar cleanup ANTES de enviar
    await cleanupMediaStream();

    // Ahora sí enviar
    onSend(state.audioBlob, state.recordingTime);
  }, [state.audioBlob, state.recordingTime, cleanupMediaStream, onSend]);

  /**
   * Cancelar
   */
  const handleCancel = useCallback(async () => {
    logger.info('❌ Cancelling recording...', 'VoiceRecorderV2');

    // CRÍTICO: Esperar cleanup ANTES de cancelar
    await cleanupMediaStream();

    // Revocar URL si existe
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }

    onCancel();
  }, [cleanupMediaStream, onCancel, state.audioUrl]);

  /**
   * Format time
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Iniciar al montar
   */
  useEffect(() => {
    startRecording();

    // Cleanup al desmontar
    return () => {
      logger.info('🔄 Component unmounting, cleaning up...', 'VoiceRecorderV2');

      // Ejecutar cleanup sincrónico
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }
    };
  }, []);

  // Mostrar error si hay
  if (state.status === RECORDER_STATES.ERROR) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
        <div className="text-red-600 dark:text-red-400 text-center">
          <p className="font-semibold">Error al grabar</p>
          <p className="text-sm">{state.error}</p>
          <BaseButton
            onClick={handleCancel}
            variant="danger"
            size="sm"
            className="mt-2"
          >
            Cerrar
          </BaseButton>
        </div>
      </div>
    );
  }

  const isRecording = state.status === RECORDER_STATES.RECORDING;
  const isPaused = state.status === RECORDER_STATES.PAUSED;
  const isStopped = state.status === RECORDER_STATES.STOPPED;

  return (
    <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 animate-[slideUp_0.3s_ease]">
      <div className="flex items-center gap-4">
        {/* Recording indicator */}
        <div className={`w-10 h-10 rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'} flex items-center justify-center transition-all duration-300`}>
          <Mic size={20} />
        </div>

        {/* Timer */}
        <div className="text-lg font-bold text-zinc-900 dark:text-zinc-50 min-w-[60px] font-mono">
          {formatTime(state.recordingTime)}
        </div>

        {/* Waveform visualization */}
        <div className="flex-1 h-10 flex items-center justify-center gap-1">
          {isRecording && (
            <>
              <span className="w-1 bg-primary-900 rounded-sm animate-[wave_1s_ease-in-out_infinite] [animation-delay:0s]" style={{ height: '20px' }}></span>
              <span className="w-1 bg-primary-900 rounded-sm animate-[wave_1s_ease-in-out_infinite] [animation-delay:0.1s]" style={{ height: '30px' }}></span>
              <span className="w-1 bg-primary-900 rounded-sm animate-[wave_1s_ease-in-out_infinite] [animation-delay:0.2s]" style={{ height: '40px' }}></span>
              <span className="w-1 bg-primary-900 rounded-sm animate-[wave_1s_ease-in-out_infinite] [animation-delay:0.3s]" style={{ height: '30px' }}></span>
              <span className="w-1 bg-primary-900 rounded-sm animate-[wave_1s_ease-in-out_infinite] [animation-delay:0.4s]" style={{ height: '20px' }}></span>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {(isRecording || isPaused) ? (
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
          ) : isStopped ? (
            <>
              <BaseButton
                onClick={togglePlayback}
                variant="primary"
                size="sm"
                icon={state.isPlaying ? Pause : Play}
                title={state.isPlaying ? 'Pausar' : 'Reproducir'}
                className="!w-10 !h-10 !rounded-full !p-0"
              />

              <audio
                ref={audioPlayerRef}
                src={state.audioUrl}
                onEnded={() => dispatch({ type: 'SET_PLAYING', value: false })}
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

export default VoiceRecorderV2;
