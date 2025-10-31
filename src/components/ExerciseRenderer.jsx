import { useState } from 'react';
import { EXERCISE_TYPES } from '../utils/exerciseParser';

function ExerciseRenderer({ exercise, onAnswer, showCorrectAnswer = false }) {
  const [userAnswer, setUserAnswer] = useState(null);
  const [selectedWords, setSelectedWords] = useState([]);
  const [orderedItems, setOrderedItems] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState({});
  const [fillAnswer, setFillAnswer] = useState('');
  const [dragAnswers, setDragAnswers] = useState([]);

  if (!exercise) return null;

  // Render based on exercise type
  switch (exercise.type) {
    case EXERCISE_TYPES.MULTIPLE_CHOICE:
      return renderMultipleChoice();
    case EXERCISE_TYPES.FILL_BLANK:
      return renderFillBlank();
    case EXERCISE_TYPES.TRUE_FALSE:
      return renderTrueFalse();
    case EXERCISE_TYPES.MATCHING:
      return renderMatching();
    case EXERCISE_TYPES.ORDER:
      return renderOrder();
    case EXERCISE_TYPES.HIGHLIGHT:
      return renderHighlight();
    case EXERCISE_TYPES.DRAG_DROP:
      return renderDragDrop();
    case EXERCISE_TYPES.TABLE:
      return renderTable();
    default:
      return <div>Tipo de ejercicio no soportado</div>;
  }

  // Multiple Choice Renderer
  function renderMultipleChoice() {
    return (
      <div className="exercise-multiple-choice">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {exercise.question}
        </h3>
        <div className="options-grid grid gap-3">
          {exercise.options.map((option, index) => {
            const isSelected = userAnswer === index;
            const isCorrect = showCorrectAnswer && index === exercise.correct;
            const isWrong = showCorrectAnswer && isSelected && index !== exercise.correct;

            return (
              <button
                key={index}
                onClick={() => {
                  setUserAnswer(index);
                  onAnswer && onAnswer(index === exercise.correct);
                }}
                className={`
                  option-btn p-4 rounded-lg border-2 text-left transition-all
                  ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-300 dark:border-gray-600'}
                  ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
                  ${isWrong ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
                  hover:border-indigo-400 dark:hover:border-indigo-500
                `}
                disabled={showCorrectAnswer}
              >
                <span className="text-gray-900 dark:text-gray-100">{option}</span>
                {isCorrect && <span className="ml-2">✅</span>}
                {isWrong && <span className="ml-2">❌</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Fill in the Blank Renderer
  function renderFillBlank() {
    const checkAnswer = () => {
      const isCorrect = exercise.answers.includes(fillAnswer.toLowerCase().trim());
      onAnswer && onAnswer(isCorrect);
    };

    return (
      <div className="exercise-fill-blank">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {exercise.question}
        </h3>
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={fillAnswer}
            onChange={(e) => setFillAnswer(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
            className="input flex-1"
            placeholder="Escribe tu respuesta..."
            disabled={showCorrectAnswer}
          />
          {!showCorrectAnswer && (
            <button onClick={checkAnswer} className="btn btn-primary">
              Verificar
            </button>
          )}
        </div>
        {showCorrectAnswer && (
          <div className="mt-3 p-3 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
            Respuestas correctas: {exercise.answers.join(', ')}
          </div>
        )}
      </div>
    );
  }

  // True/False Renderer
  function renderTrueFalse() {
    return (
      <div className="exercise-true-false">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {exercise.question}
        </h3>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setUserAnswer(true);
              onAnswer && onAnswer(exercise.correct === true);
            }}
            className={`
              btn flex-1 py-6 text-lg
              ${userAnswer === true ? 'btn-primary' : 'btn-outline'}
              ${showCorrectAnswer && exercise.correct === true ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
            `}
            disabled={showCorrectAnswer}
          >
            ✅ Verdadero
          </button>
          <button
            onClick={() => {
              setUserAnswer(false);
              onAnswer && onAnswer(exercise.correct === false);
            }}
            className={`
              btn flex-1 py-6 text-lg
              ${userAnswer === false ? 'btn-primary' : 'btn-outline'}
              ${showCorrectAnswer && exercise.correct === false ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
            `}
            disabled={showCorrectAnswer}
          >
            ❌ Falso
          </button>
        </div>
      </div>
    );
  }

  // Matching Renderer
  function renderMatching() {
    const leftItems = exercise.pairs.map(p => p.left);
    const rightItems = [...exercise.pairs.map(p => p.right)].sort(() => Math.random() - 0.5);

    const handleMatch = (left, right) => {
      const newMatches = { ...matchedPairs, [left]: right };
      setMatchedPairs(newMatches);

      // Check if all matched correctly
      if (Object.keys(newMatches).length === exercise.pairs.length) {
        const allCorrect = exercise.pairs.every(
          pair => newMatches[pair.left] === pair.right
        );
        onAnswer && onAnswer(allCorrect);
      }
    };

    return (
      <div className="exercise-matching">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {exercise.question}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            {leftItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded text-gray-900 dark:text-gray-100"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {rightItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  // Simple implementation: match sequentially
                  const unmatchedLeft = leftItems.find(l => !matchedPairs[l]);
                  if (unmatchedLeft) handleMatch(unmatchedLeft, item);
                }}
                className={`
                  w-full p-3 rounded text-left
                  ${Object.values(matchedPairs).includes(item)
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                  text-gray-900 dark:text-gray-100
                `}
                disabled={showCorrectAnswer || Object.values(matchedPairs).includes(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Order/Sequence Renderer
  function renderOrder() {
    const items = orderedItems.length > 0 ? orderedItems : exercise.shuffledItems;

    const moveItem = (fromIndex, toIndex) => {
      const newItems = [...items];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);
      setOrderedItems(newItems);
    };

    const checkOrder = () => {
      const isCorrect = items.every((item, idx) => item === exercise.correctOrder[idx]);
      onAnswer && onAnswer(isCorrect);
    };

    return (
      <div className="exercise-order">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Ordena correctamente: {exercise.question}
        </h3>
        <div className="space-y-2 mb-4">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400 w-8">{idx + 1}.</span>
              <div className="flex-1 p-3 bg-gray-100 dark:bg-gray-700 rounded text-gray-900 dark:text-gray-100">
                {item}
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveItem(idx, idx - 1)}
                  disabled={idx === 0 || showCorrectAnswer}
                  className="btn btn-sm"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveItem(idx, idx + 1)}
                  disabled={idx === items.length - 1 || showCorrectAnswer}
                  className="btn btn-sm"
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>
        {!showCorrectAnswer && (
          <button onClick={checkOrder} className="btn btn-primary">
            Verificar Orden
          </button>
        )}
        {showCorrectAnswer && (
          <div className="mt-3 p-3 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
            Orden correcto: {exercise.correctOrder.join(' → ')}
          </div>
        )}
      </div>
    );
  }

  // Highlight Words Renderer
  function renderHighlight() {
    const words = exercise.sentence.split(' ');

    const toggleWord = (word) => {
      if (selectedWords.includes(word)) {
        setSelectedWords(selectedWords.filter(w => w !== word));
      } else {
        const newSelected = [...selectedWords, word];
        setSelectedWords(newSelected);

        // Auto-check when all target words selected
        if (newSelected.length === exercise.targetWords.length) {
          const isCorrect = exercise.targetWords.every(tw => newSelected.includes(tw));
          onAnswer && onAnswer(isCorrect);
        }
      }
    };

    return (
      <div className="exercise-highlight">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {exercise.question}
        </h3>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded flex flex-wrap gap-2">
          {words.map((word, idx) => {
            const isSelected = selectedWords.includes(word);
            const isTarget = exercise.targetWords.includes(word);

            return (
              <button
                key={idx}
                onClick={() => toggleWord(word)}
                className={`
                  px-2 py-1 rounded transition-colors
                  ${isSelected ? 'bg-yellow-300 dark:bg-yellow-600' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}
                  ${showCorrectAnswer && isTarget ? 'bg-green-300 dark:bg-green-700' : ''}
                  text-gray-900 dark:text-gray-100
                `}
                disabled={showCorrectAnswer}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Drag & Drop Renderer (Simplified)
  function renderDragDrop() {
    return (
      <div className="exercise-drag-drop">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {exercise.question}
        </h3>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded mb-4">
          <p className="text-gray-900 dark:text-gray-100">{exercise.sentence}</p>
        </div>
        <div className="space-y-3">
          {exercise.options.map((optGroup, idx) => (
            <div key={idx} className="flex gap-2 flex-wrap">
              {optGroup.map((opt, optIdx) => (
                <button
                  key={optIdx}
                  onClick={() => {
                    const newAnswers = [...dragAnswers];
                    newAnswers[idx] = opt;
                    setDragAnswers(newAnswers);

                    if (newAnswers.length === exercise.answers.length) {
                      const isCorrect = newAnswers.every((a, i) => a === exercise.answers[i]);
                      onAnswer && onAnswer(isCorrect);
                    }
                  }}
                  className={`
                    btn btn-sm
                    ${dragAnswers[idx] === opt ? 'btn-primary' : 'btn-outline'}
                  `}
                  disabled={showCorrectAnswer}
                >
                  {opt}
                </button>
              ))}
            </div>
          ))}
        </div>
        {showCorrectAnswer && (
          <div className="mt-3 p-3 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
            Respuestas correctas: {exercise.answers.join(', ')}
          </div>
        )}
      </div>
    );
  }

  // Table Renderer
  function renderTable() {
    return (
      <div className="exercise-table">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {exercise.question}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                {exercise.headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-gray-100"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exercise.rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className="border border-gray-300 dark:border-gray-600 p-2"
                    >
                      {cell === '___' ? (
                        <input
                          type="text"
                          className="input w-full"
                          placeholder="..."
                          disabled={showCorrectAnswer}
                        />
                      ) : (
                        <span className="text-gray-900 dark:text-gray-100">{cell}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showCorrectAnswer && exercise.answers && (
          <div className="mt-3 p-3 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
            Respuestas: {exercise.answers.join(', ')}
          </div>
        )}
      </div>
    );
  }
}

export default ExerciseRenderer;
