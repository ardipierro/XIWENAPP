/**
 * useSpeaker Hook
 * Custom hook for text-to-speech with caching
 * Uses configurable TTS provider (Edge TTS free or ElevenLabs premium) with automatic caching in Firebase Storage
 * Configuration loaded from Firebase (ai_config/global/functions/selection_speaker)
 */

import { useState, useCallback, useEffect } from 'react';
import logger from '../utils/logger';
import audioCacheService from '../services/audioCache';
import premiumTTSService from '../services/premiumTTSService';
import { getAIConfig } from '../firebase/aiConfig';

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
          provider: 'edgetts',
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
        logger.info('Using default selection speaker config', 'useSpeaker');
      }
    } catch (err) {
      logger.error('Error loading speaker config:', err, 'useSpeaker');
      // Use minimal default on error
      setConfig({
        enabled: true,
        provider: 'edgetts',
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
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsSpeaking(false);
    }
  }, [currentAudio]);

  /**
   * Get selected voice configuration
   */
  const getSelectedVoice = useCallback((voiceId = null) => {
    if (!config) return null;

    const selectedId = voiceId || config.selectedVoiceId;
    const provider = config.provider || 'edgetts';

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
   * Speak text with TTS and caching
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

    // Get voice configuration
    const voiceConfig = getSelectedVoice(options.voiceId);

    if (!voiceConfig) {
      throw new Error('No voice configuration found');
    }

    const provider = options.provider || config.provider || 'edgetts';
    const rate = options.rate || config.parameters?.rate || 1.0;

    // Stop any current playback
    stopAudio();

    setIsGenerating(true);
    setError(null);

    try {
      logger.info(`🔊 Speaking: "${trimmedText.substring(0, 50)}..." with voice: ${voiceConfig.name}`, 'useSpeaker');

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
    reset,
    config,
    configLoading,
    loadConfig,
    getSelectedVoice
  };
}

export default useSpeaker;
