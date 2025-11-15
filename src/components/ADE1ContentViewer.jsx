/**
 * @fileoverview Visualizador de contenido ADE1 2026 - Versión mejorada
 * @module components/ADE1ContentViewer
 *
 * Features:
 * - Scroll infinito vertical
 * - Menú lateral con temas agrupados
 * - Sistema de exportación (JSON, Markdown, PDF)
 * - Imágenes de Unsplash automáticas
 * - Ejercicios interactivos React
 *
 * 100% Tailwind CSS | Dark Mode | Mobile First
 */

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Search,
  Download,
  FileText,
  FileJson,
  Grid3x3,
  List,
  Image as ImageIcon
} from 'lucide-react';
import { BaseButton, BaseLoading, BaseAlert, BaseBadge } from './common';
import logger from '../utils/logger';

// Unsplash Access Key (público, sin riesgo)
const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY_HERE';

// Temas/Unidades del libro con rangos de slides
const BOOK_THEMES = [
  { id: 'fonetica', name: '🎵 Fonética', slides: [1, 10], color: 'blue' },
  { id: 'vocabulario', name: '📝 Vocabulario Básico', slides: [7, 10], color: 'green' },
  { id: 'dias-meses', name: '📅 Días y Meses', slides: [11, 13], color: 'purple' },
  { id: 'colores', name: '🎨 Colores', slides: [14, 14], color: 'pink' },
  { id: 'abecedario', name: '🔤 Abecedario', slides: [15, 16], color: 'indigo' },
  { id: 'acentuacion', name: '✍️ Acentuación', slides: [17, 22], color: 'yellow' },
  { id: 'frases-clase', name: '💬 Frases de Clase', slides: [23, 25], color: 'teal' },
  { id: 'clima', name: '☁️ Clima', slides: [26, 34], color: 'cyan' },
  { id: 'numeros', name: '🔢 Números', slides: [35, 47], color: 'orange' },
  { id: 'info-personal', name: '👤 Info Personal', slides: [48, 77], color: 'red' },
  { id: 'profesiones', name: '💼 Profesiones', slides: [76, 77], color: 'lime' },
  { id: 'textos', name: '📖 Comprensión Lectora', slides: [78, 93], color: 'emerald' },
  { id: 'gramatica', name: '📚 Gramática (Plural)', slides: [94, 101], color: 'violet' },
  { id: 'adjetivos', name: '✨ Adjetivos Descriptivos', slides: [102, 103], color: 'fuchsia' },
  { id: 'posesivos', name: '🤝 Posesivos', slides: [104, 118], color: 'rose' },
  { id: 'demostrativos', name: '👈 Demostrativos', slides: [119, 123], color: 'amber' },
  { id: 'estar', name: '📍 Verbo ESTAR', slides: [124, 128], color: 'blue' },
  { id: 'adverbios-lugar', name: '🗺️ Adverbios de Lugar', slides: [129, 142], color: 'green' },
  { id: 'envases', name: '📦 Envases y Cantidades', slides: [143, 145], color: 'purple' },
  { id: 'interrogativas', name: '❓ Palabras Interrogativas', slides: [146, 155], color: 'pink' },
  { id: 'descripcion-casa', name: '🏠 Descripción de Casa', slides: [156, 164], color: 'indigo' },
  { id: 'hora', name: '🕐 ¿Qué Hora Es?', slides: [165, 176], color: 'cyan' },
  { id: 'ser-estar', name: '⚖️ SER vs ESTAR', slides: [177, 187], color: 'orange' }
];

// Mapa de keywords para búsqueda de imágenes en Unsplash
const IMAGE_KEYWORDS_MAP = {
  'colores': ['color palette', 'rainbow', 'paint'],
  'clima_soleado': ['sunny day', 'sun', 'clear sky'],
  'clima_lluvioso': ['rain', 'rainy day', 'umbrella'],
  'familia': ['family', 'reunion', 'togetherness'],
  'profesiones_doctor': ['doctor', 'stethoscope', 'medical'],
  'profesiones_profesor': ['teacher', 'classroom', 'teaching'],
  'casa': ['house', 'home exterior', 'apartment'],
  'reloj': ['clock', 'time', 'watch'],
  'default': ['spanish', 'learning', 'education']
};

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
            size="sm"
            disabled={!userAnswer.trim()}
          >
            Comprobar
          </BaseButton>
        ) : (
          <BaseButton onClick={handleReset} variant="outline" size="sm">
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
            size="sm"
            disabled={!selectedAnswer}
          >
            Comprobar
          </BaseButton>
        ) : (
          <BaseButton onClick={handleReset} variant="outline" size="sm">
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
 * Imagen de Unsplash con fallback
 */
function UnsplashImage({ keyword, alt, className }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Si no hay access key, usar placeholder
    if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY_HERE') {
      setImageUrl(`https://via.placeholder.com/400x300?text=${encodeURIComponent(keyword)}`);
      setLoading(false);
      return;
    }

    const fetchImage = async () => {
      try {
        const response = await fetch(
          `https://api.unsplash.com/photos/random?query=${encodeURIComponent(keyword)}&client_id=${UNSPLASH_ACCESS_KEY}`
        );
        const data = await response.json();
        setImageUrl(data.urls.regular);
      } catch (err) {
        logger.error('Error fetching Unsplash image:', err);
        setError(true);
        setImageUrl(`https://via.placeholder.com/400x300?text=${encodeURIComponent(keyword)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [keyword]);

  if (loading) {
    return (
      <div className={`${className} bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg flex items-center justify-center`}>
        <ImageIcon className="text-gray-400" size={40} />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`${className} rounded-lg object-cover`}
      loading="lazy"
    />
  );
}

/**
 * Componente principal: Visualizador de contenido ADE1 - VERSIÓN MEJORADA
 */
export default function ADE1ContentViewer() {
  const [contentData, setContentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [exerciseResults, setExerciseResults] = useState({});
  const [viewMode, setViewMode] = useState('scroll'); // 'scroll' | 'single'
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportRange, setExportRange] = useState({ from: 0, to: 120 });

  const scrollContainerRef = useRef(null);
  const slideRefs = useRef({});

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

  // Scroll to slide cuando cambia currentSlide en modo single
  useEffect(() => {
    if (viewMode === 'single' && slideRefs.current[currentSlide]) {
      slideRefs.current[currentSlide].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentSlide, viewMode]);

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleNextSlide = () => {
    if (contentData && currentSlide < Math.min(contentData.slides.length - 1, 179)) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleGoToSlide = (slideNumber) => {
    setCurrentSlide(slideNumber);
    setSideMenuOpen(false);

    if (viewMode === 'scroll' && slideRefs.current[slideNumber]) {
      slideRefs.current[slideNumber].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleGoToTheme = (theme) => {
    setSelectedTheme(theme);
    const firstSlide = theme.slides[0] - 1; // Convert to 0-indexed
    handleGoToSlide(firstSlide);
  };

  const handleExerciseComplete = (slideId, exerciseId, isCorrect) => {
    setExerciseResults(prev => ({
      ...prev,
      [`${slideId}-${exerciseId}`]: isCorrect
    }));
  };

  const handleExport = (format) => {
    const slidesToExport = contentData.slides.slice(exportRange.from, exportRange.to + 1);

    let exportData;
    let filename;

    switch (format) {
      case 'json':
        exportData = JSON.stringify(slidesToExport, null, 2);
        filename = `ade1_slides_${exportRange.from + 1}-${exportRange.to + 1}.json`;
        downloadFile(exportData, filename, 'application/json');
        break;

      case 'markdown':
        exportData = slidesToMarkdown(slidesToExport);
        filename = `ade1_slides_${exportRange.from + 1}-${exportRange.to + 1}.md`;
        downloadFile(exportData, filename, 'text/markdown');
        break;

      default:
        logger.warn('Formato de exportación no soportado:', format);
    }

    setExportModalOpen(false);
  };

  const slidesToMarkdown = (slides) => {
    let markdown = `# ADE1 2026 - Slides ${exportRange.from + 1} a ${exportRange.to + 1}\n\n`;

    slides.forEach((slide) => {
      markdown += `## Slide ${slide.slide_number}\n\n`;

      if (slide.title) {
        markdown += `**${slide.title}**\n\n`;
      }

      if (slide.content) {
        slide.content.forEach((item) => {
          item.content.forEach((textItem) => {
            markdown += `${textItem.text}\n\n`;
          });
        });
      }

      if (slide.tables && slide.tables.length > 0) {
        markdown += `*[Tabla con ${slide.tables[0].rows} filas]*\n\n`;
      }

      markdown += `---\n\n`;
    });

    return markdown;
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  const visibleSlides = contentData.slides.slice(0, 180); // Primeras 180 slides
  const totalSlides = visibleSlides.length;

  // Generar ejercicios dinámicos basados en el contenido del slide
  const generateExercises = (slide) => {
    const exercises = [];

    // Ejemplo 1: Slides de sílabas
    if (slide.tables && slide.tables.length > 0 && slide.slide_number >= 2 && slide.slide_number <= 5) {
      const table = slide.tables[0];
      if (table.data && table.data.length > 0) {
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

    // Ejemplo 2: Vocabulario
    if (slide.tables && slide.slide_number >= 7 && slide.slide_number <= 10) {
      const table = slide.tables[0];
      if (table.data && table.data.length > 0) {
        const row = table.data[Math.floor(Math.random() * Math.min(table.data.length, 3))];
        if (row.length >= 4) {
          exercises.push({
            id: `vocab-${slide.slide_number}`,
            type: 'multiple',
            question: `¿Cómo se dice "${row[3]}" en español?`,
            options: [row[0], 'casa', 'gato', 'familia'].slice(0, 4),
            correctAnswer: row[0]
          });
        }
      }
    }

    return exercises;
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Menú lateral con temas */}
      <div
        className={`
          fixed lg:static top-0 left-0 h-full w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-200 z-50 overflow-y-auto
          ${sideMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
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

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-accent-500"
            />
          </div>

          <div className="flex gap-2">
            <BaseButton
              onClick={() => setViewMode('scroll')}
              variant={viewMode === 'scroll' ? 'primary' : 'outline'}
              size="sm"
              leftIcon={<List size={14} />}
            >
              Scroll
            </BaseButton>
            <BaseButton
              onClick={() => setViewMode('single')}
              variant={viewMode === 'single' ? 'primary' : 'outline'}
              size="sm"
              leftIcon={<Grid3x3 size={14} />}
            >
              Slide
            </BaseButton>
          </div>
        </div>

        {/* Lista de temas */}
        <div className="p-2">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-3 py-2">
            Temas
          </h4>
          {BOOK_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleGoToTheme(theme)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors
                ${selectedTheme?.id === theme.id
                  ? 'bg-accent-500 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <div className="flex items-center justify-between">
                <span>{theme.name}</span>
                <span className="text-xs opacity-70">
                  {theme.slides[0]}-{theme.slides[1]}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
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
                  {viewMode === 'scroll' ? '180 slides' : `Slide ${currentSlide + 1} de ${totalSlides}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BaseButton
                onClick={() => setExportModalOpen(true)}
                variant="outline"
                size="sm"
                leftIcon={<Download size={14} />}
              >
                Exportar
              </BaseButton>

              <BaseBadge variant="info">
                {Math.round((currentSlide / totalSlides) * 100)}%
              </BaseBadge>
            </div>
          </div>
        </div>

        {/* Slides content - Scroll infinito */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6"
        >
          <div className="max-w-4xl mx-auto space-y-8">
            {visibleSlides.map((slide, index) => {
              const exercises = generateExercises(slide);

              return (
                <div
                  key={slide.slide_number}
                  ref={(el) => (slideRefs.current[index] = el)}
                  className="scroll-mt-20"
                >
                  {/* Separador visual entre slides */}
                  {index > 0 && (
                    <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-600 my-8"></div>
                  )}

                  {/* Header del slide */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <BaseBadge variant="primary">
                        Slide {slide.slide_number}
                      </BaseBadge>

                      {slide.title && (
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {slide.title}
                        </h2>
                      )}
                    </div>

                    <BaseButton
                      onClick={() => handleGoToSlide(index)}
                      variant="ghost"
                      size="sm"
                    >
                      Ir a esta slide
                    </BaseButton>
                  </div>

                  {/* Contenido de texto */}
                  {slide.content && slide.content.map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm mb-4">
                      {item.content.map((textItem, textIdx) => (
                        <p
                          key={textIdx}
                          className={`text-gray-900 dark:text-gray-100 mb-2
                            ${textItem.bold ? 'font-bold' : ''}
                            ${textItem.italic ? 'italic' : ''}
                          `}
                          style={{ fontSize: textItem.font_size ? `${textItem.font_size * 0.7}px` : '14px' }}
                        >
                          {textItem.text}
                        </p>
                      ))}
                    </div>
                  ))}

                  {/* Tablas */}
                  {slide.tables && slide.tables.map((table, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm overflow-x-auto mb-4">
                      <TableRenderer tableData={table} />
                    </div>
                  ))}

                  {/* Imágenes de Unsplash (ejemplo) */}
                  {slide.slide_number === 14 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <UnsplashImage keyword="color red" alt="Rojo" className="w-full h-32" />
                      <UnsplashImage keyword="color blue" alt="Azul" className="w-full h-32" />
                      <UnsplashImage keyword="color yellow" alt="Amarillo" className="w-full h-32" />
                      <UnsplashImage keyword="color green" alt="Verde" className="w-full h-32" />
                    </div>
                  )}

                  {/* Ejercicios generados */}
                  {exercises.length > 0 && (
                    <div className="space-y-4 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Play size={18} className="text-accent-500" />
                        Ejercicios Interactivos
                      </h3>

                      {exercises.map((exercise, exIdx) => (
                        <div key={exercise.id}>
                          {exercise.type === 'fill' && (
                            <FillInBlankExercise
                              question={exercise.question}
                              answer={exercise.answer}
                              onComplete={(isCorrect) => handleExerciseComplete(index, exIdx, isCorrect)}
                            />
                          )}
                          {exercise.type === 'multiple' && (
                            <MultipleChoiceExercise
                              question={exercise.question}
                              options={exercise.options}
                              correctAnswer={exercise.correctAnswer}
                              onComplete={(isCorrect) => handleExerciseComplete(index, exIdx, isCorrect)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer de navegación (solo en modo single) */}
        {viewMode === 'single' && (
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <BaseButton
                onClick={handlePrevSlide}
                disabled={currentSlide === 0}
                variant="outline"
                leftIcon={<ChevronLeft size={16} />}
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
                rightIcon={<ChevronRight size={16} />}
              >
                Siguiente
              </BaseButton>
            </div>
          </div>
        )}
      </div>

      {/* Modal de exportación */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Exportar Contenido
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rango de slides
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      min="0"
                      max={totalSlides - 1}
                      value={exportRange.from}
                      onChange={(e) => setExportRange(prev => ({ ...prev, from: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      placeholder="Desde"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min={exportRange.from}
                      max={totalSlides - 1}
                      value={exportRange.to}
                      onChange={(e) => setExportRange(prev => ({ ...prev, to: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      placeholder="Hasta"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formato
                </label>
                <div className="flex gap-2">
                  <BaseButton
                    onClick={() => handleExport('json')}
                    variant="outline"
                    leftIcon={<FileJson size={16} />}
                  >
                    JSON
                  </BaseButton>
                  <BaseButton
                    onClick={() => handleExport('markdown')}
                    variant="outline"
                    leftIcon={<FileText size={16} />}
                  >
                    Markdown
                  </BaseButton>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <BaseButton
                onClick={() => setExportModalOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para mobile */}
      {sideMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSideMenuOpen(false)}
        />
      )}
    </div>
  );
}
