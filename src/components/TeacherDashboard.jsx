import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Gamepad2,
  FileText,
  BookOpen,
  Crown,
  Users,
  UsersRound,
  BarChart3,
  Folder,
  Rocket,
  Calendar,
  TrendingUp,
  Search,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Ban,
  Check,
  ClipboardList,
  Medal,
  User,
  GraduationCap,
  UserCog,
  Ear,
  FlaskConical
} from 'lucide-react';
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
import {
  assignToStudent,
  removeFromStudent,
  getStudentAssignments
} from '../firebase/relationships';
import { getContentByTeacher } from '../firebase/content';
import { getExercisesByTeacher } from '../firebase/exercises';
import { createUser } from '../firebase/users';
import { ROLES, ROLE_INFO, isAdminEmail } from '../firebase/roleConfig';
import DashboardLayout from './DashboardLayout';
import CoursesScreen from './CoursesScreen';
import GameContainer from './GameContainer';
import ExerciseManager from './ExerciseManager';
import ContentManager from './ContentManager';
import GroupManager from './GroupManager';
import ClassManager from './ClassManager';
import ClassManagement from './ClassManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import AttendanceView from './AttendanceView';
import AddUserModal from './AddUserModal';
import UserProfile from './UserProfile';
import ExercisePlayer from './exercises/ExercisePlayer';
import './TeacherDashboard.css';

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

function TeacherDashboard({ user, userRole, onLogout }) {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // dashboard, setup, courses, categories, history, users, playExercise
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
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
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Estados para asignación de recursos (cursos, contenido, ejercicios)
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [activeResourceTab, setActiveResourceTab] = useState('courses'); // 'courses', 'content', 'exercises'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [studentContent, setStudentContent] = useState([]);
  const [studentExercises, setStudentExercises] = useState([]);
  const [allContent, setAllContent] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState({});
  const [loadingResources, setLoadingResources] = useState(false);

  // Determinar si el usuario es admin
  const isAdmin = isAdminEmail(user?.email);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handlers de navegación
  const handleStartGame = () => {
    setCurrentScreen('setup');
  };

  const handleManageExercises = () => {
    setCurrentScreen('exercises');
  };

  const handleManageContent = () => {
    setCurrentScreen('content');
  };

  const handleManageGroups = () => {
    setCurrentScreen('groups');
  };

  const handleViewAnalytics = () => {
    setCurrentScreen('analytics');
  };

  const handleManageCategories = () => {
    alert('Funcionalidad "Gestionar Categorías" próximamente.\n\nEsta característica estará disponible en una futura actualización.');
  };

  const handleViewHistory = () => {
    alert('Funcionalidad "Ver Historial" próximamente.\n\nEsta característica estará disponible en una futura actualización.');
  };

  const handleManageCourses = () => {
    setCurrentScreen('courses');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
    setSelectedExerciseId(null);
    setShowUserProfile(false);
    setSelectedUserProfile(null);
    loadDashboardData(); // Recargar datos al volver al dashboard
  };

  const handlePlayExercise = (exerciseId) => {
    setSelectedExerciseId(exerciseId);
    setCurrentScreen('playExercise');
  };

  const handleViewUserProfile = (userItem) => {
    setSelectedUserProfile(userItem);
    setShowUserProfile(true);
  };

  const handleBackFromProfile = () => {
    setShowUserProfile(false);
    setSelectedUserProfile(null);
  };

  const handleProfileUpdate = async () => {
    // Recargar usuarios después de actualizar el perfil
    await loadUsers();
  };

  const handleMenuAction = (action) => {
    // Mapear las acciones del menú lateral a las vistas del dashboard
    const actionMap = {
      'dashboard': 'dashboard',
      'exercises': 'exercises',
      'content': 'content',
      'courses': 'courses',
      'groups': 'groups',
      'classes': 'classes',
      'attendance': 'attendance',
      'setup': 'setup',
      'analytics': 'analytics',
      'users': 'users'
    };

    const screen = actionMap[action];

    if (screen) {
      setCurrentScreen(screen);
      setSelectedExerciseId(null);
    }
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
        console.log('Usuarios cargados:', allUsers.length);
      } else {
        // Profesores solo ven alumnos
        const allUsers = await getAllUsers();
        const students = allUsers.filter(u =>
          ['student', 'listener', 'trial'].includes(u.role)
        );
        setUsers(students);
        console.log('Alumnos cargados:', students.length);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
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

  // Función para crear un nuevo usuario
  const handleCreateUser = async (userData) => {
    try {
      const result = await createUser({
        ...userData,
        createdBy: user.uid
      });

      if (result.success) {
        showSuccess(`Usuario ${userData.email} creado exitosamente`);
        // Recargar la lista de usuarios
        await loadUsers();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      return { success: false, error: 'Error inesperado al crear usuario' };
    }
  };

  // Funciones para asignación de recursos
  const handleOpenResourceModal = async (student, initialTab = 'courses') => {
    setSelectedStudent(student);
    setActiveResourceTab(initialTab);
    setShowResourceModal(true);
    setLoadingResources(true);

    try {
      // Cargar inscripciones de cursos (método legacy)
      const enrollments = await getStudentEnrollments(student.id);
      setStudentEnrollments(enrollments);

      // Cargar asignaciones directas (contenido y ejercicios)
      const assignments = await getStudentAssignments(student.id);

      // Filtrar contenido y ejercicios asignados
      const assignedContent = assignments.filter(a => a.itemType === 'content');
      const assignedExercises = assignments.filter(a => a.itemType === 'exercise');

      setStudentContent(assignedContent);
      setStudentExercises(assignedExercises);

      // Cargar todo el contenido y ejercicios disponibles del profesor
      const teacherContent = await getContentByTeacher(user.uid);
      const teacherExercises = await getExercisesByTeacher(user.uid);

      setAllContent(teacherContent);
      setAllExercises(teacherExercises);

    } catch (error) {
      console.error('Error cargando recursos:', error);
      showError('Error al cargar recursos del alumno');
    }

    setLoadingResources(false);
  };

  const handleCloseResourceModal = () => {
    setShowResourceModal(false);
    setSelectedStudent(null);
    setStudentEnrollments([]);
    setStudentContent([]);
    setStudentExercises([]);
    setActiveResourceTab('courses');
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

  // Funciones para asignación de contenido
  const handleAssignContent = async (contentId) => {
    if (!selectedStudent) return;

    try {
      await assignToStudent(selectedStudent.id, 'content', contentId, user.uid);
      showSuccess('Contenido asignado exitosamente');

      // Recargar asignaciones
      const assignments = await getStudentAssignments(selectedStudent.id);
      const assignedContent = assignments.filter(a => a.itemType === 'content');
      setStudentContent(assignedContent);
    } catch (error) {
      console.error('Error:', error);
      showError('Error al asignar contenido');
    }
  };

  const handleRemoveContent = async (contentId) => {
    if (!selectedStudent) return;

    const confirmed = window.confirm('¿Estás seguro de que deseas desasignar este contenido?');
    if (!confirmed) return;

    try {
      await removeFromStudent(selectedStudent.id, 'content', contentId);
      showSuccess('Contenido desasignado exitosamente');

      // Recargar asignaciones
      const assignments = await getStudentAssignments(selectedStudent.id);
      const assignedContent = assignments.filter(a => a.itemType === 'content');
      setStudentContent(assignedContent);
    } catch (error) {
      console.error('Error:', error);
      showError('Error al desasignar contenido');
    }
  };

  const isContentAssigned = (contentId) => {
    return studentContent.some(sc => sc.itemId === contentId);
  };

  // Funciones para asignación de ejercicios
  const handleAssignExercise = async (exerciseId) => {
    if (!selectedStudent) return;

    try {
      await assignToStudent(selectedStudent.id, 'exercise', exerciseId, user.uid);
      showSuccess('Ejercicio asignado exitosamente');

      // Recargar asignaciones
      const assignments = await getStudentAssignments(selectedStudent.id);
      const assignedExercises = assignments.filter(a => a.itemType === 'exercise');
      setStudentExercises(assignedExercises);
    } catch (error) {
      console.error('Error:', error);
      showError('Error al asignar ejercicio');
    }
  };

  const handleRemoveExercise = async (exerciseId) => {
    if (!selectedStudent) return;

    const confirmed = window.confirm('¿Estás seguro de que deseas desasignar este ejercicio?');
    if (!confirmed) return;

    try {
      await removeFromStudent(selectedStudent.id, 'exercise', exerciseId);
      showSuccess('Ejercicio desasignado exitosamente');

      // Recargar asignaciones
      const assignments = await getStudentAssignments(selectedStudent.id);
      const assignedExercises = assignments.filter(a => a.itemType === 'exercise');
      setStudentExercises(assignedExercises);
    } catch (error) {
      console.error('Error:', error);
      showError('Error al desasignar ejercicio');
    }
  };

  const isExerciseAssigned = (exerciseId) => {
    return studentExercises.some(se => se.itemId === exerciseId);
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

  // Renderizar CoursesScreen (Gestionar Cursos) - CON Layout
  if (currentScreen === 'courses') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <CoursesScreen onBack={handleBackToDashboard} user={user} />
      </DashboardLayout>
    );
  }

  // Renderizar ExercisePlayer (Jugar Ejercicio) - SIN Layout, pantalla completa
  if (currentScreen === 'playExercise' && selectedExerciseId) {
    return (
      <ExercisePlayer
        exerciseId={selectedExerciseId}
        user={user}
        onBack={handleBackToDashboard}
        onComplete={(results) => {
          console.log('Ejercicio completado:', results);
          // Aquí podrías guardar resultados en Firebase
        }}
      />
    );
  }

  // Renderizar Gestión de Ejercicios - CON Layout
  if (currentScreen === 'exercises') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <div className="exercises-management">
          <button onClick={handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Volver a Inicio
          </button>
          <ExerciseManager user={user} courses={courses} onPlayExercise={handlePlayExercise} />
        </div>
      </DashboardLayout>
    );
  }

  // Renderizar Gestión de Contenido - CON Layout
  if (currentScreen === 'content') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <div className="content-management">
          <button onClick={handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Volver a Inicio
          </button>
          <ContentManager user={user} courses={courses} />
        </div>
      </DashboardLayout>
    );
  }

  // Renderizar Gestión de Grupos - CON Layout
  if (currentScreen === 'groups') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <div className="groups-management">
          <button onClick={handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Volver a Inicio
          </button>
          <GroupManager user={user} courses={courses} />
        </div>
      </DashboardLayout>
    );
  }

  // Renderizar Class Manager (Clases Recurrentes) - CON Layout
  if (currentScreen === 'classes') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <div className="classes-management-section">
          <button onClick={handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Volver a Inicio
          </button>
          <ClassManager user={user} courses={courses} />
        </div>
      </DashboardLayout>
    );
  }

  // Renderizar Analytics Dashboard - CON Layout
  if (currentScreen === 'analytics') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <div className="analytics-section">
          <button onClick={handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Volver a Inicio
          </button>
          <AnalyticsDashboard user={user} />
        </div>
      </DashboardLayout>
    );
  }

  // Renderizar Vista de Asistencia - CON Layout
  if (currentScreen === 'attendance') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <div className="attendance-section">
          <button onClick={handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Volver a Inicio
          </button>
          <AttendanceView teacher={user} />
        </div>
      </DashboardLayout>
    );
  }

  // Renderizar Perfil de Usuario
  if (currentScreen === 'users' && showUserProfile && selectedUserProfile) {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <UserProfile
          selectedUser={selectedUserProfile}
          currentUser={user}
          isAdmin={isAdmin}
          onBack={handleBackFromProfile}
          onUpdate={handleProfileUpdate}
        />
      </DashboardLayout>
    );
  }

  // Renderizar Gestión de Usuarios/Alumnos - CON Layout
  if (currentScreen === 'users') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <div className="user-management">
          {/* Header */}
          <div className="mb-6">
            <button onClick={handleBackToDashboard} className="btn btn-ghost mb-4">
              ← Volver a Inicio
            </button>
            <div className="flex items-center gap-3">
              {isAdmin ? (
                <>
                  <Crown size={32} strokeWidth={2} className="text-gray-700 dark:text-gray-300" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Usuarios</h1>
                </>
              ) : (
                <>
                  <Users size={32} strokeWidth={2} className="text-gray-700 dark:text-gray-300" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Alumnos</h1>
                </>
              )}
            </div>
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

          {/* Filtros */}
          <div className="filters-section card">
            <div className="search-box">
              <span className="search-icon">
                <Search size={18} strokeWidth={2} />
              </span>
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
                    {ROLE_INFO[role].name}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="suspended">Suspendidos</option>
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
              <div className="users-header-actions">
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="add-user-btn"
                >
                  <Plus size={18} strokeWidth={2} /> {isAdmin ? 'Nuevo Usuario' : 'Agregar Alumno'}
                </button>
                <button onClick={loadUsers} className="refresh-btn">
                  <RefreshCw size={18} strokeWidth={2} /> Actualizar
                </button>
              </div>
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
                          <div
                            className="user-cell clickable"
                            onClick={() => handleViewUserProfile(userItem)}
                            title="Ver perfil completo"
                          >
                            <div className="user-avatar-small">
                              {(() => {
                                const iconName = ROLE_INFO[userItem.role]?.icon || 'User';
                                const IconComponent = ICON_MAP[iconName] || User;
                                return <IconComponent size={20} strokeWidth={2} />;
                              })()}
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
                                  {ROLE_INFO[role].name}
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
                            <option value="active">Activo</option>
                            <option value="suspended">Suspendido</option>
                            <option value="pending">Pendiente</option>
                          </select>
                        </td>

                        <td className="courses-cell">
                          <div className="courses-cell-content">
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => handleOpenResourceModal(userItem)}
                              title="Asignar cursos, contenido y ejercicios"
                            >
                              <ClipboardList size={16} strokeWidth={2} /> Asignar
                            </button>
                            {enrollmentCounts[userItem.id] > 0 && (
                              <span className="enrolled-count">
                                {enrollmentCounts[userItem.id]}
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
                                <Ban size={18} strokeWidth={2} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(userItem.id, 'active')}
                                className="action-btn activate-btn"
                                title="Activar usuario"
                              >
                                <Check size={18} strokeWidth={2} />
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

          {/* Modal de Asignación de Recursos */}
          {showResourceModal && selectedStudent && (
            <div className="modal-overlay" onClick={handleCloseResourceModal}>
              <div className="modal-box enrollment-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title flex items-center gap-2">
                    <Folder size={22} strokeWidth={2} />
                    Asignar Recursos a {selectedStudent.name}
                  </h2>
                  <button className="modal-close-btn" onClick={handleCloseResourceModal}>
                    ✕
                  </button>
                </div>

                {/* Tabs Navigation */}
                <div className="border-b border-gray-200 dark:border-gray-700 px-6">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setActiveResourceTab('courses')}
                      className={`py-3 px-4 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        activeResourceTab === 'courses'
                          ? 'border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <BookOpen size={18} strokeWidth={2} />
                      Cursos ({studentEnrollments.length})
                    </button>
                    <button
                      onClick={() => setActiveResourceTab('content')}
                      className={`py-3 px-4 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        activeResourceTab === 'content'
                          ? 'border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <FileText size={18} strokeWidth={2} />
                      Contenidos ({studentContent.length})
                    </button>
                    <button
                      onClick={() => setActiveResourceTab('exercises')}
                      className={`py-3 px-4 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        activeResourceTab === 'exercises'
                          ? 'border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <Gamepad2 size={18} strokeWidth={2} />
                      Ejercicios ({studentExercises.length})
                    </button>
                  </div>
                </div>

                <div className="modal-body">
                  {loadingResources ? (
                    <div className="loading-spinner">
                      <div className="spinner"></div>
                      <p>Cargando recursos...</p>
                    </div>
                  ) : (
                    <>
                      {/* Tab: Cursos */}
                      {activeResourceTab === 'courses' && (
                        <>
                          {/* Cursos Asignados */}
                          {studentEnrollments.length > 0 && (
                            <div className="enrolled-courses-section">
                              <h3 className="section-subtitle flex items-center gap-2">
                                <CheckCircle size={18} strokeWidth={2} />
                                Cursos Asignados ({studentEnrollments.length})
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
                            <h3 className="section-subtitle flex items-center gap-2">
                              <BookOpen size={18} strokeWidth={2} />
                              Cursos Disponibles
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
                                    <p className="flex items-center gap-2">
                                      <CheckCircle size={16} strokeWidth={2} />
                                      Todos los cursos ya han sido asignados
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Tab: Contenidos */}
                      {activeResourceTab === 'content' && (
                        <>
                          {/* Contenidos Asignados */}
                          {studentContent.length > 0 && (
                            <div className="enrolled-courses-section">
                              <h3 className="section-subtitle flex items-center gap-2">
                                <CheckCircle size={18} strokeWidth={2} />
                                Contenidos Asignados ({studentContent.length})
                              </h3>
                              <div className="courses-list">
                                {studentContent.map(assignment => {
                                  const content = allContent.find(c => c.id === assignment.itemId);
                                  if (!content) return null;
                                  return (
                                    <div key={assignment.id} className="course-item enrolled">
                                      <div className="course-info">
                                        <div className="course-name">{content.title}</div>
                                        <div className="course-meta">
                                          <span className="course-level">
                                            {content.type}
                                          </span>
                                          {content.duration && (
                                            <span className="course-description flex items-center gap-1">
                                              <Clock size={14} strokeWidth={2} /> {content.duration} min
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        className="btn-unenroll"
                                        onClick={() => handleRemoveContent(content.id)}
                                        title="Desasignar contenido"
                                      >
                                        ✕ Desasignar
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Contenidos Disponibles */}
                          <div className="available-courses-section">
                            <h3 className="section-subtitle flex items-center gap-2">
                              <FileText size={18} strokeWidth={2} />
                              Contenidos Disponibles
                            </h3>
                            {allContent.length === 0 ? (
                              <div className="no-courses">
                                <p>No hay contenidos creados aún.</p>
                                <p>Crea contenido primero para poder asignarlo.</p>
                              </div>
                            ) : (
                              <div className="courses-list">
                                {allContent
                                  .filter(content => !isContentAssigned(content.id))
                                  .map(content => (
                                    <div key={content.id} className="course-item available">
                                      <div className="course-info">
                                        <div className="course-name">{content.title}</div>
                                        <div className="course-meta">
                                          <span className="course-level">
                                            {content.type}
                                          </span>
                                          {content.duration && (
                                            <span className="course-description flex items-center gap-1">
                                              <Clock size={14} strokeWidth={2} /> {content.duration} min
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        className="btn-enroll"
                                        onClick={() => handleAssignContent(content.id)}
                                        title="Asignar contenido"
                                      >
                                        + Asignar
                                      </button>
                                    </div>
                                  ))}
                                {allContent.filter(c => !isContentAssigned(c.id)).length === 0 && (
                                  <div className="all-enrolled">
                                    <p className="flex items-center gap-2">
                                      <CheckCircle size={16} strokeWidth={2} />
                                      Todos los contenidos ya han sido asignados
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Tab: Ejercicios */}
                      {activeResourceTab === 'exercises' && (
                        <>
                          {/* Ejercicios Asignados */}
                          {studentExercises.length > 0 && (
                            <div className="enrolled-courses-section">
                              <h3 className="section-subtitle flex items-center gap-2">
                                <CheckCircle size={18} strokeWidth={2} />
                                Ejercicios Asignados ({studentExercises.length})
                              </h3>
                              <div className="courses-list">
                                {studentExercises.map(assignment => {
                                  const exercise = allExercises.find(e => e.id === assignment.itemId);
                                  if (!exercise) return null;
                                  return (
                                    <div key={assignment.id} className="course-item enrolled">
                                      <div className="course-info">
                                        <div className="course-name">{exercise.title}</div>
                                        <div className="course-meta">
                                          <span className="course-level">
                                            {exercise.type}
                                          </span>
                                          <span className="course-description">
                                            {exercise.difficulty || 'medium'}
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        className="btn-unenroll"
                                        onClick={() => handleRemoveExercise(exercise.id)}
                                        title="Desasignar ejercicio"
                                      >
                                        ✕ Desasignar
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Ejercicios Disponibles */}
                          <div className="available-courses-section">
                            <h3 className="section-subtitle flex items-center gap-2">
                              <Gamepad2 size={18} strokeWidth={2} />
                              Ejercicios Disponibles
                            </h3>
                            {allExercises.length === 0 ? (
                              <div className="no-courses">
                                <p>No hay ejercicios creados aún.</p>
                                <p>Crea ejercicios primero para poder asignarlos.</p>
                              </div>
                            ) : (
                              <div className="courses-list">
                                {allExercises
                                  .filter(exercise => !isExerciseAssigned(exercise.id))
                                  .map(exercise => (
                                    <div key={exercise.id} className="course-item available">
                                      <div className="course-info">
                                        <div className="course-name">{exercise.title}</div>
                                        <div className="course-meta">
                                          <span className="course-level">
                                            {exercise.type}
                                          </span>
                                          <span className="course-description">
                                            {exercise.difficulty || 'medium'}
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        className="btn-enroll"
                                        onClick={() => handleAssignExercise(exercise.id)}
                                        title="Asignar ejercicio"
                                      >
                                        + Asignar
                                      </button>
                                    </div>
                                  ))}
                                {allExercises.filter(e => !isExerciseAssigned(e.id)).length === 0 && (
                                  <div className="all-enrolled">
                                    <p className="flex items-center gap-2">
                                      <CheckCircle size={16} strokeWidth={2} />
                                      Todos los ejercicios ya han sido asignados
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                <div className="modal-footer">
                  <button className="btn btn-ghost" onClick={handleCloseResourceModal}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal para agregar nuevo usuario/alumno */}
        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          onUserCreated={handleCreateUser}
          userRole={userRole}
          isAdmin={isAdmin}
        />
      </DashboardLayout>
    );
  }

  // Renderizar Dashboard Principal con el nuevo layout
  return (
    <>
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <div className="teacher-dashboard">
          <div className="dashboard-content">
            {/* Inicio - Listo para nuevas tarjetas */}
          </div>
      </div>
      </DashboardLayout>

      {/* Modal para agregar nuevo usuario/alumno */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUserCreated={handleCreateUser}
        userRole={userRole}
        isAdmin={isAdmin}
      />
    </>
  );
}

export default TeacherDashboard;
