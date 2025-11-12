/**
 * @fileoverview Speech-to-Text Service using Web Speech API
 * @module services/SpeechToTextService
 */

import logger from '../utils/logger';

class SpeechToTextService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
  }

  /**
   * Check if Web Speech API is supported
   */
  isSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Initialize speech recognition
   */
  initialize(language = 'es-ES', continuous = false) {
    if (!this.isSupported()) {
      throw new Error('Web Speech API no está soportada en este navegador');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.lang = language;
    this.recognition.continuous = continuous;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    logger.info('SpeechToText initialized', 'SpeechToTextService');
  }

  /**
   * Start listening and return promise with transcription
   */
  listen() {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        this.initialize();
      }

      this.recognition.onstart = () => {
        this.isListening = true;
        logger.info('Speech recognition started', 'SpeechToTextService');
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;

        logger.info(`Transcription: "${transcript}" (confidence: ${confidence})`, 'SpeechToTextService');

        resolve({
          success: true,
          text: transcript,
          confidence: confidence
        });
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        logger.error('Speech recognition error', 'SpeechToTextService', event.error);

        let errorMessage = 'Error al reconocer voz';

        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No se detectó ninguna voz';
            break;
          case 'audio-capture':
            errorMessage = 'No se pudo acceder al micrófono';
            break;
          case 'not-allowed':
            errorMessage = 'Permiso de micrófono denegado';
            break;
          case 'network':
            errorMessage = 'Error de red';
            break;
          default:
            errorMessage = `Error: ${event.error}`;
        }

        reject({
          success: false,
          error: errorMessage,
          errorCode: event.error
        });
      };

      this.recognition.onend = () => {
        this.isListening = false;
        logger.info('Speech recognition ended', 'SpeechToTextService');
      };

      try {
        this.recognition.start();
      } catch (error) {
        logger.error('Error starting recognition', 'SpeechToTextService', error);
        reject({
          success: false,
          error: 'No se pudo iniciar el reconocimiento de voz'
        });
      }
    });
  }

  /**
   * Stop listening
   */
  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Abort listening
   */
  abort() {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
      this.isListening = false;
    }
  }

  /**
   * Get listening status
   */
  getStatus() {
    return {
      isListening: this.isListening,
      isSupported: this.isSupported()
    };
  }
}

export default new SpeechToTextService();
