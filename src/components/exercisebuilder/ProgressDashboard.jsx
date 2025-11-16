/**
 * @fileoverview Dashboard de progreso individual para estudiantes
 * @module components/exercisebuilder/ProgressDashboard
 */

import { TrendingUp, Target, Clock, Award, BarChart } from 'lucide-react';
import { BaseBadge } from '../common';
import { UniversalCard } from '../cards';

/**
 * Dashboard de Progreso del Estudiante
 *
 * @param {Object} props
 * @param {Object} props.stats - Estadísticas del estudiante
 * @param {number} props.stats.totalExercises - Total de ejercicios completados
 * @param {number} props.stats.averageScore - Puntuación promedio
 * @param {number} props.stats.totalTime - Tiempo total invertido (minutos)
 * @param {number} props.stats.streak - Días consecutivos
 * @param {Object[]} props.stats.byType - Estadísticas por tipo de ejercicio
 */
export function ProgressDashboard({ stats = {} }) {
  const {
    totalExercises = 0,
    averageScore = 0,
    totalTime = 0,
    streak = 0,
    byType = []
  } = stats;

  const statCards = [
    {
      icon: Target,
      label: 'Ejercicios Completados',
      value: totalExercises,
      color: 'blue'
    },
    {
      icon: Award,
      label: 'Puntuación Promedio',
      value: `${averageScore}%`,
      color: 'green'
    },
    {
      icon: Clock,
      label: 'Tiempo Invertido',
      value: `${totalTime} min`,
      color: 'purple'
    },
    {
      icon: TrendingUp,
      label: 'Racha de Días',
      value: `${streak} días`,
      color: 'orange'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart className="text-zinc-600 dark:text-zinc-400" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tu Progreso
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Estadísticas de tu aprendizaje
          </p>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <UniversalCard
            key={idx}
            variant="stats"
            size="md"
            icon={stat.icon}
            title={stat.label}
            bigNumber={stat.value}
          />
        ))}
      </div>

      {/* Progreso por Tipo de Ejercicio */}
      {byType.length > 0 && (
        <UniversalCard
          variant="default"
          size="md"
          icon={BarChart}
          title="Progreso por Tipo de Ejercicio"
        >
          <div className="space-y-3">
            {byType.map((type, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {type.name}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {type.completed}/{type.total} ({Math.round((type.completed / type.total) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-zinc-600 dark:bg-zinc-400 h-2 rounded-full transition-all"
                    style={{ width: `${(type.completed / type.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </UniversalCard>
      )}

      {/* Niveles CEFR */}
      <UniversalCard
        variant="default"
        size="md"
        icon={Target}
        title="Progreso por Nivel CEFR"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
            <div
              key={level}
              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-center"
            >
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {level}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {Math.floor(Math.random() * 20)} ejercicios
              </div>
            </div>
          ))}
        </div>
      </UniversalCard>
    </div>
  );
}

export default ProgressDashboard;
