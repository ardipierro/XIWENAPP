import { createContext, useContext, useState, useEffect } from 'react';
import logger from '../utils/logger';

/**
 * Contexto para el modo "Ver como" (impersonación)
 * Permite a los admins ver la app desde la perspectiva de otro usuario
 */

const ViewAsContext = createContext();

export function ViewAsProvider({ children }) {
  const [viewAsUser, setViewAsUser] = useState(null);
  const [originalUser, setOriginalUser] = useState(null);
  const [returnToUserId, setReturnToUserId] = useState(null); // ID del usuario a retornar

  /**
   * Activar modo "Ver como"
   * @param {Object} currentUser - Usuario admin actual
   * @param {Object} targetUser - Usuario objetivo a impersonar
   */
  const startViewingAs = (currentUser, targetUser) => {
    logger.info('🎭 Activando modo Ver como:', {
      adminUser: currentUser?.email || currentUser?.displayName,
      adminRole: currentUser?.role,
      targetUser: targetUser?.email || targetUser?.name,
      targetRole: targetUser?.role,
      targetId: targetUser?.id || targetUser?.uid,
      hasRole: !!targetUser?.role
    });

    if (!targetUser?.role) {
      logger.error('❌ ERROR: targetUser NO tiene campo role!', targetUser);
    }

    setOriginalUser(currentUser);
    setViewAsUser(targetUser);
    // Guardar el ID del usuario para volver al UserProfile correcto
    setReturnToUserId(targetUser.id || targetUser.uid);
  };

  /**
   * Desactivar modo "Ver como" y volver al usuario original
   */
  const stopViewingAs = () => {
    logger.info('🔙 Desactivando modo Ver como');
    setViewAsUser(null);
    setOriginalUser(null);
    // NO limpiar returnToUserId aquí - se usa en ViewAsBanner
  };

  /**
   * Limpiar completamente el estado (después de navegar)
   */
  const clearViewAsState = () => {
    setViewAsUser(null);
    setOriginalUser(null);
    setReturnToUserId(null);
  };

  /**
   * Obtener el usuario efectivo (el que se está viendo)
   */
  const getEffectiveUser = (currentUser) => {
    const effective = viewAsUser || currentUser;
    logger.debug('👁️ getEffectiveUser llamado:', {
      isViewingAs: !!viewAsUser,
      viewAsUserEmail: viewAsUser?.email || viewAsUser?.name,
      viewAsUserRole: viewAsUser?.role,
      currentUserEmail: currentUser?.email,
      currentUserRole: currentUser?.role,
      effectiveEmail: effective?.email || effective?.displayName,
      effectiveRole: effective?.role
    });
    return effective;
  };

  // Calcular isViewingAs como valor derivado del estado
  const isViewingAs = viewAsUser !== null;

  const value = {
    viewAsUser,
    originalUser,
    returnToUserId,
    isViewingAs, // Ahora es un valor booleano que se actualiza con viewAsUser
    startViewingAs,
    stopViewingAs,
    clearViewAsState,
    getEffectiveUser
  };

  return (
    <ViewAsContext.Provider value={value}>
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs() {
  const context = useContext(ViewAsContext);
  if (!context) {
    throw new Error('useViewAs must be used within a ViewAsProvider');
  }
  return context;
}
