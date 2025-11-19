/**
 * ExerciseGeneratorContent - Contenido del generador de ejercicios con IA
 * (Sin el wrapper de BaseModal, para uso embebido)
 */

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Check, X, Volume2, GripVertical, Settings } from 'lucide-react';
import BaseButton from './common/BaseButton';
import BaseSelect from './common/BaseSelect';
import BaseTextarea from './common/BaseTextarea';
import BaseAlert from './common/BaseAlert';
import BaseInput from './common/BaseInput';
import aiService from '../services/AIService';
import { AI_PROVIDERS } from '../constants/aiFunctions';
import { callAI, getAIConfig } from '../firebase/aiConfig';
import logger from '../utils/logger';

// ============================================================================
// INTERACTIVE EXERCISE COMPONENTS
// ============================================================================

/**
 * FillGap - Fill in the blank exercise component
 */
export const FillGap = ({ sentence, answer, onComplete }) => {
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
            focus:ring-2 focus:ring-gray-400 focus:outline-none
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
export const MultipleChoice = ({ question, options, correctIndex, onComplete }) => {
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
              ${selectedIndex === index && feedback === null ? 'border-zinc-500 bg-zinc-50 dark:bg-zinc-900' : ''}
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
                ${matches[index] !== undefined ? 'opacity-50' : 'hover:border-zinc-500'}
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
          icon={Volume2}
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
              ${selectedIndex === index && feedback === null ? 'border-zinc-500 bg-zinc-50 dark:bg-zinc-900' : ''}
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
    if (currentBlock.includes('[___]') && currentBlock.includes('=')) {
      const answerMatch = currentBlock.match(/=(.+?)=/);
      if (answerMatch) {
        const answer = answerMatch[1].trim();
        const sentence = currentBlock.replace(/=.+?=/, '').trim();

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

const ExerciseGeneratorContent = ({ onNavigateToAIConfig, onExercisesGenerated }) => {
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
  const [selectedProvider, setSelectedProvider] = useState(aiService.getCurrentProvider() || 'openai');
  const [availableProviders, setAvailableProviders] = useState([]);

  // AI Configuration state
  const [aiConfig, setAiConfig] = useState({
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1,
    systemPrompt: 'Eres un asistente experto en crear ejercicios de español como lengua extranjera. Genera ejercicios creativos, educativos y apropiados para el nivel especificado.'
  });

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [generatedText, setGeneratedText] = useState('');
  const [exercises, setExercises] = useState([]);
  const [completedExercises, setCompletedExercises] = useState({});

  // Load available providers on mount
  useEffect(() => {
    const providers = aiService.getAvailableProviders();
    setAvailableProviders(providers);
  }, []);

  // Handle provider change
  const handleProviderChange = (e) => {
    const providerName = e.target.value;
    setSelectedProvider(providerName);
    aiService.setProvider(providerName);
    setError(null);
  };

  // Handle AI config change
  const handleAiConfigChange = (field, value) => {
    setAiConfig(prev => ({
      ...prev,
      [field]: value
    }));
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
      logger.info('Parsing exercises from generatedText, length:', generatedText.length);
      const parsed = parseExercises(generatedText);
      logger.info('Parsed exercises count:', parsed.length);
      logger.info('Parsed exercises:', parsed);
      setExercises(parsed);

      // Notify parent component if callback provided (only once per generation)
      if (onExercisesGenerated && parsed.length > 0) {
        onExercisesGenerated({
          exercises: parsed,
          rawText: generatedText,
          metadata: {
            theme: formData.theme,
            subtheme: formData.subtheme,
            type: formData.type,
            difficulty: formData.difficulty,
            quantity: formData.quantity
          }
        });
      }
    }
  }, [generatedText]); // Only depend on generatedText to avoid infinite loops

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
      // Build the exercise generation prompt
      const { theme, subtheme, type, difficulty, quantity, context } = formData;

      let prompt = `Genera ${quantity} ejercicio${quantity > 1 ? 's' : ''} de ${type} sobre ${subtheme} (tema: ${theme}) para estudiantes de español, nivel ${difficulty}.`;

      if (context && context.trim()) {
        prompt += ` ${context}.`;
      }

      prompt += `

FORMATO OBLIGATORIO (usa EXACTAMENTE estos marcadores):

Para gap-fill (rellenar espacios):
- Usa [___] para espacios en blanco
- Después de cada ejercicio, indica la respuesta correcta con =respuesta=
Ejemplo:
El gato [___] en el sofá.
=duerme=

Para multiple-choice (opción múltiple):
- Escribe la pregunta
- Opciones con --A--, --B--, --C--, --D--
- Marca la correcta con ** antes y después, ejemplo: **--A--**
Ejemplo:
¿Cuál es el verbo correcto?
--A-- como
**--B-- comer**
--C-- comiendo
--D-- comí

Para drag-to-match (arrastrar y emparejar):
- Usa <drag>palabra</drag> para elementos arrastrables
- Usa <drop>respuesta_correcta</drop> para zonas de destino
- Pon las opciones y destinos en líneas separadas
Ejemplo:
Empareja cada animal con su sonido:
<drag>perro</drag> <drag>gato</drag> <drag>vaca</drag>
<drop>guau</drop> <drop>miau</drop> <drop>muu</drop>

Para listening (comprensión auditiva):
- Texto entre <audio>texto_para_leer</audio>
- Preguntas de comprensión después con --A--, --B--, etc.
- Marca respuesta correcta con **
Ejemplo:
<audio>María va al mercado cada domingo por la mañana.</audio>
¿Cuándo va María al mercado?
**--A-- Los domingos**
--B-- Los lunes
--C-- Cada tarde
--D-- Nunca

IMPORTANTE:
- Usa SOLO los marcadores especificados
- Separa cada ejercicio con una línea en blanco
- Nivel ${difficulty} apropiado
- Contenido 100% en español
- Si hay contexto específico, úsalo
- No agregues explicaciones extra, solo los ejercicios`;

      // Get the selected provider's model
      const currentProvider = AI_PROVIDERS.find(p => p.id === selectedProvider);
      const providerInfo = availableProviders.find(p => p.name === selectedProvider);

      // Call AI via Cloud Function
      const response = await callAI(selectedProvider, prompt, {
        model: providerInfo?.model || currentProvider?.models[0]?.value || 'gpt-4',
        systemPrompt: aiConfig.systemPrompt,
        parameters: {
          temperature: aiConfig.temperature,
          maxTokens: aiConfig.maxTokens,
          topP: aiConfig.topP
        }
      });

      logger.info('AI response received, length:', response?.length);
      logger.info('Response preview:', response?.substring(0, 200));

      setGeneratedText(response);

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

  // Crear opciones de proveedores para el dropdown
  const providerOptions = availableProviders.map(p => ({
    value: p.name,
    label: `${p.label} - ${p.model}`,
    disabled: !p.configured
  }));

  // Obtener información del proveedor seleccionado
  const currentProvider = AI_PROVIDERS.find(p => p.id === selectedProvider);

  return (
    <div className="space-y-6">
      {/* AI Configuration Section */}
      <div className="space-y-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
          Configuración de IA
        </h3>

        {/* Provider Selector (Dropdown) */}
        <BaseSelect
          label="Proveedor de IA"
          value={selectedProvider}
          onChange={handleProviderChange}
          options={providerOptions}
          required
        />

        {/* System Prompt */}
        <BaseTextarea
          label="System Prompt"
          value={aiConfig.systemPrompt}
          onChange={(e) => handleAiConfigChange('systemPrompt', e.target.value)}
          placeholder="Define cómo debe comportarse la IA..."
          rows={3}
          helperText="Instrucciones para guiar el comportamiento de la IA"
        />

        {/* Advanced Parameters */}
        {currentProvider && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Temperature */}
            {currentProvider.supportsTemperature && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Temperature ({aiConfig.temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={aiConfig.temperature}
                  onChange={(e) => handleAiConfigChange('temperature', parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-zinc-600 dark:accent-zinc-400"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                  Creatividad (0 = preciso, 2 = creativo)
                </p>
              </div>
            )}

            {/* Max Tokens */}
            {currentProvider.supportsMaxTokens && (
              <BaseInput
                type="number"
                label="Max Tokens"
                min="100"
                max="4000"
                step="100"
                value={aiConfig.maxTokens}
                onChange={(e) => handleAiConfigChange('maxTokens', parseInt(e.target.value))}
                helperText="Longitud máxima de respuesta"
              />
            )}

            {/* Top P */}
            {currentProvider.supportsTopP && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Top P ({aiConfig.topP})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={aiConfig.topP}
                  onChange={(e) => handleAiConfigChange('topP', parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-zinc-600 dark:accent-zinc-400"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                  Diversidad de respuestas
                </p>
              </div>
            )}
          </div>
        )}

        {/* Warning for Claude */}
        {currentProvider?.id === 'claude' && (
          <BaseAlert variant="info">
            ℹ️ Claude no soporta el parámetro Top P. Solo puedes ajustar Temperature y Max Tokens.
          </BaseAlert>
        )}
      </div>

      {/* Exercise Parameters Section */}
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
          icon={isGenerating ? Loader2 : Sparkles}
        >
          {isGenerating ? 'Generando ejercicios...' : 'Crear Ejercicios con IA'}
        </BaseButton>
      </div>

      {/* Exercises Display */}
      {hasExercises && (
        <div className="space-y-6 pt-6 border-t-2 border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Ejercicios Generados ({exercises.length})
            </h3>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Completados: {Object.keys(completedExercises).length} / {exercises.length}
            </div>
          </div>

          {exercises.map((exercise, index) => (
            <div
              key={index}
              className="p-6 bg-white dark:bg-zinc-800 rounded-xl border-2 border-zinc-200 dark:border-zinc-700"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full text-sm font-semibold">
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
          <Loader2 className="w-12 h-12 text-zinc-500 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            La IA está creando tus ejercicios...
          </p>
        </div>
      )}
    </div>
  );
};

export default ExerciseGeneratorContent;
