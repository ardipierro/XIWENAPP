/**
 * @fileoverview Image Generation Demo Component
 * @module components/ImageGenerationDemo
 *
 * Componente para demostrar y probar la generación de imágenes con tareas predefinidas
 */

import { useState } from 'react';
import { Play, Download, Grid3x3, List } from 'lucide-react';
import logger from '../utils/logger';
import {
  IMAGE_GENERATION_TASKS,
  executeImageTask,
  getTasksSummary
} from '../utils/imageGenerationTasks';
import { BaseButton, BaseBadge, BaseEmptyState } from './common';
import { UniversalCard } from './cards';

function ImageGenerationDemo() {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const summary = getTasksSummary();

  const handleRunTask = async (taskId) => {
    setSelectedTask(taskId);
    setIsRunning(true);
    setProgress(null);
    setResults(null);

    try {
      const result = await executeImageTask(taskId, (progressData) => {
        setProgress(progressData);
      });

      setResults(result);
      logger.info('Task completed successfully:', result.taskName);
    } catch (error) {
      logger.error('Error ejecutando tarea:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  };

  const handleDownloadAll = () => {
    if (!results) return;

    results.results.forEach((item) => {
      if (item.success && item.imageUrl) {
        const link = document.createElement('a');
        link.href = item.imageUrl;
        link.download = `${item.word}-${Date.now()}.png`;
        link.click();
      }
    });

    logger.info('Downloaded all images');
  };

  const getSuccessRate = () => {
    if (!results) return 0;
    const successful = results.results.filter(r => r.success).length;
    return Math.round((successful / results.results.length) * 100);
  };

  const getLevelColor = (level) => {
    const colors = {
      A1: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      A2: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      B1: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      B2: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
    };
    return colors[level] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-6 mb-8">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white flex-shrink-0">
            <Play size={24} className="md:w-8 md:h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white m-0">
              Tareas de Generación de Imágenes
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1 m-0">
              Prueba la generación automática de imágenes educativas con tareas predefinidas
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none flex flex-col items-center px-4 md:px-6 py-3 md:py-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg min-w-[90px]">
            <span className="text-2xl md:text-3xl font-bold leading-none">{summary.totalTasks}</span>
            <span className="text-xs md:text-sm opacity-90 mt-1">Tareas</span>
          </div>
          <div className="flex-1 md:flex-none flex flex-col items-center px-4 md:px-6 py-3 md:py-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg min-w-[90px]">
            <span className="text-2xl md:text-3xl font-bold leading-none">{summary.totalItems}</span>
            <span className="text-xs md:text-sm opacity-90 mt-1">Imágenes</span>
          </div>
          <div className="flex-1 md:flex-none flex flex-col items-center px-4 md:px-6 py-3 md:py-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg min-w-[90px]">
            <span className="text-2xl md:text-3xl font-bold leading-none">{summary.levels.length}</span>
            <span className="text-xs md:text-sm opacity-90 mt-1">Niveles</span>
          </div>
        </div>
      </div>

      {/* Summary by Level */}
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 m-0">
          Resumen por Nivel CEFR
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {summary.levels.map((level) => (
            <div
              key={level.id}
              className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 transition-all hover:shadow-lg"
            >
              <div className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center ${getLevelColor(level.id)} rounded-lg font-bold text-base md:text-lg flex-shrink-0`}>
                {level.id}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">{level.tasks} tareas</span>
                <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">{level.items} imágenes</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4 mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white m-0">
            Tareas Disponibles
          </h2>
          <div className="flex gap-2 bg-white dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Tasks Grid/List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6' : 'flex flex-col gap-3 md:gap-4'}>
          {IMAGE_GENERATION_TASKS.map((task) => (
            <UniversalCard
              key={task.id}
              variant="default"
              size="md"
              title={task.name}
              badges={[
                {
                  variant: 'default',
                  children: task.level,
                  className: getLevelColor(task.level)
                }
              ]}
            >
              <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-3 text-xs md:text-sm">
                <span className="font-mono text-gray-600 dark:text-gray-400 truncate">{task.functionId}</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0 ml-2">{task.items.length} imágenes</span>
              </div>

              <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4">
                {task.items.slice(0, 5).map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-xs text-gray-700 dark:text-gray-300"
                  >
                    {item.word}
                  </span>
                ))}
                {task.items.length > 5 && (
                  <span className="px-2 py-1 bg-primary-600 text-white rounded-full text-xs font-semibold">
                    +{task.items.length - 5}
                  </span>
                )}
              </div>

              <BaseButton
                variant="primary"
                icon={Play}
                onClick={() => handleRunTask(task.id)}
                disabled={isRunning}
                loading={isRunning && selectedTask === task.id}
                fullWidth
                className="mt-auto"
              >
                {isRunning && selectedTask === task.id ? 'Generando...' : 'Ejecutar Tarea'}
              </BaseButton>
            </UniversalCard>
          ))}
        </div>
      </div>

      {/* Progress */}
      {isRunning && progress && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-[90%] max-w-2xl bg-white dark:bg-gray-800 border-2 border-primary-600 dark:border-primary-500 rounded-xl p-4 md:p-6 shadow-2xl z-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white m-0">
              Generando: {progress.task}
            </h3>
            <span className="text-sm md:text-base font-semibold text-primary-600 dark:text-primary-400">
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-primary-600 to-indigo-600 transition-all duration-300"
              style={{
                width: `${(progress.current / progress.total) * 100}%`
              }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 m-0">
            Generando imagen para: <strong>{progress.item}</strong>
          </p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="mt-12 pt-8 border-t-2 border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white m-0">
                Resultados: {results.taskName}
              </h2>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2 m-0">
                {results.results.filter(r => r.success).length} de {results.totalItems}{' '}
                imágenes generadas exitosamente ({getSuccessRate()}%)
              </p>
            </div>
            <BaseButton
              variant="primary"
              icon={Download}
              onClick={handleDownloadAll}
            >
              Descargar Todas
            </BaseButton>
          </div>

          {results.results.filter(r => r.success).length === 0 ? (
            <BaseEmptyState
              icon={Play}
              title="No se generaron imágenes"
              description="Todas las generaciones fallaron. Verifica la configuración de las API keys."
            />
          ) : (
            <div className="grid-responsive-cards gap-4 md:gap-6">
              {results.results.map((result, index) => (
                <UniversalCard
                  key={index}
                  variant="default"
                  size="sm"
                  title={result.word}
                  badges={[
                    {
                      variant: result.success ? 'success' : 'danger',
                      children: result.success ? '✓' : '✗'
                    }
                  ]}
                  className={`overflow-hidden ${
                    result.success
                      ? 'border-green-200 dark:border-green-800'
                      : 'border-red-200 dark:border-red-800'
                  }`}
                >
                  {result.success && result.imageUrl ? (
                    <div className="relative group">
                      <img
                        src={result.imageUrl}
                        alt={result.word}
                        loading="lazy"
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <a
                          href={result.imageUrl}
                          download={`${result.word}.png`}
                          className="w-12 h-12 flex items-center justify-center bg-white rounded-full text-primary-600 hover:scale-110 transition-transform"
                        >
                          <Download size={18} />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 md:p-8 text-center aspect-square bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-full mb-3">
                        <span className="text-2xl md:text-3xl">✗</span>
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 m-0">
                        {result.error || 'Error desconocido'}
                      </p>
                    </div>
                  )}
                </UniversalCard>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ImageGenerationDemo;
