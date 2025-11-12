/**
 * @fileoverview Tabla de usuarios para administradores
 * @module components/UsersTable
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import './UsersTable.css';
import {
  Crown,
  UserCog,
  GraduationCap,
  Ear,
  Target,
  FlaskConical,
  User,
  Search,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Ban
} from 'lucide-react';
import { ROLES, ROLE_INFO } from '../firebase/roleConfig';
import BaseButton from './common/BaseButton';

// Icon mapping for role icons
const ICON_MAP = {
  'Crown': Crown,
  'UserCog': UserCog,
  'GraduationCap': GraduationCap,
  'Ear': Ear,
  'Target': Target,
  'FlaskConical': FlaskConical,
  'User': User
};

/**
 * Tabla de usuarios con filtros y búsqueda
 */
function UsersTable({
  users,
  onUserClick,
  onRefresh,
  onAddUser,
  searchTerm,
  onSearchChange,
  filterRole,
  onFilterRoleChange,
  filterStatus,
  onFilterStatusChange,
  loading = false
}) {
  // Filtrar usuarios según criterios
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  /**
   * Renderiza el icono de rol
   */
  const renderRoleIcon = (roleKey) => {
    const roleInfo = ROLE_INFO[roleKey];
    if (!roleInfo) return <User size={18} />;

    const IconComponent = ICON_MAP[roleInfo.icon];
    if (!IconComponent) return <User size={18} />;

    return <IconComponent size={18} strokeWidth={2} />;
  };

  /**
   * Renderiza el badge de estado
   */
  const renderStatusBadge = (status) => {
    const statusConfig = {
      active: { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', label: 'Activo' },
      inactive: { icon: Clock, color: 'text-gray-500 dark:text-gray-400', label: 'Inactivo' },
      suspended: { icon: Ban, color: 'text-red-600 dark:text-red-400', label: 'Suspendido' },
      deleted: { icon: AlertTriangle, color: 'text-orange-500 dark:text-orange-400', label: 'Eliminado' }
    };

    const config = statusConfig[status] || statusConfig.inactive;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 ${config.color}`}>
        <Icon size={16} strokeWidth={2} />
        <span className="text-sm">{config.label}</span>
      </span>
    );
  };

  return (
    <div className="users-section">
      {/* Header */}
      <div className="users-header">
        <h2 className="section-title">
          <Crown size={28} strokeWidth={2} className="text-yellow-500" />
          Usuarios del Sistema
        </h2>
        <div className="users-actions">
          <button
            className="btn-icon-refresh"
            onClick={onRefresh}
            disabled={loading}
            title="Actualizar lista"
          >
            <RefreshCw size={20} strokeWidth={2} className={loading ? 'animate-spin' : ''} />
          </button>
          <BaseButton variant="primary" icon={Plus} onClick={onAddUser}>
            Nuevo Usuario
          </BaseButton>
        </div>
      </div>

      {/* Filtros */}
      <div className="users-filters">
        <div className="search-box">
          <Search size={18} strokeWidth={2} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => onFilterRoleChange(e.target.value)}
          className="filter-select"
        >
          <option value="all">Todos los roles</option>
          {Object.entries(ROLES).map(([key, value]) => (
            <option key={value} value={value}>
              {ROLE_INFO[value]?.label || value}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value)}
          className="filter-select"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="suspended">Suspendido</option>
          <option value="deleted">Eliminado</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Créditos</th>
              <th>Rol</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400">
                    {loading ? 'Cargando usuarios...' : 'No se encontraron usuarios'}
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((userItem) => (
                <tr
                  key={userItem.id}
                  onClick={() => onUserClick(userItem)}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="user-cell">
                    <div className="user-avatar">
                      <User size={20} strokeWidth={2} />
                    </div>
                    <span className="user-name">{userItem.name || 'Sin nombre'}</span>
                  </td>
                  <td className="email-cell">{userItem.email}</td>
                  <td className="credits-cell">{userItem.credits || 0}</td>
                  <td className="role-cell">
                    <div className="role-badge">
                      {renderRoleIcon(userItem.role)}
                      <span>{ROLE_INFO[userItem.role]?.label || userItem.role}</span>
                    </div>
                  </td>
                  <td className="status-cell">
                    {renderStatusBadge(userItem.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer con contador */}
      <div className="users-footer">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Mostrando {filteredUsers.length} de {users.length} usuarios
        </span>
      </div>
    </div>
  );
}

UsersTable.propTypes = {
  users: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    email: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    status: PropTypes.string,
    credits: PropTypes.number
  })).isRequired,
  onUserClick: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onAddUser: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  filterRole: PropTypes.string.isRequired,
  onFilterRoleChange: PropTypes.func.isRequired,
  filterStatus: PropTypes.string.isRequired,
  onFilterStatusChange: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default UsersTable;
