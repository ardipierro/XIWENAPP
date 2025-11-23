/**
 * @fileoverview Componente de visualización de Cuadro Informativo
 * @module components/container/InfoTableDisplay
 *
 * Muestra tablas informativas con opciones de interactividad:
 * - hover-reveal: Revelar al pasar mouse
 * - click-reveal: Revelar al hacer click
 * - flashcards: Modo de estudio con tarjetas
 * - quiz: Ocultar celdas para practicar
 */

import { useState, useMemo, useCallback } from 'react';
import { Volume2, Eye, EyeOff, RotateCcw, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { BaseButton } from '../common';
import logger from '../../utils/logger';

/**
 * Componente principal de visualización
 */
function InfoTableDisplay({ data = {}, config = {} }) {
  // Merge config con defaults
  const mergedConfig = useMemo(() => ({
    tableStyle: 'striped',
    headerColor: '#8b5cf6',
    headerTextColor: '#ffffff',
    alternateRowColor: '#f3f4f6',
    interactiveMode: 'none',
    revealColumn: 1,
    animationsEnabled: true,
    animationSpeed: 'normal',
    audioEnabled: false,
    ttsLanguage: 'es-ES',
    fontSize: 'medium',
    roundedCorners: true,
    showBorders: true,
    showNotes: true,
    compactMode: false,
    noteColor: '#fef3c7',
    noteBorderColor: '#f59e0b',
    ...config
  }), [config]);

  const { title, columns = [], rows = [], notes = [] } = data;

  // Estado para modos interactivos
  const [revealedCells, setRevealedCells] = useState(new Set());
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [quizHiddenCells, setQuizHiddenCells] = useState(new Set());

  // Inicializar quiz mode
  useMemo(() => {
    if (mergedConfig.interactiveMode === 'quiz' && rows.length > 0) {
      const hidden = new Set();
      rows.forEach((_, rowIdx) => {
        // Ocultar aleatoriamente columna 0 o 1
        const colToHide = Math.random() > 0.5 ? 0 : 1;
        hidden.add(`${rowIdx}-${colToHide}`);
      });
      setQuizHiddenCells(hidden);
    }
  }, [mergedConfig.interactiveMode, rows.length]);

  /**
   * Obtener clases de animación
   */
  const getAnimationClass = useCallback(() => {
    if (!mergedConfig.animationsEnabled) return '';
    const speeds = {
      slow: 'duration-500',
      normal: 'duration-300',
      fast: 'duration-150'
    };
    return `transition-all ${speeds[mergedConfig.animationSpeed] || 'duration-300'}`;
  }, [mergedConfig.animationsEnabled, mergedConfig.animationSpeed]);

  /**
   * Obtener tamaño de fuente
   */
  const getFontSize = useCallback(() => {
    const sizes = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg'
    };
    return sizes[mergedConfig.fontSize] || 'text-base';
  }, [mergedConfig.fontSize]);

  /**
   * Text to Speech
   */
  const speakText = useCallback((text) => {
    if (!mergedConfig.audioEnabled || !window.speechSynthesis) return;

    // Limpiar caracteres chinos de explicación para TTS en español
    const cleanText = text.replace(/[\u4e00-\u9fff]+/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = mergedConfig.ttsLanguage;
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    logger.info('TTS speaking', 'InfoTableDisplay', { text: cleanText, lang: mergedConfig.ttsLanguage });
  }, [mergedConfig.audioEnabled, mergedConfig.ttsLanguage]);

  /**
   * Manejar click en celda
   */
  const handleCellClick = useCallback((rowIdx, colIdx, content) => {
    const cellKey = `${rowIdx}-${colIdx}`;

    // TTS
    if (mergedConfig.audioEnabled) {
      speakText(content);
    }

    // Click-reveal mode
    if (mergedConfig.interactiveMode === 'click-reveal') {
      setRevealedCells(prev => {
        const next = new Set(prev);
        if (next.has(cellKey)) {
          next.delete(cellKey);
        } else {
          next.add(cellKey);
        }
        return next;
      });
    }

    // Quiz mode
    if (mergedConfig.interactiveMode === 'quiz' && quizHiddenCells.has(cellKey)) {
      setQuizHiddenCells(prev => {
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });
    }
  }, [mergedConfig.audioEnabled, mergedConfig.interactiveMode, quizHiddenCells, speakText]);

  /**
   * Verificar si celda debe estar oculta
   */
  const isCellHidden = useCallback((rowIdx, colIdx) => {
    const cellKey = `${rowIdx}-${colIdx}`;

    switch (mergedConfig.interactiveMode) {
      case 'click-reveal':
        return colIdx === mergedConfig.revealColumn && !revealedCells.has(cellKey);
      case 'quiz':
        return quizHiddenCells.has(cellKey);
      default:
        return false;
    }
  }, [mergedConfig.interactiveMode, mergedConfig.revealColumn, revealedCells, quizHiddenCells]);

  /**
   * Renderizar celda
   */
  const renderCell = useCallback((content, rowIdx, colIdx, isHeader = false) => {
    const cellKey = `${rowIdx}-${colIdx}`;
    const isHidden = !isHeader && isCellHidden(rowIdx, colIdx);
    const isHoverReveal = mergedConfig.interactiveMode === 'hover-reveal' && colIdx === mergedConfig.revealColumn;

    const cellStyle = {
      padding: mergedConfig.compactMode ? '0.5rem' : '0.75rem 1rem',
      borderColor: mergedConfig.showBorders ? 'var(--color-border)' : 'transparent',
      ...(isHeader && {
        backgroundColor: mergedConfig.headerColor,
        color: mergedConfig.headerTextColor
      })
    };

    const cellClasses = `
      ${getAnimationClass()}
      ${isHoverReveal ? 'group' : ''}
      ${mergedConfig.audioEnabled || mergedConfig.interactiveMode !== 'none' ? 'cursor-pointer hover:bg-opacity-80' : ''}
    `;

    return (
      <td
        key={cellKey}
        className={cellClasses}
        style={cellStyle}
        onClick={() => !isHeader && handleCellClick(rowIdx, colIdx, content)}
      >
        <div className="flex items-center gap-2">
          {/* Contenido */}
          {isHidden ? (
            <span className="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Click para revelar</span>
            </span>
          ) : isHoverReveal ? (
            <span className="group-hover:opacity-100 opacity-0 transition-opacity">
              {content}
            </span>
          ) : (
            <span>{content}</span>
          )}

          {/* Icono de audio */}
          {mergedConfig.audioEnabled && !isHeader && !isHidden && (
            <Volume2
              className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-blue-500 transition-all flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                speakText(content);
              }}
            />
          )}
        </div>
      </td>
    );
  }, [
    mergedConfig, isCellHidden, getAnimationClass, handleCellClick, speakText
  ]);

  /**
   * Reiniciar modo interactivo
   */
  const resetInteractive = useCallback(() => {
    setRevealedCells(new Set());
    setFlashcardIndex(0);
    setFlashcardFlipped(false);

    if (mergedConfig.interactiveMode === 'quiz') {
      const hidden = new Set();
      rows.forEach((_, rowIdx) => {
        const colToHide = Math.random() > 0.5 ? 0 : 1;
        hidden.add(`${rowIdx}-${colToHide}`);
      });
      setQuizHiddenCells(hidden);
    }
  }, [mergedConfig.interactiveMode, rows]);

  /**
   * Renderizar modo Flashcards
   */
  const renderFlashcards = () => {
    if (rows.length === 0) return null;

    const currentRow = rows[flashcardIndex];
    const progress = ((flashcardIndex + 1) / rows.length) * 100;

    return (
      <div className="space-y-4">
        {/* Progreso */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {flashcardIndex + 1} / {rows.length}
          </span>
        </div>

        {/* Tarjeta */}
        <div
          className={`
            relative min-h-[200px] p-8 rounded-xl shadow-lg cursor-pointer
            flex items-center justify-center text-center
            ${getAnimationClass()}
          `}
          style={{
            backgroundColor: flashcardFlipped ? mergedConfig.headerColor : 'var(--color-bg-secondary)',
            color: flashcardFlipped ? mergedConfig.headerTextColor : 'var(--color-text-primary)',
            transform: flashcardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transformStyle: 'preserve-3d'
          }}
          onClick={() => setFlashcardFlipped(!flashcardFlipped)}
        >
          <div className={`text-xl ${getFontSize()}`} style={{ transform: flashcardFlipped ? 'rotateY(180deg)' : 'none' }}>
            {flashcardFlipped ? (
              currentRow[1] || currentRow[0]
            ) : (
              currentRow[0]
            )}
          </div>

          {/* Indicador de flip */}
          <div className="absolute bottom-4 right-4">
            <RotateCcw className="w-5 h-5 opacity-50" />
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-center gap-4">
          <BaseButton
            variant="secondary"
            icon={ChevronLeft}
            onClick={() => {
              setFlashcardIndex(prev => (prev - 1 + rows.length) % rows.length);
              setFlashcardFlipped(false);
            }}
            disabled={rows.length <= 1}
          >
            Anterior
          </BaseButton>

          <BaseButton
            variant="ghost"
            icon={RotateCcw}
            onClick={resetInteractive}
          >
            Reiniciar
          </BaseButton>

          <BaseButton
            variant="secondary"
            icon={ChevronRight}
            iconPosition="right"
            onClick={() => {
              setFlashcardIndex(prev => (prev + 1) % rows.length);
              setFlashcardFlipped(false);
            }}
            disabled={rows.length <= 1}
          >
            Siguiente
          </BaseButton>
        </div>
      </div>
    );
  };

  /**
   * Renderizar tabla normal
   */
  const renderTable = () => {
    const tableClasses = `
      w-full ${getFontSize()}
      ${mergedConfig.roundedCorners ? 'rounded-lg overflow-hidden' : ''}
      ${mergedConfig.showBorders ? 'border' : ''}
    `;

    return (
      <div className="overflow-x-auto">
        <table
          className={tableClasses}
          style={{ borderColor: 'var(--color-border)' }}
        >
          {/* Headers */}
          {columns.length > 0 && (
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className="font-semibold text-left"
                    style={{
                      backgroundColor: mergedConfig.headerColor,
                      color: mergedConfig.headerTextColor,
                      padding: mergedConfig.compactMode ? '0.5rem' : '0.75rem 1rem',
                      borderColor: mergedConfig.showBorders ? 'var(--color-border)' : 'transparent'
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
          )}

          {/* Body */}
          <tbody>
            {rows.map((row, rowIdx) => {
              const isAlternate = mergedConfig.tableStyle === 'striped' && rowIdx % 2 === 1;

              return (
                <tr
                  key={rowIdx}
                  className={`${getAnimationClass()} group`}
                  style={{
                    backgroundColor: isAlternate ? mergedConfig.alternateRowColor : 'var(--color-bg-primary)'
                  }}
                >
                  {row.map((cell, colIdx) => renderCell(cell, rowIdx, colIdx))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  /**
   * Renderizar modo Cards
   */
  const renderCards = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className={`
              p-4 rounded-lg shadow-sm border group
              ${getAnimationClass()}
              ${mergedConfig.audioEnabled || mergedConfig.interactiveMode !== 'none' ? 'cursor-pointer hover:shadow-md' : ''}
            `}
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)'
            }}
            onClick={() => handleCellClick(rowIdx, 0, row.join(' '))}
          >
            {row.map((cell, colIdx) => (
              <div
                key={colIdx}
                className={`${colIdx > 0 ? 'mt-2 pt-2 border-t' : ''}`}
                style={{ borderColor: 'var(--color-border)' }}
              >
                {columns[colIdx] && (
                  <span
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: mergedConfig.headerColor }}
                  >
                    {columns[colIdx]}
                  </span>
                )}
                <p className={`${getFontSize()} mt-1`} style={{ color: 'var(--color-text-primary)' }}>
                  {isCellHidden(rowIdx, colIdx) ? (
                    <span className="text-gray-400">Click para revelar</span>
                  ) : (
                    cell
                  )}
                </p>
              </div>
            ))}

            {mergedConfig.audioEnabled && (
              <Volume2 className="w-4 h-4 text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Título */}
      {title && (
        <h3
          className="text-xl font-bold flex items-center gap-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          <Lightbulb className="w-5 h-5" style={{ color: mergedConfig.headerColor }} />
          {title}
        </h3>
      )}

      {/* Controles interactivos */}
      {mergedConfig.interactiveMode !== 'none' && mergedConfig.interactiveMode !== 'flashcards' && (
        <div className="flex items-center justify-end">
          <BaseButton
            size="sm"
            variant="ghost"
            icon={RotateCcw}
            onClick={resetInteractive}
          >
            Reiniciar
          </BaseButton>
        </div>
      )}

      {/* Contenido principal */}
      {mergedConfig.interactiveMode === 'flashcards' ? (
        renderFlashcards()
      ) : mergedConfig.tableStyle === 'cards' ? (
        renderCards()
      ) : (
        renderTable()
      )}

      {/* Notas */}
      {mergedConfig.showNotes && notes.length > 0 && (
        <div
          className="mt-4 p-4 rounded-lg border-l-4"
          style={{
            backgroundColor: mergedConfig.noteColor,
            borderLeftColor: mergedConfig.noteBorderColor
          }}
        >
          {notes.map((note, idx) => (
            <p
              key={idx}
              className={`${idx > 0 ? 'mt-2' : ''} text-sm`}
              style={{ color: 'var(--color-text-primary)' }}
            >
              {note}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default InfoTableDisplay;
