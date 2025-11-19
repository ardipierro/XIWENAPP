/**
 * @fileoverview Ejercicio de ordenar elementos con drag & drop real (HTML5 API)
 * @module components/designlab/exercises/DragDropOrderExercise
 */

import { useState } from 'react';
import { Check, X, Star, GripVertical, RotateCcw, Shuffle } from 'lucide-react';
import { BaseButton, BaseBadge, BaseCard } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';
import { useExerciseBuilderConfig } from '../../../hooks/useExerciseBuilderConfig';
import logger from '../../../utils/logger';

/**
 * Ejercicio de ordenar elementos arrastrando (drag & drop)
 * @param {Object} props
 * @param {string} props.instruction - Instrucción del ejercicio
 * @param {Array<string>} props.items - Items en el orden correcto
 * @param {string} props.explanation - Explicación
 * @param {string} props.cefrLevel - Nivel CEFR
 * @param {boolean} props.showNumbers - Mostrar números de posición
 * @param {Function} props.onComplete - Callback al completar
 */
export function DragDropOrderExercise({
  instruction = 'Ordena las palabras para formar una oración correcta',
  items = [],
  explanation = '',
  cefrLevel = 'A2',
  showNumbers = true,
  onComplete
}) {
  const { config } = useExerciseBuilderConfig();

  // Shuffle function
  const shuffle = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const [orderedItems, setOrderedItems] = useState(() =>
    shuffle(items.map((item, i) => ({ id: i, text: item })))
  );
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const correctOrder = items;

  const {
    isCorrect,
    showFeedback,
    checkAnswer,
    resetExercise,
    score,
    stars,
    attempts
  } = useExerciseState({
    exerciseType: 'drag-drop-order',
    correctAnswer: correctOrder,
    validateFn: (userOrder, correct) => {
      const userTexts = userOrder.map((item) => item.text);
      return JSON.stringify(userTexts) === JSON.stringify(correct);
    },
    maxPoints: 100
  });

  const handleDragStart = (e, index) => {
    setDraggedItem(orderedItems[index]);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
    e.target.style.opacity = '0.4';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
    return false;
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.stopPropagation();
    e.preventDefault();

    if (!draggedItem) return;

    const dragIndex = orderedItems.findIndex((item) => item.id === draggedItem.id);

    if (dragIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    const newItems = [...orderedItems];
    newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);

    setOrderedItems(newItems);
    setDragOverIndex(null);
  };

  const handleCheck = () => {
    const result = checkAnswer();
    logger.info('Drag Drop Order Exercise checked:', result);

    if (onComplete) {
      onComplete({
        ...result,
        exerciseType: 'drag-drop-order',
        userOrder: orderedItems.map((i) => i.text),
        correctOrder
      });
    }
  };

  const handleReset = () => {
    setOrderedItems(shuffle(items.map((item, i) => ({ id: i, text: item }))));
    setDraggedItem(null);
    setDragOverIndex(null);
    resetExercise();
  };

  const handleShuffle = () => {
    setOrderedItems(shuffle([...orderedItems]));
  };

  return (
    <BaseCard
      title={instruction}
      badges={[
        <BaseBadge key="level" variant="info" size="sm">
          {cefrLevel}
        </BaseBadge>,
        <BaseBadge key="type" variant="default" size="sm">
          Drag & Drop
        </BaseBadge>
      ]}
      className="w-full max-w-3xl mx-auto"
      style={{
        backgroundColor: config.customColors?.exerciseBackground
      }}
    >
      <div className="space-y-6">
        {/* Instrucción */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <GripVertical size={18} strokeWidth={2} />
          <span>Arrastra los elementos para ordenarlos correctamente</span>
        </div>

        {/* Items arrastrables */}
        <div className="space-y-3">
          {orderedItems.map((item, index) => {
            const isDragging = draggedItem?.id === item.id;
            const isDragOver = dragOverIndex === index;
            const isCorrectPosition =
              showFeedback && items[index] === item.text;
            const isIncorrectPosition =
              showFeedback && items[index] !== item.text;

            return (
              <div
                key={item.id}
                draggable={!showFeedback}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`
                  flex items-center gap-4 p-4 rounded-lg border-2 transition-all
                  ${!showFeedback ? 'cursor-move hover:border-zinc-400 dark:hover:border-zinc-500' : 'cursor-default'}
                  ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}
                  ${isDragOver && !showFeedback ? 'border-gray-400 bg-gray-50 dark:bg-gray-800/20 scale-105' : ''}
                  ${!isDragOver && !showFeedback ? 'border-gray-300 dark:border-gray-600' : ''}
                  ${isCorrectPosition ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
                  ${isIncorrectPosition ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
                `}
                style={{
                  borderColor: !showFeedback ? config.customColors?.borderColor : undefined,
                  backgroundColor: !showFeedback ? config.customColors?.cardBackground : undefined
                }}
              >
                {/* Drag handle */}
                {!showFeedback && (
                  <GripVertical
                    size={24}
                    className="text-gray-400 flex-shrink-0"
                    strokeWidth={2}
                  />
                )}

                {/* Número de posición */}
                {showNumbers && (
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                      ${isCorrectPosition ? 'bg-green-500 text-white' : ''}
                      ${isIncorrectPosition ? 'bg-red-500 text-white' : ''}
                      ${!showFeedback ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : ''}
                    `}
                  >
                    {index + 1}
                  </div>
                )}

                {/* Texto del item */}
                <span
                  className="flex-1 text-lg text-gray-900 dark:text-white font-medium"
                  style={{
                    fontSize: `${config.fontSize}px`,
                    color: config.customColors?.textColor
                  }}
                >
                  {item.text}
                </span>

                {/* Icono de feedback */}
                {showFeedback && (
                  <>
                    {isCorrectPosition && (
                      <Check size={24} className="text-green-500 flex-shrink-0" strokeWidth={2} />
                    )}
                    {isIncorrectPosition && (
                      <X size={24} className="text-red-500 flex-shrink-0" strokeWidth={2} />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Resultado final */}
        {!showFeedback && orderedItems.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Oración formada:
            </p>
            <p className="text-lg text-gray-900 dark:text-white">
              {orderedItems.map((item) => item.text).join(' ')}
            </p>
          </div>
        )}

        {/* Feedback */}
        {showFeedback && (
          <div
            className={`
              p-4 rounded-lg border-2
              ${
                isCorrect
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-500'
              }
            `}
          >
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <Check size={24} className="text-green-500 flex-shrink-0" strokeWidth={2} />
              ) : (
                <X size={24} className="text-red-500 flex-shrink-0" strokeWidth={2} />
              )}
              <div className="flex-1">
                <p className="font-semibold text-base text-gray-900 dark:text-white mb-2">
                  {isCorrect ? '¡Perfecto!' : 'Orden incorrecto'}
                </p>

                {!isCorrect && (
                  <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Orden correcto:
                    </p>
                    <p className="text-base font-medium text-green-600 dark:text-green-400">
                      {correctOrder.join(' ')}
                    </p>
                  </div>
                )}

                {explanation && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {explanation}
                  </p>
                )}
              </div>
            </div>

            {/* Score */}
            {isCorrect && (
              <div className="mt-3 flex items-center gap-4 pt-3 border-t border-green-200 dark:border-green-800">
                <div className="flex items-center gap-1">
                  {[...Array(3)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      strokeWidth={2}
                      className={
                        i < stars
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-gray-300 dark:text-gray-600'
                      }
                    />
                  ))}
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {score} puntos
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {attempts === 1 ? '1er intento' : `${attempts} intentos`}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!showFeedback ? (
            <>
              <BaseButton
                variant="primary"
                onClick={handleCheck}
                fullWidth
              >
                Verificar Orden
              </BaseButton>
              <BaseButton
                variant="outline"
                icon={Shuffle}
                onClick={handleShuffle}
              >
                Mezclar
              </BaseButton>
            </>
          ) : (
            <BaseButton variant="ghost" onClick={handleReset} icon={RotateCcw} fullWidth>
              Reintentar
            </BaseButton>
          )}
        </div>
      </div>
    </BaseCard>
  );
}

export default DragDropOrderExercise;
