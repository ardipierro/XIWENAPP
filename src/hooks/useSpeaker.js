/**
 * useSpeaker Hook
 * Custom hook for text-to-speech with configurable providers and Web Speech API fallback
 * Uses configurable TTS provider (Edge TTS free or ElevenLabs premium) with automatic caching in Firebase Storage
 * Falls back to Web Speech API (browser native) if services fail or user not authenticated
 * Configuration loaded from Firebase (ai_config/global/functions/selection_speaker)
 */

import { useState, useCallback, useEffect } from 'react';
import logger from '../utils/logger';
import audioCacheService from '../services/audioCache';
import premiumTTSService from '../services/premiumTTSService';
import { getAIConfig } from '../firebase/aiConfig';
import { getAuth } from 'firebase/auth';

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
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);

  /**
   * Load configuration from Firebase on mount
   */
  useEffect(() => {
    loadConfig();
  }, []);

  /**
   * Load TTS configuration from Firebase
   */
  const loadConfig = useCallback(async () => {
    try {
      setConfigLoading(true);
      const aiConfig = await getAIConfig();

      // Get selection_speaker function config
      const speakerConfig = aiConfig?.functions?.selection_speaker;

      if (speakerConfig && speakerConfig.enabled) {
        setConfig(speakerConfig);
        logger.info('Selection speaker config loaded from Firebase', 'useSpeaker');
      } else {
        // Use default config if not found or disabled
        setConfig({
          enabled: true,
          provider: 'webspeech', // Default to Web Speech API (always available)
          selectedVoiceId: 'es-AR-female-1',
          parameters: {
            rate: 1.0
          },
          voices: {
            edgetts: [
              {
                id: 'es-AR-female-1',
                name: 'Elena (Argentina)',
                voiceId: 'es-AR-ElenaNeural',
                gender: 'female',
                isDefault: true
              }
            ]
          }
        });
        logger.info('Using default selection speaker config (Web Speech API)', 'useSpeaker');
      }
    } catch (err) {
      logger.error('Error loading speaker config:', err, 'useSpeaker');
      // Use minimal default on error (Web Speech API - always works)
      setConfig({
        enabled: true,
        provider: 'webspeech',
        selectedVoiceId: 'es-AR-female-1',
        parameters: { rate: 1.0 }
      });
    } finally {
      setConfigLoading(false);
    }
  }, []);

  /**
   * Stop current audio playback
   */
  const stopAudio = useCallback(() => {
    // Stop Web Speech API
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      logger.info('⏹️ Web Speech API cancelled', 'useSpeaker');
    }

    // Stop HTML5 audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsSpeaking(false);
      logger.info('⏹️ Audio stopped', 'useSpeaker');
    }
  }, [currentAudio]);

  /**
   * Get selected voice configuration
   */
  const getSelectedVoice = useCallback((voiceId = null) => {
    if (!config) return null;

    const selectedId = voiceId || config.selectedVoiceId;
    const provider = config.provider || 'webspeech';

    // Find voice in provider's voice list
    const voices = config.voices?.[provider] || [];
    const voice = voices.find(v => v.id === selectedId);

    if (voice) {
      return {
        ...voice,
        provider: provider
      };
    }

    // Fallback to first voice if not found
    return voices.length > 0 ? { ...voices[0], provider } : null;
  }, [config]);

  /**
   * Get available Web Speech API voices
   */
  const getWebSpeechVoices = useCallback(() => {
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
   * Speak with Web Speech API (fallback method)
   */
  const speakWithWebSpeech = useCallback(async (text, rate = 1.0) => {
    logger.info(`🔊 Using Web Speech API fallback: "${text.substring(0, 50)}..."`, 'useSpeaker');

    // Check if Web Speech API is available
    if (!window.speechSynthesis) {
      throw new Error('Web Speech API no está disponible en este navegador');
    }

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES'; // Spanish
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to select a Spanish voice
    const voices = await getWebSpeechVoices();

    if (voices.length > 0) {
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
      }
    }

    // Set up promise to wait for speech to complete
    return new Promise((resolve, reject) => {
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsGenerating(false);
        logger.info('▶️ Web Speech API started', 'useSpeaker');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        logger.info('⏹️ Web Speech API ended', 'useSpeaker');

        setLastSpoken({
          text: text,
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
        logger.error('Web Speech API error', e, 'useSpeaker');
        setIsSpeaking(false);
        setIsGenerating(false);
        reject(new Error(`Speech synthesis error: ${e.error}`));
      };

      // Speak
      window.speechSynthesis.speak(utterance);
    });
  }, [getWebSpeechVoices]);

  /**
   * Speak text with TTS (tries configured provider, falls back to Web Speech API)
   * @param {string} text - Text to speak
   * @param {Object} options - Speaking options (optional, overrides config)
   * @param {string} options.voiceId - Voice ID to use (overrides config)
   * @param {number} options.rate - Speaking rate 0.5-2.0 (overrides config)
   * @param {string} options.provider - Provider to use (overrides config)
   * @returns {Promise<Object>} Result with audio info
   */
  const speak = useCallback(async (text, options = {}) => {
    if (!text || !text.trim()) {
      throw new Error('No text provided for speaking');
    }

    // Wait for config to load
    if (configLoading) {
      logger.info('Waiting for config to load...', 'useSpeaker');
      await new Promise(resolve => {
        const checkConfig = setInterval(() => {
          if (!configLoading) {
            clearInterval(checkConfig);
            resolve();
          }
        }, 100);
      });
    }

    if (!config || !config.enabled) {
      throw new Error('Selection speaker is not enabled in configuration');
    }

    const trimmedText = text.trim();
    const rate = options.rate || config.parameters?.rate || 1.0;
    const provider = options.provider || config.provider || 'webspeech';

    // Stop any current playback
    stopAudio();

    setIsGenerating(true);
    setError(null);

    // If provider is webspeech, use it directly
    if (provider === 'webspeech') {
      try {
        return await speakWithWebSpeech(trimmedText, rate);
      } catch (err) {
        logger.error('Web Speech API error:', err, 'useSpeaker');
        setError(err.message || 'Error al generar audio con Web Speech API');
        setIsGenerating(false);
        throw err;
      }
    }

    // Try configured provider (Edge TTS or ElevenLabs) with cache
    try {
      // Get voice configuration
      const voiceConfig = getSelectedVoice(options.voiceId);

      if (!voiceConfig) {
        logger.warn('No voice config found, falling back to Web Speech API', 'useSpeaker');
        return await speakWithWebSpeech(trimmedText, rate);
      }

      logger.info(`🔊 Speaking: "${trimmedText.substring(0, 50)}..." with voice: ${voiceConfig.name}`, 'useSpeaker');

      // Check if user is authenticated (required for Firebase Storage)
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        logger.warn('⚠️ User not authenticated, falling back to Web Speech API', 'useSpeaker');
        return await speakWithWebSpeech(trimmedText, rate);
      }

      // Build voice configuration for TTS service
      const ttsVoiceConfig = {
        provider: provider,
        voiceId: voiceConfig.voiceId,
        rate: rate,
        volume: 1.0,
        // ElevenLabs specific parameters
        ...(provider === 'elevenlabs' && config.parameters && {
          stability: config.parameters.stability,
          similarity_boost: config.parameters.similarity_boost,
          style: config.parameters.style,
          use_speaker_boost: config.parameters.use_speaker_boost
        })
      };

      // Use cache service to get or generate audio
      const result = await audioCacheService.getOrGenerateAudio(
        trimmedText,
        ttsVoiceConfig,
        'selection', // Context for text selection audios
        async () => {
          // This function only runs on cache MISS
          logger.info(`📢 Generating new audio with ${provider}...`, 'useSpeaker');

          // Generate audio with premium TTS service
          const audioResult = await premiumTTSService.generateSpeech({
            text: trimmedText,
            voice: voiceConfig.voiceId,
            rate: rate,
            preferPremium: provider === 'elevenlabs'
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
        setIsGenerating(false);
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
        setIsGenerating(false);
      });

      // Play audio
      try {
        await audio.play();
      } catch (playError) {
        logger.error('Audio play() failed, trying Web Speech API fallback:', playError, 'useSpeaker');
        // If audio playback fails, fallback to Web Speech API
        return await speakWithWebSpeech(trimmedText, rate);
      }

      setCurrentAudio(audio);
      setLastSpoken({
        text: trimmedText,
        timestamp: new Date().toISOString(),
        cached: result.cached,
        hash: result.hash,
        provider: provider
      });

      setIsGenerating(false);

      return {
        success: true,
        cached: result.cached,
        audioUrl: result.audioUrl,
        hash: result.hash,
        provider: provider
      };

    } catch (err) {
      logger.error('TTS service error, falling back to Web Speech API:', err, 'useSpeaker');

      // Fallback to Web Speech API on any error
      try {
        return await speakWithWebSpeech(trimmedText, rate);
      } catch (fallbackErr) {
        logger.error('Web Speech API fallback also failed:', fallbackErr, 'useSpeaker');
        const errorMessage = fallbackErr.message || 'Error al generar audio';
        setError(errorMessage);
        setIsGenerating(false);
        setIsSpeaking(false);
        throw fallbackErr;
      }
    }
  }, [config, configLoading, stopAudio, getSelectedVoice, speakWithWebSpeech]);

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
    setCurrentAudio(null);
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
    reset,
    config,
    configLoading,
    loadConfig,
    getSelectedVoice
  };
}

export default useSpeaker;
