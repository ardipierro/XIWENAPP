// ============================================
// CONFIGURACIÓN DE ROLES DEL SISTEMA
// ============================================

/**
 * Email del administrador principal
 * Este email siempre tendrá acceso de admin automáticamente
 * Se configura a través de la variable de entorno VITE_ADMIN_EMAIL
 */
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'ardipierro@gmail.com';

/**
 * Roles disponibles en el sistema
 * Puedes agregar más roles aquí en el futuro
 */
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  GUARDIAN: 'guardian',      // Padre/Tutor/Encargado
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
    icon: 'Crown',
    emoji: '👑',
    color: '#ef4444' // rojo
  },
  [ROLES.TEACHER]: {
    name: 'Profesor',
    description: 'Puede crear juegos, gestionar alumnos y ver estadísticas',
    icon: 'UserCog',
    emoji: '👨‍🏫',
    color: '#a1a1aa' // gris
  },
  [ROLES.STUDENT]: {
    name: 'Alumno',
    description: 'Acceso completo a juegos y progreso personal',
    icon: 'GraduationCap',
    emoji: '🎓',
    color: '#71717a' // gris oscuro
  },
  [ROLES.GUARDIAN]: {
    name: 'Padre/Tutor',
    description: 'Puede ver el desempeño de estudiantes vinculados',
    icon: 'Users',
    emoji: '👨‍👩‍👧',
    color: '#10b981' // verde
  },
  [ROLES.LISTENER]: {
    name: 'Oyente',
    description: 'Solo lectura, no puede participar en juegos',
    icon: 'Ear',
    emoji: '👂',
    color: '#10b981' // verde
  },
  [ROLES.TRIAL]: {
    name: 'Alumno de Prueba',
    description: 'Acceso limitado temporal para pruebas',
    icon: 'Target',
    emoji: '🎯',
    color: '#f59e0b' // naranja
  },
  [ROLES.TRIAL_TEACHER]: {
    name: 'Profesor de Prueba',
    description: 'Acceso limitado temporal para profesores',
    icon: 'FlaskConical',
    emoji: '🧪',
    color: '#d1d5db' // gris claro
  }
};

/**
 * Roles que tienen acceso al dashboard de administrador
 */
export const ADMIN_ROLES = [ROLES.ADMIN];

/**
 * Roles que tienen acceso al dashboard de profesor
 */
export const TEACHER_ROLES = [ROLES.ADMIN, ROLES.TEACHER, ROLES.TRIAL_TEACHER];

/**
 * Roles que tienen acceso al dashboard de alumno
 */
export const STUDENT_ROLES = [ROLES.STUDENT, ROLES.LISTENER, ROLES.TRIAL];

/**
 * Roles que tienen acceso al dashboard de tutor/encargado
 */
export const GUARDIAN_ROLES = [ROLES.GUARDIAN];

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
