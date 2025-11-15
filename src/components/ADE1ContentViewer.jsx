/**
 * @fileoverview Visualizador de contenido ADE1 2026
 * @module components/ADE1ContentViewer
 *
 * Muestra los slides del libro ADE1_2026 con ejercicios interactivos
 * 100% Tailwind CSS | Dark Mode | Mobile First
 */

import { useState, useEffect } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Play,
  Volume2,
  CheckCircle,
  XCircle,
  Menu,
  X,
  Filter,
  Search
} from 'lucide-react';
import { BaseButton, BaseLoading, BaseAlert, BaseBadge } from './common';
import logger from '../utils/logger';

/**
 * Componente de ejercicio simple: Fill in the Blank
 */
function FillInBlankExercise({ question, answer, onComplete }) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleCheck = () => {
    const correct = userAnswer.trim().toLowerCase() === answer.toLowerCase();
    setIsCorrect(correct);
    setIsChecked(true);
    if (onComplete) {
      onComplete(correct);
    }
  };

  const handleReset = () => {
    setUserAnswer('');
    setIsChecked(false);
    setIsCorrect(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <p className="text-gray-900 dark:text-gray-100 mb-3 font-medium">
        {question}
      </p>

      <input
        type="text"
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        disabled={isChecked}
        placeholder="Escribe tu respuesta..."
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                   focus:ring-2 focus:ring-accent-500 dark:focus:ring-accent-400
                   disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {isChecked && (
        <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
          isCorrect
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          {isCorrect ? (
            <>
              <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
              <span className="text-green-700 dark:text-green-300 font-medium">¡Correcto!</span>
            </>
          ) : (
            <>
              <XCircle className="text-red-600 dark:text-red-400" size={20} />
              <span className="text-red-700 dark:text-red-300">
                Incorrecto. La respuesta correcta es: <strong>{answer}</strong>
              </span>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        {!isChecked ? (
          <BaseButton
            onClick={handleCheck}
            variant="primary"
            disabled={!userAnswer.trim()}
          >
            Comprobar
          </BaseButton>
        ) : (
          <BaseButton onClick={handleReset} variant="outline">
            Intentar de nuevo
          </BaseButton>
        )}
      </div>
    </div>
  );
}

/**
 * Componente de ejercicio: Multiple Choice
 */
function MultipleChoiceExercise({ question, options, correctAnswer, onComplete }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleCheck = () => {
    const correct = selectedAnswer === correctAnswer;
    setIsCorrect(correct);
    setIsChecked(true);
    if (onComplete) {
      onComplete(correct);
    }
  };

  const handleReset = () => {
    setSelectedAnswer(null);
    setIsChecked(false);
    setIsCorrect(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <p className="text-gray-900 dark:text-gray-100 mb-4 font-medium">
        {question}
      </p>

      <div className="space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => !isChecked && setSelectedAnswer(option)}
            disabled={isChecked}
            className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all
              ${selectedAnswer === option
                ? isChecked
                  ? option === correctAnswer
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-accent-300 dark:hover:border-accent-600'
              }
              ${isChecked ? 'cursor-not-allowed' : 'cursor-pointer'}
              text-gray-900 dark:text-gray-100
            `}
          >
            {option}
          </button>
        ))}
      </div>

      {isChecked && (
        <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
          isCorrect
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          {isCorrect ? (
            <>
              <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
              <span className="text-green-700 dark:text-green-300 font-medium">¡Correcto!</span>
            </>
          ) : (
            <>
              <XCircle className="text-red-600 dark:text-red-400" size={20} />
              <span className="text-red-700 dark:text-red-300">
                Incorrecto. La respuesta correcta es: <strong>{correctAnswer}</strong>
              </span>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        {!isChecked ? (
          <BaseButton
            onClick={handleCheck}
            variant="primary"
            disabled={!selectedAnswer}
          >
            Comprobar
          </BaseButton>
        ) : (
          <BaseButton onClick={handleReset} variant="outline">
            Intentar de nuevo
          </BaseButton>
        )}
      </div>
    </div>
  );
}

/**
 * Renderizador de tabla
 */
function TableRenderer({ tableData }) {
  if (!tableData || !tableData.data) return null;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <tbody>
          {tableData.data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-200 dark:border-gray-700">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-2 text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Componente principal: Visualizador de contenido ADE1
 */
export default function ADE1ContentViewer() {
  const [contentData, setContentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [exerciseResults, setExerciseResults] = useState({});

  // Cargar el JSON del contenido
  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch('/xiwen_contenidos/ade1_2026_content.json');
        const data = await response.json();
        setContentData(data);
        logger.info('Contenido ADE1 cargado:', data.metadata);
      } catch (error) {
        logger.error('Error cargando contenido ADE1:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleNextSlide = () => {
    if (contentData && currentSlide < contentData.slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleGoToSlide = (slideNumber) => {
    setCurrentSlide(slideNumber);
    setSideMenuOpen(false);
  };

  const handleExerciseComplete = (slideId, exerciseId, isCorrect) => {
    setExerciseResults(prev => ({
      ...prev,
      [`${slideId}-${exerciseId}`]: isCorrect
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <BaseLoading size="large" text="Cargando contenido ADE1 2026..." />
      </div>
    );
  }

  if (!contentData) {
    return (
      <div className="p-6">
        <BaseAlert variant="error" title="Error">
          No se pudo cargar el contenido del libro ADE1 2026.
        </BaseAlert>
      </div>
    );
  }

  const slide = contentData.slides[currentSlide];
  const totalSlides = contentData.slides.length;

  // Generar ejercicios dinámicos basados en el contenido del slide
  const generateExercises = (slide) => {
    const exercises = [];

    // Ejemplo 1: Si el slide tiene tablas de sílabas (slides 2-5)
    if (slide.tables && slide.tables.length > 0 && slide.slide_number >= 2 && slide.slide_number <= 5) {
      const table = slide.tables[0];
      if (table.data && table.data.length > 0) {
        // Crear ejercicio de completar sílabas
        const firstRow = table.data[0];
        if (firstRow.length > 2) {
          exercises.push({
            id: `syllable-${slide.slide_number}`,
            type: 'fill',
            question: `Completa: ${firstRow[0]} + a = ?`,
            answer: firstRow[2]
          });
        }
      }
    }

    // Ejemplo 2: Si el slide tiene vocabulario con traducción (slides 7-10)
    if (slide.tables && slide.slide_number >= 7 && slide.slide_number <= 10) {
      const table = slide.tables[0];
      if (table.data && table.data.length > 0) {
        const row = table.data[Math.floor(Math.random() * table.data.length)];
        if (row.length >= 4) {
          exercises.push({
            id: `vocab-${slide.slide_number}`,
            type: 'multiple',
            question: `¿Cómo se dice "${row[3]}" en español?`,
            options: [row[1], 'casa', 'gato', 'familia'].slice(0, 4),
            correctAnswer: row[1]
          });
        }
      }
    }

    return exercises;
  };

  const exercises = generateExercises(slide);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gray-50 dark:bg-gray-900">
      {/* Menú lateral (navegación de slides) */}
      <div
        className={`
          fixed lg:static top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-200 z-50
          ${sideMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              ADE1 2026
            </h3>
            <button
              onClick={() => setSideMenuOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar slide..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-accent-500"
            />
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100%-120px)]">
          <div className="p-2 space-y-1">
            {contentData.slides.slice(0, 120).map((s, index) => (
              <button
                key={index}
                onClick={() => handleGoToSlide(index)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                  ${currentSlide === index
                    ? 'bg-accent-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span>Slide {index + 1}</span>
                  {exerciseResults[`${index}-0`] !== undefined && (
                    <span className="text-xs">
                      {exerciseResults[`${index}-0`] ? '✓' : '✗'}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSideMenuOpen(true)}
                className="lg:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <Menu size={24} />
              </button>

              <BookOpen className="text-accent-500" size={24} />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Fonética ADE1 2026
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Slide {currentSlide + 1} de {totalSlides}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BaseBadge variant="info">
                {Math.round((currentSlide / totalSlides) * 100)}% Completado
              </BaseBadge>
            </div>
          </div>
        </div>

        {/* Slide content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Título del slide */}
            {slide.title && (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {slide.title}
              </h2>
            )}

            {/* Contenido de texto */}
            {slide.content && slide.content.map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                {item.content.map((textItem, textIndex) => (
                  <p
                    key={textIndex}
                    className={`text-gray-900 dark:text-gray-100 mb-2
                      ${textItem.bold ? 'font-bold' : ''}
                      ${textItem.italic ? 'italic' : ''}
                    `}
                    style={{ fontSize: textItem.font_size ? `${textItem.font_size}px` : '16px' }}
                  >
                    {textItem.text}
                  </p>
                ))}
              </div>
            ))}

            {/* Tablas */}
            {slide.tables && slide.tables.map((table, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm overflow-x-auto">
                <TableRenderer tableData={table} />
              </div>
            ))}

            {/* Ejercicios generados dinámicamente */}
            {exercises.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Play size={20} className="text-accent-500" />
                  Ejercicios Interactivos
                </h3>

                {exercises.map((exercise, index) => (
                  <div key={exercise.id}>
                    {exercise.type === 'fill' && (
                      <FillInBlankExercise
                        question={exercise.question}
                        answer={exercise.answer}
                        onComplete={(isCorrect) => handleExerciseComplete(currentSlide, index, isCorrect)}
                      />
                    )}
                    {exercise.type === 'multiple' && (
                      <MultipleChoiceExercise
                        question={exercise.question}
                        options={exercise.options}
                        correctAnswer={exercise.correctAnswer}
                        onComplete={(isCorrect) => handleExerciseComplete(currentSlide, index, isCorrect)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Notas del profesor */}
            {slide.notes && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Nota:</strong> {slide.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer de navegación */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <BaseButton
              onClick={handlePrevSlide}
              disabled={currentSlide === 0}
              variant="outline"
              icon={ChevronLeft}
            >
              Anterior
            </BaseButton>

            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentSlide + 1} / {totalSlides}
            </span>

            <BaseButton
              onClick={handleNextSlide}
              disabled={currentSlide === totalSlides - 1}
              variant="primary"
              iconRight={ChevronRight}
            >
              Siguiente
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  );
}
