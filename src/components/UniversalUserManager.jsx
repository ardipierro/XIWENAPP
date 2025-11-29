/**
 * @fileoverview Universal User Manager - Gestión unificada de usuarios/estudiantes
 * - Admin: Ve y gestiona TODOS los usuarios (todos los roles)
 * - Teacher: Ve y gestiona solo ESTUDIANTES (student, trial, listener)
 * - Permisos: Basado en sistema de permisos centralizado
 * @module components/UniversalUserManager
 */

import { useState, useEffect, useRef } from 'react';
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
  DollarSign,
  Mail,
  Trash2
} from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useUserManagement } from '../hooks/useUserManagement';
import { useCardConfig } from '../contexts/CardConfigContext';
import { createUser, deleteUser } from '../firebase/users';
import SearchBar from './common/SearchBar';
import { BaseButton, BaseLoading, BaseEmptyState, BaseBadge, CategoryBadge, BaseModal } from './common';
import { UniversalCard, CardGrid, CardDeleteButton } from './cards';
import {
  getBadgeByKey,
  getContrastText,
  getIconLibraryConfig,
  getBadgeSizeClasses,
  getBadgeIconSize,
  getBadgeTextColor,
  getBadgeStyles
} from '../config/badgeSystem';
import * as HeroIcons from '@heroicons/react/24/outline';
import * as HeroIconsSolid from '@heroicons/react/24/solid';

/**
 * Renderiza el icono del badge según la configuración global
 * Lee automáticamente el tamaño desde la configuración global
 */
const renderBadgeIcon = (badgeKey, fallbackEmoji, textColor) => {
  const iconLibraryConfig = getIconLibraryConfig();
  const library = iconLibraryConfig.library || 'emoji';
  const iconSize = getBadgeIconSize(); // Lee tamaño global

  // Sin icono
  if (library === 'none') return null;

  // HeroIcons (outline o filled)
  if (library === 'heroicon' || library === 'heroicon-filled') {
    const badgeConfig = getBadgeByKey(badgeKey);
    const iconName = badgeConfig?.heroicon;

    if (iconName) {
      const IconComponent = library === 'heroicon-filled'
        ? HeroIconsSolid[iconName]
        : HeroIcons[iconName];

      if (IconComponent) {
        return <IconComponent style={{ width: iconSize, height: iconSize, marginRight: '4px', color: textColor }} />;
      }
    }
  }

  // Emoji (por defecto)
  return <span style={{ marginRight: '4px' }}>{fallbackEmoji}</span>;
};
import AddUserModal from './AddUserModal';
import UserProfileModal from './UserProfileModal';
import UserAvatar from './UserAvatar';
import ConfirmModal from './ConfirmModal';
import logger from '../utils/logger';

// Helper functions for user cards
const getAvatarColor = (role) => {
  const colors = {
    admin: '#f59e0b', // amber/orange
    teacher: '#7a8fa8', // purple
    trial_teacher: '#a78bfa', // light purple
    student: '#5b8fa3', // blue
    listener: '#10b981', // green
    trial: '#06b6d4', // cyan
  };
  return colors[role] || '#6b7280'; // gray fallback
};

/**
 * UniversalUserManager - Componente universal para gestión de usuarios
 * Adapta UI y funcionalidad según rol del usuario actual
 */
export default function UniversalUserManager({ user, userRole }) {
  const { can, isAdmin, initialized: permissionsReady } = usePermissions();
  const { showDeleteButtons } = useCardConfig();

  // Hook de gestión de usuarios con permisos
  const userManagement = useUserManagement(user, {
    canViewAll: can('view-all-users'),
    canManageRoles: can('edit-user-roles')
  });

  // Estados UI
  const [viewMode, setViewMode] = useState('table'); // 'table', 'grid', 'list'
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [badgeConfigVersion, setBadgeConfigVersion] = useState(0);

  // Ref para rastrear si ya se cargaron los usuarios en esta instancia
  const hasLoadedRef = useRef(false);

  // Escuchar cambios en la configuración de badges
  useEffect(() => {
    const handleBadgeConfigChange = () => {
      setBadgeConfigVersion(prev => prev + 1);
    };
    window.addEventListener('globalBadgeConfigChange', handleBadgeConfigChange);
    return () => window.removeEventListener('globalBadgeConfigChange', handleBadgeConfigChange);
  }, []);

  // Cargar usuarios cuando el usuario esté autenticado Y los permisos estén listos
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const hasUser = !!user?.uid;
      const canViewStudents = can('view-own-students');
      const canViewAll = can('view-all-users');
      const alreadyLoaded = hasLoadedRef.current;

      logger.debug(`🔍 useEffect triggered - hasUser: ${hasUser}, permissionsReady: ${permissionsReady}, canViewStudents: ${canViewStudents}, canViewAll: ${canViewAll}, alreadyLoaded: ${alreadyLoaded}`, 'UniversalUserManager');

      // Solo cargar si: hay usuario, permisos listos, tiene permisos, y no se ha cargado aún en esta instancia
      if (user?.uid && permissionsReady && (canViewStudents || canViewAll) && !alreadyLoaded) {
        hasLoadedRef.current = true;
        if (isMounted) {
          logger.debug('✅ Loading users...', 'UniversalUserManager');
          await userManagement.loadUsers();
        }
      } else {
        const reason = !user?.uid ? 'No user' :
                       !permissionsReady ? 'Permissions not ready' :
                       alreadyLoaded ? 'Already loaded' :
                       'No permissions';
        logger.debug(`❌ Skipping user load - Reason: ${reason}`, 'UniversalUserManager');
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, permissionsReady]); // Ejecutar cuando user.uid Y permissions estén listos

  // Detectar retorno del modo "Ver como" y reabrir perfil
  useEffect(() => {
    const viewAsReturnUserId = sessionStorage.getItem('viewAsReturnUserId');
    const viewAsReturning = sessionStorage.getItem('viewAsReturning');

    if (viewAsReturning === 'true' && viewAsReturnUserId && userManagement.users.length > 0) {
      // Encontrar el usuario en la lista
      const userToOpen = userManagement.users.find(u => u.id === viewAsReturnUserId);

      if (userToOpen) {
        logger.debug('🔙 Reabriendo perfil después de ViewAs:', userToOpen.name);
        setSelectedUserProfile(userToOpen);
        setShowUserProfile(true);
      }

      // Limpiar flags
      sessionStorage.removeItem('viewAsReturning');
      sessionStorage.removeItem('viewAsReturnUserId');
    }
  }, [userManagement.users]);

  /**
   * Crear usuario
   */
  const handleCreateUser = async (formData) => {
    try {
      console.log('🔥 INICIO - Creating user:', formData);
      logger.debug('📝 Creating user:', formData);
      const result = await createUser(formData);
      console.log('🔥 RESULTADO createUser:', result);

      if (result.success) {
        console.log('🔥 SUCCESS - Usuario creado, mostrando mensaje...');
        setSuccessMessage(
          isAdmin()
            ? `Usuario ${formData.name || formData.email} creado exitosamente`
            : `Alumno ${formData.name || formData.email} agregado exitosamente`
        );
        setTimeout(() => setSuccessMessage(''), 5000);

        // Esperar un momento para que Firestore sincronice los serverTimestamp()
        console.log('🔥 ⏳ Esperando 500ms para que Firestore sincronice...');
        logger.debug('⏳ Esperando 500ms para que Firestore sincronice...');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Recargar lista
        console.log('🔥 🔄 Recargando lista de usuarios...');
        logger.debug('🔄 Recargando lista de usuarios...');
        const reloadedUsers = await userManagement.loadUsers();
        console.log('🔥 ✅ Lista recargada. Total usuarios:', reloadedUsers?.length || 0);
        logger.debug('✅ Lista de usuarios recargada');
      }

      return result;
    } catch (error) {
      console.error('🔥 ❌ ERROR creating user:', error);
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
  const title = isAdmin() ? 'Usuarios' : 'Estudiantes';
  const TitleIcon = isAdmin() ? Crown : GraduationCap;
  const createButtonTooltip = isAdmin() ? 'Crear usuario' : 'Agregar alumno';

  // Loading state
  if (userManagement.loading && userManagement.users.length === 0) {
    return <BaseLoading size="large" text={`Cargando ${title.toLowerCase()}...`} />;
  }

  return (
    <div className="universal-user-manager p-0">
      {/* Header - Simplificado */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <TitleIcon size={24} strokeWidth={2} style={{ color: 'var(--color-text-primary)' }} />
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h1>
        </div>

        {/* Actions - Solo iconos */}
        <div className="flex gap-2">
          {can('create-users') && (
            <BaseButton
              onClick={() => setShowAddUserModal(true)}
              variant="primary"
              icon={Plus}
              title={createButtonTooltip}
              size="md"
            />
          )}
          <BaseButton
            onClick={userManagement.loadUsers}
            variant="secondary"
            icon={RefreshCw}
            title="Actualizar lista"
            size="md"
          />
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
        ) : viewMode === 'list' ? (
          /* Vista List - Usando UniversalCard layout="row" */
          <div className="flex flex-col gap-3">
            {userManagement.filteredUsers.map((userItem) => {
              // Construir badge de rol
              const badgeConfig = getBadgeByKey(`ROLE_${userItem.role.toUpperCase()}`);
              const bgColor = badgeConfig?.color || '#6b7280';
              const badgeStyles = getBadgeStyles(bgColor);
              const roleBadge = (
                <span
                  key={`badge-${userItem.uid}-${badgeConfigVersion}`}
                  className={`inline-flex items-center gap-1 ${getBadgeSizeClasses()} rounded-full font-semibold shadow-lg backdrop-blur-sm`}
                  style={badgeStyles}
                >
                  {renderBadgeIcon(`ROLE_${userItem.role.toUpperCase()}`, '👤', badgeStyles.color)}
                  {badgeConfig?.label || userItem.role}
                </span>
              );

              // Construir actions
              const userActions = can('delete-users') ? [
                <BaseButton
                  key="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserToDelete(userItem);
                    setShowDeleteConfirm(true);
                  }}
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                />
              ] : [];

              return (
                <UniversalCard
                  key={userItem.id}
                  layout="row"
                  variant="user"
                  userId={userItem.id}
                  userName={userItem.name}
                  userEmail={userItem.email}
                  title={userItem.name}
                  subtitle={userItem.email}
                  badges={[roleBadge]}
                  stats={[
                    { label: 'Créditos', value: userItem.credits || 0, icon: DollarSign }
                  ]}
                  actions={userActions}
                  onClick={() => handleViewUserProfile(userItem)}
                />
              );
            })}
          </div>
        ) : viewMode === 'grid' ? (
          /* Vista Grid con UniversalCard - Con UserAvatar */
          <CardGrid columnsType="default" gap="gap-4 md:gap-6">
            {userManagement.filteredUsers.map((userItem) => {
              return (
                <div
                  key={userItem.id}
                  className="bg-white dark:bg-gray-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleViewUserProfile(userItem)}
                >
                  {/* Avatar */}
                  <div className="flex justify-center mb-4">
                    <UserAvatar
                      userId={userItem.id}
                      name={userItem.name}
                      email={userItem.email}
                      size="xl"
                    />
                  </div>

                  {/* Nombre y Email */}
                  <div className="text-center mb-3">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {userItem.name || 'Sin nombre'}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                      {userItem.email}
                    </p>
                  </div>

                  {/* Badge de Rol */}
                  <div className="flex justify-center mb-3">
                    {(() => {
                      const badgeConfig = getBadgeByKey(`ROLE_${userItem.role.toUpperCase()}`);
                      const bgColor = badgeConfig?.color || '#6b7280';
                      const badgeStyles = getBadgeStyles(bgColor);
                      return (
                        <span
                          key={`badge-card-${userItem.uid}-${badgeConfigVersion}`}
                          className={`inline-flex items-center gap-1 ${getBadgeSizeClasses()} rounded-full font-semibold shadow-lg backdrop-blur-sm`}
                          style={badgeStyles}
                        >
                          {renderBadgeIcon(`ROLE_${userItem.role.toUpperCase()}`, '👤', badgeStyles.color)}
                          {badgeConfig?.label || userItem.role}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <DollarSign size={16} className="text-zinc-500" />
                    <span className="font-bold text-zinc-900 dark:text-white">{userItem.credits || 0}</span>
                    <span className="text-zinc-500">créditos</span>
                  </div>

                  {/* Delete Button - UNIFICADO (esquina inferior izquierda) - Respeta toggle global */}
                  {can('delete-users') && showDeleteButtons && (
                    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-start">
                      <CardDeleteButton
                        onDelete={async () => {
                          setUserToDelete(userItem);
                          setShowDeleteConfirm(true);
                        }}
                        variant="solid"
                        size="md"
                        confirmMessage={`¿Eliminar usuario "${userItem.name}"?`}
                        requireConfirm={false}  // No preguntar aquí, usamos modal separado
                      />
                    </div>
                  )}
                </div>
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
                    <div className="sortable-header">
                      <span>Nombre en Chino</span>
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
                  <th>
                    <div
                      onClick={() => userManagement.handleSort('createdAt')}
                      className={`sortable-header ${
                        userManagement.sortField === 'createdAt' ? 'active' : ''
                      }`}
                    >
                      <span>Fecha de Registro</span>
                      {userManagement.sortField === 'createdAt' ? (
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
                </tr>
              </thead>
              <tbody>
                {userManagement.filteredUsers.map((userItem) => (
                  <tr key={userItem.id}>
                    <td>
                      <div
                        className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition-opacity"
                        onClick={() => handleViewUserProfile(userItem)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleViewUserProfile(userItem);
                          }
                        }}
                      >
                        <UserAvatar
                          userId={userItem.id}
                          name={userItem.name}
                          email={userItem.email}
                          size="sm"
                        />
                        <span className="font-semibold">{userItem.name || 'Sin nombre'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm">
                        {userItem.chineseLastName && userItem.chineseFirstName
                          ? `${userItem.chineseLastName}${userItem.chineseFirstName}`
                          : userItem.chineseLastName || userItem.chineseFirstName || '-'
                        }
                      </span>
                    </td>
                    <td>{userItem.email}</td>
                    <td>
                      {(() => {
                        const badgeConfig = getBadgeByKey(`ROLE_${userItem.role.toUpperCase()}`);
                        const bgColor = badgeConfig?.color || '#6b7280';
                        const badgeStyles = getBadgeStyles(bgColor);
                        return (
                          <span
                            key={`badge-table-${userItem.uid}-${badgeConfigVersion}`}
                            className={`inline-flex items-center gap-1 ${getBadgeSizeClasses()} rounded-full font-semibold shadow-lg backdrop-blur-sm`}
                            style={badgeStyles}
                          >
                            {renderBadgeIcon(`ROLE_${userItem.role.toUpperCase()}`, '👤', badgeStyles.color)}
                            {badgeConfig?.label || userItem.role}
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      <span className="font-bold">{userItem.credits || 0}</span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {userItem.createdAt
                          ? new Date(userItem.createdAt.seconds * 1000).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'N/A'
                        }
                      </span>
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

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showUserProfile && !!selectedUserProfile}
        onClose={() => {
          setShowUserProfile(false);
          setSelectedUserProfile(null);
        }}
        user={selectedUserProfile}
        userRole={selectedUserProfile?.role}
        currentUserRole={userRole}
        currentUser={user}
        isAdmin={isAdmin()}
        onUpdate={handleUpdateUser}
      />
    </div>
  );
}
