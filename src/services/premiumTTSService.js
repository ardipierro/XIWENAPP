/**
 * @fileoverview Premium TTS service with ElevenLabs integration
 * Provides ultra-natural speech with Argentine accent
 * @module services/premiumTTSService
 */

import logger from '../utils/logger';

class PremiumTTSService {
  constructor() {
    this.apiKey = null; // Usuario puede configurar su key
    this.useElevenLabs = false;
    this.useFreeAPI = true; // Usar APIs gratuitas primero

    // Voices configuradas
    this.voices = {
      elevenLabs: {
        // Vos premium (requiere API key)
        'es-AR-female': 'EXAVITQu4vr4xnSDxMaL', // Sarah - puede entrenarse para argentino
        'es-AR-male': '21m00Tcm4TlvDq8ikWAM', // Rachel - voz neutral
      },
      free: {
        // API gratuita de Text-to-Speech
        'es-AR-female': 'es-AR-Standard-A',
        'es-AR-male': 'es-AR-Standard-B'
      }
    };

    this.fallbackVoice = {
      name: 'es-AR-Wavenet',
      provider: 'google-cloud'
    };
  }

  /**
   * Configura la API key de ElevenLabs (opcional)
   */
  setApiKey(key) {
    this.apiKey = key;
    this.useElevenLabs = !!key;
    logger.info('🔑 ElevenLabs API configurada');
  }

  /**
   * Genera audio usando ElevenLabs (mejor calidad, requiere API key)
   */
  async generateWithElevenLabs(text, voiceId = 'EXAVITQu4vr4xnSDxMaL') {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key no configurada');
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.5, // Más expresivo
              use_speaker_boost: true
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        type: 'elevenlabs',
        audioUrl,
        quality: 'premium'
      };
    } catch (err) {
      logger.error('❌ Error con ElevenLabs:', err);
      throw err;
    }
  }

  /**
   * Genera audio usando API gratuita de TTS (buena calidad)
   * Usa VoiceRSS o similar
   */
  async generateWithFreeAPI(text, voice = 'es-AR') {
    try {
      // Usar VoiceRSS API (gratuita, buena calidad)
      const apiKey = 'demo'; // Usar 'demo' o solicitar key gratuita en voicerss.org
      const params = new URLSearchParams({
        key: apiKey,
        src: text,
        hl: voice,
        c: 'MP3',
        f: '44khz_16bit_stereo',
        ssml: 'false',
        b64: 'false'
      });

      const response = await fetch(`https://api.voicerss.org/?${params}`);

      if (!response.ok) {
        throw new Error('VoiceRSS API error');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        type: 'voicerss',
        audioUrl,
        quality: 'good'
      };
    } catch (err) {
      logger.error('❌ Error con VoiceRSS:', err);
      throw err;
    }
  }

  /**
   * Genera audio usando ResponsiveVoice (gratuito, decent quality)
   */
  async generateWithResponsiveVoice(text, voice = 'Spanish Latin American Female') {
    return new Promise((resolve, reject) => {
      try {
        // Cargar ResponsiveVoice si no está cargado
        if (!window.responsiveVoice) {
          const script = document.createElement('script');
          script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=lQxt0v1C';
          script.onload = () => {
            this.speakWithResponsiveVoice(text, voice, resolve, reject);
          };
          script.onerror = reject;
          document.head.appendChild(script);
        } else {
          this.speakWithResponsiveVoice(text, voice, resolve, reject);
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  speakWithResponsiveVoice(text, voice, resolve, reject) {
    try {
      window.responsiveVoice.speak(text, voice, {
        pitch: 1,
        rate: 0.9,
        volume: 1,
        onend: () => {
          resolve({
            type: 'responsivevoice',
            quality: 'decent',
            streaming: true
          });
        },
        onerror: reject
      });
    } catch (err) {
      reject(err);
    }
  }

  /**
   * Genera audio con el mejor proveedor disponible
   * Intenta en orden: ElevenLabs > VoiceRSS > ResponsiveVoice > Web Speech
   */
  async generateSpeech(text, options = {}) {
    const {
      gender = 'female',
      preferPremium = false
    } = options;

    // 1. Intentar ElevenLabs si está configurado
    if (preferPremium && this.useElevenLabs && this.apiKey) {
      try {
        logger.info('🎤 Generando con ElevenLabs (Premium)...');
        return await this.generateWithElevenLabs(text, this.voices.elevenLabs[`es-AR-${gender}`]);
      } catch (err) {
        logger.warn('⚠️ ElevenLabs falló, probando alternativas...');
      }
    }

    // 2. Intentar VoiceRSS (gratuito, buena calidad)
    if (this.useFreeAPI) {
      try {
        logger.info('🎤 Generando con VoiceRSS (Free, good quality)...');
        return await this.generateWithFreeAPI(text, 'es-ar');
      } catch (err) {
        logger.warn('⚠️ VoiceRSS falló, probando alternativas...');
      }
    }

    // 3. Intentar ResponsiveVoice
    try {
      logger.info('🎤 Generando con ResponsiveVoice...');
      const voiceName = gender === 'female'
        ? 'Spanish Latin American Female'
        : 'Spanish Latin American Male';
      return await this.generateWithResponsiveVoice(text, voiceName);
    } catch (err) {
      logger.warn('⚠️ ResponsiveVoice falló');
    }

    // 4. Fallback a Web Speech API
    logger.info('🎤 Usando Web Speech API (fallback)...');
    return {
      type: 'webspeech',
      quality: 'basic',
      text: text
    };
  }

  /**
   * Limpia recursos de audio
   */
  cleanup(audioUrl) {
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
  }
}

const premiumTTSService = new PremiumTTSService();

export default premiumTTSService;
