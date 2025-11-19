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
  TrueFalseExercise
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
                    <FileText size={32} className="mx-auto text-gray-600 mb-3" strokeWidth={2} />
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
                  <div className="text-3xl font-bold text-gray-600 dark:text-gray-400 mb-2">
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
