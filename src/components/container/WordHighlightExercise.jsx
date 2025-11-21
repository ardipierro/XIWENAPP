/**
 * @fileoverview Word Highlight Exercise - Wrapper interactivo para marcar palabras
 * @module components/container/WordHighlightExercise
 */

import { useState, useMemo } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { BaseButton } from '../common';
import logger from '../../utils/logger';

/**
 * Componente wrapper para ejercicios de marcar palabras
 * Parsea texto con asteriscos y permite clickear palabras
 */
function WordHighlightExercise({ text, config, onComplete }) {
  const [clickedWords, setClickedWords] = useState(new Set());
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);

  // Configuración por defecto (hardcoded)
  const defaultConfig = {
    correctColor: '#10b981', // green-500
    incorrectColor: '#ef4444', // red-500
    correctPoints: 10,
    incorrectPoints: -5,
    showFeedback: true,
    showScore: true
  };

  const finalConfig = { ...defaultConfig, ...config };

  /**
   * Parsear texto y extraer palabras con/sin asteriscos
   * Regex encuentra palabras entre asteriscos
   */
  const parsedContent = useMemo(() => {
    const parts = [];
    let lastIndex = 0;
    const regex = /\*([^*]+)\*/g;
    let match;

    // Encontrar todas las coincidencias
    while ((match = regex.exec(text)) !== null) {
      // Texto antes del match
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        beforeText.split(/\s+/).forEach(word => {
          if (word.trim()) {
            parts.push({ text: word, isTarget: false });
          }
        });
      }

      // Palabra con asteriscos (target)
      parts.push({ text: match[1], isTarget: true });
      lastIndex = regex.lastIndex;
    }

    // Texto después del último match
    if (lastIndex < text.length) {
      const afterText = text.slice(lastIndex);
      afterText.split(/\s+/).forEach(word => {
        if (word.trim()) {
          parts.push({ text: word, isTarget: false });
        }
      });
    }

    return parts;
  }, [text]);

  /**
   * Manejar click en palabra
   */
  const handleWordClick = (word, isTarget, index) => {
    const wordKey = `${index}-${word}`;

    // No permitir click en palabras ya clickeadas
    if (clickedWords.has(wordKey)) {
      return;
    }

    // Marcar palabra como clickeada
    setClickedWords(prev => new Set([...prev, wordKey]));

    // Calcular puntos
    const isCorrect = isTarget;
    const points = isCorrect ? finalConfig.correctPoints : finalConfig.incorrectPoints;
    setScore(prev => prev + points);

    // Mostrar feedback
    if (finalConfig.showFeedback) {
      setFeedback({
        type: isCorrect ? 'correct' : 'incorrect',
        message: isCorrect ? '¡Correcto!' : 'Incorrecto',
        points: points
      });

      // Ocultar feedback después de 1 segundo
      setTimeout(() => setFeedback(null), 1000);
    }

    logger.info(`Word clicked: ${word}, isTarget: ${isTarget}, points: ${points}`, 'WordHighlightExercise');
  };

  /**
   * Obtener estilo de palabra según su estado
   */
  const getWordStyle = (index, word, isTarget) => {
    const wordKey = `${index}-${word}`;
    const isClicked = clickedWords.has(wordKey);

    if (!isClicked) {
      return {
        cursor: 'pointer',
        padding: '2px 4px',
        borderRadius: '4px',
        transition: 'all 0.2s',
        backgroundColor: 'transparent'
      };
    }

    // Palabra clickeada
    return {
      cursor: 'default',
      padding: '2px 4px',
      borderRadius: '4px',
      transition: 'all 0.2s',
      backgroundColor: isTarget ? finalConfig.correctColor + '20' : finalConfig.incorrectColor + '20',
      color: isTarget ? finalConfig.correctColor : finalConfig.incorrectColor,
      fontWeight: 'bold'
    };
  };

  /**
   * Resetear ejercicio
   */
  const handleReset = () => {
    setClickedWords(new Set());
    setScore(0);
    setFeedback(null);
  };

  /**
   * Finalizar ejercicio
   */
  const handleComplete = () => {
    if (onComplete) {
      onComplete({ score, totalClicks: clickedWords.size });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Header con puntuación */}
      {finalConfig.showScore && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Marca los verbos
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Haz clic en las palabras que sean verbos
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold" style={{ color: score >= 0 ? finalConfig.correctColor : finalConfig.incorrectColor }}>
                {score}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                puntos
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback flotante */}
      {feedback && (
        <div
          className="fixed top-20 right-6 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in z-50"
          style={{
            backgroundColor: feedback.type === 'correct' ? finalConfig.correctColor : finalConfig.incorrectColor,
            color: 'white'
          }}
        >
          {feedback.type === 'correct' ? (
            <CheckCircle size={20} />
          ) : (
            <XCircle size={20} />
          )}
          <div>
            <div className="font-semibold">{feedback.message}</div>
            <div className="text-sm opacity-90">
              {feedback.points > 0 ? '+' : ''}{feedback.points} puntos
            </div>
          </div>
        </div>
      )}

      {/* Texto del ejercicio */}
      <div
        className="text-lg leading-relaxed mb-6 p-4 rounded-lg"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          lineHeight: '2'
        }}
      >
        {parsedContent.map((part, index) => (
          <span
            key={index}
            onClick={() => handleWordClick(part.text, part.isTarget, index)}
            style={getWordStyle(index, part.text, part.isTarget)}
            className="hover:opacity-80"
          >
            {part.text}{' '}
          </span>
        ))}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 justify-end">
        <BaseButton
          variant="secondary"
          onClick={handleReset}
        >
          Reintentar
        </BaseButton>
        <BaseButton
          variant="primary"
          onClick={handleComplete}
        >
          Finalizar
        </BaseButton>
      </div>

      {/* Estadísticas */}
      <div className="mt-4 pt-4 border-t flex gap-6 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
        <div>
          <span className="font-medium">Palabras marcadas:</span> {clickedWords.size}
        </div>
        <div>
          <span className="font-medium">Total de palabras:</span> {parsedContent.length}
        </div>
      </div>
    </div>
  );
}

export default WordHighlightExercise;
// Force reload
