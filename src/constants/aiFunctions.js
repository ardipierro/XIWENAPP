/**
 * @fileoverview AI Functions Configuration Constants
 * @module constants/aiFunctions
 */

/**
 * Available AI providers
 */
export const AI_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    models: [
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
    ]
  },
  {
    id: 'claude',
    name: 'Claude',
    icon: '🧠',
    models: [
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
    ]
  },
  {
    id: 'grok',
    name: 'Grok',
    icon: '🚀',
    models: [
      { value: 'grok-beta', label: 'Grok Beta' },
      { value: 'grok-2', label: 'Grok 2' }
    ]
  },
  {
    id: 'google',
    name: 'Google',
    icon: '🔍',
    models: [
      { value: 'gemini-pro', label: 'Gemini Pro' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' }
    ]
  }
];

/**
 * Available AI functions/use cases
 */
export const AI_FUNCTIONS = [
  {
    id: 'exercise_generator',
    name: 'Generador de Ejercicios',
    description: 'Crea ejercicios ESL/ELE de múltiples tipos',
    icon: '✏️',
    category: 'content',
    defaultConfig: {
      enabled: false,
      provider: 'openai',
      model: 'gpt-4',
      apiKey: '',
      systemPrompt: 'Eres un experto profesor de español como lengua extranjera (ESL/ELE). Generas ejercicios educativos de alta calidad siguiendo formatos específicos. Tus ejercicios son apropiados para el nivel CEFR solicitado y siguen las mejores prácticas pedagógicas.',
      parameters: {
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1
      }
    }
  },
  {
    id: 'chat_assistant',
    name: 'Asistente de Chat',
    description: 'Responde preguntas de estudiantes en tiempo real',
    icon: '💬',
    category: 'teaching',
    defaultConfig: {
      enabled: false,
      provider: 'claude',
      model: 'claude-3-5-sonnet-20241022',
      apiKey: '',
      systemPrompt: 'Eres un tutor paciente y amigable. Respondes preguntas de estudiantes de español de manera clara, usando ejemplos y siendo alentador. Adaptas tu nivel de explicación al nivel del estudiante.',
      parameters: {
        temperature: 0.8,
        maxTokens: 1000,
        topP: 1
      }
    }
  },
  {
    id: 'auto_grader',
    name: 'Evaluador Automático',
    description: 'Corrige ensayos y respuestas abiertas',
    icon: '🎯',
    category: 'grading',
    defaultConfig: {
      enabled: false,
      provider: 'grok',
      model: 'grok-2',
      apiKey: '',
      systemPrompt: 'Eres un evaluador objetivo y constructivo. Analizas respuestas de estudiantes de español, identificas errores gramaticales, ortográficos y de contenido. Proporcionas feedback específico y sugerencias de mejora.',
      parameters: {
        temperature: 0.3,
        maxTokens: 1500,
        topP: 0.9
      }
    }
  },
  {
    id: 'content_creator',
    name: 'Creador de Contenido',
    description: 'Genera lecciones, lecturas y material educativo',
    icon: '📚',
    category: 'content',
    defaultConfig: {
      enabled: false,
      provider: 'google',
      model: 'gemini-pro',
      apiKey: '',
      systemPrompt: 'Eres un creador de contenido educativo especializado en enseñanza de español. Generas lecciones bien estructuradas, lecturas apropiadas por nivel, y material didáctico efectivo.',
      parameters: {
        temperature: 0.75,
        maxTokens: 3000,
        topP: 0.95
      }
    }
  },
  {
    id: 'translator',
    name: 'Traductor Educativo',
    description: 'Traduce con contexto pedagógico y explicaciones',
    icon: '🌐',
    category: 'tools',
    defaultConfig: {
      enabled: false,
      provider: 'openai',
      model: 'gpt-4',
      apiKey: '',
      systemPrompt: 'Eres un traductor educativo. Traduces textos y además proporcionas contexto cultural, explicaciones de modismos, y notas pedagógicas útiles para estudiantes de español.',
      parameters: {
        temperature: 0.5,
        maxTokens: 2000,
        topP: 1
      }
    }
  },
  {
    id: 'feedback_generator',
    name: 'Generador de Feedback',
    description: 'Crea comentarios personalizados para estudiantes',
    icon: '📝',
    category: 'teaching',
    defaultConfig: {
      enabled: false,
      provider: 'claude',
      model: 'claude-3-haiku-20240307',
      apiKey: '',
      systemPrompt: 'Eres un asistente que genera feedback personalizado y constructivo para estudiantes. Tus comentarios son específicos, alentadores y proporcionan pasos claros para mejorar.',
      parameters: {
        temperature: 0.7,
        maxTokens: 800,
        topP: 1
      }
    }
  },
  {
    id: 'lesson_planner',
    name: 'Planificador de Clases',
    description: 'Crea planes de lección y actividades',
    icon: '📅',
    category: 'planning',
    defaultConfig: {
      enabled: false,
      provider: 'openai',
      model: 'gpt-4-turbo',
      apiKey: '',
      systemPrompt: 'Eres un planificador de clases experto en ELE. Creas planes de lección detallados, con objetivos claros, actividades variadas, y evaluaciones apropiadas para cada nivel.',
      parameters: {
        temperature: 0.8,
        maxTokens: 2500,
        topP: 0.95
      }
    }
  },
  {
    id: 'pronunciation_coach',
    name: 'Coach de Pronunciación',
    description: 'Analiza y da feedback sobre pronunciación',
    icon: '🗣️',
    category: 'teaching',
    defaultConfig: {
      enabled: false,
      provider: 'google',
      model: 'gemini-1.5-pro',
      apiKey: '',
      systemPrompt: 'Eres un especialista en fonética española. Analizas transcripciones de audio y proporcionas feedback específico sobre pronunciación, entonación y ritmo.',
      parameters: {
        temperature: 0.6,
        maxTokens: 1200,
        topP: 1
      }
    }
  }
];

/**
 * Categories for grouping functions
 */
export const AI_CATEGORIES = [
  { id: 'content', label: 'Creación de Contenido', icon: '📝' },
  { id: 'teaching', label: 'Enseñanza', icon: '👨‍🏫' },
  { id: 'grading', label: 'Evaluación', icon: '📊' },
  { id: 'tools', label: 'Herramientas', icon: '🛠️' },
  { id: 'planning', label: 'Planificación', icon: '📋' }
];

/**
 * Get provider by ID
 */
export function getProviderById(providerId) {
  return AI_PROVIDERS.find(p => p.id === providerId);
}

/**
 * Get function by ID
 */
export function getFunctionById(functionId) {
  return AI_FUNCTIONS.find(f => f.id === functionId);
}

/**
 * Get functions by category
 */
export function getFunctionsByCategory(categoryId) {
  return AI_FUNCTIONS.filter(f => f.category === categoryId);
}
