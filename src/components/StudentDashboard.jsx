import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getStudentGameHistory, getStudentProfile, ensureStudentProfile, getStudentEnrollments } from '../firebase/firestore';
import { getInstancesForStudent } from '../firebase/classInstances';
import { getStudentAvailableLiveClasses } from '../firebase/liveClasses';
import { getAssignedWhiteboards, subscribeToLiveWhiteboards } from '../firebase/whiteboard';
import { Gamepad2, Target, BookOpen, ClipboardList, ScrollText, Calendar, Clock, CreditCard, Video, Presentation } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import MyCourses from './student/MyCourses';
import MyAssignments from './student/MyAssignments';
import CourseViewer from './student/CourseViewer';
import ContentPlayer from './student/ContentPlayer';
import StudentClassView from './StudentClassView';
import LiveClassRoom from './LiveClassRoom';
import WhiteboardManager from './WhiteboardManager';
import Whiteboard from './Whiteboard';
import MessagesPanel from './MessagesPanel';
import './StudentDashboard.css';

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
        console.log('Cargando perfil de estudiante para:', user.uid);
        const profile = await ensureStudentProfile(user.uid);

        if (profile) {
          console.log('Perfil de estudiante cargado/creado:', profile);
          setStudent(profile);

          // Cargar datos en paralelo
          const dataStart = performance.now();
          const [history, enrollments, instances] = await Promise.all([
            getStudentGameHistory(profile.id),
            getStudentEnrollments(profile.id),
            getInstancesForStudent(profile.id, 10)
          ]);

          console.log(`⏱️ [StudentDashboard] Datos paralelos: ${(performance.now() - dataStart).toFixed(0)}ms`);

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
          console.warn('No se pudo cargar ni crear perfil de estudiante para:', user.uid);
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

        console.log(`⏱️ [StudentDashboard] Datos paralelos: ${(performance.now() - dataStart).toFixed(0)}ms`);

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

      console.log(`⏱️ [StudentDashboard] TOTAL: ${(performance.now() - startTime).toFixed(0)}ms`);
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
      console.log('✅ Sesión cerrada');
      navigate('/login');
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
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
    console.log('Jugar ejercicio:', exerciseId);
    alert('Funcionalidad de ejercicios próximamente');
  };

  const handleBackToCourseViewer = () => {
    setCurrentView('courseView');
    setSelectedContentId(null);
  };

  const handleContentComplete = () => {
    // Recargar datos del curso para actualizar progreso
    console.log('Contenido completado');
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
    console.log('Jugar ejercicio asignado:', exerciseId);
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
      'messages': 'messages'
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
    console.log('📋 [StudentDashboard] Loading whiteboard session:', session);
    console.log('📋 [StudentDashboard] Session slides:', session?.slides);
    setSelectedWhiteboardSession(session);
    setCurrentView('whiteboard');
  };

  const handleBackToWhiteboardManager = () => {
    setSelectedWhiteboardSession(null);
    setCurrentView('whiteboardSessions');
  };

  const handleJoinLiveWhiteboard = (whiteboard) => {
    console.log('📋 [StudentDashboard] Joining live whiteboard:', whiteboard);
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
        console.error('Error loading live classes:', error);
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

    console.log('🟢 [StudentDashboard] Subscribing to live whiteboards for student:', student.id);
    const unsubscribe = subscribeToLiveWhiteboards(student.id, (whiteboards) => {
      console.log('🟢 [StudentDashboard] Live whiteboards updated:', whiteboards);
      setLiveWhiteboards(whiteboards);
    });

    return () => {
      console.log('🟡 [StudentDashboard] Unsubscribing from live whiteboards');
      unsubscribe();
    };
  }, [student?.id]);

  // Mostrar loading mientras se carga el perfil
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  // Solo mostrar error si terminó de cargar Y no hay perfil
  if (!student || !student.id) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <span className="text-4xl mb-4">⚠️</span>
          <h3>Error de Configuración</h3>
          <p>No se pudo cargar tu perfil de estudiante.</p>
          <p style={{ marginTop: '12px', fontSize: '14px', opacity: 0.8 }}>
            Contacta al administrador si el problema persiste.
          </p>
          <button
            onClick={handleBackToLogin}
            className="btn btn-primary"
            style={{ marginTop: '24px', padding: '12px 24px', fontSize: '16px' }}
          >
            ← Volver al Login
          </button>
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
            <button className="btn btn-ghost mb-4" onClick={handleBackToDashboard}>
              ← Volver a Inicio
            </button>
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
            <button className="btn btn-ghost mb-4" onClick={handleBackToDashboard}>
              ← Volver a Inicio
            </button>
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

  // Render Messages view
  if (currentView === 'messages') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <MessagesPanel user={user} />
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
            <button className="btn btn-ghost mb-4" onClick={handleBackToDashboard}>
              ← Volver a Inicio
            </button>
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
              <div className="empty-state">
                <Video size={64} className="text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No hay clases en vivo disponibles
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Cuando tu profesor inicie una clase, aparecerá aquí
                </p>
              </div>
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

                    <button
                      onClick={() => handleJoinLiveClass(liveClass)}
                      className="btn btn-primary w-full mt-4"
                    >
                      <Video size={18} />
                      <span>Unirse a la clase</span>
                    </button>
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
                      <button
                        onClick={() => handleJoinLiveWhiteboard(whiteboard)}
                        className="btn"
                        style={{
                          background: 'white',
                          color: '#10b981',
                          border: 'none',
                          fontWeight: 600,
                          padding: '8px 20px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Unirse →
                      </button>
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
                <button className="btn btn-text" onClick={() => setCurrentView('classes')}>
                  Ver todas →
                </button>
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
                <button className="btn btn-outline" onClick={() => setCurrentView('classes')}>
                  Ver calendario de clases
                </button>
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
            <div className="stat-card card">
              <div className="stat-icon">
                <Target size={40} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalGames}</div>
                <div className="stat-label">Ejercicios completados</div>
              </div>
            </div>

            <div className="stat-card card">
              <div className="stat-icon">
                <Target size={40} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.averageScore}%</div>
                <div className="stat-label">Promedio</div>
              </div>
            </div>

            <div className="stat-card card">
              <div className="stat-icon">
                <Target size={40} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.bestScore}%</div>
                <div className="stat-label">Mejor puntaje</div>
              </div>
            </div>

            <div className="stat-card card">
              <div className="stat-icon">
                <Target size={40} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalCorrect}</div>
                <div className="stat-label">Respuestas correctas</div>
              </div>
            </div>
          </div>

          {/* Mis Cursos - Quick Access */}
          <div className="courses-quick-access card">
            <div className="section-header">
              <h3 className="section-title flex items-center gap-2">
                <BookOpen size={20} strokeWidth={2} />
                Mis Cursos
              </h3>
              {enrolledCourses.length > 0 && (
                <button className="btn btn-text" onClick={handleViewMyCourses}>
                  Ver todos →
                </button>
              )}
            </div>
            {enrolledCourses.length > 0 ? (
              <div className="courses-preview">
                {enrolledCourses.slice(0, 3).map((enrollment) => (
                  <div key={enrollment.enrollmentId} className="course-preview-item">
                    <div className="course-header">
                      <div className="course-name">{enrollment.course.name}</div>
                      {enrollment.course.level && (
                        <span className="course-level">Nivel {enrollment.course.level}</span>
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
                  <button className="btn btn-outline" onClick={handleViewMyCourses}>
                    Ver todos mis cursos ({enrolledCourses.length})
                  </button>
                )}
              </div>
            ) : (
              <div className="empty-courses">
                <p>No tienes cursos asignados aún</p>
                <button className="btn btn-primary" onClick={handleViewMyCourses}>
                  Explorar Cursos
                </button>
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
              <button className="btn btn-text" onClick={handleViewMyAssignments}>
                Ver todos →
              </button>
            </div>
            <div className="assignments-info">
              <p className="assignments-description">
                Contenidos y ejercicios asignados directamente por tu profesor para práctica adicional
              </p>
              <button className="btn btn-primary" onClick={handleViewMyAssignments}>
                Ver mis asignaciones
              </button>
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
            <div className="empty-state card">
              <div className="empty-icon">
                <Target size={64} strokeWidth={2} />
              </div>
              <h3>¡Aún no has completado ejercicios!</h3>
              <p>Comienza tu primer ejercicio y empieza a ganar puntos</p>
              <button className="btn btn-primary" onClick={onStartGame}>
                Comenzar ejercicios
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudentDashboard;
