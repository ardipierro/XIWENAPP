/**
 * @fileoverview Game Sound Effects using Web Audio API
 * @module utils/gameSounds
 *
 * Genera sonidos programáticamente sin necesidad de archivos externos.
 * Incluye: feedback correcto/incorrecto, countdown, y fanfarrias de finalización.
 */

// AudioContext singleton
let audioContext = null;

/**
 * Obtiene o crea el AudioContext
 * @returns {AudioContext}
 */
function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (required by browsers after user interaction)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Reproduce un tono simple
 * @param {number} frequency - Frecuencia en Hz
 * @param {number} duration - Duración en segundos
 * @param {string} type - Tipo de onda: 'sine', 'square', 'sawtooth', 'triangle'
 * @param {number} volume - Volumen (0-1)
 * @param {number} decay - Tiempo de decay (0-1 de duration)
 */
function playTone(frequency, duration = 0.2, type = 'sine', volume = 0.3, decay = 0.8) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration * decay);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
}

/**
 * Reproduce una secuencia de tonos
 * @param {Array<{freq: number, dur: number, delay: number}>} notes
 * @param {string} type
 * @param {number} volume
 */
function playSequence(notes, type = 'sine', volume = 0.3) {
  notes.forEach(({ freq, dur, delay }) => {
    setTimeout(() => {
      playTone(freq, dur, type, volume);
    }, delay * 1000);
  });
}

// ============================================
// SONIDOS DE FEEDBACK
// ============================================

/**
 * Sonido de respuesta correcta - tono ascendente alegre
 */
export function playCorrectSound() {
  playSequence([
    { freq: 523, dur: 0.1, delay: 0 },      // C5
    { freq: 659, dur: 0.15, delay: 0.08 },  // E5
    { freq: 784, dur: 0.2, delay: 0.16 },   // G5
  ], 'sine', 0.25);
}

/**
 * Sonido de respuesta incorrecta - buzzer suave
 */
export function playIncorrectSound() {
  playTone(200, 0.25, 'sawtooth', 0.15, 0.9);
}

// ============================================
// SONIDOS DE COUNTDOWN
// ============================================

/**
 * Beep normal del timer
 */
export function playTimerBeep() {
  playTone(880, 0.08, 'sine', 0.2);
}

/**
 * Beep de advertencia (tiempo bajo)
 */
export function playTimerWarningBeep() {
  playTone(1047, 0.1, 'square', 0.2); // C6
}

/**
 * Beep urgente (últimos segundos)
 */
export function playTimerUrgentBeep() {
  playSequence([
    { freq: 1047, dur: 0.08, delay: 0 },
    { freq: 1319, dur: 0.08, delay: 0.1 },
  ], 'square', 0.25);
}

/**
 * Sonido de tiempo agotado
 */
export function playTimeUpSound() {
  playSequence([
    { freq: 523, dur: 0.15, delay: 0 },
    { freq: 392, dur: 0.15, delay: 0.15 },
    { freq: 330, dur: 0.3, delay: 0.3 },
  ], 'sawtooth', 0.2);
}

// ============================================
// SONIDOS DE FINALIZACIÓN
// ============================================

/**
 * Fanfarria perfecta (90-100%)
 */
export function playPerfectSound() {
  playSequence([
    { freq: 523, dur: 0.15, delay: 0 },     // C5
    { freq: 659, dur: 0.15, delay: 0.12 },  // E5
    { freq: 784, dur: 0.15, delay: 0.24 },  // G5
    { freq: 1047, dur: 0.4, delay: 0.36 },  // C6
  ], 'sine', 0.3);

  // Añadir armonía
  setTimeout(() => {
    playSequence([
      { freq: 392, dur: 0.5, delay: 0 },    // G4
      { freq: 523, dur: 0.5, delay: 0 },    // C5 (chord)
    ], 'triangle', 0.15);
  }, 360);
}

/**
 * Sonido de buen trabajo (70-89%)
 */
export function playGoodSound() {
  playSequence([
    { freq: 523, dur: 0.15, delay: 0 },     // C5
    { freq: 659, dur: 0.15, delay: 0.12 },  // E5
    { freq: 784, dur: 0.25, delay: 0.24 },  // G5
  ], 'sine', 0.25);
}

/**
 * Sonido neutral (50-69%)
 */
export function playOkaySound() {
  playSequence([
    { freq: 440, dur: 0.15, delay: 0 },     // A4
    { freq: 523, dur: 0.2, delay: 0.12 },   // C5
  ], 'sine', 0.2);
}

/**
 * Sonido de intentar de nuevo (<50%)
 */
export function playTryAgainSound() {
  playSequence([
    { freq: 392, dur: 0.15, delay: 0 },     // G4
    { freq: 349, dur: 0.15, delay: 0.12 },  // F4
    { freq: 330, dur: 0.25, delay: 0.24 },  // E4
  ], 'triangle', 0.2);
}

/**
 * Reproduce el sonido de finalización según el porcentaje
 * @param {number} percentage - Porcentaje de acierto (0-100)
 */
export function playCompletionSound(percentage) {
  if (percentage >= 90) {
    playPerfectSound();
  } else if (percentage >= 70) {
    playGoodSound();
  } else if (percentage >= 50) {
    playOkaySound();
  } else {
    playTryAgainSound();
  }
}

// ============================================
// SONIDOS DE OVERTIME
// ============================================

/**
 * Sonido de penalización por overtime
 */
export function playPenaltySound() {
  playSequence([
    { freq: 300, dur: 0.1, delay: 0 },
    { freq: 250, dur: 0.15, delay: 0.08 },
  ], 'sawtooth', 0.2);
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Sonido de click/selección genérico
 */
export function playClickSound() {
  playTone(600, 0.05, 'sine', 0.15);
}

/**
 * Sonido de hint/pista
 */
export function playHintSound() {
  playSequence([
    { freq: 880, dur: 0.08, delay: 0 },
    { freq: 1100, dur: 0.1, delay: 0.08 },
  ], 'sine', 0.15);
}

/**
 * Pre-inicializa el audio context (llamar después de interacción del usuario)
 */
export function initAudio() {
  getAudioContext();
}

/**
 * Obtiene el beep apropiado según el tiempo restante
 * @param {number} secondsRemaining
 * @returns {Function|null} La función de sonido a ejecutar, o null
 */
export function getTimerSound(secondsRemaining) {
  // Últimos 5 segundos: beep cada segundo
  if (secondsRemaining <= 5 && secondsRemaining > 0) {
    return playTimerUrgentBeep;
  }

  // 10-5 segundos: beep cada 2 segundos
  if (secondsRemaining <= 10 && secondsRemaining > 5) {
    if (secondsRemaining % 2 === 0) {
      return playTimerWarningBeep;
    }
  }

  // 15-10 segundos: beep cada 3 segundos
  if (secondsRemaining <= 15 && secondsRemaining > 10) {
    if (secondsRemaining % 3 === 0) {
      return playTimerBeep;
    }
  }

  // 30-15 segundos: beep cada 5 segundos
  if (secondsRemaining <= 30 && secondsRemaining > 15) {
    if (secondsRemaining % 5 === 0) {
      return playTimerBeep;
    }
  }

  return null;
}

export default {
  playCorrectSound,
  playIncorrectSound,
  playTimerBeep,
  playTimerWarningBeep,
  playTimerUrgentBeep,
  playTimeUpSound,
  playPerfectSound,
  playGoodSound,
  playOkaySound,
  playTryAgainSound,
  playCompletionSound,
  playPenaltySound,
  playClickSound,
  playHintSound,
  initAudio,
  getTimerSound
};
