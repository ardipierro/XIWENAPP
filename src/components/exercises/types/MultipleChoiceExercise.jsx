import { useState, useEffect } from 'react';
import { Check, X, PartyPopper, Frown } from 'lucide-react';
import BaseButton from '../../common/BaseButton';
import './MultipleChoiceExercise.css';

function MultipleChoiceExercise({ questions, onComplete, studentName }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const handleSelectAnswer = (answerIndex) => {
    if (isAnswered) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);

    // Guardar respuesta
    const answerRecord = {
      questionIndex: currentQuestionIndex,
      question: currentQuestion.question,
      selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      timeSpent
    };

    setAnswers([...answers, answerRecord]);

    if (isCorrect) {
      setScore(score + 1);
    }

    setIsAnswered(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      // Ejercicio completado
      const totalTime = Math.round((Date.now() - startTime) / 1000);
      const results = {
        studentName,
        score,
        totalQuestions,
        percentage: Math.round((score / totalQuestions) * 100),
        answers: [...answers, {
          questionIndex: currentQuestionIndex,
          question: currentQuestion.question,
          selectedAnswer,
          correctAnswer: currentQuestion.correctAnswer,
          isCorrect: selectedAnswer === currentQuestion.correctAnswer,
          timeSpent: Math.round((Date.now() - questionStartTime) / 1000)
        }],
        totalTime,
        completedAt: new Date().toISOString()
      };
      onComplete(results);
    }
  };

  const getOptionClass = (optionIndex) => {
    if (!isAnswered) {
      return selectedAnswer === optionIndex ? 'option selected' : 'option';
    }

    // Ya respondió
    if (optionIndex === currentQuestion.correctAnswer) {
      return 'option correct';
    }

    if (selectedAnswer === optionIndex && selectedAnswer !== currentQuestion.correctAnswer) {
      return 'option incorrect';
    }

    return 'option disabled';
  };

  return (
    <div className="multiple-choice-exercise">
      {/* Header con progreso */}
      <div className="exercise-header">
        <div className="progress-info">
          <span className="question-counter">
            Pregunta {currentQuestionIndex + 1} de {totalQuestions}
          </span>
          <span className="score-display">
            Puntaje: {score}/{totalQuestions}
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Pregunta */}
      <div className="question-container">
        <h2 className="question-text">{currentQuestion.question}</h2>

        {/* Opciones */}
        <div className="options-grid">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={getOptionClass(index)}
              onClick={() => handleSelectAnswer(index)}
              disabled={isAnswered}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="option-text">{option}</span>
              {isAnswered && index === currentQuestion.correctAnswer && (
                <span className="check-icon">
                  <Check size={20} strokeWidth={2} />
                </span>
              )}
              {isAnswered && selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                <span className="cross-icon">
                  <X size={20} strokeWidth={2} />
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {isAnswered && (
          <div className={`feedback ${selectedAnswer === currentQuestion.correctAnswer ? 'correct' : 'incorrect'}`}>
            {selectedAnswer === currentQuestion.correctAnswer ? (
              <div className="feedback-content">
                <span className="feedback-icon">
                  <PartyPopper size={24} strokeWidth={2} />
                </span>
                <span className="feedback-text">¡Correcto! Bien hecho.</span>
              </div>
            ) : (
              <div className="feedback-content">
                <span className="feedback-icon">
                  <Frown size={24} strokeWidth={2} />
                </span>
                <span className="feedback-text">
                  Incorrecto. La respuesta correcta era: {currentQuestion.options[currentQuestion.correctAnswer]}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="action-buttons">
          {!isAnswered ? (
            <BaseButton
              variant="primary"
              size="lg"
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              fullWidth
            >
              Verificar Respuesta
            </BaseButton>
          ) : (
            <BaseButton
              variant="primary"
              size="lg"
              onClick={handleNextQuestion}
              fullWidth
            >
              {currentQuestionIndex < totalQuestions - 1 ? 'Siguiente Pregunta →' : 'Ver Resultados'}
            </BaseButton>
          )}
        </div>
      </div>
    </div>
  );
}

export default MultipleChoiceExercise;
