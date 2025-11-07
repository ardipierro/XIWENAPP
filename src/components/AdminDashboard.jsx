import logger from '../utils/logger';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Zap
} from 'lucide-react';
import {
  loadStudents,
  loadGameHistory,
  loadCategories,
  loadCourses
} from '../firebase/firestore';
import { deleteUser } from '../firebase/users';
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
import ExcalidrawWhiteboard from './ExcalidrawWhiteboard';
import ExcalidrawManager from './ExcalidrawManager';
import StudentCard from './StudentCard';
import UserCard from './UserCard';
import LiveClassManager from './LiveClassManager';
import LiveClassRoom from './LiveClassRoom';
import LiveGameProjection from './LiveGameProjection';
import LiveGameSetup from './LiveGameSetup';
import MessagesPanel from './MessagesPanel';
import AdminPaymentsPanel from './AdminPaymentsPanel';
import AIConfigPanel from './AIConfigPanel';
import ClassSessionManager from './ClassSessionManager';
import ClassSessionRoom from './ClassSessionRoom';
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
      const [students, games, categories, allCourses, teacherContent, teacherClasses] = await Promise.all([
        loadStudents(),
        loadGameHistory(),
        loadCategories(),
        loadCourses(),
        getContentByTeacher(user.uid),
        getClassesByTeacher(user.uid),
        userManagement.loadUsers() // Load users with credits via hook
      ]);

      logger.debug(`⏱️ [AdminDashboard] Parallel queries: ${(performance.now() - startTime).toFixed(0)}ms`);

      const activeCourses = allCourses.filter(c => c.active !== false);
      setCourses(activeCourses);
      setAllContent(teacherContent);
      setAllClasses(teacherClasses);

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

  // User created
  const handleUserCreated = useCallback(() => {
    setShowAddUserModal(false);
    userManagement.loadUsers();
    showSuccess('User created successfully');
  }, []);

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
        <div className="flex flex-col items-center justify-center min-h-[400px] text-secondary-600 dark:text-secondary-400">
          <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 border-t-accent-500 rounded-full animate-spin mb-4"></div>
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
      <ExcalidrawWhiteboard
        onBack={() => {
          navigation.setExcalidrawManagerKey(prev => prev + 1);
          navigation.setCurrentScreen('excalidrawSessions');
        }}
        initialSession={navigation.selectedExcalidrawSession}
      />
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

  // Live Class Room - NO Layout (fullscreen)
  if (navigation.currentScreen === 'liveClassRoom' && navigation.selectedLiveClass) {
    return (
      <LiveClassRoom
        liveClass={navigation.selectedLiveClass}
        user={user}
        userRole={userRole}
        onLeave={() => {
          navigation.setSelectedLiveClass(null);
          navigation.setCurrentScreen('liveClasses');
        }}
      />
    );
  }

  // Class Session Manager (Sistema Unificado) - WITH Layout
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

  // AI Configuration Panel - WITH Layout
  if (navigation.currentScreen === 'aiConfig') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <div className="p-6 md:p-8">
          <button onClick={navigation.handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Back to Home
          </button>
          <AIConfigPanel />
        </div>
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
        <UnifiedContentManager user={user} onBack={navigation.handleBackToDashboard} />
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

  // Class Manager - WITH Layout
  if (navigation.currentScreen === 'classes') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <ClassManager user={user} courses={courses} onBack={navigation.handleBackToDashboard} openCreateModal={navigation.openClassModal} />
      </DashboardLayout>
    );
  }

  // Analytics Dashboard - WITH Layout
  if (navigation.currentScreen === 'analytics') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <div className="p-6 md:p-8">
          <button onClick={navigation.handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Back to Home
          </button>
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
          <button onClick={navigation.handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Back to Home
          </button>
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
          <button onClick={navigation.handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Back to Home
          </button>
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

  // Live Class Manager - WITH Layout
  if (navigation.currentScreen === 'liveClasses') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <LiveClassManager
          user={user}
          onBack={navigation.handleBackToDashboard}
          onStartClass={(liveClass) => {
            navigation.setSelectedLiveClass(liveClass);
            navigation.setCurrentScreen('liveClassRoom');
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
          <div className="min-h-[60vh] flex flex-col justify-center items-center">
            <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 border-t-accent-500 rounded-full animate-spin"></div>
            <p>Returning...</p>
          </div>
        </DashboardLayout>
      );
    }

    // Filter users by role
    const roleFilteredUsers = useMemo(() => {
      let filtered = userManagement.users;

      if (navigation.usersRoleFilter === 'students') {
        filtered = filtered.filter(u => ['student', 'listener', 'trial'].includes(u.role));
      } else if (navigation.usersRoleFilter === 'teachers') {
        filtered = filtered.filter(u => ['teacher', 'trial_teacher'].includes(u.role));
      } else if (navigation.usersRoleFilter === 'admins') {
        filtered = filtered.filter(u => u.role === 'admin');
      }

      return filtered;
    }, [userManagement.users, navigation.usersRoleFilter]);

    // Filter by search term
    const filteredUsers = useMemo(() => {
      return roleFilteredUsers.filter(user =>
        user.name?.toLowerCase().includes(navigation.usersSearchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(navigation.usersSearchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(navigation.usersSearchTerm.toLowerCase())
      );
    }, [roleFilteredUsers, navigation.usersSearchTerm]);

    return (
      <>
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={navigation.handleMenuAction} currentScreen={navigation.currentScreen}>
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
          <button onClick={navigation.handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Back to Home
          </button>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Shield size={32} strokeWidth={2} className="text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button onClick={() => setShowAddUserModal(true)} className="btn btn-primary w-full sm:w-auto">
                <Plus size={18} strokeWidth={2} /> New User
              </button>
              <button onClick={userManagement.loadUsers} className="btn btn-primary !bg-green-600 hover:!bg-green-700 w-full sm:w-auto" title="Refresh user list">
                <RefreshCw size={18} strokeWidth={2} /> Refresh
              </button>
            </div>
          </div>

          {/* Role Filter Tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => navigation.setUsersRoleFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                navigation.usersRoleFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Users size={16} className="inline mr-2" strokeWidth={2} />
              All Users ({userManagement.users.length})
            </button>
            <button
              onClick={() => navigation.setUsersRoleFilter('students')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                navigation.usersRoleFilter === 'students'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <GraduationCap size={16} className="inline mr-2" strokeWidth={2} />
              Students ({stats.students})
            </button>
            <button
              onClick={() => navigation.setUsersRoleFilter('teachers')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                navigation.usersRoleFilter === 'teachers'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <UserCog size={16} className="inline mr-2" strokeWidth={2} />
              Teachers ({stats.teachers})
            </button>
            <button
              onClick={() => navigation.setUsersRoleFilter('admins')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                navigation.usersRoleFilter === 'admins'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
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
            <div className="max-w-[1200px] mx-auto mb-5 px-5 py-4 rounded-lg font-semibold flex items-center gap-3 bg-success-500 text-white animate-slide-down">
              <CheckCircle size={18} strokeWidth={2} /> {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="max-w-[1200px] mx-auto mb-5 px-5 py-4 rounded-lg font-semibold flex items-center gap-3 bg-error-500 text-white animate-slide-down">
              <AlertTriangle size={18} strokeWidth={2} /> {errorMessage}
            </div>
          )}

          {/* TABLE VIEW */}
          {navigation.usersViewMode === 'table' && (
            <div className="bg-secondary-50 dark:bg-secondary-900 border border-primary-200 dark:border-primary-800 rounded-xl overflow-hidden">
              {sessionStorage.getItem('viewAsReturnUserId') && !navigation.hasProcessedReturn && userManagement.users.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-secondary-600 dark:text-secondary-400">
                  <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 border-t-accent-500 rounded-full animate-spin mb-4"></div>
                  <p>Loading...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-secondary-600 dark:text-secondary-400">
                  <p>No users found with selected filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                  <thead className="bg-tertiary-50 dark:bg-tertiary-900 border-b-2 border-primary-200 dark:border-primary-800">
                    <tr>
                      <th className="p-4 text-left font-semibold text-[13px] text-secondary-600 dark:text-secondary-400 uppercase tracking-wide min-w-[200px]">
                        <div
                          onClick={() => userManagement.handleSort('name')}
                          className={`flex items-center gap-2 cursor-pointer select-none ${
                            userManagement.sortField === 'name'
                              ? 'text-accent-600 dark:text-accent-400'
                              : 'hover:text-accent-600 dark:hover:text-accent-400'
                          }`}
                        >
                          <span>User</span>
                          {userManagement.sortField === 'name' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-[13px] text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">
                        <div
                          onClick={() => userManagement.handleSort('credits')}
                          className={`flex items-center gap-2 cursor-pointer select-none ${
                            userManagement.sortField === 'credits'
                              ? 'text-accent-600 dark:text-accent-400'
                              : 'hover:text-accent-600 dark:hover:text-accent-400'
                          }`}
                        >
                          <span>Credits</span>
                          {userManagement.sortField === 'credits' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-[13px] text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">
                        <div
                          onClick={() => userManagement.handleSort('role')}
                          className={`flex items-center gap-2 cursor-pointer select-none ${
                            userManagement.sortField === 'role'
                              ? 'text-accent-600 dark:text-accent-400'
                              : 'hover:text-accent-600 dark:hover:text-accent-400'
                          }`}
                        >
                          <span>Role</span>
                          {userManagement.sortField === 'role' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-[13px] text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">
                        <div
                          onClick={() => userManagement.handleSort('status')}
                          className={`flex items-center gap-2 cursor-pointer select-none ${
                            userManagement.sortField === 'status'
                              ? 'text-accent-600 dark:text-accent-400'
                              : 'hover:text-accent-600 dark:hover:text-accent-400'
                          }`}
                        >
                          <span>Status</span>
                          {userManagement.sortField === 'status' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-[13px] text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">
                        <div
                          onClick={() => userManagement.handleSort('createdAt')}
                          className={`flex items-center gap-2 cursor-pointer select-none ${
                            userManagement.sortField === 'createdAt'
                              ? 'text-accent-600 dark:text-accent-400'
                              : 'hover:text-accent-600 dark:hover:text-accent-400'
                          }`}
                        >
                          <span>Registration</span>
                          {userManagement.sortField === 'createdAt' ? (
                            userManagement.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-[13px] text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">
                        <div
                          onClick={() => userManagement.handleSort('email')}
                          className={`flex items-center gap-2 cursor-pointer select-none ${
                            userManagement.sortField === 'email'
                              ? 'text-accent-600 dark:text-accent-400'
                              : 'hover:text-accent-600 dark:hover:text-accent-400'
                          }`}
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
                        className={`border-b border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors ${
                          userItem.status !== 'active'
                            ? 'opacity-60 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(239,68,68,0.05)_10px,rgba(239,68,68,0.05)_20px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(239,68,68,0.1)_10px,rgba(239,68,68,0.1)_20px)]'
                            : ''
                        }`}
                      >
                        <td className="p-4 text-primary-900 dark:text-primary-100">
                          <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => handleViewUserProfile(userItem)}
                            title="View full profile"
                          >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white flex-shrink-0">
                              {(() => {
                                const iconName = ROLE_INFO[userItem.role]?.icon || 'User';
                                const IconComponent = ICON_MAP[iconName] || User;
                                return <IconComponent size={18} strokeWidth={2} />;
                              })()}
                            </div>
                            <div className="flex-1 min-w-[150px]">
                              <div className="font-semibold text-primary-900 dark:text-primary-100 whitespace-nowrap hover:text-accent-600 hover:underline">
                                {userItem.name || 'No name'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-primary-900 dark:text-primary-100">
                          <div className="inline-block px-3 py-1 rounded-xl bg-gradient-to-r from-warning-500 to-warning-700 text-white font-semibold text-[13px]">
                            {userItem.credits || 0}
                          </div>
                        </td>
                        <td className="p-4 text-primary-900 dark:text-primary-100">
                          <span className={`inline-block px-3 py-1 rounded-xl font-semibold text-xs uppercase tracking-wide text-white ${
                            userItem.role === 'admin'
                              ? 'bg-gradient-to-r from-warning-500 to-warning-700'
                              : userItem.role === 'teacher' || userItem.role === 'trial_teacher'
                              ? 'bg-gradient-to-r from-purple-500 to-purple-700'
                              : 'bg-gradient-to-r from-blue-500 to-blue-700'
                          }`}>
                            {ROLE_INFO[userItem.role]?.name || userItem.role}
                          </span>
                        </td>
                        <td className="p-4 text-primary-900 dark:text-primary-100">
                          <span className={`inline-block px-3 py-1 rounded-xl font-semibold text-xs text-white ${
                            userItem.status === 'active'
                              ? 'bg-success-500'
                              : userItem.status === 'suspended'
                              ? 'bg-error-500'
                              : 'bg-warning-500'
                          }`}>
                            {userItem.status === 'active' ? 'Active' :
                             userItem.status === 'suspended' ? 'Suspended' :
                             'Pending'}
                          </span>
                        </td>
                        <td className="p-4 text-primary-900 dark:text-primary-100">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(userItem.createdAt)}
                          </span>
                        </td>
                        <td className="p-4 text-primary-900 dark:text-primary-100">
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
              <div className="py-12 text-center text-secondary-600 dark:text-secondary-400">
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
              <div className="py-12 text-center text-secondary-600 dark:text-secondary-400">
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
          onClose={() => setShowAddUserModal(false)}
          onUserCreated={handleUserCreated}
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
      count: allClasses.length,
      countLabel: allClasses.length === 1 ? "class" : "classes",
      onClick: () => navigation.setCurrentScreen('classes'),
      createLabel: "New Class",
      onCreateClick: () => {
        navigation.setOpenClassModal(true);
        navigation.setCurrentScreen('classes');
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
              <Crown size={40} strokeWidth={2} className="text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
            </div>
            <p className="section-subtitle">Complete XIWEN system management</p>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 mb-12">
            <div className="bg-secondary-50 dark:bg-secondary-900 border border-primary-200 dark:border-primary-800 rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-xl">
              <div className="flex items-center justify-center w-16 h-16 rounded-lg text-white bg-gradient-to-br from-accent-500 to-accent-700">
                <Users size={36} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="text-[32px] font-bold text-primary-900 dark:text-primary-100 leading-none mb-2">{stats.total}</div>
                <div className="text-sm font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">Total Users</div>
              </div>
            </div>

            <div className="bg-secondary-50 dark:bg-secondary-900 border border-primary-200 dark:border-primary-800 rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-xl">
              <div className="flex items-center justify-center w-16 h-16 rounded-lg text-white bg-gradient-to-br from-warning-500 to-warning-700">
                <Crown size={36} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="text-[32px] font-bold text-primary-900 dark:text-primary-100 leading-none mb-2">{stats.admins}</div>
                <div className="text-sm font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">Administrators</div>
              </div>
            </div>

            <div className="bg-secondary-50 dark:bg-secondary-900 border border-primary-200 dark:border-primary-800 rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-xl">
              <div className="flex items-center justify-center w-16 h-16 rounded-lg text-white bg-gradient-to-br from-purple-500 to-purple-700">
                <UserCog size={36} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="text-[32px] font-bold text-primary-900 dark:text-primary-100 leading-none mb-2">{stats.teachers}</div>
                <div className="text-sm font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">Teachers</div>
              </div>
            </div>

            <div className="bg-secondary-50 dark:bg-secondary-900 border border-primary-200 dark:border-primary-800 rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-xl">
              <div className="flex items-center justify-center w-16 h-16 rounded-lg text-white bg-gradient-to-br from-blue-500 to-blue-700">
                <GraduationCap size={36} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="text-[32px] font-bold text-primary-900 dark:text-primary-100 leading-none mb-2">{stats.students}</div>
                <div className="text-sm font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">Students</div>
              </div>
            </div>

            <div className="bg-secondary-50 dark:bg-secondary-900 border border-primary-200 dark:border-primary-800 rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-xl">
              <div className="flex items-center justify-center w-16 h-16 rounded-lg text-white bg-gradient-to-br from-success-500 to-success-700">
                <CheckCircle size={36} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="text-[32px] font-bold text-primary-900 dark:text-primary-100 leading-none mb-2">{stats.active}</div>
                <div className="text-sm font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">Active</div>
              </div>
            </div>

            <div className="bg-secondary-50 dark:bg-secondary-900 border border-primary-200 dark:border-primary-800 rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-xl">
              <div className="flex items-center justify-center w-16 h-16 rounded-lg text-white bg-gradient-to-br from-error-500 to-error-700">
                <Ban size={36} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="text-[32px] font-bold text-primary-900 dark:text-primary-100 leading-none mb-2">{stats.suspended}</div>
                <div className="text-sm font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">Suspended</div>
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
          onClose={() => setShowAddUserModal(false)}
          onUserCreated={handleUserCreated}
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
