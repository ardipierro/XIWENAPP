import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loadStudents,
  loadGameHistory,
  loadCategories,
  loadCourses,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  enrollStudentInCourse,
  unenrollStudentFromCourse,
  getStudentEnrollments,
  getStudentEnrolledCoursesCount
} from '../firebase/firestore';
import { ROLES, ROLE_INFO, isAdminEmail } from '../firebase/roleConfig';
import DashboardLayout from './DashboardLayout';
import CoursesScreen from './CoursesScreen';
import GameContainer from './GameContainer';
import './TeacherDashboard.css';

function TeacherDashboard({ user, userRole, onLogout }) {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // dashboard, setup, courses, categories, history, users
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGames: 0,
    totalCategories: 0,
    totalCourses: 0
  });
  const [recentGames, setRecentGames] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para gestión de usuarios (solo Admin)
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Estados para asignación de cursos
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState({});
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  // Determinar si el usuario es admin
  const isAdmin = isAdminEmail(user?.email);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handlers de navegación
  const handleStartGame = () => {
    setCurrentScreen('setup');
  };

  const handleManageCategories = () => {
    alert('⚠️ Funcionalidad "Gestionar Categorías" próximamente.\n\nEsta característica estará disponible en una futura actualización.');
  };

  const handleViewHistory = () => {
    alert('⚠️ Funcionalidad "Ver Historial" próximamente.\n\nEsta característica estará disponible en una futura actualización.');
  };

  const handleManageCourses = () => {
    setCurrentScreen('courses');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
    loadDashboardData(); // Recargar datos al volver al dashboard
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Cargar alumnos
      const students = await loadStudents();
      const activeStudents = students.filter(s => s.active !== false);

      // Cargar historial de juegos
      const games = await loadGameHistory();

      // Cargar categorías
      const categories = await loadCategories();

      // Cargar cursos
      const allCourses = await loadCourses();
      const activeCourses = allCourses.filter(c => c.active !== false);
      setCourses(activeCourses);

      // Calcular top students
      const studentGameCounts = {};
      games.forEach(game => {
        game.players?.forEach(player => {
          if (!studentGameCounts[player.name]) {
            studentGameCounts[player.name] = {
              name: player.name,
              gamesPlayed: 0,
              totalScore: 0,
              avgScore: 0
            };
          }
          studentGameCounts[player.name].gamesPlayed++;
          studentGameCounts[player.name].totalScore += player.score || 0;
        });
      });

      const topStudentsArray = Object.values(studentGameCounts)
        .map(student => ({
          ...student,
          avgScore: student.totalScore / student.gamesPlayed
        }))
        .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
        .slice(0, 5);

      setStats({
        totalStudents: activeStudents.length,
        totalGames: games.length,
        totalCategories: Object.keys(categories).length,
        totalCourses: activeCourses.length
      });

      setRecentGames(games.slice(0, 5));
      setTopStudents(topStudentsArray);
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    }
    setLoading(false);
  };

  // Funciones para gestión de usuarios/alumnos
  const loadUsers = async () => {
    try {
      if (isAdmin) {
        // Admin ve todos los usuarios
        const allUsers = await getAllUsers();
        setUsers(allUsers);
        console.log('✅ Usuarios cargados:', allUsers.length);
      } else {
        // Profesores solo ven alumnos
        const allUsers = await getAllUsers();
        const students = allUsers.filter(u =>
          ['student', 'listener', 'trial'].includes(u.role)
        );
        setUsers(students);
        console.log('✅ Alumnos cargados:', students.length);
      }
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
      showError('Error al cargar usuarios');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const targetUser = users.find(u => u.id === userId);
    if (targetUser && isAdminEmail(targetUser.email) && user.email === targetUser.email) {
      showError('No puedes cambiar tu propio rol de admin');
      return;
    }

    try {
      const success = await updateUserRole(userId, newRole);
      if (success) {
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
    const targetUser = users.find(u => u.id === userId);
    if (targetUser && isAdminEmail(targetUser.email) && newStatus === 'suspended') {
      showError('No puedes suspender al admin principal');
      return;
    }

    try {
      const success = await updateUserStatus(userId, newStatus);
      if (success) {
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

  // Funciones para asignación de cursos
  const handleOpenEnrollmentModal = async (student) => {
    setSelectedStudent(student);
    setShowEnrollmentModal(true);
    setLoadingEnrollments(true);

    try {
      // Cargar inscripciones del estudiante
      const enrollments = await getStudentEnrollments(student.id);
      setStudentEnrollments(enrollments);
    } catch (error) {
      console.error('Error cargando inscripciones:', error);
      showError('Error al cargar cursos del alumno');
    }

    setLoadingEnrollments(false);
  };

  const handleCloseEnrollmentModal = () => {
    setShowEnrollmentModal(false);
    setSelectedStudent(null);
    setStudentEnrollments([]);
  };

  const handleEnrollCourse = async (courseId) => {
    if (!selectedStudent) return;

    try {
      const enrollmentId = await enrollStudentInCourse(selectedStudent.id, courseId);
      if (enrollmentId) {
        showSuccess('Curso asignado exitosamente');
        // Recargar inscripciones
        const enrollments = await getStudentEnrollments(selectedStudent.id);
        setStudentEnrollments(enrollments);
        // Actualizar contador
        loadEnrollmentCounts();
      } else {
        showError('Error al asignar curso');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error al asignar curso');
    }
  };

  const handleUnenrollCourse = async (courseId) => {
    if (!selectedStudent) return;

    const confirmed = window.confirm('¿Estás seguro de que deseas desasignar este curso?');
    if (!confirmed) return;

    try {
      const success = await unenrollStudentFromCourse(selectedStudent.id, courseId);
      if (success) {
        showSuccess('Curso desasignado exitosamente');
        // Recargar inscripciones
        const enrollments = await getStudentEnrollments(selectedStudent.id);
        setStudentEnrollments(enrollments);
        // Actualizar contador
        loadEnrollmentCounts();
      } else {
        showError('Error al desasignar curso');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error al desasignar curso');
    }
  };

  const loadEnrollmentCounts = async () => {
    try {
      const counts = {};
      for (const user of users) {
        const count = await getStudentEnrolledCoursesCount(user.id);
        counts[user.id] = count;
      }
      setEnrollmentCounts(counts);
    } catch (error) {
      console.error('Error cargando contadores de inscripciones:', error);
    }
  };

  const isEnrolled = (courseId) => {
    return studentEnrollments.some(enrollment => enrollment.course.id === courseId);
  };

  const filteredUsers = users.filter(userItem => {
    const matchesSearch =
      userItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || userItem.role === filterRole;
    const matchesStatus = filterStatus === 'all' || userItem.status === filterStatus;

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

  // Cargar usuarios cuando cambia a pantalla de usuarios
  useEffect(() => {
    if (currentScreen === 'users') {
      loadUsers();
    }
  }, [currentScreen]);

  // Cargar contadores de inscripciones cuando se cargan usuarios
  useEffect(() => {
    if (users.length > 0) {
      loadEnrollmentCounts();
    }
  }, [users]);

  // Obtener iniciales para el avatar
  const getUserInitials = () => {
    if (!user.email) return '?';
    return user.email.charAt(0).toUpperCase();
  };

  // Renderizar pantalla de carga
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando panel del profesor...</p>
        </div>
      </div>
    );
  }

  // Renderizar GameContainer (Crear Juego) - SIN Layout porque tiene su propia navegación
  if (currentScreen === 'setup') {
    return <GameContainer onBack={handleBackToDashboard} />;
  }

  // Renderizar CoursesScreen (Gestionar Cursos) - SIN Layout porque tiene su propia navegación
  if (currentScreen === 'courses') {
    return <CoursesScreen onBack={handleBackToDashboard} />;
  }

  // Renderizar Gestión de Usuarios/Alumnos - CON Layout
  if (currentScreen === 'users') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout}>
        <div className="user-management">
          {/* Header */}
          <div className="section-header">
            <button onClick={handleBackToDashboard} className="btn-back">
              ← Volver al Dashboard
            </button>
            <h1 className="section-title-main">
              {isAdmin ? '👑 Gestión de Usuarios' : '👥 Gestión de Alumnos'}
            </h1>
            <p className="section-subtitle">
              {isAdmin
                ? 'Administra usuarios, roles, permisos y asignación de cursos'
                : 'Gestiona tus alumnos y asigna cursos'
              }
            </p>
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

          {/* Filtros */}
          <div className="filters-section card">
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
          <div className="users-section card">
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
                      {isAdmin && <th>Rol</th>}
                      <th>Estado</th>
                      <th>Cursos Asignados</th>
                      {isAdmin && <th>Registro</th>}
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(userItem => (
                      <tr key={userItem.id} className={userItem.status !== 'active' ? 'suspended-row' : ''}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar-small">
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

                        {isAdmin && (
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
                        )}

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

                        <td className="courses-cell">
                          <div className="courses-cell-content">
                            <button
                              className="assign-courses-btn"
                              onClick={() => handleOpenEnrollmentModal(userItem)}
                            >
                              📚 Asignar Cursos
                            </button>
                            {enrollmentCounts[userItem.id] > 0 && (
                              <span className="enrolled-count">
                                {enrollmentCounts[userItem.id]} asignado{enrollmentCounts[userItem.id] > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </td>

                        {isAdmin && (
                          <td className="date-cell">
                            {formatDate(userItem.createdAt)}
                          </td>
                        )}

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

          {/* Modal de Asignación de Cursos */}
          {showEnrollmentModal && selectedStudent && (
            <div className="modal-overlay" onClick={handleCloseEnrollmentModal}>
              <div className="modal-content enrollment-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title">
                    📚 Asignar Cursos a {selectedStudent.name}
                  </h2>
                  <button className="modal-close-btn" onClick={handleCloseEnrollmentModal}>
                    ✕
                  </button>
                </div>

                <div className="modal-body">
                  {loadingEnrollments ? (
                    <div className="loading-spinner">
                      <div className="spinner"></div>
                      <p>Cargando cursos...</p>
                    </div>
                  ) : (
                    <>
                      {/* Cursos Asignados */}
                      {studentEnrollments.length > 0 && (
                        <div className="enrolled-courses-section">
                          <h3 className="section-subtitle">
                            ✅ Cursos Asignados ({studentEnrollments.length})
                          </h3>
                          <div className="courses-list">
                            {studentEnrollments.map(enrollment => (
                              <div key={enrollment.enrollmentId} className="course-item enrolled">
                                <div className="course-info">
                                  <div className="course-name">{enrollment.course.name}</div>
                                  <div className="course-meta">
                                    <span className="course-level">
                                      Nivel {enrollment.course.level || 1}
                                    </span>
                                    <span className="course-progress">
                                      {enrollment.progress?.percentComplete || 0}% completado
                                    </span>
                                  </div>
                                </div>
                                <button
                                  className="btn-unenroll"
                                  onClick={() => handleUnenrollCourse(enrollment.course.id)}
                                  title="Desasignar curso"
                                >
                                  ✕ Desasignar
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cursos Disponibles */}
                      <div className="available-courses-section">
                        <h3 className="section-subtitle">
                          📖 Cursos Disponibles
                        </h3>
                        {courses.length === 0 ? (
                          <div className="no-courses">
                            <p>No hay cursos creados aún.</p>
                            <p>Crea un curso primero para poder asignarlo.</p>
                          </div>
                        ) : (
                          <div className="courses-list">
                            {courses
                              .filter(course => !isEnrolled(course.id))
                              .map(course => (
                                <div key={course.id} className="course-item available">
                                  <div className="course-info">
                                    <div className="course-name">{course.name}</div>
                                    <div className="course-meta">
                                      <span className="course-level">
                                        Nivel {course.level || 1}
                                      </span>
                                      {course.description && (
                                        <span className="course-description">
                                          {course.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    className="btn-enroll"
                                    onClick={() => handleEnrollCourse(course.id)}
                                    title="Asignar curso"
                                  >
                                    + Asignar
                                  </button>
                                </div>
                              ))}
                            {courses.filter(course => !isEnrolled(course.id)).length === 0 && (
                              <div className="all-enrolled">
                                <p>✅ Todos los cursos ya han sido asignados</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="modal-footer">
                  <button className="btn btn-ghost" onClick={handleCloseEnrollmentModal}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Renderizar Dashboard Principal con el nuevo layout
  return (
    <>
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout}>
        <div className="teacher-dashboard">
          {/* Header del Dashboard */}
          <div className="dashboard-welcome">
            <h1 className="dashboard-title">
              {isAdmin ? '👑 Panel de Administración' : 'Panel del Profesor'}
            </h1>
            <p className="dashboard-subtitle">
              {isAdmin
                ? 'Gestiona todo el sistema: usuarios, cursos, juegos y configuración'
                : 'Bienvenido, gestiona tus cursos, juegos y alumnos'
              }
            </p>
          </div>

          <div className="dashboard-content">
            {/* Stats Section */}
            <section className="stats-section">
              <h2 className="section-title">📊 Resumen General</h2>
              <div className="stats-grid">
              <div className="stat-card card border-left-blue">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.totalStudents}</div>
                  <div className="stat-label">Alumnos totales</div>
                </div>
              </div>

              <div className="stat-card card border-left-green">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.totalCourses}</div>
                  <div className="stat-label">Cursos activos</div>
                </div>
              </div>

              <div className="stat-card card border-left-purple">
                <div className="stat-icon">🎮</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.totalGames}</div>
                  <div className="stat-label">Juegos totales</div>
                </div>
              </div>

              <div className="stat-card card border-left-orange">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.totalCategories}</div>
                  <div className="stat-label">Categorías</div>
                </div>
              </div>
            </div>
          </section>

          {/* Tarjetas Principales */}
          <section className="main-actions">
            <h2 className="section-title">🚀 Acciones Principales</h2>
            <div className="main-actions-grid">
              {/* Tarjeta 1: Crear Ejercicio/Juego */}
              <button className="main-action-card game-card" onClick={handleStartGame}>
                <div className="card-icon">🎮</div>
                <div className="card-content">
                  <h3 className="card-title">Crear Ejercicio</h3>
                  <p className="card-description">Configura un nuevo juego o quiz para tus alumnos</p>
                  <div className="card-stats">
                    <span className="stat-badge">{stats.totalGames} juegos creados</span>
                  </div>
                </div>
                <div className="card-arrow">→</div>
              </button>

              {/* Tarjeta 2: Crear Contenido */}
              <button className="main-action-card content-card" onClick={() => alert('Funcionalidad en desarrollo')}>
                <div className="card-icon">📄</div>
                <div className="card-content">
                  <h3 className="card-title">Crear Contenido</h3>
                  <p className="card-description">Crea lecciones individuales o importa desde archivo</p>
                  <div className="card-stats">
                    <span className="stat-badge coming-soon">Próximamente</span>
                  </div>
                </div>
                <div className="card-arrow">→</div>
              </button>

              {/* Tarjeta 3: Gestionar Cursos/Lecciones */}
              <button className="main-action-card course-card" onClick={handleManageCourses}>
                <div className="card-icon">📚</div>
                <div className="card-content">
                  <h3 className="card-title">Gestionar Cursos</h3>
                  <p className="card-description">Administra cursos y sus lecciones</p>
                  <div className="card-stats">
                    <span className="stat-badge">{courses.length} cursos activos</span>
                  </div>
                </div>
                <div className="card-arrow">→</div>
              </button>

              {/* Tarjeta 4: Gestionar Alumnos/Usuarios */}
              <button
                className={`main-action-card ${isAdmin ? 'admin-card' : 'students-card'}`}
                onClick={() => setCurrentScreen('users')}
              >
                <div className="card-icon">{isAdmin ? '👑' : '👥'}</div>
                <div className="card-content">
                  <h3 className="card-title">Gestionar Alumnos</h3>
                  <p className="card-description">
                    {isAdmin
                      ? 'Administra usuarios, roles, permisos y cursos asignados'
                      : 'Gestiona tus alumnos y asigna cursos'
                    }
                  </p>
                  <div className="card-stats">
                    <span className={`stat-badge ${isAdmin ? 'admin-badge-special' : ''}`}>
                      {stats.totalStudents} alumnos
                    </span>
                  </div>
                </div>
                <div className="card-arrow">→</div>
              </button>
            </div>
          </section>

          {/* Acciones Secundarias */}
          <section className="secondary-actions">
            <div className="secondary-actions-grid">
              <button className="secondary-action-btn" onClick={handleManageCategories}>
                <span className="action-icon">📂</span>
                <span className="action-label">Categorías</span>
              </button>
              <button className="secondary-action-btn" onClick={handleViewHistory}>
                <span className="action-icon">📊</span>
                <span className="action-label">Historial</span>
              </button>
            </div>
          </section>

          {/* Sección de Gráficos (Placeholder para futuro) */}
          <section className="analytics-section">
            <h2 className="section-title">📊 Análisis y Rendimiento</h2>
            <div className="analytics-grid">
              {/* Gráfico 1: Participación en Ejercicios */}
              <div className="analytics-card">
                <div className="analytics-header">
                  <h3 className="analytics-title">📈 Participación en Ejercicios</h3>
                  <span className="analytics-badge">Últimos 30 días</span>
                </div>
                <div className="analytics-placeholder">
                  <div className="placeholder-icon">📊</div>
                  <p className="placeholder-text">Gráfico de participación</p>
                  <p className="placeholder-subtext">Próximamente</p>
                </div>
              </div>

              {/* Gráfico 2: Progreso en Lecciones */}
              <div className="analytics-card">
                <div className="analytics-header">
                  <h3 className="analytics-title">📚 Progreso en Lecciones</h3>
                  <span className="analytics-badge">Por curso</span>
                </div>
                <div className="analytics-placeholder">
                  <div className="placeholder-icon">📖</div>
                  <p className="placeholder-text">Gráfico de progreso</p>
                  <p className="placeholder-subtext">Próximamente</p>
                </div>
              </div>

              {/* Gráfico 3: Rendimiento General */}
              <div className="analytics-card">
                <div className="analytics-header">
                  <h3 className="analytics-title">🎯 Rendimiento General</h3>
                  <span className="analytics-badge">Promedio del grupo</span>
                </div>
                <div className="analytics-placeholder">
                  <div className="placeholder-icon">📈</div>
                  <p className="placeholder-text">Gráfico de rendimiento</p>
                  <p className="placeholder-subtext">Próximamente</p>
                </div>
              </div>
            </div>
          </section>

          {/* Actividad Reciente y Top Students (más compactos) */}
          <div className="dashboard-grid">
            <section className="dashboard-section card">
              <h3 className="section-title">📈 Actividad Reciente</h3>
              <div className="recent-games-list">
                {recentGames.length > 0 ? (
                  recentGames.slice(0, 5).map((game, index) => (
                    <div key={index} className="recent-game-item">
                      <div className="game-icon">🎮</div>
                      <div className="game-info">
                        <div className="game-category">{game.category}</div>
                        <div className="game-meta">
                          <span className="game-date">
                            {new Date(game.date).toLocaleDateString('es-AR')}
                          </span>
                          <span className="game-players">
                            {game.players?.length || 0} jugadores
                          </span>
                        </div>
                      </div>
                      <div className="game-mode">{game.mode}</div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-small">
                    <div className="empty-icon">🎯</div>
                    <p>Aún no hay juegos creados</p>
                  </div>
                )}
              </div>
            </section>

            <section className="dashboard-section card">
              <h3 className="section-title">🏆 Alumnos Destacados</h3>
              <div className="top-students-list">
                {topStudents.length > 0 ? (
                  topStudents.map((student, index) => (
                    <div key={index} className="top-student-item">
                      <div className={`student-rank rank-${index + 1}`}>
                        #{index + 1}
                      </div>
                      <div className="student-info">
                        <div className="student-name">{student.name}</div>
                        <div className="student-stats">
                          {student.gamesPlayed} juegos · {student.avgScore.toFixed(0)} pts promedio
                        </div>
                      </div>
                      <div className="student-badge">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-small">
                    <div className="empty-icon">👥</div>
                    <p>Los alumnos aparecerán aquí cuando jueguen</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
      </DashboardLayout>
    </>
  );
}

export default TeacherDashboard;
