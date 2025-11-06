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
  ClipboardList
} from 'lucide-react';
import {
  loadStudents,
  loadGameHistory,
  loadCategories,
  loadCourses,
  updateUserRole,
  updateUserStatus,
  enrollStudentInCourse,
  unenrollStudentFromCourse,
  getStudentEnrollments,
  getStudentEnrolledCoursesCount,
  getBatchEnrollmentCounts
} from '../firebase/firestore';
import { getAllUsers, createUser, deleteUser } from '../firebase/users';
import {
  assignToStudent,
  removeFromStudent,
  getStudentAssignments
} from '../firebase/relationships';
import { getContentByTeacher } from '../firebase/content';
import { getExercisesByTeacher } from '../firebase/exercises';
import { getClassesByTeacher } from '../firebase/classes';
import { getUserCredits } from '../firebase/credits';
import { createExcalidrawSession } from '../firebase/excalidraw';
import { createGameSession } from '../firebase/gameSession';
import { ROLES, ROLE_INFO, isAdminEmail } from '../firebase/roleConfig';
import DashboardLayout from './DashboardLayout';
import CoursesScreen from './CoursesScreen';
import GameContainer from './GameContainer';
import ContentManager from './ContentManager';
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
import LiveClassManager from './LiveClassManager';
import LiveClassRoom from './LiveClassRoom';
import LiveGameProjection from './LiveGameProjection';
import LiveGameSetup from './LiveGameSetup';

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

  // Navigation states
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Collapsible menu states
  const [adminSectionExpanded, setAdminSectionExpanded] = useState(true);
  const [teachingSectionExpanded, setTeachingSectionExpanded] = useState(false);

  // User management states
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    teachers: 0,
    students: 0,
    active: 0,
    suspended: 0,
    totalGames: 0,
    totalCategories: 0,
    totalCourses: 0
  });

  // Teacher functionality states
  const [courses, setCourses] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [selectedWhiteboardSession, setSelectedWhiteboardSession] = useState(null);
  const [whiteboardManagerKey, setWhiteboardManagerKey] = useState(0);
  const [selectedExcalidrawSession, setSelectedExcalidrawSession] = useState(null);
  const [excalidrawManagerKey, setExcalidrawManagerKey] = useState(0);
  const [selectedLiveClass, setSelectedLiveClass] = useState(null);
  const [liveGameSessionId, setLiveGameSessionId] = useState(null);

  // Resource assignment states
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [activeResourceTab, setActiveResourceTab] = useState('courses');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [studentContent, setStudentContent] = useState([]);
  const [studentExercises, setStudentExercises] = useState([]);
  const [allContent, setAllContent] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState({});
  const [loadingResources, setLoadingResources] = useState(false);

  // Quick access modal flags
  const [openCourseModal, setOpenCourseModal] = useState(false);
  const [openContentModal, setOpenContentModal] = useState(false);
  const [openClassModal, setOpenClassModal] = useState(false);

  // Return from ViewAs flag
  const [hasProcessedReturn, setHasProcessedReturn] = useState(false);

  // Dashboard view states
  const [dashboardSearchTerm, setDashboardSearchTerm] = useState('');
  const [dashboardViewMode, setDashboardViewMode] = useState('grid');
  const [studentsSearchTerm, setStudentsSearchTerm] = useState('');
  const [studentsViewMode, setStudentsViewMode] = useState('grid');

  // Check if user is admin
  const isAdmin = isAdminEmail(user?.email) || userRole === 'admin';

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
    if (returnUserId && users.length > 0 && !hasProcessedReturn) {
      console.log('🔄 [AdminDashboard] Detected return from ViewAs, userId:', returnUserId);
      setHasProcessedReturn(true);
      sessionStorage.removeItem('viewAsReturning');
      sessionStorage.removeItem('viewAsReturnUserId');

      const targetUser = users.find(u => u.id === returnUserId);
      if (targetUser) {
        handleViewUserProfile(targetUser);
      }

      setCurrentScreen('users');
    }
  }, [users, hasProcessedReturn]);

  // Handle route changes
  useEffect(() => {
    const pendingUserId = sessionStorage.getItem('viewAsReturnUserId');
    if (pendingUserId) {
      setCurrentScreen('users');
      setHasProcessedReturn(false);
      return;
    }

    if (location.pathname === '/admin/users') {
      setCurrentScreen('users');
    } else if (location.pathname === '/admin') {
      setCurrentScreen('dashboard');
    }
  }, [location.pathname]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const startTime = performance.now();

      // Load all data in parallel
      const [allUsers, students, games, categories, allCourses, teacherContent, teacherClasses] = await Promise.all([
        getAllUsers({ activeOnly: true }),
        loadStudents(),
        loadGameHistory(),
        loadCategories(),
        loadCourses(),
        getContentByTeacher(user.uid),
        getClassesByTeacher(user.uid)
      ]);

      console.log(`⏱️ [AdminDashboard] Parallel queries: ${(performance.now() - startTime).toFixed(0)}ms`);

      // Load credits for each user
      const creditsStart = performance.now();
      const usersWithCredits = await Promise.all(
        allUsers.map(async (userItem) => {
          const credits = await getUserCredits(userItem.id);
          return {
            ...userItem,
            credits: credits?.availableCredits || 0
          };
        })
      );

      console.log(`⏱️ [AdminDashboard] Load credits: ${(performance.now() - creditsStart).toFixed(0)}ms`);

      setUsers(usersWithCredits);

      const activeStudents = students.filter(s => s.active !== false);
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

      setStats({
        total: usersWithCredits.length,
        admins: usersWithCredits.filter(u => u.role === ROLES.ADMIN).length,
        teachers: usersWithCredits.filter(u => u.role === ROLES.TEACHER || u.role === ROLES.TRIAL_TEACHER).length,
        students: usersWithCredits.filter(u => u.role === ROLES.STUDENT || u.role === ROLES.LISTENER || u.role === ROLES.TRIAL).length,
        active: usersWithCredits.filter(u => u.status === 'active').length,
        suspended: usersWithCredits.filter(u => u.status === 'suspended').length,
        totalGames: games.length,
        totalCategories: Object.keys(categories).length,
        totalCourses: activeCourses.length
      });

      setRecentGames(games.slice(0, 5));
      setTopStudents(topStudentsArray);

      console.log(`⏱️ [AdminDashboard] TOTAL: ${(performance.now() - startTime).toFixed(0)}ms`);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError('Error loading dashboard data');
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const startTime = performance.now();
      const allUsers = await getAllUsers({ activeOnly: true });
      console.log(`⏱️ [AdminDashboard] getAllUsers: ${(performance.now() - startTime).toFixed(0)}ms - ${allUsers.length} users`);

      const creditsStart = performance.now();
      const usersWithCredits = await Promise.all(
        allUsers.map(async (userItem) => {
          const credits = await getUserCredits(userItem.id);
          return {
            ...userItem,
            credits: credits?.availableCredits || 0
          };
        })
      );

      console.log(`⏱️ [AdminDashboard] Load credits: ${(performance.now() - creditsStart).toFixed(0)}ms`);
      console.log(`⏱️ [AdminDashboard] TOTAL: ${(performance.now() - startTime).toFixed(0)}ms`);

      setUsers(usersWithCredits);
      calculateStats(usersWithCredits);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      showError('Error loading users');
    }
  };

  const calculateStats = (usersList) => {
    setStats(prevStats => ({
      ...prevStats,
      total: usersList.length,
      admins: usersList.filter(u => u.role === ROLES.ADMIN).length,
      teachers: usersList.filter(u => u.role === ROLES.TEACHER || u.role === ROLES.TRIAL_TEACHER).length,
      students: usersList.filter(u => u.role === ROLES.STUDENT || u.role === ROLES.LISTENER || u.role === ROLES.TRIAL).length,
      active: usersList.filter(u => u.status === 'active').length,
      suspended: usersList.filter(u => u.status === 'suspended').length
    }));
  };

  const handleRoleChange = useCallback(async (userId, newRole) => {
    const targetUser = users.find(u => u.id === userId);
    if (targetUser && isAdminEmail(targetUser.email) && user.email === targetUser.email) {
      showError('Cannot change your own admin role');
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
        showSuccess(`Role updated to ${ROLE_INFO[newRole].name}`);
      } else {
        showError('Error updating role');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error updating role');
    }
  }, [users, user.email]);

  const handleStatusChange = useCallback(async (userId, newStatus) => {
    const targetUser = users.find(u => u.id === userId);
    if (targetUser && isAdminEmail(targetUser.email) && newStatus === 'suspended') {
      showError('Cannot suspend main admin');
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
        showSuccess(`Status updated to ${newStatus}`);
      } else {
        showError('Error updating status');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error updating status');
    }
  }, [users]);

  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const handleViewUserProfile = useCallback((userItem) => {
    setSelectedUserProfile(userItem);
    setShowUserProfile(true);
  }, []);

  const handleCloseUserProfile = useCallback(() => {
    setShowUserProfile(false);
    setSelectedUserProfile(null);
    loadUsers();
  }, []);

  const handleUserCreated = useCallback(() => {
    setShowAddUserModal(false);
    loadUsers();
    showSuccess('User created successfully');
  }, []);

  const handleMenuAction = useCallback((action) => {
    const actionMap = {
      'dashboard': 'dashboard',
      'users': 'users',
      'students': 'students',
      'courses': 'courses',
      'content': 'content',
      'classes': 'classes',
      'analytics': 'analytics',
      'attendance': 'attendance',
      'exercises': 'exercises',
      'setup': 'setup',
      'liveGame': 'liveGame',
      'whiteboardSessions': 'whiteboardSessions',
      'excalidrawWhiteboard': 'excalidrawSessions',
      'liveClasses': 'liveClasses'
    };

    const screen = actionMap[action] || action;
    setCurrentScreen(screen);
    setSelectedExerciseId(null);
    setSelectedWhiteboardSession(null);
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setCurrentScreen('dashboard');
    setSelectedExerciseId(null);
    setShowUserProfile(false);
    setSelectedUserProfile(null);
    setOpenCourseModal(false);
    setOpenContentModal(false);
    setOpenClassModal(false);
  }, []);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  // Resource assignment functions
  const handleOpenResourceModal = useCallback(async (student, initialTab = 'courses') => {
    setSelectedStudent(student);
    setActiveResourceTab(initialTab);
    setShowResourceModal(true);
    setLoadingResources(true);

    try {
      const enrollments = await getStudentEnrollments(student.id);
      setStudentEnrollments(enrollments);

      const assignments = await getStudentAssignments(student.id);
      const assignedContent = assignments.filter(a => a.itemType === 'content');
      const assignedExercises = assignments.filter(a => a.itemType === 'exercise');

      setStudentContent(assignedContent);
      setStudentExercises(assignedExercises);

      const teacherContent = await getContentByTeacher(user.uid);
      const teacherExercises = await getExercisesByTeacher(user.uid);

      setAllContent(teacherContent);
      setAllExercises(teacherExercises);
    } catch (error) {
      console.error('Error loading resources:', error);
      showError('Error loading student resources');
    }

    setLoadingResources(false);
  }, [user.uid]);

  const handleCloseResourceModal = useCallback(() => {
    setShowResourceModal(false);
    setSelectedStudent(null);
    setStudentEnrollments([]);
    setStudentContent([]);
    setStudentExercises([]);
    setActiveResourceTab('courses');
  }, []);

  const handleEnrollCourse = useCallback(async (courseId) => {
    if (!selectedStudent) return;

    try {
      const enrollmentId = await enrollStudentInCourse(selectedStudent.id, courseId);
      if (enrollmentId) {
        showSuccess('Course assigned successfully');
        const enrollments = await getStudentEnrollments(selectedStudent.id);
        setStudentEnrollments(enrollments);
        loadEnrollmentCounts();
      } else {
        showError('Error assigning course');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error assigning course');
    }
  }, [selectedStudent]);

  const handleUnenrollCourse = useCallback(async (courseId) => {
    if (!selectedStudent) return;

    const confirmed = window.confirm('Are you sure you want to unassign this course?');
    if (!confirmed) return;

    try {
      const success = await unenrollStudentFromCourse(selectedStudent.id, courseId);
      if (success) {
        showSuccess('Course unassigned successfully');
        const enrollments = await getStudentEnrollments(selectedStudent.id);
        setStudentEnrollments(enrollments);
        loadEnrollmentCounts();
      } else {
        showError('Error unassigning course');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error unassigning course');
    }
  }, [selectedStudent]);

  // OPTIMIZED: Batch query instead of N+1 (100 queries → 1 query)
  const loadEnrollmentCounts = async () => {
    try {
      const studentIds = users.map(u => u.id);
      const counts = await getBatchEnrollmentCounts(studentIds);
      setEnrollmentCounts(counts);
    } catch (error) {
      console.error('Error loading enrollment counts:', error);
    }
  };

  const isEnrolled = (courseId) => {
    return studentEnrollments.some(enrollment => enrollment.course.id === courseId);
  };

  const handleAssignContent = useCallback(async (contentId) => {
    if (!selectedStudent) return;

    try {
      await assignToStudent(selectedStudent.id, 'content', contentId, user.uid);
      showSuccess('Content assigned successfully');

      const assignments = await getStudentAssignments(selectedStudent.id);
      const assignedContent = assignments.filter(a => a.itemType === 'content');
      setStudentContent(assignedContent);
    } catch (error) {
      console.error('Error:', error);
      showError('Error assigning content');
    }
  }, [selectedStudent, user.uid]);

  const handleRemoveContent = useCallback(async (contentId) => {
    if (!selectedStudent) return;

    const confirmed = window.confirm('Are you sure you want to unassign this content?');
    if (!confirmed) return;

    try {
      await removeFromStudent(selectedStudent.id, 'content', contentId);
      showSuccess('Content unassigned successfully');

      const assignments = await getStudentAssignments(selectedStudent.id);
      const assignedContent = assignments.filter(a => a.itemType === 'content');
      setStudentContent(assignedContent);
    } catch (error) {
      console.error('Error:', error);
      showError('Error unassigning content');
    }
  }, [selectedStudent]);

  const isContentAssigned = (contentId) => {
    return studentContent.some(sc => sc.itemId === contentId);
  };

  const handleAssignExercise = useCallback(async (exerciseId) => {
    if (!selectedStudent) return;

    try {
      await assignToStudent(selectedStudent.id, 'exercise', exerciseId, user.uid);
      showSuccess('Exercise assigned successfully');

      const assignments = await getStudentAssignments(selectedStudent.id);
      const assignedExercises = assignments.filter(a => a.itemType === 'exercise');
      setStudentExercises(assignedExercises);
    } catch (error) {
      console.error('Error:', error);
      showError('Error assigning exercise');
    }
  }, [selectedStudent, user.uid]);

  const handleRemoveExercise = useCallback(async (exerciseId) => {
    if (!selectedStudent) return;

    const confirmed = window.confirm('Are you sure you want to unassign this exercise?');
    if (!confirmed) return;

    try {
      await removeFromStudent(selectedStudent.id, 'exercise', exerciseId);
      showSuccess('Exercise unassigned successfully');

      const assignments = await getStudentAssignments(selectedStudent.id);
      const assignedExercises = assignments.filter(a => a.itemType === 'exercise');
      setStudentExercises(assignedExercises);
    } catch (error) {
      console.error('Error:', error);
      showError('Error unassigning exercise');
    }
  }, [selectedStudent]);

  const isExerciseAssigned = (exerciseId) => {
    return studentExercises.some(se => se.itemId === exerciseId);
  };

  const handleDeleteUser = useCallback(async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action will mark the user as inactive.')) {
      return;
    }

    try {
      const result = await deleteUser(userId);
      if (result.success) {
        await loadUsers();
        console.log('User deleted successfully');
      } else {
        console.error('Error deleting user:', result.error);
        alert('Error deleting user. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user. Please try again.');
    }
  }, []);

  // Load enrollment counts when users change
  useEffect(() => {
    if (users.length > 0) {
      loadEnrollmentCounts();
    }
  }, [users]);

  // Filter and sort users - MEMOIZED for performance
  const filteredUsers = useMemo(() => {
    return users
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
  }, [users, searchTerm, filterRole, filterStatus, sortField, sortDirection]);

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
  if (currentScreen === 'setup' || currentScreen === 'exercises') {
    return <GameContainer onBack={handleBackToDashboard} />;
  }

  // Live Game Projection - NO Layout (fullscreen)
  if (currentScreen === 'liveGameProjection' && liveGameSessionId) {
    return (
      <LiveGameProjection
        sessionId={liveGameSessionId}
        onBack={() => {
          setLiveGameSessionId(null);
          setCurrentScreen('liveGame');
        }}
      />
    );
  }

  // ExercisePlayer - NO Layout (fullscreen)
  if (currentScreen === 'playExercise' && selectedExerciseId) {
    return (
      <ExercisePlayer
        exerciseId={selectedExerciseId}
        user={user}
        onBack={handleBackToDashboard}
        onComplete={(results) => {
          console.log('Exercise completed:', results);
        }}
      />
    );
  }

  // Whiteboard - NO Layout (fullscreen)
  if (currentScreen === 'whiteboard') {
    const isLive = selectedWhiteboardSession?.isLive;
    const liveSessionId = selectedWhiteboardSession?.liveSessionId;

    return (
      <Whiteboard
        onBack={() => {
          setWhiteboardManagerKey(prev => prev + 1);
          setCurrentScreen('whiteboardSessions');
        }}
        initialSession={selectedWhiteboardSession}
        isCollaborative={isLive}
        collaborativeSessionId={liveSessionId}
      />
    );
  }

  // Excalidraw Whiteboard - NO Layout (fullscreen)
  if (currentScreen === 'excalidrawWhiteboard') {
    return (
      <ExcalidrawWhiteboard
        onBack={() => {
          setExcalidrawManagerKey(prev => prev + 1);
          setCurrentScreen('excalidrawSessions');
        }}
        initialSession={selectedExcalidrawSession}
      />
    );
  }

  // Test Collaborative Whiteboard - NO Layout (fullscreen)
  if (currentScreen === 'testCollab') {
    const sessionId = `collab_${user.uid}_${Date.now()}`;
    return (
      <Whiteboard
        onBack={handleBackToDashboard}
        isCollaborative={true}
        collaborativeSessionId={sessionId}
      />
    );
  }

  // Live Class Room - NO Layout (fullscreen)
  if (currentScreen === 'liveClassRoom' && selectedLiveClass) {
    return (
      <LiveClassRoom
        liveClass={selectedLiveClass}
        user={user}
        userRole={userRole}
        onLeave={() => {
          setSelectedLiveClass(null);
          setCurrentScreen('liveClasses');
        }}
      />
    );
  }

  // ==========================================
  // RENDER SPECIFIC SCREENS (WITH LAYOUT)
  // ==========================================

  // Live Game Setup - WITH Layout
  if (currentScreen === 'liveGame') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <LiveGameSetup
          user={user}
          onSessionCreated={(sessionId) => {
            setLiveGameSessionId(sessionId);
            setCurrentScreen('liveGameProjection');
          }}
          onBack={handleBackToDashboard}
        />
      </DashboardLayout>
    );
  }

  // Courses Screen - WITH Layout
  if (currentScreen === 'courses') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <CoursesScreen onBack={handleBackToDashboard} user={user} openCreateModal={openCourseModal} />
      </DashboardLayout>
    );
  }

  // Content Manager - WITH Layout
  if (currentScreen === 'content') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <ContentManager user={user} courses={courses} onBack={handleBackToDashboard} openCreateModal={openContentModal} />
      </DashboardLayout>
    );
  }

  // Class Manager - WITH Layout
  if (currentScreen === 'classes') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <ClassManager user={user} courses={courses} onBack={handleBackToDashboard} openCreateModal={openClassModal} />
      </DashboardLayout>
    );
  }

  // Analytics Dashboard - WITH Layout
  if (currentScreen === 'analytics') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <div className="p-6 md:p-8">
          <button onClick={handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Back to Home
          </button>
          <AnalyticsDashboard user={user} />
        </div>
      </DashboardLayout>
    );
  }

  // Attendance View - WITH Layout
  if (currentScreen === 'attendance') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <div className="p-6 md:p-8">
          <button onClick={handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Back to Home
          </button>
          <AttendanceView teacher={user} />
        </div>
      </DashboardLayout>
    );
  }

  // Whiteboard Manager - WITH Layout
  if (currentScreen === 'whiteboardSessions') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <WhiteboardManager
          key={whiteboardManagerKey}
          onBack={handleBackToDashboard}
          onOpenWhiteboard={() => {
            setSelectedWhiteboardSession(null);
            setCurrentScreen('whiteboard');
          }}
          onLoadSession={(session) => {
            setSelectedWhiteboardSession(session);
            setCurrentScreen('whiteboard');
          }}
          onGoLive={(session, liveSessionId) => {
            setSelectedWhiteboardSession({
              ...session,
              isLive: true,
              liveSessionId: liveSessionId
            });
            setCurrentScreen('whiteboard');
          }}
        />
      </DashboardLayout>
    );
  }

  // Excalidraw Manager - WITH Layout
  if (currentScreen === 'excalidrawSessions') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <ExcalidrawManager
          key={excalidrawManagerKey}
          onBack={handleBackToDashboard}
          onOpenSession={(session) => {
            setSelectedExcalidrawSession(session);
            setCurrentScreen('excalidrawWhiteboard');
          }}
          onCreateNew={async () => {
            try {
              const sessionId = await createExcalidrawSession('Untitled Whiteboard');
              setSelectedExcalidrawSession({
                id: sessionId,
                title: 'Untitled Whiteboard',
                elements: [],
                appState: {},
                files: {}
              });
              setCurrentScreen('excalidrawWhiteboard');
            } catch (error) {
              console.error('Error creating whiteboard:', error);
              alert('Error creating whiteboard');
            }
          }}
        />
      </DashboardLayout>
    );
  }

  // Live Class Manager - WITH Layout
  if (currentScreen === 'liveClasses') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <LiveClassManager
          user={user}
          onBack={handleBackToDashboard}
          onStartClass={(liveClass) => {
            setSelectedLiveClass(liveClass);
            setCurrentScreen('liveClassRoom');
          }}
        />
      </DashboardLayout>
    );
  }

  // Students Panel (Cards View) - WITH Layout
  if (currentScreen === 'students') {
    const students = users.filter(u => ['student', 'listener', 'trial'].includes(u.role));

    const filteredStudents = students.filter(student =>
      student.name?.toLowerCase().includes(studentsSearchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(studentsSearchTerm.toLowerCase())
    );

    return (
      <>
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
          <button onClick={handleBackToDashboard} className="btn btn-ghost mb-4">
            ← Back to Home
          </button>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <GraduationCap size={32} strokeWidth={2} className="text-gray-700 dark:text-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Students</h1>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddUserModal(true)} className="btn btn-primary">
                <Plus size={18} strokeWidth={2} /> Add Student
              </button>
              <button onClick={loadUsers} className="btn btn-primary !bg-green-600 hover:!bg-green-700" title="Refresh list">
                <RefreshCw size={18} strokeWidth={2} /> Refresh
              </button>
            </div>
          </div>

          <SearchBar
            value={studentsSearchTerm}
            onChange={setStudentsSearchTerm}
            placeholder="Search students..."
            viewMode={studentsViewMode}
            onViewModeChange={setStudentsViewMode}
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

          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-secondary-600 dark:text-secondary-400">
              <p>No students found</p>
            </div>
          ) : (
            <div className={studentsViewMode === 'grid' ? 'students-grid' : 'students-list'}>
              {filteredStudents.map(student => (
                <StudentCard
                  key={student.id}
                  student={student}
                  enrollmentCount={enrollmentCounts[student.id] || 0}
                  onView={(student) => {
                    setSelectedUserProfile(student);
                    setShowUserProfile(true);
                  }}
                  onDelete={(student) => handleDeleteUser(student.id)}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>

      {showUserProfile && selectedUserProfile && (
        <div className="modal-overlay" onClick={handleCloseUserProfile}>
          <div className="modal-box flex flex-col" onClick={(e) => e.stopPropagation()}>
            <UserProfile
              selectedUser={selectedUserProfile}
              currentUser={user}
              onBack={handleCloseUserProfile}
              onUpdate={loadUsers}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      )}
    </>
    );
  }

  // User Management - WITH Layout
  if (currentScreen === 'users') {
    if (sessionStorage.getItem('viewAsReturning') === 'true' && !hasProcessedReturn) {
      return (
        <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
          <div className="min-h-[60vh] flex flex-col justify-center items-center">
            <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 border-t-accent-500 rounded-full animate-spin"></div>
            <p>Returning...</p>
          </div>
        </DashboardLayout>
      );
    }

    return (
      <>
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
          <button onClick={handleBackToDashboard} className="btn btn-ghost mb-4">
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
              <button onClick={loadUsers} className="btn btn-primary !bg-green-600 hover:!bg-green-700 w-full sm:w-auto" title="Refresh user list">
                <RefreshCw size={18} strokeWidth={2} /> Refresh
              </button>
            </div>
          </div>

          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search users..."
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

          <div className="bg-secondary-50 dark:bg-secondary-900 border border-primary-200 dark:border-primary-800 rounded-xl overflow-hidden">
            {sessionStorage.getItem('viewAsReturnUserId') && !hasProcessedReturn && users.length === 0 ? (
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
                          onClick={() => handleSort('name')}
                          className={`flex items-center gap-2 cursor-pointer select-none ${
                            sortField === 'name'
                              ? 'text-accent-600 dark:text-accent-400'
                              : 'hover:text-accent-600 dark:hover:text-accent-400'
                          }`}
                        >
                          <span>User</span>
                          {sortField === 'name' ? (
                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-[13px] text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">
                        <div
                          onClick={() => handleSort('credits')}
                          className={`flex items-center gap-2 cursor-pointer select-none ${
                            sortField === 'credits'
                              ? 'text-accent-600 dark:text-accent-400'
                              : 'hover:text-accent-600 dark:hover:text-accent-400'
                          }`}
                        >
                          <span>Credits</span>
                          {sortField === 'credits' ? (
                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-[13px] text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">
                        <div
                          onClick={() => handleSort('role')}
                          className={`flex items-center gap-2 cursor-pointer select-none ${
                            sortField === 'role'
                              ? 'text-accent-600 dark:text-accent-400'
                              : 'hover:text-accent-600 dark:hover:text-accent-400'
                          }`}
                        >
                          <span>Role</span>
                          {sortField === 'role' ? (
                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-[13px] text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">
                        <div
                          onClick={() => handleSort('status')}
                          className={`flex items-center gap-2 cursor-pointer select-none ${
                            sortField === 'status'
                              ? 'text-accent-600 dark:text-accent-400'
                              : 'hover:text-accent-600 dark:hover:text-accent-400'
                          }`}
                        >
                          <span>Status</span>
                          {sortField === 'status' ? (
                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-[13px] text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">
                        <div
                          onClick={() => handleSort('createdAt')}
                          className={`flex items-center gap-2 cursor-pointer select-none ${
                            sortField === 'createdAt'
                              ? 'text-accent-600 dark:text-accent-400'
                              : 'hover:text-accent-600 dark:hover:text-accent-400'
                          }`}
                        >
                          <span>Registration</span>
                          {sortField === 'createdAt' ? (
                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-[13px] text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">
                        <div
                          onClick={() => handleSort('email')}
                          className={`flex items-center gap-2 cursor-pointer select-none ${
                            sortField === 'email'
                              ? 'text-accent-600 dark:text-accent-400'
                              : 'hover:text-accent-600 dark:hover:text-accent-400'
                          }`}
                        >
                          <span>Email</span>
                          {sortField === 'email' ? (
                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
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

      {showUserProfile && selectedUserProfile && (
        <div className="modal-overlay" onClick={handleCloseUserProfile}>
          <div className="modal-box flex flex-col" onClick={(e) => e.stopPropagation()}>
            <UserProfile
              selectedUser={selectedUserProfile}
              currentUser={user}
              onBack={handleCloseUserProfile}
              onUpdate={loadUsers}
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
      count: users.length,
      countLabel: users.length === 1 ? "user" : "users",
      onClick: () => setCurrentScreen('users'),
      createLabel: "New User",
      onCreateClick: () => setShowAddUserModal(true)
    },
    {
      id: 'students',
      icon: GraduationCap,
      title: "Students",
      count: stats.students,
      countLabel: stats.students === 1 ? "student" : "students",
      onClick: () => setCurrentScreen('students'),
      createLabel: "Add Student",
      onCreateClick: () => setShowAddUserModal(true)
    },
    {
      id: 'courses',
      icon: BookOpen,
      title: "Courses",
      count: courses.length,
      countLabel: courses.length === 1 ? "course" : "courses",
      onClick: () => setCurrentScreen('courses'),
      createLabel: "New Course",
      onCreateClick: () => {
        setOpenCourseModal(true);
        setCurrentScreen('courses');
      }
    },
    {
      id: 'content',
      icon: FileText,
      title: "Content",
      count: allContent.length,
      countLabel: allContent.length === 1 ? "item" : "items",
      onClick: () => setCurrentScreen('content'),
      createLabel: "New Content",
      onCreateClick: () => {
        setOpenContentModal(true);
        setCurrentScreen('content');
      }
    },
    {
      id: 'classes',
      icon: Calendar,
      title: "Classes",
      count: allClasses.length,
      countLabel: allClasses.length === 1 ? "class" : "classes",
      onClick: () => setCurrentScreen('classes'),
      createLabel: "New Class",
      onCreateClick: () => {
        setOpenClassModal(true);
        setCurrentScreen('classes');
      }
    },
    {
      id: 'analytics',
      icon: BarChart3,
      title: "Analytics",
      count: 0,
      countLabel: "insights",
      onClick: () => setCurrentScreen('analytics'),
      createLabel: "View Analytics",
      onCreateClick: () => setCurrentScreen('analytics')
    }
  ];

  const filteredDashboardCards = dashboardCards.filter(card =>
    card.title.toLowerCase().includes(dashboardSearchTerm.toLowerCase())
  );

  return (
    <>
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
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
            value={dashboardSearchTerm}
            onChange={setDashboardSearchTerm}
            placeholder="Search sections..."
            viewMode={dashboardViewMode}
            onViewModeChange={setDashboardViewMode}
            className="mb-6"
          />

          <div className={dashboardViewMode === 'grid' ? 'quick-access-grid' : 'quick-access-list'}>
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

      {showUserProfile && selectedUserProfile && (
        <div className="modal-overlay" onClick={handleCloseUserProfile}>
          <div className="modal-box flex flex-col" onClick={(e) => e.stopPropagation()}>
            <UserProfile
              selectedUser={selectedUserProfile}
              currentUser={user}
              onBack={handleCloseUserProfile}
              onUpdate={loadUsers}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default AdminDashboard;
