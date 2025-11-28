/**
 * @fileoverview ChainedExerciseViewer - Visualiza múltiples ejercicios encadenados
 * @module components/ChainedExerciseViewer
 *
 * Soporta dos modos de visualización:
 * - scroll: Todos los ejercicios visibles en lista vertical
 * - gallery: Navegación con flechas entre ejercicios
 *
 * Marcadores soportados:
 * #marcar, #arrastrar, #respuesta_libre, #opcion_multiple, #completar,
 * #emparejar, #verdadero_falso, #tabla, #texto
 */

import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  CheckCircle,
  Circle,
  MousePointer,
  GripVertical,
  HelpCircle,
  CheckSquare,
  PenLine,
  ArrowLeftRight,
  Table,
  FileText,
  AlertCircle
} from 'lucide-react';
import { parseChainedExercises, EXERCISE_TYPES, CHAIN_MARKERS } from '../utils/exerciseParser';
import { BaseButton, BaseBadge } from './common';

// Importar arquitectura unificada de ejercicios
import {
  ExerciseProvider,
  MultipleChoiceRenderer,
  FillBlankRenderer,
  OpenQuestionsRenderer,
  TrueFalseRenderer,
  MatchingRenderer,
  FEEDBACK_MODES
} from './exercises';

/**
 * Iconos y colores por tipo de ejercicio
 */
const EXERCISE_CONFIG = {
  [EXERCISE_TYPES.MARK_WORDS]: {
    icon: MousePointer,
    label: 'Marcar palabras',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    borderColor: 'border-purple-300 dark:border-purple-700'
  },
  [EXERCISE_TYPES.HIGHLIGHT]: {
    icon: MousePointer,
    label: 'Seleccionar',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    borderColor: 'border-yellow-300 dark:border-yellow-700'
  },
  [EXERCISE_TYPES.DRAG_DROP]: {
    icon: GripVertical,
    label: 'Arrastrar',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    borderColor: 'border-blue-300 dark:border-blue-700'
  },
  [EXERCISE_TYPES.ORDER]: {
    icon: GripVertical,
    label: 'Ordenar',
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    borderColor: 'border-cyan-300 dark:border-cyan-700'
  },
  [EXERCISE_TYPES.OPEN_QUESTIONS]: {
    icon: HelpCircle,
    label: 'Respuesta libre',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    borderColor: 'border-green-300 dark:border-green-700'
  },
  [EXERCISE_TYPES.MULTIPLE_CHOICE]: {
    icon: CheckSquare,
    label: 'Opción múltiple',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    borderColor: 'border-indigo-300 dark:border-indigo-700'
  },
  [EXERCISE_TYPES.FILL_BLANK]: {
    icon: PenLine,
    label: 'Completar',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    borderColor: 'border-orange-300 dark:border-orange-700'
  },
  [EXERCISE_TYPES.MATCHING]: {
    icon: ArrowLeftRight,
    label: 'Emparejar',
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    borderColor: 'border-pink-300 dark:border-pink-700'
  },
  [EXERCISE_TYPES.TRUE_FALSE]: {
    icon: CheckCircle,
    label: 'Verdadero/Falso',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    borderColor: 'border-teal-300 dark:border-teal-700'
  },
  [EXERCISE_TYPES.TABLE]: {
    icon: Table,
    label: 'Tabla',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
    borderColor: 'border-slate-300 dark:border-slate-700'
  },
  [EXERCISE_TYPES.INFO_TABLE]: {
    icon: Table,
    label: 'Tabla informativa',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
    borderColor: 'border-slate-300 dark:border-slate-700'
  },
  [EXERCISE_TYPES.TEXT]: {
    icon: FileText,
    label: 'Texto',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
    borderColor: 'border-gray-300 dark:border-gray-700'
  }
};

/**
 * Componente principal
 */
export default function ChainedExerciseViewer({
  text,
  defaultMode = 'scroll',
  showModeToggle = true,
  showProgress = true,
  maxHeight = '600px',
  onSectionComplete,
  className = ''
}) {
  const [viewMode, setViewMode] = useState(defaultMode); // 'scroll' | 'gallery'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState(new Set());

  // Parsear ejercicios
  const sections = useMemo(() => {
    console.log('ChainedExerciseViewer - Parsing text:', text?.substring(0, 100));
    const result = parseChainedExercises(text);
    console.log('ChainedExerciseViewer - Sections found:', result.length, result.map(s => s.type));
    return result;
  }, [text]);

  // Navegación en modo galería
  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => Math.min(sections.length - 1, prev + 1));
  };

  const goToSection = (index) => {
    setCurrentIndex(index);
    if (viewMode === 'scroll') {
      // Scroll to section
      const element = document.getElementById(`chained-section-${index}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const markAsComplete = (index) => {
    setCompletedSections(prev => new Set([...prev, index]));
    if (onSectionComplete) {
      onSectionComplete(index, sections[index]);
    }
  };

  // Si no hay secciones, mostrar mensaje
  if (sections.length === 0) {
    return (
      <div className={`p-8 text-center rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 ${className}`}>
        <AlertCircle size={48} className="mx-auto mb-4 text-zinc-400" />
        <p className="text-zinc-600 dark:text-zinc-400">
          No se encontraron ejercicios en el texto.
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2">
          Usa marcadores como <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">#marcar</code>,{' '}
          <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">#arrastrar</code>, etc.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header con controles */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Contador de secciones */}
        <div className="flex items-center gap-2">
          <BaseBadge variant="primary" size="lg">
            {sections.length} {sections.length === 1 ? 'ejercicio' : 'ejercicios'}
          </BaseBadge>
          {showProgress && completedSections.size > 0 && (
            <BaseBadge variant="success" size="lg">
              {completedSections.size}/{sections.length} completados
            </BaseBadge>
          )}
        </div>

        {/* Toggle de modo */}
        {showModeToggle && sections.length > 1 && (
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('scroll')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'scroll'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <List size={16} />
              Scroll
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'gallery'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid size={16} />
              Galería
            </button>
          </div>
        )}
      </div>

      {/* Mini navegación (dots) para galería */}
      {viewMode === 'gallery' && sections.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-2">
          {sections.map((section, index) => {
            const config = EXERCISE_CONFIG[section.type] || EXERCISE_CONFIG[EXERCISE_TYPES.TEXT];
            const isActive = index === currentIndex;
            const isCompleted = completedSections.has(index);

            return (
              <button
                key={section.id}
                onClick={() => goToSection(index)}
                className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? `${config.color} ring-2 ring-offset-2 ring-zinc-400 dark:ring-zinc-600`
                    : isCompleted
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
                title={`${config.label} (${index + 1}/${sections.length})`}
              >
                {isCompleted ? (
                  <CheckCircle size={16} />
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Contenido */}
      {viewMode === 'scroll' ? (
        /* Modo Scroll: todos visibles */
        <div
          className="space-y-6 overflow-y-auto pr-2"
          style={{ maxHeight }}
        >
          {sections.map((section, index) => (
            <div key={section.id} id={`chained-section-${index}`}>
              <ExerciseSection
                section={section}
                index={index}
                total={sections.length}
                isCompleted={completedSections.has(index)}
                onMarkComplete={() => markAsComplete(index)}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Modo Galería: uno a la vez con navegación */
        <div className="relative">
          <ExerciseSection
            section={sections[currentIndex]}
            index={currentIndex}
            total={sections.length}
            isCompleted={completedSections.has(currentIndex)}
            onMarkComplete={() => markAsComplete(currentIndex)}
            showNavigation
          />

          {/* Botones de navegación */}
          {sections.length > 1 && (
            <div className="flex items-center justify-between mt-4">
              <BaseButton
                variant="secondary"
                icon={ChevronLeft}
                onClick={goToPrevious}
                disabled={currentIndex === 0}
              >
                Anterior
              </BaseButton>

              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {currentIndex + 1} / {sections.length}
              </span>

              <BaseButton
                variant="secondary"
                onClick={goToNext}
                disabled={currentIndex === sections.length - 1}
              >
                Siguiente
                <ChevronRight size={16} className="ml-1" />
              </BaseButton>
            </div>
          )}
        </div>
      )}

      {/* Leyenda de marcadores */}
      <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
          Marcadores detectados:
        </p>
        <div className="flex flex-wrap gap-2">
          {[...new Set(sections.map(s => s.type))].map(type => {
            const config = EXERCISE_CONFIG[type] || EXERCISE_CONFIG[EXERCISE_TYPES.TEXT];
            const Icon = config.icon;
            return (
              <span
                key={type}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${config.color}`}
              >
                <Icon size={12} />
                {config.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Componente para renderizar una sección individual
 */
function ExerciseSection({ section, index, total, isCompleted, onMarkComplete, showNavigation = false }) {
  const config = EXERCISE_CONFIG[section.type] || EXERCISE_CONFIG[EXERCISE_TYPES.TEXT];
  const Icon = config.icon;

  return (
    <div
      className={`rounded-xl border-2 overflow-hidden transition-all ${
        isCompleted
          ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
          : config.borderColor
      }`}
    >
      {/* Header de la sección */}
      <div className={`px-4 py-3 flex items-center justify-between ${config.color}`}>
        <div className="flex items-center gap-2">
          <Icon size={18} />
          <span className="font-semibold">{config.label}</span>
          <span className="text-xs opacity-75">
            ({index + 1}/{total})
          </span>
        </div>
        {isCompleted && (
          <span className="flex items-center gap-1 text-green-700 dark:text-green-300">
            <CheckCircle size={16} />
            <span className="text-xs font-medium">Completado</span>
          </span>
        )}
      </div>

      {/* Contenido del ejercicio */}
      <div className="p-4 bg-white dark:bg-zinc-900">
        <ExerciseContent section={section} />

        {/* Botón para marcar como completado */}
        {!isCompleted && (
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button
              onClick={onMarkComplete}
              className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              <Circle size={16} />
              Marcar como completado
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Renderiza el contenido específico según el tipo de ejercicio
 */
function ExerciseContent({ section }) {
  const { type, parsed } = section;

  switch (type) {
    case EXERCISE_TYPES.MARK_WORDS:
      return <MarkWordsContent data={parsed} />;

    case EXERCISE_TYPES.HIGHLIGHT:
      return <HighlightContent data={parsed} />;

    case EXERCISE_TYPES.DRAG_DROP:
    case EXERCISE_TYPES.ORDER:
      return <DragDropContent data={parsed} />;

    case EXERCISE_TYPES.OPEN_QUESTIONS:
      return <OpenQuestionsContent data={parsed} />;

    case EXERCISE_TYPES.MULTIPLE_CHOICE:
      return <MCQContent data={parsed} />;

    case EXERCISE_TYPES.FILL_BLANK:
      return <FillBlankContent data={parsed} />;

    case EXERCISE_TYPES.MATCHING:
      return <MatchingContent data={parsed} />;

    case EXERCISE_TYPES.TRUE_FALSE:
      return <TrueFalseContent data={parsed} />;

    case EXERCISE_TYPES.TABLE:
    case EXERCISE_TYPES.INFO_TABLE:
      return <TableContent data={parsed} />;

    case EXERCISE_TYPES.TEXT:
    default:
      return <TextContent data={parsed} />;
  }
}

/* ========== Componentes de contenido específicos ========== */

function MarkWordsContent({ data }) {
  const [selectedWords, setSelectedWords] = useState(new Set());

  const toggleWord = (word) => {
    setSelectedWords(prev => {
      const next = new Set(prev);
      if (next.has(word)) {
        next.delete(word);
      } else {
        next.add(word);
      }
      return next;
    });
  };

  // Renderizar texto con palabras clickeables
  const words = data.text.split(/(\s+)/);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {data.instruction}
      </p>
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg leading-relaxed">
        {words.map((word, i) => {
          const cleanWord = word.replace(/[.,;:!?]/g, '');
          const isTarget = data.wordsToMark.some(w =>
            w.toLowerCase() === cleanWord.toLowerCase()
          );
          const isSelected = selectedWords.has(cleanWord.toLowerCase());

          if (/^\s+$/.test(word)) {
            return <span key={i}>{word}</span>;
          }

          return (
            <span
              key={i}
              onClick={() => isTarget && toggleWord(cleanWord.toLowerCase())}
              className={`${
                isTarget
                  ? `cursor-pointer rounded px-0.5 transition-colors ${
                      isSelected
                        ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                        : 'hover:bg-purple-100 dark:hover:bg-purple-900/50'
                    }`
                  : ''
              }`}
            >
              {word}
            </span>
          );
        })}
      </div>
      {data.wordsToMark.length > 0 && (
        <p className="text-xs text-zinc-500">
          {selectedWords.size}/{data.wordsToMark.length} palabras seleccionadas
        </p>
      )}
    </div>
  );
}

function HighlightContent({ data }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {data.instruction}
      </p>
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
        <p>{data.text}</p>
      </div>
      {data.targetWords?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-zinc-500">Palabras objetivo:</span>
          {data.targetWords.map((word, i) => (
            <span key={i} className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded text-sm">
              {word}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DragDropContent({ data }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {data.instruction}
      </p>
      <div className="flex flex-wrap gap-2">
        {data.shuffledWords?.map((word, i) => (
          <span
            key={i}
            className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg font-medium cursor-grab hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            {word}
          </span>
        ))}
      </div>
      <div className="p-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg min-h-[60px] flex items-center justify-center text-zinc-400">
        Arrastra las palabras aquí en el orden correcto
      </div>
    </div>
  );
}

/**
 * OpenQuestionsContent - Usa el renderer unificado OpenQuestionsRenderer
 */
function OpenQuestionsContent({ data }) {
  // Configuración para feedback instantáneo
  const config = {
    feedbackMode: FEEDBACK_MODES.ON_SUBMIT,
    soundEnabled: true,
    showCorrectAnswer: true
  };

  return (
    <ExerciseProvider config={config}>
      <OpenQuestionsRenderer
        questions={data.questions || []}
        showExpectedAnswer={true}
      />
    </ExerciseProvider>
  );
}

/**
 * MCQContent - Usa el renderer unificado MultipleChoiceRenderer
 */
function MCQContent({ data }) {
  // Encontrar el índice de la respuesta correcta
  const correctAnswerIndex = data.options?.findIndex(opt => opt.correct) ?? 0;

  // Extraer solo los textos de las opciones
  const optionTexts = data.options?.map(opt => opt.text) || [];

  // Configuración para feedback instantáneo
  const config = {
    feedbackMode: FEEDBACK_MODES.INSTANT,
    soundEnabled: true,
    showCorrectAnswer: true,
    showExplanation: true
  };

  return (
    <ExerciseProvider config={config}>
      <MultipleChoiceRenderer
        question={data.question}
        options={optionTexts}
        correctAnswer={correctAnswerIndex}
        explanation={data.explanation}
        showLetters={true}
      />
    </ExerciseProvider>
  );
}

/**
 * FillBlankContent - Usa el renderer unificado FillBlankRenderer
 */
function FillBlankContent({ data }) {
  // Configuración para feedback instantáneo
  const config = {
    feedbackMode: FEEDBACK_MODES.INSTANT,
    soundEnabled: true,
    showCorrectAnswer: true
  };

  // El renderer espera 'text' con formato *palabra* o ___palabra___
  // data.sentence viene con formato ___respuesta___ del parser
  return (
    <ExerciseProvider config={config}>
      <FillBlankRenderer
        text={data.sentence}
        answers={data.answers || []}
        caseSensitive={false}
      />
    </ExerciseProvider>
  );
}

/**
 * MatchingContent - Usa el renderer unificado MatchingRenderer
 */
function MatchingContent({ data }) {
  // Configuración para feedback instantáneo
  const config = {
    feedbackMode: FEEDBACK_MODES.INSTANT,
    soundEnabled: true,
    showCorrectAnswer: true
  };

  return (
    <ExerciseProvider config={config}>
      <MatchingRenderer
        title={data.title}
        pairs={data.pairs || []}
        shuffleRight={true}
      />
    </ExerciseProvider>
  );
}

/**
 * TrueFalseContent - Usa el renderer unificado TrueFalseRenderer
 */
function TrueFalseContent({ data }) {
  // Configuración para feedback instantáneo
  const config = {
    feedbackMode: FEEDBACK_MODES.INSTANT,
    soundEnabled: true,
    showCorrectAnswer: true,
    showExplanation: true
  };

  // Convertir dato único a formato array esperado por el renderer
  const statements = [{
    statement: data.statement,
    correct: data.correct,
    explanation: data.explanation
  }];

  return (
    <ExerciseProvider config={config}>
      <TrueFalseRenderer
        statements={statements}
      />
    </ExerciseProvider>
  );
}

function TableContent({ data }) {
  return (
    <div className="space-y-4">
      {data.title && (
        <p className="text-zinc-900 dark:text-white font-medium">
          {data.title}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {data.columns?.map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-semibold text-left"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows?.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="px-4 py-2 border border-zinc-300 dark:border-zinc-700"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.notes?.length > 0 && (
        <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
          {data.notes.map((note, i) => (
            <p key={i}>📝 {note}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function TextContent({ data }) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
        {data.content}
      </p>
    </div>
  );
}
