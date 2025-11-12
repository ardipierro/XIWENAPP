/**
 * @fileoverview AI Functions Configuration Constants
 * @module constants/aiFunctions
 */

import {
  Bot,
  Brain,
  Rocket,
  Search,
  PenTool,
  MessageCircle,
  Target,
  BookOpen,
  Languages,
  MessageSquare,
  Calendar,
  Mic,
  FileText,
  GraduationCap,
  BarChart3,
  Wrench,
  ClipboardList,
  CheckCircle2,
  Image,
  Palette,
  Sparkles
} from 'lucide-react';

/**
 * Available AI providers
 */
export const AI_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: Bot,
    description: 'Modelos GPT de OpenAI. Soporta temperature y top_p.',
    models: [
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
    ],
    supportsTemperature: true,
    supportsTopP: true,
    supportsMaxTokens: true
  },
  {
    id: 'claude',
    name: 'Claude',
    icon: Brain,
    description: 'Modelos Claude de Anthropic. Solo soporta temperature (no top_p).',
    models: [
      { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5 (Latest)' },
      { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5 (Sep 2024)' },
      { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (Latest)' },
      { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (Oct 2024)' },
      { value: 'claude-opus-4-1', label: 'Claude Opus 4.1 (Latest)' },
      { value: 'claude-opus-4-1-20250805', label: 'Claude Opus 4.1 (Aug 2024)' }
    ],
    supportsTemperature: true,
    supportsTopP: false,
    supportsMaxTokens: true
  },
  {
    id: 'grok',
    name: 'Grok',
    icon: Rocket,
    description: 'Modelos Grok de xAI. Soporta temperature y top_p.',
    models: [
      { value: 'grok-beta', label: 'Grok Beta' },
      { value: 'grok-2', label: 'Grok 2' }
    ],
    supportsTemperature: true,
    supportsTopP: true,
    supportsMaxTokens: true
  },
  {
    id: 'google',
    name: 'Google',
    icon: Search,
    description: 'Modelos Gemini de Google. Soporta temperature y top_p.',
    models: [
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Latest)' },
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Best Price-Performance)' },
      { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (Fastest)' },
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' }
    ],
    supportsTemperature: true,
    supportsTopP: true,
    supportsMaxTokens: true
  },
  {
    id: 'dalle',
    name: 'DALL-E',
    icon: Image,
    description: 'Generación de imágenes con DALL-E de OpenAI. Ideal para ilustraciones educativas.',
    models: [
      { value: 'dall-e-3', label: 'DALL-E 3 (Mejor calidad)' },
      { value: 'dall-e-2', label: 'DALL-E 2 (Más rápido)' }
    ],
    supportsTemperature: false,
    supportsTopP: false,
    supportsMaxTokens: false,
    supportsImageSize: true,
    supportsImageQuality: true,
    imageSizes: [
      { value: '1024x1024', label: '1024x1024 (Cuadrado)' },
      { value: '1024x1792', label: '1024x1792 (Vertical)' },
      { value: '1792x1024', label: '1792x1024 (Horizontal)' }
    ],
    imageQualities: [
      { value: 'standard', label: 'Estándar' },
      { value: 'hd', label: 'HD (Mayor detalle)' }
    ]
  },
  {
    id: 'stability',
    name: 'Stability AI',
    icon: Palette,
    description: 'Stable Diffusion para imágenes artísticas y realistas. Gran control creativo.',
    models: [
      { value: 'stable-diffusion-xl-1024-v1-0', label: 'SDXL 1.0 (Mejor calidad)' },
      { value: 'stable-diffusion-v1-6', label: 'SD 1.6 (Equilibrado)' },
      { value: 'stable-diffusion-512-v2-1', label: 'SD 2.1 (Rápido)' }
    ],
    supportsTemperature: false,
    supportsTopP: false,
    supportsMaxTokens: false,
    supportsImageSize: true,
    supportsSteps: true,
    supportsCfgScale: true,
    imageSizes: [
      { value: '1024x1024', label: '1024x1024 (Cuadrado)' },
      { value: '512x512', label: '512x512 (Cuadrado pequeño)' },
      { value: '768x1344', label: '768x1344 (Vertical)' },
      { value: '1344x768', label: '1344x768 (Horizontal)' }
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
    icon: PenTool,
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
    icon: MessageCircle,
    category: 'teaching',
    defaultConfig: {
      enabled: false,
      provider: 'claude',
      model: 'claude-sonnet-4-5',
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
    icon: Target,
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
    icon: BookOpen,
    category: 'content',
    defaultConfig: {
      enabled: false,
      provider: 'google',
      model: 'gemini-2.5-flash',
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
    icon: Languages,
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
    icon: MessageSquare,
    category: 'teaching',
    defaultConfig: {
      enabled: false,
      provider: 'claude',
      model: 'claude-haiku-4-5',
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
    icon: Calendar,
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
    icon: Mic,
    category: 'teaching',
    defaultConfig: {
      enabled: false,
      provider: 'google',
      model: 'gemini-2.5-flash',
      apiKey: '',
      systemPrompt: 'Eres un especialista en fonética española. Analizas transcripciones de audio y proporcionas feedback específico sobre pronunciación, entonación y ritmo.',
      parameters: {
        temperature: 0.6,
        maxTokens: 1200,
        topP: 1
      }
    }
  },
  {
    id: 'homework_analyzer',
    name: 'Analizador de Tareas',
    description: 'Analiza tareas escritas con imágenes y genera correcciones detalladas',
    icon: CheckCircle2,
    category: 'grading',
    defaultConfig: {
      enabled: false,
      provider: 'claude',
      model: 'claude-sonnet-4-5',
      apiKey: '',
      systemPrompt: `Eres un profesor experto en español como lengua extranjera. Tu tarea es analizar imágenes de tareas escritas por estudiantes y proporcionar una corrección detallada y constructiva.

INSTRUCCIONES:
1. Lee cuidadosamente el texto en la imagen (puede ser manuscrito o impreso)
2. Identifica TODOS los errores: ortografía, gramática, puntuación, vocabulario
3. Clasifica cada error por tipo
4. Para cada error, proporciona:
   - El texto original (con el error)
   - La corrección apropiada
   - Una explicación clara y pedagógica del error
   - El número de línea aproximado donde aparece
5. Genera un resumen ejecutivo con conteo de errores por categoría
6. Proporciona feedback general constructivo
7. Sugiere una calificación (0-100) basada en:
   - Exactitud gramatical (40%)
   - Ortografía (20%)
   - Vocabulario y uso apropiado (20%)
   - Estructura y coherencia (20%)

FORMATO DE RESPUESTA (JSON):
{
  "transcription": "Texto completo extraído de la imagen",
  "errorSummary": {
    "spelling": número,
    "grammar": número,
    "punctuation": número,
    "vocabulary": número,
    "total": número
  },
  "detailedCorrections": [
    {
      "type": "spelling|grammar|punctuation|vocabulary",
      "original": "texto con error",
      "correction": "texto corregido",
      "explanation": "explicación pedagógica",
      "line": número
    }
  ],
  "overallFeedback": "Comentario general constructivo y alentador",
  "suggestedGrade": número (0-100)
}

Sé preciso, constructivo y educativo. Tu objetivo es ayudar al estudiante a mejorar.`,
      parameters: {
        temperature: 0.4,
        maxTokens: 4000
      }
    }
  },
  {
    id: 'dashboard_assistant',
    name: 'Asistente del Dashboard',
    description: 'Asistente inteligente para consultas sobre estudiantes, tareas, pagos y métricas del dashboard',
    icon: BarChart3,
    category: 'tools',
    defaultConfig: {
      enabled: true,
      provider: 'claude',
      model: 'claude-sonnet-4-5',
      apiKey: '',
      systemPrompt: 'Eres un asistente inteligente para el dashboard de XIWENAPP, una plataforma educativa de enseñanza de chino mandarín. Ayudas a profesores y administradores a obtener información sobre estudiantes, tareas, pagos y métricas del sistema. Respondes de forma clara, concisa y profesional en español.',
      parameters: {
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1
      }
    }
  },
  {
    id: 'image_generator',
    name: 'Generador de Imágenes',
    description: 'Crea imágenes educativas para lecciones y ejercicios',
    icon: Image,
    category: 'content',
    defaultConfig: {
      enabled: false,
      provider: 'dalle',
      model: 'dall-e-3',
      apiKey: '',
      systemPrompt: 'Genera imágenes educativas claras y apropiadas para estudiantes de español. Las imágenes deben ser simples, coloridas y fáciles de entender.',
      parameters: {
        size: '1024x1024',
        quality: 'standard',
        n: 1
      }
    }
  },
  {
    id: 'illustration_creator',
    name: 'Creador de Ilustraciones',
    description: 'Genera ilustraciones artísticas para contenido educativo',
    icon: Palette,
    category: 'content',
    defaultConfig: {
      enabled: false,
      provider: 'stability',
      model: 'stable-diffusion-xl-1024-v1-0',
      apiKey: '',
      systemPrompt: 'Crea ilustraciones artísticas y atractivas para material educativo. Estilo amigable, colorido y apropiado para todas las edades.',
      parameters: {
        size: '1024x1024',
        steps: 30,
        cfg_scale: 7
      }
    }
  },
  {
    id: 'visual_vocabulary',
    name: 'Vocabulario Visual',
    description: 'Genera imágenes para enseñar vocabulario con contexto visual',
    icon: Sparkles,
    category: 'content',
    defaultConfig: {
      enabled: false,
      provider: 'dalle',
      model: 'dall-e-3',
      apiKey: '',
      systemPrompt: 'Crea imágenes claras y didácticas para enseñar vocabulario en español. Cada imagen debe mostrar claramente el objeto, acción o concepto de forma inequívoca.',
      parameters: {
        size: '1024x1024',
        quality: 'hd',
        n: 1
      }
    }
  }
];

/**
 * Categories for grouping functions
 */
export const AI_CATEGORIES = [
  { id: 'content', label: 'Creación de Contenido', icon: FileText },
  { id: 'teaching', label: 'Enseñanza', icon: GraduationCap },
  { id: 'grading', label: 'Evaluación', icon: BarChart3 },
  { id: 'tools', label: 'Herramientas', icon: Wrench },
  { id: 'planning', label: 'Planificación', icon: ClipboardList },
  { id: 'images', label: 'Imágenes', icon: Image }
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
