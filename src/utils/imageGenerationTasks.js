/**
 * @fileoverview Image Generation Tasks for Testing
 * @module utils/imageGenerationTasks
 *
 * Tareas predefinidas para probar la generación de imágenes con IA
 */

import imageService from '../services/imageService';

/**
 * Tareas de prueba para generación de imágenes educativas
 */
export const IMAGE_GENERATION_TASKS = [
  // VOCABULARIO BÁSICO (A1)
  {
    id: 'vocab_animals',
    name: 'Animales - Nivel A1',
    category: 'vocabulary',
    level: 'A1',
    functionId: 'visual_vocabulary',
    items: [
      { word: 'perro', prompt: 'Un perro amigable, ilustración educativa simple y colorida' },
      { word: 'gato', prompt: 'Un gato sentado, ilustración educativa simple y colorida' },
      { word: 'pájaro', prompt: 'Un pájaro colorido en una rama, ilustración educativa' },
      { word: 'pez', prompt: 'Un pez nadando, ilustración educativa simple' },
      { word: 'caballo', prompt: 'Un caballo marrón, ilustración educativa simple' }
    ]
  },
  {
    id: 'vocab_food',
    name: 'Comida - Nivel A1',
    category: 'vocabulary',
    level: 'A1',
    functionId: 'visual_vocabulary',
    items: [
      { word: 'manzana', prompt: 'Una manzana roja, ilustración educativa clara y simple' },
      { word: 'pan', prompt: 'Una barra de pan, ilustración educativa simple' },
      { word: 'leche', prompt: 'Un vaso de leche, ilustración educativa clara' },
      { word: 'queso', prompt: 'Un trozo de queso amarillo, ilustración educativa' },
      { word: 'agua', prompt: 'Un vaso de agua transparente, ilustración educativa' }
    ]
  },
  {
    id: 'vocab_colors',
    name: 'Colores - Nivel A1',
    category: 'vocabulary',
    level: 'A1',
    functionId: 'visual_vocabulary',
    items: [
      { word: 'rojo', prompt: 'Un círculo rojo brillante sobre fondo blanco' },
      { word: 'azul', prompt: 'Un círculo azul brillante sobre fondo blanco' },
      { word: 'verde', prompt: 'Un círculo verde brillante sobre fondo blanco' },
      { word: 'amarillo', prompt: 'Un círculo amarillo brillante sobre fondo blanco' },
      { word: 'naranja', prompt: 'Un círculo naranja brillante sobre fondo blanco' }
    ]
  },

  // ACCIONES Y VERBOS (A2)
  {
    id: 'vocab_actions',
    name: 'Acciones - Nivel A2',
    category: 'vocabulary',
    level: 'A2',
    functionId: 'image_generator',
    items: [
      { word: 'correr', prompt: 'Una persona corriendo en el parque, ilustración educativa estilo cartoon' },
      { word: 'saltar', prompt: 'Una persona saltando felizmente, ilustración educativa estilo cartoon' },
      { word: 'nadar', prompt: 'Una persona nadando en una piscina, ilustración educativa estilo cartoon' },
      { word: 'leer', prompt: 'Una persona leyendo un libro, ilustración educativa estilo cartoon' },
      { word: 'escribir', prompt: 'Una persona escribiendo en un cuaderno, ilustración educativa estilo cartoon' }
    ]
  },

  // LUGARES (B1)
  {
    id: 'vocab_places',
    name: 'Lugares - Nivel B1',
    category: 'vocabulary',
    level: 'B1',
    functionId: 'illustration_creator',
    items: [
      { word: 'escuela', prompt: 'Un edificio de escuela con niños entrando, ilustración artística educativa' },
      { word: 'parque', prompt: 'Un parque con árboles y bancos, ilustración artística educativa' },
      { word: 'biblioteca', prompt: 'Una biblioteca con estantes de libros, ilustración artística educativa' },
      { word: 'hospital', prompt: 'Un hospital moderno, ilustración artística educativa' },
      { word: 'supermercado', prompt: 'Un supermercado con productos, ilustración artística educativa' }
    ]
  },

  // PROFESIONES (B1)
  {
    id: 'vocab_professions',
    name: 'Profesiones - Nivel B1',
    category: 'vocabulary',
    level: 'B1',
    functionId: 'image_generator',
    items: [
      { word: 'médico', prompt: 'Un médico con bata blanca y estetoscopio, ilustración educativa profesional' },
      { word: 'maestro', prompt: 'Un maestro enseñando en un aula, ilustración educativa profesional' },
      { word: 'cocinero', prompt: 'Un cocinero con gorro de chef, ilustración educativa profesional' },
      { word: 'bombero', prompt: 'Un bombero con uniforme y casco, ilustración educativa profesional' },
      { word: 'policía', prompt: 'Un oficial de policía con uniforme, ilustración educativa profesional' }
    ]
  },

  // EMOCIONES (A2)
  {
    id: 'vocab_emotions',
    name: 'Emociones - Nivel A2',
    category: 'vocabulary',
    level: 'A2',
    functionId: 'illustration_creator',
    items: [
      { word: 'feliz', prompt: 'Una cara sonriente muy feliz, ilustración educativa expresiva' },
      { word: 'triste', prompt: 'Una cara triste con lágrimas, ilustración educativa expresiva' },
      { word: 'enojado', prompt: 'Una cara enojada con ceño fruncido, ilustración educativa expresiva' },
      { word: 'sorprendido', prompt: 'Una cara sorprendida con ojos grandes, ilustración educativa expresiva' },
      { word: 'asustado', prompt: 'Una cara asustada, ilustración educativa expresiva' }
    ]
  },

  // CLIMA (A2)
  {
    id: 'vocab_weather',
    name: 'Clima - Nivel A2',
    category: 'vocabulary',
    level: 'A2',
    functionId: 'image_generator',
    items: [
      { word: 'sol', prompt: 'Un sol brillante en el cielo azul, ilustración educativa simple' },
      { word: 'lluvia', prompt: 'Nubes grises con gotas de lluvia cayendo, ilustración educativa' },
      { word: 'nieve', prompt: 'Copos de nieve cayendo del cielo, ilustración educativa' },
      { word: 'viento', prompt: 'Árboles moviéndose con el viento, ilustración educativa' },
      { word: 'nublado', prompt: 'Cielo cubierto de nubes grises, ilustración educativa' }
    ]
  }
];

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
