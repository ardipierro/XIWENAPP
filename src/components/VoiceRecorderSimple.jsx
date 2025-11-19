/**
 * @fileoverview Voice Recorder ULTRA SIMPLE
 * SIN complicaciones - solo lo básico que funcione
 */

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, X, Play, Pause } from 'lucide-react';
import logger from '../utils/logger';
import { BaseButton } from './common';

// Componente de preview de audio - diseño consistente con el chat
function AudioPreview({ audioUrl, duration }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audioDuration;
  };

  const formatTime = (seconds) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg">
      <audio ref={audioRef} src={audioUrl} />

      <button
        onClick={togglePlayPause}
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          isPlaying
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500 text-zinc-700 dark:text-zinc-200'
        }`}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        <div
          className="h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full cursor-pointer overflow-hidden"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-blue-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>
    </div>
  );
}

function VoiceRecorderSimple({ onSend, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const isInitializedRef = useRef(false); // Prevenir doble inicialización

  // PRIMERO: Verificar que el componente se monta
  useEffect(() => {
    console.log('🎙️🎙️🎙️ VoiceRecorderSimple MONTADO 🎙️🎙️🎙️');
    console.log('onSend:', typeof onSend);
    console.log('onCancel:', typeof onCancel);

    // Prevenir doble inicialización (React StrictMode monta dos veces en desarrollo)
    if (isInitializedRef.current) {
      console.log('⚠️ Ya inicializado, saltando...');
      return;
    }

    isInitializedRef.current = true;
    startRecording();

    // Cleanup al desmontar
    return () => {
      console.log('🔄 VoiceRecorderSimple DESMONTANDO');

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Cleanup: track stopped');
        });
      }

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log('🔴 INICIANDO GRABACIÓN...');

      // Pedir micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      console.log('✅ MICRÓFONO OBTENIDO');

      // MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log(`📦 Chunk: ${e.data.size} bytes`);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('⏹️ MediaRecorder STOPPED');

        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);

          setAudioBlob(blob);
          setAudioUrl(url);

          console.log(`✅ AUDIO CREADO: ${(blob.size / 1024).toFixed(2)} KB`);
        }
      };

      // Iniciar grabación
      mediaRecorder.start(1000);
      setIsRecording(true);

      console.log('🔴 GRABANDO...');

      // Timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
        console.log(`⏱️ ${seconds}s`);
      }, 1000);

    } catch (error) {
      console.error('❌ ERROR:', error);
      setError(error.message);
      alert('Error al acceder al micrófono: ' + error.message);
    }
  };

  const stopRecording = () => {
    console.log('⏹️ DETENIENDO GRABACIÓN...');

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };

  const handleSend = () => {
    console.log('📤 ENVIANDO AUDIO...');

    // Detener stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped before send');
      });
      streamRef.current = null;
    }

    // Enviar
    if (audioBlob) {
      onSend(audioBlob, recordingTime);
    }
  };

  const handleCancel = () => {
    console.log('❌ CANCELANDO...');

    // Detener stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    onCancel();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mostrar error si hay
  if (error) {
    return (
      <div className="p-4 bg-red-100 border-t border-red-300">
        <p className="text-red-800 font-bold">ERROR: {error}</p>
        <button onClick={handleCancel} className="mt-2 px-4 py-2 bg-red-600 text-white rounded">
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 shadow-lg">
      <div className="flex items-center gap-4">
        {/* Indicador de grabación con animación */}
        <div className="relative">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording
              ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/50'
              : 'bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-600 dark:to-zinc-700'
          }`}>
            <Mic size={24} className="text-white" />
          </div>
          {isRecording && (
            <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
          )}
        </div>

        {/* Timer con diseño mejorado */}
        <div className="flex flex-col">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {isRecording ? 'Grabando...' : audioBlob ? 'Listo para enviar' : 'Preparando...'}
          </span>
          <span className="text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
            {formatTime(recordingTime)}
          </span>
        </div>

        {/* Spacer flexible */}
        <div className="flex-1"></div>

        {/* Preview de audio cuando está listo para enviar */}
        {!isRecording && audioBlob && (
          <div className="flex-1 max-w-md">
            <AudioPreview audioUrl={audioUrl} duration={recordingTime} />
          </div>
        )}

        {/* Botones con diseño mejorado */}
        <div className="flex gap-2">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="group relative px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <Square size={18} className="group-hover:scale-110 transition-transform" />
              Detener
            </button>
          ) : audioBlob ? (
            <button
              onClick={handleSend}
              className="group relative px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <Send size={18} className="group-hover:translate-x-0.5 transition-transform" />
              Enviar
            </button>
          ) : null}

          <button
            onClick={handleCancel}
            className="group relative px-6 py-3 bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 hover:from-zinc-300 hover:to-zinc-400 dark:hover:from-zinc-600 dark:hover:to-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <X size={18} className="group-hover:rotate-90 transition-transform" />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoiceRecorderSimple;
