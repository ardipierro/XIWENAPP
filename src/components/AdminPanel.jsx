import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown, Users, UserCog, GraduationCap, CheckCircle, Ban,
  RefreshCw, AlertTriangle, Clock, Settings, X, Coins
} from 'lucide-react';
import { getAllUsers, updateUserRole, updateUserStatus } from '../firebase/firestore';
import { ROLES, ROLE_INFO, isAdminEmail } from '../firebase/roleConfig';
import { getUserCredits } from '../firebase/credits';
import Navigation from './Navigation';
import SearchBar from './common/SearchBar';
import { BaseModal, BaseButton } from './common';
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
      const startTime = performance.now();

      const allUsers = await getAllUsers();
      logger.debug(`⏱️ [AdminPanel] getAllUsers: ${(performance.now() - startTime).toFixed(0)}ms - ${allUsers.length} usuarios`);

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

      logger.debug(`⏱️ [AdminPanel] Cargar créditos: ${(performance.now() - creditsStart).toFixed(0)}ms`);
      logger.debug(`⏱️ [AdminPanel] TOTAL: ${(performance.now() - startTime).toFixed(0)}ms`);

      setUsers(usersWithCredits);
    } catch (error) {
      logger.error('❌ Error cargando usuarios:', error);
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
      logger.error('Error:', error);
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
      logger.error('Error:', error);
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
          <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
            <Crown size={32} strokeWidth={2} className="text-gray-700 dark:text-gray-300" /> Panel de Administración
          </h1>
          <p className="section-subtitle">Usuarios y roles</p>
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

      {/* Modal Gestionar Usuario */}
      <BaseModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Gestionar Usuario"
        subtitle={selectedUser?.name}
        size="lg"
        footer={
          <BaseButton
            onClick={() => setSelectedUser(null)}
            variant="ghost"
          >
            Cerrar
          </BaseButton>
        }
      >
        {selectedUser && (
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
          )}
      </BaseModal>
    </div>
    </>
  );
}

export default AdminPanel;
