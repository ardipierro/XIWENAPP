/**
 * @fileoverview Ejercicio de comprensión auditiva
 * @module components/interactive-book/ListeningComprehensionExercise
 */

import { useState } from 'react';
import { Volume2, Check, X } from 'lucide-react';
import { BaseButton, BaseBadge, BaseCard } from '../common';
import AudioPlayer from './AudioPlayer';
import PropTypes from 'prop-types';

/**
 * Ejercicio de comprensión de audio con preguntas
 */
function ListeningComprehensionExercise({ exercise, onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isChecked, setIsChecked] = useState(false);
  const [results, setResults] = useState({});

  const question = exercise.questions[currentQuestion];

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const checkAnswers = () => {
    const newResults = {};
    let correctCount = 0;

    exercise.questions.forEach(q => {
      let isCorrect = false;

      if (q.type === 'multiple_choice') {
        isCorrect = answers[q.id] === q.options.find(opt => opt.isCorrect)?.id;
      } else if (q.type === 'fill_in_blank') {
        const userAnswer = (answers[q.id] || '').trim().toLowerCase();
        isCorrect = q.correctAnswers.some(ans => ans.toLowerCase() === userAnswer);
      }

      newResults[q.id] = isCorrect;
      if (isCorrect) correctCount++;
    });

    setResults(newResults);
    setIsChecked(true);

    const totalQuestions = exercise.questions.length;
    const percentage = (correctCount / totalQuestions) * 100;
    const points = Math.round((exercise.points || 40) * (correctCount / totalQuestions));

    if (onComplete) {
      onComplete({
        correct: correctCount === totalQuestions,
        correctCount,
        totalQuestions,
        percentage,
        points
      });
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < exercise.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const reset = () => {
    setAnswers({});
    setResults({});
    setIsChecked(false);
    setCurrentQuestion(0);
  };

  return (
    <BaseCard
      title={exercise.title}
      subtitle={exercise.instructions}
      badges={[
        <BaseBadge key="points" variant="info">
          {exercise.points} pts
        </BaseBadge>
      ]}
    >
      {/* Audio Player */}
      {exercise.audioUrl && (
        <div className="mb-4">
          <AudioPlayer
            audioUrl={exercise.audioUrl}
            showText={false}
          />
        </div>
      )}

      {/* Pregunta actual */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Pregunta {currentQuestion + 1} de {exercise.questions.length}
          </h4>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {question.points} pts
          </span>
        </div>

        <p className="text-sm text-gray-900 dark:text-white mb-3">
          {question.question}
        </p>

        {/* Multiple Choice */}
        {question.type === 'multiple_choice' && (
          <div className="space-y-2">
            {question.options.map(option => {
              const isSelected = answers[question.id] === option.id;
              const isCorrect = results[question.id];

              return (
                <button
                  key={option.id}
                  onClick={() => !isChecked && handleAnswer(question.id, option.id)}
                  disabled={isChecked}
                  className={`w-full text-left p-3 border-2 rounded-lg transition-all ${
                    isChecked
                      ? option.isCorrect
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : isSelected
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600 opacity-50'
                      : isSelected
                      ? 'border-gray-400 bg-gray-50 dark:bg-gray-800/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isChecked && option.isCorrect ? 'border-green-600 bg-green-600' :
                      isChecked && isSelected ? 'border-red-600 bg-red-600' :
                      isSelected ? 'border-gray-500 bg-blue-600' : 'border-gray-400'
                    }`}>
                      {isChecked && option.isCorrect && <Check size={14} className="text-white" />}
                      {isChecked && isSelected && !option.isCorrect && <X size={14} className="text-white" />}
                    </div>
                    <span className="text-sm">{option.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Fill in Blank */}
        {question.type === 'fill_in_blank' && (
          <div>
            <input
              type="text"
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              disabled={isChecked}
              placeholder="Tu respuesta..."
              className={`w-full px-4 py-2 border-2 rounded-lg outline-none ${
                isChecked
                  ? results[question.id]
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-300 dark:border-gray-600 focus:border-gray-400'
              }`}
            />
            {isChecked && !results[question.id] && (
              <p className="mt-2 text-xs text-red-700 dark:text-red-400">
                Respuesta correcta: {question.correctAnswers[0]}
              </p>
            )}
          </div>
        )}

        {/* Nota rioplatense */}
        {question.rioplatenseNote && isChecked && (
          <div className="mt-3 text-xs p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded">
            🇦🇷 {question.rioplatenseNote}
          </div>
        )}
      </div>

      {/* Navegación entre preguntas */}
      <div className="flex gap-2 mb-4">
        <BaseButton
          size="sm"
          variant="ghost"
          onClick={prevQuestion}
          disabled={currentQuestion === 0}
        >
          ← Anterior
        </BaseButton>
        <BaseButton
          size="sm"
          variant="ghost"
          onClick={nextQuestion}
          disabled={currentQuestion === exercise.questions.length - 1}
        >
          Siguiente →
        </BaseButton>
      </div>

      {/* Botones principales */}
      <div className="flex gap-2">
        {!isChecked ? (
          <BaseButton
            variant="primary"
            onClick={checkAnswers}
            disabled={Object.keys(answers).length < exercise.questions.length}
          >
            Verificar Todas
          </BaseButton>
        ) : (
          <BaseButton variant="ghost" onClick={reset}>
            Reintentar
          </BaseButton>
        )}
      </div>

      {/* Puntos */}
      {isChecked && (
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Resultado: {Object.values(results).filter(r => r).length} / {exercise.questions.length} correctas
        </div>
      )}
    </BaseCard>
  );
}

ListeningComprehensionExercise.propTypes = {
  exercise: PropTypes.shape({
    title: PropTypes.string.isRequired,
    instructions: PropTypes.string.isRequired,
    audioUrl: PropTypes.string,
    points: PropTypes.number,
    questions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        question: PropTypes.string.isRequired,
        type: PropTypes.oneOf(['multiple_choice', 'fill_in_blank']).isRequired,
        options: PropTypes.array,
        correctAnswers: PropTypes.array,
        points: PropTypes.number
      })
    ).isRequired
  }).isRequired,
  onComplete: PropTypes.func
};

export default ListeningComprehensionExercise;
