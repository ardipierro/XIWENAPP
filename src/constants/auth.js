/**
 * @fileoverview Constantes relacionadas con autenticación
 * @module constants/auth
 */

// Validación
export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 128;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Roles de usuario
export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  TRIAL_TEACHER: 'trial_teacher',
  STUDENT: 'student',
  LISTENER: 'listener',
  TRIAL: 'trial'
};

// Roles que tienen permisos de administrador
export const ADMIN_ROLES = [
  USER_ROLES.ADMIN
];

// Roles que tienen permisos de profesor
export const TEACHER_ROLES = [
  USER_ROLES.TEACHER,
  USER_ROLES.TRIAL_TEACHER,
  USER_ROLES.ADMIN
];

// Roles que tienen permisos de estudiante
export const STUDENT_ROLES = [
  USER_ROLES.STUDENT,
  USER_ROLES.LISTENER,
  USER_ROLES.TRIAL
];

// Estados de usuario
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETED: 'deleted',
  SUSPENDED: 'suspended'
};

// Mensajes de error de autenticación
export const AUTH_ERROR_MESSAGES = {
  // Firebase Auth errors
  'auth/invalid-credential': 'Email o contraseña incorrectos',
  'auth/wrong-password': 'Email o contraseña incorrectos',
  'auth/user-not-found': 'No existe una cuenta con este email',
  'auth/invalid-email': 'Email inválido',
  'auth/email-already-in-use': 'Ya existe una cuenta con este email',
  'auth/weak-password': 'La contraseña es muy débil',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
  'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
  'auth/operation-not-allowed': 'Operación no permitida',

  // Firestore errors
  'permission-denied': 'No tienes permisos para esta operación',
  'unavailable': 'Servicio no disponible. Intenta más tarde',

  // Custom errors
  'passwords-dont-match': 'Las contraseñas no coinciden',
  'password-too-short': `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
  'invalid-email-format': 'Formato de email inválido',
  'email-required': 'El email es requerido',
  'password-required': 'La contraseña es requerida',
  'default': 'Ocurrió un error. Intenta de nuevo'
};

// Timeouts
export const AUTH_TIMEOUT = 10000; // 10 segundos
export const PASSWORD_RESET_NOTIFICATION_DURATION = 5000; // 5 segundos
