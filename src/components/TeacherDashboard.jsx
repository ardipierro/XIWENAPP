import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  FlaskConical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid3x3,
  List,
  CalendarDays,
  CheckSquare,
  Zap
} from 'lucide-react';
import {
  loadStudents,
  loadGameHistory,
  loadCategories,
  loadCourses
} from '../firebase/firestore';
import { getAllUsers, deleteUser, createUser } from '../firebase/users';
import { getContentByTeacher } from '../firebase/content';
import { getExercisesByTeacher } from '../firebase/exercises';
import { getClassesByTeacher } from '../firebase/classes';
import { createExcalidrawSession } from '../firebase/excalidraw';
import { createGameSession } from '../firebase/gameSession';
import { ROLES, ROLE_INFO, isAdminEmail } from '../firebase/roleConfig';
import DashboardLayout from './DashboardLayout';
import CoursesScreen from './CoursesScreen';
import GameContainer from './GameContainer';
import ContentManager from './ContentManager';
import UnifiedContentManager from './UnifiedContentManager';
import ClassManager from './ClassManager';
import AnalyticsDashboard from './AnalyticsDashboard';
import AttendanceView from './AttendanceView';
import AddUserModal from './AddUserModal';
import UserProfile from './UserProfile';
import QuickAccessCard from './QuickAccessCard';
import ExercisePlayer from './exercises/ExercisePlayer';
import SearchBar from './common/SearchBar';
import Whiteboard from './Whiteboard';
import WhiteboardManager from './WhiteboardManager';
import ExcalidrawWhiteboard from './ExcalidrawWhiteboard';
import ExcalidrawManager from './ExcalidrawManager';
import StudentCard from './StudentCard';
// REMOVED: LiveClassManager and LiveClassRoom - using unified ClassSessionManager/ClassSessionRoom now
import LiveGameProjection from './LiveGameProjection';
import LiveGameSetup from './LiveGameSetup';
import AssignmentManager from './AssignmentManager';
import GradingInterface from './GradingInterface';
import UnifiedCalendar from './UnifiedCalendar';
import MessagesPanel from './MessagesPanel';
import ClassSessionManager from './ClassSessionManager';
import ClassSessionRoom from './ClassSessionRoom';
import ThemeBuilder from './ThemeBuilder';
import ExerciseBuilder from '../pages/ExerciseBuilder';
import DesignLab from './DesignLab';
import InteractiveBookViewer from './InteractiveBookViewer';

// Custom hooks
import { useUserManagement } from '../hooks/useUserManagement';
import { useResourceAssignment } from '../hooks/useResourceAssignment';
import { useScreenNavigation } from '../hooks/useScreenNavigation';

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
  const location = useLocation();

  // Teacher permissions (students only, no role management)
  const permissions = { canViewAll: false, canManageRoles: false };

  // CUSTOM HOOKS
  const userManagement = useUserManagement(user, permissions);
  const resourceAssignment = useResourceAssignment();
  const navigation = useScreenNavigation();

  // Local states (teacher-specific)
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Teacher-specific stats (simpler than admin)
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGames: 0,
    totalCategories: 0,
    totalCourses: 0
  });

  // Teacher functionality states
  const [courses, setCourses] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [allContent, setAllContent] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [allClasses, setAllClasses] = useState([]);

  // Determinar si el usuario es admin (aunque esté en TeacherDashboard)
  const isAdmin = isAdminEmail(user?.email) || userRole === 'admin';

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Detect return from ViewAs
  useEffect(() => {
    const returnUserId = sessionStorage.getItem('viewAsReturnUserId');
    if (returnUserId && userManagement.users.length > 0 && !navigation.hasProcessedReturn) {
      logger.debug('🔄 [TeacherDashboard] Detected return from ViewAs, userId:', returnUserId);
      navigation.setHasProcessedReturn(true);
      sessionStorage.removeItem('viewAsReturning');
      sessionStorage.removeItem('viewAsReturnUserId');

      const targetUser = userManagement.users.find(u => u.id === returnUserId);
      if (targetUser) {
        handleViewUserProfile(targetUser);
      }

      navigation.setCurrentScreen('users');
    }
  }, [userManagement.users, navigation.hasProcessedReturn]);

  // Handle route changes
  useEffect(() => {
    const pendingUserId = sessionStorage.getItem('viewAsReturnUserId');
    if (pendingUserId) {
      navigation.setCurrentScreen('users');
      navigation.setHasProcessedReturn(false);
      return;
    }

    if (location.pathname === '/teacher/users') {
      navigation.setCurrentScreen('users');
    } else if (location.pathname === '/teacher') {
      navigation.setCurrentScreen('dashboard');
    }
  }, [location.pathname]);

  // Load users when screen changes to 'users'
  useEffect(() => {
    if (navigation.currentScreen === 'users') {
      const pendingReturn = sessionStorage.getItem('viewAsReturnUserId');
      if (pendingReturn && !isAdminEmail(user?.email) && !userRole) {
        return; // Wait for userRole to sync
      }
      userManagement.loadUsers();
    }
  }, [navigation.currentScreen, isAdmin, userRole]);

  // Load enrollment counts when users are loaded
  useEffect(() => {
    if (userManagement.users.length > 0) {
      const studentIds = userManagement.users.map(u => u.id);
      resourceAssignment.loadEnrollmentCounts(studentIds);
    }
  }, [userManagement.users]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const startTime = performance.now();

      // Load all data in parallel
      const [students, games, categories, allCourses, teacherContent, teacherClasses] = await Promise.all([
        loadStudents(),
        loadGameHistory(),
        loadCategories(),
        loadCourses(),
        getContentByTeacher(user.uid),
        getClassesByTeacher(user.uid),
        userManagement.loadUsers() // Load users (students only) with credits via hook
      ]);

      logger.debug(`⏱️ [TeacherDashboard] Parallel queries: ${(performance.now() - startTime).toFixed(0)}ms`);

      const activeCourses = allCourses.filter(c => c.active !== false);
      setCourses(activeCourses);
      setAllContent(teacherContent);
      setAllClasses(teacherClasses);

      // Calculate top students
      const processingStart = performance.now();
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

      logger.debug(`⏱️ [TeacherDashboard] Processing data: ${(performance.now() - processingStart).toFixed(0)}ms`);

      setStats({
        totalStudents: students.filter(s => s.active !== false).length,
        totalGames: games.length,
        totalCategories: Object.keys(categories).length,
        totalCourses: activeCourses.length
      });

      setRecentGames(games.slice(0, 5));
      setTopStudents(topStudentsArray);

      logger.debug(`⏱️ [TeacherDashboard] TOTAL: ${(performance.now() - startTime).toFixed(0)}ms`);
    } catch (error) {
      logger.error('Error cargando datos del dashboard:', error);
    }
    setLoading(false);
  };

  // Helper functions
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUserInitials = () => {
    if (!user.email) return '?';
    return user.email.charAt(0).toUpperCase();
  };

  // Navigation handlers (using hook functions)
  const handleStartGame = () => navigation.setCurrentScreen('setup');
  const handleManageExercises = () => navigation.setCurrentScreen('exercises');
  const handleManageContent = () => navigation.setCurrentScreen('content');
  const handleManageGroups = () => navigation.setCurrentScreen('groups');
  const handleViewAnalytics = () => navigation.setCurrentScreen('analytics');
  const handleManageCourses = () => navigation.setCurrentScreen('courses');

  const handleManageCategories = () => {
    alert('Funcionalidad "Gestionar Categorías" próximamente.\n\nEsta característica estará disponible en una futura actualización.');
  };

  const handleViewHistory = () => {
    alert('Funcionalidad "Ver Historial" próximamente.\n\nEsta característica estará disponible en una futura actualización.');
  };

  const handlePlayExercise = (exerciseId) => {
    navigation.setSelectedExerciseId(exerciseId);
    navigation.setCurrentScreen('playExercise');
  };

  const handleViewUserProfile = (userItem) => {
    navigation.setSelectedUserProfile(userItem);
    navigation.setShowUserProfile(true);
  };

  const handleBackFromProfile = () => {
    navigation.setShowUserProfile(false);
    navigation.setSelectedUserProfile(null);
  };

  const handleProfileUpdate = async () => {
    await userManagement.loadUsers();
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción marcará al usuario como inactivo.')) {
      return;
    }

    try {
      const result = await deleteUser(userId);
      if (result.success) {
        await userManagement.loadUsers();
        logger.debug('Usuario eliminado exitosamente');
      } else {
        logger.error('Error al eliminar usuario:', result.error);
        alert('Error al eliminar el usuario. Por favor intenta nuevamente.');
      }
    } catch (error) {
      logger.error('Error al eliminar usuario:', error);
      alert('Error al eliminar el usuario. Por favor intenta nuevamente.');
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      const result = await createUser({
        ...userData,
        createdBy: user.uid
      });

      if (result.success) {
        showSuccess(`Usuario ${userData.email} creado exitosamente`);
        await userManagement.loadUsers();
        return {
          success: true,
          password: result.password
        };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      logger.error('Error al crear usuario:', error);
      return { success: false, error: 'Error inesperado al crear usuario' };
    }
  };

  // Role and status change handlers (using hook functions)
  const handleRoleChange = async (userId, newRole) => {
    const targetUser = userManagement.users.find(u => u.id === userId);
    if (targetUser && isAdminEmail(targetUser.email) && user.email === targetUser.email) {
      showError('No puedes cambiar tu propio rol de admin');
      return;
    }

    const result = await userManagement.handleRoleChange(userId, newRole);
    if (result.success) {
      showSuccess(`Rol actualizado a ${ROLE_INFO[newRole].name}`);
    } else {
      showError('Error al actualizar rol');
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    const targetUser = userManagement.users.find(u => u.id === userId);
    if (targetUser && isAdminEmail(targetUser.email) && newStatus === 'suspended') {
      showError('No puedes suspender al admin principal');
      return;
    }

    const result = await userManagement.handleStatusChange(userId, newStatus);
    if (result.success) {
      showSuccess(`Estado actualizado a ${newStatus}`);
    } else {
      showError('Error al actualizar estado');
    }
  };

  // Resource assignment handlers (using hook functions)
  const handleOpenResourceModal = async (student, initialTab = 'courses') => {
    await resourceAssignment.handleOpenResourceModal(student, allContent, allExercises);
    resourceAssignment.setActiveResourceTab(initialTab);
  };

  const handleEnrollCourse = async (courseId) => {
    if (!resourceAssignment.selectedStudent) return;

    const result = await resourceAssignment.handleEnrollCourse(
      resourceAssignment.selectedStudent.id,
      courseId,
      courses.find(c => c.id === courseId)?.name || ''
    );

    if (result.success) {
      showSuccess('Curso asignado exitosamente');
      const studentIds = userManagement.users.map(u => u.id);
      resourceAssignment.loadEnrollmentCounts(studentIds);
    } else {
      showError('Error al asignar curso');
    }
  };

  const handleUnenrollCourse = async (courseId) => {
    if (!resourceAssignment.selectedStudent) return;

    const confirmed = window.confirm('¿Estás seguro de que deseas desasignar este curso?');
    if (!confirmed) return;

    const result = await resourceAssignment.handleUnenrollCourse(
      resourceAssignment.selectedStudent.id,
      courseId
    );

    if (result.success) {
      showSuccess('Curso desasignado exitosamente');
      const studentIds = userManagement.users.map(u => u.id);
      resourceAssignment.loadEnrollmentCounts(studentIds);
    } else {
      showError('Error al desasignar curso');
    }
  };

  const handleAssignContent = async (contentId) => {
    if (!resourceAssignment.selectedStudent) return;

    const content = allContent.find(c => c.id === contentId);
    const result = await resourceAssignment.handleAssignContent(
      resourceAssignment.selectedStudent.id,
      contentId,
      content?.title || ''
    );

    if (result.success) {
      showSuccess('Contenido asignado exitosamente');
    } else {
      showError('Error al asignar contenido');
    }
  };

  const handleRemoveContent = async (contentId) => {
    if (!resourceAssignment.selectedStudent) return;

    const confirmed = window.confirm('¿Estás seguro de que deseas desasignar este contenido?');
    if (!confirmed) return;

    const result = await resourceAssignment.handleRemoveContent(
      resourceAssignment.selectedStudent.id,
      contentId
    );

    if (result.success) {
      showSuccess('Contenido desasignado exitosamente');
    } else {
      showError('Error al desasignar contenido');
    }
  };

  const handleAssignExercise = async (exerciseId) => {
    if (!resourceAssignment.selectedStudent) return;

    const exercise = allExercises.find(e => e.id === exerciseId);
    const result = await resourceAssignment.handleAssignExercise(
      resourceAssignment.selectedStudent.id,
      exerciseId,
      exercise?.title || ''
    );

    if (result.success) {
      showSuccess('Ejercicio asignado exitosamente');
    } else {
      showError('Error al asignar ejercicio');
    }
  };

  const handleRemoveExercise = async (exerciseId) => {
    if (!resourceAssignment.selectedStudent) return;

    const confirmed = window.confirm('¿Estás seguro de que deseas desasignar este ejercicio?');
    if (!confirmed) return;

    const result = await resourceAssignment.handleRemoveExercise(
      resourceAssignment.selectedStudent.id,
      exerciseId
    );

    if (result.success) {
      showSuccess('Ejercicio desasignado exitosamente');
    } else {
      showError('Error al desasignar ejercicio');
    }
  };

  // Renderizar pantalla de carga
  if (loading) {
    const isReturningFromViewAs = sessionStorage.getItem('viewAsReturning') === 'true';

    return (
      <div className="min-h-screen bg-primary-50 dark:bg-primary-900">
        <div className="flex flex-col items-center justify-center py-15 px-5">
          <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 border-t-secondary-600 rounded-full animate-spin mb-4"></div>
          <p className="text-primary-900 dark:text-primary-100">{isReturningFromViewAs ? 'Volviendo...' : 'Cargando...'}</p>
        </div>
      </div>
    );
  }

  // Renderizar GameContainer (Crear Juego) - SIN Layout porque tiene su propia navegación
  if (navigation.currentScreen === 'setup') {
    return <GameContainer onBack={navigation.handleBackToDashboard} />;
  }

  // Renderizar Live Game Projection - SIN Layout, pantalla completa
  if (navigation.currentScreen === 'liveGameProjection' && navigation.liveGameSessionId) {
    return (
      <LiveGameProjection
        sessionId={navigation.liveGameSessionId}
        onBack={() => {
          navigation.setLiveGameSessionId(null);
          navigation.setCurrentScreen('liveGame');
        }}
      />
    );
  }

  // Renderizar Live Game Setup - CON Layout
  if (navigation.currentScreen === 'liveGame') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <LiveGameSetup
          user={user}
          onSessionCreated={(sessionId) => {
            navigation.setLiveGameSessionId(sessionId);
            navigation.setCurrentScreen('liveGameProjection');
          }}
          onBack={navigation.handleBackToDashboard}
        />
      </DashboardLayout>
    );
  }

  // Renderizar Unified Content Manager - CON Layout (Reemplaza courses y content)
  if (navigation.currentScreen === 'unifiedContent') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <UnifiedContentManager
          user={user}
          onBack={navigation.handleBackToDashboard}
          onNavigateToAIConfig={() => navigation.handleMenuAction('aiConfig')}
        />
      </DashboardLayout>
    );
  }

  // LEGACY: Renderizar CoursesScreen (Gestionar Cursos) - CON Layout
  if (navigation.currentScreen === 'courses') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <CoursesScreen onBack={navigation.handleBackToDashboard} user={user} openCreateModal={navigation.openCourseModal} />
      </DashboardLayout>
    );
  }

  // Renderizar ExercisePlayer (Jugar Ejercicio) - SIN Layout, pantalla completa
  if (navigation.currentScreen === 'playExercise' && navigation.selectedExerciseId) {
    return (
      <ExercisePlayer
        exerciseId={navigation.selectedExerciseId}
        user={user}
        onBack={navigation.handleBackToDashboard}
        onComplete={(results) => {
          logger.debug('Ejercicio completado:', results);
        }}
      />
    );
  }

  // LEGACY: Renderizar Gestión de Contenido - CON Layout
  if (navigation.currentScreen === 'content') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <ContentManager user={user} courses={courses} onBack={navigation.handleBackToDashboard} openCreateModal={navigation.openContentModal} />
      </DashboardLayout>
    );
  }

  // Renderizar Class Manager (Clases Recurrentes) - CON Layout
  if (navigation.currentScreen === 'classes') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <ClassManager user={user} courses={courses} onBack={navigation.handleBackToDashboard} openCreateModal={navigation.openClassModal} />
      </DashboardLayout>
    );
  }

  // Renderizar Analytics Dashboard - CON Layout
  if (navigation.currentScreen === 'analytics') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <div className="analytics-section">
          <button onClick={navigation.handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Volver a Inicio
          </button>
          <AnalyticsDashboard user={user} />
        </div>
      </DashboardLayout>
    );
  }

  // Renderizar Vista de Asistencia - CON Layout
  if (navigation.currentScreen === 'attendance') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <div className="attendance-section">
          <button onClick={navigation.handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Volver a Inicio
          </button>
          <AttendanceView teacher={user} />
        </div>
      </DashboardLayout>
    );
  }

  // Renderizar Pizarra Colaborativa (TEST)
  if (navigation.currentScreen === 'testCollab') {
    const sessionId = `collab_${user.uid}_${Date.now()}`;
    return (
      <Whiteboard
        onBack={navigation.handleBackToDashboard}
        isCollaborative={true}
        collaborativeSessionId={sessionId}
      />
    );
  }

  // Renderizar Pizarra Interactiva - SIN Layout, pantalla completa
  if (navigation.currentScreen === 'whiteboard') {
    const isLive = navigation.selectedWhiteboardSession?.isLive;
    const liveSessionId = navigation.selectedWhiteboardSession?.liveSessionId;

    return (
      <Whiteboard
        onBack={() => {
          navigation.setWhiteboardManagerKey(prev => prev + 1);
          navigation.setCurrentScreen('whiteboardSessions');
        }}
        initialSession={navigation.selectedWhiteboardSession}
        isCollaborative={isLive}
        collaborativeSessionId={liveSessionId}
      />
    );
  }

  // Renderizar Excalidraw Whiteboard - SIN Layout, pantalla completa
  if (navigation.currentScreen === 'excalidrawWhiteboard') {
    return (
      <ExcalidrawWhiteboard
        onBack={() => {
          navigation.setExcalidrawManagerKey(prev => prev + 1);
          navigation.setCurrentScreen('excalidrawSessions');
        }}
        initialSession={navigation.selectedExcalidrawSession}
      />
    );
  }

  // Renderizar Gestión de Pizarras Excalidraw - CON Layout
  if (navigation.currentScreen === 'excalidrawSessions') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <ExcalidrawManager
          key={navigation.excalidrawManagerKey}
          onBack={navigation.handleBackToDashboard}
          onOpenSession={(session) => {
            navigation.setSelectedExcalidrawSession(session);
            navigation.setCurrentScreen('excalidrawWhiteboard');
          }}
          onCreateNew={async () => {
            try {
              const sessionId = await createExcalidrawSession('Pizarra sin título');
              navigation.setSelectedExcalidrawSession({
                id: sessionId,
                title: 'Pizarra sin título',
                elements: [],
                appState: {},
                files: {}
              });
              navigation.setCurrentScreen('excalidrawWhiteboard');
            } catch (error) {
              logger.error('Error creando pizarra:', error);
              alert('Error al crear la pizarra');
            }
          }}
        />
      </DashboardLayout>
    );
  }

  // Renderizar Gestión de Pizarras Guardadas - CON Layout
  if (navigation.currentScreen === 'whiteboardSessions') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <WhiteboardManager
          key={navigation.whiteboardManagerKey}
          onBack={navigation.handleBackToDashboard}
          onOpenWhiteboard={() => {
            navigation.setSelectedWhiteboardSession(null);
            navigation.setCurrentScreen('whiteboard');
          }}
          onLoadSession={(session) => {
            navigation.setSelectedWhiteboardSession(session);
            navigation.setCurrentScreen('whiteboard');
          }}
          onGoLive={(session, liveSessionId) => {
            navigation.setSelectedWhiteboardSession({
              ...session,
              isLive: true,
              liveSessionId: liveSessionId
            });
            navigation.setCurrentScreen('whiteboard');
          }}
        />
      </DashboardLayout>
    );
  }

  // REMOVED: Old liveClasses and liveClassRoom screens - Replaced by unified ClassSessionManager/ClassSessionRoom

  // Renderizar Class Session Manager (Sistema Unificado) - CON Layout
  if (navigation.currentScreen === 'classSessions') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <ClassSessionManager
          user={user}
          onJoinSession={(session) => {
            navigation.setSelectedLiveClass(session);
            navigation.setCurrentScreen('classSessionRoom');
          }}
        />
      </DashboardLayout>
    );
  }

  // Renderizar Class Session Room (Sala unificada) - SIN Layout (pantalla completa)
  if (navigation.currentScreen === 'classSessionRoom' && navigation.selectedLiveClass) {
    return (
      <ClassSessionRoom
        session={navigation.selectedLiveClass}
        user={user}
        userRole={userRole}
        onLeave={() => {
          navigation.setSelectedLiveClass(null);
          navigation.setCurrentScreen('classSessions');
        }}
      />
    );
  }

  // Renderizar Panel de Alumnos (Vista Cards) - CON Layout
  if (navigation.currentScreen === 'students') {
    const students = userManagement.users.filter(u => ['student', 'listener', 'trial'].includes(u.role));

    const filteredStudents = students.filter(student =>
      student.name?.toLowerCase().includes(navigation.studentsSearchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(navigation.studentsSearchTerm.toLowerCase())
    );

    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <div className="p-0">
          <button onClick={navigation.handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Volver a Inicio
          </button>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <GraduationCap size={32} strokeWidth={2} className="text-gray-700 dark:text-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Alumnos</h1>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddUserModal(true)} className="btn btn-primary">
                <Plus size={18} strokeWidth={2} /> Agregar Alumno
              </button>
              <button onClick={userManagement.loadUsers} className="btn btn-primary !bg-green-600 hover:!bg-green-700" title="Actualizar lista">
                <RefreshCw size={18} strokeWidth={2} /> Actualizar
              </button>
            </div>
          </div>

          <SearchBar
            value={navigation.studentsSearchTerm}
            onChange={navigation.setStudentsSearchTerm}
            placeholder="Buscar alumnos..."
            viewMode={navigation.studentsViewMode}
            onViewModeChange={navigation.setStudentsViewMode}
            className="mb-6"
          />

          {successMessage && (
            <div className="bg-success-500/10 text-success-600 border border-success-500/30 p-4 rounded-lg font-semibold mb-5 animate-slide-down flex items-center gap-2">
              <CheckCircle size={18} strokeWidth={2} /> {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="bg-error-500/10 text-error-600 border border-error-500/30 p-4 rounded-lg font-semibold mb-5 animate-slide-down flex items-center gap-2">
              <AlertTriangle size={18} strokeWidth={2} /> {errorMessage}
            </div>
          )}

          {filteredStudents.length === 0 ? (
            <div className="text-center py-15 px-5 text-secondary-600 dark:text-secondary-400 text-base">
              <p>No se encontraron alumnos</p>
            </div>
          ) : (
            <div className={navigation.studentsViewMode === 'grid' ? 'students-grid' : 'students-list'}>
              {filteredStudents.map(student => (
                <StudentCard
                  key={student.id}
                  student={student}
                  enrollmentCount={resourceAssignment.enrollmentCounts[student.id] || 0}
                  onView={(student) => {
                    navigation.setSelectedUserProfile(student);
                    navigation.setShowUserProfile(true);
                  }}
                  onDelete={(student) => handleDeleteUser(student.id)}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Renderizar Gestión de Usuarios/Alumnos - CON Layout
  if (navigation.currentScreen === 'users') {
    // Mostrar loading fullscreen si estamos procesando retorno de Ver Como
    if (sessionStorage.getItem('viewAsReturning') === 'true' && !navigation.hasProcessedReturn) {
      return (
        <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
          <div className="loading-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div className="spinner"></div>
            <p>Volviendo...</p>
          </div>
        </DashboardLayout>
      );
    }

    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <div className="p-0">
          <button onClick={navigation.handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Volver a Inicio
          </button>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
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
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button onClick={() => setShowAddUserModal(true)} className="btn btn-primary w-full sm:w-auto">
                <Plus size={18} strokeWidth={2} /> {isAdmin ? 'Nuevo Usuario' : 'Agregar Alumno'}
              </button>
              <button onClick={userManagement.loadUsers} className="btn btn-primary !bg-green-600 hover:!bg-green-700 w-full sm:w-auto" title="Actualizar lista de usuarios">
                <RefreshCw size={18} strokeWidth={2} /> Actualizar
              </button>
            </div>
          </div>

          <SearchBar
            value={userManagement.searchTerm}
            onChange={userManagement.setSearchTerm}
            placeholder={isAdmin ? "Buscar usuarios..." : "Buscar alumnos..."}
            viewMode={navigation.studentsViewMode}
            onViewModeChange={navigation.setStudentsViewMode}
            viewModes={['table', 'grid', 'list']}
            className="mb-6"
          />

          {successMessage && (
            <div className="bg-success-500/10 text-success-600 border border-success-500/30 p-4 rounded-lg font-semibold mb-5 animate-slide-down flex items-center gap-2">
              <CheckCircle size={18} strokeWidth={2} /> {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="bg-error-500/10 text-error-600 border border-error-500/30 p-4 rounded-lg font-semibold mb-5 animate-slide-down flex items-center gap-2">
              <AlertTriangle size={18} strokeWidth={2} /> {errorMessage}
            </div>
          )}

          <div className="users-section">
            {sessionStorage.getItem('viewAsReturnUserId') && !navigation.hasProcessedReturn && userManagement.users.length === 0 ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Cargando...</p>
              </div>
            ) : userManagement.filteredUsers.length === 0 ? (
              <div className="no-users">
                <p>No se encontraron usuarios con los filtros seleccionados</p>
              </div>
            ) : navigation.studentsViewMode === 'grid' ? (
              /* Vista de grilla con StudentCard */
              <div className="quick-access-grid">
                {userManagement.filteredUsers.map(userItem => (
                  <StudentCard
                    key={userItem.id}
                    student={userItem}
                    enrollmentCount={resourceAssignment.enrollmentCounts[userItem.id] || 0}
                    onView={handleViewUserProfile}
                    onDelete={isAdmin ? handleDeleteUser : null}
                    isAdmin={isAdmin}
                    viewMode="grid"
                  />
                ))}
              </div>
            ) : navigation.studentsViewMode === 'list' ? (
              /* Vista de lista con StudentCard */
              <div className="flex flex-col gap-4">
                {userManagement.filteredUsers.map(userItem => (
                  <StudentCard
                    key={userItem.id}
                    student={userItem}
                    enrollmentCount={resourceAssignment.enrollmentCounts[userItem.id] || 0}
                    onView={handleViewUserProfile}
                    onDelete={isAdmin ? handleDeleteUser : null}
                    isAdmin={isAdmin}
                    viewMode="list"
                  />
                ))}
              </div>
            ) : (
              /* Vista de tabla (default) */
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>
                        <div onClick={() => userManagement.handleSort('name')} className={`sortable-header ${userManagement.sortField === 'name' ? 'active' : ''}`}>
                          <span>Usuario</span>
                          {userManagement.sortField === 'name' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="sort-icon-inactive" />
                          )}
                        </div>
                      </th>
                      <th>
                        <div onClick={() => userManagement.handleSort('credits')} className={`sortable-header ${userManagement.sortField === 'credits' ? 'active' : ''}`}>
                          <span>Créditos</span>
                          {userManagement.sortField === 'credits' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="sort-icon-inactive" />
                          )}
                        </div>
                      </th>
                      {isAdmin && (
                        <th>
                          <div onClick={() => userManagement.handleSort('role')} className={`sortable-header ${userManagement.sortField === 'role' ? 'active' : ''}`}>
                            <span>Rol</span>
                            {userManagement.sortField === 'role' ? (
                              userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            ) : (
                              <ArrowUpDown size={14} className="sort-icon-inactive" />
                            )}
                          </div>
                        </th>
                      )}
                      <th>
                        <div onClick={() => userManagement.handleSort('status')} className={`sortable-header ${userManagement.sortField === 'status' ? 'active' : ''}`}>
                          <span>Estado</span>
                          {userManagement.sortField === 'status' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="sort-icon-inactive" />
                          )}
                        </div>
                      </th>
                      {isAdmin && (
                        <th>
                          <div onClick={() => userManagement.handleSort('createdAt')} className={`sortable-header ${userManagement.sortField === 'createdAt' ? 'active' : ''}`}>
                            <span>Registro</span>
                            {userManagement.sortField === 'createdAt' ? (
                              userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            ) : (
                              <ArrowUpDown size={14} className="sort-icon-inactive" />
                            )}
                          </div>
                        </th>
                      )}
                      <th>
                        <div onClick={() => userManagement.handleSort('email')} className={`sortable-header ${userManagement.sortField === 'email' ? 'active' : ''}`}>
                          <span>Email</span>
                          {userManagement.sortField === 'email' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="sort-icon-inactive" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {userManagement.filteredUsers.map(userItem => (
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

                        <td className="credits-cell">{userItem.credits || 0}</td>

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

                        {isAdmin && (
                          <td className="date-cell">
                            {formatDate(userItem.createdAt)}
                          </td>
                        )}

                        <td className="email-cell">{userItem.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal de Asignación de Recursos */}
          {resourceAssignment.showResourceModal && resourceAssignment.selectedStudent && (
            <div className="modal-overlay" onClick={resourceAssignment.handleCloseResourceModal}>
              <div className="modal-box enrollment-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title flex items-center gap-2">
                    <Folder size={22} strokeWidth={2} />
                    Asignar Recursos a {resourceAssignment.selectedStudent.name}
                  </h2>
                  <button className="modal-close-btn" onClick={resourceAssignment.handleCloseResourceModal}>
                    ✕
                  </button>
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700 px-6">
                  <div className="flex gap-4">
                    <button
                      onClick={() => resourceAssignment.setActiveResourceTab('courses')}
                      className={`py-3 px-4 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        resourceAssignment.activeResourceTab === 'courses'
                          ? 'border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <BookOpen size={18} strokeWidth={2} />
                      Cursos ({resourceAssignment.studentEnrollments.length})
                    </button>
                    <button
                      onClick={() => resourceAssignment.setActiveResourceTab('content')}
                      className={`py-3 px-4 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        resourceAssignment.activeResourceTab === 'content'
                          ? 'border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <FileText size={18} strokeWidth={2} />
                      Contenidos ({resourceAssignment.studentContent.length})
                    </button>
                    <button
                      onClick={() => resourceAssignment.setActiveResourceTab('exercises')}
                      className={`py-3 px-4 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        resourceAssignment.activeResourceTab === 'exercises'
                          ? 'border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <Gamepad2 size={18} strokeWidth={2} />
                      Ejercicios ({resourceAssignment.studentExercises.length})
                    </button>
                  </div>
                </div>

                <div className="modal-body">
                  {resourceAssignment.loadingResources ? (
                    <div className="loading-spinner">
                      <div className="spinner"></div>
                      <p>Cargando...</p>
                    </div>
                  ) : (
                    <>
                      {/* Tab: Cursos */}
                      {resourceAssignment.activeResourceTab === 'courses' && (
                        <>
                          {resourceAssignment.studentEnrollments.length > 0 && (
                            <div className="enrolled-courses-section">
                              <h3 className="section-subtitle flex items-center gap-2">
                                <CheckCircle size={18} strokeWidth={2} />
                                Cursos Asignados ({resourceAssignment.studentEnrollments.length})
                              </h3>
                              <div className="courses-list">
                                {resourceAssignment.studentEnrollments.map(enrollment => (
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
                                  .filter(course => !resourceAssignment.isEnrolled(course.id))
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
                                {courses.filter(course => !resourceAssignment.isEnrolled(course.id)).length === 0 && (
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
                      {resourceAssignment.activeResourceTab === 'content' && (
                        <>
                          {resourceAssignment.studentContent.length > 0 && (
                            <div className="enrolled-courses-section">
                              <h3 className="section-subtitle flex items-center gap-2">
                                <CheckCircle size={18} strokeWidth={2} />
                                Contenidos Asignados ({resourceAssignment.studentContent.length})
                              </h3>
                              <div className="courses-list">
                                {resourceAssignment.studentContent.map(assignment => {
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
                                  .filter(content => !resourceAssignment.isContentAssigned(content.id))
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
                                {allContent.filter(c => !resourceAssignment.isContentAssigned(c.id)).length === 0 && (
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
                      {resourceAssignment.activeResourceTab === 'exercises' && (
                        <>
                          {resourceAssignment.studentExercises.length > 0 && (
                            <div className="enrolled-courses-section">
                              <h3 className="section-subtitle flex items-center gap-2">
                                <CheckCircle size={18} strokeWidth={2} />
                                Ejercicios Asignados ({resourceAssignment.studentExercises.length})
                              </h3>
                              <div className="courses-list">
                                {resourceAssignment.studentExercises.map(assignment => {
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
                                  .filter(exercise => !resourceAssignment.isExerciseAssigned(exercise.id))
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
                                {allExercises.filter(e => !resourceAssignment.isExerciseAssigned(e.id)).length === 0 && (
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
                  <button className="btn btn-ghost" onClick={resourceAssignment.handleCloseResourceModal}>
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

        {/* Modal de User Profile */}
        {navigation.showUserProfile && navigation.selectedUserProfile && (
          <div className="modal-overlay" onClick={handleBackFromProfile}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <UserProfile
                selectedUser={navigation.selectedUserProfile}
                currentUser={user}
                isAdmin={isAdmin}
                onBack={handleBackFromProfile}
                onUpdate={handleProfileUpdate}
              />
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }

  // Assignment Manager Screen
  if (navigation.currentScreen === 'assignments') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <AssignmentManager teacherId={user?.id} />
      </DashboardLayout>
    );
  }

  // Grading Interface Screen (uses AssignmentManager as it contains grading functionality)
  if (navigation.currentScreen === 'grading') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <AssignmentManager teacherId={user?.id} />
      </DashboardLayout>
    );
  }

  // Unified Calendar Screen
  if (navigation.currentScreen === 'calendar') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <UnifiedCalendar
          userId={user?.uid}
          userRole="teacher"
          onCreateSession={() => {
            navigation.setCurrentScreen('classSessions');
          }}
          onJoinSession={(session) => {
            navigation.setSelectedLiveClass(session);
            navigation.setCurrentScreen('classSessionRoom');
          }}
        />
      </DashboardLayout>
    );
  }

  // Messages Screen
  if (navigation.currentScreen === 'messages') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <MessagesPanel user={user} />
      </DashboardLayout>
    );
  }

  // Theme Builder Screen
  if (navigation.currentScreen === 'themeBuilder') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <ThemeBuilder />
      </DashboardLayout>
    );
  }

  // Exercise Builder Screen
  if (navigation.currentScreen === 'exerciseBuilder') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <ExerciseBuilder />
      </DashboardLayout>
    );
  }

  // Design Lab - Theme Tester Screen
  if (navigation.currentScreen === 'designLab') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <DesignLab />
      </DashboardLayout>
    );
  }

  // Interactive Book Viewer Screen
  if (navigation.currentScreen === 'interactiveBook') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <InteractiveBookViewer />
      </DashboardLayout>
    );
  }

  // Filtrar tarjetas según búsqueda
  const dashboardCards = [
    {
      id: 'users',
      icon: isAdmin ? Crown : Users,
      title: isAdmin ? "Usuarios" : "Alumnos",
      count: userManagement.users.length,
      countLabel: userManagement.users.length === 1 ? "usuario" : "usuarios",
      onClick: () => navigation.setCurrentScreen('users'),
      createLabel: isAdmin ? "Nuevo Usuario" : "Nuevo Alumno",
      onCreateClick: () => setShowAddUserModal(true)
    },
    {
      id: 'courses',
      icon: BookOpen,
      title: "Cursos",
      count: courses.length,
      countLabel: courses.length === 1 ? "curso" : "cursos",
      onClick: () => navigation.setCurrentScreen('courses'),
      createLabel: "Nuevo Curso",
      onCreateClick: () => {
        navigation.setOpenCourseModal(true);
        navigation.setCurrentScreen('courses');
      }
    },
    {
      id: 'content',
      icon: FileText,
      title: "Contenidos",
      count: allContent.length,
      countLabel: allContent.length === 1 ? "contenido" : "contenidos",
      onClick: () => navigation.setCurrentScreen('content'),
      createLabel: "Nuevo Contenido",
      onCreateClick: () => {
        navigation.setOpenContentModal(true);
        navigation.setCurrentScreen('content');
      }
    },
    {
      id: 'classes',
      icon: Calendar,
      title: "Clases",
      count: allClasses.length,
      countLabel: allClasses.length === 1 ? "clase" : "clases",
      onClick: () => navigation.setCurrentScreen('classes'),
      createLabel: "Nueva Clase",
      onCreateClick: () => {
        navigation.setOpenClassModal(true);
        navigation.setCurrentScreen('classes');
      }
    },
    {
      id: 'liveGame',
      icon: Zap,
      title: "Juego en Vivo",
      count: 0,
      countLabel: "activo",
      onClick: () => navigation.setCurrentScreen('liveGame'),
      createLabel: "Iniciar Juego",
      onCreateClick: () => navigation.setCurrentScreen('liveGame')
    },
    {
      id: 'testCollab',
      icon: Users,
      title: "🧪 Pizarra Colaborativa",
      count: 0,
      countLabel: "prueba",
      onClick: () => navigation.setCurrentScreen('testCollab'),
      createLabel: "Abrir Pizarra",
      onCreateClick: () => navigation.setCurrentScreen('testCollab')
    }
  ];

  const filteredDashboardCards = dashboardCards.filter(card =>
    card.title.toLowerCase().includes(navigation.dashboardSearchTerm.toLowerCase())
  );

  // Renderizar Dashboard Principal con el nuevo layout
  return (
    <>
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <div className="teacher-dashboard">
          <div className="dashboard-content mt-6">
            <SearchBar
              value={navigation.dashboardSearchTerm}
              onChange={navigation.setDashboardSearchTerm}
              placeholder="Buscar secciones..."
              viewMode={navigation.dashboardViewMode}
              onViewModeChange={navigation.setDashboardViewMode}
              className="mb-6"
            />

            {/* Quick Access Cards */}
            <div className={navigation.dashboardViewMode === 'grid' ? 'quick-access-grid' : 'quick-access-list'}>
              {filteredDashboardCards.map(card => (
                <QuickAccessCard
                  key={card.id}
                  icon={card.icon}
                  title={card.title}
                  count={card.count}
                  countLabel={card.countLabel}
                  onClick={card.onClick}
                  createLabel={card.createLabel}
                  onCreateClick={card.onCreateClick}
                />
              ))}
            </div>
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
