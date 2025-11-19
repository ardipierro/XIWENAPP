/**
 * @fileoverview Voice Recorder ULTRA SIMPLE
 * SIN complicaciones - solo lo básico que funcione
 */

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, X } from 'lucide-react';
import logger from '../utils/logger';
import { BaseButton } from './common';

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

  // PRIMERO: Verificar que el componente se monta
  useEffect(() => {
    console.log('🎙️🎙️🎙️ VoiceRecorderSimple MONTADO 🎙️🎙️🎙️');
    console.log('onSend:', typeof onSend);
    console.log('onCancel:', typeof onCancel);

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
    <div className="p-4 bg-yellow-100 border-t-4 border-yellow-500">
      <div className="mb-2 text-center">
        <p className="text-2xl font-bold text-yellow-900">🎙️ GRABADOR DE VOZ 🎙️</p>
        <p className="text-sm text-yellow-800">VoiceRecorderSimple cargado correctamente</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Indicador */}
        <div className={`w-10 h-10 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-zinc-500'} flex items-center justify-center`}>
          <Mic size={20} className="text-white" />
        </div>

        {/* Timer */}
        <div className="text-lg font-mono font-bold">
          {formatTime(recordingTime)}
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Botones */}
        <div className="flex gap-2">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-orange-500 text-white rounded font-bold"
            >
              ⏹️ DETENER
            </button>
          ) : audioBlob ? (
            <>
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-green-500 text-white rounded font-bold"
              >
                📤 ENVIAR
              </button>

              <audio controls src={audioUrl} className="h-10" />
            </>
          ) : null}

          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-red-500 text-white rounded font-bold"
          >
            ❌ CANCELAR
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoiceRecorderSimple;
