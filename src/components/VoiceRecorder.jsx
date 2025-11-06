/**
 * @fileoverview Voice Recorder Component
 * @module components/VoiceRecorder
 */

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, X, Play, Pause } from 'lucide-react';
import './VoiceRecorder.css';

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

  useEffect(() => {
    startRecording();
    return () => {
      stopTimer();
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

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

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
      onCancel();
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
      onSend(audioBlob, recordingTime);
    }
  };

  return (
    <div className="voice-recorder">
      <div className="voice-recorder-content">
        {/* Recording indicator */}
        <div className={`recording-indicator ${isRecording ? 'active' : ''}`}>
          <Mic size={20} />
        </div>

        {/* Timer */}
        <div className="recording-timer">
          {formatTime(recordingTime)}
        </div>

        {/* Waveform visualization (simplified) */}
        <div className="recording-waveform">
          {isRecording && !isPaused && (
            <>
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="recording-controls">
          {isRecording ? (
            <>
              {isPaused ? (
                <button
                  className="control-btn resume"
                  onClick={resumeRecording}
                  title="Reanudar"
                >
                  <Play size={20} />
                </button>
              ) : (
                <button
                  className="control-btn pause"
                  onClick={pauseRecording}
                  title="Pausar"
                >
                  <Pause size={20} />
                </button>
              )}

              <button
                className="control-btn stop"
                onClick={stopRecording}
                title="Detener"
              >
                <Square size={20} />
              </button>
            </>
          ) : audioBlob ? (
            <>
              <button
                className="control-btn play"
                onClick={togglePlayback}
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>

              <audio
                ref={audioPlayerRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                style={{ display: 'none' }}
              />

              <button
                className="control-btn send"
                onClick={handleSend}
                title="Enviar"
              >
                <Send size={20} />
              </button>
            </>
          ) : null}

          <button
            className="control-btn cancel"
            onClick={onCancel}
            title="Cancelar"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoiceRecorder;
