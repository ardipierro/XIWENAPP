/**
 * useSpeaker Hook
 * Custom hook for text-to-speech with caching
 * Uses Edge TTS (free) as primary provider with automatic caching in Firebase Storage
 */

import { useState, useCallback } from 'react';
import logger from '../utils/logger';
import audioCacheService from '../services/audioCache';
import premiumTTSService from '../services/premiumTTSService';

/**
 * Hook for speaking text with TTS and caching
 * @returns {Object} Speaker utilities
 */
export function useSpeaker() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [lastSpoken, setLastSpoken] = useState(null);

  /**
   * Stop current audio playback
   */
  const stopAudio = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsSpeaking(false);
    }
  }, [currentAudio]);

  /**
   * Speak text with TTS and caching
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
    const {
      voice = 'es-AR-female-1',
      rate = 1.0,
      preferPremium = false
    } = options;

    // Stop any current playback
    stopAudio();

    setIsGenerating(true);
    setError(null);

    try {
      logger.info(`🔊 Speaking: "${trimmedText.substring(0, 50)}..."`, 'useSpeaker');

      // Voice configuration for TTS
      const voiceConfig = {
        provider: preferPremium ? 'elevenlabs' : 'edgetts',
        voiceId: voice,
        rate: rate,
        volume: 1.0
      };

      // Use cache service to get or generate audio
      const result = await audioCacheService.getOrGenerateAudio(
        trimmedText,
        voiceConfig,
        'selection', // Context for text selection audios
        async () => {
          // This function only runs on cache MISS
          logger.info(`📢 Generating new audio with ${voiceConfig.provider}...`, 'useSpeaker');

          // Generate audio with premium TTS service
          const audioResult = await premiumTTSService.generateSpeech({
            text: trimmedText,
            voice: voice,
            rate: rate,
            preferPremium: preferPremium
          });

          return audioResult;
        }
      );

      logger.info(
        `${result.cached ? '✅ Cache HIT' : '🆕 Generated'} - Ready to play`,
        'useSpeaker'
      );

      // Create audio element and play
      const audio = new Audio(result.audioUrl);

      // Set up event listeners
      audio.addEventListener('play', () => {
        setIsSpeaking(true);
        logger.info('▶️ Audio playing', 'useSpeaker');
      });

      audio.addEventListener('ended', () => {
        setIsSpeaking(false);
        logger.info('⏹️ Audio ended', 'useSpeaker');
      });

      audio.addEventListener('error', (e) => {
        logger.error('Audio playback error', e, 'useSpeaker');
        setError('Error al reproducir el audio');
        setIsSpeaking(false);
      });

      // Play audio
      await audio.play();

      setCurrentAudio(audio);
      setLastSpoken({
        text: trimmedText,
        timestamp: new Date().toISOString(),
        cached: result.cached,
        hash: result.hash
      });

      setIsGenerating(false);

      return {
        success: true,
        cached: result.cached,
        audioUrl: result.audioUrl,
        hash: result.hash
      };

    } catch (err) {
      logger.error('Speaking error', err, 'useSpeaker');
      const errorMessage = err.message || 'Error al generar audio';
      setError(errorMessage);
      setIsGenerating(false);
      setIsSpeaking(false);
      throw err;
    }
  }, [stopAudio]);

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
