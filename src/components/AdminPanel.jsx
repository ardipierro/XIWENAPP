import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown, Users, UserCog, GraduationCap, CheckCircle, Ban,
  Search, RefreshCw, AlertTriangle, Clock, Settings, X
} from 'lucide-react';
import { getAllUsers, updateUserRole, updateUserStatus } from '../firebase/firestore';
import { ROLES, ROLE_INFO, isAdminEmail } from '../firebase/roleConfig';
import Navigation from './Navigation';
import './AdminPanel.css';

function AdminPanel({ user, userRole, onBack }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    teachers: 0,
    students: 0,
    active: 0,
    suspended: 0
  });

  // Cargar usuarios al montar
  useEffect(() => {
    loadUsers();
  }, []);

  // Calcular estadísticas cuando cambien los usuarios
  useEffect(() => {
    calculateStats();
  }, [users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      console.log('Usuarios cargados:', allUsers.length);
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
      showError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const newStats = {
      total: users.length,
      admins: users.filter(u => u.role === ROLES.ADMIN).length,
      teachers: users.filter(u => u.role === ROLES.TEACHER).length,
      students: users.filter(u => u.role === ROLES.STUDENT).length,
      active: users.filter(u => u.status === 'active').length,
      suspended: users.filter(u => u.status === 'suspended').length
    };
    setStats(newStats);
  };

  const handleRoleChange = async (userId, newRole) => {
    // No permitir cambiar el rol del propio admin principal
    const targetUser = users.find(u => u.id === userId);
    if (targetUser && isAdminEmail(targetUser.email) && user.email === targetUser.email) {
      showError('No puedes cambiar tu propio rol de admin');
      return;
    }

    try {
      const success = await updateUserRole(userId, newRole);
      if (success) {
        // Actualizar localmente
        setUsers(users.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        ));
        showSuccess(`Rol actualizado a ${ROLE_INFO[newRole].name}`);
      } else {
        showError('Error al actualizar rol');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error al actualizar rol');
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    // No permitir suspender al propio admin principal
    const user = users.find(u => u.id === userId);
    if (user && isAdminEmail(user.email) && newStatus === 'suspended') {
      showError('No puedes suspender al admin principal');
      return;
    }

    try {
      const success = await updateUserStatus(userId, newStatus);
      if (success) {
        // Actualizar localmente
        setUsers(users.map(u => 
          u.id === userId ? { ...u, status: newStatus } : u
        ));
        showSuccess(`Estado actualizado a ${newStatus}`);
      } else {
        showError('Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error al actualizar estado');
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="admin-panel-container">
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation user={user} userRole={userRole} />
      <div className="admin-panel-container">
        {/* Header */}
        <div className="admin-header">
          <h1 className="flex items-center gap-3">
            <Crown size={32} strokeWidth={2} /> Panel de Administración
          </h1>
          <p className="admin-subtitle">Gestión de usuarios y roles</p>
        </div>

      {/* Mensajes */}
      {successMessage && (
        <div className="message success-msg">
<CheckCircle size={18} strokeWidth={2} /> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="message error-msg">
<AlertTriangle size={18} strokeWidth={2} /> {errorMessage}
        </div>
      )}

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <Users size={36} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Usuarios</div>
          </div>
        </div>
        
        <div className="stat-card admins">
          <div className="stat-icon">
            <Crown size={36} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.admins}</div>
            <div className="stat-label">Administradores</div>
          </div>
        </div>
        
        <div className="stat-card teachers">
          <div className="stat-icon">
            <UserCog size={36} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.teachers}</div>
            <div className="stat-label">Profesores</div>
          </div>
        </div>
        
        <div className="stat-card students">
          <div className="stat-icon">
            <GraduationCap size={36} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.students}</div>
            <div className="stat-label">Alumnos</div>
          </div>
        </div>
        
        <div className="stat-card active">
          <div className="stat-icon">
            <CheckCircle size={36} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Activos</div>
          </div>
        </div>
        
        <div className="stat-card suspended">
          <div className="stat-icon">
            <Ban size={36} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.suspended}</div>
            <div className="stat-label">Suspendidos</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex gap-3 mb-3">
          <div className="search-box flex-1">
            <span className="search-icon">
              <Search size={18} strokeWidth={2} />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="input w-48"
          >
            <option value="all">Todos los roles</option>
            {Object.values(ROLES).map(role => (
              <option key={role} value={role}>
                {ROLE_INFO[role].icon} {ROLE_INFO[role].name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input w-48"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="suspended">Suspendidos</option>
          </select>

          {/* Toggle Vista */}
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vista de grilla"
            >
              ⊞
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vista de lista"
            >
              ☰
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            setSearchTerm('');
            setFilterRole('all');
            setFilterStatus('all');
          }}
          className="btn btn-outline btn-sm"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Users Grid/List */}
      <div className="users-section">
        <div className="users-header mb-6">
          <h2>Usuarios ({filteredUsers.length})</h2>
          <button onClick={loadUsers} className="btn btn-outline btn-sm">
            <RefreshCw size={18} strokeWidth={2} /> Actualizar
          </button>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="card text-center py-12">
            <div className="mb-4">
              <Users size={64} strokeWidth={2} className="text-gray-400 dark:text-gray-500 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No se encontraron usuarios
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Intenta con otros filtros de búsqueda
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Vista Grilla */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUsers.map((userItem) => (
              <div key={userItem.id} className="card flex flex-col" style={{ padding: '12px' }}>
                {/* Avatar con inicial */}
                <div className="card-image-placeholder">
                  <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center mx-auto">
                    <span className="text-2xl text-gray-700 dark:text-gray-200 font-bold">
                      {userItem.name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                </div>

                {/* Nombre */}
                <h3 className="card-title text-center">{userItem.name}</h3>

                {/* Email */}
                <p className="card-description text-center">{userItem.email}</p>

                {/* Badges */}
                <div className="card-badges justify-center">
                  {isAdminEmail(userItem.email) && (
                    <span className="badge bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                      <Crown size={14} strokeWidth={2} className="inline-icon" /> ADMIN PRINCIPAL
                    </span>
                  )}
                  <span className="badge badge-info">
                    {ROLE_INFO[userItem.role]?.icon} {ROLE_INFO[userItem.role]?.name}
                  </span>
                  <span className={`badge ${
                    userItem.status === 'active' ? 'badge-success' :
                    userItem.status === 'suspended' ? 'badge-error' : 'badge-warning'
                  }`}>
                    {userItem.status === 'active' && 'Activo'}
                    {userItem.status === 'suspended' && 'Suspendido'}
                    {userItem.status === 'pending' && 'Pendiente'}
                  </span>
                </div>

                {/* Stats */}
                <div className="card-stats justify-center">
                  <span className="flex items-center gap-1">
                    <Clock size={14} strokeWidth={2} /> {formatDate(userItem.createdAt)}
                  </span>
                </div>

                {/* Botones */}
                <div className="card-actions">
                  <button
                    className="btn btn-primary flex-1"
                    onClick={() => setSelectedUser(userItem)}
                  >
                    <Settings size={16} strokeWidth={2} /> Gestionar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Vista Lista */
          <div className="flex flex-col gap-3">
            {filteredUsers.map((userItem) => (
              <div key={userItem.id} className="card card-list">
                <div className="flex gap-4 items-start">
                  {/* Avatar pequeño */}
                  <div className="card-image-placeholder-sm">
                    <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-2xl text-gray-700 dark:text-gray-200 font-bold">
                        {userItem.name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  </div>

                  {/* Contenido principal */}
                  <div className="flex-1 min-w-0">
                    <h3 className="card-title">{userItem.name}</h3>
                    <p className="card-description">{userItem.email}</p>

                    {/* Stats */}
                    <div className="card-stats">
                      <span className="flex items-center gap-1">
                        <Clock size={14} strokeWidth={2} /> {formatDate(userItem.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="card-badges-list">
                    {isAdminEmail(userItem.email) && (
                      <span className="badge bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                        <Crown size={14} strokeWidth={2} className="inline-icon" /> ADMIN
                      </span>
                    )}
                    <span className="badge badge-info">
                      {ROLE_INFO[userItem.role]?.icon} {ROLE_INFO[userItem.role]?.name}
                    </span>
                    <span className={`badge ${
                      userItem.status === 'active' ? 'badge-success' :
                      userItem.status === 'suspended' ? 'badge-error' : 'badge-warning'
                    }`}>
                      {userItem.status === 'active' && 'Activo'}
                      {userItem.status === 'suspended' && 'Suspendido'}
                      {userItem.status === 'pending' && 'Pendiente'}
                    </span>
                  </div>

                  {/* Botones */}
                  <div className="card-actions-list">
                    <button
                      className="btn btn-primary"
                      onClick={() => setSelectedUser(userItem)}
                    >
                      <Settings size={16} strokeWidth={2} /> Gestionar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Gestionar Usuario */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{zIndex: 1000}}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Gestionar Usuario
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedUser.name}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="btn btn-ghost"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* User Info */}
            <div className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="text"
                  value={selectedUser.email}
                  className="input"
                  disabled
                />
              </div>

              <div>
                <label className="label">Rol</label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => {
                    handleRoleChange(selectedUser.id, e.target.value);
                    setSelectedUser({ ...selectedUser, role: e.target.value });
                  }}
                  className="input"
                  disabled={isAdminEmail(selectedUser.email) && user.email === selectedUser.email}
                >
                  {Object.values(ROLES).map(role => (
                    <option key={role} value={role}>
                      {ROLE_INFO[role].icon} {ROLE_INFO[role].name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Estado</label>
                <select
                  value={selectedUser.status || 'active'}
                  onChange={(e) => {
                    handleStatusChange(selectedUser.id, e.target.value);
                    setSelectedUser({ ...selectedUser, status: e.target.value });
                  }}
                  className="input"
                  disabled={isAdminEmail(selectedUser.email) && selectedUser.status === 'active'}
                >
                  <option value="active">Activo</option>
                  <option value="suspended">Suspendido</option>
                  <option value="pending">Pendiente</option>
                </select>
              </div>

              <div>
                <label className="label">Fecha de Registro</label>
                <input
                  type="text"
                  value={formatDate(selectedUser.createdAt)}
                  className="input"
                  disabled
                />
              </div>

              {isAdminEmail(selectedUser.email) && (
                <div className="alert alert-warning">
                  <AlertTriangle size={18} strokeWidth={2} className="inline-icon" /> Este es el administrador principal del sistema
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelectedUser(null)}
                className="btn btn-outline flex-1"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default AdminPanel;
