import logger from '../utils/logger';

import { useState, useCallback } from 'react';
import { getAllUsers, updateUserRole, updateUserStatus } from '../firebase/firestore';
import { createUser } from '../firebase/users';

/**
 * Hook para gestión de usuarios
 * Maneja carga, creación, actualización de rol y estado
 */
export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Cargar todos los usuarios
   */
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      return allUsers;
    } catch (err) {
      logger.error('Error cargando usuarios:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear nuevo usuario
   */
  const addUser = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const newUser = await createUser(userData);
      setUsers(prev => [...prev, newUser]);
      return newUser;
    } catch (err) {
      logger.error('Error creando usuario:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar rol de usuario
   */
  const changeUserRole = useCallback(async (userId, newRole) => {
    setLoading(true);
    setError(null);
    try {
      await updateUserRole(userId, newRole);
      setUsers(prev =>
        prev.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (err) {
      logger.error('Error actualizando rol:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar estado de usuario
   */
  const changeUserStatus = useCallback(async (userId, newStatus) => {
    setLoading(true);
    setError(null);
    try {
      await updateUserStatus(userId, newStatus);
      setUsers(prev =>
        prev.map(user =>
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );
    } catch (err) {
      logger.error('Error actualizando estado:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Filtrar usuarios por criterios
   */
  const filterUsers = useCallback((searchTerm = '', filterRole = 'all', filterStatus = 'all') => {
    return users.filter(user => {
      const matchesSearch = !searchTerm ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users]);

  return {
    users,
    loading,
    error,
    loadUsers,
    addUser,
    changeUserRole,
    changeUserStatus,
    filterUsers
  };
}

export default useUsers;
