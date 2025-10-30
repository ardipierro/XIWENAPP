import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'; // ⭐ NUEVO: Agregar createUser para register
import { auth } from '../firebase/config';
import { setUserRole, getStudentProfile } from '../firebase/firestore'; // ⭐ NUEVO: Importar getStudentProfile
import './StudentLogin.css'; // Asumiendo CSS existe

function StudentLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // ⭐ NUEVO: Estado para toggle register/login

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getStudentProfile(userCredential.user.uid); // Fetch profile
      if (profile) {
        onLoginSuccess(profile);
      } else {
        setError('Perfil no encontrado. Contacta al administrador.');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  // ⭐ NUEVO: Función para register
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setUserRole(userCredential.user.uid, 'student');
      const profile = await getStudentProfile(userCredential.user.uid);
      if (profile) {
        onLoginSuccess(profile);
      } else {
        setError('Error al crear perfil. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error al registrarse:', error);
      setError('Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '20px', 
      background: '#f9fafb', 
      borderRadius: '8px', 
      maxWidth: '400px', 
      margin: 'auto' 
    }}>
      <h2 style={{ marginBottom: '20px' }}>{isRegistering ? 'Registro Alumno' : 'Login Alumno'}</h2>
      <form onSubmit={isRegistering ? handleRegister : handleLogin} style={{ width: '100%' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Email" 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Contraseña</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Contraseña" 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: '#4F46E5', color: 'white', borderRadius: '4px' }}>
          {loading ? 'Cargando...' : (isRegistering ? 'Registrarse' : 'Ingresar')}
        </button>
      </form>
      <button onClick={() => setIsRegistering(!isRegistering)} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#4F46E5', cursor: 'pointer' }}>
        {isRegistering ? 'Ya tengo cuenta' : 'Crear cuenta nueva'}
      </button>
    </div>
  );
}

export default StudentLogin;
</DOCUMENT>

<DOCUMENT filename="StudentDashboard.jsx">
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

function StudentDashboard({ student, onLogout, onChangeAvatar }) {
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