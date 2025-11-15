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
  Sparkles,
  Volume2
} from 'lucide-react';

/**
 * Available AI providers
 * ⚠️ IMPORTANTE: Los IDs deben coincidir con PROVIDER_MAPPINGS en CredentialsTab.jsx
 * - claude (no anthropic) para consistencia con backend
 * - grok (no xai) para consistencia con backend
 */
export const AI_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: Bot,
    description: 'Modelos GPT de OpenAI. Soporta temperature, top_p y max_tokens.',
    models: [
      { value: 'gpt-4.1', label: 'GPT-4.1 (Latest 2025 - 1M tokens context)' },
      { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini (Latest 2025 - Balanceado)' },
      { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano (Latest 2025 - Más rápido)' },
      { value: 'gpt-4o', label: 'GPT-4o (Multimodal)' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Legacy)' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Deprecated)' }
    ],
    supportsTemperature: true,
    supportsTopP: true,
    supportsMaxTokens: true
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    icon: Brain,
    description: 'Modelos Claude de Anthropic. Soporta temperature y max_tokens (no top_p). Claude 4.5 con 1M tokens.',
    models: [
      { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5 (Latest - Mejor coding, reasoning y agentes)' },
      { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5 (Sep 2025)' },
      { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (Más rápido, near-frontier performance)' },
      { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (Oct 2025)' },
      { value: 'claude-opus-4-1', label: 'Claude Opus 4.1 (Más potente)' },
      { value: 'claude-opus-4-1-20250805', label: 'Claude Opus 4.1 (Ago 2025)' },
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Legacy - Oct 2024)' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Legacy)' }
    ],
    supportsTemperature: true,
    supportsTopP: false,
    supportsMaxTokens: true,
    supportsExtendedThinking: true
  },
  {
    id: 'grok',
    name: 'Grok (xAI)',
    icon: Rocket,
    description: 'Modelos Grok de xAI. Soporta temperature, top_p y max_tokens. Grok 4 con 256K tokens de contexto.',
    models: [
      { value: 'grok-4', label: 'Grok 4 (Latest - Julio 2025, 256K context, más inteligente)' },
      { value: 'grok-3', label: 'Grok 3 (Feb 2025 - GA disponible)' },
      { value: 'grok-3-mini', label: 'Grok 3 Mini (Feb 2025 - Eficiente)' },
      { value: 'grok-2-1212', label: 'Grok 2 (Legacy - Dec 2024)' },
      { value: 'grok-2-vision-1212', label: 'Grok 2 Vision (Legacy - Dec 2024)' }
    ],
    supportsTemperature: true,
    supportsTopP: true,
    supportsMaxTokens: true,
    supportsLiveSearch: true
  },
  {
    id: 'google',
    name: 'Google Gemini',
    icon: Search,
    description: 'Modelos Gemini de Google. Soporta temperature, top_p y max_tokens.',
    models: [
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Más avanzado - Tareas complejas)' },
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Velocidad y eficiencia)' },
      { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (Más económico - Alto volumen)' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Legacy)' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Legacy)' }
    ],
    supportsTemperature: true,
    supportsTopP: true,
    supportsMaxTokens: true
  },
  {
    id: 'dalle',
    name: 'DALL-E (OpenAI)',
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
    description: 'Stable Diffusion 3.5 (Latest - 8.1B parámetros). Ideal para imágenes artísticas y realistas con gran control creativo.',
    models: [
      { value: 'stable-diffusion-3.5-large', label: 'SD 3.5 Large (Latest - 8.1B params, mejor calidad)' },
      { value: 'stable-diffusion-3.5-large-turbo', label: 'SD 3.5 Large Turbo (Latest - Más rápido)' },
      { value: 'stable-diffusion-3.5-medium', label: 'SD 3.5 Medium (Latest - Balanceado)' },
      { value: 'stable-diffusion-3.5-flash', label: 'SD 3.5 Flash (Latest - Velocidad)' },
      { value: 'stable-image-ultra', label: 'Stable Image Ultra (Máxima calidad)' },
      { value: 'stable-image-core', label: 'Stable Image Core (Balanceado)' },
      { value: 'stable-diffusion-3-large', label: 'SD 3 Large (Legacy)' },
      { value: 'stable-diffusion-xl-1024-v1-0', label: 'SDXL 1.0 (Legacy)' }
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
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    icon: Volume2,
    description: 'Text-to-Speech ultra-natural con voces personalizables. Soporta voces multilingües con acento argentino.',
    models: [
      { value: 'eleven_multilingual_v2', label: 'Multilingual v2 (Recomendado)' },
      { value: 'eleven_turbo_v2_5', label: 'Turbo v2.5 (Más rápido)' },
      { value: 'eleven_turbo_v2', label: 'Turbo v2 (Legacy)' },
      { value: 'eleven_monolingual_v1', label: 'Monolingual v1 (Legacy)' }
    ],
    supportsTemperature: false,
    supportsTopP: false,
    supportsMaxTokens: false,
    supportsVoiceSettings: true,
    voiceSettings: {
      stability: { min: 0, max: 1, step: 0.01, default: 0.5 },
      similarity_boost: { min: 0, max: 1, step: 0.01, default: 0.75 },
      style: { min: 0, max: 1, step: 0.01, default: 0.5 },
      use_speaker_boost: { type: 'boolean', default: true }
    }
  }
];

/**
 * Available AI functions/use cases
 * ⚠️ IMPORTANTE: Las API keys NO se guardan aquí, vienen del panel de Credenciales
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
      model: 'gpt-4.1',
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
      model: 'grok-4',
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
      enabled: true,
      provider: 'openai',
      model: 'gpt-4.1',
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
      model: 'claude-3-5-haiku-20241022',
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
      // ✨ OCR & Analysis providers (separate for better accuracy)
      analysis_provider: 'claude',  // Who analyzes and corrects the text
      ocr_provider: 'google',        // Who extracts word coordinates (MUST be 'google' for highlights)
      // Configuración de corrección
      strictnessLevel: 'intermediate', // 'beginner' | 'intermediate' | 'advanced'
      correctionTypes: {
        spelling: true,
        grammar: true,
        punctuation: true,
        vocabulary: true
      },
      feedbackStyle: 'encouraging', // 'encouraging' | 'neutral' | 'academic'
      detailedExplanations: true,
      includeSynonyms: false,
      includeExamples: true,
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
      model: 'stable-diffusion-3.5-large',
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
      systemPrompt: 'Crea imágenes claras y didácticas para enseñar vocabulario en español. Cada imagen debe mostrar claramente el objeto, acción o concepto de forma inequívoca.',
      parameters: {
        size: '1024x1024',
        quality: 'hd',
        n: 1
      }
    }
  },
  {
    id: 'voice_lab',
    name: 'Laboratorio de Voces',
    description: 'Explora, prueba y configura voces premium de ElevenLabs con parámetros personalizables',
    icon: Volume2,
    category: 'tools',
    defaultConfig: {
      enabled: false,
      provider: 'elevenlabs',
      model: 'eleven_multilingual_v2',
      systemPrompt: '',
      parameters: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true
      },
      selectedVoiceId: null,
      selectedVoiceName: null,
      presets: []
    }
  },
  {
    id: 'selection_speaker',
    name: 'Pronunciación de Selección',
    description: 'Convierte texto seleccionado en audio con voces configurables (Edge TTS gratis o ElevenLabs premium)',
    icon: Volume2,
    category: 'tools',
    defaultConfig: {
      enabled: true,
      provider: 'edgetts', // 'edgetts' (gratis) o 'elevenlabs' (premium)
      model: 'eleven_multilingual_v2', // Solo para ElevenLabs
      systemPrompt: '',
      parameters: {
        rate: 1.0, // Velocidad de habla (0.5 - 2.0)
        stability: 0.5, // Solo ElevenLabs (0-1)
        similarity_boost: 0.75, // Solo ElevenLabs (0-1)
        style: 0.5, // Solo ElevenLabs (0-1)
        use_speaker_boost: true // Solo ElevenLabs
      },
      // Voces disponibles por proveedor
      voices: {
        edgetts: [
          {
            id: 'es-AR-female-1',
            name: 'Elena (Argentina - Femenina)',
            voiceId: 'es-AR-ElenaNeural',
            gender: 'female',
            accent: 'Argentina',
            description: 'Voz femenina natural con acento argentino',
            isDefault: true
          },
          {
            id: 'es-AR-male-1',
            name: 'Tomás (Argentina - Masculina)',
            voiceId: 'es-AR-TomasNeural',
            gender: 'male',
            accent: 'Argentina',
            description: 'Voz masculina natural con acento argentino'
          },
          {
            id: 'es-MX-female-1',
            name: 'Dalia (México - Femenina)',
            voiceId: 'es-MX-DaliaNeural',
            gender: 'female',
            accent: 'México',
            description: 'Voz femenina natural con acento mexicano'
          },
          {
            id: 'es-MX-male-1',
            name: 'Jorge (México - Masculina)',
            voiceId: 'es-MX-JorgeNeural',
            gender: 'male',
            accent: 'México',
            description: 'Voz masculina natural con acento mexicano'
          },
          {
            id: 'es-ES-female-1',
            name: 'Elvira (España - Femenina)',
            voiceId: 'es-ES-ElviraNeural',
            gender: 'female',
            accent: 'España',
            description: 'Voz femenina natural con acento español'
          }
        ],
        elevenlabs: [
          {
            id: 'bella-premium',
            name: 'Bella (Premium - Femenina)',
            voiceId: 'EXAVITQu4vr4xnSDxMaL',
            gender: 'female',
            description: 'Voz femenina premium de alta calidad',
            isDefault: true
          },
          {
            id: 'adam-premium',
            name: 'Adam (Premium - Masculina)',
            voiceId: 'pNInz6obpgDQGcFmaJgB',
            gender: 'male',
            description: 'Voz masculina premium de alta calidad'
          },
          {
            id: 'domi-premium',
            name: 'Domi (Premium - Femenina)',
            voiceId: 'AZnzlk1XvdvUeBnXmlld',
            gender: 'female',
            description: 'Voz femenina premium versátil'
          },
          {
            id: 'antoni-premium',
            name: 'Antoni (Premium - Masculina)',
            voiceId: 'ErXwobaYiN019PkySvjV',
            gender: 'male',
            description: 'Voz masculina premium versátil'
          }
        ]
      },
      selectedVoiceId: 'es-AR-female-1', // Voz por defecto
      allowStudentSelection: false, // Permitir que alumnos elijan voz
      autoCache: true // Cachear automáticamente
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
  { id: 'images', label: 'Imágenes', icon: Image },
  { id: 'correction_profiles', label: 'Perfiles de Corrección', icon: CheckCircle2 },
  { id: 'demo_tasks', label: 'Tareas de Demostración', icon: Sparkles }
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
