/**
 * @fileoverview Página principal del Design Lab
 * @module pages/DesignLabPage
 */

import { useState } from 'react';
import {
  Palette,
  FileText,
  Layers,
  BookOpen,
  Download,
  Upload,
  Home,
  Star,
  TrendingUp
} from 'lucide-react';
import { BaseButton, BaseCard, BaseBadge, BaseEmptyState, BaseLoading } from '../components/common';
import { TextToExerciseParser } from '../components/designlab/TextToExerciseParser';
import { SettingsPanel } from '../components/designlab/SettingsPanel';
import {
  MultipleChoiceExercise,
  FillInBlankExercise,
  MatchingExercise,
  TrueFalseExercise,
  AudioListeningExercise,
  TextSelectionExercise,
  DragDropOrderExercise,
  DialogueRolePlayExercise,
  VerbIdentificationExercise,
  InteractiveReadingExercise,
  AIAudioPronunciationExercise,
  FreeDragDropExercise
} from '../components/designlab/exercises';
import { useDesignLabConfig } from '../hooks/useDesignLabConfig';
import logger from '../utils/logger';

/**
 * Design Lab - Módulo para diseñar y probar interfaces de ejercicios ELE
 */
export function DesignLabPage() {
  const { config, loading } = useDesignLabConfig();
  const [activeView, setActiveView] = useState('home'); // home | parser | examples | stats
  const [generatedExercises, setGeneratedExercises] = useState([]);
  const [stats, setStats] = useState({
    totalExercises: 0,
    completedExercises: 0,
    averageScore: 0,
    totalPoints: 0
  });

  const handleExerciseGenerated = (exercise) => {
    setGeneratedExercises((prev) => [...prev, { ...exercise, id: Date.now() }]);
    logger.info('Exercise added to collection');
  };

  const handleExerciseComplete = (result) => {
    logger.info('Exercise completed:', result);

    setStats((prev) => ({
      totalExercises: prev.totalExercises + 1,
      completedExercises: prev.completedExercises + (result.correct ? 1 : 0),
      averageScore: Math.round(
        ((prev.averageScore * prev.totalExercises) + result.score) / (prev.totalExercises + 1)
      ),
      totalPoints: prev.totalPoints + result.score
    }));
  };

  const exportExercises = () => {
    const dataStr = JSON.stringify(generatedExercises, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `design-lab-exercises-${Date.now()}.json`;
    link.click();
    logger.info('Exercises exported');
  };

  const views = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'parser', label: 'Parser', icon: FileText },
    { id: 'examples', label: 'Ejemplos', icon: Layers },
    { id: 'stats', label: 'Estadísticas', icon: TrendingUp }
  ];

  // Ejemplos predefinidos
  const examples = [
    {
      type: 'mcq',
      title: 'MCQ: Saludos',
      props: {
        question: '¿Cuál es el saludo más formal?',
        options: [
          { value: 'a', label: '¡Hola!' },
          { value: 'b', label: 'Buenos días' },
          { value: 'c', label: '¿Qué tal?' },
          { value: 'd', label: '¿Qué pasa?' }
        ],
        correctAnswer: 'b',
        explanation: 'Buenos días es el saludo formal que se usa en contextos profesionales.',
        cefrLevel: 'A1',
        hints: ['Piensa en un contexto profesional', 'Es una expresión de dos palabras'],
        onComplete: handleExerciseComplete
      }
    },
    {
      type: 'blank',
      title: 'Blank: Verbos reflexivos',
      props: {
        sentence: 'Yo ___ María y tengo 25 años.',
        correctAnswer: ['me llamo', 'llamo'],
        explanation: 'Usamos "me llamo" para presentarnos. Es un verbo reflexivo.',
        cefrLevel: 'A1',
        hints: ['Es un verbo reflexivo', 'Empieza con "me"'],
        onComplete: handleExerciseComplete
      }
    },
    {
      type: 'match',
      title: 'Match: Expresiones con "tener"',
      props: {
        title: 'Empareja las expresiones',
        pairs: [
          { left: 'tener sed', right: 'to be thirsty' },
          { left: 'tener hambre', right: 'to be hungry' },
          { left: 'tener frío', right: 'to be cold' },
          { left: 'tener calor', right: 'to be hot' }
        ],
        explanation: 'En español usamos el verbo "tener" para expresar sensaciones físicas.',
        cefrLevel: 'B1',
        onComplete: handleExerciseComplete
      }
    },
    {
      type: 'truefalse',
      title: 'True/False: Gramática',
      props: {
        statement: 'En español, todos los adjetivos van antes del sustantivo.',
        correctAnswer: false,
        explanation: 'En español, la mayoría de los adjetivos van después del sustantivo, aunque algunos pueden ir antes (grande, pequeño, buen, mal, etc.).',
        cefrLevel: 'A2',
        onComplete: handleExerciseComplete
      }
    },
    {
      type: 'audio-listening',
      title: 'Audio: Comprensión Auditiva (Español Rioplatense)',
      props: {
        title: 'Diálogo en el Supermercado',
        audioUrl: '/audio/ejemplo-rioplatense.mp3', // Reemplazar con URL real
        transcript: 'Che, ¿vos sabés dónde están las galletitas? Sí, mirá, están en el pasillo tres, al lado de los cereales.',
        questions: [
          {
            question: '¿Qué está buscando la persona?',
            options: [
              { value: 'a', label: 'Cereales' },
              { value: 'b', label: 'Galletitas' },
              { value: 'c', label: 'Pan' }
            ],
            correctAnswer: 'b'
          },
          {
            question: '¿En qué pasillo están las galletitas?',
            options: [
              { value: 'a', label: 'Pasillo 1' },
              { value: 'b', label: 'Pasillo 2' },
              { value: 'c', label: 'Pasillo 3' }
            ],
            correctAnswer: 'c'
          }
        ],
        explanation: 'El español rioplatense usa "vos" en lugar de "tú" y tiene entonación característica.',
        cefrLevel: 'B1',
        showTranscript: false,
        onComplete: handleExerciseComplete
      }
    },
    {
      type: 'text-selection',
      title: 'Selección: Español → Chino',
      props: {
        instruction: 'Selecciona la palabra que significa "libro"',
        text: 'En la mesa hay un libro, una pluma y un cuaderno.',
        words: [
          { spanish: 'mesa', chinese: '桌子', start: 6, end: 10 },
          { spanish: 'libro', chinese: '书', start: 18, end: 23 },
          { spanish: 'pluma', chinese: '钢笔', start: 29, end: 34 },
          { spanish: 'cuaderno', chinese: '笔记本', start: 40, end: 48 }
        ],
        targetWord: 'libro',
        explanation: '书 (shū) significa "libro" en chino.',
        cefrLevel: 'A2',
        onComplete: handleExerciseComplete
      }
    },
    {
      type: 'dragdrop-order',
      title: 'Drag & Drop: Ordenar Oración',
      props: {
        instruction: 'Arrastra las palabras para formar la oración correcta',
        items: ['Yo', 'me', 'levanto', 'a', 'las', 'ocho'],
        explanation: 'En español, el verbo reflexivo va después del pronombre.',
        cefrLevel: 'A1',
        showNumbers: true,
        onComplete: handleExerciseComplete
      }
    },
    {
      type: 'dialogue-roleplay',
      title: 'Diálogo: En el Restaurante',
      props: {
        title: 'Conversación en un Restaurante',
        context: 'Estás en un restaurante y el mesero viene a tomar tu orden.',
        dialogue: [
          { speaker: 'A', text: 'Buenas tardes, ¿qué desea ordenar?' },
          { speaker: 'B', userInput: true, correctAnswers: ['Quiero una pizza', 'Una pizza por favor', 'Me gustaría una pizza'] },
          { speaker: 'A', text: '¿Qué sabor de pizza prefiere?' },
          { speaker: 'B', userInput: true, correctAnswers: ['Margherita', 'De queso', 'Napolitana'] },
          { speaker: 'A', text: 'Perfecto, ¿algo para tomar?' },
          { speaker: 'B', userInput: true, correctAnswers: ['Agua', 'Una gaseosa', 'Agua mineral'] }
        ],
        roleA: 'Mesero',
        roleB: 'Cliente',
        userRole: 'B',
        explanation: 'Es importante usar "por favor" y expresiones corteses en contextos formales.',
        cefrLevel: 'A2',
        onComplete: handleExerciseComplete
      }
    },
    {
      type: 'verb-identification',
      title: 'Identificación: Verbos en Presente',
      props: {
        instruction: 'Selecciona todos los verbos conjugados en el siguiente texto',
        text: 'María estudia español todos los días. Ella practica con sus amigos y lee libros interesantes. Los profesores enseñan gramática y vocabulario.',
        words: [
          { text: 'María', start: 0, end: 5, isVerb: false },
          { text: 'estudia', start: 6, end: 13, isVerb: true, conjugation: '3ª persona singular', infinitive: 'estudiar', tense: 'presente', mood: 'indicativo' },
          { text: 'español', start: 14, end: 21, isVerb: false },
          { text: 'todos', start: 22, end: 27, isVerb: false },
          { text: 'los', start: 28, end: 31, isVerb: false },
          { text: 'días', start: 32, end: 36, isVerb: false },
          { text: 'Ella', start: 38, end: 42, isVerb: false },
          { text: 'practica', start: 43, end: 51, isVerb: true, conjugation: '3ª persona singular', infinitive: 'practicar', tense: 'presente', mood: 'indicativo' },
          { text: 'con', start: 52, end: 55, isVerb: false },
          { text: 'sus', start: 56, end: 59, isVerb: false },
          { text: 'amigos', start: 60, end: 66, isVerb: false },
          { text: 'y', start: 67, end: 68, isVerb: false },
          { text: 'lee', start: 69, end: 72, isVerb: true, conjugation: '3ª persona singular', infinitive: 'leer', tense: 'presente', mood: 'indicativo' },
          { text: 'libros', start: 73, end: 79, isVerb: false },
          { text: 'interesantes', start: 80, end: 92, isVerb: false },
          { text: 'Los', start: 94, end: 97, isVerb: false },
          { text: 'profesores', start: 98, end: 108, isVerb: false },
          { text: 'enseñan', start: 109, end: 116, isVerb: true, conjugation: '3ª persona plural', infinitive: 'enseñar', tense: 'presente', mood: 'indicativo' },
          { text: 'gramática', start: 117, end: 126, isVerb: false },
          { text: 'y', start: 127, end: 128, isVerb: false },
          { text: 'vocabulario', start: 129, end: 140, isVerb: false }
        ],
        explanation: 'Los verbos conjugados en presente indican acciones habituales o que ocurren en el momento actual.',
        cefrLevel: 'A2',
        verbsToFind: 4,
        onComplete: handleExerciseComplete
      }
    },
    {
      type: 'interactive-reading',
      title: 'Lectura Interactiva: Un Día en Barcelona',
      props: {
        title: 'Un Día en Barcelona',
        text: 'Barcelona es una ciudad cosmopolita situada en la costa mediterránea. La arquitectura de Gaudí atrae a millones de turistas cada año. La Sagrada Familia es el monumento más famoso.',
        vocabulary: [
          {
            spanish: 'cosmopolita',
            english: 'cosmopolitan',
            chinese: '国际化的',
            start: 25,
            end: 36,
            context: 'Una ciudad internacional con diversidad cultural',
            audioUrl: '/audio/cosmopolita.mp3'
          },
          {
            spanish: 'situada',
            english: 'located',
            chinese: '位于',
            start: 37,
            end: 44,
            context: 'Verbo: estar en un lugar específico'
          },
          {
            spanish: 'mediterránea',
            english: 'Mediterranean',
            chinese: '地中海的',
            start: 57,
            end: 69,
            context: 'Relativo al Mar Mediterráneo'
          },
          {
            spanish: 'arquitectura',
            english: 'architecture',
            chinese: '建筑',
            start: 74,
            end: 86,
            context: 'Arte y técnica de diseñar edificios'
          },
          {
            spanish: 'atrae',
            english: 'attracts',
            chinese: '吸引',
            start: 97,
            end: 102,
            context: 'Verbo: llamar la atención, atraer',
            audioUrl: '/audio/atrae.mp3'
          },
          {
            spanish: 'turistas',
            english: 'tourists',
            chinese: '游客',
            start: 117,
            end: 125,
            context: 'Personas que viajan por placer'
          },
          {
            spanish: 'monumento',
            english: 'monument',
            chinese: '纪念碑',
            start: 161,
            end: 170,
            context: 'Estructura conmemorativa o histórica'
          }
        ],
        questions: [
          {
            question: '¿Dónde está situada Barcelona?',
            options: ['En la costa atlántica', 'En la costa mediterránea', 'En el interior', 'En las montañas'],
            correctAnswer: 1
          },
          {
            question: '¿Qué atrae a millones de turistas?',
            options: ['La playa', 'La arquitectura de Gaudí', 'La comida', 'El clima'],
            correctAnswer: 1
          }
        ],
        explanation: 'La lectura interactiva te permite explorar vocabulario en contexto. Haz click en las palabras resaltadas para ver su significado.',
        cefrLevel: 'B1',
        onComplete: handleExerciseComplete
      }
    },
    {
      type: 'ai-audio-pronunciation',
      title: 'Pronunciación: Sonidos Difíciles del Español',
      props: {
        title: 'Práctica de Pronunciación con IA',
        phrases: [
          {
            text: 'La jirafa jaranera jugaba en el jardín',
            aiAudioUrl: '/audio/ai/jirafa.mp3',
            phonetic: 'la xi.ˈɾa.fa xa.ɾa.ˈne.ɾa xu.ˈɣa.βa en el xaɾ.ˈdin',
            difficulty: 'hard',
            tips: 'La "j" en español es un sonido gutural. Coloca la lengua en el fondo de la boca y exhala aire.'
          },
          {
            text: 'Tres tristes tigres tragaban trigo en un trigal',
            aiAudioUrl: '/audio/ai/tigres.mp3',
            phonetic: 'tɾes ˈtɾis.tes ˈti.ɣɾes tɾa.ˈɣa.βan ˈtɾi.ɣo en un tɾi.ˈɣal',
            difficulty: 'hard',
            tips: 'El sonido "tr" requiere que la lengua toque rápidamente el paladar. Practica lentamente al principio.'
          },
          {
            text: 'El perro de Rosa corrió por la carretera',
            aiAudioUrl: '/audio/ai/perro.mp3',
            phonetic: 'el ˈpe.ro de ˈro.sa ko.ˈrjo poɾ la ka.re.ˈte.ɾa',
            difficulty: 'medium',
            tips: 'La "rr" es un sonido vibrante múltiple. Haz vibrar la lengua contra el paladar.'
          },
          {
            text: 'Buenos días, ¿cómo está usted?',
            aiAudioUrl: '/audio/ai/buenos-dias.mp3',
            phonetic: 'ˈbwe.nos ˈdi.as ˈko.mo es.ˈta us.ˈteð',
            difficulty: 'easy',
            tips: 'Esta es una frase común y formal. Nota la entonación ascendente en la pregunta.'
          }
        ],
        voiceType: 'female',
        accent: 'spain',
        explanation: 'La práctica regular con audio de calidad mejora significativamente tu pronunciación. Escucha varias veces e intenta imitar la entonación.',
        cefrLevel: 'B2',
        onComplete: handleExerciseComplete
      }
    },
    {
      type: 'free-dragdrop',
      title: 'Categorización: Género Gramatical',
      props: {
        title: 'Clasifica los Sustantivos por Género',
        instruction: 'Arrastra cada sustantivo a la categoría correcta según su género',
        items: [
          { id: 1, text: 'el libro', correctCategory: 'masculino' },
          { id: 2, text: 'la mesa', correctCategory: 'femenino' },
          { id: 3, text: 'el perro', correctCategory: 'masculino' },
          { id: 4, text: 'la casa', correctCategory: 'femenino' },
          { id: 5, text: 'el coche', correctCategory: 'masculino' },
          { id: 6, text: 'la flor', correctCategory: 'femenino' },
          { id: 7, text: 'el árbol', correctCategory: 'masculino' },
          { id: 8, text: 'la ventana', correctCategory: 'femenino' },
          { id: 9, text: 'el teléfono', correctCategory: 'masculino' },
          { id: 10, text: 'la computadora', correctCategory: 'femenino' }
        ],
        categories: [
          { id: 'masculino', name: 'Masculino', color: '#3b82f6' },
          { id: 'femenino', name: 'Femenino', color: '#ec4899' }
        ],
        explanation: 'En español, todos los sustantivos tienen género gramatical. Los artículos "el" y "la" nos ayudan a identificarlo.',
        cefrLevel: 'A1',
        onComplete: handleExerciseComplete
      }
    }
  ];

  if (loading) {
    return <BaseLoading variant="fullscreen" text="Cargando Design Lab..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-zinc-500 to-zinc-700 rounded-xl flex items-center justify-center">
                <Palette size={24} className="text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Design Lab ELE
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Diseña y prueba interfaces de ejercicios interactivos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <BaseBadge variant="info" size="sm">
                Nivel: {config.cefrLevel}
              </BaseBadge>
              <SettingsPanel />
            </div>
          </div>

          {/* Navigation tabs */}
          <nav className="flex gap-2 mt-6 border-b border-gray-200 dark:border-gray-700">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 border-b-2 transition-all
                  ${
                    activeView === view.id
                      ? 'border-zinc-500 text-zinc-600 dark:text-zinc-400 font-semibold'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                <view.icon size={18} strokeWidth={2} />
                {view.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Home */}
        {activeView === 'home' && (
          <div className="space-y-8">
            <BaseCard
              icon={BookOpen}
              title="Bienvenido al Design Lab"
              subtitle="Tu espacio para crear y probar ejercicios de ELE"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <BaseCard variant="flat" hover>
                  <div className="text-center p-4">
                    <FileText size={32} className="mx-auto text-blue-500 mb-3" strokeWidth={2} />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Parser de Texto
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Convierte texto plano en ejercicios interactivos
                    </p>
                  </div>
                </BaseCard>

                <BaseCard variant="flat" hover>
                  <div className="text-center p-4">
                    <Layers size={32} className="mx-auto text-green-500 mb-3" strokeWidth={2} />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Ejemplos Listos
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Explora ejercicios prediseñados para inspirarte
                    </p>
                  </div>
                </BaseCard>

                <BaseCard variant="flat" hover>
                  <div className="text-center p-4">
                    <TrendingUp size={32} className="mx-auto text-purple-500 mb-3" strokeWidth={2} />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Estadísticas
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Analiza tu progreso y resultados
                    </p>
                  </div>
                </BaseCard>
              </div>

              <div className="flex gap-3">
                <BaseButton
                  variant="primary"
                  icon={FileText}
                  onClick={() => setActiveView('parser')}
                  fullWidth
                >
                  Ir al Parser
                </BaseButton>
                <BaseButton
                  variant="outline"
                  icon={Layers}
                  onClick={() => setActiveView('examples')}
                  fullWidth
                >
                  Ver Ejemplos
                </BaseButton>
              </div>
            </BaseCard>
          </div>
        )}

        {/* Parser */}
        {activeView === 'parser' && (
          <TextToExerciseParser onExerciseGenerated={handleExerciseGenerated} />
        )}

        {/* Examples */}
        {activeView === 'examples' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Ejemplos de Ejercicios
              </h2>
              {generatedExercises.length > 0 && (
                <BaseButton
                  variant="outline"
                  icon={Download}
                  onClick={exportExercises}
                  size="sm"
                >
                  Exportar ({generatedExercises.length})
                </BaseButton>
              )}
            </div>

            <div className="grid grid-cols-1 gap-8">
              {examples.map((example, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {example.title}
                  </h3>
                  {example.type === 'mcq' && <MultipleChoiceExercise {...example.props} />}
                  {example.type === 'blank' && <FillInBlankExercise {...example.props} />}
                  {example.type === 'match' && <MatchingExercise {...example.props} />}
                  {example.type === 'truefalse' && <TrueFalseExercise {...example.props} />}
                  {example.type === 'audio-listening' && <AudioListeningExercise {...example.props} />}
                  {example.type === 'text-selection' && <TextSelectionExercise {...example.props} />}
                  {example.type === 'dragdrop-order' && <DragDropOrderExercise {...example.props} />}
                  {example.type === 'dialogue-roleplay' && <DialogueRolePlayExercise {...example.props} />}
                  {example.type === 'verb-identification' && <VerbIdentificationExercise {...example.props} />}
                  {example.type === 'interactive-reading' && <InteractiveReadingExercise {...example.props} />}
                  {example.type === 'ai-audio-pronunciation' && <AIAudioPronunciationExercise {...example.props} />}
                  {example.type === 'free-dragdrop' && <FreeDragDropExercise {...example.props} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {activeView === 'stats' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Estadísticas de Progreso
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <BaseCard variant="elevated">
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-zinc-600 dark:text-zinc-400 mb-2">
                    {stats.totalExercises}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Ejercicios Realizados
                  </div>
                </div>
              </BaseCard>

              <BaseCard variant="elevated">
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {stats.completedExercises}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Correctos
                  </div>
                </div>
              </BaseCard>

              <BaseCard variant="elevated">
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {stats.averageScore}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Puntuación Media
                  </div>
                </div>
              </BaseCard>

              <BaseCard variant="elevated">
                <div className="text-center p-4">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[...Array(3)].map((_, i) => (
                      <Star
                        key={i}
                        size={24}
                        strokeWidth={2}
                        className={
                          i < Math.round((stats.completedExercises / Math.max(stats.totalExercises, 1)) * 3)
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-gray-300 dark:text-gray-600'
                        }
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Nivel de Dominio
                  </div>
                </div>
              </BaseCard>
            </div>

            {stats.totalExercises === 0 && (
              <BaseEmptyState
                icon={TrendingUp}
                title="No hay estadísticas aún"
                description="Completa algunos ejercicios para ver tu progreso"
                action={
                  <BaseButton
                    variant="primary"
                    icon={Layers}
                    onClick={() => setActiveView('examples')}
                  >
                    Ver Ejemplos
                  </BaseButton>
                }
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default DesignLabPage;
