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
    if (student && student.id) { // ⭐ NUEVO: Check if student and id exist
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

  if (!student || !student.id) { // ⭐ NUEVO: Handle if student is null or no id
    return <div>Error: Perfil no encontrado. Por favor, loguea de nuevo.</div>;
  }

  const currentAvatar = AVATARS[student.profile?.avatar || 'default'];
  const points = student.profile?.totalPoints || 0;
  const level = student.profile?.level || 1;
  const pointsToNextLevel = (level * 100) - points;

  if (loading) {
    return (
      <div className="student-dashboard-container">
        <div className="loading-screen">
          <div className="loading-spinner">🎮</div>
          <p>Cargando tu perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="student-dashboard-container">
        <div className="dashboard-header">
          <div className="header-left">
            <div className="avatar-container" onClick={() => setShowAvatarSelector(true)}>
              <div className="avatar-emoji">{currentAvatar}</div>
              <div className="avatar-change">✏️</div>
            </div>
            <div className="user-info">
              <h2>{student.name}</h2>
              <p className="user-level">Nivel {level}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            🚪 Salir
          </button>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-header">
            <span>Puntos: {points}</span>
            <span>{pointsToNextLevel} para siguiente nivel</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(points % 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">🎮</div>
            <div className="stat-value">{stats.totalGames}</div>
            <div className="stat-label">Juegos</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-value">{stats.averageScore}%</div>
            <div className="stat-label">Promedio</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-value">{stats.bestScore}%</div>
            <div className="stat-label">Mejor</div>
          </div>
        </div>

        {/* Call to Action */}
        <button className="play-button" onClick={onStartGame}>
          ¡Jugar ahora!
        </button>

        {/* Historial Reciente */}
        {gameHistory.length > 0 && (
          <div className="history-section">
            <h3>📜 Historial Reciente</h3>
            <div className="history-list">
              {gameHistory.slice(0, 5).map((game, index) => (
                <div key={index} className="history-item">
                  <div className="history-date">
                    {new Date(game.date).toLocaleDateString('es-AR')}
                  </div>
                  <div className="history-details">
                    <div className="history-category">{game.category}</div>
                    <div className="history-score">
                      <span className="score-value">{game.score} pts</span>
                      <span className="score-percentage">({game.percentage}%)</span>
                    </div>
                  </div>
                  <div className={`history-position position-${game.position}`}>
                    #{game.position}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {gameHistory.length === 0 && (
          <div className="no-games-message">
            <div className="no-games-icon">🎯</div>
            <h3>¡Aún no has jugado!</h3>
            <p>Comienza tu primera partida y empieza a ganar puntos</p>
          </div>
        )}
      </div>

      {showAvatarSelector && (
        <div className="avatar-selector-overlay" onClick={() => setShowAvatarSelector(false)}>
          <div className="avatar-selector-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Selecciona tu Avatar</h3>
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
            <button className="close-avatar-selector" onClick={() => setShowAvatarSelector(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default StudentDashboard;
