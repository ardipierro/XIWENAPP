import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, updateUserRole, updateUserStatus } from '../firebase/firestore';
import { ROLES, ROLE_INFO, isAdminEmail } from '../firebase/roleConfig';
import Navigation from './Navigation';
import './AdminPanel.css';

function AdminPanel({ user, userRole, onBack }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
      console.log('✅ Usuarios cargados:', allUsers.length);
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
          <h1>👑 Panel de Administración</h1>
          <p className="admin-subtitle">Gestión de usuarios y roles</p>
        </div>

      {/* Mensajes */}
      {successMessage && (
        <div className="message success-msg">
          ✅ {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="message error-msg">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Usuarios</div>
          </div>
        </div>
        
        <div className="stat-card admins">
          <div className="stat-icon">👑</div>
          <div className="stat-info">
            <div className="stat-value">{stats.admins}</div>
            <div className="stat-label">Administradores</div>
          </div>
        </div>
        
        <div className="stat-card teachers">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-info">
            <div className="stat-value">{stats.teachers}</div>
            <div className="stat-label">Profesores</div>
          </div>
        </div>
        
        <div className="stat-card students">
          <div className="stat-icon">👨‍🎓</div>
          <div className="stat-info">
            <div className="stat-value">{stats.students}</div>
            <div className="stat-label">Alumnos</div>
          </div>
        </div>
        
        <div className="stat-card active">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Activos</div>
          </div>
        </div>
        
        <div className="stat-card suspended">
          <div className="stat-icon">🚫</div>
          <div className="stat-info">
            <div className="stat-value">{stats.suspended}</div>
            <div className="stat-label">Suspendidos</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
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
            className="filter-select"
          >
            <option value="all">Todos los estados</option>
            <option value="active">✅ Activos</option>
            <option value="suspended">🚫 Suspendidos</option>
          </select>
          
          <button 
            onClick={() => {
              setSearchTerm('');
              setFilterRole('all');
              setFilterStatus('all');
            }}
            className="clear-filters-btn"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="users-section">
        <div className="users-header">
          <h2>Usuarios ({filteredUsers.length})</h2>
          <button onClick={loadUsers} className="refresh-btn">
            🔄 Actualizar
          </button>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="no-users">
            <p>No se encontraron usuarios con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(userItem => (
                  <tr key={userItem.id} className={userItem.status !== 'active' ? 'suspended-row' : ''}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {ROLE_INFO[userItem.role]?.icon || '👤'}
                        </div>
                        <div className="user-name">
                          {userItem.name}
                          {isAdminEmail(userItem.email) && (
                            <span className="admin-badge">ADMIN PRINCIPAL</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="email-cell">{userItem.email}</td>

                    <td>
                      <select
                        value={userItem.role}
                        onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                        className="role-select"
                        style={{ borderColor: ROLE_INFO[userItem.role]?.color }}
                        disabled={isAdminEmail(userItem.email) && user.email === userItem.email}
                      >
                        {Object.values(ROLES).map(role => (
                          <option key={role} value={role}>
                            {ROLE_INFO[role].icon} {ROLE_INFO[role].name}
                          </option>
                        ))}
                      </select>
                    </td>
                    
                    <td>
                      <select
                        value={userItem.status || 'active'}
                        onChange={(e) => handleStatusChange(userItem.id, e.target.value)}
                        className={`status-select ${userItem.status}`}
                        disabled={isAdminEmail(userItem.email) && userItem.status === 'active'}
                      >
                        <option value="active">✅ Activo</option>
                        <option value="suspended">🚫 Suspendido</option>
                        <option value="pending">⏳ Pendiente</option>
                      </select>
                    </td>

                    <td className="date-cell">
                      {formatDate(userItem.createdAt)}
                    </td>

                    <td>
                      <div className="actions-cell">
                        {userItem.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(userItem.id, 'suspended')}
                            className="action-btn suspend-btn"
                            disabled={isAdminEmail(userItem.email)}
                            title="Suspender usuario"
                          >
                            🚫
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(userItem.id, 'active')}
                            className="action-btn activate-btn"
                            title="Activar usuario"
                          >
                            ✅
                          </button>
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
    </div>
    </>
  );
}

export default AdminPanel;
