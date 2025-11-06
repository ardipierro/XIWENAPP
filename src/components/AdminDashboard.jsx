/**
 * @fileoverview Admin Dashboard - Panel de administración
 * @module components/AdminDashboard
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown, Users, UserCog, GraduationCap, CheckCircle, Ban,
  Plus, Search, ArrowUpDown, ArrowUp, ArrowDown, Shield, Settings, BarChart3
} from 'lucide-react';

import { getAllUsers } from '../firebase/users';
import { updateUserRole, updateUserStatus } from '../firebase/firestore';
import { ROLES, ROLE_INFO, isAdminEmail } from '../firebase/roleConfig';
import { safeAsync } from '../utils/errorHandler';
import logger from '../utils/logger';

import DashboardLayout from './DashboardLayout';
import AddUserModal from './AddUserModal';
import UserProfile from './UserProfile';
import './AdminDashboard.css';

// Icon mapping for roles
const ROLE_ICONS = {
  admin: Crown,
  teacher: UserCog,
  trial_teacher: UserCog,
  student: GraduationCap,
  listener: Users,
  trial: Users
};

/**
 * Admin Dashboard Component
 */
function AdminDashboard({ user, userRole, onLogout }) {
  const navigate = useNavigate();

  // Screen state
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // User management
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // UI state
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    teachers: 0,
    students: 0,
    active: 0,
    suspended: 0
  });

  // Check admin permission
  const isAdmin = isAdminEmail(user?.email) || userRole === 'admin';

  // Load data on mount
  useEffect(() => {
    if (!isAdmin) {
      navigate('/teacher');
      return;
    }
    loadUsers();
  }, [isAdmin, navigate]);

  /**
   * Load all users
   */
  const loadUsers = async () => {
    setLoading(true);

    const data = await safeAsync(
      () => getAllUsers(),
      {
        context: 'AdminDashboard',
        onError: (error) => showMessage('error', error.friendlyMessage)
      }
    );

    if (data) {
      setUsers(data);
      calculateStats(data);
    }

    setLoading(false);
  };

  /**
   * Calculate dashboard statistics
   */
  const calculateStats = (userList) => {
    const newStats = {
      total: userList.length,
      admins: userList.filter(u => u.role === 'admin').length,
      teachers: userList.filter(u => ['teacher', 'trial_teacher'].includes(u.role)).length,
      students: userList.filter(u => u.role === 'student').length,
      active: userList.filter(u => u.status === 'active').length,
      suspended: userList.filter(u => u.status === 'suspended').length
    };

    setStats(newStats);
  };

  /**
   * Show message to user
   */
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  /**
   * Update user role
   */
  const handleUpdateRole = async (userId, newRole) => {
    const result = await safeAsync(
      () => updateUserRole(userId, newRole),
      {
        context: 'AdminDashboard',
        onError: (error) => showMessage('error', error.friendlyMessage)
      }
    );

    if (result) {
      showMessage('success', 'Rol actualizado correctamente');
      await loadUsers();
    }
  };

  /**
   * Update user status
   */
  const handleUpdateStatus = async (userId, newStatus) => {
    const result = await safeAsync(
      () => updateUserStatus(userId, newStatus),
      {
        context: 'AdminDashboard',
        onError: (error) => showMessage('error', error.friendlyMessage)
      }
    );

    if (result) {
      showMessage('success', 'Estado actualizado correctamente');
      await loadUsers();
    }
  };

  /**
   * Handle user click
   */
  const handleUserClick = (userData) => {
    setSelectedUser(userData);
  };

  /**
   * Filter and sort users
   */
  const getFilteredUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  /**
   * Toggle sort
   */
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  /**
   * Menu actions
   */
  const handleMenuAction = (action) => {
    logger.debug('Admin menu action:', action);

    switch (action) {
      case 'dashboard':
        setCurrentScreen('dashboard');
        break;
      case 'users':
        setCurrentScreen('users');
        break;
      case 'analytics':
        setCurrentScreen('analytics');
        break;
      case 'settings':
        setCurrentScreen('settings');
        break;
      default:
        logger.warn('Unknown admin action:', action);
    }
  };

  // Render
  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout
      user={user}
      userRole={userRole}
      onLogout={onLogout}
      onMenuAction={handleMenuAction}
    >
      <div className="admin-dashboard admin-theme">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-header-content">
            <Shield className="admin-icon" size={32} />
            <div>
              <h1>Panel de Administración</h1>
              <p>Gestión completa del sistema</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`admin-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Content */}
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            stats={stats}
            onNavigate={setCurrentScreen}
          />
        )}

        {currentScreen === 'users' && (
          <UsersScreen
            users={getFilteredUsers()}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterRole={filterRole}
            setFilterRole={setFilterRole}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onUserClick={handleUserClick}
            onUpdateRole={handleUpdateRole}
            onUpdateStatus={handleUpdateStatus}
            onAddUser={() => setShowAddUserModal(true)}
            loading={loading}
          />
        )}

        {currentScreen === 'analytics' && (
          <AnalyticsScreen stats={stats} />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen />
        )}

        {/* Modals */}
        {showAddUserModal && (
          <AddUserModal
            onClose={() => setShowAddUserModal(false)}
            onUserAdded={() => {
              setShowAddUserModal(false);
              loadUsers();
            }}
          />
        )}

        {selectedUser && (
          <UserProfile
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onUpdate={loadUsers}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

/**
 * Dashboard Screen - Statistics Overview
 */
function DashboardScreen({ stats, onNavigate }) {
  const statCards = [
    { label: 'Total Usuarios', value: stats.total, icon: Users, color: 'blue', action: 'users' },
    { label: 'Administradores', value: stats.admins, icon: Crown, color: 'purple', action: 'users' },
    { label: 'Profesores', value: stats.teachers, icon: UserCog, color: 'green', action: 'users' },
    { label: 'Estudiantes', value: stats.students, icon: GraduationCap, color: 'orange', action: 'users' },
    { label: 'Activos', value: stats.active, icon: CheckCircle, color: 'teal', action: 'users' },
    { label: 'Suspendidos', value: stats.suspended, icon: Ban, color: 'red', action: 'users' }
  ];

  return (
    <div className="admin-dashboard-screen">
      <h2>Estadísticas del Sistema</h2>

      <div className="admin-stats-grid">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`admin-stat-card ${stat.color}`}
              onClick={() => onNavigate(stat.action)}
            >
              <div className="stat-icon">
                <Icon size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="admin-quick-actions">
        <h3>Acciones Rápidas</h3>
        <div className="quick-actions-grid">
          <button className="action-btn" onClick={() => onNavigate('users')}>
            <Users size={20} />
            Gestionar Usuarios
          </button>
          <button className="action-btn" onClick={() => onNavigate('analytics')}>
            <BarChart3 size={20} />
            Ver Analytics
          </button>
          <button className="action-btn" onClick={() => onNavigate('settings')}>
            <Settings size={20} />
            Configuración
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Users Screen - User Management
 */
function UsersScreen({
  users,
  searchTerm,
  setSearchTerm,
  filterRole,
  setFilterRole,
  filterStatus,
  setFilterStatus,
  sortField,
  sortDirection,
  onSort,
  onUserClick,
  onUpdateRole,
  onUpdateStatus,
  onAddUser,
  loading
}) {
  const SortIcon = sortDirection === 'asc' ? ArrowUp : ArrowDown;

  return (
    <div className="admin-users-screen">
      <div className="users-header">
        <h2>Gestión de Usuarios</h2>
        <button className="btn-primary" onClick={onAddUser}>
          <Plus size={16} />
          Crear Usuario
        </button>
      </div>

      {/* Filters */}
      <div className="users-filters">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="all">Todos los roles</option>
          {Object.entries(ROLE_INFO).map(([key, info]) => (
            <option key={key} value={key}>{info.displayName}</option>
          ))}
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="suspended">Suspendido</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="loading-state">Cargando usuarios...</div>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th onClick={() => onSort('name')}>
                  Nombre {sortField === 'name' && <SortIcon size={14} />}
                </th>
                <th onClick={() => onSort('email')}>
                  Email {sortField === 'email' && <SortIcon size={14} />}
                </th>
                <th onClick={() => onSort('role')}>
                  Rol {sortField === 'role' && <SortIcon size={14} />}
                </th>
                <th onClick={() => onSort('status')}>
                  Estado {sortField === 'status' && <SortIcon size={14} />}
                </th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userData) => (
                <UserRow
                  key={userData.id}
                  user={userData}
                  onUserClick={onUserClick}
                  onUpdateRole={onUpdateRole}
                  onUpdateStatus={onUpdateStatus}
                />
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="empty-state">
              No se encontraron usuarios
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * User Row Component
 */
function UserRow({ user: userData, onUserClick, onUpdateRole, onUpdateStatus }) {
  const RoleIcon = ROLE_ICONS[userData.role] || Users;
  const roleInfo = ROLE_INFO[userData.role];

  return (
    <tr onClick={() => onUserClick(userData)}>
      <td>
        <div className="user-cell">
          <RoleIcon size={16} />
          {userData.name || 'Sin nombre'}
        </div>
      </td>
      <td>{userData.email}</td>
      <td>
        <span className={`role-badge ${userData.role}`}>
          {roleInfo?.displayName || userData.role}
        </span>
      </td>
      <td>
        <span className={`status-badge ${userData.status}`}>
          {userData.status === 'active' ? 'Activo' : 'Suspendido'}
        </span>
      </td>
      <td>
        <div className="user-actions" onClick={(e) => e.stopPropagation()}>
          <select
            value={userData.role}
            onChange={(e) => onUpdateRole(userData.id, e.target.value)}
            className="role-select"
          >
            {Object.entries(ROLE_INFO).map(([key, info]) => (
              <option key={key} value={key}>{info.displayName}</option>
            ))}
          </select>

          <button
            className={`status-toggle ${userData.status}`}
            onClick={() => onUpdateStatus(
              userData.id,
              userData.status === 'active' ? 'suspended' : 'active'
            )}
          >
            {userData.status === 'active' ? <Ban size={14} /> : <CheckCircle size={14} />}
          </button>
        </div>
      </td>
    </tr>
  );
}

/**
 * Analytics Screen - Placeholder
 */
function AnalyticsScreen({ stats }) {
  return (
    <div className="admin-analytics-screen">
      <h2>Analytics</h2>
      <p>Vista de analytics (próximamente)</p>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  );
}

/**
 * Settings Screen - Placeholder
 */
function SettingsScreen() {
  return (
    <div className="admin-settings-screen">
      <h2>Configuración del Sistema</h2>
      <p>Configuración (próximamente)</p>
    </div>
  );
}

export default AdminDashboard;
