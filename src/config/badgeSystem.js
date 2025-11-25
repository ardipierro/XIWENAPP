/**
 * @fileoverview Sistema Centralizado de Badges para XIWENAPP
 *
 * ⭐ ESTE ES EL ÚNICO LUGAR donde se definen:
 * - Categorías de badges (tipos, niveles, estados, temas)
 * - Colores por defecto de cada categoría
 * - Mapeo automático de valores a badges
 * - Iconos monocromáticos por categoría
 *
 * Los admins pueden personalizar colores desde Settings → Badges
 *
 * @module config/badgeSystem
 */

// ============================================
// CATEGORÍAS BASE DEL SISTEMA
// ============================================

/**
 * Configuración por defecto de todas las categorías de badges
 * Estructura: { key: { variant, color, label, icon?, description?, badgeStyle? } }
 */
export const DEFAULT_BADGE_CONFIG = {
  // ========================================
  // TIPOS DE CONTENIDO
  // ========================================
  CONTENT_COURSE: {
    variant: 'primary',
    color: '#5b8fa3',
    label: 'Curso',
    icon: '📚',
    heroicon: 'BookOpenIcon',
    description: 'Contenedor de lecciones y ejercicios',
    category: 'contentType',
    badgeStyle: 'solid'
  },
  CONTENT_LESSON: {
    variant: 'success',
    color: '#10b981',
    label: 'Lección',
    icon: '📝',
    heroicon: 'DocumentTextIcon',
    description: 'Contenido teórico',
    category: 'contentType'
  },
  CONTENT_READING: {
    variant: 'info',
    color: '#7a8fa8',
    label: 'Lectura',
    icon: '📖',
    heroicon: 'NewspaperIcon',
    description: 'Documento de lectura',
    category: 'contentType'
  },
  CONTENT_VIDEO: {
    variant: 'danger',
    color: '#ef4444',
    label: 'Video',
    icon: '🎥',
    heroicon: 'VideoCameraIcon',
    description: 'Contenido multimedia',
    category: 'contentType'
  },
  CONTENT_LINK: {
    variant: 'default',
    color: '#71717a',
    label: 'Link',
    icon: '🔗',
    heroicon: 'LinkIcon',
    description: 'Recurso externo',
    category: 'contentType'
  },
  CONTENT_EXERCISE: {
    variant: 'warning',
    color: '#f59e0b',
    label: 'Ejercicio',
    icon: '✏️',
    heroicon: 'PencilIcon',
    description: 'Práctica con preguntas',
    category: 'contentType'
  },
  CONTENT_LIVEGAME: {
    variant: 'info',
    color: '#06b6d4',
    label: 'Juego en Vivo',
    icon: '🎮',
    heroicon: 'PuzzlePieceIcon',
    description: 'Sesión interactiva',
    category: 'contentType'
  },

  // ========================================
  // TIPOS DE EJERCICIO
  // ========================================
  EXERCISE_MULTIPLE_CHOICE: {
    variant: 'primary',
    color: '#5b8fa3',
    label: 'Opción Múltiple',
    icon: '☑️',
    heroicon: 'CheckCircleIcon',
    description: 'Selección de respuestas',
    category: 'exerciseType'
  },
  EXERCISE_FILL_BLANK: {
    variant: 'success',
    color: '#10b981',
    label: 'Llenar Espacios',
    icon: '📝',
    heroicon: 'DocumentTextIcon',
    description: 'Completar oraciones',
    category: 'exerciseType'
  },
  EXERCISE_MATCHING: {
    variant: 'warning',
    color: '#f59e0b',
    label: 'Emparejar',
    icon: '🔗',
    heroicon: 'LinkIcon',
    description: 'Relacionar elementos',
    category: 'exerciseType'
  },
  EXERCISE_ORDERING: {
    variant: 'info',
    color: '#7a8fa8',
    label: 'Ordenar',
    icon: '🔢',
    heroicon: 'ListBulletIcon',
    description: 'Secuenciar elementos',
    category: 'exerciseType'
  },
  EXERCISE_TRUE_FALSE: {
    variant: 'danger',
    color: '#ef4444',
    label: 'Verdadero/Falso',
    icon: '✓✗',
    heroicon: 'HandThumbUpIcon',
    description: 'Evaluación binaria',
    category: 'exerciseType'
  },
  EXERCISE_SHORT_ANSWER: {
    variant: 'primary',
    color: '#5b8fa3',
    label: 'Respuesta Corta',
    icon: '✍️',
    heroicon: 'PencilSquareIcon',
    description: 'Respuesta textual breve',
    category: 'exerciseType'
  },
  EXERCISE_ESSAY: {
    variant: 'info',
    color: '#06b6d4',
    label: 'Ensayo',
    icon: '📄',
    heroicon: 'DocumentIcon',
    description: 'Respuesta extensa',
    category: 'exerciseType'
  },
  EXERCISE_LISTENING: {
    variant: 'warning',
    color: '#f59e0b',
    label: 'Comprensión Auditiva',
    icon: '🎧',
    heroicon: 'MusicalNoteIcon',
    description: 'Ejercicio de audio',
    category: 'exerciseType'
  },
  EXERCISE_WORD_HIGHLIGHT: {
    variant: 'info',
    color: '#6366f1',
    label: 'Marcar Palabras',
    icon: '🎯',
    heroicon: 'CursorArrowRaysIcon',
    description: 'Identificar palabras en el texto',
    category: 'exerciseType'
  },
  EXERCISE_DRAG_DROP: {
    variant: 'success',
    color: '#14b8a6',
    label: 'Arrastrar',
    icon: '✋',
    heroicon: 'Squares2X2Icon',
    description: 'Arrastrar palabras a su posición',
    category: 'exerciseType'
  },
  EXERCISE_FILL_BLANKS: {
    variant: 'primary',
    color: '#3b82f6',
    label: 'Completar',
    icon: '✏️',
    heroicon: 'PencilIcon',
    description: 'Escribir palabras en espacios',
    category: 'exerciseType'
  },
  EXERCISE_AI_GENERATED: {
    variant: 'secondary',
    color: '#8b5cf6',
    label: 'Generado con IA',
    icon: '🤖',
    heroicon: 'SparklesIcon',
    description: 'Ejercicio creado con inteligencia artificial',
    category: 'exerciseType'
  },

  // ========================================
  // NIVELES DE DIFICULTAD
  // ========================================
  DIFFICULTY_BEGINNER: {
    variant: 'success',
    color: '#10b981',
    label: 'Principiante',
    icon: '🟢',
    heroicon: 'SignalIcon',
    description: 'Nivel básico',
    category: 'difficulty'
  },
  DIFFICULTY_INTERMEDIATE: {
    variant: 'warning',
    color: '#f59e0b',
    label: 'Intermedio',
    icon: '🟡',
    heroicon: 'SignalIcon',
    description: 'Nivel medio',
    category: 'difficulty'
  },
  DIFFICULTY_ADVANCED: {
    variant: 'danger',
    color: '#ef4444',
    label: 'Avanzado',
    icon: '🔴',
    heroicon: 'SignalIcon',
    description: 'Nivel alto',
    category: 'difficulty'
  },

  // ========================================
  // NIVELES CEFR (Marco Europeo)
  // ========================================
  CEFR_A1: {
    variant: 'success',
    color: '#10b981',
    label: 'A1',
    icon: '🌱',
    heroicon: 'SparklesIcon',
    description: 'Básico - Acceso',
    category: 'cefr'
  },
  CEFR_A2: {
    variant: 'success',
    color: '#16a34a',
    label: 'A2',
    icon: '🌿',
    heroicon: 'SparklesIcon',
    description: 'Básico - Plataforma',
    category: 'cefr'
  },
  CEFR_B1: {
    variant: 'warning',
    color: '#f59e0b',
    label: 'B1',
    icon: '🌾',
    heroicon: 'SparklesIcon',
    description: 'Intermedio - Umbral',
    category: 'cefr'
  },
  CEFR_B2: {
    variant: 'warning',
    color: '#d97706',
    label: 'B2',
    icon: '🌻',
    heroicon: 'StarIcon',
    description: 'Intermedio - Avanzado',
    category: 'cefr'
  },
  CEFR_C1: {
    variant: 'danger',
    color: '#ef4444',
    label: 'C1',
    icon: '🌳',
    heroicon: 'FireIcon',
    description: 'Avanzado - Dominio',
    category: 'cefr'
  },
  CEFR_C2: {
    variant: 'danger',
    color: '#dc2626',
    label: 'C2',
    icon: '🏆',
    heroicon: 'TrophyIcon',
    description: 'Avanzado - Maestría',
    category: 'cefr'
  },

  // ========================================
  // ESTADOS DE CONTENIDO
  // ========================================
  STATUS_DRAFT: {
    variant: 'default',
    color: '#71717a',
    label: 'Borrador',
    icon: '📝',
    heroicon: 'DocumentTextIcon',
    description: 'En edición',
    category: 'status'
  },
  STATUS_REVIEW: {
    variant: 'warning',
    color: '#f59e0b',
    label: 'En Revisión',
    icon: '👀',
    heroicon: 'EyeIcon',
    description: 'Pendiente de aprobación',
    category: 'status'
  },
  STATUS_PUBLISHED: {
    variant: 'success',
    color: '#10b981',
    label: 'Publicado',
    icon: '✅',
    heroicon: 'CheckBadgeIcon',
    description: 'Visible para estudiantes',
    category: 'status'
  },
  STATUS_ARCHIVED: {
    variant: 'default',
    color: '#a1a1aa',
    label: 'Archivado',
    icon: '📦',
    heroicon: 'ArchiveBoxIcon',
    description: 'No visible',
    category: 'status'
  },

  // ========================================
  // CATEGORÍAS TEMÁTICAS
  // ========================================
  THEME_VOCABULARY: {
    variant: 'primary',
    color: '#5b8fa3',
    label: 'Vocabulario',
    icon: '📚',
    heroicon: 'BookOpenIcon',
    description: 'Palabras y expresiones',
    category: 'theme'
  },
  THEME_GRAMMAR: {
    variant: 'info',
    color: '#7a8fa8',
    label: 'Gramática',
    icon: '📖',
    heroicon: 'NewspaperIcon',
    description: 'Reglas y estructuras',
    category: 'theme'
  },
  THEME_CONVERSATION: {
    variant: 'success',
    color: '#10b981',
    label: 'Conversación',
    icon: '💬',
    heroicon: 'ChatBubbleLeftRightIcon',
    description: 'Diálogo y comunicación',
    category: 'theme'
  },
  THEME_PRONUNCIATION: {
    variant: 'warning',
    color: '#f59e0b',
    label: 'Pronunciación',
    icon: '🗣️',
    heroicon: 'SpeakerWaveIcon',
    description: 'Fonética y entonación',
    category: 'theme'
  },
  THEME_READING: {
    variant: 'info',
    color: '#06b6d4',
    label: 'Comprensión Lectora',
    icon: '📖',
    heroicon: 'NewspaperIcon',
    description: 'Lectura y comprensión',
    category: 'theme'
  },
  THEME_LISTENING: {
    variant: 'warning',
    color: '#f59e0b',
    label: 'Comprensión Auditiva',
    icon: '🎧',
    heroicon: 'MusicalNoteIcon',
    description: 'Escucha y comprensión',
    category: 'theme'
  },
  THEME_WRITING: {
    variant: 'primary',
    color: '#5b8fa3',
    label: 'Escritura',
    icon: '✍️',
    heroicon: 'PencilSquareIcon',
    description: 'Redacción y composición',
    category: 'theme'
  },
  THEME_CULTURE: {
    variant: 'danger',
    color: '#ef4444',
    label: 'Cultura',
    icon: '🌍',
    heroicon: 'GlobeAltIcon',
    description: 'Contexto cultural',
    category: 'theme'
  },

  // ========================================
  // CARACTERÍSTICAS DE CONTENIDO
  // ========================================
  FEATURE_AUDIO: {
    variant: 'warning',
    color: '#f59e0b',
    label: 'Con Audio',
    icon: '🔊',
    heroicon: 'SpeakerWaveIcon',
    description: 'Incluye audio TTS o grabado',
    category: 'feature'
  },
  FEATURE_VIDEO: {
    variant: 'danger',
    color: '#ef4444',
    label: 'Con Video',
    icon: '🎥',
    heroicon: 'VideoCameraIcon',
    description: 'Incluye contenido multimedia',
    category: 'feature'
  },
  FEATURE_INTERACTIVE: {
    variant: 'info',
    color: '#06b6d4',
    label: 'Interactivo',
    icon: '🎮',
    heroicon: 'PuzzlePieceIcon',
    description: 'Requiere participación activa',
    category: 'feature'
  },
  FEATURE_AI_GENERATED: {
    variant: 'info',
    color: '#7a8fa8',
    label: 'Generado con IA',
    icon: '🤖',
    heroicon: 'CpuChipIcon',
    description: 'Creado con asistencia de IA',
    category: 'feature'
  },

  // ========================================
  // ROLES DE USUARIO
  // ========================================
  ROLE_ADMIN: {
    variant: 'warning',
    color: '#f59e0b',
    label: 'Admin',
    icon: '👑',
    heroicon: 'ShieldCheckIcon',
    description: 'Administrador del sistema',
    category: 'role'
  },
  ROLE_TEACHER: {
    variant: 'info',
    color: '#7a8fa8',
    label: 'Profesor',
    icon: '👨‍🏫',
    heroicon: 'AcademicCapIcon',
    description: 'Profesor activo',
    category: 'role'
  },
  ROLE_TRIAL_TEACHER: {
    variant: 'info',
    color: '#a78bfa',
    label: 'Profesor Prueba',
    icon: '👨‍🏫',
    heroicon: 'AcademicCapIcon',
    description: 'Profesor en periodo de prueba',
    category: 'role'
  },
  ROLE_STUDENT: {
    variant: 'primary',
    color: '#5b8fa3',
    label: 'Alumno',
    icon: '🎓',
    heroicon: 'AcademicCapIcon',
    description: 'Estudiante activo',
    category: 'role'
  },
  ROLE_LISTENER: {
    variant: 'success',
    color: '#10b981',
    label: 'Oyente',
    icon: '👂',
    heroicon: 'UserIcon',
    description: 'Oyente sin evaluación',
    category: 'role'
  },
  ROLE_TRIAL: {
    variant: 'secondary',
    color: '#71717a',
    label: 'Prueba',
    icon: '🔬',
    description: 'Cuenta en periodo de prueba',
    category: 'role',
    heroicon: 'BeakerIcon'
  },

  // ========================================
  // ESTADOS DE CORRECCIÓN DE TAREAS
  // ========================================
  HOMEWORK_PENDING: {
    variant: 'warning',
    color: '#f59e0b',
    label: 'Pendiente Revisión',
    icon: '⏳',
    heroicon: 'ClockIcon',
    description: 'Esperando revisión del profesor',
    category: 'homework_status'
  },
  HOMEWORK_APPROVED: {
    variant: 'success',
    color: '#10b981',
    label: 'Aprobado',
    icon: '✅',
    heroicon: 'CheckCircleIcon',
    description: 'Tarea aprobada por el profesor',
    category: 'homework_status'
  },
  HOMEWORK_REJECTED: {
    variant: 'danger',
    color: '#ef4444',
    label: 'Rechazado',
    icon: '❌',
    heroicon: 'XCircleIcon',
    description: 'Tarea rechazada, requiere corrección',
    category: 'homework_status'
  },
  HOMEWORK_PROCESSING: {
    variant: 'info',
    color: '#7a8fa8',
    label: 'Procesando',
    icon: '⚙️',
    heroicon: 'CogIcon',
    description: 'Siendo analizada por IA',
    category: 'homework_status'
  },
  HOMEWORK_ERROR: {
    variant: 'danger',
    color: '#dc2626',
    label: 'Error',
    icon: '⚠️',
    heroicon: 'ExclamationTriangleIcon',
    description: 'Error en el procesamiento',
    category: 'homework_status'
  },

  // ========================================
  // SISTEMA DE CRÉDITOS (Clases)
  // ========================================
  GAMIFICATION_CREDITS: {
    variant: 'success',
    color: '#10b981',
    label: 'Créditos',
    icon: '💰',
    heroicon: 'CurrencyDollarIcon',
    description: 'Créditos disponibles para clases',
    category: 'credits'
  },

  // ========================================
  // GAMIFICACIÓN (XP, Nivel)
  // ========================================
  GAMIFICATION_LEVEL: {
    variant: 'info',
    color: '#a78bfa',
    label: 'Nivel',
    icon: '⭐',
    heroicon: 'StarIcon',
    description: 'Nivel de experiencia',
    category: 'gamification'
  },
  GAMIFICATION_XP: {
    variant: 'warning',
    color: '#f59e0b',
    label: 'XP',
    icon: '⚡',
    heroicon: 'BoltIcon',
    description: 'Puntos de experiencia',
    category: 'gamification'
  },
  GAMIFICATION_STREAK: {
    variant: 'danger',
    color: '#ef4444',
    label: 'Racha',
    icon: '🔥',
    heroicon: 'FireIcon',
    description: 'Días consecutivos',
    category: 'gamification'
  },

  // ========================================
  // ESTADOS DE SESIONES (CLASES EN VIVO)
  // ========================================
  SESSION_SCHEDULED: {
    variant: 'default',
    color: '#71717a',
    label: 'Programada',
    icon: '📅',
    heroicon: 'CalendarIcon',
    description: 'Sesión programada para el futuro',
    category: 'session_status'
  },
  SESSION_LIVE: {
    variant: 'danger',
    color: '#ef4444',
    label: 'En Vivo',
    icon: '🔴',
    heroicon: 'SignalIcon',
    description: 'Sesión en curso',
    category: 'session_status'
  },
  SESSION_ENDED: {
    variant: 'success',
    color: '#10b981',
    label: 'Finalizada',
    icon: '✅',
    heroicon: 'CheckCircleIcon',
    description: 'Sesión completada',
    category: 'session_status'
  },
  SESSION_CANCELLED: {
    variant: 'warning',
    color: '#f59e0b',
    label: 'Cancelada',
    icon: '⚠️',
    heroicon: 'XCircleIcon',
    description: 'Sesión cancelada',
    category: 'session_status'
  },

  // ========================================
  // ESTADOS DE USUARIO
  // ========================================
  USER_ACTIVE: {
    variant: 'success',
    color: '#10b981',
    label: 'Activo',
    icon: '✅',
    heroicon: 'CheckCircleIcon',
    description: 'Usuario activo en el sistema',
    category: 'user_status'
  },
  USER_INACTIVE: {
    variant: 'default',
    color: '#71717a',
    label: 'Inactivo',
    icon: '⏸️',
    heroicon: 'PauseCircleIcon',
    description: 'Usuario inactivo',
    category: 'user_status'
  },
  USER_ONLINE: {
    variant: 'success',
    color: '#22c55e',
    label: 'En línea',
    icon: '🟢',
    heroicon: 'SignalIcon',
    description: 'Usuario conectado',
    category: 'user_status'
  },
  USER_OFFLINE: {
    variant: 'default',
    color: '#a1a1aa',
    label: 'Desconectado',
    icon: '⚪',
    heroicon: 'MinusCircleIcon',
    description: 'Usuario desconectado',
    category: 'user_status'
  },
  USER_SUSPENDED: {
    variant: 'danger',
    color: '#ef4444',
    label: 'Suspendido',
    icon: '🚫',
    heroicon: 'NoSymbolIcon',
    description: 'Usuario suspendido',
    category: 'user_status'
  },

  // ========================================
  // PROVEEDORES DE VIDEO
  // ========================================
  PROVIDER_LIVEKIT: {
    variant: 'success',
    color: '#10b981',
    label: 'LiveKit',
    icon: '📹',
    heroicon: 'VideoCameraIcon',
    description: 'Proveedor LiveKit',
    category: 'video_provider'
  },
  PROVIDER_MEET: {
    variant: 'primary',
    color: '#4285f4',
    label: 'Google Meet',
    icon: '🎦',
    heroicon: 'VideoCameraIcon',
    description: 'Google Meet',
    category: 'video_provider'
  },
  PROVIDER_ZOOM: {
    variant: 'info',
    color: '#2d8cff',
    label: 'Zoom',
    icon: '💻',
    heroicon: 'ComputerDesktopIcon',
    description: 'Zoom Meetings',
    category: 'video_provider'
  },
  PROVIDER_VOOV: {
    variant: 'info',
    color: '#7c3aed',
    label: 'VooV',
    icon: '🎬',
    heroicon: 'FilmIcon',
    description: 'Tencent VooV Meeting',
    category: 'video_provider'
  },
  PROVIDER_EXTERNAL: {
    variant: 'default',
    color: '#71717a',
    label: 'Externo',
    icon: '🔗',
    heroicon: 'LinkIcon',
    description: 'Enlace externo',
    category: 'video_provider'
  },

  // ========================================
  // TIPOS DE PROGRAMACIÓN
  // ========================================
  SCHEDULE_RECURRING: {
    variant: 'info',
    color: '#8b5cf6',
    label: 'Recurrente',
    icon: '🔄',
    heroicon: 'ArrowPathIcon',
    description: 'Clase programada recurrente',
    category: 'schedule_type'
  },
  SCHEDULE_INSTANT: {
    variant: 'danger',
    color: '#ef4444',
    label: 'Instantánea',
    icon: '⚡',
    heroicon: 'BoltIcon',
    description: 'Clase iniciada al momento',
    category: 'schedule_type'
  },
  SCHEDULE_ONETIME: {
    variant: 'primary',
    color: '#5b8fa3',
    label: 'Única',
    icon: '📌',
    heroicon: 'MapPinIcon',
    description: 'Clase programada única',
    category: 'schedule_type'
  },

  // ========================================
  // ESTADOS DE INSCRIPCIÓN
  // ========================================
  ENROLLMENT_ACTIVE: {
    variant: 'success',
    color: '#10b981',
    label: 'Activa',
    icon: '✅',
    heroicon: 'CheckCircleIcon',
    description: 'Inscripción activa',
    category: 'enrollment_status'
  },
  ENROLLMENT_PAUSED: {
    variant: 'warning',
    color: '#f59e0b',
    label: 'Pausada',
    icon: '⏸️',
    heroicon: 'PauseCircleIcon',
    description: 'Inscripción en pausa',
    category: 'enrollment_status'
  },
  ENROLLMENT_CANCELLED: {
    variant: 'danger',
    color: '#ef4444',
    label: 'Cancelada',
    icon: '❌',
    heroicon: 'XCircleIcon',
    description: 'Inscripción cancelada',
    category: 'enrollment_status'
  },
  ENROLLMENT_COMPLETED: {
    variant: 'info',
    color: '#06b6d4',
    label: 'Completada',
    icon: '🎓',
    heroicon: 'AcademicCapIcon',
    description: 'Curso completado',
    category: 'enrollment_status'
  },
  ENROLLMENT_EXPIRED: {
    variant: 'default',
    color: '#71717a',
    label: 'Expirada',
    icon: '⏰',
    heroicon: 'ClockIcon',
    description: 'Inscripción expirada',
    category: 'enrollment_status'
  },
};

// ============================================
// MAPEO EMOJI → HEROICONS
// ============================================

/**
 * Mapeo de iconos emoji a sus equivalentes Heroicons (outline)
 * Los badges pueden usar emoji (multicolor) o heroicon (monocromático)
 */
export const EMOJI_TO_HEROICON = {
  '📚': 'BookOpenIcon',
  '📝': 'DocumentTextIcon',
  '📖': 'NewspaperIcon',
  '🎥': 'VideoCameraIcon',
  '🔗': 'LinkIcon',
  '✏️': 'PencilIcon',
  '🎮': 'PuzzlePieceIcon',
  '☑️': 'CheckCircleIcon',
  '🔢': 'ListBulletIcon',
  '✓✗': 'HandThumbUpIcon',
  '✍️': 'PencilSquareIcon',
  '📄': 'DocumentIcon',
  '🎧': 'MusicalNoteIcon',
  '🟢': 'SignalIcon',
  '🟡': 'SignalIcon',
  '🔴': 'SignalIcon',
  '🌱': 'SparklesIcon',
  '🌿': 'SparklesIcon',
  '🌾': 'SparklesIcon',
  '🌻': 'StarIcon',
  '🌳': 'FireIcon',
  '🏆': 'TrophyIcon',
  '👀': 'EyeIcon',
  '✅': 'CheckBadgeIcon',
  '📦': 'ArchiveBoxIcon',
  '💬': 'ChatBubbleLeftRightIcon',
  '🗣️': 'SpeakerWaveIcon',
  '🔊': 'SpeakerWaveIcon',
  '🤖': 'CpuChipIcon',
  '👑': 'ShieldCheckIcon',
  '👨‍🏫': 'AcademicCapIcon',
  '🎓': 'AcademicCapIcon',
  '👂': 'EarIcon',
  '🔬': 'BeakerIcon',
  '🌍': 'GlobeAltIcon',
  // Nuevos iconos para categorías adicionales
  '📅': 'CalendarIcon',
  '⏸️': 'PauseCircleIcon',
  '⚪': 'MinusCircleIcon',
  '🚫': 'NoSymbolIcon',
  '📹': 'VideoCameraIcon',
  '🎦': 'VideoCameraIcon',
  '💻': 'ComputerDesktopIcon',
  '🎬': 'FilmIcon',
  '🔄': 'ArrowPathIcon',
  '⚡': 'BoltIcon',
  '📌': 'MapPinIcon',
  '❌': 'XCircleIcon',
  '⏰': 'ClockIcon',
};

// ============================================
// HEROICONS DISPONIBLES PARA PICKER
// ============================================

/**
 * Lista curada de Heroicons más comunes para el picker
 * Organizados por categorías para mejor UX
 */
export const AVAILABLE_HEROICONS = {
  education: {
    label: 'Educación',
    icons: [
      { name: 'AcademicCapIcon', label: 'Graduación' },
      { name: 'BookOpenIcon', label: 'Libro Abierto' },
      { name: 'NewspaperIcon', label: 'Documento' },
      { name: 'DocumentTextIcon', label: 'Texto' },
      { name: 'PencilIcon', label: 'Lápiz' },
      { name: 'PencilSquareIcon', label: 'Escribir' },
      { name: 'LanguageIcon', label: 'Idioma' },
      { name: 'ChatBubbleLeftRightIcon', label: 'Conversación' },
    ]
  },
  media: {
    label: 'Multimedia',
    icons: [
      { name: 'VideoCameraIcon', label: 'Video' },
      { name: 'MusicalNoteIcon', label: 'Audio' },
      { name: 'SpeakerWaveIcon', label: 'Sonido' },
      { name: 'MicrophoneIcon', label: 'Micrófono' },
      { name: 'PhotoIcon', label: 'Imagen' },
      { name: 'FilmIcon', label: 'Película' },
    ]
  },
  actions: {
    label: 'Acciones',
    icons: [
      { name: 'CheckCircleIcon', label: 'Check' },
      { name: 'CheckBadgeIcon', label: 'Verificado' },
      { name: 'XCircleIcon', label: 'Cerrar' },
      { name: 'PlayIcon', label: 'Play' },
      { name: 'PauseIcon', label: 'Pausa' },
      { name: 'ArrowPathIcon', label: 'Refrescar' },
      { name: 'PlusCircleIcon', label: 'Agregar' },
      { name: 'MinusCircleIcon', label: 'Quitar' },
    ]
  },
  interface: {
    label: 'Interfaz',
    icons: [
      { name: 'StarIcon', label: 'Estrella' },
      { name: 'HeartIcon', label: 'Corazón' },
      { name: 'FireIcon', label: 'Fuego' },
      { name: 'SparklesIcon', label: 'Brillo' },
      { name: 'TrophyIcon', label: 'Trofeo' },
      { name: 'BoltIcon', label: 'Rayo' },
      { name: 'LightBulbIcon', label: 'Idea' },
      { name: 'FlagIcon', label: 'Bandera' },
    ]
  },
  status: {
    label: 'Estados',
    icons: [
      { name: 'SignalIcon', label: 'Nivel' },
      { name: 'ClockIcon', label: 'Tiempo' },
      { name: 'EyeIcon', label: 'Ver' },
      { name: 'EyeSlashIcon', label: 'Oculto' },
      { name: 'LockClosedIcon', label: 'Bloqueado' },
      { name: 'LockOpenIcon', label: 'Desbloqueado' },
      { name: 'ArchiveBoxIcon', label: 'Archivado' },
      { name: 'InboxIcon', label: 'Inbox' },
    ]
  },
  system: {
    label: 'Sistema',
    icons: [
      { name: 'CpuChipIcon', label: 'IA/Tech' },
      { name: 'BeakerIcon', label: 'Prueba' },
      { name: 'ShieldCheckIcon', label: 'Admin' },
      { name: 'UserIcon', label: 'Usuario' },
      { name: 'UsersIcon', label: 'Grupo' },
      { name: 'Cog6ToothIcon', label: 'Config' },
      { name: 'WrenchIcon', label: 'Herramienta' },
      { name: 'LinkIcon', label: 'Enlace' },
    ]
  },
  misc: {
    label: 'Otros',
    icons: [
      { name: 'GlobeAltIcon', label: 'Mundo' },
      { name: 'MapPinIcon', label: 'Ubicación' },
      { name: 'CalendarIcon', label: 'Calendario' },
      { name: 'TagIcon', label: 'Etiqueta' },
      { name: 'FolderIcon', label: 'Carpeta' },
      { name: 'ChartBarIcon', label: 'Gráfico' },
      { name: 'PuzzlePieceIcon', label: 'Puzzle' },
      { name: 'ListBulletIcon', label: 'Lista' },
    ]
  },
};

// ============================================
// CONFIGURACIÓN GLOBAL DE ICONOS
// ============================================

/**
 * Storage key para la configuración de librería de iconos
 */
export const ICON_LIBRARY_STORAGE_KEY = 'xiwen_icon_library_config';

/**
 * Paletas monocromáticas disponibles
 */
export const MONOCHROME_PALETTES = {
  vibrant: {
    label: 'Vibrante',
    description: 'Usa el color del badge',
    icon: '🔥',
    getValue: (badgeColor) => badgeColor,
  },
  neutral: {
    label: 'Neutra',
    description: 'Escala de grises',
    icon: '🌫️',
    getValue: () => '#71717a',
  },
  dark: {
    label: 'Oscura',
    description: 'Tonos oscuros',
    icon: '🌙',
    getValue: () => '#27272a',
  },
  light: {
    label: 'Clara',
    description: 'Tonos claros',
    icon: '☀️',
    getValue: () => '#e4e4e7',
  },
  custom: {
    label: 'Personalizada',
    description: 'Color personalizado',
    icon: '🎨',
    getValue: (badgeColor, customColor) => customColor || badgeColor,
  },
};

/**
 * Paletas globales de colores para badges
 */
export const COLOR_PALETTES = {
  default: {
    label: 'Por Defecto',
    description: 'Colores originales del sistema',
    icon: '🎨',
  },
  material: {
    label: 'Material Design',
    description: 'Paleta Google Material',
    icon: '📱',
    colors: {
      primary: '#2196F3',
      success: '#4CAF50',
      warning: '#FF9800',
      danger: '#F44336',
      info: '#9C27B0',
      default: '#9E9E9E',
    },
  },
  pastel: {
    label: 'Pastel',
    description: 'Tonos suaves y claros',
    icon: '🧁',
    colors: {
      primary: '#93C5FD',
      success: '#86EFAC',
      warning: '#FDE68A',
      danger: '#FCA5A5',
      info: '#C4B5FD',
      default: '#D4D4D8',
    },
  },
  neon: {
    label: 'Neón',
    description: 'Colores brillantes intensos',
    icon: '⚡',
    colors: {
      primary: '#00F0FF',
      success: '#39FF14',
      warning: '#FFD700',
      danger: '#FF073A',
      info: '#BF00FF',
      default: '#808080',
    },
  },
  flat: {
    label: 'Flat UI',
    description: 'Paleta Flat Design',
    icon: '📦',
    colors: {
      primary: '#3498db',
      success: '#2ecc71',
      warning: '#f39c12',
      danger: '#e74c3c',
      info: '#9b59b6',
      default: '#95a5a6',
    },
  },
  grayscale: {
    label: 'Escala de Grises',
    description: 'Tonos monocromáticos neutros',
    icon: '🌫️',
    colors: {
      primary: '#52525b',
      success: '#71717a',
      warning: '#a1a1aa',
      danger: '#3f3f46',
      info: '#71717a',
      default: '#a1a1aa',
    },
  },
  monochrome: {
    label: 'Monocromática',
    description: 'Un solo color para todos',
    icon: '🎨',
    isCustom: true, // Indica que requiere un color personalizado
  },
};

/**
 * Configuración por defecto de librería de iconos
 */
export const DEFAULT_ICON_LIBRARY_CONFIG = {
  library: 'emoji', // 'emoji' | 'heroicon' | 'heroicon-filled' | 'lucide' | 'none'
  monochromePalette: 'vibrant', // 'vibrant' | 'neutral' | 'dark' | 'light' | 'custom'
  monochromeColor: null, // Color custom para paleta 'custom'
};

/**
 * Configuración global de badges (tamaño, bordes, etc.)
 */
export const GLOBAL_BADGE_STORAGE_KEY = 'xiwen_global_badge_config';

export const DEFAULT_GLOBAL_BADGE_CONFIG = {
  size: 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  borderRadius: 'rounded', // 'sharp' | 'rounded' | 'pill'
  fontWeight: 'medium', // 'normal' | 'medium' | 'semibold' | 'bold'
  spacing: 'normal', // 'compact' | 'normal' | 'relaxed'
  defaultBadgeStyle: 'solid', // 'solid' | 'outline' | 'soft' | 'glass' | 'gradient'
  colorPalette: 'default', // 'default' | 'material' | 'pastel' | 'neon' | 'flat' | 'grayscale' | 'monochrome'
  monochromeColor: '#5b8fa3', // Color para paleta monocromática
  textColor: 'auto', // 'auto' (contraste automático) | hex color (ej: '#ffffff')
};

/**
 * Obtiene la configuración global de badges
 */
export function getGlobalBadgeConfig() {
  const saved = localStorage.getItem(GLOBAL_BADGE_STORAGE_KEY);
  if (saved) {
    try {
      return { ...DEFAULT_GLOBAL_BADGE_CONFIG, ...JSON.parse(saved) };
    } catch (err) {
      console.error('Error loading global badge config:', err);
      return DEFAULT_GLOBAL_BADGE_CONFIG;
    }
  }
  return DEFAULT_GLOBAL_BADGE_CONFIG;
}

/**
 * Guarda la configuración global de badges
 */
export function saveGlobalBadgeConfig(config) {
  try {
    localStorage.setItem(GLOBAL_BADGE_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('globalBadgeConfigChange', { detail: config }));
    return true;
  } catch (err) {
    console.error('Error saving global badge config:', err);
    return false;
  }
}

/**
 * Obtiene la configuración actual de librería de iconos
 */
export function getIconLibraryConfig() {
  const saved = localStorage.getItem(ICON_LIBRARY_STORAGE_KEY);
  if (saved) {
    try {
      return { ...DEFAULT_ICON_LIBRARY_CONFIG, ...JSON.parse(saved) };
    } catch (err) {
      console.error('Error loading icon library config:', err);
      return DEFAULT_ICON_LIBRARY_CONFIG;
    }
  }
  return DEFAULT_ICON_LIBRARY_CONFIG;
}

/**
 * Guarda la configuración de librería de iconos
 */
export function saveIconLibraryConfig(config) {
  try {
    localStorage.setItem(ICON_LIBRARY_STORAGE_KEY, JSON.stringify(config));
    // Disparar evento personalizado para notificar cambios
    window.dispatchEvent(new CustomEvent('iconLibraryChange', { detail: config }));
    return true;
  } catch (err) {
    console.error('Error saving icon library config:', err);
    return false;
  }
}

/**
 * Restaura la configuración de librería de iconos por defecto
 */
export function resetIconLibraryConfig() {
  localStorage.removeItem(ICON_LIBRARY_STORAGE_KEY);
  return DEFAULT_ICON_LIBRARY_CONFIG;
}

/**
 * Obtiene las clases CSS para el tamaño de badge configurado globalmente
 * @param {string} size - Tamaño del badge ('xs' | 'sm' | 'md' | 'lg' | 'xl') o undefined para usar config global
 * @returns {string} - Clases Tailwind para padding y texto
 */
export function getBadgeSizeClasses(size) {
  const globalConfig = getGlobalBadgeConfig();
  const effectiveSize = size || globalConfig.size;

  const sizeMap = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-3.5 py-2 text-sm',
    xl: 'px-4 py-2.5 text-base'
  };

  return sizeMap[effectiveSize] || sizeMap.md;
}

/**
 * Obtiene el tamaño del icono según el tamaño de badge configurado globalmente
 * @param {string} size - Tamaño del badge o undefined para usar config global
 * @returns {number} - Tamaño del icono en píxeles
 */
export function getBadgeIconSize(size) {
  const globalConfig = getGlobalBadgeConfig();
  const effectiveSize = size || globalConfig.size;

  const sizeMap = {
    xs: 12,
    sm: 13,
    md: 14,
    lg: 16,
    xl: 18
  };

  return sizeMap[effectiveSize] || sizeMap.md;
}

/**
 * Obtiene el color de texto según la configuración global
 * Si textColor es 'auto', calcula contraste automático
 * Si es un color hex, usa ese color
 * @param {string} backgroundColor - Color de fondo del badge en formato hex
 * @param {string} style - Estilo del badge (solid, outline, etc.)
 * @returns {string} - Color de texto en formato hex
 */
export function getBadgeTextColor(backgroundColor, style) {
  const globalConfig = getGlobalBadgeConfig();
  const effectiveStyle = style || globalConfig.defaultBadgeStyle || 'solid';

  // Para outline, el texto usa el color de fondo
  if (effectiveStyle === 'outline') {
    return backgroundColor;
  }

  // Si hay un color personalizado configurado (no 'auto'), usarlo
  if (globalConfig.textColor && globalConfig.textColor !== 'auto') {
    return globalConfig.textColor;
  }

  // Si es 'auto' o no está definido, calcular contraste automático
  return getContrastText(backgroundColor);
}

/**
 * Obtiene los estilos CSS inline para el badge según el estilo configurado
 * @param {string} backgroundColor - Color de fondo en formato hex
 * @param {string} style - Estilo del badge o undefined para usar config global
 * @returns {Object} - Objeto con propiedades CSS para aplicar con style={{...}}
 */
export function getBadgeStyles(backgroundColor, style) {
  const globalConfig = getGlobalBadgeConfig();
  const effectiveStyle = style || globalConfig.defaultBadgeStyle || 'solid';
  const textColor = getBadgeTextColor(backgroundColor, effectiveStyle);

  const styles = {
    color: textColor
  };

  switch (effectiveStyle) {
    case 'solid':
      styles.backgroundColor = backgroundColor;
      break;

    case 'outline':
      styles.backgroundColor = 'transparent';
      styles.border = `2px solid ${backgroundColor}`;
      styles.color = backgroundColor;
      break;

    case 'soft':
      // Fondo semi-transparente con el color
      styles.backgroundColor = `${backgroundColor}20`; // 20 = ~12% opacity en hex
      styles.color = backgroundColor;
      break;

    case 'glass':
      // Efecto glassmorphism
      styles.backgroundColor = `${backgroundColor}30`; // 30 = ~19% opacity
      styles.backdropFilter = 'blur(10px)';
      styles.border = `1px solid ${backgroundColor}40`;
      styles.color = textColor;
      break;

    case 'gradient':
      // Gradiente sutil
      const lighterColor = lightenColor(backgroundColor, 20);
      styles.backgroundImage = `linear-gradient(135deg, ${backgroundColor} 0%, ${lighterColor} 100%)`;
      styles.color = textColor;
      break;

    default:
      styles.backgroundColor = backgroundColor;
  }

  return styles;
}

/**
 * Aclara un color hex por un porcentaje
 * @param {string} hex - Color en formato hex
 * @param {number} percent - Porcentaje a aclarar (0-100)
 * @returns {string} - Color aclarado en formato hex
 */
function lightenColor(hex, percent) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  const rgb = {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };

  const amount = Math.round(2.55 * percent);
  const r = Math.min(255, rgb.r + amount);
  const g = Math.min(255, rgb.g + amount);
  const b = Math.min(255, rgb.b + amount);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// ============================================
// CATEGORÍAS ORGANIZADAS
// ============================================

export const BADGE_CATEGORIES = {
  contentType: {
    label: 'Tipos de Contenido',
    description: 'Clasificación principal del contenido educativo',
    icon: '📚',
    allowCustom: true,
    systemCategory: true, // Indica que es una categoría del sistema
    warning: 'Esta es una categoría del sistema. Los badges custom no afectarán la lógica interna de la aplicación (ej: crear un curso seguirá usando los badges predefinidos).',
  },
  exerciseType: {
    label: 'Tipos de Ejercicio',
    description: 'Modalidades de práctica y evaluación',
    icon: '✏️',
    allowCustom: true,
    systemCategory: true,
    warning: 'Los badges custom en esta categoría son solo visuales. Los ejercicios del sistema usarán los tipos predefinidos.',
  },
  difficulty: {
    label: 'Niveles de Dificultad',
    description: 'Grado de complejidad del contenido',
    icon: '📊',
    allowCustom: true,
  },
  cefr: {
    label: 'Niveles CEFR',
    description: 'Marco Común Europeo de Referencia',
    icon: '🇪🇺',
    allowCustom: true,
    systemCategory: true,
    warning: 'Los niveles CEFR son estándares internacionales. Los badges custom no modificarán el sistema de evaluación oficial.',
  },
  status: {
    label: 'Estados de Contenido',
    description: 'Ciclo de vida del contenido',
    icon: '🔄',
    allowCustom: true,
    systemCategory: true,
    warning: 'Los estados del sistema (Borrador, Publicado, etc.) son fijos. Los badges custom son solo para uso decorativo.',
  },
  theme: {
    label: 'Categorías Temáticas',
    description: 'Áreas de conocimiento lingüístico',
    icon: '🎯',
    allowCustom: true,
  },
  feature: {
    label: 'Características',
    description: 'Atributos especiales del contenido',
    icon: '⭐',
    allowCustom: true,
  },
  role: {
    label: 'Roles de Usuario',
    description: 'Perfiles y permisos en el sistema',
    icon: '👥',
    allowCustom: true,
    systemCategory: true,
    warning: 'Los roles del sistema (Admin, Profesor, Alumno) son fijos y controlan permisos. Los badges custom son solo visuales.',
  },
  homework_status: {
    label: 'Estados de Corrección',
    description: 'Estados del sistema de revisión de tareas',
    icon: '📋',
    allowCustom: true,
    systemCategory: true,
    warning: 'Los estados del sistema de corrección son funcionales. Los badges custom son solo para personalización visual.',
  },
  credits: {
    label: 'Sistema de Créditos',
    description: 'Créditos disponibles para asistir a clases',
    icon: '💰',
    allowCustom: true,
    systemCategory: true,
    warning: 'El sistema de créditos es funcional y controla el acceso a clases. Este badge muestra los créditos disponibles del estudiante.',
  },
  gamification: {
    label: 'Gamificación',
    description: 'Elementos de progreso y logros del estudiante',
    icon: '🎮',
    allowCustom: true,
    systemCategory: true,
    warning: 'Los elementos de gamificación son dinámicos y se calculan automáticamente.',
  },
  session_status: {
    label: 'Estados de Sesión',
    description: 'Estados de las clases en vivo',
    icon: '📅',
    allowCustom: true,
    systemCategory: true,
    warning: 'Los estados de sesión son funcionales y controlan el flujo de las clases en vivo.',
  },
  user_status: {
    label: 'Estados de Usuario',
    description: 'Estados de actividad y conexión de usuarios',
    icon: '👤',
    allowCustom: true,
    systemCategory: true,
    warning: 'Los estados de usuario son funcionales.',
  },
  video_provider: {
    label: 'Proveedores de Video',
    description: 'Plataformas de videoconferencia',
    icon: '📹',
    allowCustom: true,
    systemCategory: true,
    warning: 'Los proveedores son fijos y determinan la integración de video.',
  },
  schedule_type: {
    label: 'Tipos de Programación',
    description: 'Modalidades de programación de clases',
    icon: '🔄',
    allowCustom: true,
    systemCategory: true,
    warning: 'Los tipos de programación son funcionales.',
  },
  enrollment_status: {
    label: 'Estados de Inscripción',
    description: 'Estados del ciclo de vida de inscripciones',
    icon: '📋',
    allowCustom: true,
    systemCategory: true,
    warning: 'Los estados de inscripción controlan acceso a cursos.',
  },
};

// ============================================
// MAPEO AUTOMÁTICO
// ============================================

/**
 * Mapeo de valores del sistema a claves de badges
 */
export const BADGE_MAPPINGS = {
  // Tipo de contenido → Badge key
  contentType: {
    'course': 'CONTENT_COURSE',
    'lesson': 'CONTENT_LESSON',
    'reading': 'CONTENT_READING',
    'video': 'CONTENT_VIDEO',
    'link': 'CONTENT_LINK',
    'exercise': 'CONTENT_EXERCISE',
    'live-game': 'CONTENT_LIVEGAME',
  },

  // Tipo de ejercicio → Badge key
  exerciseType: {
    'multiple-choice': 'EXERCISE_MULTIPLE_CHOICE',
    'fill-blank': 'EXERCISE_FILL_BLANK',
    'matching': 'EXERCISE_MATCHING',
    'ordering': 'EXERCISE_ORDERING',
    'true-false': 'EXERCISE_TRUE_FALSE',
    'short-answer': 'EXERCISE_SHORT_ANSWER',
    'essay': 'EXERCISE_ESSAY',
    'listening': 'EXERCISE_LISTENING',
    'word-highlight': 'EXERCISE_WORD_HIGHLIGHT',
    'drag-drop': 'EXERCISE_DRAG_DROP',
    'fill-blanks': 'EXERCISE_FILL_BLANKS',
    'ai_generated': 'EXERCISE_AI_GENERATED',
  },

  // Dificultad → Badge key
  difficulty: {
    'beginner': 'DIFFICULTY_BEGINNER',
    'intermediate': 'DIFFICULTY_INTERMEDIATE',
    'advanced': 'DIFFICULTY_ADVANCED',
  },

  // CEFR → Badge key
  cefr: {
    'A1': 'CEFR_A1',
    'A2': 'CEFR_A2',
    'B1': 'CEFR_B1',
    'B2': 'CEFR_B2',
    'C1': 'CEFR_C1',
    'C2': 'CEFR_C2',
  },

  // Status → Badge key
  status: {
    'draft': 'STATUS_DRAFT',
    'review': 'STATUS_REVIEW',
    'published': 'STATUS_PUBLISHED',
    'archived': 'STATUS_ARCHIVED',
  },

  // Role → Badge key
  role: {
    'admin': 'ROLE_ADMIN',
    'teacher': 'ROLE_TEACHER',
    'trial_teacher': 'ROLE_TRIAL_TEACHER',
    'student': 'ROLE_STUDENT',
    'listener': 'ROLE_LISTENER',
    'trial': 'ROLE_TRIAL',
  },

  // Homework Status → Badge key
  homework_status: {
    'pending': 'HOMEWORK_PENDING',
    'approved': 'HOMEWORK_APPROVED',
    'rejected': 'HOMEWORK_REJECTED',
    'processing': 'HOMEWORK_PROCESSING',
    'error': 'HOMEWORK_ERROR',
  },

  // Gamification → Badge key
  gamification: {
    'credits': 'GAMIFICATION_CREDITS',
    'level': 'GAMIFICATION_LEVEL',
    'xp': 'GAMIFICATION_XP',
    'streak': 'GAMIFICATION_STREAK',
  },

  // Session Status → Badge key
  session_status: {
    'scheduled': 'SESSION_SCHEDULED',
    'live': 'SESSION_LIVE',
    'ended': 'SESSION_ENDED',
    'cancelled': 'SESSION_CANCELLED',
  },

  // User Status → Badge key
  user_status: {
    'active': 'USER_ACTIVE',
    'inactive': 'USER_INACTIVE',
    'online': 'USER_ONLINE',
    'offline': 'USER_OFFLINE',
    'suspended': 'USER_SUSPENDED',
  },

  // Video Provider → Badge key
  video_provider: {
    'livekit': 'PROVIDER_LIVEKIT',
    'meet': 'PROVIDER_MEET',
    'zoom': 'PROVIDER_ZOOM',
    'voov': 'PROVIDER_VOOV',
    'external': 'PROVIDER_EXTERNAL',
  },

  // Schedule Type → Badge key
  schedule_type: {
    'recurring': 'SCHEDULE_RECURRING',
    'instant': 'SCHEDULE_INSTANT',
    'one-time': 'SCHEDULE_ONETIME',
    'onetime': 'SCHEDULE_ONETIME',
  },

  // Enrollment Status → Badge key
  enrollment_status: {
    'active': 'ENROLLMENT_ACTIVE',
    'paused': 'ENROLLMENT_PAUSED',
    'cancelled': 'ENROLLMENT_CANCELLED',
    'completed': 'ENROLLMENT_COMPLETED',
    'expired': 'ENROLLMENT_EXPIRED',
  },
};

// ============================================
// STORAGE KEY
// ============================================

export const BADGE_CONFIG_STORAGE_KEY = 'xiwen_badge_config';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Propiedades por defecto que se aplican a cada badge
 * Útil para agregar nuevas propiedades sin modificar cada badge individualmente
 */
const BADGE_DEFAULT_PROPERTIES = {
  enabled: true,         // Si false, el badge no se muestra en ningún lado
  showIcon: true,        // Si false, no se muestra el icono (solo texto)
  showBackground: true,  // Si false, el badge es transparente (solo texto coloreado)
};

/**
 * Obtiene la configuración actual de badges (defaults + customs)
 * Aplica las propiedades por defecto a cada badge
 */
export function getBadgeConfig() {
  const saved = localStorage.getItem(BADGE_CONFIG_STORAGE_KEY);
  let baseConfig = DEFAULT_BADGE_CONFIG;

  if (saved) {
    try {
      const custom = JSON.parse(saved);
      baseConfig = { ...DEFAULT_BADGE_CONFIG, ...custom };
    } catch (err) {
      console.error('Error loading badge config:', err);
    }
  }

  // Aplicar propiedades por defecto a cada badge (para retrocompatibilidad)
  const configWithDefaults = {};
  Object.entries(baseConfig).forEach(([key, badge]) => {
    configWithDefaults[key] = {
      ...BADGE_DEFAULT_PROPERTIES,
      ...badge,
    };
  });

  return configWithDefaults;
}

/**
 * Guarda la configuración de badges
 */
export function saveBadgeConfig(config) {
  try {
    localStorage.setItem(BADGE_CONFIG_STORAGE_KEY, JSON.stringify(config));
    applyBadgeColors(config);
    return true;
  } catch (err) {
    console.error('Error saving badge config:', err);
    return false;
  }
}

/**
 * Restaura la configuración por defecto
 */
export function resetBadgeConfig() {
  localStorage.removeItem(BADGE_CONFIG_STORAGE_KEY);
  applyBadgeColors(DEFAULT_BADGE_CONFIG);
}

/**
 * Obtiene la configuración de un badge específico por key
 */
export function getBadgeByKey(key) {
  const config = getBadgeConfig();
  return config[key] || null;
}

/**
 * Obtiene la configuración de badge para un tipo de contenido
 */
export function getBadgeForContentType(type) {
  const key = BADGE_MAPPINGS.contentType[type];
  return getBadgeByKey(key) || DEFAULT_BADGE_CONFIG.CONTENT_COURSE;
}

/**
 * Obtiene la configuración de badge para un tipo de ejercicio
 */
export function getBadgeForExerciseType(type) {
  const key = BADGE_MAPPINGS.exerciseType[type];
  return getBadgeByKey(key) || DEFAULT_BADGE_CONFIG.EXERCISE_MULTIPLE_CHOICE;
}

/**
 * Obtiene la configuración de badge para un nivel de dificultad
 */
export function getBadgeForDifficulty(difficulty) {
  const key = BADGE_MAPPINGS.difficulty[difficulty];
  return getBadgeByKey(key) || DEFAULT_BADGE_CONFIG.DIFFICULTY_BEGINNER;
}

/**
 * Obtiene la configuración de badge para un nivel CEFR
 */
export function getBadgeForCEFR(level) {
  const key = BADGE_MAPPINGS.cefr[level];
  return getBadgeByKey(key) || DEFAULT_BADGE_CONFIG.CEFR_A1;
}

/**
 * Obtiene la configuración de badge para un status
 */
export function getBadgeForStatus(status) {
  const key = BADGE_MAPPINGS.status[status];
  return getBadgeByKey(key) || DEFAULT_BADGE_CONFIG.STATUS_DRAFT;
}

/**
 * Obtiene la configuración de badge para un rol de usuario
 */
export function getBadgeForRole(role) {
  const key = BADGE_MAPPINGS.role[role];
  return getBadgeByKey(key) || DEFAULT_BADGE_CONFIG.ROLE_STUDENT;
}

/**
 * Obtiene la configuración de badge para un estado de corrección de tarea
 */
export function getBadgeForHomeworkStatus(status) {
  const key = BADGE_MAPPINGS.homework_status[status];
  return getBadgeByKey(key) || DEFAULT_BADGE_CONFIG.HOMEWORK_PENDING;
}

/**
 * Obtiene la configuración de badge para un elemento de gamificación
 */
export function getBadgeForGamification(type) {
  const key = BADGE_MAPPINGS.gamification[type];
  return getBadgeByKey(key) || DEFAULT_BADGE_CONFIG.GAMIFICATION_CREDITS;
}

/**
 * Obtiene la configuración de badge para un estado de sesión
 */
export function getBadgeForSessionStatus(status) {
  const key = BADGE_MAPPINGS.session_status[status];
  return getBadgeByKey(key) || DEFAULT_BADGE_CONFIG.SESSION_SCHEDULED;
}

/**
 * Obtiene la configuración de badge para un estado de usuario
 */
export function getBadgeForUserStatus(status) {
  const key = BADGE_MAPPINGS.user_status[status];
  return getBadgeByKey(key) || DEFAULT_BADGE_CONFIG.USER_ACTIVE;
}

/**
 * Obtiene la configuración de badge para un proveedor de video
 */
export function getBadgeForVideoProvider(provider) {
  const key = BADGE_MAPPINGS.video_provider[provider];
  return getBadgeByKey(key) || DEFAULT_BADGE_CONFIG.PROVIDER_EXTERNAL;
}

/**
 * Obtiene la configuración de badge para un tipo de programación
 */
export function getBadgeForScheduleType(type) {
  const key = BADGE_MAPPINGS.schedule_type[type];
  return getBadgeByKey(key) || DEFAULT_BADGE_CONFIG.SCHEDULE_ONETIME;
}

/**
 * Obtiene la configuración de badge para un estado de inscripción
 */
export function getBadgeForEnrollmentStatus(status) {
  const key = BADGE_MAPPINGS.enrollment_status[status];
  return getBadgeByKey(key) || DEFAULT_BADGE_CONFIG.ENROLLMENT_ACTIVE;
}

/**
 * Obtiene todos los badges de una categoría
 */
export function getBadgesByCategory(categoryName) {
  const config = getBadgeConfig();
  return Object.entries(config)
    .filter(([key, value]) => value.category === categoryName)
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
}

/**
 * Aplica los colores de badges como CSS variables
 */
export function applyBadgeColors(config = null) {
  const root = document.documentElement;
  const badgeConfig = config || getBadgeConfig();

  Object.entries(badgeConfig).forEach(([key, badge]) => {
    const varName = `--badge-${key.toLowerCase()}`;
    root.style.setProperty(`${varName}-bg`, badge.color);
    root.style.setProperty(`${varName}-text`, getContrastText(badge.color));
  });
}

/**
 * Calcula color de texto con buen contraste
 * @param {string} bgColor - Color de fondo en formato hexadecimal
 * @returns {string} - Color de texto (#000000 o #ffffff)
 */
export function getContrastText(bgColor) {
  const rgb = hexToRgb(bgColor);
  if (!rgb) return '#ffffff';

  // Calcular luminancia relativa (WCAG formula)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Convierte hex a RGB
 * @param {string} hex - Color en formato hexadecimal
 * @returns {Object|null} - Objeto {r, g, b} o null
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Agrega un nuevo badge custom
 */
export function addCustomBadge(category, key, config) {
  const current = getBadgeConfig();
  const newBadge = {
    ...config,
    category,
    custom: true, // Marcar como personalizado
  };

  const updated = {
    ...current,
    [key]: newBadge,
  };

  return saveBadgeConfig(updated);
}

/**
 * Elimina un badge custom
 */
export function removeCustomBadge(key) {
  const current = getBadgeConfig();
  const badge = current[key];

  // Solo permitir eliminar badges custom
  if (!badge || !badge.custom) {
    console.warn('Cannot remove system badge:', key);
    return false;
  }

  const { [key]: removed, ...remaining } = current;
  return saveBadgeConfig(remaining);
}

/**
 * Actualiza un badge existente
 */
export function updateBadge(key, updates) {
  const current = getBadgeConfig();
  const badge = current[key];

  if (!badge) {
    console.warn('Badge not found:', key);
    return false;
  }

  const updated = {
    ...current,
    [key]: {
      ...badge,
      ...updates,
    },
  };

  return saveBadgeConfig(updated);
}

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Aplica paleta de colores global a todos los badges
 * @param {string} palette - Nombre de la paleta
 * @param {Object} badgeConfig - Configuración actual de badges
 * @param {string} monochromeColor - Color personalizado para paleta monocromática
 */
export function applyColorPalette(palette, badgeConfig, monochromeColor = null) {
  if (palette === 'default') return badgeConfig;

  const paletteInfo = COLOR_PALETTES[palette];
  if (!paletteInfo) return badgeConfig;

  // PALETA MONOCROMÁTICA: Aplicar un solo color a TODOS los badges
  if (palette === 'monochrome' && monochromeColor) {
    const updated = {};
    Object.entries(badgeConfig).forEach(([key, badge]) => {
      updated[key] = {
        ...badge,
        color: monochromeColor,
      };
    });
    return updated;
  }

  // PALETAS NORMALES: Mapear variant a color de paleta
  const paletteColors = paletteInfo.colors;
  if (!paletteColors) return badgeConfig;

  const updated = {};
  Object.entries(badgeConfig).forEach(([key, badge]) => {
    // Mapear variant a color de paleta
    let newColor = badge.color;
    if (paletteColors[badge.variant]) {
      newColor = paletteColors[badge.variant];
    }

    updated[key] = {
      ...badge,
      color: newColor,
    };
  });

  return updated;
}
