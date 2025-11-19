/**
 * @fileoverview Voice Recorder ULTRA SIMPLE
 * SIN complicaciones - solo lo básico que funcione
 */

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, X, Play, Pause } from 'lucide-react';
import logger from '../utils/logger';
import { BaseButton } from './common';

// Componente de preview de audio SIMPLE
function AudioPreview({ audioUrl, duration }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.currentTime && isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      // IMPORTANTE: verificar que duration sea válido antes de usar
      if (audio.duration && isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
      } else if (duration && isFinite(duration)) {
        // Fallback al duration pasado como prop
        setAudioDuration(duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    // Intentar cargar metadata inmediatamente
    if (audio.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [duration]);

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
    if (!audio || !audioDuration || !isFinite(audioDuration)) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * audioDuration;

    if (isFinite(newTime)) {
      audio.currentTime = newTime;
    }
  };

  const formatTime = (seconds) => {
    // ARREGLO DEL NaN: verificar que sea un número válido
    if (!seconds || !isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (audioDuration > 0 && isFinite(audioDuration))
    ? (currentTime / audioDuration) * 100
    : 0;

  return (
    <div className="flex items-center gap-2 w-full">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <button
        onClick={togglePlayPause}
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all bg-blue-600 hover:bg-blue-700 text-white"
        title={isPlaying ? 'Pausar' : 'Reproducir'}
      >
        {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <div
          className="h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full cursor-pointer overflow-hidden"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-blue-600 rounded-full"
            style={{ width: `${progress}%`, transition: 'width 0.05s linear' }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
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
    <div className="p-3 bg-white dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
      <div className="flex flex-wrap items-center gap-3">
        {/* Timer pequeño */}
        <div className={`text-sm font-mono ${isRecording ? 'text-red-600' : 'text-zinc-600 dark:text-zinc-400'}`}>
          {formatTime(recordingTime)}
        </div>

        {/* Preview de audio cuando está listo */}
        {!isRecording && audioBlob && (
          <div className="flex-1 min-w-0">
            <AudioPreview audioUrl={audioUrl} duration={recordingTime} />
          </div>
        )}

        {/* Spacer cuando no hay preview */}
        {(isRecording || !audioBlob) && <div className="flex-1"></div>}

        {/* Botones - SOLO ICONOS */}
        <div className="flex gap-2 flex-shrink-0">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-all"
              title="Detener"
            >
              <Square size={16} />
            </button>
          ) : audioBlob ? (
            <button
              onClick={handleSend}
              className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all"
              title="Enviar"
            >
              <Send size={16} />
            </button>
          ) : null}

          <button
            onClick={handleCancel}
            className="w-9 h-9 rounded-full bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 flex items-center justify-center transition-all"
            title="Cancelar"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoiceRecorderSimple;
