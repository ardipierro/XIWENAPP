/**
 * @fileoverview Universal User Manager - Gestión unificada de usuarios/estudiantes
 * - Admin: Ve y gestiona TODOS los usuarios (todos los roles)
 * - Teacher: Ve y gestiona solo ESTUDIANTES (student, trial, listener)
 * - Permisos: Basado en sistema de permisos centralizado
 * @module components/UniversalUserManager
 */

import { useState, useEffect } from 'react';
import {
  Crown,
  Users,
  GraduationCap,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BookOpen,
  DollarSign,
  Mail,
  Eye,
  Trash2
} from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useUserManagement } from '../hooks/useUserManagement';
import { createUser, deleteUser } from '../firebase/users';
import SearchBar from './common/SearchBar';
import { BaseButton, BaseLoading, BaseEmptyState } from './common';
import { UniversalCard, CardGrid } from './cards';
import AddUserModal from './AddUserModal';
import UserProfile from './UserProfile';
import ConfirmModal from './ConfirmModal';
import logger from '../utils/logger';

// Helper functions for user cards
const getAvatarColor = (role) => {
  const colors = {
    admin: '#f59e0b', // amber/orange
    teacher: '#8b5cf6', // purple
    trial_teacher: '#a78bfa', // light purple
    student: '#3b82f6', // blue
    listener: '#10b981', // green
    trial: '#06b6d4', // cyan
  };
  return colors[role] || '#6b7280'; // gray fallback
};

const getRoleBadge = (role) => {
  const badges = {
    admin: { label: 'Admin', variant: 'warning' },
    teacher: { label: 'Profesor', variant: 'info' },
    trial_teacher: { label: 'Profesor Prueba', variant: 'info' },
    student: { label: 'Alumno', variant: 'primary' },
    listener: { label: 'Oyente', variant: 'success' },
    trial: { label: 'Prueba', variant: 'secondary' }
  };
  return badges[role] || { label: role, variant: 'secondary' };
};

/**
 * UniversalUserManager - Componente universal para gestión de usuarios
 * Adapta UI y funcionalidad según rol del usuario actual
 */
export default function UniversalUserManager({ user, userRole }) {
  const { can, isAdmin } = usePermissions();

  // Hook de gestión de usuarios con permisos
  const userManagement = useUserManagement(user, {
    canViewAll: can('view-all-users'),
    canManageRoles: can('edit-user-roles')
  });

  // Estados UI
  const [viewMode, setViewMode] = useState('grid'); // 'table', 'grid', 'list'
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Estados de enrollments (para StudentCard)
  const [enrollmentCounts, setEnrollmentCounts] = useState({});

  // Cargar usuarios al montar
  useEffect(() => {
    if (can('view-own-students') || can('view-all-users')) {
      userManagement.loadUsers();
    }
  }, [can]);

  // Cargar enrollment counts cuando cambien los usuarios
  useEffect(() => {
    if (userManagement.users.length > 0) {
      loadEnrollmentCounts();
    }
  }, [userManagement.users]);

  /**
   * Cargar counts de cursos enrollados por estudiante
   */
  const loadEnrollmentCounts = async () => {
    try {
      const { getStudentEnrollments } = await import('../firebase/firestore');
      const counts = {};

      await Promise.all(
        userManagement.users.map(async (u) => {
          try {
            const enrollments = await getStudentEnrollments(u.id);
            counts[u.id] = enrollments.length;
          } catch (error) {
            logger.error(`Error loading enrollments for ${u.id}:`, error);
            counts[u.id] = 0;
          }
        })
      );

      setEnrollmentCounts(counts);
    } catch (error) {
      logger.error('Error loading enrollment counts:', error);
    }
  };

  /**
   * Crear usuario
   */
  const handleCreateUser = async (formData) => {
    try {
      logger.debug('📝 Creating user:', formData);
      const result = await createUser(formData);

      if (result.success) {
        setSuccessMessage(
          isAdmin()
            ? `Usuario ${formData.name || formData.email} creado exitosamente`
            : `Alumno ${formData.name || formData.email} agregado exitosamente`
        );
        setTimeout(() => setSuccessMessage(''), 5000);

        // Recargar lista
        await userManagement.loadUsers();
      }

      return result;
    } catch (error) {
      logger.error('❌ Error creating user:', error);
      setErrorMessage(`Error al crear usuario: ${error.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
      return { success: false, error: error.message };
    }
  };

  /**
   * Eliminar usuario
   */
  const handleDeleteUser = async (userId) => {
    try {
      logger.debug('🗑️ Deleting user:', userId);
      await deleteUser(userId);

      setSuccessMessage('Usuario eliminado exitosamente');
      setTimeout(() => setSuccessMessage(''), 5000);

      // Recargar lista
      await userManagement.loadUsers();

      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (error) {
      logger.error('❌ Error deleting user:', error);
      setErrorMessage(`Error al eliminar usuario: ${error.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  /**
   * Ver perfil de usuario
   */
  const handleViewUserProfile = (userItem) => {
    setSelectedUserProfile(userItem);
    setShowUserProfile(true);
  };

  /**
   * Actualizar usuario desde perfil
   */
  const handleUpdateUser = async () => {
    setSuccessMessage('Usuario actualizado exitosamente');
    setTimeout(() => setSuccessMessage(''), 5000);
    await userManagement.loadUsers();
  };

  // Determinar título e icono según rol
  const title = isAdmin() ? 'Usuarios' : 'Mis Estudiantes';
  const TitleIcon = isAdmin() ? Crown : GraduationCap;
  const createButtonLabel = isAdmin() ? 'Nuevo Usuario' : 'Agregar Alumno';

  // Loading state
  if (userManagement.loading && userManagement.users.length === 0) {
    return <BaseLoading size="large" text={`Cargando ${title.toLowerCase()}...`} />;
  }

  // User Profile view
  if (showUserProfile && selectedUserProfile) {
    return (
      <UserProfile
        selectedUser={selectedUserProfile}
        currentUser={user}
        isAdmin={isAdmin()}
        onBack={() => {
          setShowUserProfile(false);
          setSelectedUserProfile(null);
        }}
        onUpdate={handleUpdateUser}
      />
    );
  }

  return (
    <div className="universal-user-manager p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <TitleIcon size={32} strokeWidth={2} style={{ color: 'var(--color-text-primary)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h1>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {can('create-users') && (
            <BaseButton
              onClick={() => setShowAddUserModal(true)}
              variant="primary"
              icon={Plus}
              className="w-full sm:w-auto"
            >
              {createButtonLabel}
            </BaseButton>
          )}

          <BaseButton
            onClick={userManagement.loadUsers}
            variant="success"
            icon={RefreshCw}
            className="w-full sm:w-auto"
            title="Actualizar lista"
          >
            Actualizar
          </BaseButton>
        </div>
      </div>

      {/* SearchBar with view mode selector */}
      <SearchBar
        value={userManagement.searchTerm}
        onChange={userManagement.setSearchTerm}
        placeholder={isAdmin() ? 'Buscar usuarios...' : 'Buscar alumnos...'}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        viewModes={['table', 'grid', 'list']}
        className="mb-6"
      />

      {/* Success/Error Messages */}
      {successMessage && (
        <div
          className="p-4 rounded-lg font-semibold mb-5 animate-slide-down flex items-center gap-2"
          style={{
            backgroundColor: 'rgba(var(--color-success-rgb), 0.1)',
            color: 'var(--color-success)',
            border: '1px solid rgba(var(--color-success-rgb), 0.3)'
          }}
        >
          <CheckCircle size={18} strokeWidth={2} /> {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          className="p-4 rounded-lg font-semibold mb-5 animate-slide-down flex items-center gap-2"
          style={{
            backgroundColor: 'rgba(var(--color-danger-rgb), 0.1)',
            color: 'var(--color-danger)',
            border: '1px solid rgba(var(--color-danger-rgb), 0.3)'
          }}
        >
          <AlertTriangle size={18} strokeWidth={2} /> {errorMessage}
        </div>
      )}

      {/* Users List */}
      <div className="users-section">
        {userManagement.filteredUsers.length === 0 ? (
          <BaseEmptyState
            icon={Users}
            title={`No hay ${isAdmin() ? 'usuarios' : 'alumnos'}`}
            description={
              userManagement.searchTerm
                ? 'No se encontraron resultados con los filtros aplicados'
                : isAdmin()
                ? 'Agrega tu primer usuario con el botón de arriba'
                : 'Agrega tu primer alumno con el botón de arriba'
            }
          />
        ) : viewMode === 'grid' || viewMode === 'list' ? (
          /* Vista Grid/List con UniversalCard */
          <CardGrid
            columnsType={viewMode === 'list' ? 'wide' : 'default'}
            gap={viewMode === 'list' ? 'gap-3' : 'gap-4 md:gap-6'}
          >
            {userManagement.filteredUsers.map((userItem) => {
              const initial = userItem.name?.charAt(0).toUpperCase() || '?';
              const avatarColor = getAvatarColor(userItem.role);
              const roleBadge = getRoleBadge(userItem.role);

              return (
                <UniversalCard
                  key={userItem.id}
                  variant="user"
                  size="md"
                  layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
                  avatar={initial}
                  avatarColor={avatarColor}
                  title={userItem.name}
                  subtitle={userItem.email}
                  badges={[{ variant: roleBadge.variant, children: roleBadge.label }]}
                  stats={[
                    { label: 'Cursos', value: enrollmentCounts[userItem.id] || 0, icon: BookOpen },
                    { label: 'Créditos', value: userItem.credits || 0, icon: DollarSign }
                  ]}
                  onClick={() => handleViewUserProfile(userItem)}
                  actions={
                    <>
                      <BaseButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewUserProfile(userItem);
                        }}
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                      >
                        Ver
                      </BaseButton>
                      {can('delete-users') && (
                        <BaseButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserToDelete(userItem);
                            setShowDeleteConfirm(true);
                          }}
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                        />
                      )}
                    </>
                  }
                />
              );
            })}
          </CardGrid>
        ) : (
          /* Vista Table */
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>
                    <div
                      onClick={() => userManagement.handleSort('name')}
                      className={`sortable-header ${
                        userManagement.sortField === 'name' ? 'active' : ''
                      }`}
                    >
                      <span>Usuario</span>
                      {userManagement.sortField === 'name' ? (
                        userManagement.sortDirection === 'asc' ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowDown size={14} />
                        )
                      ) : (
                        <ArrowUpDown size={14} className="sort-icon-inactive" />
                      )}
                    </div>
                  </th>
                  <th>
                    <div
                      onClick={() => userManagement.handleSort('email')}
                      className={`sortable-header ${
                        userManagement.sortField === 'email' ? 'active' : ''
                      }`}
                    >
                      <span>Email</span>
                      {userManagement.sortField === 'email' ? (
                        userManagement.sortDirection === 'asc' ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowDown size={14} />
                        )
                      ) : (
                        <ArrowUpDown size={14} className="sort-icon-inactive" />
                      )}
                    </div>
                  </th>
                  <th>
                    <div
                      onClick={() => userManagement.handleSort('role')}
                      className={`sortable-header ${
                        userManagement.sortField === 'role' ? 'active' : ''
                      }`}
                    >
                      <span>Rol</span>
                      {userManagement.sortField === 'role' ? (
                        userManagement.sortDirection === 'asc' ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowDown size={14} />
                        )
                      ) : (
                        <ArrowUpDown size={14} className="sort-icon-inactive" />
                      )}
                    </div>
                  </th>
                  <th>
                    <div
                      onClick={() => userManagement.handleSort('credits')}
                      className={`sortable-header ${
                        userManagement.sortField === 'credits' ? 'active' : ''
                      }`}
                    >
                      <span>Créditos</span>
                      {userManagement.sortField === 'credits' ? (
                        userManagement.sortDirection === 'asc' ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowDown size={14} />
                        )
                      ) : (
                        <ArrowUpDown size={14} className="sort-icon-inactive" />
                      )}
                    </div>
                  </th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {userManagement.filteredUsers.map((userItem) => (
                  <tr key={userItem.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="user-avatar">
                          {userItem.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="font-semibold">{userItem.name || 'Sin nombre'}</span>
                      </div>
                    </td>
                    <td>{userItem.email}</td>
                    <td>
                      <span className="role-badge" data-role={userItem.role}>
                        {userItem.role}
                      </span>
                    </td>
                    <td>
                      <span className="font-bold">{userItem.credits || 0}</span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <BaseButton
                          onClick={() => handleViewUserProfile(userItem)}
                          variant="ghost"
                          size="sm"
                        >
                          Ver
                        </BaseButton>
                        {can('delete-users') && (
                          <BaseButton
                            onClick={() => {
                              setUserToDelete(userItem);
                              setShowDeleteConfirm(true);
                            }}
                            variant="danger"
                            size="sm"
                          >
                            Eliminar
                          </BaseButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUserCreated={handleCreateUser}
        userRole={userRole}
        isAdmin={isAdmin()}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setUserToDelete(null);
        }}
        onConfirm={() => userToDelete && handleDeleteUser(userToDelete.id)}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que deseas eliminar a ${
          userToDelete?.name || userToDelete?.email
        }? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}
