import { createContext, useContext, useState, useEffect } from 'react';

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
    setOriginalUser(currentUser);
    setViewAsUser(targetUser);
    // Guardar el ID del usuario para volver al UserProfile correcto
    setReturnToUserId(targetUser.id || targetUser.uid);
  };

  /**
   * Desactivar modo "Ver como" y volver al usuario original
   */
  const stopViewingAs = () => {
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
    return viewAsUser || currentUser;
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
