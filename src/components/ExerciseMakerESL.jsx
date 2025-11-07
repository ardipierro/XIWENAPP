/**
 * ExerciseMakerESL - AI-powered ESL Exercise Generator Modal
 *
 * Features:
 * - AI-generated exercises with live parsing
 * - Multiple exercise types: gap-fill, multiple-choice, drag-to-match, listening
 * - CEFR levels A1-C2
 * - Interactive components with instant feedback
 * - Mobile-first responsive design
 * - Closes with ESC key
 */

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Check, X, Volume2, GripVertical } from 'lucide-react';
import BaseModal from './common/BaseModal';
import BaseButton from './common/BaseButton';
import BaseSelect from './common/BaseSelect';
import BaseInput from './common/BaseInput';
import BaseTextarea from './common/BaseTextarea';
import BaseAlert from './common/BaseAlert';
import AIService from '../services/AIService';
import logger from '../utils/logger';

// ============================================================================
// INTERACTIVE EXERCISE COMPONENTS
// ============================================================================

/**
 * FillGap - Fill in the blank exercise component
 */
const FillGap = ({ sentence, answer, onComplete }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);

  const checkAnswer = () => {
    const isCorrect = userAnswer.trim().toLowerCase() === answer.toLowerCase();
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    onComplete?.(isCorrect);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-base md:text-lg text-zinc-800 dark:text-zinc-200 leading-relaxed">
        {sentence.split('[___]')[0]}
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={feedback !== null}
          className={`
            mx-2 px-3 py-1 min-w-[120px] border-2 rounded-lg
            text-center font-medium transition-all
            focus:ring-2 focus:ring-blue-500 focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            ${feedback === 'correct' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : ''}
            ${feedback === 'incorrect' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : ''}
            ${feedback === null ? 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white' : ''}
          `}
          placeholder="..."
        />
        {sentence.split('[___]')[1]}
      </p>

      {feedback === null && (
        <BaseButton
          onClick={checkAnswer}
          size="sm"
          variant="primary"
          disabled={!userAnswer.trim()}
        >
          Verificar
        </BaseButton>
      )}

      {feedback === 'correct' && (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
          <Check className="w-5 h-5" />
          <span>¡Correcto!</span>
        </div>
      )}

      {feedback === 'incorrect' && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
            <X className="w-5 h-5" strokeWidth={2} />
            <span>Incorrecto</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Respuesta correcta: <span className="font-semibold text-green-600 dark:text-green-400">{answer}</span>
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * MultipleChoice - Multiple choice question component
 */
const MultipleChoice = ({ question, options, correctIndex, onComplete }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const handleSelect = (index) => {
    if (hasAnswered) return;

    setSelectedIndex(index);
    setHasAnswered(true);

    const isCorrect = index === correctIndex;
    onComplete?.(isCorrect);
  };

  return (
    <div className="space-y-4">
      <p className="text-base md:text-lg font-medium text-zinc-800 dark:text-zinc-200">
        {question}
      </p>

      <div className="space-y-2">
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = index === correctIndex;
          const showFeedback = hasAnswered;

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={hasAnswered}
              className={`
                w-full text-left px-4 py-3 rounded-lg border-2
                transition-all duration-200 font-medium
                hover:shadow-md active:scale-[0.98]
                disabled:cursor-not-allowed
                ${!showFeedback && !isSelected ? 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:border-blue-400 text-zinc-900 dark:text-white' : ''}
                ${!showFeedback && isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-zinc-900 dark:text-white' : ''}
                ${showFeedback && isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : ''}
                ${showFeedback && isSelected && !isCorrect ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : ''}
                ${showFeedback && !isSelected && !isCorrect ? 'opacity-50 border-zinc-300 dark:border-zinc-600' : ''}
              `}
            >
              <div className="flex items-center justify-between gap-3">
                <span>{option.label} {option.text}</span>
                {showFeedback && isCorrect && <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" strokeWidth={2} />}
                {showFeedback && isSelected && !isCorrect && <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" strokeWidth={2} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * DragMatch - Drag and drop matching exercise
 */
const DragMatch = ({ dragItems, dropItems, onComplete }) => {
  const [matches, setMatches] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleDragStart = (item, index) => {
    setDraggedItem({ item, index });
  };

  const handleDrop = (dropIndex) => {
    if (!draggedItem) return;

    setMatches(prev => ({
      ...prev,
      [draggedItem.index]: dropIndex
    }));
    setDraggedItem(null);
  };

  const handleSubmit = () => {
    setHasSubmitted(true);

    // Check if all matches are correct
    const allCorrect = dragItems.every((_, index) => matches[index] === index);
    onComplete?.(allCorrect);
  };

  const isComplete = dragItems.length === Object.keys(matches).length;

  return (
    <div className="space-y-6">
      <p className="text-base font-medium text-gray-700 dark:text-gray-300">
        Arrastra cada elemento a su pareja correcta:
      </p>

      {/* Drag Items */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          Elementos
        </h4>
        <div className="flex flex-wrap gap-2">
          {dragItems.map((item, index) => {
            const isMatched = matches[index] !== undefined;
            const isCorrect = hasSubmitted && matches[index] === index;
            const isIncorrect = hasSubmitted && matches[index] !== undefined && matches[index] !== index;

            return (
              <div
                key={index}
                draggable={!hasSubmitted}
                onDragStart={() => handleDragStart(item, index)}
                className={`
                  px-4 py-2 rounded-lg border-2 cursor-move font-medium
                  transition-all select-none
                  ${isMatched ? 'opacity-50' : 'hover:shadow-lg hover:scale-105'}
                  ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
                  ${isIncorrect ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
                  ${!hasSubmitted && !isMatched ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600' : ''}
                  ${!hasSubmitted && isMatched ? 'border-gray-300 bg-gray-100 dark:bg-gray-700' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 opacity-50" />
                  {item}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drop Zones */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          Destinos
        </h4>
        <div className="space-y-2">
          {dropItems.map((item, index) => {
            const matchedDragIndex = Object.entries(matches).find(([_, dropIdx]) => dropIdx === index)?.[0];
            const hasMatch = matchedDragIndex !== undefined;
            const isCorrect = hasSubmitted && hasMatch && parseInt(matchedDragIndex) === index;
            const isIncorrect = hasSubmitted && hasMatch && parseInt(matchedDragIndex) !== index;

            return (
              <div
                key={index}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                className={`
                  min-h-[60px] px-4 py-3 rounded-lg border-2 border-dashed
                  transition-all flex items-center justify-between gap-3
                  ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
                  ${isIncorrect ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
                  ${!hasSubmitted && !hasMatch ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50' : ''}
                  ${!hasSubmitted && hasMatch ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
              >
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {item}
                  </div>
                  {hasMatch && (
                    <div className={`
                      font-medium
                      ${isCorrect ? 'text-green-700 dark:text-green-300' : ''}
                      ${isIncorrect ? 'text-red-700 dark:text-red-300' : ''}
                      ${!hasSubmitted ? 'text-blue-700 dark:text-blue-300' : ''}
                    `}>
                      → {dragItems[matchedDragIndex]}
                    </div>
                  )}
                </div>
                {hasSubmitted && isCorrect && <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />}
                {hasSubmitted && isIncorrect && <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {isComplete && !hasSubmitted && (
        <BaseButton onClick={handleSubmit} variant="primary" className="w-full md:w-auto">
          Verificar Respuestas
        </BaseButton>
      )}

      {hasSubmitted && (
        <div className={`
          p-4 rounded-lg flex items-center gap-3
          ${dragItems.every((_, index) => matches[index] === index)
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          }
        `}>
          {dragItems.every((_, index) => matches[index] === index) ? (
            <>
              <Check className="w-6 h-6 flex-shrink-0" />
              <span className="font-medium">¡Todas las respuestas son correctas!</span>
            </>
          ) : (
            <>
              <X className="w-6 h-6 flex-shrink-0" />
              <span className="font-medium">Algunas respuestas son incorrectas. Revisa las marcadas en rojo.</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * ListeningExercise - Audio comprehension exercise
 */
const ListeningExercise = ({ audioText, question, options, correctIndex, onComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasListened, setHasListened] = useState(false);

  const handlePlay = () => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      setHasListened(true);

      const utterance = new SpeechSynthesisUtterance(audioText);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;

      utterance.onend = () => {
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-4">
      {/* Audio Player */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-700">
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className={`
            w-full flex items-center justify-center gap-3
            px-6 py-4 rounded-lg font-medium
            transition-all duration-200
            ${isPlaying
              ? 'bg-blue-400 text-white cursor-wait'
              : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg active:scale-[0.98]'
            }
          `}
        >
          <Volume2 className={`w-6 h-6 ${isPlaying ? 'animate-pulse' : ''}`} />
          <span>{isPlaying ? 'Reproduciendo...' : hasListened ? 'Escuchar de nuevo' : 'Escuchar audio'}</span>
        </button>
      </div>

      {/* Question - Only show after listening */}
      {hasListened && (
        <MultipleChoice
          question={question}
          options={options}
          correctIndex={correctIndex}
          onComplete={onComplete}
        />
      )}
    </div>
  );
};

// ============================================================================
// PARSER FUNCTIONS
// ============================================================================

/**
 * Parse AI-generated text into structured exercises
 */
const parseExercises = (rawText) => {
  const exercises = [];
  const blocks = rawText.split('\n\n').filter(block => block.trim());

  let currentBlock = '';

  for (let i = 0; i < blocks.length; i++) {
    currentBlock += blocks[i] + '\n\n';

    // Gap-fill exercise
    if (currentBlock.includes('[___]') && currentBlock.includes('=')) {
      const lines = currentBlock.trim().split('\n');
      const sentence = lines.find(line => line.includes('[___]'));
      const answerLine = lines.find(line => line.match(/^=(.+)=$/));

      if (sentence && answerLine) {
        const answer = answerLine.match(/^=(.+)=$/)[1].trim();
        exercises.push({
          type: 'gap-fill',
          sentence,
          answer
        });
        currentBlock = '';
      }
    }

    // Multiple choice exercise
    else if (currentBlock.match(/--[A-D]--/) && currentBlock.includes('**')) {
      const lines = currentBlock.trim().split('\n').filter(line => line.trim());
      const question = lines[0];
      const optionLines = lines.slice(1).filter(line => line.match(/--[A-D]--/));

      const options = optionLines.map(line => {
        const match = line.match(/(\*\*)?--([A-D])--\s*(.+?)(\*\*)?$/);
        if (match) {
          return {
            label: `${match[2]}.`,
            text: match[3].replace(/\*\*/g, '').trim(),
            isCorrect: line.includes('**')
          };
        }
        return null;
      }).filter(Boolean);

      const correctIndex = options.findIndex(opt => opt.isCorrect);

      if (options.length >= 2 && correctIndex !== -1) {
        exercises.push({
          type: 'multiple-choice',
          question,
          options,
          correctIndex
        });
        currentBlock = '';
      }
    }

    // Drag-to-match exercise
    else if (currentBlock.includes('<drag>') && currentBlock.includes('<drop>')) {
      const dragMatches = currentBlock.match(/<drag>(.+?)<\/drag>/g);
      const dropMatches = currentBlock.match(/<drop>(.+?)<\/drop>/g);

      if (dragMatches && dropMatches && dragMatches.length === dropMatches.length) {
        const dragItems = dragMatches.map(m => m.replace(/<\/?drag>/g, '').trim());
        const dropItems = dropMatches.map(m => m.replace(/<\/?drop>/g, '').trim());

        exercises.push({
          type: 'drag-match',
          dragItems,
          dropItems
        });
        currentBlock = '';
      }
    }

    // Listening exercise
    else if (currentBlock.includes('<audio>')) {
      const audioMatch = currentBlock.match(/<audio>(.+?)<\/audio>/s);
      const remainingText = currentBlock.replace(/<audio>.+?<\/audio>/s, '').trim();

      if (audioMatch && remainingText.match(/--[A-D]--/)) {
        const audioText = audioMatch[1].trim();
        const lines = remainingText.split('\n').filter(line => line.trim());
        const question = lines[0];
        const optionLines = lines.slice(1).filter(line => line.match(/--[A-D]--/));

        const options = optionLines.map(line => {
          const match = line.match(/(\*\*)?--([A-D])--\s*(.+?)(\*\*)?$/);
          if (match) {
            return {
              label: `${match[2]}.`,
              text: match[3].replace(/\*\*/g, '').trim(),
              isCorrect: line.includes('**')
            };
          }
          return null;
        }).filter(Boolean);

        const correctIndex = options.findIndex(opt => opt.isCorrect);

        if (options.length >= 2 && correctIndex !== -1) {
          exercises.push({
            type: 'listening',
            audioText,
            question,
            options,
            correctIndex
          });
          currentBlock = '';
        }
      }
    }
  }

  return exercises;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ExerciseMakerESL = ({ isOpen, onClose }) => {
  // Form state
  const [formData, setFormData] = useState({
    theme: '',
    subtheme: '',
    type: '',
    difficulty: '',
    quantity: 3,
    context: ''
  });

  // AI Provider state
  const [selectedProvider, setSelectedProvider] = useState(AIService.getCurrentProvider() || 'openai');
  const [availableProviders, setAvailableProviders] = useState([]);

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [generatedText, setGeneratedText] = useState('');
  const [exercises, setExercises] = useState([]);
  const [completedExercises, setCompletedExercises] = useState({});

  // Load available providers on mount
  useEffect(() => {
    const providers = AIService.getAvailableProviders();
    setAvailableProviders(providers);
  }, []);

  // Handle provider change
  const handleProviderChange = (providerName) => {
    setSelectedProvider(providerName);
    AIService.setProvider(providerName);
    setError(null); // Clear any previous errors
  };

  // Options for dropdowns
  const themeOptions = [
    { value: '', label: 'Selecciona un tema...' },
    { value: 'gramática', label: 'Gramática' },
    { value: 'vocabulario', label: 'Vocabulario' },
    { value: 'pronunciación', label: 'Pronunciación' }
  ];

  const subthemeOptions = [
    { value: '', label: 'Selecciona un subtema...' },
    { value: 'verbos', label: 'Verbos' },
    { value: 'adjetivos', label: 'Adjetivos' },
    { value: 'sustantivos', label: 'Sustantivos' },
    { value: 'preguntas', label: 'Preguntas' },
    { value: 'tiempos verbales', label: 'Tiempos verbales' },
    { value: 'artículos', label: 'Artículos' }
  ];

  const typeOptions = [
    { value: '', label: 'Selecciona un tipo...' },
    { value: 'gap-fill', label: 'Rellenar espacios (Gap-fill)' },
    { value: 'multiple-choice', label: 'Opción múltiple' },
    { value: 'drag-to-match', label: 'Arrastrar y emparejar' },
    { value: 'listening', label: 'Comprensión auditiva' }
  ];

  const difficultyOptions = [
    { value: '', label: 'Selecciona un nivel...' },
    { value: 'A1', label: 'A1 - Principiante' },
    { value: 'A2', label: 'A2 - Elemental' },
    { value: 'B1', label: 'B1 - Intermedio' },
    { value: 'B2', label: 'B2 - Intermedio alto' },
    { value: 'C1', label: 'C1 - Avanzado' },
    { value: 'C2', label: 'C2 - Maestría' }
  ];

  const quantityOptions = Array.from({ length: 10 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1)
  }));

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        theme: '',
        subtheme: '',
        type: '',
        difficulty: '',
        quantity: 3,
        context: ''
      });
      setGeneratedText('');
      setExercises([]);
      setCompletedExercises({});
      setError(null);
    }
  }, [isOpen]);

  // Parse exercises when generated text changes
  useEffect(() => {
    if (generatedText) {
      const parsed = parseExercises(generatedText);
      setExercises(parsed);
    }
  }, [generatedText]);

  const handleGenerate = async () => {
    // Validation
    if (!formData.theme || !formData.subtheme || !formData.type || !formData.difficulty) {
      setError('Por favor, completa todos los campos obligatorios');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setGeneratedText('');
    setExercises([]);
    setCompletedExercises({});

    try {
      const result = await AIService.generateExercises({
        theme: formData.theme,
        subtheme: formData.subtheme,
        type: formData.type,
        difficulty: formData.difficulty,
        quantity: formData.quantity,
        context: formData.context
      });

      if (result.success) {
        setGeneratedText(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Error al generar ejercicios. Por favor, intenta de nuevo.');
      logger.error('Generate error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExerciseComplete = (index, isCorrect) => {
    setCompletedExercises(prev => ({
      ...prev,
      [index]: isCorrect
    }));
  };

  const isFormValid = formData.theme && formData.subtheme && formData.type && formData.difficulty;
  const hasExercises = exercises.length > 0;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Generador de Ejercicios ESL"
      icon={Sparkles}
      size="xl"
      showCloseButton
      closeOnOverlayClick={!isGenerating}
    >
      <div className="space-y-6">
        {/* AI Provider Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Proveedor de IA
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {availableProviders.map((provider) => (
              <button
                key={provider.name}
                onClick={() => handleProviderChange(provider.name)}
                disabled={!provider.configured}
                className={`
                  relative flex flex-col items-center gap-2 p-4 rounded-xl border-2
                  transition-all duration-200
                  ${selectedProvider === provider.name
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                  ${!provider.configured ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-[0.98]'}
                `}
                title={!provider.configured ? `${provider.label} no está configurado` : `Usar ${provider.label}`}
              >
                {/* Provider Icon & Name */}
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{provider.icon}</span>
                  <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                    {provider.label}
                  </span>
                </div>

                {/* Model Badge */}
                <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {provider.model}
                </span>

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  {provider.configured ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                      <Check className="w-3 h-3" />
                      OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-semibold">
                      <X className="w-3 h-3" />
                      Sin configurar
                    </span>
                  )}
                </div>

                {/* Selected Indicator */}
                {selectedProvider === provider.name && provider.configured && (
                  <div className="absolute inset-0 rounded-xl border-2 border-blue-500 pointer-events-none">
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            💡 Configura los proveedores en tu archivo .env con las variables VITE_OPENAI_API_KEY, VITE_GEMINI_API_KEY, VITE_GROK_API_KEY
          </p>
        </div>

        {/* Form Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Theme */}
            <BaseSelect
              label="Tema"
              value={formData.theme}
              onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
              options={themeOptions}
              required
            />

            {/* Subtheme */}
            <BaseSelect
              label="Subtema"
              value={formData.subtheme}
              onChange={(e) => setFormData(prev => ({ ...prev, subtheme: e.target.value }))}
              options={subthemeOptions}
              required
            />

            {/* Type */}
            <BaseSelect
              label="Tipo de ejercicio"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              options={typeOptions}
              required
            />

            {/* Difficulty */}
            <BaseSelect
              label="Nivel CEFR"
              value={formData.difficulty}
              onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
              options={difficultyOptions}
              required
            />

            {/* Quantity */}
            <div>
              <BaseSelect
                label="Cantidad"
                value={String(formData.quantity)}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                options={quantityOptions}
              />
            </div>
          </div>

          {/* Context (Optional) */}
          <BaseTextarea
            label="Contexto adicional (opcional)"
            value={formData.context}
            onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
            placeholder="Ej: usa animales cotidianos, vocabulario de cocina, situaciones de viaje..."
            rows={2}
          />

          {/* Error Alert */}
          {error && (
            <BaseAlert variant="error" title="Error">
              {error}
            </BaseAlert>
          )}

          {/* Generate Button */}
          <BaseButton
            onClick={handleGenerate}
            disabled={!isFormValid || isGenerating}
            loading={isGenerating}
            variant="primary"
            className="w-full"
            leftIcon={isGenerating ? Loader2 : Sparkles}
          >
            {isGenerating ? 'Generando ejercicios...' : 'Crear Ejercicios con IA'}
          </BaseButton>
        </div>

        {/* Exercises Display */}
        {hasExercises && (
          <div className="space-y-6 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                Ejercicios Generados ({exercises.length})
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Completados: {Object.keys(completedExercises).length} / {exercises.length}
              </div>
            </div>

            {exercises.map((exercise, index) => (
              <div
                key={index}
                className="p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
                    Ejercicio {index + 1}
                  </span>
                  {completedExercises[index] !== undefined && (
                    <span className={`
                      px-3 py-1 rounded-full text-sm font-semibold
                      ${completedExercises[index]
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }
                    `}>
                      {completedExercises[index] ? '✓ Correcto' : '✗ Incorrecto'}
                    </span>
                  )}
                </div>

                {exercise.type === 'gap-fill' && (
                  <FillGap
                    sentence={exercise.sentence}
                    answer={exercise.answer}
                    onComplete={(isCorrect) => handleExerciseComplete(index, isCorrect)}
                  />
                )}

                {exercise.type === 'multiple-choice' && (
                  <MultipleChoice
                    question={exercise.question}
                    options={exercise.options}
                    correctIndex={exercise.correctIndex}
                    onComplete={(isCorrect) => handleExerciseComplete(index, isCorrect)}
                  />
                )}

                {exercise.type === 'drag-match' && (
                  <DragMatch
                    dragItems={exercise.dragItems}
                    dropItems={exercise.dropItems}
                    onComplete={(isCorrect) => handleExerciseComplete(index, isCorrect)}
                  />
                )}

                {exercise.type === 'listening' && (
                  <ListeningExercise
                    audioText={exercise.audioText}
                    question={exercise.question}
                    options={exercise.options}
                    correctIndex={exercise.correctIndex}
                    onComplete={(isCorrect) => handleExerciseComplete(index, isCorrect)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              La IA está creando tus ejercicios...
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default ExerciseMakerESL;
