/**
 * @fileoverview Biblioteca de ejercicios con búsqueda, filtros y plantillas
 * @module components/exercisebuilder/ExerciseLibrary
 */

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Copy,
  Eye,
  BookOpen,
  Tag,
  Grid,
  List
} from 'lucide-react';
import { BaseButton, BaseBadge, BaseAlert } from '../common';
import { UniversalCard } from '../cards';
import {
  EXERCISE_TEMPLATES,
  getAllCategories,
  getAllTags,
  cloneTemplate
} from '../../data/exerciseTemplates';
import logger from '../../utils/logger';

/**
 * Biblioteca de Ejercicios
 * Permite buscar, filtrar y clonar plantillas de ejercicios
 */
export function ExerciseLibrary({onTemplateSelected = () => {}, onTemplateCloned = () => {}}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const categories = getAllCategories();
  const allTags = getAllTags();

  // Obtener todos los templates como array
  const allTemplates = useMemo(() => {
    const templates = [];
    Object.values(EXERCISE_TEMPLATES).forEach(levelTemplates => {
      Object.values(levelTemplates).forEach(template => {
        templates.push(template);
      });
    });
    return templates;
  }, []);

  // Filtrar templates
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(template => {
      // Búsqueda por texto
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesName = template.name.toLowerCase().includes(search);
        const matchesTags = template.tags?.some(tag => tag.toLowerCase().includes(search));
        const matchesCategory = template.category?.toLowerCase().includes(search);

        if (!matchesName && !matchesTags && !matchesCategory) {
          return false;
        }
      }

      // Filtro por nivel
      if (selectedLevel !== 'all' && template.cefrLevel !== selectedLevel) {
        return false;
      }

      // Filtro por categoría
      if (selectedCategory !== 'all' && template.category !== selectedCategory) {
        return false;
      }

      // Filtro por tags
      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every(tag => template.tags?.includes(tag));
        if (!hasAllTags) return false;
      }

      return true;
    });
  }, [allTemplates, searchTerm, selectedLevel, selectedCategory, selectedTags]);

  const handleCloneTemplate = (template) => {
    const cloned = cloneTemplate(template.id);
    logger.info('Template cloned', { original: template.id, cloned: cloned.id });
    onTemplateCloned(cloned);
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedLevel('all');
    setSelectedCategory('all');
    setSelectedTags([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="text-purple-600 dark:text-purple-400" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Biblioteca de Ejercicios
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredTemplates.length} plantillas disponibles
            </p>
          </div>
        </div>

        {/* Vista Grid/List */}
        <div className="flex gap-2">
          <BaseButton
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            icon={Grid}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </BaseButton>
          <BaseButton
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            icon={List}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            Lista
          </BaseButton>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, categoría o tags..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Filtros */}
      <UniversalCard variant="default" size="md" title="Filtros" icon={Filter}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Nivel CEFR */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nivel CEFR
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Todos los niveles</option>
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Botón limpiar */}
          <div className="flex items-end">
            <BaseButton variant="ghost" onClick={clearFilters} fullWidth>
              Limpiar Filtros
            </BaseButton>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags (click para seleccionar)
          </label>
          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 15).map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`
                  px-3 py-1 rounded-full text-sm transition-all
                  ${selectedTags.includes(tag)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                  }
                `}
              >
                #{tag}
              </button>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''} seleccionado{selectedTags.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </UniversalCard>

      {/* Resultados */}
      {filteredTemplates.length === 0 ? (
        <BaseAlert variant="warning">
          No se encontraron plantillas con los filtros actuales. Intenta ajustar tus criterios de búsqueda.
        </BaseAlert>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'
        }>
          {filteredTemplates.map(template => (
            <UniversalCard
              variant="default"
              size="md"
              key={template.id}
              className="hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {template.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <BaseBadge variant="default" size="sm">
                      {template.cefrLevel}
                    </BaseBadge>
                    <BaseBadge variant="default" size="sm">
                      {template.type.toUpperCase()}
                    </BaseBadge>
                  </div>
                </div>
              </div>

              {/* Category */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                📁 {template.category}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {template.tags?.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400"
                  >
                    #{tag}
                  </span>
                ))}
                {template.tags?.length > 3 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{template.tags.length - 3} más
                  </span>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-2">
                <BaseButton
                  variant="outline"
                  icon={Eye}
                  size="sm"
                  onClick={() => setPreviewTemplate(template)}
                  fullWidth
                >
                  Ver
                </BaseButton>
                <BaseButton
                  variant="primary"
                  icon={Copy}
                  size="sm"
                  onClick={() => handleCloneTemplate(template)}
                  fullWidth
                >
                  Clonar
                </BaseButton>
              </div>
            </UniversalCard>
          ))}
        </div>
      )}

      {/* Modal de preview (simplificado) */}
      {previewTemplate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {previewTemplate.name}
                </h3>
                <div className="flex gap-2 mt-2">
                  <BaseBadge variant="default">{previewTemplate.cefrLevel}</BaseBadge>
                  <BaseBadge variant="default">{previewTemplate.type}</BaseBadge>
                  <BaseBadge variant="default">{previewTemplate.category}</BaseBadge>
                </div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Tags:</h4>
                <div className="flex flex-wrap gap-1">
                  {previewTemplate.tags?.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 rounded text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Vista previa:</h4>
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                  {JSON.stringify(previewTemplate.template, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <BaseButton
                variant="primary"
                icon={Copy}
                onClick={() => {
                  handleCloneTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                fullWidth
              >
                Clonar esta Plantilla
              </BaseButton>
              <BaseButton
                variant="ghost"
                onClick={() => setPreviewTemplate(null)}
              >
                Cerrar
              </BaseButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExerciseLibrary;
