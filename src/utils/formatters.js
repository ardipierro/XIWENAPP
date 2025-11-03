/**
 * @fileoverview Funciones de formateo de datos
 * @module utils/formatters
 */

/**
 * Formatea una fecha en formato legible
 * @param {Date|string|number} date - Fecha a formatear
 * @param {string} [format='short'] - Formato: 'short', 'long', 'time', 'datetime'
 * @returns {string}
 */
export function formatDate(date, format = 'short') {
  if (!date) return '-';

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) return '-';

  const options = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit', hour12: false },
    datetime: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
  };

  return dateObj.toLocaleDateString('es-ES', options[format] || options.short);
}

/**
 * Formatea una fecha relativa (hace X tiempo)
 * @param {Date|string|number} date - Fecha a formatear
 * @returns {string}
 */
export function formatRelativeDate(date) {
  if (!date) return '-';

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) return '-';

  const now = new Date();
  const diffMs = now - dateObj;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return 'hace unos segundos';
  if (diffMinutes < 60) return `hace ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
  if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  if (diffDays < 7) return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  if (diffWeeks < 4) return `hace ${diffWeeks} ${diffWeeks === 1 ? 'semana' : 'semanas'}`;
  if (diffMonths < 12) return `hace ${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'}`;
  return `hace ${diffYears} ${diffYears === 1 ? 'año' : 'años'}`;
}

/**
 * Formatea un número con separadores de miles
 * @param {number} num - Número a formatear
 * @param {number} [decimals=0] - Cantidad de decimales
 * @returns {string}
 */
export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(num)) return '-';

  return num.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Formatea un porcentaje
 * @param {number} value - Valor a formatear (0-100 o 0-1)
 * @param {boolean} [isDecimal=false] - Si el valor está en formato decimal (0-1)
 * @param {number} [decimals=0] - Cantidad de decimales
 * @returns {string}
 */
export function formatPercentage(value, isDecimal = false, decimals = 0) {
  if (value === null || value === undefined || isNaN(value)) return '-';

  const percentage = isDecimal ? value * 100 : value;
  return `${formatNumber(percentage, decimals)}%`;
}

/**
 * Formatea bytes a tamaño legible
 * @param {number} bytes - Bytes a formatear
 * @param {number} [decimals=2] - Cantidad de decimales
 * @returns {string}
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return '-';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Formatea una duración en milisegundos a formato legible
 * @param {number} ms - Milisegundos
 * @param {boolean} [short=false] - Formato corto (1h 30m) vs largo (1 hora 30 minutos)
 * @returns {string}
 */
export function formatDuration(ms, short = false) {
  if (!ms || ms < 0) return '-';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts = [];

  if (days > 0) {
    parts.push(short ? `${days}d` : `${days} ${days === 1 ? 'día' : 'días'}`);
  }
  if (hours % 24 > 0) {
    parts.push(short ? `${hours % 24}h` : `${hours % 24} ${hours % 24 === 1 ? 'hora' : 'horas'}`);
  }
  if (minutes % 60 > 0) {
    parts.push(short ? `${minutes % 60}m` : `${minutes % 60} ${minutes % 60 === 1 ? 'minuto' : 'minutos'}`);
  }
  if (seconds % 60 > 0 && !hours && !days) {
    parts.push(short ? `${seconds % 60}s` : `${seconds % 60} ${seconds % 60 === 1 ? 'segundo' : 'segundos'}`);
  }

  return parts.join(' ') || (short ? '0s' : '0 segundos');
}

/**
 * Trunca un texto a una longitud máxima
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @param {string} [suffix='...'] - Sufijo a agregar
 * @returns {string}
 */
export function truncateText(text, maxLength, suffix = '...') {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitaliza la primera letra de un string
 * @param {string} str - String a capitalizar
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitaliza la primera letra de cada palabra
 * @param {string} str - String a capitalizar
 * @returns {string}
 */
export function capitalizeWords(str) {
  if (!str) return '';
  return str.split(' ').map(word => capitalize(word)).join(' ');
}

/**
 * Formatea un nombre de rol para mostrar
 * @param {string} role - Rol (ej: 'student', 'teacher')
 * @returns {string}
 */
export function formatRole(role) {
  const roleNames = {
    admin: 'Administrador',
    teacher: 'Profesor',
    student: 'Alumno',
    support: 'Soporte',
    content_creator: 'Creador de Contenido',
    developer: 'Desarrollador'
  };

  return roleNames[role] || capitalize(role);
}

/**
 * Formatea un estado para mostrar
 * @param {string} status - Estado (ej: 'active', 'inactive')
 * @returns {string}
 */
export function formatStatus(status) {
  const statusNames = {
    active: 'Activo',
    inactive: 'Inactivo',
    pending: 'Pendiente',
    suspended: 'Suspendido',
    deleted: 'Eliminado'
  };

  return statusNames[status] || capitalize(status);
}

/**
 * Formatea una dificultad para mostrar
 * @param {string} difficulty - Dificultad (ej: 'beginner', 'intermediate')
 * @returns {string}
 */
export function formatDifficulty(difficulty) {
  const difficultyNames = {
    beginner: 'Principiante',
    easy: 'Fácil',
    intermediate: 'Intermedio',
    medium: 'Medio',
    advanced: 'Avanzado',
    hard: 'Difícil',
    expert: 'Experto'
  };

  return difficultyNames[difficulty] || capitalize(difficulty);
}

/**
 * Formatea un tipo de ejercicio para mostrar
 * @param {string} type - Tipo de ejercicio
 * @returns {string}
 */
export function formatExerciseType(type) {
  const typeNames = {
    'multiple-choice': 'Opción Múltiple',
    'true-false': 'Verdadero/Falso',
    'fill-blank': 'Completar',
    'matching': 'Emparejar',
    'ordering': 'Ordenar',
    'short-answer': 'Respuesta Corta',
    'essay': 'Ensayo',
    'code': 'Código'
  };

  return typeNames[type] || capitalizeWords(type.replace(/-/g, ' '));
}

/**
 * Formatea un tipo de contenido para mostrar
 * @param {string} type - Tipo de contenido
 * @returns {string}
 */
export function formatContentType(type) {
  const typeNames = {
    lesson: 'Lección',
    reading: 'Lectura',
    video: 'Video',
    link: 'Enlace'
  };

  return typeNames[type] || capitalize(type);
}

export default {
  formatDate,
  formatRelativeDate,
  formatNumber,
  formatPercentage,
  formatFileSize,
  formatDuration,
  truncateText,
  capitalize,
  capitalizeWords,
  formatRole,
  formatStatus,
  formatDifficulty,
  formatExerciseType,
  formatContentType
};
