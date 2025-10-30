import { useState, useEffect } from 'react';
import { loadStudents, loadGameHistory, loadCategories } from '../firebase/firestore';
import StudentManager from './StudentManager';  // ⭐ IMPORTAR StudentManager
import './TeacherDashboard.css';

function TeacherDashboard({ user, onStartGame, onManageCategories, onViewHistory, onLogout }) {
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
  
  // ⭐ NUEVO: Estado para mostrar modal de estudiantes
  const [showStudentManager, setShowStudentManager] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

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

      // Calcular top students (más activos)
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

      // Calcular promedios y ordenar
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

  // ⭐ NUEVO: Función para manejar cierre del modal
  const handleCloseStudentManager = () => {
    setShowStudentManager(false);
    loadDashboardData(); // Recargar estadísticas después de cambios
  };

  if (loading) {
    return (
      <div className="teacher-dashboard-loading">
        <div className="loading-spinner">📊</div>
        <p>Cargando panel del profesor...</p>
      </div>
    );
  }

  return (
    <>
      <div className="teacher-dashboard-container">
        {/* Header */}
        <div className="teacher-dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <h1>👨‍🏫 Panel del Profesor</h1>
              <p className="user-email">{user.email}</p>
            </div>
            <button className="logout-btn" onClick={onLogout}>
              🚪 Salir
            </button>
          </div>
        </div>

        <div className="teacher-dashboard-content">
          {/* Stats Cards */}
          <div className="stats-section">
            <h2 className="section-title">📊 Resumen General</h2>
            <div className="stats-grid">
              <div className="stat-card card-blue">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.totalStudents}</div>
                  <div className="stat-label">Alumnos Totales</div>
                  <div className="stat-sublabel">{stats.studentsWithCode} con código</div>
                </div>
              </div>

              <div className="stat-card card-green">
                <div className="stat-icon">🎮</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.totalGames}</div>
                  <div className="stat-label">Juegos Creados</div>
                  <div className="stat-sublabel">Historial completo</div>
                </div>
              </div>

              <div className="stat-card card-purple">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.totalCategories}</div>
                  <div className="stat-label">Categorías</div>
                  <div className="stat-sublabel">Temas disponibles</div>
                </div>
              </div>

              <div className="stat-card card-orange">
                <div className="stat-icon">⭐</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.activeStudents}</div>
                  <div className="stat-label">Alumnos Activos</div>
                  <div className="stat-sublabel">Han jugado</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="actions-section">
            <h2 className="section-title">🎯 Acciones Rápidas</h2>
            <div className="actions-grid">
              <button className="action-card action-primary" onClick={onStartGame}>
                <div className="action-icon">🎮</div>
                <div className="action-content">
                  <h3>Crear Juego</h3>
                  <p>Iniciar una nueva partida</p>
                </div>
                <div className="action-arrow">→</div>
              </button>

              {/* ⭐ MODIFICADO: Ahora controla el estado local */}
              <button 
                className="action-card action-secondary" 
                onClick={() => setShowStudentManager(true)}
              >
                <div className="action-icon">👥</div>
                <div className="action-content">
                  <h3>Gestionar Alumnos</h3>
                  <p>Ver, agregar o editar alumnos</p>
                </div>
                <div className="action-arrow">→</div>
              </button>

              <button className="action-card action-secondary" onClick={onManageCategories}>
                <div className="action-icon">📚</div>
                <div className="action-content">
                  <h3>Gestionar Categorías</h3>
                  <p>Crear y editar temas</p>
                </div>
                <div className="action-arrow">→</div>
              </button>

              <button className="action-card action-secondary" onClick={onViewHistory}>
                <div className="action-icon">📊</div>
                <div className="action-content">
                  <h3>Ver Historial</h3>
                  <p>Resultados de juegos anteriores</p>
                </div>
                <div className="action-arrow">→</div>
              </button>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="dashboard-grid">
            {/* Recent Activity */}
            <div className="dashboard-section">
              <h2 className="section-title">📈 Actividad Reciente</h2>
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
                  <div className="empty-state">
                    <div className="empty-icon">🎯</div>
                    <p>Aún no hay juegos creados</p>
                    <button className="empty-action" onClick={onStartGame}>
                      Crear primer juego
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Top Students */}
            <div className="dashboard-section">
              <h2 className="section-title">🏆 Alumnos Destacados</h2>
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
                  <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <p>Los alumnos aparecerán aquí cuando jueguen</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ⭐ NUEVO: Modal de gestión de alumnos */}
      {showStudentManager && (
        <StudentManager
          onClose={handleCloseStudentManager}
          onStudentSelect={null}  // No necesario desde el dashboard
        />
      )}
    </>
  );
}

export default TeacherDashboard;
