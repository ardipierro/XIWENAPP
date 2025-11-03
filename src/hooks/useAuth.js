/**
 * @fileoverview Custom hook para acceder al contexto de autenticación
 * @module hooks/useAuth
 */

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext.jsx';

/**
 * Hook para acceder al contexto de autenticación
 * Debe usarse dentro de un AuthProvider
 *
 * @returns {import('../contexts/AuthContext').AuthContextValue}
 * @throws {Error} Si se usa fuera de un AuthProvider
 *
 * @example
 * function MyComponent() {
 *   const { user, login, logout, loading } = useAuth();
 *
 *   if (loading) return <div>Cargando...</div>;
 *
 *   return (
 *     <div>
 *       {user ? (
 *         <button onClick={logout}>Cerrar sesión</button>
 *       ) : (
 *         <button onClick={() => login(email, password)}>Iniciar sesión</button>
 *       )}
 *     </div>
 *   );
 * }
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }

  return context;
}

export default useAuth;
