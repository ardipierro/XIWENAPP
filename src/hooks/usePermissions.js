/**
 * @fileoverview Hook de permisos
 * Proporciona acceso al sistema de permisos
 * @module hooks/usePermissions
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import permissionService from '../services/permissionService';

/**
 * Hook para acceder al sistema de permisos
 * @returns {Object} Funciones de permisos
 */
export function usePermissions() {
  const { userRole } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (userRole) {
      permissionService.setRole(userRole);
      setInitialized(true);
    }
  }, [userRole]);

  return {
    /**
     * Verifica si el usuario tiene un permiso
     * @param {string} permission - Permiso a verificar
     * @returns {boolean}
     */
    can: (permission) => {
      if (!initialized) return false;
      return permissionService.can(permission);
    },

    /**
     * Verifica si el usuario tiene al menos uno de los permisos
     * @param {string[]} permissions - Array de permisos
     * @returns {boolean}
     */
    canAny: (permissions) => {
      if (!initialized) return false;
      return permissionService.canAny(permissions);
    },

    /**
     * Verifica si el usuario tiene todos los permisos
     * @param {string[]} permissions - Array de permisos
     * @returns {boolean}
     */
    canAll: (permissions) => {
      if (!initialized) return false;
      return permissionService.canAll(permissions);
    },

    /**
     * Obtiene todos los permisos del usuario
     * @returns {string[]}
     */
    getPermissions: () => {
      if (!initialized) return [];
      return permissionService.getPermissions();
    },

    /**
     * Verifica si el usuario es admin
     * @returns {boolean}
     */
    isAdmin: () => {
      if (!initialized) return false;
      return permissionService.isAdmin();
    },

    /**
     * Verifica si el usuario es teacher
     * @returns {boolean}
     */
    isTeacher: () => {
      if (!initialized) return false;
      return permissionService.isTeacher();
    },

    /**
     * Verifica si el usuario es student
     * @returns {boolean}
     */
    isStudent: () => {
      if (!initialized) return false;
      return permissionService.isStudent();
    },

    /**
     * Verifica si el usuario es guardian
     * @returns {boolean}
     */
    isGuardian: () => {
      if (!initialized) return false;
      return permissionService.isGuardian();
    },

    /**
     * Obtiene el label del rol
     * @returns {string}
     */
    getRoleLabel: () => {
      if (!initialized) return 'Cargando...';
      return permissionService.getRoleLabel();
    },

    /**
     * Verifica si el usuario puede acceder a una ruta
     * @param {string} path - Ruta a verificar
     * @returns {boolean}
     */
    canAccessRoute: (path) => {
      if (!initialized) return false;
      return permissionService.canAccessRoute(path);
    },

    // Estado de inicialización
    initialized,
    role: userRole,
  };
}
