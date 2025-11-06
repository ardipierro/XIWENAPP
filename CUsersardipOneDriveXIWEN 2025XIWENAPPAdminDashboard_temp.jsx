import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Crown,
  Users,
  UserCog,
  GraduationCap,
  CheckCircle,
  Ban,
  RefreshCw,
  AlertTriangle,
  Plus,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  Target,
  Ear,
  FlaskConical,
  Settings,
  BarChart3,
  Shield
} from 'lucide-react';
import { getAllUsers } from '../firebase/users';
import { updateUserRole, updateUserStatus } from '../firebase/firestore';
import { getUserCredits } from '../firebase/credits';
import { ROLES, ROLE_INFO, isAdminEmail } from '../firebase/roleConfig';
import DashboardLayout from './DashboardLayout';
import AddUserModal from './AddUserModal';
import UserProfile from './UserProfile';
import SearchBar from './common/SearchBar';
import './AdminDashboard.css';

// Icon mapping for role icons from roleConfig
const ICON_MAP = {
  'Crown': Crown,
  'UserCog': UserCog,
  'GraduationCap': GraduationCap,
  'Ear': Ear,
  'Target': Target,
  'FlaskConical': FlaskConical,
  'User': User
};

function AdminDashboard({ user, userRole, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // dashboard, users, analytics, settings
  const [loading, setLoading] = useState(true);

  // Estados para gestión de usuarios
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('name'); // 'name', 'credits', 'email', 'role', 'status', 'createdAt'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Flag para evitar doble ejecución del useEffect de retorno
  const [hasProcessedReturn, setHasProcessedReturn] = useState(false);

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    teachers: 0,
    students: 0,
    active: 0,
    suspended: 0
  });

  // Verificar que el usuario sea admin
  const isAdmin = isAdminEmail(user?.email) || userRole === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/teacher'); // Redirigir si no es admin
      return;
    }
    loadDashboardData();
  }, []);

  // Detectar retorno de "Ver como"
  useEffect(() => {
    const returnUserId = sessionStorage.getItem('viewAsReturnUserId');
    if (returnUserId && users.length > 0 && !hasProcessedReturn) {
      console.log('🔄 [AdminDashboard] Detectado retorno de Ver como, userId:', returnUserId);
      setHasProcessedReturn(true);
      sessionStorage.removeItem('viewAsReturning');
      sessionStorage.removeItem('viewAsReturnUserId');

      // Abrir el perfil del usuario
      const targetUser = users.find(u => u.id === returnUserId);
      if (targetUser) {
        handleViewUserProfile(targetUser);
      }

      // Asegurar que estamos en la pantalla de usuarios
      setCurrentScreen('users');
    }
  }, [users, hasProcessedReturn]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await loadUsers();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const startTime = performance.now();
      const allUsers = await getAllUsers();
      console.log(`⏱️ [AdminDashboard] getAllUsers: ${(performance.now() - startTime).toFixed(0)}ms - ${allUsers.length} usuarios`);

      // Cargar créditos para cada usuario en paralelo
      const creditsStart = performance.now();
      const usersWithCredits = await Promise.all(
        allUsers.map(async (user) => {
          const credits = await getUserCredits(user.id);
          return {
            ...user,
            credits: credits?.availableCredits || 0
          };
        })
      );

      console.log(`⏱️ [AdminDashboard] Cargar créditos: ${(performance.now() - creditsStart).toFixed(0)}ms`);
      console.log(`⏱️ [AdminDashboard] TOTAL: ${(performance.now() - startTime).toFixed(0)}ms`);

      setUsers(usersWithCredits);
      calculateStats(usersWithCredits);
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
      showError('Error al cargar usuarios');
    }
  };

  const calculateStats = (usersList) => {
    const newStats = {
      total: usersList.length,
      admins: usersList.filter(u => u.role === ROLES.ADMIN).length,
      teachers: usersList.filter(u => u.role === ROLES.TEACHER || u.role === ROLES.TRIAL_TEACHER).length,
      students: usersList.filter(u => u.role === ROLES.STUDENT || u.role === ROLES.LISTENER || u.role === ROLES.TRIAL).length,
      active: usersList.filter(u => u.status === 'active').length,
      suspended: usersList.filter(u => u.status === 'suspended').length
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
        const updatedUsers = users.map(u =>
          u.id === userId ? { ...u, role: newRole } : u
        );
        setUsers(updatedUsers);
        calculateStats(updatedUsers);
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
    const targetUser = users.find(u => u.id === userId);
    if (targetUser && isAdminEmail(targetUser.email) && newStatus === 'suspended') {
      showError('No puedes suspender al admin principal');
      return;
    }

    try {
      const success = await updateUserStatus(userId, newStatus);
      if (success) {
        const updatedUsers = users.map(u =>
          u.id === userId ? { ...u, status: newStatus } : u
        );
        setUsers(updatedUsers);
        calculateStats(updatedUsers);
        showSuccess(`Estado actualizado a ${newStatus}`);
      } else {
        showError('Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error al actualizar estado');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleViewUserProfile = (userItem) => {
    setSelectedUserProfile(userItem);
    setShowUserProfile(true);
  };

  const handleCloseUserProfile = () => {
    setShowUserProfile(false);
    setSelectedUserProfile(null);
    // Recargar usuarios después de cerrar perfil (por si hubo cambios)
    loadUsers();
  };

  const handleUserCreated = () => {
    setShowAddUserModal(false);
    loadUsers();
    showSuccess('Usuario creado exitosamente');
  };

  const handleMenuAction = (action) => {
    setCurrentScreen(action);
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  // Filtrar y ordenar usuarios
  const filteredUsers = users
    .filter(userItem => {
      const matchesSearch =
        userItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = filterRole === 'all' || userItem.role === filterRole;
      const matchesStatus = filterStatus === 'all' || userItem.status === filterStatus;

      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      let aVal, bVal;

      switch(sortField) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'email':
          aVal = a.email?.toLowerCase() || '';
          bVal = b.email?.toLowerCase() || '';
          break;
        case 'credits':
          aVal = a.credits || 0;
          bVal = b.credits || 0;
          break;
        case 'role':
          aVal = a.role || '';
          bVal = b.role || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'createdAt':
          aVal = a.createdAt?.seconds || 0;
          bVal = b.createdAt?.seconds || 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
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

  // Loading state
  if (loading) {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando panel de administración...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Renderizar gestión de usuarios
  if (currentScreen === 'users') {
    // Mostrar loading si estamos procesando retorno de Ver Como
    if (sessionStorage.getItem('viewAsReturning') === 'true' && !hasProcessedReturn) {
      return (
        <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
          <div className="loading-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div className="spinner"></div>
            <p>Volviendo...</p>
          </div>
        </DashboardLayout>
      );
    }

    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <div className="admin-users-section">
          {/* Botón Volver */}
          <button onClick={handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Volver a Inicio
          </button>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Shield size={32} strokeWidth={2} className="text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestión de Usuarios</h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button onClick={() => setShowAddUserModal(true)} className="btn btn-primary w-full sm:w-auto">
                <Plus size={18} strokeWidth={2} /> Nuevo Usuario
              </button>
              <button onClick={loadUsers} className="btn btn-primary !bg-green-600 hover:!bg-green-700 w-full sm:w-auto" title="Actualizar lista de usuarios">
                <RefreshCw size={18} strokeWidth={2} /> Actualizar
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar usuarios..."
            className="mb-6"
          />

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

          {/* Tabla de usuarios */}
          <div className="users-section">
            {sessionStorage.getItem('viewAsReturnUserId') && !hasProcessedReturn && users.length === 0 ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Cargando...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="no-users">
                <p>No se encontraron usuarios con los filtros seleccionados</p>
              </div>
            ) : (
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>
                        <div onClick={() => handleSort('name')} className={`sortable-header ${sortField === 'name' ? 'active' : ''}`}>
                          <span>Usuario</span>
                          {sortField === 'name' ? (
                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="sort-icon-inactive" />
                          )}
                        </div>
                      </th>
                      <th>
                        <div onClick={() => handleSort('credits')} className={`sortable-header ${sortField === 'credits' ? 'active' : ''}`}>
                          <span>Créditos</span>
                          {sortField === 'credits' ? (
                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="sort-icon-inactive" />
                          )}
                        </div>
                      </th>
                      <th>
                        <div onClick={() => handleSort('role')} className={`sortable-header ${sortField === 'role' ? 'active' : ''}`}>
                          <span>Rol</span>
                          {sortField === 'role' ? (
                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="sort-icon-inactive" />
                          )}
                        </div>
                      </th>
                      <th>
                        <div onClick={() => handleSort('status')} className={`sortable-header ${sortField === 'status' ? 'active' : ''}`}>
                          <span>Estado</span>
                          {sortField === 'status' ? (
                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="sort-icon-inactive" />
                          )}
                        </div>
                      </th>
                      <th>
                        <div onClick={() => handleSort('createdAt')} className={`sortable-header ${sortField === 'createdAt' ? 'active' : ''}`}>
                          <span>Registro</span>
                          {sortField === 'createdAt' ? (
                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="sort-icon-inactive" />
                          )}
                        </div>
                      </th>
                      <th>
                        <div onClick={() => handleSort('email')} className={`sortable-header ${sortField === 'email' ? 'active' : ''}`}>
                          <span>Email</span>
                          {sortField === 'email' ? (
                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="sort-icon-inactive" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(userItem => (
                      <tr key={userItem.id} className={userItem.status !== 'active' ? 'suspended-row' : ''}>
                        <td>
                          <div
                            className="user-cell clickable"
                            onClick={() => handleViewUserProfile(userItem)}
                            title="Ver perfil completo"
                          >
                            <div className="user-avatar-small">
                              {(() => {
                                const iconName = ROLE_INFO[userItem.role]?.icon || 'User';
                                const IconComponent = ICON_MAP[iconName] || User;
                                return <IconComponent size={18} strokeWidth={2} />;
                              })()}
                            </div>
                            <div className="user-info">
                              <div className="user-name">{userItem.name || 'Sin nombre'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="credits-badge">
                            {userItem.credits || 0}
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge role-${userItem.role}`}>
                            {ROLE_INFO[userItem.role]?.name || userItem.role}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-${userItem.status || 'active'}`}>
                            {userItem.status === 'active' ? 'Activo' :
                             userItem.status === 'suspended' ? 'Suspendido' :
                             'Pendiente'}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(userItem.createdAt)}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {userItem.email}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modales */}
        {showAddUserModal && (
          <AddUserModal
            onClose={() => setShowAddUserModal(false)}
            onUserCreated={handleUserCreated}
            currentUser={user}
            isAdmin={isAdmin}
          />
        )}

        {showUserProfile && selectedUserProfile && (
          <UserProfile
            user={selectedUserProfile}
            currentUser={user}
            onClose={handleCloseUserProfile}
            onRoleChange={handleRoleChange}
            onStatusChange={handleStatusChange}
            isAdmin={isAdmin}
          />
        )}
      </DashboardLayout>
    );
  }

  // Dashboard principal - Overview con estadísticas
  return (
    <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
      <div className="admin-dashboard-container">
        {/* Header */}
        <div className="admin-header">
          <div className="flex items-center gap-3 mb-2">
            <Crown size={40} strokeWidth={2} className="text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Panel de Administración</h1>
          </div>
          <p className="section-subtitle">Gestión completa del sistema XIWEN</p>
        </div>

        {/* Estadísticas */}
        <div className="stats-grid">
          <div className="admin-stat-card stat-total">
            <div className="stat-icon">
              <Users size={36} strokeWidth={2} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Usuarios</div>
            </div>
          </div>

          <div className="admin-stat-card stat-admins">
            <div className="stat-icon">
              <Crown size={36} strokeWidth={2} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.admins}</div>
              <div className="stat-label">Administradores</div>
            </div>
          </div>

          <div className="admin-stat-card stat-teachers">
            <div className="stat-icon">
              <UserCog size={36} strokeWidth={2} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.teachers}</div>
              <div className="stat-label">Profesores</div>
            </div>
          </div>

          <div className="admin-stat-card stat-students">
            <div className="stat-icon">
              <GraduationCap size={36} strokeWidth={2} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.students}</div>
              <div className="stat-label">Estudiantes</div>
            </div>
          </div>

          <div className="admin-stat-card stat-active">
            <div className="stat-icon">
              <CheckCircle size={36} strokeWidth={2} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Activos</div>
            </div>
          </div>

          <div className="admin-stat-card stat-suspended">
            <div className="stat-icon">
              <Ban size={36} strokeWidth={2} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.suspended}</div>
              <div className="stat-label">Suspendidos</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="admin-actions-section">
          <h2 className="section-title">Acciones Rápidas</h2>
          <div className="actions-grid">
            <button
              onClick={() => setCurrentScreen('users')}
              className="action-card action-primary"
            >
              <div className="action-icon">
                <Shield size={32} strokeWidth={2} />
              </div>
              <div className="action-info">
                <div className="action-title">Gestionar Usuarios</div>
                <div className="action-description">Ver, crear y administrar usuarios del sistema</div>
              </div>
            </button>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="action-card"
            >
              <div className="action-icon">
                <Plus size={32} strokeWidth={2} />
              </div>
              <div className="action-info">
                <div className="action-title">Crear Usuario</div>
                <div className="action-description">Agregar un nuevo usuario al sistema</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/teacher')}
              className="action-card"
            >
              <div className="action-icon">
                <UserCog size={32} strokeWidth={2} />
              </div>
              <div className="action-info">
                <div className="action-title">Panel Profesor</div>
                <div className="action-description">Ir al panel de profesor</div>
              </div>
            </button>

            <button
              className="action-card"
              disabled
            >
              <div className="action-icon opacity-50">
                <Settings size={32} strokeWidth={2} />
              </div>
              <div className="action-info">
                <div className="action-title">Configuración</div>
                <div className="action-description">Próximamente</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Modales */}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onUserCreated={handleUserCreated}
          currentUser={user}
          isAdmin={isAdmin}
        />
      )}
    </DashboardLayout>
  );
}

export default AdminDashboard;
