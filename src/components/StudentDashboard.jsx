import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getStudentGameHistory, getStudentProfile, ensureStudentProfile, getStudentEnrollments } from '../firebase/firestore';
import { Gamepad2, Target, BookOpen, ClipboardList, ScrollText } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import MyCourses from './student/MyCourses';
import MyAssignments from './student/MyAssignments';
import CourseViewer from './student/CourseViewer';
import ContentPlayer from './student/ContentPlayer';
import StudentClassView from './StudentClassView';
import './StudentDashboard.css';

function StudentDashboard({ user, userRole, student: studentProp, onLogout, onStartGame }) {
  const navigate = useNavigate();
  const [student, setStudent] = useState(studentProp);
  const [gameHistory, setGameHistory] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'courses', 'assignments', 'classes', 'courseView', 'contentPlayer'
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCourseData, setSelectedCourseData] = useState(null);
  const [selectedContentId, setSelectedContentId] = useState(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
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
      setLoading(true); // Asegurar que loading está en true

      if (!studentProp && user) {
        // Intentar cargar o crear el perfil del estudiante desde Firestore
        console.log('Cargando perfil de estudiante para:', user.uid);
        const profile = await ensureStudentProfile(user.uid);

        if (profile) {
          console.log('Perfil de estudiante cargado/creado:', profile);
          setStudent(profile);

          // Cargar historial de juegos
          const history = await getStudentGameHistory(profile.id);
          setGameHistory(history);
          calculateStats(history);

          // Cargar cursos asignados
          const enrollments = await getStudentEnrollments(profile.id);
          setEnrolledCourses(enrollments);
          console.log('Cursos asignados:', enrollments);
        } else {
          console.warn('No se pudo cargar ni crear perfil de estudiante para:', user.uid);
        }
      } else if (studentProp) {
        setStudent(studentProp);

        // Cargar historial de juegos
        const history = await getStudentGameHistory(studentProp.id);
        setGameHistory(history);
        calculateStats(history);

        // Cargar cursos asignados
        const enrollments = await getStudentEnrollments(studentProp.id);
        setEnrolledCourses(enrollments);
        console.log('Cursos asignados:', enrollments);
      }

      setLoading(false); // Siempre terminar con loading en false
    };

    loadProfile();
  }, [user?.uid, studentProp]); // Ejecutar solo cuando cambie el uid o el prop inicial

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
      'classes': 'classes'
    };

    const view = actionMap[action];

    if (view) {
      setCurrentView(view);
      setSelectedCourseId(null);
      setSelectedContentId(null);
      setSelectedExerciseId(null);
    }
  };

  // Mostrar loading mientras se carga el perfil
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando tu perfil...</p>
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

  // Render MyCourses view
  if (currentView === 'courses') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <div className="student-dashboard">
          <div className="dashboard-content">
            <button className="btn btn-ghost mb-4" onClick={handleBackToDashboard}>
              ← Volver al Dashboard
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
              ← Volver al Dashboard
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

  // Render Classes view
  if (currentView === 'classes') {
    return (
      <DashboardLayout user={user} userRole={userRole} onLogout={onLogout} onMenuAction={handleMenuAction}>
        <div className="student-dashboard">
          <div className="dashboard-content">
            <button className="btn btn-ghost mb-4" onClick={handleBackToDashboard}>
              ← Volver al Dashboard
            </button>
            <StudentClassView student={student} />
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
                <Gamepad2 size={40} strokeWidth={2} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalGames}</div>
                <div className="stat-label">Juegos jugados</div>
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

          {/* Call to Action */}
          <button className="btn-play student-cta" onClick={onStartGame}>
            <span className="cta-icon">
              <Gamepad2 size={24} strokeWidth={2} />
            </span>
            <span className="cta-text">¡Jugar Ahora!</span>
          </button>

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
              <h3>¡Aún no has jugado!</h3>
              <p>Comienza tu primera partida y empieza a ganar puntos</p>
              <button className="btn btn-primary" onClick={onStartGame}>
                Jugar primer juego
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudentDashboard;
