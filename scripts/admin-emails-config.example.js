/**
 * @fileoverview Configuración de emails de administradores
 *
 * INSTRUCCIONES:
 * 1. Renombrar este archivo a: admin-emails-config.js
 * 2. Agregar los emails de todos los administradores reales
 * 3. Guardar el archivo
 * 4. Ejecutar el script de migración
 *
 * IMPORTANTE:
 * - Solo los emails listados aquí mantendrán el rol 'admin'
 * - Todos los demás usuarios con rol 'admin' serán cambiados a 'student'
 * - Verificar cuidadosamente esta lista antes de ejecutar la migración
 *
 * @module scripts/admin-emails-config
 */

/**
 * Lista de emails de administradores reales de la aplicación
 *
 * @type {string[]}
 */
export const ADMIN_EMAILS = [
  // ⚠️ IMPORTANTE: Agregar aquí los emails de los administradores reales
  // Ejemplo:
  // 'admin@xiwen.com',
  // 'director@xiwen.com',
  // 'tu-email@ejemplo.com',
];

/**
 * Verifica si un email es de un administrador
 * @param {string} email - Email a verificar
 * @returns {boolean}
 */
export function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(email?.toLowerCase());
}

/**
 * Obtiene el número de administradores configurados
 * @returns {number}
 */
export function getAdminCount() {
  return ADMIN_EMAILS.length;
}
