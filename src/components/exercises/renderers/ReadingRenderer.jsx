/**
 * @fileoverview ReadingRenderer - Renderizador de contenido de lectura
 * @module components/exercises/renderers/ReadingRenderer
 *
 * Soporta:
 * - Texto con formato enriquecido
 * - Palabras marcadas/resaltadas
 * - Vocabulario con definiciones
 * - Modo de lectura guiada
 * - Preguntas de comprensión inline
 */

import { useState, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Eye,
  EyeOff,
  Volume2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  MessageSquare,
  Check
} from 'lucide-react';
import { BaseBadge, BaseButton } from '../../common';

/**
 * Parsear texto con marcadores de vocabulario
 * Formato: *palabra* o [vocab:palabra:definición]
 */
function parseTextWithVocabulary(text, vocabulary = {}) {
  if (!text) return { segments: [], words: [] };

  const segments = [];
  const words = [];

  // Regex para detectar palabras marcadas: *palabra* o [vocab:palabra:definición]
  const regex = /(?:\*([^*]+)\*|\[vocab:([^\]:]+)(?::([^\]]+))?\])/gi;

  let lastIndex = 0;
  let match;
  let wordIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    // Texto antes del match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }

    // Palabra marcada
    const word = match[1] || match[2];
    const definition = match[3] || vocabulary[word.toLowerCase()];

    segments.push({
      type: 'vocabulary',
      word,
      definition,
      index: wordIndex
    });

    words.push({
      word,
      definition,
      index: wordIndex
    });

    wordIndex++;
    lastIndex = regex.lastIndex;
  }

  // Texto restante
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  return { segments, words };
}

/**
 * ReadingRenderer - Renderiza contenido de lectura
 *
 * @param {Object} props
 * @param {string} props.text - Texto para leer
 * @param {string} [props.title] - Título
 * @param {Object} [props.vocabulary] - Diccionario de vocabulario {palabra: definición}
 * @param {Array} [props.questions] - Preguntas de comprensión
 * @param {boolean} [props.showVocabularyPanel] - Mostrar panel de vocabulario
 * @param {boolean} [props.highlightOnHover] - Resaltar palabras al pasar el mouse
 * @param {boolean} [props.allowTTS] - Permitir text-to-speech
 * @param {string} [props.fontSize] - Tamaño de fuente ('sm', 'base', 'lg', 'xl')
 * @param {string} [props.lineHeight] - Altura de línea ('normal', 'relaxed', 'loose')
 * @param {Function} [props.onWordClick] - Callback al hacer clic en palabra
 * @param {Function} [props.onComplete] - Callback al completar
 * @param {string} [props.className] - Clases adicionales
 */
export function ReadingRenderer({
  text,
  title,
  vocabulary = {},
  questions = [],
  showVocabularyPanel = true,
  highlightOnHover = true,
  allowTTS = true,
  fontSize = 'lg',
  lineHeight = 'relaxed',
  onWordClick,
  onComplete,
  className = ''
}) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [showDefinitions, setShowDefinitions] = useState(false);
  const [learnedWords, setLearnedWords] = useState(new Set());
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [answers, setAnswers] = useState({});

  // Parsear texto
  const { segments, words } = useMemo(
    () => parseTextWithVocabulary(text, vocabulary),
    [text, vocabulary]
  );

  // Clases de tamaño de fuente
  const fontSizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  // Clases de altura de línea
  const lineHeightClasses = {
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
    loose: 'leading-loose'
  };

  // Handler de clic en palabra
  const handleWordClick = useCallback((word) => {
    setSelectedWord(word);
    onWordClick?.(word);
  }, [onWordClick]);

  // Marcar palabra como aprendida
  const markAsLearned = useCallback((wordIndex) => {
    setLearnedWords(prev => new Set([...prev, wordIndex]));
  }, []);

  // Text-to-speech
  const speakText = useCallback((textToSpeak) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'es-ES'; // Español por defecto
      speechSynthesis.speak(utterance);
    }
  }, []);

  // Hablar palabra seleccionada
  const speakWord = useCallback(() => {
    if (selectedWord) {
      speakText(selectedWord.word);
    }
  }, [selectedWord, speakText]);

  // Toggle pregunta expandida
  const toggleQuestion = useCallback((index) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  // Verificar respuesta
  const checkAnswer = useCallback((questionIndex, answer) => {
    const question = questions[questionIndex];
    if (!question) return;

    const isCorrect = question.answer?.toLowerCase().trim() ===
      answer?.toLowerCase().trim();

    setAnswers(prev => ({
      ...prev,
      [questionIndex]: { answer, isCorrect }
    }));

    // Si todas respondidas correctamente, llamar onComplete
    if (questions.length > 0) {
      const allAnswered = questions.every((_, idx) =>
        answers[idx]?.isCorrect || (idx === questionIndex && isCorrect)
      );
      if (allAnswered) {
        onComplete?.();
      }
    }
  }, [questions, answers, onComplete]);

  return (
    <div
      className={`reading-renderer w-full ${className}`}
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        {title && (
          <h3
            className="text-xl font-semibold flex items-center gap-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <BookOpen size={20} />
            {title}
          </h3>
        )}

        <div className="flex items-center gap-2">
          {/* Toggle definiciones */}
          <button
            onClick={() => setShowDefinitions(!showDefinitions)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{
              backgroundColor: showDefinitions ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
              color: showDefinitions ? 'white' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)'
            }}
          >
            {showDefinitions ? <EyeOff size={16} /> : <Eye size={16} />}
            {showDefinitions ? 'Ocultar' : 'Mostrar'} definiciones
          </button>

          {/* TTS para todo el texto */}
          {allowTTS && (
            <button
              onClick={() => speakText(text.replace(/\*([^*]+)\*/g, '$1'))}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)'
              }}
              title="Leer en voz alta"
            >
              <Volume2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Contenido de lectura */}
      <div
        className={`p-6 rounded-xl ${fontSizeClasses[fontSize]} ${lineHeightClasses[lineHeight]}`}
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)'
        }}
      >
        {segments.map((segment, idx) => {
          if (segment.type === 'text') {
            return (
              <span key={idx} className="whitespace-pre-wrap">
                {segment.content}
              </span>
            );
          }

          // Palabra de vocabulario
          const isLearned = learnedWords.has(segment.index);
          const isSelected = selectedWord?.index === segment.index;

          return (
            <span
              key={idx}
              onClick={() => handleWordClick(segment)}
              className="relative inline-block cursor-pointer rounded px-0.5 mx-0.5 transition-all"
              style={{
                backgroundColor: isLearned
                  ? 'var(--color-success-bg)'
                  : 'var(--color-accent-bg)',
                color: isLearned
                  ? 'var(--color-success)'
                  : 'var(--color-accent)',
                fontWeight: '500',
                ...(highlightOnHover && {
                  ':hover': { boxShadow: '0 0 0 2px var(--color-accent)' }
                }),
                ...(isSelected && { boxShadow: '0 0 0 2px var(--color-accent)' })
              }}
            >
              {segment.word}
              {isLearned && (
                <Check
                  size={12}
                  className="inline ml-0.5"
                  style={{ color: 'var(--color-success)' }}
                />
              )}

              {/* Tooltip con definición */}
              {(showDefinitions || isSelected) && segment.definition && (
                <span
                  className="absolute left-0 top-full mt-1 px-2 py-1 rounded text-xs whitespace-nowrap z-10 shadow-lg"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  {segment.definition}
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Panel de palabra seleccionada */}
      {selectedWord && (
        <div
          className="mt-4 p-4 rounded-xl"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '2px solid var(--color-accent)'
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-xl font-bold"
                  style={{ color: 'var(--color-accent)' }}
                >
                  {selectedWord.word}
                </span>
                {allowTTS && (
                  <button
                    onClick={speakWord}
                    className="p-1 rounded transition-colors"
                    style={{
                      color: 'var(--color-accent)'
                    }}
                  >
                    <Volume2 size={18} />
                  </button>
                )}
              </div>
              {selectedWord.definition && (
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  {selectedWord.definition}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!learnedWords.has(selectedWord.index) && (
                <BaseButton
                  onClick={() => markAsLearned(selectedWord.index)}
                  variant="success"
                  size="sm"
                  icon={Check}
                >
                  Aprendida
                </BaseButton>
              )}
              <button
                onClick={() => setSelectedWord(null)}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel de vocabulario */}
      {showVocabularyPanel && words.length > 0 && (
        <div
          className="mt-4 p-4 rounded-xl"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <h4
            className="text-sm font-medium mb-3 flex items-center gap-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Lightbulb size={16} />
            Vocabulario ({learnedWords.size}/{words.length} aprendidas)
          </h4>
          <div className="flex flex-wrap gap-2">
            {words.map((word, idx) => {
              const isLearned = learnedWords.has(word.index);
              return (
                <button
                  key={idx}
                  onClick={() => handleWordClick(word)}
                  className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                  style={{
                    backgroundColor: isLearned
                      ? 'var(--color-success-bg)'
                      : 'var(--color-bg-tertiary)',
                    color: isLearned
                      ? 'var(--color-success)'
                      : 'var(--color-text-primary)',
                    ...(isLearned && { boxShadow: '0 0 0 1px var(--color-success)' })
                  }}
                >
                  {word.word}
                  {isLearned && <Check size={12} className="inline ml-1" style={{ color: 'var(--color-success)' }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Preguntas de comprensión */}
      {questions.length > 0 && (
        <div
          className="mt-4 p-4 rounded-xl"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <h4
            className="text-sm font-medium mb-3 flex items-center gap-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <MessageSquare size={16} />
            Preguntas de comprensión
          </h4>
          <div className="space-y-3">
            {questions.map((q, idx) => {
              const isExpanded = expandedQuestions.has(idx);
              const answerData = answers[idx];

              return (
                <div
                  key={idx}
                  className="rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <button
                    onClick={() => toggleQuestion(idx)}
                    className="w-full p-3 flex items-center justify-between text-left"
                  >
                    <span
                      className="font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {idx + 1}. {q.question}
                    </span>
                    <div className="flex items-center gap-2">
                      {answerData && (
                        <BaseBadge
                          variant={answerData.isCorrect ? 'success' : 'danger'}
                          size="sm"
                        >
                          {answerData.isCorrect ? 'Correcto' : 'Incorrecto'}
                        </BaseBadge>
                      )}
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-3 pt-0">
                      <input
                        type="text"
                        placeholder="Tu respuesta..."
                        defaultValue={answerData?.answer || ''}
                        onBlur={(e) => checkAnswer(idx, e.target.value)}
                        className="w-full p-2 rounded-lg text-sm"
                        style={{
                          backgroundColor: 'var(--color-bg-secondary)',
                          color: 'var(--color-text-primary)',
                          border: '1px solid var(--color-border)'
                        }}
                      />
                      {answerData && !answerData.isCorrect && q.answer && (
                        <p
                          className="mt-2 text-sm"
                          style={{ color: 'var(--color-success)' }}
                        >
                          Respuesta correcta: {q.answer}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div
        className="mt-4 flex items-center justify-between text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <span>
          {words.length} palabras de vocabulario
        </span>
        {words.length > 0 && (
          <span>
            {learnedWords.size} aprendidas ({Math.round((learnedWords.size / words.length) * 100)}%)
          </span>
        )}
      </div>
    </div>
  );
}

export default ReadingRenderer;
