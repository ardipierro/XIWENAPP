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
  getStudentEnrolledCoursesCount
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

  const handleRoleChange = async (userId, newRole) => {
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
  };

  const handleStatusChange = async (userId, newStatus) => {
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
  };

  const handleSort = (field) => {
    if (sortField === field) {
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
    loadUsers();
  };

  const handleUserCreated = () => {
    setShowAddUserModal(false);
    loadUsers();
    showSuccess('User created successfully');
  };

  const handleMenuAction = (action) => {
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
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
    setSelectedExerciseId(null);
    setShowUserProfile(false);
    setSelectedUserProfile(null);
    setOpenCourseModal(false);
    setOpenContentModal(false);
    setOpenClassModal(false);
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  // Resource assignment functions
  const handleOpenResourceModal = async (student, initialTab = 'courses') => {
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
  };

  const handleUnenrollCourse = async (courseId) => {
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
  };

  const loadEnrollmentCounts = async () => {
    try {
      const counts = {};
      for (const userItem of users) {
        const count = await getStudentEnrolledCoursesCount(userItem.id);
        counts[userItem.id] = count;
      }
      setEnrollmentCounts(counts);
    } catch (error) {
      console.error('Error loading enrollment counts:', error);
    }
  };

  const isEnrolled = (courseId) => {
    return studentEnrollments.some(enrollment => enrollment.course.id === courseId);
  };

  const handleAssignContent = async (contentId) => {
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
  };

  const handleRemoveContent = async (contentId) => {
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
  };

  const isContentAssigned = (contentId) => {
    return studentContent.some(sc => sc.itemId === contentId);
  };

  const handleAssignExercise = async (exerciseId) => {
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
  };

  const handleRemoveExercise = async (exerciseId) => {
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
  };

  const isExerciseAssigned = (exerciseId) => {
    return studentExercises.some(se => se.itemId === exerciseId);
  };

  const handleDeleteUser = async (userId) => {
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
  };

  // Load enrollment counts when users change
  useEffect(() => {
    if (users.length > 0) {
      loadEnrollmentCounts();
    }
  }, [users]);

  // Filter and sort users
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
        <div className="analytics-section">
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
        <div className="attendance-section">
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
        <div className="students-panel">
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
            <div className="message success-msg">
              <CheckCircle size={18} strokeWidth={2} /> {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="message error-msg">
              <AlertTriangle size={18} strokeWidth={2} /> {errorMessage}
            </div>
          )}

          {filteredStudents.length === 0 ? (
            <div className="no-users">
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
        <UserProfile
          selectedUser={selectedUserProfile}
          currentUser={user}
          onBack={handleCloseUserProfile}
          onUpdate={loadUsers}
          isAdmin={isAdmin}
        />
      )}
    </>
    );
  }

  // User Management - WITH Layout
  if (currentScreen === 'users') {
    if (sessionStorage.getItem('viewAsReturning') === 'true' && !hasProcessedReturn) {
      return (
        <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
          <div className="loading-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div className="spinner"></div>
            <p>Returning...</p>
          </div>
        </DashboardLayout>
      );
    }

    return (
      <>
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction} currentScreen={currentScreen}>
        <div className="admin-users-section">
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
            <div className="message success-msg">
              <CheckCircle size={18} strokeWidth={2} /> {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="message error-msg">
              <AlertTriangle size={18} strokeWidth={2} /> {errorMessage}
            </div>
          )}

          <div className="users-section">
            {sessionStorage.getItem('viewAsReturnUserId') && !hasProcessedReturn && users.length === 0 ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="no-users">
                <p>No users found with selected filters</p>
              </div>
            ) : (
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>
                        <div onClick={() => handleSort('name')} className={`sortable-header ${sortField === 'name' ? 'active' : ''}`}>
                          <span>User</span>
                          {sortField === 'name' ? (
                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="sort-icon-inactive" />
                          )}
                        </div>
                      </th>
                      <th>
                        <div onClick={() => handleSort('credits')} className={`sortable-header ${sortField === 'credits' ? 'active' : ''}`}>
                          <span>Credits</span>
                          {sortField === 'credits' ? (
                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="sort-icon-inactive" />
                          )}
                        </div>
                      </th>
                      <th>
                        <div onClick={() => handleSort('role')} className={`sortable-header ${sortField === 'role' ? 'active' : ''}`}>
                          <span>Role</span>
                          {sortField === 'role' ? (
                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="sort-icon-inactive" />
                          )}
                        </div>
                      </th>
                      <th>
                        <div onClick={() => handleSort('status')} className={`sortable-header ${sortField === 'status' ? 'active' : ''}`}>
                          <span>Status</span>
                          {sortField === 'status' ? (
                            sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="sort-icon-inactive" />
                          )}
                        </div>
                      </th>
                      <th>
                        <div onClick={() => handleSort('createdAt')} className={`sortable-header ${sortField === 'createdAt' ? 'active' : ''}`}>
                          <span>Registration</span>
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
                            title="View full profile"
                          >
                            <div className="user-avatar-small">
                              {(() => {
                                const iconName = ROLE_INFO[userItem.role]?.icon || 'User';
                                const IconComponent = ICON_MAP[iconName] || User;
                                return <IconComponent size={18} strokeWidth={2} />;
                              })()}
                            </div>
                            <div className="user-info">
                              <div className="user-name">{userItem.name || 'No name'}</div>
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
                            {userItem.status === 'active' ? 'Active' :
                             userItem.status === 'suspended' ? 'Suspended' :
                             'Pending'}
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
        <UserProfile
          selectedUser={selectedUserProfile}
          currentUser={user}
          onBack={handleCloseUserProfile}
          onUpdate={loadUsers}
          isAdmin={isAdmin}
        />
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
        <div className="admin-dashboard-container">
          <div className="admin-header">
            <div className="flex items-center gap-3 mb-2 justify-center">
              <Crown size={40} strokeWidth={2} className="text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
            </div>
            <p className="section-subtitle">Complete XIWEN system management</p>
          </div>

          <div className="stats-grid">
            <div className="admin-stat-card stat-total">
              <div className="stat-icon">
                <Users size={36} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Users</div>
              </div>
            </div>

            <div className="admin-stat-card stat-admins">
              <div className="stat-icon">
                <Crown size={36} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.admins}</div>
                <div className="stat-label">Administrators</div>
              </div>
            </div>

            <div className="admin-stat-card stat-teachers">
              <div className="stat-icon">
                <UserCog size={36} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.teachers}</div>
                <div className="stat-label">Teachers</div>
              </div>
            </div>

            <div className="admin-stat-card stat-students">
              <div className="stat-icon">
                <GraduationCap size={36} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.students}</div>
                <div className="stat-label">Students</div>
              </div>
            </div>

            <div className="admin-stat-card stat-active">
              <div className="stat-icon">
                <CheckCircle size={36} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.active}</div>
                <div className="stat-label">Active</div>
              </div>
            </div>

            <div className="admin-stat-card stat-suspended">
              <div className="stat-icon">
                <Ban size={36} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.suspended}</div>
                <div className="stat-label">Suspended</div>
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
        <UserProfile
          selectedUser={selectedUserProfile}
          currentUser={user}
          onBack={handleCloseUserProfile}
          onUpdate={loadUsers}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
}

export default AdminDashboard;
