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
import BaseButton from './common/BaseButton';
// REMOVED: Old LiveClassManager and LiveClassRoom - using unified ClassSessionManager/ClassSessionRoom now
// import LiveClassManager from './LiveClassManager';
// import LiveClassRoom from './LiveClassRoom';
import LiveGameProjection from './LiveGameProjection';
import LiveGameSetup from './LiveGameSetup';
import MessagesPanel from './MessagesPanel';
import AdminPaymentsPanel from './AdminPaymentsPanel';
import AIConfigPanel from './AIConfigPanel';
import AICredentialsModal from './AICredentialsModal';
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
import './AdminDashboard.css';

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
        <div className="flex flex-col items-center justify-center min-h-[400px]" style={{ color: 'var(--color-text-secondary)' }}>
          <div className="w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }}></div>
          <p>Loading admin panel...</p>
        </div>
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
      <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Cargando pizarra...</div>}>
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

  // REMOVED: Old Live Class Room - Replaced by ClassSessionRoom
  // if (navigation.currentScreen === 'liveClassRoom' && navigation.selectedLiveClass) {
  //   return (
  //     <LiveClassRoom
  //       liveClass={navigation.selectedLiveClass}
  //       user={user}
  //       userRole={userRole}
  //       onLeave={() => {
  //         navigation.setSelectedLiveClass(null);
  //         navigation.setCurrentScreen('liveClasses');
  //       }}
  //     />
  //   );
  // }

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
        <div className="p-6 md:p-8">
          <BaseButton onClick={navigation.handleBackToDashboard} variant="ghost" className="mb-4">
            ← Back to Home
          </BaseButton>
          <AIConfigPanel />
        </div>
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

  // REMOVED: Old Class Manager (without LiveKit/Whiteboards) - Replaced by ClassSessionManager
  // if (navigation.currentScreen === 'classes') {
  //   return (
  //     <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
  //       <ClassManager user={user} courses={courses} onBack={navigation.handleBackToDashboard} openCreateModal={navigation.openClassModal} />
  //     </DashboardLayout>
  //   );
  // }

  // Analytics Dashboard - WITH Layout
  if (navigation.currentScreen === 'analytics') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <div className="p-6 md:p-8">
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
        <div className="p-6 md:p-8">
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
        <div className="p-6 md:p-8">
          <BaseButton onClick={navigation.handleBackToDashboard} variant="ghost" className="mb-4">
            ← Back to Home
          </BaseButton>
          <AttendanceView teacher={user} />
        </div>
      </DashboardLayout>
    );
  }

  // Settings Panel - WITH Layout
  if (navigation.currentScreen === 'settings') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
          <BaseButton onClick={navigation.handleBackToDashboard} variant="ghost" className="mb-6">
            ← Back to Home
          </BaseButton>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Settings</h1>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Manage system settings and preferences
              </p>
            </div>

            {/* Tabs */}
            <div style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div className="flex gap-4">
                <button
                  onClick={() => setSettingsTab('general')}
                  className="flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors"
                  style={{
                    borderColor: settingsTab === 'general' ? 'var(--color-primary)' : 'transparent',
                    color: settingsTab === 'general' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                  }}
                >
                  <Info className="w-5 h-5" />
                  General
                </button>
                <button
                  onClick={() => setSettingsTab('credentials')}
                  className="flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors"
                  style={{
                    borderColor: settingsTab === 'credentials' ? 'var(--color-primary)' : 'transparent',
                    color: settingsTab === 'credentials' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                  }}
                >
                  <Key className="w-5 h-5" />
                  Credenciales IA
                </button>
                <button
                  onClick={() => setSettingsTab('theme')}
                  className="flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors"
                  style={{
                    borderColor: settingsTab === 'theme' ? 'var(--color-primary)' : 'transparent',
                    color: settingsTab === 'theme' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                  }}
                >
                  <Palette className="w-5 h-5" />
                  Editor de Temas
                </button>
              </div>
            </div>

            {/* Tab Content: General */}
            {settingsTab === 'general' && (
              <div className="space-y-6">
                <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                  <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>System Information</h2>
                  <div className="space-y-3" style={{ color: 'var(--color-text-secondary)' }}>
                    <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <span className="font-medium">Application Version</span>
                      <span>v1.0.0</span>
                    </div>
                    <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <span className="font-medium">Environment</span>
                      <span>{import.meta.env.MODE}</span>
                    </div>
                    <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <span className="font-medium">Admin Email</span>
                      <span>{user.email}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-medium">Firebase Project</span>
                      <span>xiwen-app-2026</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: Credentials */}
            {settingsTab === 'credentials' && (
              <div className="space-y-6">
                {/* AI Credentials Section */}
            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <Settings className="w-5 h-5" />
                Credenciales de IA
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Configura las API keys de los proveedores de IA para usar funciones inteligentes en la plataforma
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" key={credentialsRefresh}>
                {aiService.getAvailableProviders().map((provider) => {
                  // Check credentials from Firebase Secret Manager OR localStorage
                  const hasFirebaseCredential = aiCredentials[provider.name] || false;
                  const hasLocalStorageCredential = provider.name === 'elevenlabs'
                    ? !!localStorage.getItem('ai_credentials_elevenlabs')
                    : false;
                  const isConfigured = hasFirebaseCredential || hasLocalStorageCredential;

                  return (
                    <button
                      key={provider.name}
                      onClick={() => {
                        setSelectedProvider({
                          ...provider,
                          docsUrl: provider.name === 'openai' ? 'https://platform.openai.com/api-keys' :
                                   provider.name === 'gemini' ? 'https://aistudio.google.com/app/apikey' :
                                   provider.name === 'grok' ? 'https://console.x.ai/' :
                                   provider.name === 'elevenlabs' ? 'https://elevenlabs.io/app/settings/api-keys' :
                                   'https://console.anthropic.com/settings/keys'
                        });
                        setShowAICredentialsModal(true);
                      }}
                      className="relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 active:scale-[0.98]"
                      style={{
                        borderColor: isConfigured ? 'var(--color-success)' : 'var(--color-border)',
                        backgroundColor: isConfigured ? 'rgba(34, 197, 94, 0.1)' : 'var(--color-bg-primary)'
                      }}
                    >
                      <div className="text-3xl">{provider.icon}</div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {provider.label}
                        </h3>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {provider.model}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {isConfigured ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--color-success)', color: 'white' }}>
                            <CheckCircle className="w-3 h-3" />
                            Configurado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                            <Settings className="w-3 h-3" />
                            Configurar
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <strong>Nota:</strong> Las credenciales se guardan de forma segura en el navegador local. No se comparten con otros usuarios.
                </p>
              </div>
            </div>

            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-start gap-3">
                <Settings className="flex-shrink-0 mt-1" size={20} style={{ color: 'var(--color-text-secondary)' }} />
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    Additional Settings Coming Soon
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    More configuration options will be available in future updates, including:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• Email notifications preferences</li>
                    <li>• System-wide defaults</li>
                    <li>• Backup and restore options</li>
                    <li>• Integration settings</li>
                  </ul>
                </div>
              </div>
            </div>
              </div>
            )}

            {/* Tab Content: Theme */}
            {settingsTab === 'theme' && (
              <div className="space-y-6">
                <ThemeCustomizer />
              </div>
            )}
          </div>
        </div>

        {/* AI Credentials Modal */}
        <AICredentialsModal
          isOpen={showAICredentialsModal}
          onClose={() => {
            setShowAICredentialsModal(false);
            setSelectedProvider(null);
          }}
          provider={selectedProvider}
          isConfigured={selectedProvider ? aiCredentials[selectedProvider.name] : false}
          onSave={async (providerName, apiKey) => {
            logger.info('API Key saved for provider:', providerName);
            // Forzar re-render para actualizar el estado visual
            setCredentialsRefresh(prev => prev + 1);
            // Reload providers to update configured status
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }}
        />
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

  // REMOVED: Old Live Class Manager - Replaced by ClassSessionManager
  // if (navigation.currentScreen === 'liveClasses') {
  //   return (
  //     <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
  //       <LiveClassManager
  //         user={user}
  //         onBack={navigation.handleBackToDashboard}
  //         onStartClass={(liveClass) => {
  //           navigation.setSelectedLiveClass(liveClass);
  //           navigation.setCurrentScreen('liveClassRoom');
  //         }}
  //       />
  //     </DashboardLayout>
  //   );
  // }

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
          <div className="min-h-[60vh] flex flex-col justify-center items-center">
            <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }}></div>
            <p>Returning...</p>
          </div>
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
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
          <BaseButton onClick={navigation.handleBackToDashboard} variant="ghost" className="mb-4">
            ← Back to Home
          </BaseButton>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Shield size={32} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>User Management</h1>
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
            <button
              onClick={() => navigation.setUsersRoleFilter('all')}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all"
              style={{
                backgroundColor: navigation.usersRoleFilter === 'all' ? 'var(--color-info)' : 'var(--color-bg-tertiary)',
                color: navigation.usersRoleFilter === 'all' ? 'white' : 'var(--color-text-secondary)'
              }}
            >
              <Users size={16} className="inline mr-2" strokeWidth={2} />
              All Users ({userManagement.users.length})
            </button>
            <button
              onClick={() => navigation.setUsersRoleFilter('students')}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all"
              style={{
                backgroundColor: navigation.usersRoleFilter === 'students' ? 'var(--color-info)' : 'var(--color-bg-tertiary)',
                color: navigation.usersRoleFilter === 'students' ? 'white' : 'var(--color-text-secondary)'
              }}
            >
              <GraduationCap size={16} className="inline mr-2" strokeWidth={2} />
              Students ({stats.students})
            </button>
            <button
              onClick={() => navigation.setUsersRoleFilter('teachers')}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all"
              style={{
                backgroundColor: navigation.usersRoleFilter === 'teachers' ? 'var(--color-info)' : 'var(--color-bg-tertiary)',
                color: navigation.usersRoleFilter === 'teachers' ? 'white' : 'var(--color-text-secondary)'
              }}
            >
              <UserCog size={16} className="inline mr-2" strokeWidth={2} />
              Teachers ({stats.teachers})
            </button>
            <button
              onClick={() => navigation.setUsersRoleFilter('admins')}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all"
              style={{
                backgroundColor: navigation.usersRoleFilter === 'admins' ? 'var(--color-warning)' : 'var(--color-bg-tertiary)',
                color: navigation.usersRoleFilter === 'admins' ? 'white' : 'var(--color-text-secondary)'
              }}
            >
              <Crown size={16} className="inline mr-2" strokeWidth={2} />
              Admins ({stats.admins})
            </button>
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
            <div className="max-w-[1200px] mx-auto mb-5 px-5 py-4 rounded-lg font-semibold flex items-center gap-3 text-white animate-slide-down" style={{ backgroundColor: 'var(--color-success)' }}>
              <CheckCircle size={18} strokeWidth={2} /> {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="max-w-[1200px] mx-auto mb-5 px-5 py-4 rounded-lg font-semibold flex items-center gap-3 text-white animate-slide-down" style={{ backgroundColor: 'var(--color-danger)' }}>
              <AlertTriangle size={18} strokeWidth={2} /> {errorMessage}
            </div>
          )}

          {/* TABLE VIEW */}
          {navigation.usersViewMode === 'table' && (
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              {(() => {
                logger.debug(`🔍 [Users Render] View mode: ${navigation.usersViewMode}, Rendering ${filteredUsers.length} users`);
                return null;
              })()}
              {sessionStorage.getItem('viewAsReturnUserId') && !navigation.hasProcessedReturn && userManagement.users.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px]" style={{ color: 'var(--color-text-secondary)' }}>
                  <div className="w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }}></div>
                  <p>Loading...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <p>No users found with selected filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                  <thead style={{ backgroundColor: 'var(--color-bg-tertiary)', borderBottom: '2px solid var(--color-border)' }}>
                    <tr>
                      <th className="p-4 text-left font-semibold text-[13px] uppercase tracking-wide min-w-[200px]" style={{ color: 'var(--color-text-secondary)' }}>
                        <div
                          onClick={() => userManagement.handleSort('name')}
                          className="flex items-center gap-2 cursor-pointer select-none"
                          style={{
                            color: userManagement.sortField === 'name' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                          }}
                        >
                          <span>User</span>
                          {userManagement.sortField === 'name' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-[13px] uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                        <div
                          onClick={() => userManagement.handleSort('credits')}
                          className="flex items-center gap-2 cursor-pointer select-none"
                          style={{
                            color: userManagement.sortField === 'credits' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                          }}
                        >
                          <span>Credits</span>
                          {userManagement.sortField === 'credits' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-[13px] uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                        <div
                          onClick={() => userManagement.handleSort('role')}
                          className="flex items-center gap-2 cursor-pointer select-none"
                          style={{
                            color: userManagement.sortField === 'role' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                          }}
                        >
                          <span>Role</span>
                          {userManagement.sortField === 'role' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-[13px] uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                        <div
                          onClick={() => userManagement.handleSort('status')}
                          className="flex items-center gap-2 cursor-pointer select-none"
                          style={{
                            color: userManagement.sortField === 'status' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                          }}
                        >
                          <span>Status</span>
                          {userManagement.sortField === 'status' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-[13px] uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                        <div
                          onClick={() => userManagement.handleSort('createdAt')}
                          className="flex items-center gap-2 cursor-pointer select-none"
                          style={{
                            color: userManagement.sortField === 'createdAt' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                          }}
                        >
                          <span>Registration</span>
                          {userManagement.sortField === 'createdAt' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-[13px] uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                        <div
                          onClick={() => userManagement.handleSort('email')}
                          className="flex items-center gap-2 cursor-pointer select-none"
                          style={{
                            color: userManagement.sortField === 'email' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                          }}
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
                        className="transition-colors"
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          opacity: userItem.status !== 'active' ? 0.6 : 1,
                          background: userItem.status !== 'active'
                            ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.05) 10px, rgba(239, 68, 68, 0.05) 20px)'
                            : 'transparent'
                        }}
                      >
                        <td className="p-4" style={{ color: 'var(--color-text-primary)' }}>
                          <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => handleViewUserProfile(userItem)}
                            title="View full profile"
                          >
                            <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-white flex-shrink-0">
                              {(() => {
                                const iconName = ROLE_INFO[userItem.role]?.icon || 'User';
                                const IconComponent = ICON_MAP[iconName] || User;
                                return <IconComponent size={18} strokeWidth={2} />;
                              })()}
                            </div>
                            <div className="flex-1 min-w-[150px]">
                              <div className="font-semibold whitespace-nowrap hover:underline" style={{ color: 'var(--color-text-primary)' }}>
                                {userItem.name || 'No name'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4" style={{ color: 'var(--color-text-primary)' }}>
                          <div className="inline-block px-3 py-1 rounded-xl text-white font-semibold text-[13px]" style={{ backgroundColor: 'var(--color-warning)' }}>
                            {userItem.credits || 0}
                          </div>
                        </td>
                        <td className="p-4" style={{ color: 'var(--color-text-primary)' }}>
                          <span
                            className="inline-block px-3 py-1 rounded-xl font-semibold text-xs uppercase tracking-wide text-white"
                            style={{
                              backgroundColor: userItem.role === 'admin'
                                ? 'var(--color-warning)'
                                : (userItem.role === 'teacher' || userItem.role === 'trial_teacher')
                                ? '#27272a'
                                : 'var(--color-info)'
                            }}
                          >
                            {ROLE_INFO[userItem.role]?.name || userItem.role}
                          </span>
                        </td>
                        <td className="p-4" style={{ color: 'var(--color-text-primary)' }}>
                          <span
                            className="inline-block px-3 py-1 rounded-xl font-semibold text-xs text-white"
                            style={{
                              backgroundColor: userItem.status === 'active'
                                ? 'var(--color-success)'
                                : userItem.status === 'suspended'
                                ? 'var(--color-danger)'
                                : 'var(--color-warning)'
                            }}
                          >
                            {userItem.status === 'active' ? 'Active' :
                             userItem.status === 'suspended' ? 'Suspended' :
                             'Pending'}
                          </span>
                        </td>
                        <td className="p-4" style={{ color: 'var(--color-text-primary)' }}>
                          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {formatDate(userItem.createdAt)}
                          </span>
                        </td>
                        <td className="p-4" style={{ color: 'var(--color-text-primary)' }}>
                          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
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
              <div className="py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                <p>No users found with selected filters</p>
              </div>
            ) : (
              <div className="users-grid">
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
              <div className="py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                <p>No users found with selected filters</p>
              </div>
            ) : (
              <div className="users-list">
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
        <div className="modal-overlay" onClick={handleCloseUserProfile}>
          <div className="modal-box flex flex-col" onClick={(e) => e.stopPropagation()}>
            <UserProfile
              selectedUser={navigation.selectedUserProfile}
              currentUser={user}
              onBack={handleCloseUserProfile}
              onUpdate={userManagement.loadUsers}
              isAdmin={isAdmin}
            />
          </div>
        </div>
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
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
          <div className="mb-12 text-center">
            <div className="flex items-center gap-3 mb-2 justify-center">
              <Crown size={40} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
              <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Admin Panel</h1>
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 mb-12">
            <div className="rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-center w-16 h-16 rounded-lg text-white bg-zinc-800">
                <Users size={36} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="text-[32px] font-bold leading-none mb-2" style={{ color: 'var(--color-text-primary)' }}>{stats.total}</div>
                <div className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Total Users</div>
              </div>
            </div>

            <div className="rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-center w-16 h-16 rounded-lg text-white" style={{ backgroundColor: 'var(--color-warning)' }}>
                <Crown size={36} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="text-[32px] font-bold leading-none mb-2" style={{ color: 'var(--color-text-primary)' }}>{stats.admins}</div>
                <div className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Administrators</div>
              </div>
            </div>

            <div className="rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-center w-16 h-16 rounded-lg text-white bg-zinc-800">
                <UserCog size={36} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="text-[32px] font-bold leading-none mb-2" style={{ color: 'var(--color-text-primary)' }}>{stats.teachers}</div>
                <div className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Teachers</div>
              </div>
            </div>

            <div className="rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-center w-16 h-16 rounded-lg text-white" style={{ backgroundColor: 'var(--color-info)' }}>
                <GraduationCap size={36} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="text-[32px] font-bold leading-none mb-2" style={{ color: 'var(--color-text-primary)' }}>{stats.students}</div>
                <div className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Students</div>
              </div>
            </div>

            <div className="rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-center w-16 h-16 rounded-lg text-white" style={{ backgroundColor: 'var(--color-success)' }}>
                <CheckCircle size={36} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="text-[32px] font-bold leading-none mb-2" style={{ color: 'var(--color-text-primary)' }}>{stats.active}</div>
                <div className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Active</div>
              </div>
            </div>

            <div className="rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-center w-16 h-16 rounded-lg text-white" style={{ backgroundColor: 'var(--color-danger)' }}>
                <Ban size={36} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="text-[32px] font-bold leading-none mb-2" style={{ color: 'var(--color-text-primary)' }}>{stats.suspended}</div>
                <div className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Suspended</div>
              </div>
            </div>
          </div>

          <SearchBar
            value={navigation.dashboardSearchTerm}
            onChange={navigation.setDashboardSearchTerm}
            placeholder="Search sections..."
            viewMode={navigation.dashboardViewMode}
            onViewModeChange={navigation.setDashboardViewMode}
            className="mb-6"
          />

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
        <div className="modal-overlay" onClick={handleCloseUserProfile}>
          <div className="modal-box flex flex-col" onClick={(e) => e.stopPropagation()}>
            <UserProfile
              selectedUser={navigation.selectedUserProfile}
              currentUser={user}
              onBack={handleCloseUserProfile}
              onUpdate={userManagement.loadUsers}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default AdminDashboard;
