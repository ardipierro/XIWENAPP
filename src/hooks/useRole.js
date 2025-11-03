/**
 * @fileoverview Custom hook para verificación de roles y permisos
 * @module hooks/useRole
 */

import { useMemo } from 'react';
import useAuth from './useAuth';
import { ROLES } from '../firebase/roleConfig';

/**
 * Hook para verificar roles y permisos del usuario actual
 * @returns {Object} Funciones y estado de roles
 */
export function useRole() {
  const { userRole } = useAuth();

  /**
   * Verificaciones de roles memoizadas
   */
  const roles = useMemo(() => ({
    isAdmin: userRole === ROLES.ADMIN,
    isTeacher: [ROLES.TEACHER, ROLES.ADMIN].includes(userRole),
    isStudent: userRole === ROLES.STUDENT,
    isSupport: userRole === ROLES.SUPPORT,
    isContentCreator: userRole === ROLES.CONTENT_CREATOR,
    isDeveloper: userRole === ROLES.DEVELOPER,
    currentRole: userRole
  }), [userRole]);

  /**
   * Verifica si el usuario puede realizar una acción específica
   * @param {string} action - Acción a verificar
   * @returns {boolean} Si el usuario puede realizar la acción
   */
  const can = useMemo(() => {
    const permissions = {
      // Admin puede todo
      [ROLES.ADMIN]: [
        'manage_users',
        'manage_courses',
        'manage_classes',
        'manage_content',
        'manage_exercises',
        'manage_groups',
        'view_analytics',
        'manage_credits',
        'delete_data'
      ],
      // Teacher puede gestionar cursos, clases y ver analytics
      [ROLES.TEACHER]: [
        'manage_courses',
        'manage_classes',
        'manage_content',
        'manage_exercises',
        'manage_groups',
        'view_analytics',
        'assign_students'
      ],
      // Content Creator solo puede crear contenido
      [ROLES.CONTENT_CREATOR]: [
        'manage_content',
        'manage_exercises'
      ],
      // Support puede ver pero no modificar
      [ROLES.SUPPORT]: [
        'view_analytics'
      ],
      // Student solo puede ver su propio contenido
      [ROLES.STUDENT]: [
        'view_courses',
        'view_classes',
        'submit_exercises'
      ],
      // Developer tiene acceso técnico
      [ROLES.DEVELOPER]: [
        'view_analytics',
        'manage_content',
        'view_logs'
      ]
    };

    return (action) => {
      const userPermissions = permissions[userRole] || [];
      return userPermissions.includes(action);
    };
  }, [userRole]);

  /**
   * Verifica si el usuario tiene al menos uno de los roles especificados
   * @param {string[]} requiredRoles - Array de roles requeridos
   * @returns {boolean} Si el usuario tiene alguno de los roles
   */
  const hasAnyRole = useMemo(() => {
    return (requiredRoles) => {
      if (!Array.isArray(requiredRoles)) {
        requiredRoles = [requiredRoles];
      }
      return requiredRoles.includes(userRole);
    };
  }, [userRole]);

  /**
   * Verifica si el usuario tiene todos los roles especificados
   * @param {string[]} requiredRoles - Array de roles requeridos
   * @returns {boolean} Si el usuario tiene todos los roles
   */
  const hasAllRoles = useMemo(() => {
    return (requiredRoles) => {
      if (!Array.isArray(requiredRoles)) {
        requiredRoles = [requiredRoles];
      }
      // Para un sistema de rol único, solo verificamos si tiene el rol principal
      return requiredRoles.length === 1 && requiredRoles[0] === userRole;
    };
  }, [userRole]);

  return {
    ...roles,
    can,
    hasAnyRole,
    hasAllRoles
  };
}

export default useRole;
