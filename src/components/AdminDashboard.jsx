import logger from '../utils/logger';

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
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
  Shield,
  Gamepad2,
  FileText,
  BookOpen,
  Calendar,
  UsersRound,
  Folder,
  ChevronDown,
  ChevronRight,
  Clock,
  Grid3x3,
  List,
  Medal,
  Rocket,
  TrendingUp,
  ClipboardList,
  DollarSign,
  Zap,
  Key,
  Palette,
  Info
} from 'lucide-react';
import {
  loadStudents,
  loadGameHistory,
  loadCategories,
  loadCourses
} from '../firebase/firestore';
import { deleteUser, createUser } from '../firebase/users';
import { getContentByTeacher } from '../firebase/content';
import { getExercisesByTeacher } from '../firebase/exercises';
import { getClassesByTeacher } from '../firebase/classes';
import { getTeacherSessions } from '../firebase/classSessions';
import { createExcalidrawSession } from '../firebase/excalidraw';
import { createGameSession } from '../firebase/gameSession';
import { ROLES, ROLE_INFO, isAdminEmail } from '../firebase/roleConfig';
import DashboardLayout from './DashboardLayout';
import CoursesScreen from './CoursesScreen';
import GameContainer from './GameContainer';
import ContentManager from './ContentManager';
import ClassManager from './ClassManager';
import ExerciseManager from './ExerciseManager';
import UnifiedContentManager from './UnifiedContentManager';
import AnalyticsDashboard from './AnalyticsDashboard';
import AttendanceView from './AttendanceView';
import AddUserModal from './AddUserModal';
import UserProfile from './UserProfile';
import QuickAccessCard from './QuickAccessCard';
import ExercisePlayer from './exercises/ExercisePlayer';
import SearchBar from './common/SearchBar';
import Whiteboard from './Whiteboard';
import WhiteboardManager from './WhiteboardManager';
// Lazy load Excalidraw to prevent vendor bundle issues
const ExcalidrawWhiteboard = lazy(() => import('./ExcalidrawWhiteboard'));
import ExcalidrawManager from './ExcalidrawManager';
import StudentCard from './StudentCard';
import UserCard from './UserCard';
import {
  BaseButton,
  BaseCard,
  BaseModal,
  BaseLoading,
  BaseAlert,
  BaseBadge
} from './common';
// REMOVED: Old LiveClassManager and LiveClassRoom - using unified ClassSessionManager/ClassSessionRoom now
// import LiveClassManager from './LiveClassManager';
// import LiveClassRoom from './LiveClassRoom';
import LiveGameProjection from './LiveGameProjection';
import LiveGameSetup from './LiveGameSetup';
import MessagesPanel from './MessagesPanel';
import AdminPaymentsPanel from './AdminPaymentsPanel';
import AIConfigPanel from './AIConfigPanel';
import AICredentialsModal from './AICredentialsModal';
import SettingsPanel from './SettingsPanel';
import ClassSessionManager from './ClassSessionManager';
import ClassSessionRoom from './ClassSessionRoom';
import ClassSessionModal from './ClassSessionModal';
import UnifiedCalendar from './UnifiedCalendar';
import ThemeBuilder from './ThemeBuilder';
import ExerciseBuilder from '../pages/ExerciseBuilder';
import DesignLab from './DesignLab';
import InteractiveBookViewer from './InteractiveBookViewer';
import ThemeCustomizer from './ThemeCustomizer';
import aiService from '../services/aiService';
import DashboardAssistant from './DashboardAssistant';

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

function AdminDashboard({ user, userRole, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is admin
  const isAdmin = isAdminEmail(user?.email) || userRole === 'admin';

  // Admin permissions
  const permissions = { canViewAll: true, canManageRoles: true };

  // CUSTOM HOOKS
  const userManagement = useUserManagement(user, permissions);
  const resourceAssignment = useResourceAssignment();
  const navigation = useScreenNavigation();

  // Local states (admin-specific)
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAICredentialsModal, setShowAICredentialsModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [settingsTab, setSettingsTab] = useState('general'); // 'general' | 'credentials' | 'theme'
  const [credentialsRefresh, setCredentialsRefresh] = useState(0); // Para forzar re-render
  const [aiCredentials, setAiCredentials] = useState({
    claude: true,
    openai: true,
    gemini: true,
    grok: true
  });
  const [calendarEditSession, setCalendarEditSession] = useState(null); // Para modal de edición desde calendario

  // Admin-specific stats (extended from userManagement.stats)
  const [adminStats, setAdminStats] = useState({
    totalGames: 0,
    totalCategories: 0,
    totalCourses: 0
  });

  // Teacher functionality states (admin has teacher features too)
  const [courses, setCourses] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [allContent, setAllContent] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [classSessions, setClassSessions] = useState([]); // New unified class sessions

  // Load dashboard data on mount
  useEffect(() => {
    if (!isAdmin) {
      navigate('/teacher');
      return;
    }
    loadDashboardData();
  }, []);

  // Detect return from ViewAs
  useEffect(() => {
    const returnUserId = sessionStorage.getItem('viewAsReturnUserId');
    if (returnUserId && userManagement.users.length > 0 && !navigation.hasProcessedReturn) {
      logger.debug('🔄 [AdminDashboard] Detected return from ViewAs, userId:', returnUserId);
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

    if (location.pathname === '/admin/users') {
      navigation.setCurrentScreen('users');
    } else if (location.pathname === '/admin') {
      navigation.setCurrentScreen('dashboard');
    }
  }, [location.pathname]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const startTime = performance.now();

      // Load all data in parallel
      const [students, games, categories, allCourses, teacherContent, teacherClasses, sessions] = await Promise.all([
        loadStudents(),
        loadGameHistory(),
        loadCategories(),
        loadCourses(),
        getContentByTeacher(user.uid),
        getClassesByTeacher(user.uid),
        getTeacherSessions(user.uid), // New unified sessions
        userManagement.loadUsers() // Load users with credits via hook
      ]);

      logger.debug(`⏱️ [AdminDashboard] Parallel queries: ${(performance.now() - startTime).toFixed(0)}ms`);

      const activeCourses = allCourses.filter(c => c.active !== false);
      setCourses(activeCourses);
      setAllContent(teacherContent);
      setAllClasses(teacherClasses);
      setClassSessions(sessions); // Store new unified sessions

      // Calculate top students
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

      // Set admin-specific stats
      setAdminStats({
        totalGames: games.length,
        totalCategories: Object.keys(categories).length,
        totalCourses: activeCourses.length
      });

      setRecentGames(games.slice(0, 5));
      setTopStudents(topStudentsArray);

      logger.debug(`⏱️ [AdminDashboard] TOTAL: ${(performance.now() - startTime).toFixed(0)}ms`);
    } catch (error) {
      logger.error('Error loading dashboard data:', error);
      showError('Error loading dashboard data');
    }
    setLoading(false);
  };

  // Wrapper for role change with admin-specific checks
  const handleRoleChange = useCallback(async (userId, newRole) => {
    const targetUser = userManagement.users.find(u => u.id === userId);
    if (targetUser && isAdminEmail(targetUser.email) && user.email === targetUser.email) {
      showError('Cannot change your own admin role');
      return;
    }

    const result = await userManagement.handleRoleChange(userId, newRole);
    if (result.success) {
      showSuccess(`Role updated to ${ROLE_INFO[newRole].name}`);
    } else {
      showError(result.error || 'Error updating role');
    }
  }, [userManagement.users, user.email]);

  // Wrapper for status change with admin-specific checks
  const handleStatusChange = useCallback(async (userId, newStatus) => {
    const targetUser = userManagement.users.find(u => u.id === userId);
    if (targetUser && isAdminEmail(targetUser.email) && newStatus === 'suspended') {
      showError('Cannot suspend main admin');
      return;
    }

    const result = await userManagement.handleStatusChange(userId, newStatus);
    if (result.success) {
      showSuccess(`Status updated to ${newStatus}`);
    } else {
      showError(result.error || 'Error updating status');
    }
  }, [userManagement.users]);

  // View user profile
  const handleViewUserProfile = useCallback((userItem) => {
    navigation.setSelectedUserProfile(userItem);
    navigation.setShowUserProfile(true);
  }, []);

  // Close user profile
  const handleCloseUserProfile = useCallback(() => {
    navigation.setShowUserProfile(false);
    navigation.setSelectedUserProfile(null);
    userManagement.loadUsers();
  }, []);

  // Create user function for modal
  const handleCreateUser = useCallback(async (userData) => {
    try {
      logger.debug('📝 Creating user:', userData);
      const result = await createUser({
        ...userData,
        createdBy: user.uid
      });
      logger.debug('✅ User creation result:', result);

      if (result.success) {
        // Reload users list
        await userManagement.loadUsers();
        showSuccess('User created successfully');
      }

      return result;
    } catch (error) {
      logger.error('❌ Error creating user:', error);
      return { success: false, error: error.message };
    }
  }, [user, userManagement]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  // Delete user
  const handleDeleteUser = useCallback(async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action will mark the user as inactive.')) {
      return;
    }

    try {
      const result = await deleteUser(userId);
      if (result.success) {
        await userManagement.loadUsers();
        logger.debug('User deleted successfully');
      } else {
        logger.error('Error deleting user:', result.error);
        alert('Error deleting user. Please try again.');
      }
    } catch (error) {
      logger.error('Error deleting user:', error);
      alert('Error deleting user. Please try again.');
    }
  }, []);

  // Load enrollment counts when users change
  useEffect(() => {
    if (userManagement.users.length > 0) {
      const studentIds = userManagement.users.map(u => u.id);
      resourceAssignment.loadEnrollmentCounts(studentIds);
    }
  }, [userManagement.users]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Combined stats for display
  const stats = {
    ...userManagement.stats,
    ...adminStats
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <BaseLoading variant="fullscreen" text="Loading admin panel..." />
      </DashboardLayout>
    );
  }

  // ==========================================
  // RENDER SPECIFIC SCREENS (NON-LAYOUT)
  // ==========================================

  // GameContainer (Game Setup) - NO Layout (has its own navigation)
  if (navigation.currentScreen === 'setup') {
    return <GameContainer onBack={navigation.handleBackToDashboard} />;
  }

  // Live Game Projection - NO Layout (fullscreen)
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

  // ExercisePlayer - NO Layout (fullscreen)
  if (navigation.currentScreen === 'playExercise' && navigation.selectedExerciseId) {
    return (
      <ExercisePlayer
        exerciseId={navigation.selectedExerciseId}
        user={user}
        onBack={navigation.handleBackToDashboard}
        onComplete={(results) => {
          logger.debug('Exercise completed:', results);
        }}
      />
    );
  }

  // Whiteboard - NO Layout (fullscreen)
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

  // Excalidraw Whiteboard - NO Layout (fullscreen)
  if (navigation.currentScreen === 'excalidrawWhiteboard') {
    return (
      <Suspense fallback={<BaseLoading variant="fullscreen" text="Cargando pizarra..." />}>
        <ExcalidrawWhiteboard
          onBack={() => {
            navigation.setExcalidrawManagerKey(prev => prev + 1);
            navigation.setCurrentScreen('excalidrawSessions');
          }}
          initialSession={navigation.selectedExcalidrawSession}
        />
      </Suspense>
    );
  }

  // Test Collaborative Whiteboard - NO Layout (fullscreen)
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

  // Class Session Manager (Sistema Unificado) - WITH Layout
  if (navigation.currentScreen === 'classSessions') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <ClassSessionManager
          user={user}
          initialEditSessionId={navigation.editSessionId}
          onClearEditSession={() => navigation.setEditSessionId(null)}
          onJoinSession={(session) => {
            navigation.setSelectedLiveClass(session);
            navigation.setEditSessionId(null); // Clear edit state when joining
            navigation.setCurrentScreen('classSessionRoom');
          }}
        />
      </DashboardLayout>
    );
  }

  // Class Session Room (Sala unificada) - NO Layout (fullscreen)
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

  // ==========================================
  // RENDER SPECIFIC SCREENS (WITH LAYOUT)
  // ==========================================

  // Unified Calendar Screen - WITH Layout
  if (navigation.currentScreen === 'calendar') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <UnifiedCalendar
          userId={user?.uid}
          userRole="admin"
          onCreateSession={() => {
            navigation.setEditSessionId(null); // Clear any edit state
            navigation.setCurrentScreen('classSessions');
          }}
          onJoinSession={(session) => {
            navigation.setSelectedLiveClass(session);
            navigation.setCurrentScreen('classSessionRoom');
          }}
          onEditSession={async (sessionId) => {
            // Cargar la sesión completa para pasarla al modal
            try {
              const { getClassSession } = await import('../firebase/classSessions');
              const sessionData = await getClassSession(sessionId);
              if (sessionData) {
                setCalendarEditSession({ id: sessionId, ...sessionData });
              }
            } catch (error) {
              logger.error('Error loading session for edit:', error);
            }
          }}
        />

        {/* Modal de edición de sesión desde calendario */}
        {calendarEditSession && (
          <ClassSessionModal
            isOpen={true}
            session={calendarEditSession}
            onClose={() => setCalendarEditSession(null)}
            onSubmit={async (formData) => {
              try {
                const { updateClassSession } = await import('../firebase/classSessions');
                await updateClassSession(calendarEditSession.id, formData);
                setCalendarEditSession(null);
                logger.info('Session updated successfully from calendar');
              } catch (error) {
                logger.error('Error updating session:', error);
              }
            }}
            courses={[]} // TODO: Load courses if needed
            loading={false}
          />
        )}
      </DashboardLayout>
    );
  }

  // AI Configuration Panel - WITH Layout
  if (navigation.currentScreen === 'aiConfig') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <div className="p-4 md:p-6 lg:p-8">
          <BaseButton onClick={navigation.handleBackToDashboard} variant="ghost" className="mb-4">
            ← Back to Home
          </BaseButton>
          <AIConfigPanel />
        </div>
      </DashboardLayout>
    );
  }

  // Settings Panel - WITH Layout
  if (navigation.currentScreen === 'settings') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <SettingsPanel />
      </DashboardLayout>
    );
  }

  // Theme Builder - WITH Layout
  if (navigation.currentScreen === 'themeBuilder') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <ThemeBuilder />
      </DashboardLayout>
    );
  }

  // Exercise Builder - WITH Layout
  if (navigation.currentScreen === 'exerciseBuilder') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <ExerciseBuilder />
      </DashboardLayout>
    );
  }

  // Design Lab - Theme Tester - WITH Layout
  if (navigation.currentScreen === 'designLab') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <DesignLab />
      </DashboardLayout>
    );
  }

  // Interactive Book Viewer - WITH Layout
  if (navigation.currentScreen === 'interactiveBook') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <InteractiveBookViewer />
      </DashboardLayout>
    );
  }


  // Live Game Setup - WITH Layout
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

  // Unified Content Manager - WITH Layout (Reemplaza courses, content, exercises)
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

  // LEGACY: Courses Screen - WITH Layout
  if (navigation.currentScreen === 'courses') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <CoursesScreen onBack={navigation.handleBackToDashboard} user={user} openCreateModal={navigation.openCourseModal} />
      </DashboardLayout>
    );
  }

  // LEGACY: Content Manager - WITH Layout
  if (navigation.currentScreen === 'content') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <ContentManager user={user} courses={courses} onBack={navigation.handleBackToDashboard} openCreateModal={navigation.openContentModal} />
      </DashboardLayout>
    );
  }

  // LEGACY: Exercise Manager - WITH Layout
  if (navigation.currentScreen === 'exercises') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <ExerciseManager user={user} onBack={navigation.handleBackToDashboard} />
      </DashboardLayout>
    );
  }

  // Analytics Dashboard - WITH Layout
  if (navigation.currentScreen === 'analytics') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <div className="p-4 md:p-6 lg:p-8">
          <BaseButton onClick={navigation.handleBackToDashboard} variant="ghost" className="mb-4">
            ← Back to Home
          </BaseButton>
          <AnalyticsDashboard user={user} />
        </div>
      </DashboardLayout>
    );
  }

  // Messages Panel - WITH Layout
  if (navigation.currentScreen === 'messages') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <MessagesPanel user={user} />
      </DashboardLayout>
    );
  }

  // Payments Panel - WITH Layout
  if (navigation.currentScreen === 'payments') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <div className="p-4 md:p-6 lg:p-8">
          <BaseButton onClick={navigation.handleBackToDashboard} variant="ghost" className="mb-4">
            ← Back to Home
          </BaseButton>
          <AdminPaymentsPanel user={user} />
        </div>
      </DashboardLayout>
    );
  }

  // Attendance View - WITH Layout
  if (navigation.currentScreen === 'attendance') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <div className="p-4 md:p-6 lg:p-8">
          <BaseButton onClick={navigation.handleBackToDashboard} variant="ghost" className="mb-4">
            ← Back to Home
          </BaseButton>
          <AttendanceView teacher={user} />
        </div>
      </DashboardLayout>
    );
  }

  // Whiteboard Manager - WITH Layout
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

  // Excalidraw Manager - WITH Layout
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
              const sessionId = await createExcalidrawSession('Untitled Whiteboard');
              navigation.setSelectedExcalidrawSession({
                id: sessionId,
                title: 'Untitled Whiteboard',
                elements: [],
                appState: {},
                files: {}
              });
              navigation.setCurrentScreen('excalidrawWhiteboard');
            } catch (error) {
              logger.error('Error creating whiteboard:', error);
              alert('Error creating whiteboard');
            }
          }}
        />
      </DashboardLayout>
    );
  }

  // Students Panel -> REDIRECT to Users with filter
  if (navigation.currentScreen === 'students') {
    // Automatically redirect to users panel with students filter
    navigation.setCurrentScreen('users');
    navigation.setUsersRoleFilter('students');
    return null; // Will re-render with users screen
  }

  // User Management - WITH Layout
  if (navigation.currentScreen === 'users') {
    if (sessionStorage.getItem('viewAsReturning') === 'true' && !navigation.hasProcessedReturn) {
      return (
        <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
          <BaseLoading variant="fullscreen" text="Returning..." />
        </DashboardLayout>
      );
    }

    // Filter users by role (using regular variables instead of useMemo to avoid hook order issues)
    let roleFilteredUsers = userManagement.users;
    logger.debug(`🔍 [Users Filter] Total users: ${userManagement.users.length}, Role filter: ${navigation.usersRoleFilter}`);

    if (navigation.usersRoleFilter === 'students') {
      roleFilteredUsers = roleFilteredUsers.filter(u => ['student', 'listener', 'trial'].includes(u.role));
      logger.debug(`🔍 [Users Filter] After students filter: ${roleFilteredUsers.length}`);
    } else if (navigation.usersRoleFilter === 'teachers') {
      roleFilteredUsers = roleFilteredUsers.filter(u => ['teacher', 'trial_teacher'].includes(u.role));
      logger.debug(`🔍 [Users Filter] After teachers filter: ${roleFilteredUsers.length}`);
    } else if (navigation.usersRoleFilter === 'admins') {
      roleFilteredUsers = roleFilteredUsers.filter(u => u.role === 'admin');
      logger.debug(`🔍 [Users Filter] After admins filter: ${roleFilteredUsers.length}`);
    }

    // Filter by search term
    let filteredUsers = roleFilteredUsers.filter(user =>
      user.name?.toLowerCase().includes(navigation.usersSearchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(navigation.usersSearchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(navigation.usersSearchTerm.toLowerCase())
    );
    logger.debug(`🔍 [Users Filter] After search filter (term: "${navigation.usersSearchTerm}"): ${filteredUsers.length}`);

    // Apply sorting
    filteredUsers = [...filteredUsers].sort((a, b) => {
      let aVal, bVal;

      switch (userManagement.sortField) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'email':
          aVal = a.email?.toLowerCase() || '';
          bVal = b.email?.toLowerCase() || '';
          break;
        case 'role':
          aVal = a.role || '';
          bVal = b.role || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'credits':
          aVal = a.credits || 0;
          bVal = b.credits || 0;
          break;
        case 'createdAt':
          aVal = a.createdAt?.toMillis?.() || 0;
          bVal = b.createdAt?.toMillis?.() || 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return userManagement.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return userManagement.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return (
      <>
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <BaseButton onClick={navigation.handleBackToDashboard} variant="ghost" className="mb-4">
            ← Back to Home
          </BaseButton>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Shield size={32} strokeWidth={2} className="text-gray-600 dark:text-gray-400" />
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <BaseButton onClick={() => setShowAddUserModal(true)} variant="primary" fullWidth className="sm:w-auto" icon={Plus}>
                New User
              </BaseButton>
              <BaseButton onClick={userManagement.loadUsers} variant="success" fullWidth className="sm:w-auto" icon={RefreshCw} title="Refresh user list">
                Refresh
              </BaseButton>
            </div>
          </div>

          {/* Role Filter Tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <BaseButton
              onClick={() => navigation.setUsersRoleFilter('all')}
              variant={navigation.usersRoleFilter === 'all' ? 'primary' : 'ghost'}
              icon={Users}
              size="sm"
            >
              All Users ({userManagement.users.length})
            </BaseButton>
            <BaseButton
              onClick={() => navigation.setUsersRoleFilter('students')}
              variant={navigation.usersRoleFilter === 'students' ? 'primary' : 'ghost'}
              icon={GraduationCap}
              size="sm"
            >
              Students ({stats.students})
            </BaseButton>
            <BaseButton
              onClick={() => navigation.setUsersRoleFilter('teachers')}
              variant={navigation.usersRoleFilter === 'teachers' ? 'primary' : 'ghost'}
              icon={UserCog}
              size="sm"
            >
              Teachers ({stats.teachers})
            </BaseButton>
            <BaseButton
              onClick={() => navigation.setUsersRoleFilter('admins')}
              variant={navigation.usersRoleFilter === 'admins' ? 'warning' : 'ghost'}
              icon={Crown}
              size="sm"
            >
              Admins ({stats.admins})
            </BaseButton>
          </div>

          {/* Search Bar with View Mode Toggle */}
          <SearchBar
            value={navigation.usersSearchTerm}
            onChange={navigation.setUsersSearchTerm}
            placeholder="Search users..."
            viewMode={navigation.usersViewMode}
            onViewModeChange={navigation.setUsersViewMode}
            viewModes={['table', 'grid', 'list']}
            className="mb-6"
          />

          {successMessage && (
            <BaseAlert variant="success" className="mb-5 animate-slide-down" dismissible onDismiss={() => setSuccessMessage('')}>
              {successMessage}
            </BaseAlert>
          )}
          {errorMessage && (
            <BaseAlert variant="danger" className="mb-5 animate-slide-down" dismissible onDismiss={() => setErrorMessage('')}>
              {errorMessage}
            </BaseAlert>
          )}

          {/* TABLE VIEW */}
          {navigation.usersViewMode === 'table' && (
            <div className="rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              {(() => {
                logger.debug(`🔍 [Users Render] View mode: ${navigation.usersViewMode}, Rendering ${filteredUsers.length} users`);
                return null;
              })()}
              {sessionStorage.getItem('viewAsReturnUserId') && !navigation.hasProcessedReturn && userManagement.users.length === 0 ? (
                <BaseLoading variant="spinner" text="Loading..." />
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-gray-600 dark:text-gray-400">
                  <p>No users found with selected filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="p-4 text-left font-semibold text-xs uppercase tracking-wide min-w-[200px] text-gray-600 dark:text-gray-300">
                        <div
                          onClick={() => userManagement.handleSort('name')}
                          className={`flex items-center gap-2 cursor-pointer select-none ${userManagement.sortField === 'name' ? 'text-primary-600 dark:text-primary-400' : ''}`}
                        >
                          <span>User</span>
                          {userManagement.sortField === 'name' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300">
                        <div
                          onClick={() => userManagement.handleSort('credits')}
                          className={`flex items-center gap-2 cursor-pointer select-none ${userManagement.sortField === 'credits' ? 'text-primary-600 dark:text-primary-400' : ''}`}
                        >
                          <span>Credits</span>
                          {userManagement.sortField === 'credits' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300">
                        <div
                          onClick={() => userManagement.handleSort('role')}
                          className={`flex items-center gap-2 cursor-pointer select-none ${userManagement.sortField === 'role' ? 'text-primary-600 dark:text-primary-400' : ''}`}
                        >
                          <span>Role</span>
                          {userManagement.sortField === 'role' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300">
                        <div
                          onClick={() => userManagement.handleSort('status')}
                          className={`flex items-center gap-2 cursor-pointer select-none ${userManagement.sortField === 'status' ? 'text-primary-600 dark:text-primary-400' : ''}`}
                        >
                          <span>Status</span>
                          {userManagement.sortField === 'status' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300">
                        <div
                          onClick={() => userManagement.handleSort('createdAt')}
                          className={`flex items-center gap-2 cursor-pointer select-none ${userManagement.sortField === 'createdAt' ? 'text-primary-600 dark:text-primary-400' : ''}`}
                        >
                          <span>Registration</span>
                          {userManagement.sortField === 'createdAt' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300">
                        <div
                          onClick={() => userManagement.handleSort('email')}
                          className={`flex items-center gap-2 cursor-pointer select-none ${userManagement.sortField === 'email' ? 'text-primary-600 dark:text-primary-400' : ''}`}
                        >
                          <span>Email</span>
                          {userManagement.sortField === 'email' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(userItem => (
                      <tr
                        key={userItem.id}
                        className={`transition-colors border-b border-gray-200 dark:border-gray-700 ${userItem.status !== 'active' ? 'opacity-60 bg-red-50 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        <td className="p-4 text-gray-900 dark:text-white">
                          <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => handleViewUserProfile(userItem)}
                            title="View full profile"
                          >
                            <div className="w-9 h-9 rounded-full bg-zinc-800 dark:bg-zinc-700 flex items-center justify-center text-white flex-shrink-0">
                              {(() => {
                                const iconName = ROLE_INFO[userItem.role]?.icon || 'User';
                                const IconComponent = ICON_MAP[iconName] || User;
                                return <IconComponent size={18} strokeWidth={2} />;
                              })()}
                            </div>
                            <div className="flex-1 min-w-[150px]">
                              <div className="font-semibold whitespace-nowrap hover:underline">
                                {userItem.name || 'No name'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <BaseBadge variant="warning">{userItem.credits || 0}</BaseBadge>
                        </td>
                        <td className="p-4">
                          <BaseBadge
                            variant={
                              userItem.role === 'admin' ? 'warning' :
                              (userItem.role === 'teacher' || userItem.role === 'trial_teacher') ? 'default' :
                              'info'
                            }
                          >
                            {ROLE_INFO[userItem.role]?.name || userItem.role}
                          </BaseBadge>
                        </td>
                        <td className="p-4">
                          <BaseBadge
                            variant={
                              userItem.status === 'active' ? 'success' :
                              userItem.status === 'suspended' ? 'danger' :
                              'warning'
                            }
                          >
                            {userItem.status === 'active' ? 'Active' :
                             userItem.status === 'suspended' ? 'Suspended' :
                             'Pending'}
                          </BaseBadge>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(userItem.createdAt)}
                          </span>
                        </td>
                        <td className="p-4">
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
        )}

          {/* GRID VIEW */}
          {navigation.usersViewMode === 'grid' && (
            filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-gray-600 dark:text-gray-400">
                <p>No users found with selected filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredUsers.map(userItem => (
                  <UserCard
                    key={userItem.id}
                    user={userItem}
                    enrollmentCount={resourceAssignment.enrollmentCounts[userItem.id] || 0}
                    onView={handleViewUserProfile}
                    onDelete={handleDeleteUser}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )
          )}

          {/* LIST VIEW */}
          {navigation.usersViewMode === 'list' && (
            filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-gray-600 dark:text-gray-400">
                <p>No users found with selected filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map(userItem => (
                  <UserCard
                    key={userItem.id}
                    user={userItem}
                    enrollmentCount={resourceAssignment.enrollmentCounts[userItem.id] || 0}
                    onView={handleViewUserProfile}
                    onDelete={handleDeleteUser}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )
          )}

        </div>

      </DashboardLayout>

      {showAddUserModal && (
        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          onUserCreated={handleCreateUser}
          currentUser={user}
          isAdmin={isAdmin}
        />
      )}

      {navigation.showUserProfile && navigation.selectedUserProfile && (
        <BaseModal
          isOpen={navigation.showUserProfile}
          onClose={handleCloseUserProfile}
          title="User Profile"
          size="xl"
        >
          <UserProfile
            selectedUser={navigation.selectedUserProfile}
            currentUser={user}
            onBack={handleCloseUserProfile}
            onUpdate={userManagement.loadUsers}
            isAdmin={isAdmin}
          />
        </BaseModal>
      )}
    </>
    );
  }

  // ==========================================
  // MAIN DASHBOARD (DEFAULT VIEW)
  // ==========================================

  // Filter dashboard cards
  const dashboardCards = [
    {
      id: 'users',
      icon: Shield,
      title: "Users",
      count: userManagement.users.length,
      countLabel: userManagement.users.length === 1 ? "user" : "users",
      onClick: () => navigation.setCurrentScreen('users'),
      createLabel: "New User",
      onCreateClick: () => setShowAddUserModal(true)
    },
    {
      id: 'students',
      icon: GraduationCap,
      title: "Students",
      count: stats.students,
      countLabel: stats.students === 1 ? "student" : "students",
      onClick: () => {
        navigation.setCurrentScreen('users');
        navigation.setUsersRoleFilter('students');
      },
      createLabel: "Add Student",
      onCreateClick: () => setShowAddUserModal(true)
    },
    {
      id: 'courses',
      icon: BookOpen,
      title: "Courses",
      count: courses.length,
      countLabel: courses.length === 1 ? "course" : "courses",
      onClick: () => navigation.setCurrentScreen('courses'),
      createLabel: "New Course",
      onCreateClick: () => {
        navigation.setOpenCourseModal(true);
        navigation.setCurrentScreen('courses');
      }
    },
    {
      id: 'content',
      icon: FileText,
      title: "Content",
      count: allContent.length,
      countLabel: allContent.length === 1 ? "item" : "items",
      onClick: () => navigation.setCurrentScreen('content'),
      createLabel: "New Content",
      onCreateClick: () => {
        navigation.setOpenContentModal(true);
        navigation.setCurrentScreen('content');
      }
    },
    {
      id: 'classes',
      icon: Calendar,
      title: "Classes",
      count: classSessions.length,
      countLabel: classSessions.length === 1 ? "session" : "sessions",
      onClick: () => navigation.setCurrentScreen('classSessions'),
      createLabel: "New Session",
      onCreateClick: () => {
        navigation.setCurrentScreen('classSessions');
      }
    },
    {
      id: 'game',
      icon: Gamepad2,
      title: "Question Game",
      count: stats.totalGames,
      countLabel: stats.totalGames === 1 ? "game" : "games",
      onClick: () => navigation.setCurrentScreen('setup'),
      createLabel: "Play Game",
      onCreateClick: () => navigation.setCurrentScreen('setup')
    },
    {
      id: 'liveGame',
      icon: Zap,
      title: "Live Game",
      count: 0,
      countLabel: "active",
      onClick: () => navigation.setCurrentScreen('liveGame'),
      createLabel: "Start Live Game",
      onCreateClick: () => navigation.setCurrentScreen('liveGame')
    },
    {
      id: 'analytics',
      icon: BarChart3,
      title: "Analytics",
      count: 0,
      countLabel: "insights",
      onClick: () => navigation.setCurrentScreen('analytics'),
      createLabel: "View Analytics",
      onCreateClick: () => navigation.setCurrentScreen('analytics')
    },
    {
      id: 'payments',
      icon: DollarSign,
      title: "Payments",
      count: 0,
      countLabel: "system",
      onClick: () => navigation.setCurrentScreen('payments'),
      createLabel: "Manage Payments",
      onCreateClick: () => navigation.setCurrentScreen('payments')
    }
  ];

  const filteredDashboardCards = dashboardCards.filter(card =>
    card.title.toLowerCase().includes(navigation.dashboardSearchTerm.toLowerCase())
  );

  return (
    <>
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <div className="mb-8 md:mb-12 text-center">
            <div className="flex items-center gap-3 mb-2 justify-center">
              <Crown size={32} md:size={40} strokeWidth={2} className="text-gray-600 dark:text-gray-400" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            <BaseCard
              icon={Users}
              title="Total Users"
              hover
              className="bg-white dark:bg-gray-800"
            >
              <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            </BaseCard>

            <BaseCard
              icon={Crown}
              title="Administrators"
              hover
              className="bg-white dark:bg-gray-800"
            >
              <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{stats.admins}</div>
            </BaseCard>

            <BaseCard
              icon={UserCog}
              title="Teachers"
              hover
              className="bg-white dark:bg-gray-800"
            >
              <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{stats.teachers}</div>
            </BaseCard>

            <BaseCard
              icon={GraduationCap}
              title="Students"
              hover
              className="bg-white dark:bg-gray-800"
            >
              <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{stats.students}</div>
            </BaseCard>

            <BaseCard
              icon={CheckCircle}
              title="Active"
              hover
              className="bg-white dark:bg-gray-800"
            >
              <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{stats.active}</div>
            </BaseCard>

            <BaseCard
              icon={Ban}
              title="Suspended"
              hover
              className="bg-white dark:bg-gray-800"
            >
              <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{stats.suspended}</div>
            </BaseCard>
          </div>

          <SearchBar
            value={navigation.dashboardSearchTerm}
            onChange={navigation.setDashboardSearchTerm}
            placeholder="Search sections..."
            viewMode={navigation.dashboardViewMode}
            onViewModeChange={navigation.setDashboardViewMode}
            className="mb-6"
          />

          <div className={navigation.dashboardViewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6' : 'space-y-4'}>
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
      </DashboardLayout>

      {showAddUserModal && (
        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          onUserCreated={handleCreateUser}
          currentUser={user}
          isAdmin={isAdmin}
        />
      )}

      {navigation.showUserProfile && navigation.selectedUserProfile && (
        <BaseModal
          isOpen={navigation.showUserProfile}
          onClose={handleCloseUserProfile}
          title="User Profile"
          size="xl"
        >
          <UserProfile
            selectedUser={navigation.selectedUserProfile}
            currentUser={user}
            onBack={handleCloseUserProfile}
            onUpdate={userManagement.loadUsers}
            isAdmin={isAdmin}
          />
        </BaseModal>
      )}

      {/* AI Assistant Widget */}
      <DashboardAssistant />
    </>
  );
}

export default AdminDashboard;
