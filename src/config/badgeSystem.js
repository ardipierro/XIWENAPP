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
 * Estructura: { key: { variant, color, label, icon?, description? } }
 */
export const DEFAULT_BADGE_CONFIG = {
  // ========================================
  // TIPOS DE CONTENIDO
  // ========================================
  CONTENT_COURSE: {
    variant: 'primary',
    color: '#3b82f6',
    label: 'Curso',
    icon: '📚',
    heroicon: 'BookOpenIcon',
    description: 'Contenedor de lecciones y ejercicios',
    category: 'contentType'
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
    color: '#8b5cf6',
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
    color: '#3b82f6',
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
    color: '#8b5cf6',
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
    color: '#3b82f6',
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
    color: '#3b82f6',
    label: 'Vocabulario',
    icon: '📚',
    heroicon: 'BookOpenIcon',
    description: 'Palabras y expresiones',
    category: 'theme'
  },
  THEME_GRAMMAR: {
    variant: 'info',
    color: '#8b5cf6',
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
    color: '#3b82f6',
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
    color: '#8b5cf6',
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
    color: '#8b5cf6',
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
    color: '#3b82f6',
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
 * Configuración por defecto de librería de iconos
 */
export const DEFAULT_ICON_LIBRARY_CONFIG = {
  library: 'emoji', // 'emoji' | 'heroicon' | 'none'
  monochromeColor: null, // null = usar color del badge, o '#000000', '#ffffff', etc.
};

/**
 * Obtiene la configuración actual de librería de iconos
 */
export function getIconLibraryConfig() {
  const saved = localStorage.getItem(ICON_LIBRARY_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
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
};

// ============================================
// STORAGE KEY
// ============================================

export const BADGE_CONFIG_STORAGE_KEY = 'xiwen_badge_config';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtiene la configuración actual de badges (defaults + customs)
 */
export function getBadgeConfig() {
  const saved = localStorage.getItem(BADGE_CONFIG_STORAGE_KEY);
  if (saved) {
    try {
      const custom = JSON.parse(saved);
      return { ...DEFAULT_BADGE_CONFIG, ...custom };
    } catch (err) {
      console.error('Error loading badge config:', err);
      return DEFAULT_BADGE_CONFIG;
    }
  }
  return DEFAULT_BADGE_CONFIG;
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
 */
function getContrastText(bgColor) {
  const rgb = hexToRgb(bgColor);
  if (!rgb) return '#ffffff';

  // Calcular luminancia relativa (WCAG formula)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Convierte hex a RGB
 */
function hexToRgb(hex) {
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
 * Inicializa el sistema de badges al cargar la app
 * Aplica los colores guardados o los defaults
 */
export function initBadgeSystem() {
  applyBadgeColors();
}
