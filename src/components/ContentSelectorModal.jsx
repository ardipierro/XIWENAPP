/**
 * @fileoverview Modal para seleccionar contenidos del Content Manager
 * Usado en ClassDailyLog para agregar contenidos al feed
 * @module components/ContentSelectorModal
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  BookOpen,
  FileText,
  Video,
  Link as LinkIcon,
  PenTool,
  BookMarked,
  Gamepad2,
  X
} from 'lucide-react';
import { getContentByTeacher, CONTENT_TYPES } from '../firebase/content';
import logger from '../utils/logger';
import {
  BaseButton,
  BaseInput,
  BaseSelect,
  BaseBadge,
  CategoryBadge,
  BaseLoading,
  BaseAlert,
  BaseEmptyState,
  BaseModal
} from './common';

const CONTENT_TYPE_CONFIG = {
  [CONTENT_TYPES.COURSE]: { icon: BookOpen, label: 'Curso', color: 'zinc' },
  [CONTENT_TYPES.LESSON]: { icon: FileText, label: 'Lección', color: 'green' },
  [CONTENT_TYPES.READING]: { icon: BookMarked, label: 'Lectura', color: 'zinc' },
  [CONTENT_TYPES.VIDEO]: { icon: Video, label: 'Video', color: 'red' },
  [CONTENT_TYPES.LINK]: { icon: LinkIcon, label: 'Link', color: 'zinc' },
  [CONTENT_TYPES.EXERCISE]: { icon: PenTool, label: 'Ejercicio', color: 'amber' },
  [CONTENT_TYPES.LIVE_GAME]: { icon: Gamepad2, label: 'Juego', color: 'zinc' }
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todos los tipos' },
  { value: CONTENT_TYPES.LESSON, label: '📝 Lecciones' },
  { value: CONTENT_TYPES.READING, label: '📖 Lecturas' },
  { value: CONTENT_TYPES.VIDEO, label: '🎥 Videos' },
  { value: CONTENT_TYPES.EXERCISE, label: '✏️ Ejercicios' },
  { value: CONTENT_TYPES.LINK, label: '🔗 Links' }
];

function ContentSelectorModal({ isOpen, onClose, onSelect, teacherId }) {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedContent, setSelectedContent] = useState(null);

  useEffect(() => {
    if (isOpen && teacherId) {
      loadContents();
    }
  }, [isOpen, teacherId]);

  const loadContents = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getContentByTeacher(teacherId);
      setContents(data || []);
      logger.info(`Cargados ${data?.length || 0} contenidos`, 'ContentSelectorModal');
    } catch (err) {
      logger.error('Error cargando contenidos:', err, 'ContentSelectorModal');
      setError('Error al cargar contenidos');
    } finally {
      setLoading(false);
    }
  };

  const filteredContents = useMemo(() => {
    let filtered = contents;

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Búsqueda por término
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const title = (item.title || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        return title.includes(lowerSearch) || description.includes(lowerSearch);
      });
    }

    return filtered;
  }, [contents, typeFilter, searchTerm]);

  const handleSelect = (content) => {
    setSelectedContent(content);
  };

  const handleConfirm = () => {
    if (selectedContent && onSelect) {
      onSelect(selectedContent);
      setSelectedContent(null);
      setSearchTerm('');
      setTypeFilter('all');
    }
  };

  const handleClose = () => {
    setSelectedContent(null);
    setSearchTerm('');
    setTypeFilter('all');
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Seleccionar Contenido"
      icon={BookOpen}
      size="lg"
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <BaseInput
              icon={Search}
              placeholder="Buscar contenido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <BaseSelect
            icon={Filter}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={FILTER_OPTIONS}
            className="w-64"
          />
        </div>

        {/* Content List */}
        {loading ? (
          <BaseLoading text="Cargando contenidos..." />
        ) : error ? (
          <BaseAlert variant="danger">{error}</BaseAlert>
        ) : filteredContents.length === 0 ? (
          <BaseEmptyState
            icon={BookOpen}
            title="No hay contenidos"
            description={
              searchTerm || typeFilter !== 'all'
                ? 'No se encontraron contenidos con los filtros aplicados'
                : 'No tienes contenidos creados'
            }
            size="sm"
          />
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredContents.map((content) => {
              const config = CONTENT_TYPE_CONFIG[content.type] || CONTENT_TYPE_CONFIG[CONTENT_TYPES.LESSON];
              const Icon = config.icon;
              const isSelected = selectedContent?.id === content.id;

              return (
                <button
                  key={content.id}
                  onClick={() => handleSelect(content)}
                  className={`
                    w-full p-4 rounded-lg text-left
                    border-2 transition-all
                    ${isSelected
                      ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      size={24}
                      className={isSelected ? 'text-zinc-900 dark:text-zinc-100' : 'text-gray-600 dark:text-gray-400'}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {content.title}
                      </h4>
                      {content.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {content.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <CategoryBadge
                          type="content"
                          value={content.type}
                          size="sm"
                        />
                        {content.metadata?.difficulty && (
                          <CategoryBadge
                            type="difficulty"
                            value={content.metadata.difficulty}
                            size="sm"
                          />
                        )}
                        {content.metadata?.duration && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {content.metadata.duration} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <BaseButton
            variant="secondary"
            onClick={handleClose}
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedContent}
          >
            Agregar al Diario
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}

export default ContentSelectorModal;
