// Script para actualizar ejercicios con marcas especiales
import { readFileSync, writeFileSync } from 'fs';

const filePath = './scripts/create-sample-exercises.js';
let content = readFileSync(filePath, 'utf8');

// Actualizar títulos y descripciones
const updates = [
  { old: "title: 'Verbos SER y ESTAR',", new: "title: '🎯 Verbos SER y ESTAR'," },
  { old: "description: 'Completa con la forma correcta de ser o estar',", new: "description: '✨ Ejercicio Demo (2025-11-18) | Completa con la forma correcta de ser o estar'," },

  { old: "title: 'Números del 1 al 10',", new: "title: '🎯 Números del 1 al 10'," },
  { old: "description: 'Empareja los números con sus palabras en español',", new: "description: '✨ Ejercicio Demo (2025-11-18) | Empareja los números con sus palabras en español'," },

  { old: "title: 'Género Gramatical',", new: "title: '🎯 Género Gramatical'," },
  { old: "description: 'Determina si la afirmación es verdadera o falsa',", new: "description: '✨ Ejercicio Demo (2025-11-18) | Determina si la afirmación es verdadera o falsa'," },

  { old: "title: 'Clasificar Sustantivos por Género',", new: "title: '🎯 Clasificar Sustantivos por Género'," },
  { old: "description: 'Arrastra cada sustantivo a su categoría correcta',", new: "description: '✨ Ejercicio Demo (2025-11-18) | Arrastra cada sustantivo a su categoría correcta'," },

  { old: "title: 'Ordenar Palabras',", new: "title: '🎯 Ordenar Palabras'," },
  { old: "description: 'Forma una oración correcta arrastrando las palabras',", new: "description: '✨ Ejercicio Demo (2025-11-18) | Forma una oración correcta arrastrando las palabras'," },

  { old: "title: 'Conversación en el Restaurante',", new: "title: '🎯 Conversación en el Restaurante'," },
  { old: "description: 'Practica un diálogo común en un restaurante',", new: "description: '✨ Ejercicio Demo (2025-11-18) | Practica un diálogo común en un restaurante'," },

  { old: "title: 'Selecciona el Sustantivo',", new: "title: '🎯 Selecciona el Sustantivo'," },
  { old: "description: 'Identifica y selecciona el sustantivo en la oración',", new: "description: '✨ Ejercicio Demo (2025-11-18) | Identifica y selecciona el sustantivo en la oración'," },

  { old: "title: 'Identificar Verbos en Presente',", new: "title: '🎯 Identificar Verbos en Presente'," },
  { old: "description: 'Selecciona todos los verbos conjugados en el texto',", new: "description: '✨ Ejercicio Demo (2025-11-18) | Selecciona todos los verbos conjugados en el texto'," },

  { old: "title: 'Lectura: Mi Familia',", new: "title: '🎯 Lectura: Mi Familia'," },
  { old: "description: 'Lee el texto y explora el vocabulario interactivo',", new: "description: '✨ Ejercicio Demo (2025-11-18) | Lee el texto y explora el vocabulario interactivo'," },
];

// Aplicar todos los cambios
updates.forEach(({ old, new: newStr }) => {
  content = content.replace(old, newStr);
});

// Actualizar todos los metadata
const metadataReplacements = [
  {
    old: `tags: ['gramática', 'verbos', 'ser-estar']
    }`,
    new: `tags: ['gramática', 'verbos', 'ser-estar', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }`
  },
  {
    old: `tags: ['vocabulario', 'números']
    }`,
    new: `tags: ['vocabulario', 'números', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }`
  },
  {
    old: `tags: ['gramática', 'género']
    }`,
    new: `tags: ['gramática', 'género', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }`
  },
  {
    old: `tags: ['gramática', 'género', 'vocabulario']
    }`,
    new: `tags: ['gramática', 'género', 'vocabulario', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }`
  },
  {
    old: `tags: ['gramática', 'sintaxis', 'orden']
    }`,
    new: `tags: ['gramática', 'sintaxis', 'orden', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }`
  },
  {
    old: `tags: ['conversación', 'vocabulario', 'restaurante']
    }`,
    new: `tags: ['conversación', 'vocabulario', 'restaurante', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }`
  },
  {
    old: `tags: ['gramática', 'sustantivos', 'sintaxis']
    }`,
    new: `tags: ['gramática', 'sustantivos', 'sintaxis', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }`
  },
  {
    old: `tags: ['gramática', 'verbos', 'conjugación']
    }`,
    new: `tags: ['gramática', 'verbos', 'conjugación', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }`
  },
  {
    old: `tags: ['lectura', 'vocabulario', 'familia']
    }`,
    new: `tags: ['lectura', 'vocabulario', 'familia', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }`
  }
];

metadataReplacements.forEach(({ old, new: newStr }) => {
  content = content.replace(old, newStr);
});

writeFileSync(filePath, content, 'utf8');
console.log('✅ Archivo actualizado con marcas especiales');
