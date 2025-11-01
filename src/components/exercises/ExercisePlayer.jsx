import { useState, useEffect } from 'react';
import { AlertTriangle, PartyPopper, Smile, Zap, Check, X, RotateCcw } from 'lucide-react';
import { getExerciseById } from '../../firebase/exercises';
import MultipleChoiceExercise from './types/MultipleChoiceExercise';
import './ExercisePlayer.css';

function ExercisePlayer({ exerciseId, user, onBack, onComplete }) {
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    loadExercise();
  }, [exerciseId]);

  const loadExercise = async () => {
    try {
      setLoading(true);
      const data = await getExerciseById(exerciseId);

      if (!data) {
        setError('Ejercicio no encontrado');
        return;
      }

      if (!data.questions || data.questions.length === 0) {
        setError('Este ejercicio no tiene preguntas. Por favor, edita el ejercicio y agrega preguntas.');
        return;
      }

      setExercise(data);
      setError(null);
    } catch (err) {
      console.error('Error cargando ejercicio:', err);
      setError('Error al cargar el ejercicio');
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseComplete = (exerciseResults) => {
    setResults(exerciseResults);
    setShowResults(true);

    // Aquí podrías guardar los resultados en Firebase
    // saveExerciseResults(exerciseId, user.uid, exerciseResults);

    if (onComplete) {
      onComplete(exerciseResults);
    }
  };

  const handleRetry = () => {
    setShowResults(false);
    setResults(null);
    loadExercise(); // Recargar para mezclar preguntas
  };

  const handleExit = () => {
    if (onBack) {
      onBack();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="exercise-player">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Cargando ejercicio...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="exercise-player">
        <div className="error-container">
          <div className="error-icon">
            <AlertTriangle size={48} strokeWidth={2} className="text-red-500" />
          </div>
          <h2 className="error-title">Error</h2>
          <p className="error-message">{error}</p>
          <button className="btn btn-primary" onClick={handleExit}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Results screen
  if (showResults && results) {
    return (
      <div className="exercise-player">
        <div className="results-container">
          <div className="results-header">
            <div className="results-icon">
              {results.percentage >= 70 ? (
                <PartyPopper size={48} strokeWidth={2} className="text-yellow-500" />
              ) : results.percentage >= 50 ? (
                <Smile size={48} strokeWidth={2} className="text-green-500" />
              ) : (
                <Zap size={48} strokeWidth={2} className="text-blue-500" />
              )}
            </div>
            <h2 className="results-title">¡Ejercicio Completado!</h2>
            <p className="results-subtitle">{exercise.title}</p>
          </div>

          <div className="results-stats">
            <div className="stat-card primary">
              <div className="stat-value">{results.percentage}%</div>
              <div className="stat-label">Puntaje</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{results.score}/{results.totalQuestions}</div>
              <div className="stat-label">Correctas</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{results.totalTime}s</div>
              <div className="stat-label">Tiempo Total</div>
            </div>
          </div>

          <div className="results-feedback">
            {results.percentage >= 70 ? (
              <p className="feedback-text success">
                ¡Excelente trabajo! Has demostrado un gran dominio del tema.
              </p>
            ) : results.percentage >= 50 ? (
              <p className="feedback-text good">
                ¡Bien hecho! Sigue practicando para mejorar aún más.
              </p>
            ) : (
              <p className="feedback-text improve">
                Sigue esforzándote. La práctica te ayudará a mejorar.
              </p>
            )}
          </div>

          {/* Detalle de respuestas */}
          <div className="answers-review">
            <h3 className="review-title">Revisión de Respuestas</h3>
            <div className="answers-list">
              {results.answers.map((answer, index) => (
                <div key={index} className={`answer-item ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="answer-header">
                    <span className="answer-number">Pregunta {index + 1}</span>
                    <span className={`answer-badge ${answer.isCorrect ? 'badge-success' : 'badge-error'}`}>
                      {answer.isCorrect ? (
                        <><Check size={16} strokeWidth={2} className="inline-icon" /> Correcta</>
                      ) : (
                        <><X size={16} strokeWidth={2} className="inline-icon" /> Incorrecta</>
                      )}
                    </span>
                  </div>
                  <p className="answer-question">{answer.question}</p>
                  {!answer.isCorrect && exercise.questions[answer.questionIndex] && (
                    <p className="answer-correct-text">
                      Respuesta correcta: {exercise.questions[answer.questionIndex].options[answer.correctAnswer]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="results-actions">
            <button className="btn btn-outline" onClick={handleRetry}>
              <RotateCcw size={18} strokeWidth={2} className="inline-icon" /> Intentar de Nuevo
            </button>
            <button className="btn btn-primary" onClick={handleExit}>
              ← Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Exercise player
  const renderExercise = () => {
    switch (exercise.type) {
      case 'multiple_choice':
        return (
          <MultipleChoiceExercise
            questions={exercise.questions}
            onComplete={handleExerciseComplete}
            studentName={user?.displayName || user?.name || 'Estudiante'}
          />
        );

      case 'true_false':
        return (
          <div className="coming-soon">
            <h3>Verdadero/Falso</h3>
            <p>Este tipo de ejercicio estará disponible próximamente.</p>
            <button className="btn btn-primary" onClick={handleExit}>
              Volver
            </button>
          </div>
        );

      case 'fill_blank':
        return (
          <div className="coming-soon">
            <h3>Completar Espacios</h3>
            <p>Este tipo de ejercicio estará disponible próximamente.</p>
            <button className="btn btn-primary" onClick={handleExit}>
              Volver
            </button>
          </div>
        );

      default:
        return (
          <div className="coming-soon">
            <h3>Tipo de ejercicio: {exercise.type}</h3>
            <p>Este tipo de ejercicio aún no está implementado.</p>
            <button className="btn btn-primary" onClick={handleExit}>
              Volver
            </button>
          </div>
        );
    }
  };

  return (
    <div className="exercise-player">
      <div className="exercise-info-bar">
        <button className="btn-back" onClick={handleExit}>
          ← Salir
        </button>
        <div className="exercise-title-bar">
          <h1 className="exercise-title">{exercise.title}</h1>
          {exercise.category && (
            <span className="exercise-category">{exercise.category}</span>
          )}
        </div>
      </div>

      {renderExercise()}
    </div>
  );
}

export default ExercisePlayer;
