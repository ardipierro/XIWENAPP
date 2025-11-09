import logger from '../utils/logger';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGameSessionByCode } from '../firebase/gameSession';
import LiveGameStudent from './LiveGameStudent';
import { BaseButton } from './common';
import './JoinGamePage.css';

/**
 * Página pública para que estudiantes se unan a juegos
 * Accesible en /join
 */
function JoinGamePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('enter-code'); // enter-code, enter-name, playing
  const [joinCode, setJoinCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinCode = async (e) => {
    e.preventDefault();

    if (joinCode.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const session = await getGameSessionByCode(joinCode);

      if (!session) {
        setError('Código inválido o sesión no encontrada');
        setLoading(false);
        return;
      }

      if (session.status === 'finished') {
        setError('Esta sesión ya ha terminado');
        setLoading(false);
        return;
      }

      setSessionData(session);
      setStep('enter-name');
      setLoading(false);
    } catch (err) {
      logger.error('Error buscando sesión:', err);
      setError('Error al buscar la sesión');
      setLoading(false);
    }
  };

  const handleEnterName = (e) => {
    e.preventDefault();

    if (!studentName.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }

    // Verificar que el nombre esté en la lista de estudiantes
    if (!sessionData.students.includes(studentName.trim())) {
      setError('Tu nombre no está en la lista de participantes. Verifica que sea exactamente como lo escribió el profesor.');
      return;
    }

    setStep('playing');
  };

  const handleExit = () => {
    setStep('enter-code');
    setJoinCode('');
    setStudentName('');
    setSessionData(null);
    setError('');
  };

  if (step === 'playing' && sessionData) {
    return (
      <LiveGameStudent
        sessionId={sessionData.sessionId}
        studentName={studentName.trim()}
        onExit={handleExit}
      />
    );
  }

  return (
    <div className="join-game-page">
      <div className="join-container">
        {/* Logo/Header */}
        <div className="join-header">
          <h1 className="join-title">XIWEN</h1>
          <p className="join-subtitle">Juego Interactivo</p>
        </div>

        {step === 'enter-code' ? (
          <div className="join-card">
            <h2 className="card-title">Unirse al Juego</h2>
            <p className="card-description">
              Ingresa el código de 6 dígitos que te dio tu profesor
            </p>

            <form onSubmit={handleJoinCode} className="join-form">
              <div className="input-group">
                <label htmlFor="joinCode" className="input-label">
                  Código del Juego
                </label>
                <input
                  id="joinCode"
                  type="text"
                  value={joinCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setJoinCode(value);
                    setError('');
                  }}
                  placeholder="123456"
                  className="code-input"
                  maxLength={6}
                  autoComplete="off"
                  autoFocus
                />
                <div className="code-dots">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`code-dot ${joinCode.length > i ? 'filled' : ''}`}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="error-box">{error}</div>
              )}

              <BaseButton
                type="submit"
                disabled={joinCode.length !== 6 || loading}
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
              >
                Continuar
              </BaseButton>
            </form>
          </div>
        ) : (
          <div className="join-card">
            <div className="success-check">✓</div>
            <h2 className="card-title">Sesión Encontrada</h2>
            <p className="card-description">
              Categoría: <strong>{sessionData.category}</strong>
            </p>

            <form onSubmit={handleEnterName} className="join-form">
              <div className="input-group">
                <label htmlFor="studentName" className="input-label">
                  Tu Nombre
                </label>
                <input
                  id="studentName"
                  type="text"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    setError('');
                  }}
                  placeholder="Ingresa tu nombre"
                  className="name-input"
                  autoComplete="off"
                  autoFocus
                />
                <p className="input-hint">
                  Debe ser exactamente como lo escribió el profesor
                </p>
              </div>

              <div className="students-list">
                <p className="list-title">Participantes ({sessionData.students.length}):</p>
                <div className="students-chips">
                  {sessionData.students.map((student, index) => (
                    <span key={index} className="student-chip">
                      {student}
                    </span>
                  ))}
                </div>
              </div>

              {error && (
                <div className="error-box">{error}</div>
              )}

              <div className="form-actions">
                <BaseButton
                  type="button"
                  onClick={() => {
                    setStep('enter-code');
                    setSessionData(null);
                    setStudentName('');
                    setError('');
                  }}
                  variant="ghost"
                  size="lg"
                >
                  Volver
                </BaseButton>
                <BaseButton
                  type="submit"
                  disabled={!studentName.trim()}
                  variant="primary"
                  size="lg"
                >
                  Unirse
                </BaseButton>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="join-footer">
          <p>¿No tienes un código? Pídele uno a tu profesor</p>
        </div>
      </div>
    </div>
  );
}

export default JoinGamePage;
