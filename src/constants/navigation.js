/**
 * @fileoverview Constantes de navegación centralizadas
 * @module constants/navigation
 *
 * Define todas las rutas y acciones de navegación de la aplicación
 * para evitar strings mágicos y facilitar refactoring
 */

/**
 * Acciones de navegación para Teacher/Admin Dashboard
 * @enum {string}
 */
export const TEACHER_ACTIONS = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  COURSES: 'courses',
  CONTENT: 'content',
  EXERCISES: 'exercises',
  GROUPS: 'groups',
  CLASSES: 'classes',
  ANALYTICS: 'analytics',
  ATTENDANCE: 'attendance',
  WHITEBOARD: 'whiteboard',
  SETUP: 'setup',
  PLAY_EXERCISE: 'playExercise',
};

/**
 * Acciones de navegación para Student Dashboard
 * @enum {string}
 */
export const STUDENT_ACTIONS = {
  DASHBOARD: 'dashboard',
  COURSES: 'courses',
  ASSIGNMENTS: 'assignments',
  CLASSES: 'classes',
  COURSE_VIEWER: 'course-viewer',
  CONTENT_PLAYER: 'content-player',
};

/**
 * Rutas de la aplicación
 * @enum {string}
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  TEACHER: '/teacher',
  STUDENT: '/student',
  ADMIN: '/admin',
};

/**
 * Mapeo de acciones a componentes para Teacher Dashboard
 * Útil para debugging y documentación
 */
export const TEACHER_ACTION_COMPONENTS = {
  [TEACHER_ACTIONS.DASHBOARD]: 'DashboardStats',
  [TEACHER_ACTIONS.USERS]: 'AdminPanel / StudentManager',
  [TEACHER_ACTIONS.COURSES]: 'CoursesScreen',
  [TEACHER_ACTIONS.CONTENT]: 'ContentManager',
  [TEACHER_ACTIONS.EXERCISES]: 'ExerciseManager',
  [TEACHER_ACTIONS.GROUPS]: 'GroupManager',
  [TEACHER_ACTIONS.CLASSES]: 'ClassManager',
  [TEACHER_ACTIONS.ANALYTICS]: 'AnalyticsDashboard',
  [TEACHER_ACTIONS.ATTENDANCE]: 'AttendanceView',
  [TEACHER_ACTIONS.WHITEBOARD]: 'Whiteboard',
  [TEACHER_ACTIONS.SETUP]: 'GameContainer',
  [TEACHER_ACTIONS.PLAY_EXERCISE]: 'ExercisePlayer',
};

/**
 * Mapeo de acciones a componentes para Student Dashboard
 */
export const STUDENT_ACTION_COMPONENTS = {
  [STUDENT_ACTIONS.DASHBOARD]: 'StudentDashboard',
  [STUDENT_ACTIONS.COURSES]: 'MyCourses',
  [STUDENT_ACTIONS.ASSIGNMENTS]: 'MyAssignments',
  [STUDENT_ACTIONS.CLASSES]: 'StudentClassView',
  [STUDENT_ACTIONS.COURSE_VIEWER]: 'CourseViewer',
  [STUDENT_ACTIONS.CONTENT_PLAYER]: 'ContentPlayer',
};

/**
 * Acciones que NO usan DashboardLayout (pantalla completa)
 */
export const FULLSCREEN_ACTIONS = new Set([
  TEACHER_ACTIONS.WHITEBOARD,
  TEACHER_ACTIONS.SETUP,
  TEACHER_ACTIONS.PLAY_EXERCISE,
  STUDENT_ACTIONS.CONTENT_PLAYER,
]);

/**
 * Verifica si una acción requiere pantalla completa
 * @param {string} action - Acción a verificar
 * @returns {boolean}
 */
export function isFullscreenAction(action) {
  return FULLSCREEN_ACTIONS.has(action);
}

/**
 * Obtiene el nombre del componente para una acción
 * @param {string} action - Acción del menú
 * @param {boolean} isStudent - Si es dashboard de estudiante
 * @returns {string | undefined}
 */
export function getComponentName(action, isStudent = false) {
  const map = isStudent ? STUDENT_ACTION_COMPONENTS : TEACHER_ACTION_COMPONENTS;
  return map[action];
}
