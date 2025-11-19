/**
 * @fileoverview Configuración centralizada de paneles/dashboards
 * Sistema de configuración visual para controlar la apariencia y estructura de cada panel
 *
 * @module config/dashboardConfig
 */

/**
 * Configuración por defecto aplicable a todos los paneles
 */
export const defaultPanelConfig = {
  // HEADER
  showTitle: true,
  title: '',
  titleSize: 'text-2xl',
  showSubtitle: false,
  subtitle: '',
  showIcon: true,
  icon: 'LayoutDashboard',
  showBreadcrumbs: false,
  showBadges: false,

  // TOOLBAR
  showToolbar: true,
  toolbarPosition: 'top',         // 'top' | 'bottom' | 'both'
  showSearch: true,
  searchPlaceholder: 'Buscar...',
  showFilters: true,
  showViewSelector: true,         // grid/list/table
  defaultView: 'grid',
  showCreateButton: false,
  createButtonText: 'Crear',
  showActions: false,
  showDatePicker: false,
  showSortBy: false,

  // CONTENT LAYOUT
  contentLayout: 'grid',          // 'grid' | 'list' | 'table' | 'custom'
  gridColumns: {
    base: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 5,
  },
  gap: 4,                         // Tailwind gap (1-12)

  // CONTAINER
  containerPadding: 6,            // Tailwind padding (0-12)
  maxWidth: '7xl',                // Tailwind max-width classes
  backgroundColor: 'var(--color-bg-primary)',

  // FOOTER
  showPagination: false,
  itemsPerPage: 20,
  showItemCount: true,
  showBulkActions: false,

  // RESPONSIVE
  hideToolbarOnMobile: false,
  stackLayoutOnMobile: true,
  compactHeaderOnMobile: true,
};

/**
 * Configuraciones específicas por panel
 * Se hace merge con defaultPanelConfig
 */
export const dashboardConfigs = {
  /**
   * UniversalDashboard - Home principal
   */
  UniversalDashboard: {
    title: 'Dashboard',
    showSubtitle: true,
    subtitle: 'Acceso rápido a todas las funciones',
    icon: 'LayoutDashboard',
    showToolbar: false,
    contentLayout: 'grid',
    gridColumns: {
      base: 1,
      sm: 2,
      md: 2,
      lg: 3,
      xl: 5,
    },
    gap: 6,
    showPagination: false,
  },

  /**
   * SettingsPanel - Configuración de cuenta
   */
  SettingsPanel: {
    title: 'Configuración',
    showSubtitle: true,
    subtitle: 'Personaliza tu cuenta y preferencias',
    icon: 'Settings',
    showToolbar: false,
    contentLayout: 'custom',
    maxWidth: '5xl',
    gap: 6,
  },

  /**
   * AnalyticsDashboard - Analytics e insights
   */
  AnalyticsDashboard: {
    title: 'Analytics',
    showSubtitle: true,
    subtitle: 'Métricas y estadísticas de uso',
    icon: 'BarChart3',
    showToolbar: true,
    showSearch: false,
    showFilters: true,
    showDatePicker: true,
    showViewSelector: false,
    contentLayout: 'grid',
    gridColumns: {
      base: 1,
      sm: 2,
      md: 2,
      lg: 4,
      xl: 4,
    },
    gap: 4,
  },

  /**
   * ProfilePanel - Perfil de usuario
   */
  ProfilePanel: {
    title: 'Mi Perfil',
    showSubtitle: false,
    icon: 'User',
    showToolbar: false,
    contentLayout: 'custom',
    maxWidth: '4xl',
    containerPadding: 8,
  },

  /**
   * CourseManager - Gestión de cursos
   */
  CourseManager: {
    title: 'Gestión de Cursos',
    showSubtitle: true,
    subtitle: 'Administra cursos y contenido educativo',
    icon: 'BookOpen',
    showToolbar: true,
    showSearch: true,
    showFilters: true,
    showViewSelector: true,
    defaultView: 'grid',
    showCreateButton: true,
    createButtonText: 'Nuevo Curso',
    contentLayout: 'grid',
    gridColumns: {
      base: 1,
      sm: 2,
      md: 2,
      lg: 3,
      xl: 4,
    },
    gap: 6,
    showPagination: true,
    showItemCount: true,
  },

  /**
   * UserManager - Gestión de usuarios
   */
  UserManager: {
    title: 'Gestión de Usuarios',
    showSubtitle: true,
    subtitle: 'Administra estudiantes, profesores y administradores',
    icon: 'Users',
    showToolbar: true,
    showSearch: true,
    searchPlaceholder: 'Buscar por nombre o email...',
    showFilters: true,
    showViewSelector: true,
    defaultView: 'grid',
    showCreateButton: true,
    createButtonText: 'Nuevo Usuario',
    showBulkActions: true,
    contentLayout: 'grid',
    gridColumns: {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
    },
    gap: 4,
    showPagination: true,
    showItemCount: true,
  },

  /**
   * AssignmentManager - Gestión de tareas
   */
  AssignmentManager: {
    title: 'Gestión de Tareas',
    showSubtitle: true,
    subtitle: 'Crea y administra tareas para los estudiantes',
    icon: 'FileText',
    showToolbar: true,
    showSearch: true,
    showFilters: true,
    showViewSelector: true,
    defaultView: 'list',
    showCreateButton: true,
    createButtonText: 'Nueva Tarea',
    showDatePicker: true,
    showSortBy: true,
    contentLayout: 'list',
    gap: 3,
    showPagination: true,
    showItemCount: true,
  },

  /**
   * ClassSessionManager - Gestión de clases
   */
  ClassSessionManager: {
    title: 'Gestión de Clases',
    showSubtitle: true,
    subtitle: 'Administra sesiones de clase y horarios',
    icon: 'Calendar',
    showToolbar: true,
    showSearch: true,
    showFilters: true,
    showViewSelector: true,
    defaultView: 'grid',
    showCreateButton: true,
    createButtonText: 'Nueva Clase',
    showDatePicker: true,
    contentLayout: 'grid',
    gridColumns: {
      base: 1,
      sm: 1,
      md: 2,
      lg: 3,
      xl: 4,
    },
    gap: 4,
    showPagination: true,
  },

  /**
   * StudentAssignmentsView - Vista de tareas del estudiante
   */
  StudentAssignmentsView: {
    title: 'Mis Tareas',
    showSubtitle: true,
    subtitle: 'Visualiza y completa tus tareas asignadas',
    icon: 'CheckSquare',
    showToolbar: true,
    showSearch: true,
    searchPlaceholder: 'Buscar tareas...',
    showFilters: true,
    showViewSelector: true,
    defaultView: 'list',
    showDatePicker: false,
    showSortBy: true,
    contentLayout: 'list',
    gap: 3,
    showItemCount: true,
  },

  /**
   * MessagesPanel - Sistema de mensajería
   */
  MessagesPanel: {
    title: 'Mensajes',
    showSubtitle: false,
    icon: 'MessageSquare',
    showToolbar: true,
    showSearch: true,
    searchPlaceholder: 'Buscar conversaciones...',
    showFilters: true,
    showViewSelector: false,
    contentLayout: 'list',
    gap: 2,
    maxWidth: '6xl',
  },

  /**
   * GamificationPanel - Sistema de gamificación
   */
  GamificationPanel: {
    title: 'Gamificación',
    showSubtitle: true,
    subtitle: 'Logros, badges y rankings',
    icon: 'Trophy',
    showToolbar: true,
    showFilters: true,
    showViewSelector: true,
    defaultView: 'grid',
    contentLayout: 'grid',
    gridColumns: {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
    },
    gap: 4,
  },

  /**
   * AdminPaymentsPanel - Gestión de pagos
   */
  AdminPaymentsPanel: {
    title: 'Gestión de Pagos',
    showSubtitle: true,
    subtitle: 'Administra créditos y transacciones',
    icon: 'DollarSign',
    showToolbar: true,
    showSearch: true,
    searchPlaceholder: 'Buscar transacciones...',
    showFilters: true,
    showDatePicker: true,
    showViewSelector: true,
    defaultView: 'table',
    contentLayout: 'table',
    showPagination: true,
    showItemCount: true,
  },

  /**
   * FlashCardStatsPanel - Estadísticas de flashcards
   */
  FlashCardStatsPanel: {
    title: 'Estadísticas de Flashcards',
    showSubtitle: true,
    subtitle: 'Progreso y métricas de aprendizaje',
    icon: 'Brain',
    showToolbar: true,
    showFilters: true,
    showDatePicker: true,
    contentLayout: 'grid',
    gridColumns: {
      base: 1,
      sm: 2,
      md: 2,
      lg: 4,
      xl: 4,
    },
    gap: 4,
  },
};

/**
 * Helper: Obtener configuración completa de un panel
 * Hace merge de defaultPanelConfig con config específica
 *
 * @param {string} panelId - ID del panel
 * @returns {object} Configuración completa del panel
 */
export function getPanelConfig(panelId) {
  const specificConfig = dashboardConfigs[panelId] || {};
  return {
    ...defaultPanelConfig,
    ...specificConfig,
  };
}

/**
 * Helper: Generar clases de grid responsive
 *
 * @param {object} gridColumns - Objeto con breakpoints
 * @returns {string} Clases de Tailwind para grid
 */
export function getGridClasses(gridColumns) {
  const { base, sm, md, lg, xl } = gridColumns;
  return [
    `grid-cols-${base}`,
    sm && `sm:grid-cols-${sm}`,
    md && `md:grid-cols-${md}`,
    lg && `lg:grid-cols-${lg}`,
    xl && `xl:grid-cols-${xl}`,
  ].filter(Boolean).join(' ');
}

/**
 * Helper: Generar clases de container
 *
 * @param {object} config - Configuración del panel
 * @returns {string} Clases de Tailwind para container
 */
export function getContainerClasses(config) {
  return [
    `p-${config.containerPadding}`,
    `max-w-${config.maxWidth}`,
    'mx-auto',
  ].join(' ');
}

/**
 * Helper: Lista de todos los paneles disponibles
 */
export const availablePanels = Object.keys(dashboardConfigs).map(id => ({
  id,
  label: dashboardConfigs[id].title || id,
  icon: dashboardConfigs[id].icon,
}));

export default {
  dashboardConfigs,
  defaultPanelConfig,
  getPanelConfig,
  getGridClasses,
  getContainerClasses,
  availablePanels,
};
