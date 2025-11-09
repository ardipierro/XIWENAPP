/**
 * @fileoverview Ejercicio de armar menú con drag & drop
 * @module components/interactive-book/DragDropMenuExercise
 */

import { useState } from 'react';
import { Check, X, Shuffle } from 'lucide-react';
import { BaseButton, BaseBadge, BaseCard } from '../common';
import PropTypes from 'prop-types';

/**
 * Componente de ejercicio Drag & Drop Menu
 */
function DragDropMenuExercise({ exercise, onComplete }) {
  const [placements, setPlacements] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [results, setResults] = useState({});
  const [attempts, setAttempts] = useState(0);

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, categoryId) => {
    e.preventDefault();
    if (draggedItem) {
      setPlacements(prev => ({
        ...prev,
        [draggedItem.id]: categoryId
      }));
      setDraggedItem(null);
    }
  };

  const checkAnswers = () => {
    const newResults = {};
    let correctCount = 0;

    exercise.items.forEach(item => {
      const placedCategory = placements[item.id];
      const isCorrect = placedCategory === item.category;
      newResults[item.id] = isCorrect;
      if (isCorrect) correctCount++;
    });

    setResults(newResults);
    setIsChecked(true);
    setAttempts(prev => prev + 1);

    const totalItems = exercise.items.length;
    const percentage = (correctCount / totalItems) * 100;
    const points = Math.round((exercise.points || 50) * (correctCount / totalItems));

    if (onComplete) {
      onComplete({
        correct: correctCount === totalItems,
        correctCount,
        totalItems,
        percentage,
        attempts: attempts + 1,
        points
      });
    }
  };

  const reset = () => {
    setPlacements({});
    setResults({});
    setIsChecked(false);
    setDraggedItem(null);
  };

  const getItemsInCategory = (categoryId) => {
    return exercise.items.filter(item => placements[item.id] === categoryId);
  };

  const getUnplacedItems = () => {
    return exercise.items.filter(item => !placements[item.id]);
  };

  const removeItemFromCategory = (itemId) => {
    if (!isChecked) {
      const newPlacements = { ...placements };
      delete newPlacements[itemId];
      setPlacements(newPlacements);
    }
  };

  const allPlaced = Object.keys(placements).length === exercise.items.length;

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
                  {exercise.feedback?.allCorrect || '¡Perfecto! Armaste el menú correctamente.'}
                </span>
              </>
            ) : (
              <>
                <X size={20} className="text-amber-600 dark:text-amber-400" />
                <span className="text-sm text-amber-900 dark:text-amber-100">
                  {Object.values(results).filter(r => r).length} de {exercise.items.length} correctos. {exercise.feedback?.someCorrect}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Área de items sin colocar */}
      {!isChecked && getUnplacedItems().length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Platos disponibles (arrastra a las categorías)
          </h4>
          <div className="flex flex-wrap gap-2">
            {getUnplacedItems().map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                className="px-3 py-2 bg-white dark:bg-gray-700 border-2 border-blue-500 rounded-lg cursor-move hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorías del menú */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {exercise.categories.map(category => {
          const itemsInCategory = getItemsInCategory(category.id);

          return (
            <div
              key={category.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, category.id)}
              className="p-4 border-2 border-dashed rounded-lg min-h-[150px] transition-all hover:border-gray-400 dark:hover:border-gray-500"
            >
              <div className="mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {category.name}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {category.translation}
                </p>
              </div>

              <div className="space-y-2">
                {itemsInCategory.map(item => {
                  const isCorrect = results[item.id];

                  return (
                    <div
                      key={item.id}
                      className={`p-2 rounded-lg flex items-center justify-between ${
                        isChecked
                          ? isCorrect
                            ? 'bg-green-100 dark:bg-green-900/30 border border-green-500'
                            : 'bg-red-100 dark:bg-red-900/30 border border-red-500'
                          : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700'
                      }`}
                    >
                      <span className="text-sm text-gray-900 dark:text-white">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2">
                        {isChecked && (
                          isCorrect ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <X size={16} className="text-red-600" />
                          )
                        )}
                        {!isChecked && (
                          <button
                            onClick={() => removeItemFromCategory(item.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {itemsInCategory.length === 0 && (
                <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">
                  Arrastra platos aquí
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botones */}
      <div className="flex gap-2">
        {!isChecked ? (
          <>
            <BaseButton
              variant="primary"
              onClick={checkAnswers}
              disabled={!allPlaced}
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
          Puntos obtenidos: {Math.round((exercise.points || 50) * (Object.values(results).filter(r => r).length / exercise.items.length))} / {exercise.points || 50}
        </div>
      )}
    </BaseCard>
  );
}

DragDropMenuExercise.propTypes = {
  exercise: PropTypes.shape({
    title: PropTypes.string.isRequired,
    instructions: PropTypes.string.isRequired,
    difficulty: PropTypes.string,
    points: PropTypes.number,
    categories: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        translation: PropTypes.string.isRequired
      })
    ).isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired,
        image: PropTypes.string,
        audioUrl: PropTypes.string,
        info: PropTypes.string
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

export default DragDropMenuExercise;
