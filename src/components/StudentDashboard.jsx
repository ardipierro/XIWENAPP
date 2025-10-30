import { useState, useEffect } from 'react';
import { getStudentGameHistory } from '../firebase/firestore';
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

function StudentDashboard({ student, onLogout, onChangeAvatar, onStartGame }) {
  const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [stats, setStats] = useState({
    totalGames: 0,
    averageScore: 0,
    bestScore: 0,
    totalCorrect: 0,
    totalQuestions: 0
  });

  useEffect(() => {
    if (student && student.id) {
      loadStudentData();
    } else {
      setLoading(false);
    }
  }, [student]);

  const loadStudentData = async () => {
    setLoading(true);
    const history = await getStudentGameHistory(student.id);
    setGameHistory(history);
    calculateStats(history);
    setLoading(false);
  };

  const calculateStats = (history) => {
    if (history.length === 0) {
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
    const totalCorrect = history.reduce((sum, game) => sum + game.correctAnswers, 0);
    const totalQuestions = history.reduce((sum, game) => sum + game.totalQuestions, 0);
    const averageScore = Math.round(history.reduce((sum, game) => sum + game.percentage, 0) / totalGames);
    const bestScore = Math.max(...history.map(game => game.percentage));

    setStats({
      totalGames,
      averageScore,
      bestScore,
      totalCorrect,
      totalQuestions
    });
  };

  const handleAvatarChange = (avatarId) => {
    onChangeAvatar(avatarId);
    setShowAvatarSelector(false);
  };

  if (!student || !student.id) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <span className="text-4xl mb-4">⚠️</span>
          <h3>Error: Perfil no encontrado</h3>
          <p>Por favor, vuelve a iniciar sesión</p>
        </div>
      </div>
    );
  }

  const currentAvatar = AVATARS[student.profile?.avatar || 'default'];
  const points = student.profile?.totalPoints || 0;
  const level = student.profile?.level || 1;
  const pointsInLevel = points % 100;
  const pointsToNextLevel = 100 - pointsInLevel;
  const progressPercentage = pointsInLevel;

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

  return (
    <>
      <div className="dashboard-container student-theme">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <div 
                className="avatar-container clickable"
                onClick={() => setShowAvatarSelector(true)}
              >
                <div className="avatar-display student-avatar">
                  <span className="avatar-emoji">{currentAvatar}</span>
                </div>
                <div className="avatar-edit-badge">
                  <span>✏️</span>
                </div>
              </div>
              <div className="user-info">
                <h1 className="user-name">{student.name}</h1>
                <div className="user-meta">
                  <span className="badge badge-student">Estudiante</span>
                  <span className="user-level">Nivel {level}</span>
                </div>
                {student.studentCode && (
                  <p className="student-code">Código: {student.studentCode}</p>
                )}
              </div>
            </div>
            <button className="btn btn-danger" onClick={onLogout}>
              🚪 Salir
            </button>
          </div>
        </header>

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
    </>
  );
}

export default StudentDashboard;
