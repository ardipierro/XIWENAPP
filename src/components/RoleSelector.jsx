import './RoleSelector.css';

function RoleSelector({ onSelectRole }) {
  return (
    <div className="role-selector-container">
      <div className="role-selector-content">
        <div className="role-selector-header">
          <h1>🎮 Quiz Game Xiwen</h1>
          <p>Selecciona tu tipo de acceso</p>
        </div>

        <div className="role-cards">
          <button 
            className="role-card teacher-card"
            onClick={() => onSelectRole('teacher')}
          >
            <div className="role-icon">👨‍🏫</div>
            <h2>Profesor</h2>
            <p>Gestionar alumnos, crear juegos y ver estadísticas</p>
            <div className="role-arrow">→</div>
          </button>

          <button 
            className="role-card student-card"
            onClick={() => onSelectRole('student')}
          >
            <div className="role-icon">👨‍🎓</div>
            <h2>Alumno</h2>
            <p>Jugar, ganar puntos y ver tu progreso</p>
            <div className="role-arrow">→</div>
          </button>
        </div>

        <div className="role-selector-footer">
          <p>✨ Aprende jugando con Xiwen</p>
        </div>
      </div>
    </div>
  );
}

export default RoleSelector;