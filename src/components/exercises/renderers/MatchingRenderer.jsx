/**
 * @fileoverview MatchingRenderer - Renderizador unificado de emparejar
 * @module components/exercises/renderers/MatchingRenderer
 *
 * UNIFICA:
 * - ChainedExerciseViewer.jsx → MatchingContent
 * - container/MatchingExercise.jsx
 * - exercisebuilder/exercises/MatchingExercise.jsx
 *
 * Soporta:
 * - Click para conectar
 * - Drag and drop
 * - Líneas de conexión SVG
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Check, X, RotateCcw, ArrowRight } from 'lucide-react';
import { BaseBadge } from '../../common';
import { useExercise, FEEDBACK_MODES } from '../core/ExerciseContext';

// Colores por defecto (mismo que otros renderers)
const DEFAULT_COLORS = {
  correctColor: '#10b981',
  incorrectColor: '#ef4444',
  selectedColor: '#3b82f6',
  connectedColor: '#8b5cf6'
};

/**
 * Shuffle array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * MatchingRenderer - Renderiza ejercicios de emparejar
 *
 * @param {Object} props
 * @param {Array} props.pairs - Array de {left, right} pares correctos
 * @param {string} [props.title] - Título del ejercicio
 * @param {string} [props.instruction] - Instrucción
 * @param {string} [props.leftTitle] - Título columna izquierda
 * @param {string} [props.rightTitle] - Título columna derecha
 * @param {boolean} [props.shuffleRight] - Mezclar columna derecha
 * @param {string} [props.mode] - 'click' | 'drag'
 * @param {boolean} [props.showLines] - Mostrar líneas de conexión
 * @param {string} [props.className] - Clases adicionales
 */
export function MatchingRenderer({
  pairs = [],
  title,
  instruction,
  leftTitle = 'Columna A',
  rightTitle = 'Columna B',
  shuffleRight = true,
  mode = 'click',
  showLines = true,
  colors = {},
  className = ''
}) {
  // Merge colors with defaults
  const colorConfig = { ...DEFAULT_COLORS, ...colors };
  const {
    userAnswer,
    setAnswer,
    showingFeedback,
    config,
    checkAnswer
  } = useExercise();

  // Estado de conexiones: { leftIndex: rightIndex }
  const [connections, setConnections] = useState({});

  // Item seleccionado actualmente (para modo click)
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);

  // Referencias para calcular líneas
  const leftRefs = useRef({});
  const rightRefs = useRef({});
  const containerRef = useRef(null);

  // Mezclar columna derecha
  const shuffledRight = useMemo(() => {
    if (!shuffleRight) {
      return pairs.map((p, idx) => ({ text: p.right, originalIndex: idx }));
    }
    const items = pairs.map((p, idx) => ({ text: p.right, originalIndex: idx }));
    return shuffleArray(items);
  }, [pairs, shuffleRight]);

  // Sincronizar con context
  useEffect(() => {
    setAnswer(connections);
  }, [connections, setAnswer]);

  // Handler de click en item izquierdo
  const handleLeftClick = useCallback((leftIndex) => {
    if (showingFeedback) return;

    // Si ya hay conexión, deseleccionar
    if (connections[leftIndex] !== undefined) {
      setConnections(prev => {
        const next = { ...prev };
        delete next[leftIndex];
        return next;
      });
      return;
    }

    setSelectedLeft(leftIndex);

    // Si hay un derecho seleccionado, conectar
    if (selectedRight !== null) {
      setConnections(prev => ({
        ...prev,
        [leftIndex]: selectedRight
      }));
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  }, [showingFeedback, connections, selectedRight]);

  // Handler de click en item derecho
  const handleRightClick = useCallback((rightIndex) => {
    if (showingFeedback) return;

    // Si ya está conectado, desconectar
    const connectedLeft = Object.entries(connections).find(([_, r]) => r === rightIndex)?.[0];
    if (connectedLeft !== undefined) {
      setConnections(prev => {
        const next = { ...prev };
        delete next[connectedLeft];
        return next;
      });
      return;
    }

    setSelectedRight(rightIndex);

    // Si hay un izquierdo seleccionado, conectar
    if (selectedLeft !== null) {
      setConnections(prev => ({
        ...prev,
        [selectedLeft]: rightIndex
      }));
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  }, [showingFeedback, connections, selectedLeft]);

  // Verificar si una conexión es correcta
  const isConnectionCorrect = (leftIndex, rightIndex) => {
    const rightItem = shuffledRight[rightIndex];
    return rightItem.originalIndex === leftIndex;
  };

  // Verificar si todas las conexiones son correctas
  const allCorrect = useMemo(() => {
    if (Object.keys(connections).length !== pairs.length) return false;
    return Object.entries(connections).every(([left, right]) =>
      isConnectionCorrect(parseInt(left), right)
    );
  }, [connections, pairs.length]);

  // Reset conexiones
  const handleReset = () => {
    setConnections({});
    setSelectedLeft(null);
    setSelectedRight(null);
  };

  // Obtener color de conexión
  const getConnectionColor = (leftIndex, rightIndex) => {
    if (!showingFeedback) return colorConfig.selectedColor;
    return isConnectionCorrect(leftIndex, rightIndex) ? colorConfig.correctColor : colorConfig.incorrectColor;
  };

  // Calcular líneas SVG
  const getLines = () => {
    if (!showLines || !containerRef.current) return [];

    const containerRect = containerRef.current.getBoundingClientRect();
    const lines = [];

    Object.entries(connections).forEach(([leftIdx, rightIdx]) => {
      const leftEl = leftRefs.current[leftIdx];
      const rightEl = rightRefs.current[rightIdx];

      if (leftEl && rightEl) {
        const leftRect = leftEl.getBoundingClientRect();
        const rightRect = rightEl.getBoundingClientRect();

        lines.push({
          x1: leftRect.right - containerRect.left,
          y1: leftRect.top + leftRect.height / 2 - containerRect.top,
          x2: rightRect.left - containerRect.left,
          y2: rightRect.top + rightRect.height / 2 - containerRect.top,
          color: getConnectionColor(parseInt(leftIdx), rightIdx),
          key: `${leftIdx}-${rightIdx}`
        });
      }
    });

    return lines;
  };

  const [lines, setLines] = useState([]);

  // Actualizar líneas cuando cambian las conexiones
  useEffect(() => {
    const updateLines = () => {
      setLines(getLines());
    };
    updateLines();
    window.addEventListener('resize', updateLines);
    return () => window.removeEventListener('resize', updateLines);
  }, [connections, showingFeedback]);

  return (
    <div className={`matching-renderer ${className}`}>
      {/* Título */}
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
      )}

      {/* Instrucción */}
      {instruction && (
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {instruction}
        </p>
      )}

      {!instruction && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Conecta los elementos de la izquierda con los de la derecha
        </p>
      )}

      {/* Contenedor principal */}
      <div
        ref={containerRef}
        className="relative flex gap-8 justify-between items-start"
      >
        {/* SVG para líneas */}
        {showLines && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          >
            {lines.map(line => (
              <line
                key={line.key}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={line.color}
                strokeWidth="2"
                strokeLinecap="round"
              />
            ))}
          </svg>
        )}

        {/* Columna izquierda */}
        <div className="flex-1 space-y-3">
          {leftTitle && (
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              {leftTitle}
            </h4>
          )}

          {pairs.map((pair, leftIndex) => {
            const isConnected = connections[leftIndex] !== undefined;
            const isSelected = selectedLeft === leftIndex;
            const isCorrect = isConnected && showingFeedback &&
              isConnectionCorrect(leftIndex, connections[leftIndex]);
            const isIncorrect = isConnected && showingFeedback &&
              !isConnectionCorrect(leftIndex, connections[leftIndex]);

            return (
              <button
                key={leftIndex}
                ref={el => leftRefs.current[leftIndex] = el}
                onClick={() => handleLeftClick(leftIndex)}
                disabled={showingFeedback}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all relative z-10 ${
                  isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : isIncorrect
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200'
                    : isConnected
                    ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
                }`}
              >
                <span className="text-gray-900 dark:text-white">
                  {pair.left}
                </span>

                {/* Indicador de estado */}
                {showingFeedback && isConnected && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center ${
                    isCorrect
                      ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300'
                  }`}>
                    {isCorrect ? <Check size={14} /> : <X size={14} />}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Indicador central */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2 py-4">
          <ArrowRight size={24} className="text-gray-400" />
        </div>

        {/* Columna derecha */}
        <div className="flex-1 space-y-3">
          {rightTitle && (
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              {rightTitle}
            </h4>
          )}

          {shuffledRight.map((item, rightIndex) => {
            const connectedLeft = Object.entries(connections).find(([_, r]) => r === rightIndex)?.[0];
            const isConnected = connectedLeft !== undefined;
            const isSelected = selectedRight === rightIndex;
            const isCorrect = isConnected && showingFeedback &&
              isConnectionCorrect(parseInt(connectedLeft), rightIndex);
            const isIncorrect = isConnected && showingFeedback &&
              !isConnectionCorrect(parseInt(connectedLeft), rightIndex);

            return (
              <button
                key={rightIndex}
                ref={el => rightRefs.current[rightIndex] = el}
                onClick={() => handleRightClick(rightIndex)}
                disabled={showingFeedback}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all relative z-10 ${
                  isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : isIncorrect
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : isSelected
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-200'
                    : isConnected
                    ? 'border-purple-400 bg-purple-50/50 dark:bg-purple-900/10'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300'
                }`}
              >
                <span className="text-gray-900 dark:text-white">
                  {item.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controles */}
      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {Object.keys(connections).length} / {pairs.length} conectados
        </span>

        {!showingFeedback && Object.keys(connections).length > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <RotateCcw size={16} />
            Reiniciar
          </button>
        )}

        {showingFeedback && (
          (() => {
            const correctCount = Object.entries(connections).filter(([l, r]) => isConnectionCorrect(parseInt(l), r)).length;
            return allCorrect ? (
              <BaseBadge variant="success" size="lg" className="text-base px-4 py-2">
                ¡Perfecto! Todas correctas
              </BaseBadge>
            ) : correctCount > 0 ? (
              <BaseBadge variant="warning" size="lg" className="text-base px-4 py-2">
                {correctCount} / {pairs.length} correctos
              </BaseBadge>
            ) : (
              <BaseBadge variant="danger" size="lg" className="text-base px-4 py-2">
                Ninguno correcto
              </BaseBadge>
            );
          })()
        )}
      </div>
    </div>
  );
}

export default MatchingRenderer;
