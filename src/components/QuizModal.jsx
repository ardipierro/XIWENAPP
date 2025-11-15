/**
 * @fileoverview Quiz Modal - Modal para realizar quizzes de FlashCards
 * @module components/QuizModal
 */

import { useState, useEffect } from 'react';
import { Trophy, CheckCircle, XCircle, ArrowRight, RotateCw } from 'lucide-react';
import { BaseButton, BaseModal, BaseLoading, BaseAlert, BaseBadge, BaseInput } from './common';
import { getFlashCardCollectionById } from '../firebase/flashcards';
import {
  generateMultipleChoiceQuiz,
  generateTypeAnswerQuiz,
  calculateQuizScore,
  saveQuizResult,
  QUIZ_TYPES
} from '../services/flashcardQuizService';
import logger from '../utils/logger';

/**
 * Quiz Modal
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {string} props.collectionId - ID de la colección
 * @param {Object} props.user - Usuario actual
 */
export function QuizModal({ isOpen, onClose, collectionId, user }) {
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState(null);
  const [quizType, setQuizType] = useState(null); // null | 'multiple_choice' | 'type_answer'
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [quizResults, setQuizResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && collectionId) {
      loadCollection();
    }
  }, [isOpen, collectionId]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      const data = await getFlashCardCollectionById(collectionId);
      setCollection(data);
      logger.info('Collection loaded for quiz:', data);
    } catch (err) {
      logger.error('Error loading collection:', err);
      setError('Error al cargar colección');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (type) => {
    if (!collection || !collection.cards || collection.cards.length < 4) {
      setError('Se necesitan al menos 4 tarjetas para hacer un quiz');
      return;
    }

    setQuizType(type);
    const count = Math.min(10, collection.cards.length);

    let generatedQuestions;
    if (type === QUIZ_TYPES.MULTIPLE_CHOICE) {
      generatedQuestions = generateMultipleChoiceQuiz(collection.cards, count);
    } else {
      generatedQuestions = generateTypeAnswerQuiz(collection.cards, count);
    }

    setQuestions(generatedQuestions);
    setAnswers(new Array(generatedQuestions.length).fill(null));
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setTypedAnswer('');
    setError(null);
    logger.info(`Quiz started: ${type}, ${generatedQuestions.length} questions`);
  };

  const handleAnswer = () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = quizType === QUIZ_TYPES.MULTIPLE_CHOICE
      ? selectedAnswer
      : typedAnswer;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setTypedAnswer('');
    } else {
      finishQuiz(newAnswers);
    }
  };

  const finishQuiz = async (finalAnswers) => {
    const results = calculateQuizScore(questions, finalAnswers);
    setQuizResults(results);

    // Guardar resultados en Firestore
    if (user) {
      await saveQuizResult(user.uid, collectionId, results);
    }

    logger.info('Quiz finished:', results);
  };

  const restartQuiz = () => {
    setQuizType(null);
    setQuestions([]);
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setTypedAnswer('');
    setQuizResults(null);
    setError(null);
  };

  const handleClose = () => {
    restartQuiz();
    onClose();
  };

  if (loading) {
    return (
      <BaseModal isOpen={isOpen} onClose={handleClose} title="Quiz" size="large">
        <BaseLoading text="Cargando quiz..." />
      </BaseModal>
    );
  }

  // Vista de selección de tipo de quiz
  if (!quizType) {
    return (
      <BaseModal isOpen={isOpen} onClose={handleClose} title="Iniciar Quiz" size="medium">
        <div className="quiz-modal-start">
          <div className="quiz-modal-start__icon">
            <Trophy size={64} style={{ color: '#f59e0b' }} />
          </div>
          <h2 className="quiz-modal-start__title">{collection?.name}</h2>
          <p className="quiz-modal-start__description">
            Pon a prueba tus conocimientos con un quiz de {Math.min(10, collection?.cards?.length || 0)} preguntas
          </p>

          {error && (
            <BaseAlert variant="error">{error}</BaseAlert>
          )}

          <div className="quiz-modal-start__buttons">
            <button
              className="quiz-type-button"
              onClick={() => startQuiz(QUIZ_TYPES.MULTIPLE_CHOICE)}
            >
              <div className="quiz-type-button__icon">📝</div>
              <div className="quiz-type-button__content">
                <h3>Opción Múltiple</h3>
                <p>Selecciona la traducción correcta entre 4 opciones</p>
              </div>
            </button>

            <button
              className="quiz-type-button"
              onClick={() => startQuiz(QUIZ_TYPES.TYPE_ANSWER)}
            >
              <div className="quiz-type-button__icon">⌨️</div>
              <div className="quiz-type-button__content">
                <h3>Escribir Respuesta</h3>
                <p>Escribe la traducción correcta</p>
              </div>
            </button>
          </div>
        </div>

        <style>{`
          .quiz-modal-start {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            padding: 1rem;
          }

          .quiz-modal-start__icon {
            display: flex;
            justify-content: center;
          }

          .quiz-modal-start__title {
            text-align: center;
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--color-text-primary);
            margin: 0;
          }

          .quiz-modal-start__description {
            text-align: center;
            color: var(--color-text-secondary);
            margin: 0;
          }

          .quiz-modal-start__buttons {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 1rem;
          }

          .quiz-type-button {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.5rem;
            background: var(--color-bg-primary);
            border: 2px solid var(--color-border);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .quiz-type-button:hover {
            border-color: var(--color-primary);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .quiz-type-button__icon {
            font-size: 2.5rem;
          }

          .quiz-type-button__content {
            flex: 1;
            text-align: left;
          }

          .quiz-type-button__content h3 {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--color-text-primary);
            margin: 0 0 0.25rem 0;
          }

          .quiz-type-button__content p {
            font-size: 0.875rem;
            color: var(--color-text-secondary);
            margin: 0;
          }

          .dark .quiz-modal-start__title,
          .dark .quiz-type-button__content h3 {
            color: var(--dark-text-primary);
          }

          .dark .quiz-modal-start__description,
          .dark .quiz-type-button__content p {
            color: var(--dark-text-secondary);
          }

          .dark .quiz-type-button {
            background: var(--dark-bg-primary);
            border-color: var(--dark-border);
          }
        `}</style>
      </BaseModal>
    );
  }

  // Vista de resultados
  if (quizResults) {
    return (
      <BaseModal isOpen={isOpen} onClose={handleClose} title="Resultados del Quiz" size="medium">
        <div className="quiz-results">
          <div className="quiz-results__score">
            <div className={`quiz-results__percentage ${quizResults.passed ? 'quiz-results__percentage--passed' : 'quiz-results__percentage--failed'}`}>
              {quizResults.percentage}%
            </div>
            <p className="quiz-results__status">
              {quizResults.passed ? '¡Aprobado! 🎉' : 'Necesitas practicar más 💪'}
            </p>
          </div>

          <div className="quiz-results__stats">
            <div className="quiz-results__stat">
              <CheckCircle size={24} style={{ color: '#22c55e' }} />
              <div>
                <div className="quiz-results__stat-value">{quizResults.correct}</div>
                <div className="quiz-results__stat-label">Correctas</div>
              </div>
            </div>

            <div className="quiz-results__stat">
              <XCircle size={24} style={{ color: '#ef4444' }} />
              <div>
                <div className="quiz-results__stat-value">{quizResults.incorrect}</div>
                <div className="quiz-results__stat-label">Incorrectas</div>
              </div>
            </div>

            <div className="quiz-results__stat">
              <Trophy size={24} style={{ color: '#f59e0b' }} />
              <div>
                <div className="quiz-results__stat-value">{quizResults.total}</div>
                <div className="quiz-results__stat-label">Total</div>
              </div>
            </div>
          </div>

          <div className="quiz-results__actions">
            <BaseButton variant="outline" icon={RotateCw} onClick={restartQuiz}>
              Reintentar
            </BaseButton>
            <BaseButton variant="primary" onClick={handleClose}>
              Finalizar
            </BaseButton>
          </div>
        </div>

        <style>{`
          .quiz-results {
            display: flex;
            flex-direction: column;
            gap: 2rem;
            padding: 1rem;
          }

          .quiz-results__score {
            text-align: center;
          }

          .quiz-results__percentage {
            font-size: 4rem;
            font-weight: 700;
            line-height: 1;
            margin-bottom: 1rem;
          }

          .quiz-results__percentage--passed {
            color: #22c55e;
          }

          .quiz-results__percentage--failed {
            color: #ef4444;
          }

          .quiz-results__status {
            font-size: 1.25rem;
            font-weight: 500;
            color: var(--color-text-secondary);
            margin: 0;
          }

          .quiz-results__stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
          }

          .quiz-results__stat {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            padding: 1rem;
            background: var(--color-bg-secondary);
            border-radius: 8px;
          }

          .quiz-results__stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--color-text-primary);
          }

          .quiz-results__stat-label {
            font-size: 0.875rem;
            color: var(--color-text-secondary);
          }

          .quiz-results__actions {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
          }

          .dark .quiz-results__status {
            color: var(--dark-text-secondary);
          }

          .dark .quiz-results__stat {
            background: var(--dark-bg-secondary);
          }

          .dark .quiz-results__stat-value {
            color: var(--dark-text-primary);
          }

          .dark .quiz-results__stat-label {
            color: var(--dark-text-secondary);
          }
        `}</style>
      </BaseModal>
    );
  }

  // Vista de preguntas
  const question = questions[currentQuestion];
  const canAnswer = quizType === QUIZ_TYPES.MULTIPLE_CHOICE
    ? selectedAnswer !== null
    : typedAnswer.trim().length > 0;

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={`Pregunta ${currentQuestion + 1}/${questions.length}`} size="large">
      <div className="quiz-question">
        <div className="quiz-question__progress">
          <div className="quiz-question__progress-bar">
            <div
              className="quiz-question__progress-fill"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="quiz-question__content">
          {question.imageUrl && (
            <div className="quiz-question__image">
              <img src={question.imageUrl} alt="Question" />
            </div>
          )}

          <h2 className="quiz-question__text">{question.question}</h2>

          {quizType === QUIZ_TYPES.MULTIPLE_CHOICE ? (
            <div className="quiz-question__options">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  className={`quiz-option ${selectedAnswer === option ? 'quiz-option--selected' : ''}`}
                  onClick={() => setSelectedAnswer(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div className="quiz-question__input">
              <BaseInput
                type="text"
                placeholder="Escribe tu respuesta..."
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && canAnswer) {
                    handleAnswer();
                  }
                }}
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="quiz-question__actions">
          <BaseButton
            variant="primary"
            icon={ArrowRight}
            onClick={handleAnswer}
            disabled={!canAnswer}
          >
            {currentQuestion < questions.length - 1 ? 'Siguiente' : 'Finalizar'}
          </BaseButton>
        </div>
      </div>

      <style>{`
        .quiz-question {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 1rem;
        }

        .quiz-question__progress {
          width: 100%;
        }

        .quiz-question__progress-bar {
          height: 8px;
          background: var(--color-bg-secondary);
          border-radius: 4px;
          overflow: hidden;
        }

        .quiz-question__progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          transition: width 0.3s ease;
        }

        .quiz-question__content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          align-items: center;
        }

        .quiz-question__image {
          width: 100%;
          max-width: 400px;
          border-radius: 12px;
          overflow: hidden;
        }

        .quiz-question__image img {
          width: 100%;
          height: auto;
          display: block;
        }

        .quiz-question__text {
          font-size: 1.75rem;
          font-weight: 600;
          color: var(--color-text-primary);
          text-align: center;
          margin: 0;
        }

        .quiz-question__options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          width: 100%;
          max-width: 600px;
        }

        .quiz-option {
          padding: 1.5rem;
          background: var(--color-bg-primary);
          border: 2px solid var(--color-border);
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 500;
          color: var(--color-text-primary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quiz-option:hover {
          border-color: var(--color-primary);
          transform: translateY(-2px);
        }

        .quiz-option--selected {
          border-color: var(--color-primary);
          background: var(--color-primary-light);
        }

        .quiz-question__input {
          width: 100%;
          max-width: 500px;
        }

        .quiz-question__actions {
          display: flex;
          justify-content: center;
          padding-top: 1rem;
        }

        .dark .quiz-question__progress-bar {
          background: var(--dark-bg-secondary);
        }

        .dark .quiz-question__text,
        .dark .quiz-option {
          color: var(--dark-text-primary);
        }

        .dark .quiz-option {
          background: var(--dark-bg-primary);
          border-color: var(--dark-border);
        }
      `}</style>
    </BaseModal>
  );
}

export default QuizModal;
