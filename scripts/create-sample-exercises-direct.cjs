/**
 * Script para crear 10 ejercicios de ejemplo
 * Versión CommonJS que funciona con Node.js directamente
 * Usa REST API de Firestore
 */

const https = require('https');

// Tu ID de usuario
const TEACHER_ID = 'Kk9gzmKHSMaDyH7E7kjLjnd0aO02';

// Configuración
const PROJECT_ID = 'xiwen-app-2026';
const COLLECTION = 'contents';

// ============================================
// 10 EJEMPLOS DE EJERCICIOS
// ============================================

const exercises = [
  // 1. MCQ - Artículos
  {
    title: '🎯 Artículos Definidos: el/la',
    description: '✨ Ejercicio Demo (2025-11-18) | Practica el uso de artículos definidos en español',
    type: 'exercise',
    body: JSON.stringify({
      type: 'mcq',
      question: '¿Qué artículo va antes de "libro"?',
      options: [
        { value: 'a', label: 'el' },
        { value: 'b', label: 'la' },
        { value: 'c', label: 'los' },
        { value: 'd', label: 'las' }
      ],
      correctAnswer: 'a',
      explanation: '"Libro" es masculino singular, por eso usamos "el".',
      hints: ['Piensa en el género de la palabra', 'Es masculino']
    }),
    metadata: {
      exerciseType: 'mcq',
      difficulty: 'beginner',
      cefrLevel: 'A1',
      points: 100,
      source: 'ExerciseBuilder',
      tags: ['gramática', 'artículos', 'género', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }
  },

  // 2. BLANK - Verbos ser/estar
  {
    title: '🎯 Verbos SER y ESTAR',
    description: '✨ Ejercicio Demo (2025-11-18) | Completa con la forma correcta de ser o estar',
    type: 'exercise',
    body: JSON.stringify({
      type: 'blank',
      sentence: 'Mi hermana ___ médica y hoy ___ en el hospital.',
      correctAnswer: ['es', 'está'],
      explanation: 'Usamos "es" para profesión (característica permanente) y "está" para ubicación temporal.',
      hints: ['El primer espacio es una profesión', 'El segundo espacio es una ubicación']
    }),
    metadata: {
      exerciseType: 'blank',
      difficulty: 'beginner',
      cefrLevel: 'A1',
      points: 150,
      source: 'ExerciseBuilder',
      tags: ['gramática', 'verbos', 'ser-estar', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }
  },

  // 3. MATCH - Números
  {
    title: '🎯 Números del 1 al 10',
    description: '✨ Ejercicio Demo (2025-11-18) | Empareja los números con sus palabras en español',
    type: 'exercise',
    body: JSON.stringify({
      type: 'match',
      title: 'Empareja los números',
      pairs: [
        { left: '1', right: 'uno' },
        { left: '2', right: 'dos' },
        { left: '3', right: 'tres' },
        { left: '5', right: 'cinco' },
        { left: '10', right: 'diez' }
      ],
      explanation: 'Los números en español son fundamentales para la comunicación diaria.',
      shuffleRight: true
    }),
    metadata: {
      exerciseType: 'match',
      difficulty: 'beginner',
      cefrLevel: 'A1',
      points: 100,
      source: 'ExerciseBuilder',
      tags: ['vocabulario', 'números', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }
  },

  // 4. TRUE/FALSE - Género
  {
    title: '🎯 Género Gramatical',
    description: '✨ Ejercicio Demo (2025-11-18) | Determina si la afirmación es verdadera o falsa',
    type: 'exercise',
    body: JSON.stringify({
      type: 'truefalse',
      statement: 'La palabra "mesa" es femenina.',
      correctAnswer: true,
      explanation: 'Correcto. "Mesa" es femenina, por eso decimos "la mesa".',
      trueLabel: 'Verdadero',
      falseLabel: 'Falso'
    }),
    metadata: {
      exerciseType: 'truefalse',
      difficulty: 'beginner',
      cefrLevel: 'A1',
      points: 50,
      source: 'ExerciseBuilder',
      tags: ['gramática', 'género', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }
  },

  // 5. FREE DRAG DROP - Categorizar sustantivos
  {
    title: '🎯 Clasificar Sustantivos por Género',
    description: '✨ Ejercicio Demo (2025-11-18) | Arrastra cada sustantivo a su categoría correcta',
    type: 'exercise',
    body: JSON.stringify({
      type: 'free-dragdrop',
      title: 'Clasifica por Género Gramatical',
      instruction: 'Arrastra cada palabra a Masculino o Femenino',
      items: [
        { id: 1, text: 'el libro', correctCategory: 'masculino' },
        { id: 2, text: 'la mesa', correctCategory: 'femenino' },
        { id: 3, text: 'el perro', correctCategory: 'masculino' },
        { id: 4, text: 'la casa', correctCategory: 'femenino' },
        { id: 5, text: 'el gato', correctCategory: 'masculino' },
        { id: 6, text: 'la silla', correctCategory: 'femenino' }
      ],
      categories: [
        { id: 'masculino', name: 'Masculino', color: '#3b82f6' },
        { id: 'femenino', name: 'Femenino', color: '#ec4899' }
      ],
      explanation: 'En español, todos los sustantivos tienen género. El artículo nos ayuda a identificarlo.'
    }),
    metadata: {
      exerciseType: 'free-dragdrop',
      difficulty: 'beginner',
      cefrLevel: 'A1',
      points: 120,
      source: 'ExerciseBuilder',
      tags: ['gramática', 'género', 'vocabulario', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }
  },

  // 6. DRAG DROP ORDER - Ordenar oración
  {
    title: '🎯 Ordenar Palabras',
    description: '✨ Ejercicio Demo (2025-11-18) | Forma una oración correcta arrastrando las palabras',
    type: 'exercise',
    body: JSON.stringify({
      type: 'dragdrop-order',
      instruction: 'Arrastra las palabras para formar una oración correcta',
      items: ['Yo', 'estudio', 'español', 'todos', 'los', 'días'],
      explanation: 'En español, el orden básico es: Sujeto + Verbo + Objeto + Complemento.',
      showNumbers: true,
      allowPartialCredit: false
    }),
    metadata: {
      exerciseType: 'dragdrop-order',
      difficulty: 'beginner',
      cefrLevel: 'A1',
      points: 100,
      source: 'ExerciseBuilder',
      tags: ['gramática', 'sintaxis', 'orden', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }
  },

  // 7. DIALOGUE ROLEPLAY - En el restaurante
  {
    title: '🎯 Conversación en el Restaurante',
    description: '✨ Ejercicio Demo (2025-11-18) | Practica un diálogo común en un restaurante',
    type: 'exercise',
    body: JSON.stringify({
      type: 'dialogue-roleplay',
      title: 'En el Restaurante',
      context: 'Estás en un restaurante y el mesero viene a tomar tu orden.',
      dialogue: [
        { speaker: 'A', text: 'Buenas tardes, ¿qué desea ordenar?' },
        { speaker: 'B', userInput: true, correctAnswers: ['Una pizza por favor', 'Quiero una pizza', 'Me gustaría una pizza'] },
        { speaker: 'A', text: '¿Algo para beber?' },
        { speaker: 'B', userInput: true, correctAnswers: ['Un agua', 'Una gaseosa', 'Un jugo de naranja', 'Agua por favor'] }
      ],
      roleA: 'Mesero',
      roleB: 'Cliente',
      userRole: 'B',
      explanation: 'Es importante usar expresiones corteses como "por favor" y "me gustaría".',
      caseSensitive: false,
      allowTypos: true
    }),
    metadata: {
      exerciseType: 'dialogue-roleplay',
      difficulty: 'beginner',
      cefrLevel: 'A2',
      points: 150,
      source: 'ExerciseBuilder',
      tags: ['conversación', 'vocabulario', 'restaurante', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }
  },

  // 8. TEXT SELECTION - Seleccionar palabra
  {
    title: '🎯 Selecciona el Sustantivo',
    description: '✨ Ejercicio Demo (2025-11-18) | Identifica y selecciona el sustantivo en la oración',
    type: 'exercise',
    body: JSON.stringify({
      type: 'text-selection',
      instruction: 'Haz clic en el sustantivo (objeto) en la siguiente oración',
      text: 'María compra un libro en la librería.',
      words: [
        { spanish: 'María', start: 0, end: 5, isTarget: false },
        { spanish: 'compra', start: 6, end: 12, isTarget: false },
        { spanish: 'un', start: 13, end: 15, isTarget: false },
        { spanish: 'libro', start: 16, end: 21, isTarget: true },
        { spanish: 'en', start: 22, end: 24, isTarget: false },
        { spanish: 'la', start: 25, end: 27, isTarget: false },
        { spanish: 'librería', start: 28, end: 36, isTarget: false }
      ],
      targetWord: 'libro',
      explanation: '"Libro" es el objeto directo de la oración, un sustantivo masculino singular.',
      multipleSelect: false
    }),
    metadata: {
      exerciseType: 'text-selection',
      difficulty: 'beginner',
      cefrLevel: 'A1',
      points: 80,
      source: 'ExerciseBuilder',
      tags: ['gramática', 'sustantivos', 'sintaxis', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }
  },

  // 9. VERB IDENTIFICATION - Identificar verbos
  {
    title: '🎯 Identificar Verbos en Presente',
    description: '✨ Ejercicio Demo (2025-11-18) | Selecciona todos los verbos conjugados en el texto',
    type: 'exercise',
    body: JSON.stringify({
      type: 'verb-identification',
      instruction: 'Selecciona todos los verbos conjugados en presente',
      text: 'Ana estudia español. Ella habla con sus amigos y lee libros.',
      words: [
        { text: 'Ana', start: 0, end: 3, isVerb: false },
        { text: 'estudia', start: 4, end: 11, isVerb: true, conjugation: '3ª persona singular', infinitive: 'estudiar', tense: 'presente' },
        { text: 'español', start: 12, end: 19, isVerb: false },
        { text: 'Ella', start: 21, end: 25, isVerb: false },
        { text: 'habla', start: 26, end: 31, isVerb: true, conjugation: '3ª persona singular', infinitive: 'hablar', tense: 'presente' },
        { text: 'con', start: 32, end: 35, isVerb: false },
        { text: 'sus', start: 36, end: 39, isVerb: false },
        { text: 'amigos', start: 40, end: 46, isVerb: false },
        { text: 'y', start: 47, end: 48, isVerb: false },
        { text: 'lee', start: 49, end: 52, isVerb: true, conjugation: '3ª persona singular', infinitive: 'leer', tense: 'presente' },
        { text: 'libros', start: 53, end: 59, isVerb: false }
      ],
      explanation: 'Los verbos conjugados indican acciones. En presente: estudia, habla, lee.',
      verbsToFind: 3
    }),
    metadata: {
      exerciseType: 'verb-identification',
      difficulty: 'intermediate',
      cefrLevel: 'A2',
      points: 120,
      source: 'ExerciseBuilder',
      tags: ['gramática', 'verbos', 'conjugación', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }
  },

  // 10. INTERACTIVE READING - Lectura con vocabulario
  {
    title: '🎯 Lectura: Mi Familia',
    description: '✨ Ejercicio Demo (2025-11-18) | Lee el texto y explora el vocabulario interactivo',
    type: 'exercise',
    body: JSON.stringify({
      type: 'interactive-reading',
      title: 'Mi Familia',
      text: 'Mi familia es grande. Tengo dos hermanos y una hermana. Mi padre trabaja en una oficina y mi madre es profesora. Vivimos en una casa con jardín.',
      vocabulary: [
        {
          spanish: 'grande',
          english: 'big',
          chinese: '大的',
          start: 13,
          end: 19,
          context: 'Adjetivo que describe tamaño'
        },
        {
          spanish: 'hermanos',
          english: 'brothers/siblings',
          chinese: '兄弟',
          start: 31,
          end: 39,
          context: 'Familiares del mismo padre y madre'
        },
        {
          spanish: 'trabaja',
          english: 'works',
          chinese: '工作',
          start: 68,
          end: 75,
          context: 'Verbo trabajar en 3ª persona'
        },
        {
          spanish: 'oficina',
          english: 'office',
          chinese: '办公室',
          start: 83,
          end: 90,
          context: 'Lugar de trabajo administrativo'
        },
        {
          spanish: 'profesora',
          english: 'teacher (female)',
          chinese: '教师 (女)',
          start: 105,
          end: 114,
          context: 'Profesión: persona que enseña'
        },
        {
          spanish: 'jardín',
          english: 'garden',
          chinese: '花园',
          start: 140,
          end: 146,
          context: 'Espacio con plantas alrededor de la casa'
        }
      ],
      questions: [
        {
          question: '¿Cuántos hermanos tiene el autor?',
          options: ['Uno', 'Dos', 'Tres', 'Cuatro'],
          correctAnswer: 2
        },
        {
          question: '¿Qué hace el padre?',
          options: ['Es profesor', 'Trabaja en oficina', 'Es médico', 'Trabaja en casa'],
          correctAnswer: 1
        }
      ],
      explanation: 'Esta lectura presenta vocabulario básico sobre la familia y las profesiones.',
      showVocabularyFirst: false
    }),
    metadata: {
      exerciseType: 'interactive-reading',
      difficulty: 'beginner',
      cefrLevel: 'A1',
      points: 150,
      source: 'ExerciseBuilder',
      tags: ['lectura', 'vocabulario', 'familia', 'demo-2025-11-18', '🎯-demo'],
      demoExercise: true,
      createdDate: '2025-11-18'
    }
  }
];

console.log('❌ NOTA: Este script requiere configuración adicional de Firebase Admin SDK');
console.log('📝 Por favor usa la app web para crear los ejercicios:');
console.log('');
console.log('Opciones alternativas:');
console.log('1. Ve a Exercise Builder en la app');
console.log('2. Usa la funcionalidad "Guardar en Contenidos"');
console.log('3. O importa este JSON directamente');
console.log('');
console.log('Los datos están listos en la variable "exercises"');
console.log('Total de ejercicios: ' + exercises.length);
