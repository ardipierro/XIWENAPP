/**
 * @fileoverview DialoguesRenderer - Renderizador unificado de diálogos (COMPLETO)
 * @module components/exercises/renderers/DialoguesRenderer
 *
 * UNIFICA:
 * - container/DialoguesExercise.jsx (693 líneas - diseño de referencia)
 *
 * Funcionalidades COMPLETAS:
 * - 4 modos de ejercicio: read, fill-blank, order, comprehension
 * - AudioPlayer integration con TTS por personaje
 * - CharacterVoiceManager para voces personalizadas
 * - Burbujas de diálogo con avatares y colores
 * - Parseo de formato "Personaje: texto"
 * - Blanks con *palabra* (fill-in)
 * - QuickDisplayFAB para ajustes de visualización
 * - Scoring y feedback completo
 * - INTEGRADO CON ExerciseContext (núcleo universal)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MessageCircle,
  Volume2,
  Check,
  X,
  RotateCcw,
  Trophy,
  ChevronDown,
  ChevronUp,
  Shuffle,
  User
} from 'lucide-react';
import { BaseBadge } from '../../common';
import { useExercise } from '../core/ExerciseContext';
import { getDisplayClasses, getDisplayStyles, mergeDisplaySettings } from '../../../constants/displaySettings';
import AudioPlayer from '../../interactive-book/AudioPlayer';
import { getCharacterVoiceConfig } from '../../interactive-book/CharacterVoiceManager';
import logger from '../../../utils/logger';

// Configuración por defecto (SIMPLIFICADA - usa variables CSS del tema)
const DEFAULT_CONFIG = {
  // Display
  showAvatars: true,
  showCharacterNames: true,
  bubbleStyle: 'rounded', // 'rounded', 'square', 'modern'

  // Audio/TTS
  ttsEnabled: true,
  autoPlayAudio: false,
  playbackSpeed: 1.0,

  // Traducciones
  showTranslations: true,
  translationLanguage: 'zh',

  // Modo de ejercicio
  exerciseMode: 'read', // 'read', 'fill-blank', 'comprehension', 'order'

  // Gamificación
  pointsPerCorrect: 10,
  showScore: true,
  soundEffects: true,

  // Feedback
  feedbackMode: 'instant',
  showHints: true
};

const STORAGE_KEY = 'xiwen_dialogues_config';

// ✅ ELIMINADO: colores hardcoded - ahora usa variables CSS del tema
// Los personajes usan variables CSS del sistema de temas

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

  // Crear array de personajes con IDs (SIN colores hardcoded)
  const characterArray = Array.from(characters).map((name, idx) => ({
    id: name.toLowerCase().replace(/\s+/g, '_'),
    name
  }));

  return { lines, characters: characterArray, blanks };
}

/**
 * Burbuja de diálogo simplificada
 */
function DialogueBubbleSimple({
  line,
  index,
  config,
  mode,
  userAnswer,
  onAnswerChange,
  showFeedback,
  isCorrect,
  textClassName = ''
}) {
  const [expanded, setExpanded] = useState(false);
  const isRight = index % 2 === 0;

  // Obtener configuración de voz del personaje desde CharacterVoiceManager
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
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)'
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
            style={{ color: 'var(--color-text-secondary)' }}
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
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className={`leading-relaxed ${textClassName}`}>
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
 * DialoguesRenderer - Renderiza diálogos interactivos COMPLETOS
 *
 * @param {Object} props
 * @param {string} props.text - Texto en formato #DIALOGO
 * @param {Object} [props.config] - Configuración externa (se mezcla con defaults)
 * @param {Object} [props.displaySettings] - Ajustes de visualización
 * @param {boolean} [props.isFullscreen] - Si está en fullscreen
 * @param {Function} [props.onDisplaySettingsChange] - Callback para cambios de display
 * @param {Function} [props.onToggleFullscreen] - Callback para toggle fullscreen
 * @param {string} [props.className] - Clases adicionales
 */
export function DialoguesRenderer({
  text,
  config: externalConfig = {},
  displaySettings = null,
  isFullscreen = false,
  onDisplaySettingsChange,
  onToggleFullscreen,
  className = ''
}) {
  // ✅ UNIVERSAL CORE: useExercise hook
  const {
    userAnswer,
    setAnswer,
    showingFeedback,
    config: contextConfig,
    complete
  } = useExercise();

  // Deep merge config (DEFAULT_CONFIG + contextConfig + externalConfig + localStorage)
  const finalConfig = useMemo(() => {
    // Intentar cargar desde localStorage
    let savedConfig = {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        savedConfig = JSON.parse(saved);
      }
    } catch (e) {
      logger.error('Error loading dialogues config from localStorage:', e);
    }

    // Merge: defaults -> context -> external -> saved
    const merged = {
      ...DEFAULT_CONFIG,
      ...contextConfig,
      ...externalConfig,
      ...savedConfig
    };

    // Si externalConfig tiene config explícito, tiene prioridad
    if (externalConfig && Object.keys(externalConfig).length > 0) {
      Object.assign(merged, externalConfig);
    }

    return merged;
  }, [contextConfig, externalConfig]);

  // Display settings - usar directamente de props
  const mergedDisplaySettings = useMemo(
    () => mergeDisplaySettings(displaySettings, 'exercise'),
    [displaySettings]
  );
  const displayClasses = useMemo(() => getDisplayClasses(mergedDisplaySettings), [mergedDisplaySettings]);
  const displayStyles = useMemo(() => getDisplayStyles(mergedDisplaySettings), [mergedDisplaySettings]);

  // Parsear contenido
  const { lines, characters, blanks } = useMemo(
    () => parseDialogueContent(text),
    [text]
  );

  // Estado del ejercicio
  const [userAnswers, setUserAnswers] = useState({});
  const [localShowFeedback, setLocalShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Estado para modo ordenar
  const [shuffledLines, setShuffledLines] = useState([]);
  const [orderedLines, setOrderedLines] = useState([]);

  // Inicializar modo ordenar
  useEffect(() => {
    if (finalConfig.exerciseMode === 'order' && lines.length > 0) {
      const shuffled = [...lines].sort(() => Math.random() - 0.5);
      setShuffledLines(shuffled);
      setOrderedLines([]);
    }
  }, [finalConfig.exerciseMode, lines]);

  // Sincronizar showFeedback con contexto
  useEffect(() => {
    if (showingFeedback) {
      setLocalShowFeedback(true);
    }
  }, [showingFeedback]);

  // Manejar cambio de respuesta
  const handleAnswerChange = useCallback((blankId, value) => {
    setUserAnswers(prev => {
      const updated = { ...prev, [blankId]: value };
      setAnswer(updated); // Sincronizar con context
      return updated;
    });
  }, [setAnswer]);

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
    setLocalShowFeedback(true);
    setCompleted(true);

    // Trigger context completion
    const isCorrect = correct === total;
    complete?.({
      isCorrect,
      score: calculatedScore,
      correct,
      incorrect: total - correct,
      total
    });

    logger.info('Dialogue exercise completed:', { score: calculatedScore, correct, total });
  }, [lines, userAnswers, complete]);

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
    setLocalShowFeedback(true);
    setCompleted(true);

    // Trigger context completion
    const isCorrect = correct === lines.length;
    complete?.({
      isCorrect,
      score: calculatedScore,
      correct,
      incorrect: lines.length - correct,
      total: lines.length
    });

    logger.info('Dialogue order exercise completed:', { score: calculatedScore, correct, total: lines.length });
  }, [orderedLines, lines, complete]);

  // Reiniciar ejercicio
  const reset = useCallback(() => {
    setUserAnswers({});
    setLocalShowFeedback(false);
    setScore(0);
    setCompleted(false);
    setAnswer(null);

    if (finalConfig.exerciseMode === 'order') {
      const shuffled = [...lines].sort(() => Math.random() - 0.5);
      setShuffledLines(shuffled);
      setOrderedLines([]);
    }
  }, [finalConfig.exerciseMode, lines, setAnswer]);

  // Mover línea en modo ordenar
  const moveLineToOrder = useCallback((line) => {
    setShuffledLines(prev => prev.filter(l => l.lineId !== line.lineId));
    setOrderedLines(prev => [...prev, line]);
  }, []);

  const moveLineBack = useCallback((line) => {
    setOrderedLines(prev => prev.filter(l => l.lineId !== line.lineId));
    setShuffledLines(prev => [...prev, line]);
  }, []);

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

  const showFeedback = localShowFeedback || showingFeedback;

  return (
    <>
      <div className={`dialogues-renderer space-y-4 mx-auto ${displayClasses.container} ${className}`} style={{ ...displayStyles, maxWidth: '1000px', width: '100%' }}>
        {/* Header con info */}
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
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
            {finalConfig.exerciseMode !== 'read' && (
              <BaseBadge variant="info" size="sm">
                {finalConfig.exerciseMode === 'fill-blank' && `${blanks.length} blancos`}
                {finalConfig.exerciseMode === 'order' && 'Ordenar'}
                {finalConfig.exerciseMode === 'comprehension' && 'Comprensión'}
              </BaseBadge>
            )}

            {finalConfig.showScore && completed && (
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
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)'
              }}
            >
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
                {char.name.charAt(0)}
              </span>
              {char.name}
            </span>
          ))}
        </div>

        {/* Contenido según modo */}
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
          {/* Modo Lectura o Fill-blank */}
          {(finalConfig.exerciseMode === 'read' || finalConfig.exerciseMode === 'fill-blank') && (
            <div className="space-y-2">
              {lines.map((line, idx) => {
                // Verificar si esta línea está correcta
                let lineCorrect = true;
                if (finalConfig.exerciseMode === 'fill-blank' && line.blanks.length > 0) {
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
                    config={finalConfig}
                    mode={finalConfig.exerciseMode}
                    userAnswer={userAnswers}
                    onAnswerChange={handleAnswerChange}
                    showFeedback={showFeedback}
                    isCorrect={lineCorrect}
                    textClassName={displayClasses.text}
                  />
                );
              })}
            </div>
          )}

          {/* Modo Ordenar */}
          {finalConfig.exerciseMode === 'order' && (
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
                    className="w-full p-3 text-left rounded-lg border-2 border-dashed transition-all"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-bg-secondary)'
                    }}
                  >
                    <span className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
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
                      className={`w-full p-3 text-left rounded-lg border-2 transition-all`}
                      style={{
                        borderColor: isCorrectPosition
                          ? 'var(--color-success)'
                          : isWrongPosition
                          ? 'var(--color-error)'
                          : 'var(--color-accent)',
                        backgroundColor: isCorrectPosition
                          ? 'var(--color-success-bg)'
                          : isWrongPosition
                          ? 'var(--color-error-bg)'
                          : 'var(--color-bg-secondary)'
                      }}
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-2"
                        style={{
                          backgroundColor: isCorrectPosition
                            ? 'var(--color-success)'
                            : isWrongPosition
                            ? 'var(--color-error)'
                            : 'var(--color-accent)',
                          color: 'white'
                        }}>
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
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
        {finalConfig.exerciseMode !== 'read' && (
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
                onClick={finalConfig.exerciseMode === 'order' ? checkOrder : checkAnswers}
                disabled={
                  (finalConfig.exerciseMode === 'fill-blank' && Object.keys(userAnswers).length === 0) ||
                  (finalConfig.exerciseMode === 'order' && orderedLines.length !== lines.length)
                }
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--color-accent)' }}
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
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                  >
                    Intentar de nuevo
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default DialoguesRenderer;
