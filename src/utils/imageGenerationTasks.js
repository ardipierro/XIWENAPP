/**
 * @fileoverview Image Generation Tasks for Testing
 * @module utils/imageGenerationTasks
 *
 * Tareas predefinidas para probar la generación de imágenes con IA
 */

import imageService from '../services/imageService';

/**
 * Tareas de prueba para generación de imágenes educativas
 * NOTA: Array vacío - las tareas de demostración han sido eliminadas
 */
export const IMAGE_GENERATION_TASKS = [];

/**
 * Ejecutar una tarea de generación de imágenes
 */
export async function executeImageTask(taskId, onProgress = null) {
  const task = IMAGE_GENERATION_TASKS.find(t => t.id === taskId);
  if (!task) {
    throw new Error(`Tarea no encontrada: ${taskId}`);
  }

  const results = [];
  let completed = 0;

  for (const item of task.items) {
    try {
      if (onProgress) {
        onProgress({
          task: task.name,
          current: completed + 1,
          total: task.items.length,
          item: item.word
        });
      }

      const result = await imageService.generateImage({
        prompt: item.prompt,
        functionId: task.functionId,
        size: '1024x1024'
      });

      results.push({
        word: item.word,
        success: result.success,
        imageUrl: result.success ? (result.images[0]?.url || result.images[0]?.b64_json) : null,
        error: result.error
      });

      completed++;
    } catch (error) {
      results.push({
        word: item.word,
        success: false,
        error: error.message
      });
      completed++;
    }
  }

  return {
    taskId,
    taskName: task.name,
    totalItems: task.items.length,
    results
  };
}

/**
 * Ejecutar todas las tareas de una categoría
 */
export async function executeTasksByCategory(category, onProgress = null) {
  const tasks = IMAGE_GENERATION_TASKS.filter(t => t.category === category);
  const allResults = [];

  for (const task of tasks) {
    const result = await executeImageTask(task.id, onProgress);
    allResults.push(result);
  }

  return allResults;
}

/**
 * Ejecutar todas las tareas de un nivel
 */
export async function executeTasksByLevel(level, onProgress = null) {
  const tasks = IMAGE_GENERATION_TASKS.filter(t => t.level === level);
  const allResults = [];

  for (const task of tasks) {
    const result = await executeImageTask(task.id, onProgress);
    allResults.push(result);
  }

  return allResults;
}

/**
 * Obtener resumen de tareas disponibles
 */
export function getTasksSummary() {
  const categories = [...new Set(IMAGE_GENERATION_TASKS.map(t => t.category))];
  const levels = [...new Set(IMAGE_GENERATION_TASKS.map(t => t.level))];

  return {
    totalTasks: IMAGE_GENERATION_TASKS.length,
    totalItems: IMAGE_GENERATION_TASKS.reduce((sum, task) => sum + task.items.length, 0),
    categories: categories.map(cat => ({
      id: cat,
      tasks: IMAGE_GENERATION_TASKS.filter(t => t.category === cat).length,
      items: IMAGE_GENERATION_TASKS.filter(t => t.category === cat)
        .reduce((sum, task) => sum + task.items.length, 0)
    })),
    levels: levels.map(level => ({
      id: level,
      tasks: IMAGE_GENERATION_TASKS.filter(t => t.level === level).length,
      items: IMAGE_GENERATION_TASKS.filter(t => t.level === level)
        .reduce((sum, task) => sum + task.items.length, 0)
    }))
  };
}
