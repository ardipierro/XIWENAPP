/**
 * @fileoverview Ejercicio de Diálogos Interactivos
 * @module components/container/DialoguesExercise
 *
 * Renderiza diálogos interactivos reutilizando componentes del libro interactivo.
 * Soporta modos: lectura, fill-blank, comprensión, ordenar.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MessageCircle,
  Volume2,
  Play,
  Pause,
  SkipForward,
  Check,
  X,
  RotateCcw,
  Trophy,
  ChevronDown,
  ChevronUp,
  Languages,
  Shuffle
} from 'lucide-react';
import PropTypes from 'prop-types';
import { BaseBadge } from '../common';
import AudioPlayer from '../interactive-book/AudioPlayer';
import { getCharacterVoiceConfig } from '../interactive-book/CharacterVoiceManager';
import { DEFAULT_CONFIG, STORAGE_KEY } from './DialoguesConfig';
import logger from '../../utils/logger';

/**
 * Parser del formato #DIALOGO
 * @param {string} content - Contenido en formato #DIALOGO
 * @returns {Object} { lines: Array, characters: Array, blanks: Array }
 */
function parseDialogueContent(content) {
  if (!content) return { lines: [], characters: [], blanks: [] };

  const lines = [];
  const characters = new Set();
  const blanks = [];

  // Remover el marcador #DIALOGO y limpiar
  const cleanContent = content
    .replace(/^#DIALOGO\s*/i, '')
    .replace(/^#DIÁLOGO\s*/i, '')
    .trim();

  // Separar líneas
  const rawLines = cleanContent.split('\n').filter(l => l.trim() && !l.startsWith('---'));

  rawLines.forEach((line, index) => {
    // Formato: "Personaje: texto" o "Personaje - texto"
    const match = line.match(/^([^:–-]+)[:\–-]\s*(.+)$/);

    if (match) {
      const character = match[1].trim();
      let text = match[2].trim();

      characters.add(character);

      // Detectar blanks (*palabra*)
      const blankMatches = text.matchAll(/\*([^*]+)\*/g);
      const lineBlanks = [];

      for (const blankMatch of blankMatches) {
        lineBlanks.push({
          lineIndex: index,
          word: blankMatch[1],
          position: blankMatch.index
        });
      }

      blanks.push(...lineBlanks);

      lines.push({
        lineId: `line_${index}`,
        character,
        text,
        originalText: text,
        blanks: lineBlanks,
        index
      });
    }
  });

  // Crear array de personajes con IDs
  const characterArray = Array.from(characters).map((name, idx) => ({
    id: name.toLowerCase().replace(/\s+/g, '_'),
    name,
    color: getCharacterColor(name)
  }));

  return { lines, characters: characterArray, blanks };
}

/**
 * Genera un color consistente basado en el nombre
 */
function getCharacterColor(name) {
  const colors = [
    { bg: '#dbeafe', text: '#1e40af' }, // blue
    { bg: '#dcfce7', text: '#166534' }, // green
    { bg: '#fef3c7', text: '#92400e' }, // amber
    { bg: '#fce7f3', text: '#9d174d' }, // pink
    { bg: '#e0e7ff', text: '#3730a3' }, // indigo
    { bg: '#ccfbf1', text: '#0f766e' }, // teal
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

/**
 * Burbuja de diálogo simplificada (versión local)
 */
function DialogueBubbleSimple({
  line,
  index,
  config,
  mode,
  userAnswer,
  onAnswerChange,
  showFeedback,
  isCorrect
}) {
  const [expanded, setExpanded] = useState(false);
  const isRight = index % 2 === 0;
  const characterColor = getCharacterColor(line.character);
  const voiceConfig = getCharacterVoiceConfig(line.character.toLowerCase().replace(/\s+/g, '_'));

  // Renderizar texto con blanks
  const renderText = () => {
    if (mode !== 'fill-blank' || line.blanks.length === 0) {
      // Modo lectura: mostrar texto limpio (sin asteriscos)
      return <span>{line.text.replace(/\*([^*]+)\*/g, '$1')}</span>;
    }

    // Modo fill-blank: reemplazar *palabra* con inputs
    const parts = [];
    let lastIndex = 0;
    let blankCount = 0;

    line.text.replace(/\*([^*]+)\*/g, (match, word, offset) => {
      // Texto antes del blank
      if (offset > lastIndex) {
        parts.push(
          <span key={`text_${offset}`}>{line.text.substring(lastIndex, offset)}</span>
        );
      }

      const blankId = `${line.lineId}_blank_${blankCount}`;
      const answer = userAnswer?.[blankId] || '';
      const correct = answer.toLowerCase().trim() === word.toLowerCase().trim();

      parts.push(
        <span key={blankId} className="inline-flex items-center mx-1">
          <input
            type="text"
            value={answer}
            onChange={(e) => onAnswerChange?.(blankId, e.target.value)}
            placeholder="___"
            className={`px-2 py-1 rounded border-2 text-center min-w-[80px] transition-colors ${
              showFeedback
                ? correct
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            }`}
            style={{ fontSize: 'inherit' }}
            disabled={showFeedback}
          />
          {showFeedback && !correct && (
            <span className="ml-1 text-xs text-green-600 dark:text-green-400">({word})</span>
          )}
        </span>
      );

      lastIndex = offset + match.length;
      blankCount++;
      return match;
    });

    // Texto después del último blank
    if (lastIndex < line.text.length) {
      parts.push(<span key="text_end">{line.text.substring(lastIndex)}</span>);
    }

    return parts;
  };

  return (
    <div className={`flex gap-3 mb-4 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {config.showAvatars && (
        <div className="flex-shrink-0">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-md"
            style={{
              backgroundColor: characterColor.bg,
              color: characterColor.text
            }}
          >
            {line.character.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Burbuja */}
      <div className={`flex-1 max-w-[80%] ${isRight ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Nombre */}
        {config.showCharacterNames && (
          <div
            className={`text-sm font-semibold mb-1 px-1 ${isRight ? 'text-right' : 'text-left'}`}
            style={{ color: characterColor.text }}
          >
            {line.character}
          </div>
        )}

        {/* Burbuja principal */}
        <div
          className={`relative px-4 py-3 shadow-sm ${
            config.bubbleStyle === 'rounded'
              ? 'rounded-2xl'
              : config.bubbleStyle === 'square'
              ? 'rounded-lg'
              : 'rounded-3xl'
          } ${isRight ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
          style={{
            backgroundColor: isRight ? config.rightBubbleColor : config.leftBubbleColor,
            color: isRight ? config.rightTextColor : config.leftTextColor
          }}
        >
          <div className="text-base leading-relaxed">
            {renderText()}
          </div>

          {/* Feedback indicator */}
          {showFeedback && mode === 'fill-blank' && line.blanks.length > 0 && (
            <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center ${
              isCorrect ? 'bg-green-500' : 'bg-red-500'
            } text-white shadow`}>
              {isCorrect ? <Check size={14} /> : <X size={14} />}
            </div>
          )}
        </div>

        {/* Botón expandir para audio/traducción */}
        {config.ttsEnabled && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
          >
            <Volume2 size={12} />
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}

        {/* Panel expandido con audio */}
        {expanded && config.ttsEnabled && (
          <div className="mt-2 w-full">
            <AudioPlayer
              text={line.text.replace(/\*([^*]+)\*/g, '$1')}
              voiceConfig={voiceConfig}
              characterName={line.character}
              showText={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Componente principal de ejercicio de diálogos
 */
function DialoguesExercise({
  content,
  config: propConfig,
  onComplete,
  onActionsChange
}) {
  // Cargar config desde props o localStorage
  const [config, setConfig] = useState(() => {
    if (propConfig) return { ...DEFAULT_CONFIG, ...propConfig };
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  // Parsear contenido
  const { lines, characters, blanks } = useMemo(
    () => parseDialogueContent(content),
    [content]
  );

  // Estado del ejercicio
  const [userAnswers, setUserAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Estado para modo ordenar
  const [shuffledLines, setShuffledLines] = useState([]);
  const [orderedLines, setOrderedLines] = useState([]);

  // Inicializar modo ordenar
  useEffect(() => {
    if (config.exerciseMode === 'order' && lines.length > 0) {
      const shuffled = [...lines].sort(() => Math.random() - 0.5);
      setShuffledLines(shuffled);
      setOrderedLines([]);
    }
  }, [config.exerciseMode, lines]);

  // Manejar cambio de respuesta
  const handleAnswerChange = useCallback((blankId, value) => {
    setUserAnswers(prev => ({ ...prev, [blankId]: value }));
  }, []);

  // Verificar respuestas (modo fill-blank)
  const checkAnswers = useCallback(() => {
    let correct = 0;
    let total = 0;

    lines.forEach(line => {
      line.blanks.forEach((blank, idx) => {
        const blankId = `${line.lineId}_blank_${idx}`;
        const answer = userAnswers[blankId] || '';
        if (answer.toLowerCase().trim() === blank.word.toLowerCase().trim()) {
          correct++;
        }
        total++;
      });
    });

    const calculatedScore = total > 0 ? Math.round((correct / total) * 100) : 100;
    setScore(calculatedScore);
    setShowFeedback(true);
    setCompleted(true);

    // Callback
    onComplete?.({
      score: calculatedScore,
      correct,
      total,
      answers: userAnswers
    });

    logger.info('Dialogue exercise completed:', { score: calculatedScore, correct, total });
  }, [lines, userAnswers, onComplete]);

  // Verificar orden (modo order)
  const checkOrder = useCallback(() => {
    let correct = 0;
    orderedLines.forEach((line, idx) => {
      if (line.index === idx) correct++;
    });

    const calculatedScore = lines.length > 0
      ? Math.round((correct / lines.length) * 100)
      : 100;

    setScore(calculatedScore);
    setShowFeedback(true);
    setCompleted(true);

    onComplete?.({
      score: calculatedScore,
      correct,
      total: lines.length
    });
  }, [orderedLines, lines, onComplete]);

  // Reiniciar ejercicio
  const reset = useCallback(() => {
    setUserAnswers({});
    setShowFeedback(false);
    setScore(0);
    setCompleted(false);

    if (config.exerciseMode === 'order') {
      const shuffled = [...lines].sort(() => Math.random() - 0.5);
      setShuffledLines(shuffled);
      setOrderedLines([]);
    }
  }, [config.exerciseMode, lines]);

  // Mover línea en modo ordenar
  const moveLineToOrder = (line) => {
    setShuffledLines(prev => prev.filter(l => l.lineId !== line.lineId));
    setOrderedLines(prev => [...prev, line]);
  };

  const moveLineBack = (line) => {
    setOrderedLines(prev => prev.filter(l => l.lineId !== line.lineId));
    setShuffledLines(prev => [...prev, line]);
  };

  // Si no hay contenido válido
  if (!lines.length) {
    return (
      <div className="p-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>
        <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
        <p>No se encontró contenido de diálogo válido.</p>
        <p className="text-sm mt-2">
          Use el formato: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">Personaje: texto</code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con info */}
      <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-cyan-500" />
          <div>
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Diálogo Interactivo
            </span>
            <span className="text-sm ml-2" style={{ color: 'var(--color-text-secondary)' }}>
              {lines.length} líneas • {characters.length} personajes
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {config.exerciseMode !== 'read' && (
            <BaseBadge variant="info" size="sm">
              {config.exerciseMode === 'fill-blank' && `${blanks.length} blancos`}
              {config.exerciseMode === 'order' && 'Ordenar'}
              {config.exerciseMode === 'comprehension' && 'Comprensión'}
            </BaseBadge>
          )}

          {config.showScore && completed && (
            <BaseBadge
              variant={score >= 70 ? 'success' : score >= 50 ? 'warning' : 'error'}
              size="sm"
            >
              <Trophy size={12} className="mr-1" />
              {score}%
            </BaseBadge>
          )}
        </div>
      </div>

      {/* Personajes */}
      <div className="flex flex-wrap gap-2 px-2">
        {characters.map(char => (
          <span
            key={char.id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: char.color.bg,
              color: char.color.text
            }}
          >
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: char.color.text, color: char.color.bg }}>
              {char.name.charAt(0)}
            </span>
            {char.name}
          </span>
        ))}
      </div>

      {/* Contenido según modo */}
      <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        {/* Modo Lectura o Fill-blank */}
        {(config.exerciseMode === 'read' || config.exerciseMode === 'fill-blank') && (
          <div className="space-y-2">
            {lines.map((line, idx) => {
              // Verificar si esta línea está correcta
              let lineCorrect = true;
              if (config.exerciseMode === 'fill-blank' && line.blanks.length > 0) {
                line.blanks.forEach((blank, blankIdx) => {
                  const blankId = `${line.lineId}_blank_${blankIdx}`;
                  const answer = userAnswers[blankId] || '';
                  if (answer.toLowerCase().trim() !== blank.word.toLowerCase().trim()) {
                    lineCorrect = false;
                  }
                });
              }

              return (
                <DialogueBubbleSimple
                  key={line.lineId}
                  line={line}
                  index={idx}
                  config={config}
                  mode={config.exerciseMode}
                  userAnswer={userAnswers}
                  onAnswerChange={handleAnswerChange}
                  showFeedback={showFeedback}
                  isCorrect={lineCorrect}
                />
              );
            })}
          </div>
        )}

        {/* Modo Ordenar */}
        {config.exerciseMode === 'order' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Líneas desordenadas */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                <Shuffle size={14} />
                Líneas desordenadas
              </h4>
              {shuffledLines.map(line => (
                <button
                  key={line.lineId}
                  onClick={() => !showFeedback && moveLineToOrder(line)}
                  disabled={showFeedback}
                  className="w-full p-3 text-left rounded-lg border-2 border-dashed transition-all hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-bg-secondary)'
                  }}
                >
                  <span className="text-xs font-medium" style={{ color: getCharacterColor(line.character).text }}>
                    {line.character}:
                  </span>
                  <span className="ml-2" style={{ color: 'var(--color-text-primary)' }}>
                    {line.text.replace(/\*([^*]+)\*/g, '$1')}
                  </span>
                </button>
              ))}
              {shuffledLines.length === 0 && !showFeedback && (
                <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
                  ¡Todas las líneas fueron ordenadas!
                </p>
              )}
            </div>

            {/* Líneas ordenadas */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                <Check size={14} />
                Tu orden
              </h4>
              {orderedLines.map((line, idx) => {
                const isCorrectPosition = showFeedback && line.index === idx;
                const isWrongPosition = showFeedback && line.index !== idx;

                return (
                  <button
                    key={line.lineId}
                    onClick={() => !showFeedback && moveLineBack(line)}
                    disabled={showFeedback}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      isCorrectPosition
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : isWrongPosition
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20'
                    }`}
                  >
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-2"
                      style={{
                        backgroundColor: isCorrectPosition ? '#22c55e' : isWrongPosition ? '#ef4444' : '#06b6d4',
                        color: 'white'
                      }}>
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium" style={{ color: getCharacterColor(line.character).text }}>
                      {line.character}:
                    </span>
                    <span className="ml-2" style={{ color: 'var(--color-text-primary)' }}>
                      {line.text.replace(/\*([^*]+)\*/g, '$1')}
                    </span>
                    {showFeedback && isWrongPosition && (
                      <span className="ml-2 text-xs text-green-600">(debería ser #{line.index + 1})</span>
                    )}
                  </button>
                );
              })}
              {orderedLines.length === 0 && (
                <p className="text-sm text-center py-4 border-2 border-dashed rounded-lg"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  Haz clic en las líneas de la izquierda para ordenarlas
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Acciones */}
      {config.exerciseMode !== 'read' && (
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)'
            }}
          >
            <RotateCcw size={16} />
            Reiniciar
          </button>

          {!completed ? (
            <button
              onClick={config.exerciseMode === 'order' ? checkOrder : checkAnswers}
              disabled={
                (config.exerciseMode === 'fill-blank' && Object.keys(userAnswers).length === 0) ||
                (config.exerciseMode === 'order' && orderedLines.length !== lines.length)
              }
              className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-colors bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={16} />
              Verificar
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Puntuación: <span className="font-bold" style={{ color: score >= 70 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444' }}>{score}%</span>
              </div>
              {score < 100 && (
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-cyan-500 text-white hover:bg-cyan-600"
                >
                  Intentar de nuevo
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

DialoguesExercise.propTypes = {
  content: PropTypes.string.isRequired,
  config: PropTypes.object,
  onComplete: PropTypes.func,
  onActionsChange: PropTypes.func
};

export default DialoguesExercise;
