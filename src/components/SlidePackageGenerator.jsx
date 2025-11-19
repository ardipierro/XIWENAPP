/**
 * @fileoverview Generador temporal de paquetes de diapositivas para exportar a Content Manager
 * @module components/SlidePackageGenerator
 *
 * Componente temporal para:
 * - Cargar slides desde ade1_2026_content.json
 * - Previsualizar y editar contenido
 * - Detectar automáticamente tipos de ejercicios
 * - Exportar paquetes al Content Manager listos para el diario de clase
 */

import { useState, useEffect, useMemo } from 'react';
import {
  FileJson,
  Download,
  Edit,
  Eye,
  ChevronRight,
  ChevronDown,
  CheckSquare,
  Square,
  Package,
  Filter,
  Search,
  Settings,
  Upload,
  Save,
  AlertCircle,
  FileText,
  Table as TableIcon,
  Image as ImageIcon,
  PenTool
} from 'lucide-react';
import logger from '../utils/logger';
import { useContentExport } from '../hooks/useContentExport';
import { useAuth } from '../contexts/AuthContext';
import {
  BaseButton,
  BaseBadge,
  BaseLoading,
  BaseAlert,
  BaseCard
} from './common';
import { UniversalCard } from './cards';

/**
 * Detecta el tipo de contenido de una diapositiva
 */
function detectSlideType(slide) {
  const hasTable = slide.tables && slide.tables.length > 0;
  const hasText = slide.content && slide.content.length > 0;
  const hasImages = slide.images && slide.images.length > 0;

  // Detectar fill-in-blanks
  const hasBlanks = hasText && slide.content.some(item =>
    item.content?.some(run => run.text?.includes('___'))
  );

  // Detectar tabla Q&A (filas alternadas: pregunta + respuesta vacía)
  const isQATable = hasTable && slide.tables.some(table => {
    const data = table.data || [];
    let emptyRowCount = 0;
    let filledRowCount = 0;

    data.forEach(row => {
      const isEmptyRow = row.every(cell => cell === '' || cell === '…');
      if (isEmptyRow) emptyRowCount++;
      else filledRowCount++;
    });

    // Si hay mezcla de filas vacías y llenas, probablemente es Q&A
    return emptyRowCount > 0 && filledRowCount > 0;
  });

  // Detectar tabla de conjugación (tiene pronombres)
  const isConjugationTable = hasTable && slide.tables.some(table => {
    const flatData = table.data?.flat().join(' ').toLowerCase() || '';
    return flatData.includes('yo') &&
           flatData.includes('nosotros') &&
           (flatData.includes('él') || flatData.includes('ella'));
  });

  if (hasBlanks) return 'fill_in_blank';
  if (isConjugationTable) return 'conjugation_table';
  if (isQATable) return 'qa_table';
  if (hasTable && !hasText) return 'table_only';
  if (hasTable && hasText) return 'table_with_text';
  if (hasText && !hasTable) return 'text_only';
  if (hasImages) return 'has_images';

  return 'unknown';
}

/**
 * Extrae título de una diapositiva
 */
function extractTitle(slide) {
  if (slide.title) return slide.title;

  // Buscar primer texto con formato grande o bold
  const firstBoldText = slide.content?.find(item =>
    item.content?.some(run => run.bold || run.font_size > 30)
  );

  if (firstBoldText && firstBoldText.content[0]) {
    return firstBoldText.content[0].text.substring(0, 100);
  }

  // Buscar primer texto en general
  if (slide.content && slide.content[0] && slide.content[0].content[0]) {
    return slide.content[0].content[0].text.substring(0, 100);
  }

  return `Diapositiva ${slide.slide_number}`;
}

/**
 * Componente principal
 */
function SlidePackageGenerator() {
  const { user } = useAuth();
  const { exportContent, loading: exportLoading } = useContentExport();

  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlides, setSelectedSlides] = useState(new Set());
  const [expandedSlides, setExpandedSlides] = useState(new Set());
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [exportMessage, setExportMessage] = useState(null);
  const [formatSettings, setFormatSettings] = useState({
    baseFontSize: 16,
    titleFontSize: 24,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    lineHeight: 1.6,
    tableStyle: 'bordered' // 'bordered' | 'minimal' | 'striped'
  });

  // Cargar slides
  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/xiwen_contenidos/ade1_2026_content.json');
      if (!response.ok) {
        throw new Error('No se pudo cargar el archivo JSON');
      }

      const data = await response.json();

      // Procesar slides con metadata
      const processedSlides = data.slides.map(slide => ({
        ...slide,
        type: detectSlideType(slide),
        title: extractTitle(slide),
        selected: false
      }));

      setSlides(processedSlides);
      logger.info(`📚 Cargadas ${processedSlides.length} diapositivas`, 'SlidePackageGenerator');
    } catch (err) {
      logger.error('Error cargando slides:', err);
      setError('No se pudo cargar el archivo. Asegurate de que xiwen_contenidos/ade1_2026_content.json esté en public/');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar slides
  const filteredSlides = useMemo(() => {
    let result = slides;

    // Filtro por tipo
    if (filterType !== 'all') {
      result = result.filter(slide => slide.type === filterType);
    }

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(slide => {
        const title = slide.title.toLowerCase();
        const slideNum = slide.slide_number.toString();
        const textContent = slide.content?.map(c =>
          c.content?.map(r => r.text).join(' ')
        ).join(' ').toLowerCase() || '';

        return title.includes(query) ||
               slideNum.includes(query) ||
               textContent.includes(query);
      });
    }

    return result;
  }, [slides, filterType, searchQuery]);

  // Estadísticas
  const stats = useMemo(() => {
    const types = {};
    slides.forEach(slide => {
      types[slide.type] = (types[slide.type] || 0) + 1;
    });
    return {
      total: slides.length,
      selected: selectedSlides.size,
      types
    };
  }, [slides, selectedSlides]);

  // Selección de slides
  const toggleSlideSelection = (slideNumber) => {
    const newSelected = new Set(selectedSlides);
    if (newSelected.has(slideNumber)) {
      newSelected.delete(slideNumber);
    } else {
      newSelected.add(slideNumber);
    }
    setSelectedSlides(newSelected);
  };

  const selectAll = () => {
    setSelectedSlides(new Set(filteredSlides.map(s => s.slide_number)));
  };

  const deselectAll = () => {
    setSelectedSlides(new Set());
  };

  // Expandir/colapsar
  const toggleExpand = (slideNumber) => {
    const newExpanded = new Set(expandedSlides);
    if (newExpanded.has(slideNumber)) {
      newExpanded.delete(slideNumber);
    } else {
      newExpanded.add(slideNumber);
    }
    setExpandedSlides(newExpanded);
  };

  // Exportar seleccionados
  const exportSelected = async () => {
    if (!user) {
      setExportMessage({ type: 'error', text: 'Debes iniciar sesión para exportar' });
      setTimeout(() => setExportMessage(null), 4000);
      return;
    }

    if (selectedSlides.size === 0) {
      setExportMessage({ type: 'error', text: 'Selecciona al menos una diapositiva' });
      setTimeout(() => setExportMessage(null), 4000);
      return;
    }

    const slidesToExport = slides.filter(s => selectedSlides.has(s.slide_number));

    try {
      // Exportar como un único contenido tipo "lesson" con múltiples slides
      const result = await exportContent({
        type: 'lesson',
        title: `ADE1 - Diapositivas ${slidesToExport[0].slide_number}-${slidesToExport[slidesToExport.length - 1].slide_number}`,
        description: `Paquete de ${slidesToExport.length} diapositivas del libro ADE1`,
        body: JSON.stringify({
          slides: slidesToExport,
          formatSettings: formatSettings,
          metadata: {
            source: 'SlidePackageGenerator',
            originalFile: 'ade1_2026_content.json',
            slideCount: slidesToExport.length,
            slideNumbers: slidesToExport.map(s => s.slide_number)
          }
        }),
        metadata: {
          slideCount: slidesToExport.length,
          slideRange: `${slidesToExport[0].slide_number}-${slidesToExport[slidesToExport.length - 1].slide_number}`,
          types: slidesToExport.map(s => s.type),
          formatSettings: formatSettings,
          source: 'SlidePackageGenerator'
        },
        createdBy: user.uid
      });

      if (result.success) {
        setExportMessage({
          type: 'success',
          text: `✅ ${slidesToExport.length} diapositivas exportadas exitosamente con ID: ${result.id}`
        });
        logger.info(`Exportadas ${slidesToExport.length} diapositivas con ID: ${result.id}`, 'SlidePackageGenerator');

        // Limpiar selección
        setSelectedSlides(new Set());
      } else {
        setExportMessage({
          type: 'error',
          text: `❌ Error al exportar: ${result.error}`
        });
        logger.error('Error exportando slides', result.error, 'SlidePackageGenerator');
      }
    } catch (err) {
      setExportMessage({
        type: 'error',
        text: `❌ Error: ${err.message}`
      });
      logger.error('Error exportando slides', err, 'SlidePackageGenerator');
    }

    setTimeout(() => setExportMessage(null), 5000);
  };

  // Renderizar tipos de contenido
  const getTypeIcon = (type) => {
    const icons = {
      fill_in_blank: PenTool,
      conjugation_table: TableIcon,
      qa_table: TableIcon,
      table_only: TableIcon,
      table_with_text: FileText,
      text_only: FileText,
      has_images: ImageIcon,
      unknown: AlertCircle
    };
    return icons[type] || FileText;
  };

  const getTypeBadgeVariant = (type) => {
    const variants = {
      fill_in_blank: 'success',
      conjugation_table: 'info',
      qa_table: 'warning',
      table_only: 'default',
      table_with_text: 'default',
      text_only: 'default',
      has_images: 'primary',
      unknown: 'danger'
    };
    return variants[type] || 'default';
  };

  const getTypeLabel = (type) => {
    const labels = {
      fill_in_blank: 'Fill-in-Blank',
      conjugation_table: 'Conjugación',
      qa_table: 'Q&A Table',
      table_only: 'Tabla',
      table_with_text: 'Tabla + Texto',
      text_only: 'Texto',
      has_images: 'Con Imágenes',
      unknown: 'Desconocido'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="p-6">
        <BaseLoading variant="fullscreen" text="Cargando diapositivas..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <BaseAlert variant="danger" title="Error">
          {error}
        </BaseAlert>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package size={32} className="text-gray-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Generador de Paquetes - ADE1
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Procesa, edita y exporta diapositivas al Content Manager
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <BaseButton
              variant="ghost"
              size="sm"
              icon={Settings}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? 'Vista' : 'Editar'}
            </BaseButton>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <UniversalCard variant="default" size="sm">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Total Diapositivas
              </div>
            </div>
          </UniversalCard>

          <UniversalCard variant="default" size="sm">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                {stats.selected}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Seleccionadas
              </div>
            </div>
          </UniversalCard>

          <UniversalCard variant="default" size="sm">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.types.fill_in_blank || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Fill-in-Blanks
              </div>
            </div>
          </UniversalCard>

          <UniversalCard variant="default" size="sm">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {(stats.types.qa_table || 0) + (stats.types.conjugation_table || 0)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Tablas Ejercicios
              </div>
            </div>
          </UniversalCard>
        </div>

        {/* Controles */}
        <UniversalCard variant="default">
          <div className="space-y-4">
            {/* Búsqueda y filtros */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por número, título o contenido..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400"
              >
                <option value="all">Todos los tipos</option>
                <option value="fill_in_blank">Fill-in-Blank</option>
                <option value="conjugation_table">Conjugación</option>
                <option value="qa_table">Q&A Table</option>
                <option value="table_only">Solo Tablas</option>
                <option value="text_only">Solo Texto</option>
                <option value="has_images">Con Imágenes</option>
              </select>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-2">
              <BaseButton
                variant="outline"
                size="sm"
                icon={CheckSquare}
                onClick={selectAll}
              >
                Seleccionar Todo
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                icon={Square}
                onClick={deselectAll}
              >
                Deseleccionar Todo
              </BaseButton>
              <BaseButton
                variant="primary"
                size="sm"
                icon={Upload}
                onClick={exportSelected}
                disabled={selectedSlides.size === 0 || exportLoading}
                loading={exportLoading}
              >
                Exportar Seleccionadas ({selectedSlides.size})
              </BaseButton>
            </div>
          </div>
        </UniversalCard>

        {/* Mensaje de export */}
        {exportMessage && (
          <BaseAlert
            variant={exportMessage.type === 'success' ? 'success' : 'error'}
            onClose={() => setExportMessage(null)}
          >
            {exportMessage.text}
          </BaseAlert>
        )}

        {/* Lista de slides */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Diapositivas ({filteredSlides.length})
          </h2>

          {filteredSlides.map((slide) => {
            const isExpanded = expandedSlides.has(slide.slide_number);
            const isSelected = selectedSlides.has(slide.slide_number);
            const TypeIcon = getTypeIcon(slide.type);

            return (
              <div
                key={slide.slide_number}
                className={`border-2 rounded-lg bg-white dark:bg-gray-800 transition-colors ${
                  isSelected
                    ? 'border-gray-400 dark:border-gray-400'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Header */}
                <div className="p-4 flex items-center gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleSlideSelection(slide.slide_number)}
                    className="flex-shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare size={24} className="text-gray-600 dark:text-gray-400" />
                    ) : (
                      <Square size={24} className="text-gray-400" />
                    )}
                  </button>

                  {/* Expand */}
                  <button
                    onClick={() => toggleExpand(slide.slide_number)}
                    className="flex-shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
                    )}
                  </button>

                  {/* Icon */}
                  <TypeIcon size={20} className="text-gray-600 dark:text-gray-400 flex-shrink-0" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        #{slide.slide_number}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {slide.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <BaseBadge variant={getTypeBadgeVariant(slide.type)} size="sm">
                        {getTypeLabel(slide.type)}
                      </BaseBadge>
                      {slide.tables && slide.tables.length > 0 && (
                        <BaseBadge variant="default" size="sm">
                          {slide.tables.length} tabla{slide.tables.length > 1 ? 's' : ''}
                        </BaseBadge>
                      )}
                      {slide.images && slide.images.length > 0 && (
                        <BaseBadge variant="primary" size="sm">
                          {slide.images.length} imagen{slide.images.length > 1 ? 'es' : ''}
                        </BaseBadge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content Preview */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                    <SlidePreview
                      slide={slide}
                      formatSettings={formatSettings}
                      editMode={editMode}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Componente de preview de slide
 */
function SlidePreview({ slide, formatSettings, editMode }) {
  return (
    <div
      className="space-y-4"
      style={{
        fontFamily: formatSettings.fontFamily,
        fontSize: `${formatSettings.baseFontSize}px`,
        lineHeight: formatSettings.lineHeight
      }}
    >
      {/* Texto */}
      {slide.content && slide.content.length > 0 && (
        <div className="space-y-2">
          {slide.content.map((item, idx) => (
            <div key={idx} className="text-gray-900 dark:text-white">
              {item.content.map((run, runIdx) => (
                <span
                  key={runIdx}
                  style={{
                    fontSize: run.font_size ? `${run.font_size}px` : 'inherit',
                    fontWeight: run.bold ? 'bold' : 'normal',
                    fontStyle: run.italic ? 'italic' : 'normal'
                  }}
                  className={run.text.includes('___') ? 'text-gray-600 dark:text-gray-400 font-semibold' : ''}
                >
                  {run.text}{' '}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Tablas */}
      {slide.tables && slide.tables.length > 0 && (
        <div className="space-y-4">
          {slide.tables.map((table, idx) => (
            <div key={idx} className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                <tbody>
                  {table.data.map((row, rowIdx) => (
                    <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                      {row.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className={`border border-gray-300 dark:border-gray-600 px-3 py-2 ${
                            cell === '' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                          }`}
                        >
                          {cell === '' ? (
                            <span className="text-gray-400 text-sm italic">[vacío - para responder]</span>
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Imágenes - Placeholder */}
      {slide.images && slide.images.length > 0 && (
        <div className="space-y-2">
          {slide.images.map((img, idx) => (
            <div
              key={idx}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
              style={{
                height: '200px'
              }}
            >
              <div className="text-center text-gray-500 dark:text-gray-400">
                <ImageIcon size={48} className="mx-auto mb-2" />
                <div className="text-sm">
                  Imagen {idx + 1}
                </div>
                <div className="text-xs mt-1">
                  {img.width} x {img.height} EMU
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SlidePackageGenerator;
