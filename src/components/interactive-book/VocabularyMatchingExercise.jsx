/**
 * @fileoverview Ejercicio de emparejar vocabulario (drag & drop)
 * @module components/interactive-book/VocabularyMatchingExercise
 */

import { useState } from 'react';
import { Check, X, Volume2, Shuffle } from 'lucide-react';
import { BaseButton, BaseBadge, BaseCard } from '../common';
import PropTypes from 'prop-types';

/**
 * Componente de ejercicio Vocabulary Matching con drag & drop
 */
function VocabularyMatchingExercise({ exercise, onComplete }) {
  const [matches, setMatches] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [results, setResults] = useState({});
  const [attempts, setAttempts] = useState(0);
  const [shuffledChinese, setShuffledChinese] = useState(
    shuffleArray([...exercise.pairs.map(p => ({ id: p.id, chinese: p.chinese }))])
  );

  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, spanishPair) => {
    e.preventDefault();
    if (draggedItem) {
      setMatches(prev => ({
        ...prev,
        [spanishPair.id]: draggedItem
      }));
      setDraggedItem(null);
    }
  };

  const checkAnswers = () => {
    const newResults = {};
    let correctCount = 0;

    exercise.pairs.forEach(pair => {
      const matched = matches[pair.id];
      const isCorrect = matched?.id === pair.id;
      newResults[pair.id] = isCorrect;
      if (isCorrect) correctCount++;
    });

    setResults(newResults);
    setIsChecked(true);
    setAttempts(prev => prev + 1);

    const totalPairs = exercise.pairs.length;
    const percentage = (correctCount / totalPairs) * 100;
    const points = Math.round((exercise.points || 50) * (correctCount / totalPairs));

    if (onComplete) {
      onComplete({
        correct: correctCount === totalPairs,
        correctCount,
        totalPairs,
        percentage,
        attempts: attempts + 1,
        points
      });
    }
  };

  const reset = () => {
    setMatches({});
    setResults({});
    setIsChecked(false);
    setDraggedItem(null);
    setShuffledChinese(shuffleArray([...exercise.pairs.map(p => ({ id: p.id, chinese: p.chinese }))]));
  };

  const getMatchedChinese = (pairId) => {
    return matches[pairId];
  };

  const isChineseUsed = (chineseItem) => {
    return Object.values(matches).some(match => match?.id === chineseItem.id);
  };

  const removeMatch = (pairId) => {
    if (!isChecked) {
      const newMatches = { ...matches };
      delete newMatches[pairId];
      setMatches(newMatches);
    }
  };

  const allMatched = Object.keys(matches).length === exercise.pairs.length;

  return (
    <BaseCard
      title={exercise.title}
      subtitle={exercise.instructions}
      badges={[
        <BaseBadge key="difficulty" variant="primary">
          {exercise.difficulty}
        </BaseBadge>,
        <BaseBadge key="points" variant="info">
          {exercise.points} pts
        </BaseBadge>
      ]}
    >
      {isChecked && (
        <div className={`mb-4 p-3 rounded-lg ${
          Object.values(results).every(r => r)
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
        }`}>
          <div className="flex items-center gap-2">
            {Object.values(results).every(r => r) ? (
              <>
                <Check size={20} className="text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-900 dark:text-green-100">
                  {exercise.feedback?.allCorrect || '¡Excelente! Todos correctos.'}
                </span>
              </>
            ) : (
              <>
                <X size={20} className="text-amber-600 dark:text-amber-400" />
                <span className="text-sm text-amber-900 dark:text-amber-100">
                  {Object.values(results).filter(r => r).length} de {exercise.pairs.length} correctos. {exercise.feedback?.someCorrect}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna Español (izquierda) */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
            Español 🇦🇷
          </h4>
          {exercise.pairs.map(pair => {
            const matchedChinese = getMatchedChinese(pair.id);
            const isCorrect = results[pair.id];

            return (
              <div
                key={pair.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, pair)}
                className={`p-3 border-2 border-dashed rounded-lg min-h-[70px] flex items-center justify-between transition-all ${
                  isChecked
                    ? isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : matchedChinese
                    ? 'border-gray-400 bg-gray-50 dark:bg-gray-800/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {pair.spanish}
                    {pair.rioplatenseNote && (
                      <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded">
                        🇦🇷
                      </span>
                    )}
                  </div>
                  {matchedChinese && (
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      → {matchedChinese.chinese}
                    </div>
                  )}
                </div>
                {matchedChinese && !isChecked && (
                  <button
                    onClick={() => removeMatch(pair.id)}
                    className="ml-2 text-gray-400 hover:text-red-600"
                  >
                    <X size={18} />
                  </button>
                )}
                {isChecked && (
                  <div className="ml-2">
                    {isCorrect ? (
                      <Check size={20} className="text-green-600" />
                    ) : (
                      <X size={20} className="text-red-600" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Columna Chino (derecha) */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
            中文 (Chino)
          </h4>
          {shuffledChinese.map(item => {
            const used = isChineseUsed(item);
            if (used && !isChecked) return null;

            return (
              <div
                key={item.id}
                draggable={!isChecked && !used}
                onDragStart={(e) => handleDragStart(e, item)}
                className={`p-3 border-2 rounded-lg cursor-move transition-all ${
                  used && !isChecked
                    ? 'opacity-0 hidden'
                    : isChecked
                    ? 'opacity-50 cursor-default border-gray-300 dark:border-gray-600'
                    : 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {item.chinese}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botones */}
      <div className="mt-6 flex gap-2">
        {!isChecked ? (
          <>
            <BaseButton
              variant="primary"
              onClick={checkAnswers}
              disabled={!allMatched}
            >
              Verificar
            </BaseButton>
            <BaseButton
              variant="ghost"
              icon={Shuffle}
              onClick={reset}
            >
              Reiniciar
            </BaseButton>
          </>
        ) : (
          <BaseButton
            variant="ghost"
            icon={Shuffle}
            onClick={reset}
          >
            Intentar de nuevo
          </BaseButton>
        )}
      </div>

      {/* Puntos */}
      {isChecked && (
        <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
          Puntos obtenidos: {Math.round((exercise.points || 50) * (Object.values(results).filter(r => r).length / exercise.pairs.length))} / {exercise.points || 50}
        </div>
      )}
    </BaseCard>
  );
}

VocabularyMatchingExercise.propTypes = {
  exercise: PropTypes.shape({
    title: PropTypes.string.isRequired,
    instructions: PropTypes.string.isRequired,
    difficulty: PropTypes.string,
    points: PropTypes.number,
    pairs: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        spanish: PropTypes.string.isRequired,
        chinese: PropTypes.string.isRequired,
        image: PropTypes.string,
        audioUrl: PropTypes.string,
        rioplatenseNote: PropTypes.string
      })
    ).isRequired,
    feedback: PropTypes.shape({
      allCorrect: PropTypes.string,
      someCorrect: PropTypes.string,
      noneCorrect: PropTypes.string
    })
  }).isRequired,
  onComplete: PropTypes.func
};

export default VocabularyMatchingExercise;
