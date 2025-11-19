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

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Iniciar al montar
  useEffect(() => {
    logger.info('🎙️ VoiceRecorderSimple montado', 'VoiceRecorderSimple');
    startRecording();

    // Cleanup al desmontar
    return () => {
      logger.info('🔄 VoiceRecorderSimple desmontando', 'VoiceRecorderSimple');

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          logger.info('Cleanup: track stopped', 'VoiceRecorderSimple');
        });
      }

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      logger.info('Iniciando grabación...', 'VoiceRecorderSimple');

      // Pedir micrófono - configuración MÁS SIMPLE posible
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      logger.info('✅ Micrófono obtenido', 'VoiceRecorderSimple');

      // MediaRecorder - configuración MÁS SIMPLE posible
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          logger.info(`Chunk: ${e.data.size} bytes`, 'VoiceRecorderSimple');
        }
      };

      mediaRecorder.onstop = () => {
        logger.info('MediaRecorder stopped', 'VoiceRecorderSimple');

        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);

          setAudioBlob(blob);
          setAudioUrl(url);

          logger.info(`✅ Audio creado: ${(blob.size / 1024).toFixed(2)} KB`, 'VoiceRecorderSimple');
        }
      };

      // Iniciar grabación
      mediaRecorder.start(1000);
      setIsRecording(true);

      logger.info('🔴 Grabando...', 'VoiceRecorderSimple');

      // Timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);

    } catch (error) {
      logger.error('Error:', error, 'VoiceRecorderSimple');
      alert('Error al acceder al micrófono');
      onCancel();
    }
  };

  const stopRecording = () => {
    logger.info('Deteniendo grabación...', 'VoiceRecorderSimple');

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };

  const handleSend = () => {
    logger.info('📤 Enviando audio...', 'VoiceRecorderSimple');

    // Detener stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        logger.info('Track stopped before send', 'VoiceRecorderSimple');
      });
      streamRef.current = null;
    }

    // Enviar
    if (audioBlob) {
      onSend(audioBlob, recordingTime);
    }
  };

  const handleCancel = () => {
    logger.info('❌ Cancelando...', 'VoiceRecorderSimple');

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

  return (
    <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
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
            <BaseButton
              onClick={stopRecording}
              variant="warning"
              size="sm"
              icon={Square}
              title="Detener"
            >
              Detener
            </BaseButton>
          ) : audioBlob ? (
            <>
              <BaseButton
                onClick={handleSend}
                variant="success"
                size="sm"
                icon={Send}
                title="Enviar"
              >
                Enviar
              </BaseButton>

              <audio controls src={audioUrl} className="h-10" />
            </>
          ) : null}

          <BaseButton
            onClick={handleCancel}
            variant="danger"
            size="sm"
            icon={X}
            title="Cancelar"
          >
            Cancelar
          </BaseButton>
        </div>
      </div>
    </div>
  );
}

export default VoiceRecorderSimple;
