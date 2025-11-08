/**
 * ExerciseGeneratorContent - Contenido del generador de ejercicios con IA
 * (Sin el wrapper de BaseModal, para uso embebido)
 */

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Check, X, Volume2, GripVertical } from 'lucide-react';
import BaseButton from './common/BaseButton';
import BaseSelect from './common/BaseSelect';
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
            focus:ring-2 focus:ring-gray-500 focus:outline-none
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
  const [feedback, setFeedback] = useState(null);

  const handleSelect = (index) => {
    if (feedback !== null) return;
    setSelectedIndex(index);
  };

  const checkAnswer = () => {
    const isCorrect = selectedIndex === correctIndex;
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    onComplete?.(isCorrect);
  };

  return (
    <div className="space-y-4">
      <p className="text-base md:text-lg font-medium text-zinc-800 dark:text-zinc-200">
        {question}
      </p>

      <div className="space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={feedback !== null}
            className={`
              w-full p-4 text-left rounded-lg border-2 transition-all
              disabled:cursor-not-allowed
              ${selectedIndex === index && feedback === null ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
              ${selectedIndex !== index && feedback === null ? 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500' : ''}
              ${feedback === 'correct' && index === correctIndex ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
              ${feedback === 'incorrect' && index === selectedIndex ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
              ${feedback === 'incorrect' && index === correctIndex ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {option.label}
              </span>
              <span className="text-zinc-800 dark:text-zinc-200">{option.text}</span>
              {feedback !== null && index === correctIndex && (
                <Check className="w-5 h-5 text-green-600 dark:text-green-400 ml-auto" />
              )}
              {feedback === 'incorrect' && index === selectedIndex && index !== correctIndex && (
                <X className="w-5 h-5 text-red-600 dark:text-red-400 ml-auto" />
              )}
            </div>
          </button>
        ))}
      </div>

      {feedback === null && selectedIndex !== null && (
        <BaseButton onClick={checkAnswer} variant="primary" size="sm">
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
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
          <X className="w-5 h-5" />
          <span>Incorrecto. La respuesta correcta es {options[correctIndex].label}</span>
        </div>
      )}
    </div>
  );
};

/**
 * DragMatch - Drag and drop matching exercise
 */
const DragMatch = ({ dragItems, dropItems, onComplete }) => {
  const [matches, setMatches] = useState({});
  const [feedback, setFeedback] = useState(null);

  const handleDrop = (dragIndex, dropIndex) => {
    if (feedback !== null) return;
    setMatches(prev => ({ ...prev, [dragIndex]: dropIndex }));
  };

  const checkAnswer = () => {
    const isCorrect = dragItems.every((_, index) => matches[index] === index);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    onComplete?.(isCorrect);
  };

  const allMatched = Object.keys(matches).length === dragItems.length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Arrastra cada elemento a su correspondiente pareja
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Drag items */}
        <div className="space-y-2">
          {dragItems.map((item, index) => (
            <div
              key={index}
              className={`
                p-3 rounded-lg border-2 cursor-move
                ${matches[index] !== undefined ? 'opacity-50' : 'hover:border-blue-500'}
                ${feedback === 'correct' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
                ${feedback === 'incorrect' && matches[index] !== index ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
                ${feedback === null ? 'border-zinc-300 dark:border-zinc-600' : ''}
              `}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-800 dark:text-zinc-200">{item}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Drop zones */}
        <div className="space-y-2">
          {dropItems.map((item, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 min-h-[48px] flex items-center"
            >
              <span className="text-zinc-800 dark:text-zinc-200">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {feedback === null && allMatched && (
        <BaseButton onClick={checkAnswer} variant="primary" size="sm">
          Verificar
        </BaseButton>
      )}

      {feedback === 'correct' && (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
          <Check className="w-5 h-5" />
          <span>¡Todas las coincidencias son correctas!</span>
        </div>
      )}

      {feedback === 'incorrect' && (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
          <X className="w-5 h-5" />
          <span>Algunas coincidencias son incorrectas</span>
        </div>
      )}
    </div>
  );
};

/**
 * ListeningExercise - Listening comprehension exercise
 */
const ListeningExercise = ({ audioText, question, options, correctIndex, onComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handlePlay = () => {
    const utterance = new SpeechSynthesisUtterance(audioText);
    utterance.lang = 'es-ES';
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSelect = (index) => {
    if (feedback !== null) return;
    setSelectedIndex(index);
  };

  const checkAnswer = () => {
    const isCorrect = selectedIndex === correctIndex;
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    onComplete?.(isCorrect);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BaseButton
          onClick={handlePlay}
          disabled={isPlaying}
          variant="secondary"
          size="sm"
          leftIcon={Volume2}
        >
          {isPlaying ? 'Reproduciendo...' : 'Escuchar audio'}
        </BaseButton>
      </div>

      <p className="text-base md:text-lg font-medium text-zinc-800 dark:text-zinc-200">
        {question}
      </p>

      <div className="space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={feedback !== null}
            className={`
              w-full p-4 text-left rounded-lg border-2 transition-all
              ${selectedIndex === index && feedback === null ? 'border-gray-500 bg-gray-50 dark:bg-gray-900/20' : ''}
              ${selectedIndex !== index && feedback === null ? 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400' : ''}
              ${feedback === 'correct' && index === correctIndex ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
              ${feedback === 'incorrect' && index === selectedIndex ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
              ${feedback === 'incorrect' && index === correctIndex ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{option.label}</span>
              <span className="text-zinc-800 dark:text-zinc-200">{option.text}</span>
              {feedback !== null && index === correctIndex && (
                <Check className="w-5 h-5 text-green-600 dark:text-green-400 ml-auto" />
              )}
            </div>
          </button>
        ))}
      </div>

      {feedback === null && selectedIndex !== null && (
        <BaseButton onClick={checkAnswer} variant="primary" size="sm">
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
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
          <X className="w-5 h-5" />
          <span>Incorrecto. La respuesta correcta es {options[correctIndex].label}</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PARSER
// ============================================================================

/**
 * parseExercises - Parse AI-generated text into structured exercise objects
 */
const parseExercises = (text) => {
  const exercises = [];
  const blocks = text.split(/\n\n+/);

  for (const block of blocks) {
    let currentBlock = block.trim();
    if (!currentBlock) continue;

    // Gap-fill exercise
    if (currentBlock.includes('[___]') && currentBlock.includes('[ANS:')) {
      const answerMatch = currentBlock.match(/\[ANS:\s*(.+?)\]/);
      if (answerMatch) {
        const answer = answerMatch[1].trim();
        const sentence = currentBlock.replace(/\[ANS:.+?\]/, '').trim();

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

const ExerciseGeneratorContent = () => {
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
    setError(null);
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
                <div className="absolute inset-0 rounded-xl border-2 border-gray-500 pointer-events-none">
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
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
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-semibold">
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
          <Loader2 className="w-12 h-12 text-gray-500 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            La IA está creando tus ejercicios...
          </p>
        </div>
      )}
    </div>
  );
};

export default ExerciseGeneratorContent;
