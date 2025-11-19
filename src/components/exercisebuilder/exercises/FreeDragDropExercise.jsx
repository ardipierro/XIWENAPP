/**
 * @fileoverview Ejercicio de categorización con drag & drop flexible
 * @module components/designlab/exercises/FreeDragDropExercise
 */

import { useState } from 'react';
import { Check, X, Star, GripVertical, RotateCcw, Sparkles } from 'lucide-react';
import { BaseButton, BaseBadge, BaseCard, CategoryBadge } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';
import { useExerciseBuilderConfig } from '../../../hooks/useExerciseBuilderConfig';
import logger from '../../../utils/logger';

/**
 * Ejercicio de categorización flexible con drag & drop
 * @param {Object} props
 * @param {string} props.title - Título del ejercicio
 * @param {string} props.instruction - Instrucción principal
 * @param {Array<Object>} props.items - Items a categorizar [{id, text, correctCategory}]
 * @param {Array<Object>} props.categories - Categorías disponibles [{id, name, color, icon}]
 * @param {string} props.explanation - Explicación
 * @param {string} props.cefrLevel - Nivel CEFR
 * @param {Function} props.onComplete - Callback al completar
 */
export function FreeDragDropExercise({
  title = 'Categoriza los Elementos',
  instruction = 'Arrastra cada elemento a la categoría correcta',
  items = [],
  categories = [],
  explanation = '',
  cefrLevel = 'A2',
  onComplete
}) {
  const { config } = useExerciseBuilderConfig();

  // State para items en cada categoría
  const [itemsInCategories, setItemsInCategories] = useState(
    categories.reduce((acc, cat) => {
      acc[cat.id] = [];
      return acc;
    }, {})
  );

  // Items que aún no se han categorizado (en el área de origen)
  const [uncategorizedItems, setUncategorizedItems] = useState(
    items.map((item, i) => ({ ...item, uniqueId: `item-${i}` }))
  );

  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverCategory, setDragOverCategory] = useState(null);

  // Respuesta correcta: objeto con categoryId: [itemIds]
  const correctAnswer = items.reduce((acc, item) => {
    if (!acc[item.correctCategory]) {
      acc[item.correctCategory] = [];
    }
    acc[item.correctCategory].push(item.id);
    return acc;
  }, {});

  const {
    isCorrect,
    showFeedback,
    checkAnswer,
    resetExercise,
    score,
    stars,
    attempts
  } = useExerciseState({
    exerciseType: 'free-drag-drop',
    correctAnswer,
    validateFn: (userCategories, correct) => {
      // Verificar que cada categoría tenga los items correctos
      return Object.keys(correct).every((categoryId) => {
        const userItems = userCategories[categoryId]?.map((item) => item.id) || [];
        const correctItems = correct[categoryId];

        // Mismo número de items
        if (userItems.length !== correctItems.length) return false;

        // Todos los items correctos están presentes
        return correctItems.every((id) => userItems.includes(id));
      });
    },
    maxPoints: 100
  });

  const handleDragStart = (e, item, sourceCategory = null) => {
    setDraggedItem({ item, sourceCategory });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
    e.target.style.opacity = '0.4';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverCategory(null);
  };

  const handleDragOver = (e, categoryId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCategory(categoryId);
    return false;
  };

  const handleDragEnter = (e, categoryId) => {
    e.preventDefault();
    setDragOverCategory(categoryId);
  };

  const handleDragLeave = () => {
    setDragOverCategory(null);
  };

  const handleDrop = (e, targetCategory) => {
    e.stopPropagation();
    e.preventDefault();

    if (!draggedItem) return;

    const { item, sourceCategory } = draggedItem;

    // Remover del origen
    if (sourceCategory === null) {
      // Viene del área de items sin categorizar
      setUncategorizedItems((prev) => prev.filter((i) => i.uniqueId !== item.uniqueId));
    } else {
      // Viene de otra categoría
      setItemsInCategories((prev) => ({
        ...prev,
        [sourceCategory]: prev[sourceCategory].filter((i) => i.uniqueId !== item.uniqueId)
      }));
    }

    // Agregar al destino
    setItemsInCategories((prev) => ({
      ...prev,
      [targetCategory]: [...(prev[targetCategory] || []), item]
    }));

    setDragOverCategory(null);
    setDraggedItem(null);
  };

  const handleDropToUncategorized = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!draggedItem) return;

    const { item, sourceCategory } = draggedItem;

    // Solo permitir mover de vuelta si viene de una categoría
    if (sourceCategory !== null) {
      setItemsInCategories((prev) => ({
        ...prev,
        [sourceCategory]: prev[sourceCategory].filter((i) => i.uniqueId !== item.uniqueId)
      }));

      setUncategorizedItems((prev) => [...prev, item]);
    }

    setDragOverCategory(null);
    setDraggedItem(null);
  };

  const handleCheck = () => {
    const result = checkAnswer();
    logger.info('Free Drag Drop Exercise checked:', result);

    if (onComplete) {
      onComplete({
        ...result,
        exerciseType: 'free-drag-drop',
        userCategories: itemsInCategories,
        correctAnswer
      });
    }
  };

  const handleReset = () => {
    setUncategorizedItems(items.map((item, i) => ({ ...item, uniqueId: `item-${i}` })));
    setItemsInCategories(
      categories.reduce((acc, cat) => {
        acc[cat.id] = [];
        return acc;
      }, {})
    );
    setDraggedItem(null);
    setDragOverCategory(null);
    resetExercise();
  };

  const totalCategorized = Object.values(itemsInCategories).reduce(
    (sum, items) => sum + items.length,
    0
  );
  const progressPercent = (totalCategorized / items.length) * 100;

  // Función para obtener categoría de un item
  const getCategoryForItem = (item) => {
    return categories.find((cat) => cat.id === item.correctCategory);
  };

  return (
    <BaseCard
      title={title}
      badges={[
        <CategoryBadge key="level" type="cefr" value={cefrLevel} size="sm" />,
        <BaseBadge key="type" variant="default" size="sm">
          Categorización
        </BaseBadge>
      ]}
      className="w-full max-w-5xl mx-auto"
      style={{
        backgroundColor: config.customColors?.exerciseBackground
      }}
    >
      <div className="space-y-6">
        {/* Instrucción */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Sparkles size={18} strokeWidth={2} />
            <span>{instruction}</span>
          </div>
          {!showFeedback && (
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {totalCategorized} / {items.length} categorizados
            </div>
          )}
        </div>

        {/* Barra de progreso */}
        {!showFeedback && (
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Items sin categorizar */}
        {!showFeedback && uncategorizedItems.length > 0 && (
          <div
            className={`
              p-4 rounded-lg border-2 border-dashed transition-all
              ${dragOverCategory === 'uncategorized' ? 'border-gray-400 bg-gray-50 dark:bg-gray-800/20' : 'border-gray-300 dark:border-gray-600'}
            `}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCategory('uncategorized');
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOverCategory('uncategorized');
            }}
            onDragLeave={handleDragLeave}
            onDrop={handleDropToUncategorized}
            style={{
              backgroundColor: config.customColors?.cardBackground
            }}
          >
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Elementos para categorizar:
            </p>
            <div className="flex flex-wrap gap-2">
              {uncategorizedItems.map((item) => (
                <div
                  key={item.uniqueId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item, null)}
                  onDragEnd={handleDragEnd}
                  className="
                    inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700
                    border-2 border-gray-300 dark:border-gray-600 rounded-lg
                    cursor-move hover:border-gray-400 dark:hover:border-gray-400
                    transition-all shadow-sm hover:shadow-md
                  "
                  style={{
                    color: config.customColors?.textColor
                  }}
                >
                  <GripVertical size={16} className="text-gray-400" strokeWidth={2} />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categorías (drop zones) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => {
            const itemsInCategory = itemsInCategories[category.id] || [];
            const isDragOver = dragOverCategory === category.id;

            return (
              <div
                key={category.id}
                className={`
                  p-4 rounded-lg border-2 transition-all min-h-[200px]
                  ${isDragOver && !showFeedback ? 'border-gray-400 bg-gray-50 dark:bg-gray-800/20 scale-105' : ''}
                  ${!isDragOver && !showFeedback ? 'border-gray-300 dark:border-gray-600' : ''}
                  ${showFeedback ? 'border-gray-300 dark:border-gray-600' : ''}
                `}
                onDragOver={(e) => handleDragOver(e, category.id)}
                onDragEnter={(e) => handleDragEnter(e, category.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, category.id)}
                style={{
                  borderColor: !showFeedback && !isDragOver ? category.color : undefined,
                  backgroundColor: config.customColors?.cardBackground
                }}
              >
                {/* Header de categoría */}
                <div className="flex items-center gap-2 mb-3 pb-3 border-b-2 border-gray-200 dark:border-gray-700">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <h3
                    className="text-lg font-bold"
                    style={{ color: category.color }}
                  >
                    {category.name}
                  </h3>
                  <BaseBadge variant="default" size="sm" className="ml-auto">
                    {itemsInCategory.length}
                  </BaseBadge>
                </div>

                {/* Items en esta categoría */}
                <div className="space-y-2">
                  {itemsInCategory.length === 0 && !showFeedback && (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                      Arrastra elementos aquí
                    </div>
                  )}
                  {itemsInCategory.map((item) => {
                    const isCorrectCategory = item.correctCategory === category.id;
                    const showCorrectness = showFeedback;

                    return (
                      <div
                        key={item.uniqueId}
                        draggable={!showFeedback}
                        onDragStart={(e) => handleDragStart(e, item, category.id)}
                        onDragEnd={handleDragEnd}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all
                          ${!showFeedback ? 'cursor-move hover:scale-105' : 'cursor-default'}
                          ${showCorrectness && isCorrectCategory ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : ''}
                          ${showCorrectness && !isCorrectCategory ? 'bg-red-50 dark:bg-red-900/20 border-red-500' : ''}
                          ${!showCorrectness ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600' : ''}
                        `}
                      >
                        {!showFeedback && (
                          <GripVertical size={14} className="text-gray-400 flex-shrink-0" strokeWidth={2} />
                        )}
                        <span
                          className="flex-1 text-sm font-medium text-gray-900 dark:text-white"
                          style={{
                            color: !showFeedback ? config.customColors?.textColor : undefined
                          }}
                        >
                          {item.text}
                        </span>
                        {showCorrectness && (
                          <>
                            {isCorrectCategory ? (
                              <Check size={16} className="text-green-500 flex-shrink-0" strokeWidth={2} />
                            ) : (
                              <X size={16} className="text-red-500 flex-shrink-0" strokeWidth={2} />
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div
            className={`
              p-4 rounded-lg border-2
              ${
                isCorrect
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                  : 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
              }
            `}
          >
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <Check size={24} className="text-green-500 flex-shrink-0" strokeWidth={2} />
              ) : (
                <X size={24} className="text-orange-500 flex-shrink-0" strokeWidth={2} />
              )}
              <div className="flex-1">
                <p className="font-semibold text-base text-gray-900 dark:text-white mb-2">
                  {isCorrect ? '¡Excelente categorización!' : 'Algunas categorías son incorrectas'}
                </p>

                {!isCorrect && (
                  <div className="mb-3 space-y-2">
                    {items.map((item) => {
                      const userCategory = Object.keys(itemsInCategories).find((catId) =>
                        itemsInCategories[catId]?.some((i) => i.id === item.id)
                      );
                      const isWrong = userCategory !== item.correctCategory;

                      if (!isWrong) return null;

                      const correctCat = categories.find((c) => c.id === item.correctCategory);

                      return (
                        <div
                          key={item.id}
                          className="text-sm p-2 bg-white dark:bg-gray-800 rounded border border-orange-200 dark:border-orange-700"
                        >
                          <span className="font-medium text-gray-900 dark:text-white">
                            "{item.text}"
                          </span>
                          {' '}
                          <span className="text-gray-600 dark:text-gray-400">
                            debería estar en
                          </span>
                          {' '}
                          <span
                            className="font-bold"
                            style={{ color: correctCat?.color }}
                          >
                            {correctCat?.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {explanation && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
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
            <BaseButton
              variant="primary"
              onClick={handleCheck}
              disabled={uncategorizedItems.length > 0}
              fullWidth
            >
              {uncategorizedItems.length > 0
                ? `Categoriza todos los elementos (${uncategorizedItems.length} restantes)`
                : 'Verificar Categorización'}
            </BaseButton>
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

export default FreeDragDropExercise;
