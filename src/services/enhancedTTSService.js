/**
 * @fileoverview Enhanced TTS service with multiple providers
 * Supports: Web Speech API, Edge TTS (premium quality, free)
 * @module services/enhancedTTSService
 */

import logger from '../utils/logger';

class EnhancedTTSService {
  constructor() {
    this.provider = 'webspeech'; // 'webspeech' | 'edge'
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.defaultVoice = null;
    this.edgeVoices = [
      { name: 'es-AR-ElenaNeural', lang: 'es-AR', gender: 'Female', quality: 'premium' },
      { name: 'es-AR-TomasNeural', lang: 'es-AR', gender: 'Male', quality: 'premium' },
      { name: 'es-MX-DaliaNeural', lang: 'es-MX', gender: 'Female', quality: 'premium' },
      { name: 'es-MX-JorgeNeural', lang: 'es-MX', gender: 'Male', quality: 'premium' },
      { name: 'es-ES-ElviraNeural', lang: 'es-ES', gender: 'Female', quality: 'premium' }
    ];

    this.loadVoices();

    if (this.synth?.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  loadVoices() {
    this.voices = this.synth?.getVoices() || [];

    const spanishVoices = this.voices.filter(v => v.lang.startsWith('es'));
    const argentinaVoice = spanishVoices.find(v => v.lang === 'es-AR');
    const mexicanVoice = spanishVoices.find(v => v.lang === 'es-MX');
    const spanishVoice = spanishVoices.find(v => v.lang === 'es-ES');

    this.defaultVoice = argentinaVoice || mexicanVoice || spanishVoice || spanishVoices[0];

    if (this.defaultVoice) {
      logger.info('🎤 Voz TTS seleccionada:', this.defaultVoice.name, this.defaultVoice.lang);
    }
  }

  /**
   * Generate audio using Edge TTS (premium quality, free)
   * Uses Azure's Neural voices via unofficial API
   */
  async speakWithEdge(text, options = {}) {
    const {
      voice = 'es-AR-ElenaNeural',
      rate = 0.9,
      pitch = 1.0
    } = options;

    try {
      // Usar la API de Edge TTS a través de un servicio
      const apiUrl = 'https://api.streamelements.com/kappa/v2/speech';
      const params = new URLSearchParams({
        voice: voice,
        text: text
      });

      const response = await fetch(`${apiUrl}?${params}`);
      if (!response.ok) {
        throw new Error('Edge TTS API error');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      return audioUrl;
    } catch (err) {
      logger.error('Error con Edge TTS, fallback a Web Speech:', err);
      return null;
    }
  }

  /**
   * Speak text with automatic provider selection
   */
  async speak(text, options = {}) {
    const {
      voice = this.defaultVoice,
      rate = 0.9,
      pitch = 1.0,
      volume = 1.0,
      lang = 'es-AR',
      preferEdge = true
    } = options;

    // Try Edge TTS first if preferred
    if (preferEdge) {
      try {
        const audioUrl = await this.speakWithEdge(text, { rate, pitch });
        if (audioUrl) {
          return { type: 'edge', audioUrl };
        }
      } catch (err) {
        logger.warn('Edge TTS failed, using Web Speech');
      }
    }

    // Fallback to Web Speech API
    return new Promise((resolve, reject) => {
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      utterance.lang = lang;

      utterance.onend = () => {
        resolve({ type: 'webspeech', utterance });
      };

      utterance.onerror = (error) => {
        reject(error);
      };

      this.synth.speak(utterance);
    });
  }

  getSpanishVoices() {
    return this.voices.filter(v => v.lang.startsWith('es'));
  }

  getEdgeVoices() {
    return this.edgeVoices;
  }

  stop() {
    this.synth?.cancel();
  }

  pause() {
    if (this.synth?.speaking) {
      this.synth.pause();
    }
  }

  resume() {
    if (this.synth?.paused) {
      this.synth.resume();
    }
  }

  isAvailable() {
    return 'speechSynthesis' in window;
  }

  getVoiceInfo() {
    if (!this.defaultVoice) return null;

    return {
      name: this.defaultVoice.name,
      lang: this.defaultVoice.lang,
      default: this.defaultVoice.default,
      localService: this.defaultVoice.localService
    };
  }
}

const enhancedTTSService = new EnhancedTTSService();

export default enhancedTTSService;
