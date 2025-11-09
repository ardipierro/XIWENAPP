/**
 * @fileoverview Text-to-Speech service using Web Speech API
 * Genera audio a partir de texto usando voces del navegador
 * @module services/ttsService
 */

import logger from '../utils/logger';

class TTSService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.defaultVoice = null;
    this.audioCache = new Map();

    // Cargar voces cuando estén disponibles
    this.loadVoices();

    // Las voces pueden tardar en cargar
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  /**
   * Carga las voces disponibles del navegador
   */
  loadVoices() {
    this.voices = this.synth.getVoices();

    // Buscar voces en español (preferir argentino, luego cualquier español)
    const spanishVoices = this.voices.filter(voice =>
      voice.lang.startsWith('es')
    );

    // Prioridad: es-AR > es-MX > es-ES > cualquier es
    const argentinaVoice = spanishVoices.find(v => v.lang === 'es-AR');
    const mexicanVoice = spanishVoices.find(v => v.lang === 'es-MX');
    const spanishVoice = spanishVoices.find(v => v.lang === 'es-ES');

    this.defaultVoice = argentinaVoice || mexicanVoice || spanishVoice || spanishVoices[0];

    if (this.defaultVoice) {
      logger.info('🎤 Voz TTS seleccionada:', this.defaultVoice.name, this.defaultVoice.lang);
    } else {
      logger.warn('⚠️ No se encontraron voces en español');
    }
  }

  /**
   * Obtiene todas las voces en español disponibles
   */
  getSpanishVoices() {
    return this.voices.filter(voice => voice.lang.startsWith('es'));
  }

  /**
   * Genera audio a partir de texto usando Web Speech API
   * @param {string} text - El texto a convertir en audio
   * @param {Object} options - Opciones de configuración
   * @returns {Promise<SpeechSynthesisUtterance>}
   */
  async speak(text, options = {}) {
    const {
      voice = this.defaultVoice,
      rate = 1.0,      // Velocidad (0.1 - 10)
      pitch = 1.0,     // Tono (0 - 2)
      volume = 1.0,    // Volumen (0 - 1)
      lang = 'es-AR'
    } = options;

    return new Promise((resolve, reject) => {
      // Cancelar cualquier audio anterior
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      utterance.lang = lang;

      utterance.onend = () => {
        logger.info('✅ TTS completado');
        resolve(utterance);
      };

      utterance.onerror = (error) => {
        logger.error('❌ Error en TTS:', error);
        reject(error);
      };

      this.synth.speak(utterance);
    });
  }

  /**
   * Detiene cualquier audio que se esté reproduciendo
   */
  stop() {
    this.synth.cancel();
  }

  /**
   * Pausa el audio actual
   */
  pause() {
    if (this.synth.speaking) {
      this.synth.pause();
    }
  }

  /**
   * Reanuda el audio pausado
   */
  resume() {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * Verifica si TTS está disponible
   */
  isAvailable() {
    return 'speechSynthesis' in window;
  }

  /**
   * Genera un blob de audio desde texto (experimental)
   * Nota: Web Speech API no permite exportar directamente a audio file
   * Esta es una limitación de la API del navegador
   */
  async textToAudioBlob(text, options = {}) {
    logger.warn('⚠️ Web Speech API no soporta exportar a archivo de audio');
    logger.info('💡 El audio se reproducirá directamente desde el navegador');
    return null;
  }

  /**
   * Obtiene información sobre la voz actual
   */
  getVoiceInfo() {
    if (!this.defaultVoice) {
      return null;
    }

    return {
      name: this.defaultVoice.name,
      lang: this.defaultVoice.lang,
      default: this.defaultVoice.default,
      localService: this.defaultVoice.localService
    };
  }
}

// Singleton instance
const ttsService = new TTSService();

export default ttsService;
