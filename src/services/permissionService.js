/**
 * @fileoverview Servicio de permisos
 * Maneja la lógica de verificación de permisos
 * @module services/permissionService
 */

import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  isAdmin,
  isTeacher,
  isStudent,
  isGuardian,
  ROLE_LABELS,
} from '../config/permissions';
import logger from '../utils/logger';

class PermissionService {
  constructor() {
    this.currentRole = null;
  }

  /**
   * Establece el rol actual del usuario
   * @param {string} role - Rol del usuario
   */
  setRole(role) {
    this.currentRole = role;
    logger.info(`Role set to: ${role}`, 'PermissionService');
  }

  /**
   * Obtiene el rol actual
   * @returns {string|null}
   */
  getRole() {
    return this.currentRole;
  }

  /**
   * Verifica si el usuario actual tiene un permiso
   * @param {string} permission - Permiso a verificar
   * @returns {boolean}
   */
  can(permission) {
    if (!this.currentRole) {
      logger.warn('No role set in PermissionService', 'PermissionService');
      return false;
    }
    return hasPermission(this.currentRole, permission);
  }

  /**
   * Verifica si el usuario tiene al menos uno de los permisos
   * @param {string[]} permissions - Array de permisos
   * @returns {boolean}
   */
  canAny(permissions) {
    if (!this.currentRole) return false;
    return hasAnyPermission(this.currentRole, permissions);
  }

  /**
   * Verifica si el usuario tiene todos los permisos
   * @param {string[]} permissions - Array de permisos
   * @returns {boolean}
   */
  canAll(permissions) {
    if (!this.currentRole) return false;
    return hasAllPermissions(this.currentRole, permissions);
  }

  /**
   * Obtiene todos los permisos del usuario actual
   * @returns {string[]}
   */
  getPermissions() {
    if (!this.currentRole) return [];
    return getRolePermissions(this.currentRole);
  }

  /**
   * Verifica si el usuario es admin
   * @returns {boolean}
   */
  isAdmin() {
    return isAdmin(this.currentRole);
  }

  /**
   * Verifica si el usuario es teacher
   * @returns {boolean}
   */
  isTeacher() {
    return isTeacher(this.currentRole);
  }

  /**
   * Verifica si el usuario es student
   * @returns {boolean}
   */
  isStudent() {
    return isStudent(this.currentRole);
  }

  /**
   * Verifica si el usuario es guardian
   * @returns {boolean}
   */
  isGuardian() {
    return isGuardian(this.currentRole);
  }

  /**
   * Obtiene el label del rol actual
   * @returns {string}
   */
  getRoleLabel() {
    return ROLE_LABELS[this.currentRole] || 'Desconocido';
  }

  /**
   * Verifica si el usuario puede acceder a una ruta
   * @param {string} path - Ruta a verificar
   * @returns {boolean}
   */
  canAccessRoute(path) {
    // Mapeo de rutas a permisos
    const routePermissions = {
      '/dashboard/users': 'view-all-users',
      '/dashboard/credits': 'manage-credits',
      '/dashboard/ai-config': 'configure-ai',
      '/dashboard/create': 'create-content',
      '/dashboard/exercise-builder': 'use-exercise-builder',
      '/dashboard/design-lab': 'use-design-lab',
      '/dashboard/classes': 'manage-classes',
      '/dashboard/analytics': 'view-global-analytics',
      '/dashboard/groups': 'manage-groups',
      '/dashboard/students': 'view-own-students',
    };

    const permission = routePermissions[path];
    if (!permission) return true; // Si no hay permiso definido, permitir acceso

    return this.can(permission);
  }
}

// Singleton instance
const permissionService = new PermissionService();

export default permissionService;
