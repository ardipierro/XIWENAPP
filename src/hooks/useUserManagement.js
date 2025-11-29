import { useState, useCallback, useMemo } from 'react';
import { getAllUsers, updateUser } from '../firebase/users';
import { updateUserRole, updateUserStatus } from '../firebase/firestore';
import { getUserCredits } from '../firebase/credits';
import logger from '../utils/logger';

/**
 * Hook para gestión de usuarios (Admin/Teacher)
 * Maneja: carga, filtrado, ordenamiento, cambios de rol/status
 */
export function useUserManagement(currentUser, permissions = {}) {
  // Estados
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [loading, setLoading] = useState(false);

  /**
   * Cargar usuarios con créditos
   */
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔥 📥 LOADUSERS - Iniciando carga de usuarios...');
      logger.debug('📥 Loading users...');

      // Cargar usuarios según permisos
      let loadedUsers;
      if (permissions.canViewAll) {
        // Admin: ver todos
        console.log('🔥 🔍 LOADUSERS - Modo ADMIN: Loading ALL users');
        logger.debug('🔍 Loading ALL users (admin mode)');
        loadedUsers = await getAllUsers({ activeOnly: true });
        console.log(`🔥 📋 LOADUSERS - Found ${loadedUsers.length} users:`, loadedUsers.map(u => ({ id: u.id, email: u.email, role: u.role, active: u.active })));
        logger.debug(`📋 Found ${loadedUsers.length} users from getAllUsers:`, loadedUsers.map(u => ({ id: u.id, email: u.email, role: u.role, active: u.active })));
      } else {
        // Teacher: solo estudiantes
        console.log('🔥 🔍 LOADUSERS - Modo TEACHER: Loading STUDENTS only');
        logger.debug('🔍 Loading STUDENTS only (teacher mode)');
        loadedUsers = await getAllUsers({ role: 'student', activeOnly: true });
        console.log(`🔥 📋 LOADUSERS - Found ${loadedUsers.length} students`);
        logger.debug(`📋 Found ${loadedUsers.length} students from getAllUsers`);
      }

      // Cargar créditos para cada usuario en paralelo
      console.log('🔥 💰 LOADUSERS - Cargando créditos para cada usuario...');
      const usersWithCredits = await Promise.all(
        loadedUsers.map(async (user) => {
          try {
            const credits = await getUserCredits(user.id);
            return {
              ...user,
              credits: credits?.availableCredits || 0
            };
          } catch (error) {
            logger.error(`Error loading credits for user ${user.id}:`, error);
            return { ...user, credits: 0 };
          }
        })
      );

      console.log('🔥 ✅ LOADUSERS - Seteando usuarios en estado. Total:', usersWithCredits.length);
      setUsers(usersWithCredits);
      console.log('🔥 👥 LOADUSERS - Lista final:', usersWithCredits.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role })));
      logger.debug(`✅ Loaded ${usersWithCredits.length} users with credits`);
      logger.debug('👥 Final users list:', usersWithCredits.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role })));
      return usersWithCredits;
    } catch (error) {
      console.error('🔥 ❌ LOADUSERS - ERROR:', error);
      logger.error('❌ Error loading users:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [permissions.canViewAll]);

  /**
   * Cambiar rol de usuario
   */
  const handleRoleChange = useCallback(async (userId, newRole) => {
    if (!permissions.canManageRoles) {
      logger.warn('⚠️ User does not have permission to change roles');
      return { success: false, error: 'Insufficient permissions' };
    }

    try {
      logger.debug(`🔄 Changing role for user ${userId} to ${newRole}`);
      await updateUserRole(userId, newRole);

      // Actualizar localmente
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ));

      logger.debug('✅ Role updated successfully');
      return { success: true };
    } catch (error) {
      logger.error('❌ Error changing role:', error);
      return { success: false, error: error.message };
    }
  }, [permissions.canManageRoles]);

  /**
   * Cambiar status de usuario
   */
  const handleStatusChange = useCallback(async (userId, newStatus) => {
    try {
      logger.debug(`🔄 Changing status for user ${userId} to ${newStatus}`);
      await updateUserStatus(userId, newStatus);

      // Actualizar localmente
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, status: newStatus } : u
      ));

      logger.debug('✅ Status updated successfully');
      return { success: true };
    } catch (error) {
      logger.error('❌ Error changing status:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Ordenar usuarios
   */
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      // Toggle direction si es el mismo campo
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Nuevo campo, empezar con asc
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  /**
   * Filtrar y ordenar usuarios (memoizado)
   */
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(term) ||
        user.name?.toLowerCase().includes(term)
      );
    }

    // Filtro por rol
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Filtro por status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'email':
          aVal = a.email?.toLowerCase() || '';
          bVal = b.email?.toLowerCase() || '';
          break;
        case 'role':
          aVal = a.role || '';
          bVal = b.role || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'credits':
          aVal = a.credits || 0;
          bVal = b.credits || 0;
          break;
        case 'createdAt':
          aVal = a.createdAt?.toMillis?.() || 0;
          bVal = b.createdAt?.toMillis?.() || 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchTerm, filterRole, filterStatus, sortField, sortDirection]);

  /**
   * Calcular estadísticas (memoizado)
   */
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.role === 'admin').length;
    const teachers = users.filter(u => u.role === 'teacher').length;
    const students = users.filter(u => u.role === 'student').length;
    const active = users.filter(u => u.status === 'active' || !u.status).length;
    const suspended = users.filter(u => u.status === 'suspended').length;

    return { total, admins, teachers, students, active, suspended };
  }, [users]);

  return {
    // Estados
    users,
    filteredUsers,
    stats,
    loading,
    searchTerm,
    filterRole,
    filterStatus,
    sortField,
    sortDirection,

    // Setters
    setSearchTerm,
    setFilterRole,
    setFilterStatus,

    // Acciones
    loadUsers,
    handleRoleChange,
    handleStatusChange,
    handleSort
  };
}
