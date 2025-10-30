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

function StudentDashboard({ student, onLogout, onStartGame, onChangeAvatar }) {
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
    loadStudentData();
  }, [student.id]);

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
    <div className="student-dashboard-container">
      <div className="student-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <div 
              className="avatar-display"
              onClick={() => setShowAvatarSelector(true)}
              title="Click para cambiar avatar"
            >
              <span className="avatar-icon">{currentAvatar}</span>
              <div className="avatar-edit-hint">✏️</div>
            </div>
            <div className="student-info">
              <h1>{student.name}</h1>
              {student.grade && student.section && (
                <p className="student-class">{student.grade}{student.section}</p>
              )}
              <p className="student-code">Código: {student.studentCode}</p>
            </div>
          </div>
          <button className="logout-button" onClick={onLogout}>
            Salir
          </button>
        </div>

        {/* Puntos y Nivel */}
        <div className="points-section">
          <div className="points-card">
            <div className="points-icon">🏆</div>
            <div className="points-info">
              <h2>{points}</h2>
              <p>Puntos Totales</p>
            </div>
          </div>
          <div className="level-card">
            <div className="level-icon">⭐</div>
            <div className="level-info">
              <h2>Nivel {level}</h2>
              <p>{pointsToNextLevel} pts para el siguiente</p>
              <div className="level-progress">
                <div 
                  className="level-progress-fill"
                  style={{ width: `${((points % 100) / 100) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="stats-section">
          <h3>📊 Mis Estadísticas</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎮</div>
              <div className="stat-value">{stats.totalGames}</div>
              <div className="stat-label">Juegos jugados</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-value">{stats.averageScore}%</div>
              <div className="stat-label">Promedio</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🌟</div>
              <div className="stat-value">{stats.bestScore}%</div>
              <div className="stat-label">Mejor puntaje</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-value">{stats.totalCorrect}/{stats.totalQuestions}</div>
              <div className="stat-label">Correctas</div>
            </div>
          </div>
        </div>

        {/* Botón de Jugar */}
        <button className="play-button" onClick={onStartGame}>
          🎮 ¡Jugar Ahora!
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

      {/* Selector de Avatar */}
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
    </div>
  );
}

export default StudentDashboard;
