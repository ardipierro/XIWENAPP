// ============================================
// CONFIGURACIÓN DE ROLES DEL SISTEMA
// ============================================

/**
 * Email del administrador principal
 * Este email siempre tendrá acceso de admin automáticamente
 */
export const ADMIN_EMAIL = 'ardipierro@gmail.com';

/**
 * Roles disponibles en el sistema
 * Puedes agregar más roles aquí en el futuro
 */
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  LISTENER: 'listener',
  TRIAL: 'trial',
  TRIAL_TEACHER: 'trial_teacher'
};

/**
 * Información descriptiva de cada rol
 * Útil para mostrar en el panel de administración
 */
export const ROLE_INFO = {
  [ROLES.ADMIN]: {
    name: 'Administrador',
    description: 'Acceso total al sistema, puede gestionar usuarios y roles',
    icon: '👑',
    color: '#DC2626' // rojo
  },
  [ROLES.TEACHER]: {
    name: 'Profesor',
    description: 'Puede crear juegos, gestionar alumnos y ver estadísticas',
    icon: '👨‍🏫',
    color: '#7C3AED' // morado
  },
  [ROLES.STUDENT]: {
    name: 'Alumno Regular',
    description: 'Acceso completo a juegos y progreso personal',
    icon: '👨‍🎓',
    color: '#2563EB' // azul
  },
  [ROLES.LISTENER]: {
    name: 'Oyente',
    description: 'Solo lectura, no puede participar en juegos',
    icon: '👂',
    color: '#059669' // verde
  },
  [ROLES.TRIAL]: {
    name: 'Alumno de Prueba',
    description: 'Acceso limitado temporal para pruebas',
    icon: '🎯',
    color: '#D97706' // naranja
  },
  [ROLES.TRIAL_TEACHER]: {
    name: 'Profesor de Prueba',
    description: 'Acceso limitado temporal para profesores',
    icon: '🔬',
    color: '#EC4899' // rosa
  }
};

/**
 * Roles que tienen acceso al dashboard de profesor
 */
export const TEACHER_ROLES = [ROLES.ADMIN, ROLES.TEACHER, ROLES.TRIAL_TEACHER];

/**
 * Roles que tienen acceso al dashboard de alumno
 */
export const STUDENT_ROLES = [ROLES.STUDENT, ROLES.LISTENER, ROLES.TRIAL];

/**
 * Verificar si un email es el administrador principal
 */
export const isAdminEmail = (email) => {
  return email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

/**
 * Obtener el rol por defecto para un nuevo usuario
 * (si no es el admin)
 */
export const getDefaultRole = (email) => {
  if (isAdminEmail(email)) {
    return ROLES.ADMIN;
  }
  return ROLES.STUDENT; // Por defecto, nuevos usuarios son alumnos
};

/**
 * Verificar si un rol tiene permisos de profesor
 */
export const hasTeacherAccess = (role) => {
  return TEACHER_ROLES.includes(role);
};

/**
 * Verificar si un rol tiene permisos de alumno
 */
export const hasStudentAccess = (role) => {
  return STUDENT_ROLES.includes(role);
};

/**
 * Verificar si un rol es de prueba (trial)
 */
export const isTrialRole = (role) => {
  return role === ROLES.TRIAL || role === ROLES.TRIAL_TEACHER;
};
