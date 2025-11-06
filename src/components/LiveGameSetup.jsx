import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Users, Timer, RotateCcw, Shuffle } from 'lucide-react';
import { createGameSession } from '../firebase/gameSession';
import { loadCategories, loadQuestionsByCategory } from '../firebase/firestore';
import './LiveGameSetup.css';

/**
 * Formulario para crear una nueva sesión de juego en vivo
 */
function LiveGameSetup({ user, onSessionCreated, onBack }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [questions, setQuestions] = useState([]);
  const [studentNames, setStudentNames] = useState('');
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [unlimitedTime, setUnlimitedTime] = useState(false);
  const [gameMode, setGameMode] = useState('sequential'); // sequential, random
  const [repeatMode, setRepeatMode] = useState('noRepeat'); // noRepeat, allowRepeat
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Cargar categorías al montar
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await loadCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Error cargando categorías:', err);
        setError('Error al cargar categorías');
      }
    };
    fetchCategories();
  }, []);

  // Cargar preguntas cuando se selecciona una categoría
  useEffect(() => {
    if (!selectedCategory) {
      setQuestions([]);
      return;
    }

    const fetchQuestions = async () => {
      setLoadingQuestions(true);
      try {
        const qs = await loadQuestionsByCategory(selectedCategory);
        setQuestions(qs);
      } catch (err) {
        console.error('Error cargando preguntas:', err);
        setError('Error al cargar preguntas');
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [selectedCategory]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!selectedCategory) {
      setError('Selecciona una categoría');
      return;
    }

    if (questions.length === 0) {
      setError('Esta categoría no tiene preguntas');
      return;
    }

    const studentsArray = studentNames
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (studentsArray.length === 0) {
      setError('Ingresa al menos un estudiante');
      return;
    }

    if (studentsArray.length < 2) {
      setError('Se requieren al menos 2 estudiantes para jugar');
      return;
    }

    setLoading(true);

    try {
      const gameData = {
        category: selectedCategory,
        questions,
        students: studentsArray,
        timePerQuestion: unlimitedTime ? 0 : timePerQuestion,
        unlimitedTime,
        gameMode,
        repeatMode,
        teacherId: user.uid,
        teacherEmail: user.email
      };

      const { sessionId, joinCode } = await createGameSession(gameData);
      console.log('Sesión creada:', sessionId, 'Código:', joinCode);
      onSessionCreated(sessionId);
    } catch (err) {
      console.error('Error creando sesión:', err);
      setError(err.message || 'Error al crear la sesión');
      setLoading(false);
    }
  };

  return (
    <div className="live-game-setup">
      <div className="setup-header">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={20} />
          Volver
        </button>
        <h1>Crear Juego en Vivo</h1>
        <p className="setup-subtitle">
          Configura un juego interactivo para tu clase
        </p>
      </div>

      <form onSubmit={handleCreateSession} className="setup-form">
        {/* Selección de categoría */}
        <div className="form-section">
          <h3 className="section-title">
            <Play size={20} />
            Categoría del Juego
          </h3>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-select"
            required
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          {loadingQuestions && (
            <p className="loading-text">Cargando preguntas...</p>
          )}

          {selectedCategory && !loadingQuestions && (
            <div className="questions-info">
              <p>
                <strong>{questions.length}</strong> preguntas disponibles
              </p>
            </div>
          )}
        </div>

        {/* Lista de estudiantes */}
        <div className="form-section">
          <h3 className="section-title">
            <Users size={20} />
            Estudiantes
          </h3>
          <textarea
            value={studentNames}
            onChange={(e) => setStudentNames(e.target.value)}
            placeholder="Escribe un nombre por línea:&#10;Juan Pérez&#10;María González&#10;Pedro Martínez"
            className="form-textarea"
            rows={8}
            required
          />
          <p className="input-hint">
            {studentNames.split('\n').filter(n => n.trim()).length} estudiantes
          </p>
        </div>

        {/* Configuración de tiempo */}
        <div className="form-section">
          <h3 className="section-title">
            <Timer size={20} />
            Tiempo por Pregunta
          </h3>
          <div className="checkbox-option">
            <input
              type="checkbox"
              id="unlimitedTime"
              checked={unlimitedTime}
              onChange={(e) => setUnlimitedTime(e.target.checked)}
            />
            <label htmlFor="unlimitedTime">Tiempo ilimitado</label>
          </div>

          {!unlimitedTime && (
            <div className="time-input">
              <input
                type="number"
                value={timePerQuestion}
                onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
                min={10}
                max={300}
                step={5}
                className="form-input"
              />
              <span>segundos</span>
            </div>
          )}
        </div>

        {/* Modo de juego */}
        <div className="form-section">
          <h3 className="section-title">
            <Shuffle size={20} />
            Modo de Juego
          </h3>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                name="gameMode"
                value="sequential"
                checked={gameMode === 'sequential'}
                onChange={(e) => setGameMode(e.target.value)}
              />
              <div className="radio-content">
                <strong>Secuencial</strong>
                <span>Los estudiantes responden en orden</span>
              </div>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="gameMode"
                value="random"
                checked={gameMode === 'random'}
                onChange={(e) => setGameMode(e.target.value)}
              />
              <div className="radio-content">
                <strong>Aleatorio</strong>
                <span>El orden se mezcla cada turno</span>
              </div>
            </label>
          </div>
        </div>

        {/* Modo de repetición */}
        <div className="form-section">
          <h3 className="section-title">
            <RotateCcw size={20} />
            Preguntas
          </h3>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                name="repeatMode"
                value="noRepeat"
                checked={repeatMode === 'noRepeat'}
                onChange={(e) => setRepeatMode(e.target.value)}
              />
              <div className="radio-content">
                <strong>Sin repetir</strong>
                <span>Cada pregunta se muestra una sola vez</span>
              </div>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="repeatMode"
                value="allowRepeat"
                checked={repeatMode === 'allowRepeat'}
                onChange={(e) => setRepeatMode(e.target.value)}
              />
              <div className="radio-content">
                <strong>Permitir repetir</strong>
                <span>Las preguntas pueden repetirse</span>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        <button
          type="submit"
          className="btn-create-session"
          disabled={loading || !selectedCategory || questions.length === 0}
        >
          {loading ? (
            <>
              <div className="spinner-small"></div>
              Creando sesión...
            </>
          ) : (
            <>
              <Play size={20} />
              Crear Sesión
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default LiveGameSetup;
