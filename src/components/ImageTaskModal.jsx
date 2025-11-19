/**
 * @fileoverview Image Task Modal - Modal para ejecutar una tarea de generación de imágenes
 * @module components/ImageTaskModal
 */

import { useState } from 'react';
import { X, Play, Download, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';
import { BaseButton, BaseModal, BaseBadge, BaseLoading, CategoryBadge } from './common';
import { executeImageTask } from '../utils/imageGenerationTasks';
import logger from '../utils/logger';

export default function ImageTaskModal({ task, onClose }) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);

  const handleRunTask = async () => {
    setIsRunning(true);
    setProgress(null);
    setResults(null);

    try {
      const result = await executeImageTask(task.id, (progressData) => {
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

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={task.name}
      size="xl"
    >
      <div className="space-y-6">
        {/* Task Info */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
            <ImageIcon size={32} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {task.name}
            </h3>
            <div className="flex gap-2 mt-2">
              <CategoryBadge type="cefr" value={task.level}>
                Nivel {task.level}
              </CategoryBadge>
              <BaseBadge variant="default">
                {task.items.length} elementos
              </BaseBadge>
              <BaseBadge variant="default">
                {task.category}
              </BaseBadge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <BaseButton
            variant="primary"
            icon={Play}
            onClick={handleRunTask}
            disabled={isRunning}
            className="flex-1"
          >
            {isRunning ? 'Generando...' : 'Ejecutar Tarea'}
          </BaseButton>
          {results && (
            <BaseButton
              variant="secondary"
              icon={Download}
              onClick={handleDownloadAll}
            >
              Descargar Todo
            </BaseButton>
          )}
        </div>

        {/* Progress */}
        {isRunning && progress && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                Generando: {progress.item}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-400">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Results Summary */}
        {results && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-900 dark:text-green-300">
                Tarea completada
              </span>
              <BaseBadge variant="success">
                {getSuccessRate()}% éxito
              </BaseBadge>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Elementos a generar:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {task.items.map((item, index) => {
              const result = results?.results.find(r => r.word === item.word);

              return (
                <div
                  key={index}
                  className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {item.word}
                    </span>
                    {result && (
                      result.success ? (
                        <CheckCircle className="text-green-500" size={18} />
                      ) : (
                        <XCircle className="text-red-500" size={18} />
                      )
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {item.prompt}
                  </p>
                  {result && result.imageUrl && (
                    <img
                      src={result.imageUrl}
                      alt={item.word}
                      className="mt-2 w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  {result && !result.success && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                      Error: {result.error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <BaseButton variant="secondary" onClick={onClose}>
            Cerrar
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}
