import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  Gamepad2,
  Target,
  BookOpen,
  ClipboardList,
  ScrollText,
  Calendar,
  Clock,
  CreditCard,
  Presentation,
  AlertTriangle
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import MyCourses from './student/MyCourses';
import MyAssignments from './student/MyAssignments';
import CourseViewer from './student/CourseViewer';
import ContentPlayer from './student/ContentPlayer';
import StudentClassView from './StudentClassView';
import WhiteboardManager from './WhiteboardManager';
import Whiteboard from './Whiteboard';
import StudentAssignmentsView from './StudentAssignmentsView';
import GamificationPanel from './GamificationPanel';
import UnifiedCalendar from './UnifiedCalendar';
import MessagesPanel from './MessagesPanel';
import StudentFeesPanel from './StudentFeesPanel';
import ClassSessionManager from './ClassSessionManager';
import ClassSessionRoom from './ClassSessionRoom';
import LiveClassCard from './LiveClassCard';
import NotificationCenter from './NotificationCenter';
import ClassCountdownBanner from './ClassCountdownBanner';
import { useStudentDashboard } from '../hooks/useStudentDashboard';
import useRealtimeClassStatus from '../hooks/useRealtimeClassStatus';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

// Base Components
import {
  BaseButton,
  BaseCard,
  BaseLoading,
  BaseEmptyState,
  BaseBadge
} from './common';

function StudentDashboard({ user, userRole, student: studentProp, onLogout, onStartGame }) {
  const navigate = useNavigate();

  // Use custom hook for dashboard data
  const {
    student,
    gameHistory,
    enrolledCourses,
    upcomingClasses,
    liveWhiteboards,
    loading,
    stats,
    points,
    level,
    pointsToNextLevel,
    progressPercentage
  } = useStudentDashboard(user, studentProp);

  // View state
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCourseData, setSelectedCourseData] = useState(null);
  const [selectedContentId, setSelectedContentId] = useState(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [selectedWhiteboardSession, setSelectedWhiteboardSession] = useState(null);
  const [selectedLiveClass, setSelectedLiveClass] = useState(null);

  // Live classes state
  const [liveClassSessions, setLiveClassSessions] = useState([]);

  // Upcoming classes hook (countdown banner)
  const { upcomingSessions, shouldShowCountdown } = useRealtimeClassStatus(
    user?.uid,
    'student',
    { minutesAhead: 10, includeScheduled: true }
  );

  // Listener para clases en vivo asignadas al estudiante
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'class_sessions'),
      where('status', '==', 'live'),
      where('assignedStudents', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLiveClassSessions(sessions);
      logger.debug('🔴 Clases en vivo actualizadas:', sessions.length);
    }, (error) => {
      logger.error('❌ Error listening to live class sessions:', error);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Helper to format relative time
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Hace un momento';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `hace ${diffDays}d`;
  };

  // Navigation handlers
  const handleBackToLogin = async () => {
    try {
      await signOut(auth);
      logger.debug('✅ Sesión cerrada');
      navigate('/login');
    } catch (error) {
      logger.error('❌ Error al cerrar sesión:', error);
    }
  };

  const handleViewMyCourses = () => {
    setCurrentView('courses');
  };

  const handleSelectCourse = (courseId, courseData) => {
    setSelectedCourseId(courseId);
    setSelectedCourseData(courseData);
    setCurrentView('courseView');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedCourseId(null);
    setSelectedCourseData(null);
  };

  const handleBackToCourses = () => {
    setCurrentView('courses');
    setSelectedCourseId(null);
    setSelectedCourseData(null);
  };

  const handlePlayContent = (contentId) => {
    setSelectedContentId(contentId);
    setCurrentView('contentPlayer');
  };

  const handlePlayExercise = (exerciseId) => {
    setSelectedExerciseId(exerciseId);
    logger.debug('Jugar ejercicio:', exerciseId);
    alert('Funcionalidad de ejercicios próximamente');
  };

  const handleBackToCourseViewer = () => {
    setCurrentView('courseView');
    setSelectedContentId(null);
  };

  const handleContentComplete = () => {
    logger.debug('Contenido completado');
  };

  const handleViewMyAssignments = () => {
    setCurrentView('assignments');
  };

  const handleBackToAssignments = () => {
    setCurrentView('assignments');
    setSelectedContentId(null);
    setSelectedExerciseId(null);
  };

  const handlePlayAssignmentContent = (contentId) => {
    setSelectedContentId(contentId);
    setSelectedCourseId(null);
    setCurrentView('contentPlayer');
  };

  const handlePlayAssignmentExercise = (exerciseId) => {
    setSelectedExerciseId(exerciseId);
    logger.debug('Jugar ejercicio asignado:', exerciseId);
    alert('Funcionalidad de ejercicios próximamente');
  };

  const handleMenuAction = (action) => {
    const actionMap = {
      'dashboard': 'dashboard',
      'courses': 'courses',
      'assignments': 'assignments',
      'assignmentsView': 'assignmentsView',
      'gamification': 'gamification',
      'calendar': 'calendar',
      'messages': 'messages',
      'payments': 'payments',
      'classes': 'classes',
      'classSessions': 'classSessions',
      'whiteboardSessions': 'whiteboardSessions'
    };

    const view = actionMap[action];

    if (view) {
      setCurrentView(view);
      setSelectedCourseId(null);
      setSelectedContentId(null);
      setSelectedExerciseId(null);
      setSelectedLiveClass(null);
    }
  };

  const handleOpenWhiteboard = () => {
    setSelectedWhiteboardSession(null);
    setCurrentView('whiteboard');
  };

  const handleLoadWhiteboardSession = (session) => {
    logger.debug('📋 [StudentDashboard] Loading whiteboard session:', session);
    setSelectedWhiteboardSession(session);
    setCurrentView('whiteboard');
  };

  const handleBackToWhiteboardManager = () => {
    setSelectedWhiteboardSession(null);
    setCurrentView('whiteboardSessions');
  };

  const handleJoinLiveWhiteboard = (whiteboard) => {
    logger.debug('📋 [StudentDashboard] Joining live whiteboard:', whiteboard);
    setSelectedWhiteboardSession({
      ...whiteboard,
      isCollaborative: true,
      collaborativeSessionId: whiteboard.liveSessionId
    });
    setCurrentView('whiteboard');
  };

  const handleJoinLiveClass = (session) => {
    logger.debug('🔴 [StudentDashboard] Joining live class:', session);
    navigate(`/class-session/${session.id}`);
  };

  // Loading state
  if (loading) {
    return (
      <BaseLoading
        variant="fullscreen"
        text="Cargando tu perfil..."
      />
    );
  }

  // Error state - no student profile
  if (!student || !student.id) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full">
          <BaseCard className="text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Error de Configuración
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  No se pudo cargar tu perfil de estudiante.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Contacta al administrador si el problema persiste.
                </p>
              </div>
              <BaseButton
                variant="primary"
                onClick={handleBackToLogin}
                className="mt-2"
              >
                ← Volver al Login
              </BaseButton>
            </div>
          </BaseCard>
        </div>
      </div>
    );
  }

  // Render Whiteboard view
  if (currentView === 'whiteboard') {
    const isCollaborative = selectedWhiteboardSession?.isCollaborative || false;
    const collaborativeSessionId = selectedWhiteboardSession?.collaborativeSessionId || null;

    return (
      <Whiteboard
        onBack={handleBackToWhiteboardManager}
        initialSession={selectedWhiteboardSession}
        isCollaborative={isCollaborative}
        collaborativeSessionId={collaborativeSessionId}
      />
    );
  }

  // Render WhiteboardSessions view
  if (currentView === 'whiteboardSessions') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <div className="p-4 md:p-6">
          <WhiteboardManager
            onOpenWhiteboard={handleOpenWhiteboard}
            onLoadSession={handleLoadWhiteboardSession}
            onBack={handleBackToDashboard}
          />
        </div>
      </DashboardLayout>
    );
  }

  // Render MyCourses view
  if (currentView === 'courses') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <div className="p-4 md:p-6">
          <BaseButton variant="ghost" onClick={handleBackToDashboard} className="mb-4">
            ← Volver a Inicio
          </BaseButton>
          <MyCourses user={user} onSelectCourse={handleSelectCourse} />
        </div>
      </DashboardLayout>
    );
  }

  // Render MyAssignments view
  if (currentView === 'assignments') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <div className="p-4 md:p-6">
          <BaseButton variant="ghost" onClick={handleBackToDashboard} className="mb-4">
            ← Volver a Inicio
          </BaseButton>
          <MyAssignments
            user={user}
            onPlayContent={handlePlayAssignmentContent}
            onPlayExercise={handlePlayAssignmentExercise}
          />
        </div>
      </DashboardLayout>
    );
  }

  // Render StudentAssignmentsView
  if (currentView === 'assignmentsView') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <div className="p-4 md:p-6">
          <BaseButton variant="ghost" onClick={handleBackToDashboard} className="mb-4">
            ← Volver a Inicio
          </BaseButton>
          <StudentAssignmentsView studentId={student?.id} />
        </div>
      </DashboardLayout>
    );
  }

  // Render GamificationPanel view
  if (currentView === 'gamification') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <div className="p-4 md:p-6">
          <BaseButton variant="ghost" onClick={handleBackToDashboard} className="mb-4">
            ← Volver a Inicio
          </BaseButton>
          <GamificationPanel userId={student?.id} />
        </div>
      </DashboardLayout>
    );
  }

  // Render UnifiedCalendar view
  if (currentView === 'calendar') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <div className="p-4 md:p-6">
          <BaseButton variant="ghost" onClick={handleBackToDashboard} className="mb-4">
            ← Volver a Inicio
          </BaseButton>
          <UnifiedCalendar
            userId={user?.uid}
            userRole="student"
            onJoinSession={(session) => {
              setSelectedLiveClass(session);
              setCurrentView('classSessionRoom');
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  // Render Messages view
  if (currentView === 'messages') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <div className="p-4 md:p-6">
          <BaseButton variant="ghost" onClick={handleBackToDashboard} className="mb-4">
            ← Volver a Inicio
          </BaseButton>
          <MessagesPanel user={user} />
        </div>
      </DashboardLayout>
    );
  }

  // Render Payments view
  if (currentView === 'payments') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <div className="p-4 md:p-6">
          <BaseButton variant="ghost" onClick={handleBackToDashboard} className="mb-4">
            ← Volver a Inicio
          </BaseButton>
          <StudentFeesPanel user={user} />
        </div>
      </DashboardLayout>
    );
  }

  // Render Class Session Manager
  if (currentView === 'classSessions') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <div className="p-4 md:p-6">
          <BaseButton variant="ghost" onClick={handleBackToDashboard} className="mb-4">
            ← Volver a Inicio
          </BaseButton>
          <ClassSessionManager
            user={user}
            onJoinSession={(session) => {
              setSelectedLiveClass(session);
              setCurrentView('classSessionRoom');
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  // Render Class Session Room (fullscreen)
  if (currentView === 'classSessionRoom' && selectedLiveClass) {
    return (
      <ClassSessionRoom
        session={selectedLiveClass}
        user={user}
        userRole={userRole}
        onLeave={() => {
          setSelectedLiveClass(null);
          setCurrentView('classSessions');
        }}
      />
    );
  }

  // Render Classes view
  if (currentView === 'classes') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <div className="p-4 md:p-6">
          <BaseButton variant="ghost" onClick={handleBackToDashboard} className="mb-4">
            ← Volver a Inicio
          </BaseButton>
          <StudentClassView student={student} />
        </div>
      </DashboardLayout>
    );
  }

  // Render CourseViewer view
  if (currentView === 'courseView' && selectedCourseId) {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <CourseViewer
          user={user}
          courseId={selectedCourseId}
          courseData={selectedCourseData}
          onBack={handleBackToCourses}
          onPlayContent={handlePlayContent}
          onPlayExercise={handlePlayExercise}
        />
      </DashboardLayout>
    );
  }

  // Render ContentPlayer view
  if (currentView === 'contentPlayer' && selectedContentId) {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <ContentPlayer
          user={user}
          contentId={selectedContentId}
          courseId={selectedCourseId}
          onBack={selectedCourseId ? handleBackToCourseViewer : handleBackToAssignments}
          onComplete={handleContentComplete}
        />
      </DashboardLayout>
    );
  }

  // Main Dashboard view
  return (
    <>
      <DashboardLayout
        user={user}
        userRole={userRole}
        onLogout={onLogout}
        onMenuAction={handleMenuAction}
        headerContent={<NotificationCenter userId={user?.uid} showToasts={true} />}
      >
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Live Classes - TOP PRIORITY */}
        {liveClassSessions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              🔴 Clases en Vivo Ahora
            </h2>
            {liveClassSessions.map((session) => (
              <LiveClassCard
                key={session.id}
                session={session}
                onJoin={handleJoinLiveClass}
              />
            ))}
          </div>
        )}

        {/* Live Whiteboards - Priority Section */}
        {liveWhiteboards.length > 0 && (
          <div className="bg-green-500 dark:bg-green-600 text-white rounded-xl p-4 md:p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-bold flex items-center gap-2">
                <Presentation size={20} strokeWidth={2} />
                Pizarras en Vivo
              </h3>
              <div className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                <span className="text-xs md:text-sm font-semibold">EN VIVO</span>
              </div>
            </div>
            <div className="space-y-3">
              {liveWhiteboards.map((whiteboard) => (
                <div
                  key={whiteboard.id}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-base md:text-lg mb-2">
                        {whiteboard.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs md:text-sm text-white/90">
                        <Clock size={14} />
                        <span>Iniciada {formatRelativeTime(whiteboard.liveStartedAt)}</span>
                      </div>
                    </div>
                    <BaseButton
                      variant="secondary"
                      size="sm"
                      onClick={() => handleJoinLiveWhiteboard(whiteboard)}
                      className="bg-white dark:bg-gray-800 text-green-600 hover:bg-green-50 dark:hover:bg-gray-700 border-0 font-semibold w-full sm:w-auto"
                    >
                      Unirse →
                    </BaseButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próxima Clase - Quick Access */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar size={20} strokeWidth={2} />
              Próxima Clase
            </h3>
            {upcomingClasses.length > 0 && (
              <BaseButton variant="ghost" size="sm" onClick={() => setCurrentView('classes')}>
                Ver todas →
              </BaseButton>
            )}
          </div>
          {upcomingClasses.length > 0 ? (
            <div className="space-y-3">
              {upcomingClasses.map((instance) => {
                const instanceDate = instance.date.toDate ? instance.date.toDate() : new Date(instance.date);
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const isToday = instanceDate.toDateString() === today.toDateString();
                const isTomorrow = instanceDate.toDateString() === tomorrow.toDateString();

                let dateLabel;
                if (isToday) {
                  dateLabel = `Hoy, ${instance.startTime}`;
                } else if (isTomorrow) {
                  dateLabel = `Mañana, ${instance.startTime}`;
                } else {
                  dateLabel = instanceDate.toLocaleDateString('es-ES', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  }) + ', ' + instance.startTime;
                }

                return (
                  <div
                    key={instance.id}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {instance.className}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <CreditCard size={14} strokeWidth={2} />
                        {instance.creditCost}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock size={14} strokeWidth={2} />
                      <span>{dateLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No tienes clases programadas próximamente
              </p>
              <BaseButton variant="outline" onClick={() => setCurrentView('classes')}>
                Ver calendario de clases
              </BaseButton>
            </div>
          )}
        </div>

        {/* Progress Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Puntos totales</span>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {points} pts
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {pointsToNextLevel} pts para nivel {level + 1}
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-green-500 dark:bg-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <BaseCard variant="elevated" icon={Gamepad2}>
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.totalGames}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Ejercicios completados
              </div>
            </div>
          </BaseCard>

          <BaseCard variant="elevated" icon={Target}>
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.averageScore}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Promedio
              </div>
            </div>
          </BaseCard>

          <BaseCard variant="elevated" icon={Target}>
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.bestScore}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mejor puntaje
              </div>
            </div>
          </BaseCard>

          <BaseCard variant="elevated" icon={Target}>
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.totalCorrect}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Respuestas correctas
              </div>
            </div>
          </BaseCard>
        </div>

        {/* Mis Cursos - Quick Access */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen size={20} strokeWidth={2} />
              Mis Cursos
            </h3>
            {enrolledCourses.length > 0 && (
              <BaseButton variant="ghost" size="sm" onClick={handleViewMyCourses}>
                Ver todos →
              </BaseButton>
            )}
          </div>
          {enrolledCourses.length > 0 ? (
            <div className="space-y-3">
              {enrolledCourses.slice(0, 3).map((enrollment) => (
                <div
                  key={enrollment.enrollmentId}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {enrollment.course.name}
                    </div>
                    {enrollment.course.level && (
                      <BaseBadge variant="primary" size="sm">
                        Nivel {enrollment.course.level}
                      </BaseBadge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 dark:bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${enrollment.progress?.percentComplete || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {enrollment.progress?.percentComplete || 0}%
                    </span>
                  </div>
                </div>
              ))}
              {enrolledCourses.length > 3 && (
                <BaseButton variant="outline" onClick={handleViewMyCourses} fullWidth>
                  Ver todos mis cursos ({enrolledCourses.length})
                </BaseButton>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No tienes cursos asignados aún
              </p>
              <BaseButton variant="primary" onClick={handleViewMyCourses}>
                Explorar Cursos
              </BaseButton>
            </div>
          )}
        </div>

        {/* Asignado a Mí - Quick Access */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardList size={20} strokeWidth={2} />
              Asignado a Mí
            </h3>
            <BaseButton variant="ghost" size="sm" onClick={handleViewMyAssignments}>
              Ver todos →
            </BaseButton>
          </div>
          <div className="text-center py-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Contenidos y ejercicios asignados directamente por tu profesor para práctica adicional
            </p>
            <BaseButton variant="primary" onClick={handleViewMyAssignments}>
              Ver mis asignaciones
            </BaseButton>
          </div>
        </div>

        {/* Game History */}
        {gameHistory.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <ScrollText size={20} strokeWidth={2} />
              Historial Reciente
            </h3>
            <div className="space-y-2">
              {gameHistory.slice(0, 5).map((game, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {game.category}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(game.date).toLocaleDateString('es-AR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {game.score} pts
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                          ({game.percentage}%)
                        </span>
                      </div>
                      <div className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm font-medium text-gray-900 dark:text-white">
                        #{game.position}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
            <BaseEmptyState
              icon={Target}
              title="¡Aún no has completado ejercicios!"
              description="Comienza tu primer ejercicio y empieza a ganar puntos"
              action={
                <BaseButton variant="primary" icon={Gamepad2} onClick={onStartGame}>
                  Comenzar ejercicios
                </BaseButton>
              }
              size="md"
            />
          </div>
        )}
      </div>
    </DashboardLayout>

      {/* Countdown Banner para clase próxima */}
      {upcomingSessions.length > 0 && shouldShowCountdown(upcomingSessions[0], 10) && (
        <ClassCountdownBanner
          session={upcomingSessions[0]}
          onJoin={handleJoinLiveClass}
        />
      )}
    </>
  );
}

export default StudentDashboard;
