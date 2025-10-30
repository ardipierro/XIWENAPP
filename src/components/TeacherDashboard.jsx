import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStudents, loadGameHistory, loadCategories } from '../firebase/firestore';
import StudentManager from './StudentManager';
import Navigation from './Navigation';
import './TeacherDashboard.css';
import { isAdminEmail } from '../firebase/roleConfig';

function TeacherDashboard({ user, userRole, onStartGame, onManageCategories, onViewHistory, onLogout, setTeacherScreen }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    studentsWithCode: 0,
    totalGames: 0,
    totalCategories: 0,
    activeStudents: 0
  });
  const [recentGames, setRecentGames] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStudentManager, setShowStudentManager] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handlers por defecto para funcionalidades no implementadas
  const handleStartGame = () => {
    if (onStartGame) {
      onStartGame();
    } else {
      alert('⚠️ Funcionalidad "Crear Juego" próximamente.\n\nEsta característica estará disponible en una futura actualización.');
    }
  };

  const handleManageCategories = () => {
    if (onManageCategories) {
      onManageCategories();
    } else {
      alert('⚠️ Funcionalidad "Gestionar Categorías" próximamente.\n\nEsta característica estará disponible en una futura actualización.');
    }
  };

  const handleViewHistory = () => {
    if (onViewHistory) {
      onViewHistory();
    } else {
      alert('⚠️ Funcionalidad "Ver Historial" próximamente.\n\nEsta característica estará disponible en una futura actualización.');
    }
  };

  const handleManageCourses = () => {
    if (setTeacherScreen) {
      setTeacherScreen('courses');
    } else {
      alert('⚠️ Funcionalidad "Gestionar Cursos" próximamente.\n\nEsta característica estará disponible en una futura actualización.');
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Cargar alumnos
      const students = await loadStudents();
      const activeStudents = students.filter(s => s.active !== false);
      const studentsWithCode = activeStudents.filter(s => s.studentCode);

      // Cargar historial de juegos
      const games = await loadGameHistory();

      // Cargar categorías
      const categories = await loadCategories();

      // Calcular top students
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
        totalStudents: activeStudents.length,
        studentsWithCode: studentsWithCode.length,
        totalGames: games.length,
        totalCategories: Object.keys(categories).length,
        activeStudents: topStudentsArray.length
      });

      setRecentGames(games.slice(0, 5));
      setTopStudents(topStudentsArray);
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    }
    setLoading(false);
  };

  const handleCloseStudentManager = () => {
    setShowStudentManager(false);
    loadDashboardData();
  };

  // Obtener iniciales para el avatar
  const getUserInitials = () => {
    if (!user.email) return '?';
    return user.email.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando panel del profesor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation user={user} userRole={userRole} />
      <div className="dashboard-container teacher-theme">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <div className="avatar-container">
                <div className="avatar-display teacher-avatar">
                  <span className="avatar-initial">{getUserInitials()}</span>
                </div>
              </div>
              <div className="user-info">
                <h1 className="user-name">Panel del Profesor</h1>
                <div className="user-meta">
                  <span className="badge badge-teacher">Profesor</span>
                  <span className="user-email">{user.email}</span>
                </div>
              </div>
            </div>
            <button className="btn btn-danger" onClick={onLogout}>
              🚪 Salir
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Stats Section */}
          <section className="stats-section">
            <h2 className="section-title">📊 Resumen General</h2>
            <div className="stats-grid">
              <div className="stat-card card border-left-blue">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.totalStudents}</div>
                  <div className="stat-label">Alumnos totales</div>
                </div>
              </div>

              <div className="stat-card card border-left-green">
                <div className="stat-icon">🔑</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.studentsWithCode}</div>
                  <div className="stat-label">Con código activo</div>
                </div>
              </div>

              <div className="stat-card card border-left-purple">
                <div className="stat-icon">🎮</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.totalGames}</div>
                  <div className="stat-label">Juegos totales</div>
                </div>
              </div>

              <div className="stat-card card border-left-orange">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.totalCategories}</div>
                  <div className="stat-label">Categorías</div>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="actions-section">
            <h2 className="section-title">⚡ Acciones Rápidas</h2>
            <div className="actions-grid">
              <button className="action-card action-primary" onClick={handleStartGame}>
                <div className="action-icon">🎮</div>
                <div className="action-content">
                  <h3>Crear Juego</h3>
                  <p>Configurar nuevo quiz</p>
                </div>
                <div className="action-arrow">→</div>
              </button>

              <button className="action-card action-secondary" onClick={() => setShowStudentManager(true)}>
                <div className="action-icon">👥</div>
                <div className="action-content">
                  <h3>Gestionar Alumnos</h3>
                  <p>Agregar y editar</p>
                </div>
                <div className="action-arrow">→</div>
              </button>

              <button className="action-card action-secondary" onClick={handleManageCategories}>
                <div className="action-icon">📂</div>
                <div className="action-content">
                  <h3>Gestionar Categorías</h3>
                  <p>Crear y editar temas</p>
                </div>
                <div className="action-arrow">→</div>
              </button>

              <button className="action-card action-secondary" onClick={handleViewHistory}>
                <div className="action-icon">📊</div>
                <div className="action-content">
                  <h3>Ver Historial</h3>
                  <p>Resultados anteriores</p>
                </div>
                <div className="action-arrow">→</div>
              </button>

              <button className="action-card action-secondary" onClick={handleManageCourses}>
                <div className="action-icon">📚</div>
                <div className="action-content">
                  <h3>Gestionar Cursos</h3>
                  <p>Crear y editar lecciones</p>
                </div>
                <div className="action-arrow">→</div>
              </button>

              {isAdminEmail(user?.email) && (
                <button
                  onClick={() => setTeacherScreen ? setTeacherScreen('admin') : navigate('/admin')}
                  className="action-card action-secondary admin-card">
                  <div className="action-icon">👑</div>
                  <div className="action-content">
                    <h3>Panel de Administración</h3>
                    <p>Gestionar usuarios y roles del sistema</p>
                  </div>
                  <div className="action-arrow">→</div>
                </button>
              )}
            </div>
          </section>

          {/* Dashboard Grid */}
          <div className="dashboard-grid">
            {/* Recent Activity */}
            <section className="dashboard-section card">
              <h3 className="section-title">📈 Actividad Reciente</h3>
              <div className="recent-games-list">
                {recentGames.length > 0 ? (
                  recentGames.map((game, index) => (
                    <div key={index} className="recent-game-item">
                      <div className="game-icon">🎮</div>
                      <div className="game-info">
                        <div className="game-category">{game.category}</div>
                        <div className="game-meta">
                          <span className="game-date">
                            {new Date(game.date).toLocaleDateString('es-AR')}
                          </span>
                          <span className="game-players">
                            {game.players?.length || 0} jugadores
                          </span>
                        </div>
                      </div>
                      <div className="game-mode">{game.mode}</div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-small">
                    <div className="empty-icon">🎯</div>
                    <p>Aún no hay juegos creados</p>
                    <button className="btn btn-primary btn-sm" onClick={onStartGame}>
                      Crear primer juego
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Top Students */}
            <section className="dashboard-section card">
              <h3 className="section-title">🏆 Alumnos Destacados</h3>
              <div className="top-students-list">
                {topStudents.length > 0 ? (
                  topStudents.map((student, index) => (
                    <div key={index} className="top-student-item">
                      <div className={`student-rank rank-${index + 1}`}>
                        #{index + 1}
                      </div>
                      <div className="student-info">
                        <div className="student-name">{student.name}</div>
                        <div className="student-stats">
                          {student.gamesPlayed} juegos · {student.avgScore.toFixed(0)} pts promedio
                        </div>
                      </div>
                      <div className="student-badge">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-small">
                    <div className="empty-icon">👥</div>
                    <p>Los alumnos aparecerán aquí cuando jueguen</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Student Manager Modal */}
      {showStudentManager && (
        <StudentManager
          onClose={handleCloseStudentManager}
          onStudentSelect={null}
        />
      )}
    </>
  );
}

export default TeacherDashboard;
