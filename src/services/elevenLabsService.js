/**
 * @fileoverview ElevenLabs TTS Service - Premium text-to-speech for FlashCards
 * @module services/elevenLabsService
 *
 * ⚠️ Usa credentialsHelper para leer la API key - NO modificar
 */

import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAICredentialSync } from '../utils/credentialsHelper';
import logger from '../utils/logger';

// Configuración de voces en español
const SPANISH_VOICES = {
  // Voces femeninas
  'bella': { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Femenina)', gender: 'female' },
  'domi': { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Femenina)', gender: 'female' },

  // Voces masculinas
  'adam': { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Masculino)', gender: 'male' },
  'antoni': { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Masculino)', gender: 'male' },

  // Voz neutral
  'rachel': { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Neutral)', gender: 'neutral' }
};

// Configuración por defecto
const DEFAULT_VOICE = 'bella';
const DEFAULT_MODEL = 'eleven_multilingual_v2'; // Mejor modelo para español

/**
 * Generar audio con ElevenLabs y subirlo a Firebase Storage
 * @param {string} text - Texto en español a convertir
 * @param {Object} options - Opciones de generación
 * @returns {Promise<{success: boolean, audioUrl?: string, error?: string}>}
 */
export async function generateFlashCardAudio(text, options = {}) {
  try {
    const {
      voiceId = DEFAULT_VOICE,
      collectionId = 'temp',
      cardId = Date.now(),
      stability = 0.5,
      similarityBoost = 0.75,
      style = 0.0,
      useSpeakerBoost = true
    } = options;

    // Obtener API key desde localStorage (configurada en AI Config)
    const apiKey = getElevenLabsApiKey();
    if (!apiKey) {
      throw new Error('API Key de ElevenLabs no configurada');
    }

    // Obtener voice ID real
    const voice = SPANISH_VOICES[voiceId] || SPANISH_VOICES[DEFAULT_VOICE];

    logger.info('Generating audio with ElevenLabs:', {
      text,
      voice: voice.name,
      model: DEFAULT_MODEL
    });

    // Llamar a ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text,
          model_id: DEFAULT_MODEL,
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            style,
            use_speaker_boost: useSpeakerBoost
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `ElevenLabs API error: ${response.status}`);
    }

    // Obtener audio blob
    const audioBlob = await response.blob();

    // Subir a Firebase Storage
    const timestamp = Date.now();
    const filename = `flashcards/${collectionId}/audio/${cardId}_${timestamp}.mp3`;
    const storageRef = ref(storage, filename);

    logger.info('Uploading audio to Firebase Storage:', filename);
    const snapshot = await uploadBytes(storageRef, audioBlob, {
      contentType: 'audio/mpeg'
    });

    const audioUrl = await getDownloadURL(snapshot.ref);

    logger.info('Audio generated and uploaded successfully:', audioUrl);
    return { success: true, audioUrl };

  } catch (error) {
    logger.error('Error generating ElevenLabs audio:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generar audio usando Web Speech API como fallback gratuito
 * @param {string} text - Texto a convertir
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export function generateFallbackAudio(text) {
  return new Promise((resolve) => {
    try {
      if (!('speechSynthesis' in window)) {
        throw new Error('Web Speech API no disponible');
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      // Intentar encontrar una voz en español
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(
        voice => voice.lang.startsWith('es') || voice.lang.startsWith('ES')
      );

      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }

      utterance.onend = () => {
        resolve({ success: true });
      };

      utterance.onerror = (error) => {
        logger.error('Web Speech API error:', error);
        resolve({ success: false, error: error.message });
      };

      window.speechSynthesis.speak(utterance);

    } catch (error) {
      logger.error('Error with fallback audio:', error);
      resolve({ success: false, error: error.message });
    }
  });
}

/**
 * Generar audio para todas las tarjetas de una colección
 * @param {Array} cards - Array de tarjetas
 * @param {string} collectionId - ID de la colección
 * @param {Function} onProgress - Callback de progreso (current, total)
 * @returns {Promise<Array>} - Tarjetas con audioUrl
 */
export async function generateCollectionAudio(cards, collectionId, onProgress) {
  const cardsWithAudio = [];

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];

    // Callback de progreso
    if (onProgress) {
      onProgress(i + 1, cards.length, card.spanish);
    }

    // Generar audio
    const result = await generateFlashCardAudio(card.spanish, {
      collectionId,
      cardId: card.id,
      voiceId: 'bella' // Por defecto voz femenina
    });

    cardsWithAudio.push({
      ...card,
      audioUrl: result.success ? result.audioUrl : null
    });

    // Pequeña pausa para no saturar la API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return cardsWithAudio;
}

/**
 * Obtener lista de voces disponibles
 * @returns {Array}
 */
export function getAvailableVoices() {
  return Object.entries(SPANISH_VOICES).map(([key, voice]) => ({
    id: key,
    name: voice.name,
    gender: voice.gender
  }));
}

/**
 * Obtener API key de ElevenLabs usando el helper centralizado
 * ⚠️ Usa getAICredentialSync de credentialsHelper - NO modificar
 * @returns {string|null}
 */
function getElevenLabsApiKey() {
  return getAICredentialSync('elevenlabs');
}

/**
 * Verificar si ElevenLabs está configurado
 * @returns {boolean}
 */
export function isElevenLabsConfigured() {
  return !!getElevenLabsApiKey();
}

export default {
  generateFlashCardAudio,
  generateFallbackAudio,
  generateCollectionAudio,
  getAvailableVoices,
  isElevenLabsConfigured
};
