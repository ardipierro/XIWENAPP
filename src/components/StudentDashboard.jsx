import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getStudentGameHistory, getStudentProfile, ensureStudentProfile, getStudentEnrollments } from '../firebase/firestore';
import { getInstancesForStudent } from '../firebase/classInstances';
import { getStudentAvailableLiveClasses } from '../firebase/liveClasses';
import { getAssignedWhiteboards, subscribeToLiveWhiteboards } from '../firebase/whiteboard';
import { Gamepad2, Target, BookOpen, ClipboardList, ScrollText, Calendar, Clock, CreditCard, Video, Presentation, AlertTriangle, DollarSign } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import MyCourses from './student/MyCourses';
import MyAssignments from './student/MyAssignments';
import CourseViewer from './student/CourseViewer';
import ContentPlayer from './student/ContentPlayer';
import StudentClassView from './StudentClassView';
import LiveClassRoom from './LiveClassRoom';
import WhiteboardManager from './WhiteboardManager';
import Whiteboard from './Whiteboard';
import StudentFeesPanel from './StudentFeesPanel';

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
  const [student, setStudent] = useState(studentProp);

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
  const [gameHistory, setGameHistory] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [liveWhiteboards, setLiveWhiteboards] = useState([]);
  const [selectedLiveClass, setSelectedLiveClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'courses', 'assignments', 'classes', 'liveClasses', 'liveClass', 'whiteboardSessions', 'whiteboard', 'courseView', 'contentPlayer'
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCourseData, setSelectedCourseData] = useState(null);
  const [selectedContentId, setSelectedContentId] = useState(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [selectedWhiteboardSession, setSelectedWhiteboardSession] = useState(null);
  const [stats, setStats] = useState({
    totalGames: 0,
    averageScore: 0,
    bestScore: 0,
    totalCorrect: 0,
    totalQuestions: 0
  });

  // Cargar perfil del estudiante al montar el componente
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const startTime = performance.now();

      if (!studentProp && user) {
        logger.debug('Cargando perfil de estudiante para:', user.uid);
        const profile = await ensureStudentProfile(user.uid);

        if (profile) {
          logger.debug('Perfil de estudiante cargado/creado:', profile);
          setStudent(profile);

          // Cargar datos en paralelo
          const dataStart = performance.now();
          const [history, enrollments, instances] = await Promise.all([
            getStudentGameHistory(profile.id),
            getStudentEnrollments(profile.id),
            getInstancesForStudent(profile.id, 10)
          ]);

          logger.debug(`⏱️ [StudentDashboard] Datos paralelos: ${(performance.now() - dataStart).toFixed(0)}ms`);

          setGameHistory(history);
          calculateStats(history);
          setEnrolledCourses(enrollments);

          const now = new Date();
          const futureInstances = instances.filter(inst => {
            const instanceDate = inst.date.toDate ? inst.date.toDate() : new Date(inst.date);
            return instanceDate >= now;
          });
          setUpcomingClasses(futureInstances.slice(0, 1));
        } else {
          logger.warn('No se pudo cargar ni crear perfil de estudiante para:', user.uid);
        }
      } else if (studentProp) {
        setStudent(studentProp);

        // Cargar datos en paralelo
        const dataStart = performance.now();
        const [history, enrollments, instances] = await Promise.all([
          getStudentGameHistory(studentProp.id),
          getStudentEnrollments(studentProp.id),
          getInstancesForStudent(studentProp.id, 10)
        ]);

        logger.debug(`⏱️ [StudentDashboard] Datos paralelos: ${(performance.now() - dataStart).toFixed(0)}ms`);

        setGameHistory(history);
        calculateStats(history);
        setEnrolledCourses(enrollments);

        const now = new Date();
        const futureInstances = instances.filter(inst => {
          const instanceDate = inst.date.toDate ? inst.date.toDate() : new Date(inst.date);
          return instanceDate >= now;
        });
        setUpcomingClasses(futureInstances.slice(0, 1));
      }

      logger.debug(`⏱️ [StudentDashboard] TOTAL: ${(performance.now() - startTime).toFixed(0)}ms`);
      setLoading(false);
    };

    loadProfile();
  }, []);

  const calculateStats = (history) => {
    if (!history || history.length === 0) {
      setStats({
        totalGames: 0,
        averageScore: 0,
        bestScore: 0,
        totalCorrect: 0,
        totalQuestions: 0
      });
      return;
    }

    const totalGames = history.length;
    const totalCorrect = history.reduce((sum, game) => sum + (game.correctAnswers || 0), 0);
    const totalQuestions = history.reduce((sum, game) => sum + (game.totalQuestions || 0), 0);
    const averageScore = Math.round(history.reduce((sum, game) => sum + (game.percentage || 0), 0) / totalGames) || 0;
    const bestScore = Math.max(...history.map(game => game.percentage || 0)) || 0;

    setStats({
      totalGames,
      averageScore: isNaN(averageScore) ? 0 : averageScore,
      bestScore: isNaN(bestScore) ? 0 : bestScore,
      totalCorrect,
      totalQuestions
    });
  };

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
    // TODO: Implementar - abrir ExercisePlayer
    logger.debug('Jugar ejercicio:', exerciseId);
    alert('Funcionalidad de ejercicios próximamente');
  };

  const handleBackToCourseViewer = () => {
    setCurrentView('courseView');
    setSelectedContentId(null);
  };

  const handleContentComplete = () => {
    // Recargar datos del curso para actualizar progreso
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
    setSelectedCourseId(null); // No course context for direct assignments
    setCurrentView('contentPlayer');
  };

  const handlePlayAssignmentExercise = (exerciseId) => {
    // TODO: Implementar - abrir ExercisePlayer
    setSelectedExerciseId(exerciseId);
    logger.debug('Jugar ejercicio asignado:', exerciseId);
    alert('Funcionalidad de ejercicios próximamente');
  };

  const handleMenuAction = (action) => {
    // Mapear las acciones del menú lateral a las vistas del dashboard
    const actionMap = {
      'dashboard': 'dashboard',
      'courses': 'courses',
      'assignments': 'assignments',
      'classes': 'classes',
      'liveClasses': 'liveClasses',
      'whiteboardSessions': 'whiteboardSessions',
      'payments': 'payments'
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

  const handleJoinLiveClass = (liveClass) => {
    setSelectedLiveClass(liveClass);
    setCurrentView('liveClass');
  };

  const handleLeaveLiveClass = () => {
    setSelectedLiveClass(null);
    setCurrentView('liveClasses');
  };

  const handleOpenWhiteboard = () => {
    setSelectedWhiteboardSession(null);
    setCurrentView('whiteboard');
  };

  const handleLoadWhiteboardSession = (session) => {
    logger.debug('📋 [StudentDashboard] Loading whiteboard session:', session);
    logger.debug('📋 [StudentDashboard] Session slides:', session?.slides);
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

  // Cargar clases en vivo disponibles
  useEffect(() => {
    if (!student?.id) return;

    const loadLiveClasses = async () => {
      try {
        const classes = await getStudentAvailableLiveClasses(student.id);
        // Filtrar solo las clases que están actualmente en vivo
        const liveOnly = classes.filter(c => c.status === 'live');
        setLiveClasses(liveOnly);
      } catch (error) {
        logger.error('Error loading live classes:', error);
      }
    };

    loadLiveClasses();
    // Refrescar cada 30 segundos
    const interval = setInterval(loadLiveClasses, 30000);

    return () => clearInterval(interval);
  }, [student?.id]);

  // Subscribe to live whiteboards assigned to this student
  useEffect(() => {
    if (!student?.id) return;

    logger.debug('🟢 [StudentDashboard] Subscribing to live whiteboards for student:', student.id);
    const unsubscribe = subscribeToLiveWhiteboards(student.id, (whiteboards) => {
      logger.debug('🟢 [StudentDashboard] Live whiteboards updated:', whiteboards);
      setLiveWhiteboards(whiteboards);
    });

    return () => {
      logger.debug('🟡 [StudentDashboard] Unsubscribing from live whiteboards');
      unsubscribe();
    };
  }, [student?.id]);

  // Mostrar loading mientras se carga el perfil
  if (loading) {
    return (
      <BaseLoading
        variant="fullscreen"
        text="Cargando tu perfil..."
      />
    );
  }

  // Solo mostrar error si terminó de cargar Y no hay perfil
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

  // Calcular valores de progreso
  const points = student.profile?.totalPoints || 0;
  const level = student.profile?.level || 1;
  const pointsInLevel = points % 100;
  const pointsToNextLevel = 100 - pointsInLevel;
  const progressPercentage = pointsInLevel;

  // Render Collaborative Whiteboard (TEST - Remove later)

  // Render Whiteboard view (when viewing/editing a whiteboard)
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
        <div className="student-dashboard">
          <div className="dashboard-content">
            <WhiteboardManager
              onOpenWhiteboard={handleOpenWhiteboard}
              onLoadSession={handleLoadWhiteboardSession}
              onBack={handleBackToDashboard}
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render MyCourses view
  if (currentView === 'courses') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <div className="student-dashboard">
          <div className="dashboard-content">
            <BaseButton variant="ghost" onClick={handleBackToDashboard} className="mb-4">
              ← Volver a Inicio
            </BaseButton>
            <MyCourses user={user} onSelectCourse={handleSelectCourse} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render MyAssignments view
  if (currentView === 'assignments') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <div className="student-dashboard">
          <div className="dashboard-content">
            <BaseButton variant="ghost" onClick={handleBackToDashboard} className="mb-4">
              ← Volver a Inicio
            </BaseButton>
            <MyAssignments
              user={user}
              onPlayContent={handlePlayAssignmentContent}
              onPlayExercise={handlePlayAssignmentExercise}
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render Payments view
  if (currentView === 'payments') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <div className="student-dashboard">
          <div className="dashboard-content">
            <BaseButton variant="ghost" onClick={handleBackToDashboard} className="mb-4">
              ← Volver a Inicio
            </BaseButton>
            <StudentFeesPanel user={user} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render LiveClassRoom view (when student joins a live class)
  if (currentView === 'liveClass' && selectedLiveClass) {
    return (
      <LiveClassRoom
        classId={selectedLiveClass.id}
        user={user}
        isTeacher={false}
        onLeave={handleLeaveLiveClass}
      />
    );
  }

  // Render Classes view (traditional scheduled classes only)
  if (currentView === 'classes') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <div className="student-dashboard">
          <div className="dashboard-content">
            <BaseButton variant="ghost" onClick={handleBackToDashboard} className="mb-4">
              ← Volver a Inicio
            </BaseButton>
            <StudentClassView student={student} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render Live Classes view (LiveKit sessions only)
  if (currentView === 'liveClasses') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <div className="student-dashboard">
          <div className="dashboard-content">
            <div className="page-header mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clases en Vivo</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Únete a las clases en tiempo real
                </p>
              </div>
            </div>

            {liveClasses.length === 0 ? (
              <BaseEmptyState
                icon={Video}
                title="No hay clases en vivo disponibles"
                description="Cuando tu profesor inicie una clase, aparecerá aquí"
                size="md"
              />
            ) : (
              <div className="live-classes-grid">
                {liveClasses.map((liveClass) => (
                  <div key={liveClass.id} className="live-class-card">
                    <div className="live-class-header">
                      <div className="live-indicator">
                        <span className="live-dot"></span>
                        <span className="live-text">EN VIVO</span>
                      </div>
                      <span className="participant-count">
                        {liveClass.participants?.length || 0} participantes
                      </span>
                    </div>

                    <h3 className="live-class-title">{liveClass.title}</h3>

                    {liveClass.description && (
                      <p className="live-class-description">{liveClass.description}</p>
                    )}

                    <div className="live-class-meta">
                      <div className="meta-item">
                        <Clock size={16} />
                        <span>Iniciada {formatRelativeTime(liveClass.startedAt)}</span>
                      </div>
                      {liveClass.teacherName && (
                        <div className="meta-item">
                          <Target size={16} />
                          <span>{liveClass.teacherName}</span>
                        </div>
                      )}
                    </div>

                    <BaseButton
                      variant="primary"
                      icon={Video}
                      onClick={() => handleJoinLiveClass(liveClass)}
                      fullWidth
                      className="mt-4"
                    >
                      Unirse a la clase
                    </BaseButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render CourseViewer view
  if (currentView === 'courseView' && selectedCourseId) {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <div className="student-dashboard">
          <CourseViewer
            user={user}
            courseId={selectedCourseId}
            courseData={selectedCourseData}
            onBack={handleBackToCourses}
            onPlayContent={handlePlayContent}
            onPlayExercise={handlePlayExercise}
          />
        </div>
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
          courseId={selectedCourseId} // May be null for direct assignments
          onBack={selectedCourseId ? handleBackToCourseViewer : handleBackToAssignments}
          onComplete={handleContentComplete}
        />
      </DashboardLayout>
    );
  }

  // Main Dashboard view
  return (
    <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
      <div className="student-dashboard">
        <div className="dashboard-content">
          {/* Live Whiteboards - Priority Section */}
          {liveWhiteboards.length > 0 && (
            <div className="live-whiteboards-section card" style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none'
            }}>
              <div className="section-header">
                <h3 className="section-title flex items-center gap-2" style={{ color: 'white' }}>
                  <Presentation size={20} strokeWidth={2} />
                  Pizarras en Vivo
                </h3>
                <div className="live-indicator" style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '12px' }}>
                  <span className="live-dot" style={{ background: 'white' }}></span>
                  <span className="live-text" style={{ color: 'white' }}>EN VIVO</span>
                </div>
              </div>
              <div className="live-whiteboards-list" style={{ marginTop: '16px' }}>
                {liveWhiteboards.map((whiteboard) => (
                  <div key={whiteboard.id} className="live-whiteboard-card" style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg" style={{ color: 'white', marginBottom: '8px' }}>
                          {whiteboard.title}
                        </h4>
                        <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>
                          <Clock size={14} />
                          <span>Iniciada {formatRelativeTime(whiteboard.liveStartedAt)}</span>
                        </div>
                      </div>
                      <BaseButton
                        variant="secondary"
                        size="sm"
                        onClick={() => handleJoinLiveWhiteboard(whiteboard)}
                        className="bg-white text-green-600 hover:bg-green-50 border-none font-semibold"
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
          <div className="upcoming-classes-section card">
            <div className="section-header">
              <h3 className="section-title flex items-center gap-2">
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
              <div className="classes-preview">
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
                    <div key={instance.id} className="class-preview-item">
                      <div className="class-preview-header">
                        <div className="class-preview-name">{instance.className}</div>
                        <div className="class-preview-cost">
                          <CreditCard size={14} strokeWidth={2} />
                          {instance.creditCost}
                        </div>
                      </div>
                      <div className="class-preview-datetime">
                        <Clock size={14} strokeWidth={2} />
                        <span>{dateLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-classes-preview">
                <p>No tienes clases programadas próximamente</p>
                <BaseButton variant="outline" onClick={() => setCurrentView('classes')}>
                  Ver calendario de clases
                </BaseButton>
              </div>
            )}
          </div>

          {/* Progress Section */}
          <div className="progress-section card">
            <div className="progress-header">
              <div className="progress-info">
                <span className="progress-label">Puntos totales</span>
                <span className="progress-value">{points} pts</span>
              </div>
              <div className="progress-next">
                <span className="text-sm text-gray-600">
                  {pointsToNextLevel} pts para nivel {level + 1}
                </span>
              </div>
            </div>
            <div className="level-progress">
              <div
                className="level-progress-fill student-progress"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <BaseCard
              variant="elevated"
              icon={Gamepad2}
              className="stat-card"
            >
              <div className="flex flex-col items-center text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.totalGames}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Ejercicios completados
                </div>
              </div>
            </BaseCard>

            <BaseCard
              variant="elevated"
              icon={Target}
              className="stat-card"
            >
              <div className="flex flex-col items-center text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.averageScore}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Promedio
                </div>
              </div>
            </BaseCard>

            <BaseCard
              variant="elevated"
              icon={Target}
              className="stat-card"
            >
              <div className="flex flex-col items-center text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.bestScore}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Mejor puntaje
                </div>
              </div>
            </BaseCard>

            <BaseCard
              variant="elevated"
              icon={Target}
              className="stat-card"
            >
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
          <div className="courses-quick-access card">
            <div className="section-header">
              <h3 className="section-title flex items-center gap-2">
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
              <div className="courses-preview">
                {enrolledCourses.slice(0, 3).map((enrollment) => (
                  <div key={enrollment.enrollmentId} className="course-preview-item">
                    <div className="course-header">
                      <div className="course-name">{enrollment.course.name}</div>
                      {enrollment.course.level && (
                        <BaseBadge variant="primary" size="sm">
                          Nivel {enrollment.course.level}
                        </BaseBadge>
                      )}
                    </div>
                    <div className="course-progress-mini">
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${enrollment.progress?.percentComplete || 0}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{enrollment.progress?.percentComplete || 0}%</span>
                    </div>
                  </div>
                ))}
                {enrolledCourses.length > 3 && (
                  <BaseButton variant="outline" onClick={handleViewMyCourses}>
                    Ver todos mis cursos ({enrolledCourses.length})
                  </BaseButton>
                )}
              </div>
            ) : (
              <div className="empty-courses">
                <p>No tienes cursos asignados aún</p>
                <BaseButton variant="primary" onClick={handleViewMyCourses}>
                  Explorar Cursos
                </BaseButton>
              </div>
            )}
          </div>

          {/* Asignado a Mí - Quick Access */}
          <div className="assignments-quick-access card">
            <div className="section-header">
              <h3 className="section-title flex items-center gap-2">
                <ClipboardList size={20} strokeWidth={2} />
                Asignado a Mí
              </h3>
              <BaseButton variant="ghost" size="sm" onClick={handleViewMyAssignments}>
                Ver todos →
              </BaseButton>
            </div>
            <div className="assignments-info">
              <p className="assignments-description">
                Contenidos y ejercicios asignados directamente por tu profesor para práctica adicional
              </p>
              <BaseButton variant="primary" onClick={handleViewMyAssignments}>
                Ver mis asignaciones
              </BaseButton>
            </div>
          </div>

          {/* Game History */}
          {gameHistory.length > 0 ? (
            <div className="history-section card">
              <h3 className="section-title flex items-center gap-2">
                <ScrollText size={20} strokeWidth={2} />
                Historial Reciente
              </h3>
              <div className="history-list">
                {gameHistory.slice(0, 5).map((game, index) => (
                  <div key={index} className="history-item">
                    <div className="history-main">
                      <div className="history-category">{game.category}</div>
                      <div className="history-date">
                        {new Date(game.date).toLocaleDateString('es-AR')}
                      </div>
                    </div>
                    <div className="history-score">
                      <span className="score-value">{game.score} pts</span>
                      <span className="score-percentage">({game.percentage}%)</span>
                    </div>
                    <div className={`history-position position-${game.position}`}>
                      #{game.position}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card">
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
      </div>
    </DashboardLayout>
  );
}

export default StudentDashboard;
