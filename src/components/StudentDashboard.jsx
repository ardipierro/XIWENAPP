import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getStudentGameHistory, getStudentProfile, ensureStudentProfile, getStudentEnrollments } from '../firebase/firestore';
import DashboardLayout from './DashboardLayout';
import './StudentDashboard.css';

// Avatares disponibles
const AVATARS = {
  default: '👤',
  student1: '👨‍🎓',
  student2: '👩‍🎓',
  scientist: '🧑‍🔬',
  artist: '🧑‍🎨',
  athlete: '🏃',
  reader: '📚',
  star: '⭐',
  rocket: '🚀',
  trophy: '🏆',
  brain: '🧠',
  medal: '🥇'
};

function StudentDashboard({ user, userRole, student: studentProp, onLogout, onChangeAvatar, onStartGame }) {
  const navigate = useNavigate();
  const [student, setStudent] = useState(studentProp);
  const [gameHistory, setGameHistory] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
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
        console.log('🔍 Cargando perfil de estudiante para:', user.uid);
        const profile = await ensureStudentProfile(user.uid);

        if (profile) {
          console.log('✅ Perfil de estudiante cargado/creado:', profile);
          setStudent(profile);

          // Cargar historial de juegos
          const history = await getStudentGameHistory(profile.id);
          setGameHistory(history);
          calculateStats(history);

          // Cargar cursos asignados
          const enrollments = await getStudentEnrollments(profile.id);
          setEnrolledCourses(enrollments);
          console.log('📚 Cursos asignados:', enrollments);
        } else {
          console.warn('⚠️ No se pudo cargar ni crear perfil de estudiante para:', user.uid);
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
        console.log('📚 Cursos asignados:', enrollments);
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

  const handleAvatarChange = (avatarId) => {
    onChangeAvatar(avatarId);
    setShowAvatarSelector(false);
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
            className="btn-primary"
            style={{ marginTop: '24px', padding: '12px 24px', fontSize: '16px' }}
          >
            ← Volver al Login
          </button>
        </div>
      </div>
    );
  }

  // Mostrar loading mientras se carga
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

  // Calcular valores después de verificar loading y error
  const currentAvatar = AVATARS[student.profile?.avatar || 'default'];
  const points = student.profile?.totalPoints || 0;
  const level = student.profile?.level || 1;
  const pointsInLevel = points % 100;
  const pointsToNextLevel = 100 - pointsInLevel;
  const progressPercentage = pointsInLevel;

  return (
    <DashboardLayout user={user} userRole={userRole} onLogout={onLogout}>
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
              <div className="stat-icon">🎮</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalGames}</div>
                <div className="stat-label">Juegos jugados</div>
              </div>
            </div>

            <div className="stat-card card">
              <div className="stat-icon">🎯</div>
              <div className="stat-info">
                <div className="stat-value">{stats.averageScore}%</div>
                <div className="stat-label">Promedio</div>
              </div>
            </div>

            <div className="stat-card card">
              <div className="stat-icon">⭐</div>
              <div className="stat-info">
                <div className="stat-value">{stats.bestScore}%</div>
                <div className="stat-label">Mejor puntaje</div>
              </div>
            </div>

            <div className="stat-card card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalCorrect}</div>
                <div className="stat-label">Respuestas correctas</div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <button className="btn-play student-cta" onClick={onStartGame}>
            <span className="cta-icon">🎮</span>
            <span className="cta-text">¡Jugar Ahora!</span>
          </button>

          {/* Cursos Asignados */}
          {enrolledCourses.length > 0 && (
            <div className="courses-section card">
              <h3 className="section-title">📚 Mis Cursos</h3>
              <div className="courses-list">
                {enrolledCourses.map((enrollment) => (
                  <div key={enrollment.enrollmentId} className="course-item">
                    <div className="course-header">
                      <div className="course-name">{enrollment.course.name}</div>
                      {enrollment.course.level && (
                        <span className="course-level">Nivel {enrollment.course.level}</span>
                      )}
                    </div>
                    {enrollment.course.description && (
                      <div className="course-description">{enrollment.course.description}</div>
                    )}
                    <div className="course-progress-bar">
                      <div className="progress-label">
                        <span>Progreso</span>
                        <span className="progress-percent">{enrollment.progress?.percentComplete || 0}%</span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${enrollment.progress?.percentComplete || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <button
                      className="btn btn-outline course-btn"
                      onClick={() => alert('Funcionalidad de curso en desarrollo')}
                    >
                      📖 Continuar Curso
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Game History */}
          {gameHistory.length > 0 ? (
            <div className="history-section card">
              <h3 className="section-title">📜 Historial Reciente</h3>
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
              <div className="empty-icon">🎯</div>
              <h3>¡Aún no has jugado!</h3>
              <p>Comienza tu primera partida y empieza a ganar puntos</p>
              <button className="btn btn-primary" onClick={onStartGame}>
                Jugar primer juego
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <div className="modal-overlay" onClick={() => setShowAvatarSelector(false)}>
          <div className="modal-content avatar-selector" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Selecciona tu Avatar</h3>
            <div className="avatars-grid">
              {Object.entries(AVATARS).map(([id, emoji]) => (
                <button
                  key={id}
                  className={`avatar-option ${(student.profile?.avatar || 'default') === id ? 'selected' : ''}`}
                  onClick={() => handleAvatarChange(id)}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              className="btn btn-ghost w-full"
              onClick={() => setShowAvatarSelector(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default StudentDashboard;
