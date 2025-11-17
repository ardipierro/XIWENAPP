/**
 * @fileoverview Sistema de permisos centralizado
 * Define todos los permisos disponibles y qué roles pueden acceder
 * @module config/permissions
 */

// ============================================
// DEFINICIÓN DE PERMISOS
// ============================================

export const PERMISSIONS = {
  // ==================== CREDIT MANAGEMENT ====================
  'view-own-credits': ['admin', 'teacher', 'trial_teacher', 'guest_teacher', 'student', 'trial', 'listener', 'guardian'],
  'view-all-credits': ['admin'],
  'add-credits': ['admin'],
  'deduct-credits': ['admin'],
  'manage-credits': ['admin'],
  'bypass-credit-check': ['admin'],
  'view-credit-analytics': ['admin'],

  // ==================== USER MANAGEMENT ====================
  'view-all-users': ['admin'],
  'create-users': ['admin'],
  'edit-user-roles': ['admin'],
  'delete-users': ['admin'],
  'view-user-details': ['admin', 'teacher'],

  // ==================== STUDENT MANAGEMENT ====================
  'view-own-students': ['admin', 'teacher', 'trial_teacher', 'guest_teacher'],
  'view-all-students': ['admin'],
  'edit-students': ['admin', 'teacher'],
  'assign-students': ['admin', 'teacher'],

  // ==================== CONTENT MANAGEMENT ====================
  'create-content': ['admin', 'teacher', 'trial_teacher', 'guest_teacher'],
  'edit-own-content': ['admin', 'teacher', 'trial_teacher', 'guest_teacher'],
  'edit-all-content': ['admin'],
  'delete-own-content': ['admin', 'teacher'],
  'delete-all-content': ['admin'],
  'view-all-content': ['admin', 'teacher', 'trial_teacher', 'guest_teacher', 'student', 'trial', 'listener'],
  'access-premium-content': ['admin', 'teacher', 'student'], // Requiere créditos para students

  // ==================== AI TOOLS ====================
  'use-ai-tools': ['admin', 'teacher', 'trial_teacher', 'guest_teacher'],
  'use-ai-unlimited': ['admin'],
  'use-ai-limited': ['teacher', 'trial_teacher', 'guest_teacher'], // Con cuotas/créditos
  'configure-ai': ['admin'],
  'view-ai-analytics': ['admin'],

  // ==================== CLASS MANAGEMENT ====================
  'create-classes': ['admin', 'teacher'],
  'edit-own-classes': ['admin', 'teacher'],
  'edit-all-classes': ['admin'],
  'delete-classes': ['admin', 'teacher'],
  'manage-classes': ['admin', 'teacher'],
  'join-classes': ['student', 'trial', 'listener'], // Deduce créditos
  'join-classes-free': ['admin', 'teacher'], // No deduce créditos
  'view-class-analytics': ['admin', 'teacher'],

  // ==================== EXERCISE BUILDER ====================
  'use-exercise-builder': ['admin', 'teacher', 'trial_teacher', 'guest_teacher'],
  'use-design-lab': ['admin', 'teacher'],

  // ==================== ANALYTICS ====================
  'view-global-analytics': ['admin'],
  'view-own-analytics': ['admin', 'teacher', 'student'],
  'view-student-progress': ['admin', 'teacher', 'guardian'],

  // ==================== GROUPS ====================
  'create-groups': ['admin', 'teacher'],
  'manage-groups': ['admin', 'teacher'],
  'view-groups': ['admin', 'teacher'],

  // ==================== ASSIGNMENTS ====================
  'create-assignments': ['admin', 'teacher'],
  'grade-assignments': ['admin', 'teacher'],
  'view-own-assignments': ['student', 'trial', 'listener'],

  // ==================== MESSAGES ====================
  'send-messages': ['admin', 'teacher', 'student'],
  'send-broadcast': ['admin', 'teacher'],

  // ==================== SETTINGS ====================
  'manage-system-settings': ['admin'],
  'manage-own-settings': ['admin', 'teacher', 'trial_teacher', 'guest_teacher', 'student', 'trial', 'listener', 'guardian'],

  // ==================== GAMIFICATION ====================
  'view-gamification': ['admin', 'teacher', 'student', 'trial'],
  'manage-gamification': ['admin'],

  // ==================== LIVE GAMES ====================
  'create-live-games': ['admin', 'teacher'],
  'play-live-games': ['admin', 'teacher', 'student', 'trial', 'listener'],

  // ==================== GUARDIAN SPECIFIC ====================
  'view-linked-students': ['guardian'],
  'view-child-progress': ['guardian'],
};

// ============================================
// ROLE HIERARCHY (para permisos heredados)
// ============================================

export const ROLE_HIERARCHY = {
  admin: 10,
  teacher: 5,
  trial_teacher: 4,
  guest_teacher: 4,
  student: 3,
  trial: 2,
  listener: 1,
  guardian: 3,
};

// ============================================
// ROLE DISPLAY NAMES
// ============================================

export const ROLE_LABELS = {
  admin: 'Administrador',
  teacher: 'Profesor',
  trial_teacher: 'Profesor de Prueba',
  guest_teacher: 'Profesor Invitado',
  student: 'Estudiante',
  trial: 'Estudiante de Prueba',
  listener: 'Oyente',
  guardian: 'Tutor/Padre',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Verifica si un rol tiene un permiso específico
 * @param {string} role - Rol del usuario
 * @param {string} permission - Permiso a verificar
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  if (!role || !permission) return false;

  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    console.warn(`Permission "${permission}" no está definido`);
    return false;
  }

  return allowedRoles.includes(role);
}

/**
 * Verifica si un rol tiene al menos uno de varios permisos
 * @param {string} role - Rol del usuario
 * @param {string[]} permissions - Array de permisos
 * @returns {boolean}
 */
export function hasAnyPermission(role, permissions) {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Verifica si un rol tiene todos los permisos especificados
 * @param {string} role - Rol del usuario
 * @param {string[]} permissions - Array de permisos
 * @returns {boolean}
 */
export function hasAllPermissions(role, permissions) {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Obtiene todos los permisos de un rol
 * @param {string} role - Rol del usuario
 * @returns {string[]}
 */
export function getRolePermissions(role) {
  return Object.keys(PERMISSIONS).filter(permission =>
    PERMISSIONS[permission].includes(role)
  );
}

/**
 * Verifica si un rol es admin
 * @param {string} role - Rol del usuario
 * @returns {boolean}
 */
export function isAdmin(role) {
  return role === 'admin';
}

/**
 * Verifica si un rol es teacher (cualquier tipo)
 * @param {string} role - Rol del usuario
 * @returns {boolean}
 */
export function isTeacher(role) {
  return ['teacher', 'trial_teacher', 'guest_teacher'].includes(role);
}

/**
 * Verifica si un rol es student (cualquier tipo)
 * @param {string} role - Rol del usuario
 * @returns {boolean}
 */
export function isStudent(role) {
  return ['student', 'trial', 'listener'].includes(role);
}

/**
 * Verifica si un rol es guardian
 * @param {string} role - Rol del usuario
 * @returns {boolean}
 */
export function isGuardian(role) {
  return role === 'guardian';
}
