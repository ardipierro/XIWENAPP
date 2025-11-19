/**
 * @fileoverview Ejercicio de conjugación de verbos
 * @module components/interactive-book/ConjugationExercise
 */

import { useState } from 'react';
import { Check, X, Lightbulb } from 'lucide-react';
import { BaseButton, BaseBadge, BaseCard } from '../common';
import PropTypes from 'prop-types';

/**
 * Ejercicio de conjugación (fill in blank con verbos)
 */
function ConjugationExercise({ exercise, onComplete }) {
  const [answers, setAnswers] = useState({});
  const [isChecked, setIsChecked] = useState(false);
  const [results, setResults] = useState({});
  const [showHints, setShowHints] = useState({});

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const checkAnswers = () => {
    const newResults = {};
    let correctCount = 0;

    exercise.questions.forEach(question => {
      const userAnswer = (answers[question.id] || '').trim().toLowerCase();
      const isCorrect = question.correctAnswers.some(
        ans => ans.toLowerCase() === userAnswer
      );
      newResults[question.id] = isCorrect;
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

  const reset = () => {
    setAnswers({});
    setResults({});
    setIsChecked(false);
    setShowHints({});
  };

  const toggleHint = (questionId) => {
    setShowHints(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const allAnswered = exercise.questions.every(q => answers[q.id]?.trim());

  return (
    <BaseCard
      title={exercise.title}
      subtitle={exercise.instructions}
      badges={[
        <BaseBadge key="difficulty" variant={
          exercise.difficulty === 'beginner' ? 'success' :
          exercise.difficulty === 'intermediate' ? 'warning' : 'danger'
        }>
          {exercise.difficulty}
        </BaseBadge>,
        <BaseBadge key="points" variant="info">
          {exercise.points} pts
        </BaseBadge>
      ].filter(Boolean)}
    >
      <div className="space-y-4">
        {exercise.questions.map((question, idx) => {
          const isCorrect = results[question.id];
          const hasAnswer = answers[question.id]?.trim();

          return (
            <div
              key={question.id}
              className={`p-4 border-2 rounded-lg ${
                isChecked
                  ? isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="mb-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {idx + 1}.
                </span>{' '}
                <span className="text-sm text-gray-900 dark:text-white">
                  {question.sentence.split('_____')[0]}
                </span>
                <input
                  type="text"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  disabled={isChecked}
                  className={`mx-2 px-3 py-1 border-b-2 bg-transparent text-center min-w-[100px] outline-none ${
                    isChecked
                      ? isCorrect
                        ? 'border-green-600 text-green-700 dark:text-green-400'
                        : 'border-red-600 text-red-700 dark:text-red-400'
                      : 'border-gray-400 dark:border-gray-600 focus:border-gray-500'
                  }`}
                  placeholder={question.verb}
                />
                <span className="text-sm text-gray-900 dark:text-white">
                  {question.sentence.split('_____')[1]}
                </span>
              </div>

              {/* Resultado */}
              {isChecked && (
                <div className="mt-2 text-xs">
                  {isCorrect ? (
                    <span className="text-green-700 dark:text-green-400 flex items-center gap-1">
                      <Check size={14} /> Correcto!
                    </span>
                  ) : (
                    <span className="text-red-700 dark:text-red-400">
                      <X size={14} className="inline" /> Incorrecto. Respuesta correcta: <strong>{question.correctAnswers[0]}</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Hint */}
              {question.hint && (
                <div className="mt-2">
                  {showHints[question.id] ? (
                    <div className="text-xs p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                      <Lightbulb size={12} className="inline mr-1" />
                      {question.hint}
                    </div>
                  ) : (
                    <button
                      onClick={() => toggleHint(question.id)}
                      className="text-xs text-amber-700 dark:text-amber-400 hover:underline"
                    >
                      Ver pista
                    </button>
                  )}
                </div>
              )}

              {/* Nota rioplatense */}
              {question.rioplatenseNote && isChecked && (
                <div className="mt-2 text-xs p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded">
                  🇦🇷 {question.rioplatenseNote}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botones */}
      <div className="mt-6 flex gap-2">
        {!isChecked ? (
          <BaseButton
            variant="primary"
            onClick={checkAnswers}
            disabled={!allAnswered}
          >
            Verificar Respuestas
          </BaseButton>
        ) : (
          <BaseButton
            variant="ghost"
            onClick={reset}
          >
            Reintentar
          </BaseButton>
        )}
      </div>

      {/* Puntos */}
      {isChecked && (
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Puntos: {Math.round((exercise.points || 40) * (Object.values(results).filter(r => r).length / exercise.questions.length))} / {exercise.points || 40}
        </div>
      )}
    </BaseCard>
  );
}

ConjugationExercise.propTypes = {
  exercise: PropTypes.shape({
    title: PropTypes.string.isRequired,
    instructions: PropTypes.string.isRequired,
    difficulty: PropTypes.string,
    points: PropTypes.number,
    questions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        sentence: PropTypes.string.isRequired,
        verb: PropTypes.string.isRequired,
        correctAnswers: PropTypes.arrayOf(PropTypes.string).isRequired,
        hint: PropTypes.string,
        rioplatenseNote: PropTypes.string
      })
    ).isRequired
  }).isRequired,
  onComplete: PropTypes.func
};

export default ConjugationExercise;
