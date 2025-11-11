/**
 * @fileoverview Reproductor de diálogo completo
 * Reproduce todo el diálogo concatenado antes de ver línea por línea
 * @module components/interactive-book/FullDialoguePlayer
 */

import { useState, useRef } from 'react';
import { Play, Pause, Volume2, SkipForward, List } from 'lucide-react';
import PropTypes from 'prop-types';
import premiumTTSService from '../../services/premiumTTSService';
import ttsService from '../../services/ttsService';
import { BaseButton } from '../common';
import logger from '../../utils/logger';

/**
 * Reproductor de diálogo completo con TTS
 */
function FullDialoguePlayer({ dialogue, onComplete }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const isPlayingRef = useRef(false);

  const playFullDialogue = async () => {
    if (!dialogue || !dialogue.lines || dialogue.lines.length === 0) return;

    setIsPlaying(true);
    isPlayingRef.current = true;
    setCurrentLineIndex(0);
    setProgress(0);

    const totalLines = dialogue.lines.length;

    for (let i = 0; i < totalLines && isPlayingRef.current; i++) {
      const line = dialogue.lines[i];
      setCurrentLineIndex(i);
      setProgress(((i + 1) / totalLines) * 100);

      try {
        // Buscar el personaje en la lista de characters para obtener su voz
        const character = dialogue.characters?.find(c => c.id === line.character);
        const characterVoice = character?.voice || null;

        // Generar y reproducir cada línea con la voz del personaje
        const result = await premiumTTSService.generateSpeech(line.text, {
          voice: characterVoice,  // Usar voz específica del personaje
          gender: 'female',       // Fallback
          preferPremium: true     // Usar ElevenLabs si está configurado
        });

        if (result.audioUrl) {
          try {
            // Reproducir archivo de audio
            await playAudioFile(result.audioUrl);
            premiumTTSService.cleanup(result.audioUrl);
          } catch (audioError) {
            // Si falla el audio, hacer fallback a Web Speech
            logger.warn('Audio playback failed, falling back to Web Speech:', audioError);
            await ttsService.speak(line.text, {
              rate: 0.9,
              volume: 1.0
            });
          }
        } else {
          // Fallback a Web Speech
          await ttsService.speak(line.text, {
            rate: 0.9,
            volume: 1.0
          });
        }

        // Pequeña pausa entre líneas
        if (i < totalLines - 1 && isPlayingRef.current) {
          await sleep(500);
        }
      } catch (err) {
        logger.error('Error reproduciendo línea:', err);
        // Intentar continuar con la siguiente línea
      }
    }

    setIsPlaying(false);
    isPlayingRef.current = false;
    setProgress(100);

    if (onComplete) {
      onComplete();
    }
  };

  const playAudioFile = (audioUrl) => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audio.onended = resolve;
      audio.onerror = reject;
      audio.play().catch(reject);
    });
  };

  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  const stopPlayback = () => {
    isPlayingRef.current = false;
    ttsService.stop();
    setIsPlaying(false);
  };

  const skipToNextLine = () => {
    // Implementar skip (detener audio actual y pasar al siguiente)
    ttsService.stop();
  };

  return (
    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <List size={20} className="text-purple-600 dark:text-purple-400" />
          <h4 className="text-md font-semibold text-purple-900 dark:text-purple-100">
            Escuchar Diálogo Completo
          </h4>
        </div>
        <div className="text-xs text-purple-700 dark:text-purple-300">
          {dialogue?.lines?.length || 0} líneas
        </div>
      </div>

      {/* Línea actual */}
      {isPlaying && (
        <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            Línea {currentLineIndex + 1} de {dialogue.lines.length}
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            <span className="text-purple-600 dark:text-purple-400">
              {dialogue.lines[currentLineIndex]?.character}:
            </span>{' '}
            {dialogue.lines[currentLineIndex]?.text}
          </div>
        </div>
      )}

      {/* Barra de progreso */}
      <div className="mb-3">
        <div className="h-2 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 dark:bg-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-2">
        {!isPlaying ? (
          <BaseButton
            variant="primary"
            size="sm"
            icon={Play}
            onClick={playFullDialogue}
          >
            Reproducir Todo
          </BaseButton>
        ) : (
          <>
            <BaseButton
              variant="danger"
              size="sm"
              icon={Pause}
              onClick={stopPlayback}
            >
              Detener
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="sm"
              icon={SkipForward}
              onClick={skipToNextLine}
            >
              Siguiente
            </BaseButton>
          </>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-1 text-xs text-purple-700 dark:text-purple-300">
          <Volume2 size={14} />
          <span>Voz IA</span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 text-xs text-purple-700 dark:text-purple-300">
        💡 Escuchá la conversación completa antes de practicar línea por línea
      </div>
    </div>
  );
}

FullDialoguePlayer.propTypes = {
  dialogue: PropTypes.shape({
    lines: PropTypes.arrayOf(
      PropTypes.shape({
        character: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired
      })
    ).isRequired
  }).isRequired,
  onComplete: PropTypes.func
};

export default FullDialoguePlayer;
