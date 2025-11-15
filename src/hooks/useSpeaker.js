/**
 * useSpeaker Hook
 * Custom hook for text-to-speech using Web Speech API (browser native)
 * Fast, free, and works offline - no API keys or external services needed
 */

import { useState, useCallback } from 'react';
import logger from '../utils/logger';

/**
 * Hook for speaking text with TTS using Web Speech API
 * @returns {Object} Speaker utilities
 */
export function useSpeaker() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [lastSpoken, setLastSpoken] = useState(null);

  /**
   * Stop current speech synthesis
   */
  const stopAudio = useCallback(() => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      logger.info('⏹️ Speech cancelled', 'useSpeaker');
    }
  }, []);

  /**
   * Get available voices, waiting for them to load if necessary
   * @returns {Promise<SpeechSynthesisVoice[]>} Array of available voices
   */
  const getVoices = useCallback(() => {
    return new Promise((resolve) => {
      let voices = window.speechSynthesis.getVoices();

      if (voices.length > 0) {
        resolve(voices);
        return;
      }

      // Voices not loaded yet, wait for voiceschanged event
      const voicesChangedHandler = () => {
        voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
          resolve(voices);
        }
      };

      window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler);

      // Fallback timeout in case voices never load
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
        resolve(window.speechSynthesis.getVoices());
      }, 1000);
    });
  }, []);

  /**
   * Speak text with TTS using Web Speech API (browser native)
   * @param {string} text - Text to speak
   * @param {Object} options - Speaking options
   * @param {string} options.voice - Voice ID (default: 'es-AR-female-1')
   * @param {number} options.rate - Speaking rate 0.5-2.0 (default: 1.0)
   * @param {boolean} options.preferPremium - Use ElevenLabs if available (default: false)
   * @returns {Promise<Object>} Result with audio info
   */
  const speak = useCallback(async (text, options = {}) => {
    if (!text || !text.trim()) {
      throw new Error('No text provided for speaking');
    }

    const trimmedText = text.trim();
    const { rate = 1.0 } = options;

    // Stop any current playback
    stopAudio();

    setIsGenerating(true);
    setError(null);

    try {
      logger.info(`🔊 Speaking with Web Speech API: "${trimmedText.substring(0, 50)}..."`, 'useSpeaker');

      // Check if Web Speech API is available
      if (!window.speechSynthesis) {
        throw new Error('Web Speech API no está disponible en este navegador');
      }

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(trimmedText);
      utterance.lang = 'es-ES'; // Spanish
      utterance.rate = rate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Wait for voices to load and try to select a Spanish voice
      const voices = await getVoices();

      if (voices.length === 0) {
        logger.warn('⚠️ No hay voces disponibles en el navegador', 'useSpeaker');
      } else {
        // Log available voices for debugging (only first 3)
        logger.info(`🔍 Voces disponibles (${voices.length}): ${voices.slice(0, 3).map(v => `${v.name} (${v.lang})`).join(', ')}...`, 'useSpeaker');

        // Try to find Spanish voice (case insensitive search)
        const spanishVoice = voices.find(v => {
          const lang = (v.lang || '').toLowerCase();
          const name = (v.name || '').toLowerCase();
          return (
            lang.startsWith('es') ||
            lang === 'es' ||
            name.includes('spanish') ||
            name.includes('español') ||
            name.includes('espanol')
          );
        });

        if (spanishVoice) {
          utterance.voice = spanishVoice;
          logger.info(`📢 Using voice: ${spanishVoice.name} (${spanishVoice.lang})`, 'useSpeaker');
        } else {
          logger.info('ℹ️ No se encontró voz en español, usando voz predeterminada del sistema', 'useSpeaker');
        }
      }

      // Set up promise to wait for speech to complete
      return new Promise((resolve, reject) => {
        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsGenerating(false);
          logger.info('▶️ Speech started', 'useSpeaker');
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          logger.info('⏹️ Speech ended', 'useSpeaker');

          setLastSpoken({
            text: trimmedText,
            timestamp: new Date().toISOString(),
            cached: false,
            method: 'webspeech'
          });

          resolve({
            success: true,
            cached: false,
            method: 'webspeech'
          });
        };

        utterance.onerror = (e) => {
          logger.error('Speech error', e, 'useSpeaker');
          setError('Error al reproducir el audio');
          setIsSpeaking(false);
          setIsGenerating(false);
          reject(new Error(`Speech synthesis error: ${e.error}`));
        };

        // Speak
        window.speechSynthesis.speak(utterance);
      });

    } catch (err) {
      logger.error('Speaking error', err, 'useSpeaker');
      const errorMessage = err.message || 'Error al generar audio';
      setError(errorMessage);
      setIsGenerating(false);
      setIsSpeaking(false);
      throw err;
    }
  }, [stopAudio, getVoices]);

  /**
   * Clear speaking error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset speaker state
   */
  const reset = useCallback(() => {
    stopAudio();
    setIsGenerating(false);
    setError(null);
    setLastSpoken(null);
  }, [stopAudio]);

  /**
   * Replay last spoken text
   */
  const replay = useCallback(() => {
    if (lastSpoken) {
      return speak(lastSpoken.text);
    }
  }, [lastSpoken, speak]);

  return {
    speak,
    stopAudio,
    replay,
    isSpeaking,
    isGenerating,
    error,
    lastSpoken,
    clearError,
    reset
  };
}

export default useSpeaker;
