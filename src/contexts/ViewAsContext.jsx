import { createContext, useContext, useState } from 'react';

/**
 * Contexto para el modo "Ver como" (impersonación)
 * Permite a los admins ver la app desde la perspectiva de otro usuario
 */

const ViewAsContext = createContext();

export function ViewAsProvider({ children }) {
  const [viewAsUser, setViewAsUser] = useState(null);
  const [originalUser, setOriginalUser] = useState(null);

  /**
   * Activar modo "Ver como"
   * @param {Object} currentUser - Usuario admin actual
   * @param {Object} targetUser - Usuario objetivo a impersonar
   */
  const startViewingAs = (currentUser, targetUser) => {
    setOriginalUser(currentUser);
    setViewAsUser(targetUser);
  };

  /**
   * Desactivar modo "Ver como" y volver al usuario original
   */
  const stopViewingAs = () => {
    setViewAsUser(null);
    setOriginalUser(null);
  };

  /**
   * Verificar si está en modo "Ver como"
   */
  const isViewingAs = () => {
    return viewAsUser !== null;
  };

  /**
   * Obtener el usuario efectivo (el que se está viendo)
   */
  const getEffectiveUser = (currentUser) => {
    return viewAsUser || currentUser;
  };

  const value = {
    viewAsUser,
    originalUser,
    isViewingAs: isViewingAs(),
    startViewingAs,
    stopViewingAs,
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
