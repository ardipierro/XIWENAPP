/**
 * @fileoverview Pestaña de contenidos asignados para estudiantes
 * @module components/profile/tabs/ContentTab
 */

import { useState, useEffect } from 'react';
import { FileText, BookOpen, Video, Link as LinkIcon, Trophy, Calendar } from 'lucide-react';
import { getStudentContentAssignments } from '../../../firebase/firestore';
import logger from '../../../utils/logger';

/**
 * ContentTab - Contenidos asignados al estudiante
 *
 * @param {Object} user - Usuario actual
 */
function ContentTab({ user }) {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, lesson, reading, video, link, exercise

  useEffect(() => {
    loadContents();
  }, [user?.uid]);

  const loadContents = async () => {
    if (!user?.uid) {
      logger.warn('ContentTab: No user UID provided');
      setLoading(false);
      return;
    }

    logger.debug('ContentTab: Loading assigned contents', { userId: user.uid });
    setLoading(true);
    try {
      const data = await getStudentContentAssignments(user.uid);
      logger.debug('ContentTab: Contents loaded successfully', { count: data?.length || 0 });
      setContents(data || []);
    } catch (err) {
      logger.error('ContentTab: Error loading contents', err);
      setContents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getFilteredContents = () => {
    if (filter === 'all') return contents;
    return contents.filter(c => c.contentData?.type === filter);
  };

  const filteredContents = getFilteredContents();

  // Contar por tipo
  const countByType = (type) => contents.filter(c => c.contentData?.type === type).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filtros por tipo */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          Todos ({contents.length})
        </button>
        {countByType('lesson') > 0 && (
          <button
            onClick={() => setFilter('lesson')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'lesson'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Lecciones ({countByType('lesson')})
          </button>
        )}
        {countByType('reading') > 0 && (
          <button
            onClick={() => setFilter('reading')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'reading'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Lecturas ({countByType('reading')})
          </button>
        )}
        {countByType('video') > 0 && (
          <button
            onClick={() => setFilter('video')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'video'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Videos ({countByType('video')})
          </button>
        )}
        {countByType('exercise') > 0 && (
          <button
            onClick={() => setFilter('exercise')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'exercise'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Ejercicios ({countByType('exercise')})
          </button>
        )}
      </div>

      {/* Lista de contenidos */}
      {filteredContents.length > 0 ? (
        <div className="space-y-3">
          {filteredContents.map((content) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <FileText size={48} strokeWidth={2} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            No hay contenidos asignados
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {filter === 'all'
              ? 'Aún no tienes contenidos asignados por tus profesores'
              : `No tienes ${getFilterLabel(filter)} asignados`
            }
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Obtener etiqueta de filtro
 */
function getFilterLabel(filter) {
  const labels = {
    lesson: 'lecciones',
    reading: 'lecturas',
    video: 'videos',
    link: 'enlaces',
    exercise: 'ejercicios'
  };
  return labels[filter] || filter;
}

/**
 * ContentCard - Card individual de contenido
 */
function ContentCard({ content }) {
  const contentData = content.contentData || {};
  const type = contentData.type || 'lesson';

  const getTypeIcon = () => {
    switch (type) {
      case 'lesson':
        return <BookOpen size={18} strokeWidth={2} className="text-blue-500" />;
      case 'reading':
        return <FileText size={18} strokeWidth={2} className="text-purple-500" />;
      case 'video':
        return <Video size={18} strokeWidth={2} className="text-red-500" />;
      case 'link':
        return <LinkIcon size={18} strokeWidth={2} className="text-green-500" />;
      case 'exercise':
        return <Trophy size={18} strokeWidth={2} className="text-amber-500" />;
      default:
        return <FileText size={18} strokeWidth={2} className="text-zinc-500" />;
    }
  };

  const getTypeBadge = () => {
    const badges = {
      lesson: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
      reading: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
      video: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
      link: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
      exercise: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
    };

    const labels = {
      lesson: 'Lección',
      reading: 'Lectura',
      video: 'Video',
      link: 'Enlace',
      exercise: 'Ejercicio'
    };

    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badges[type] || 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400'}`}>
        {getTypeIcon()}
        {labels[type] || type}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {contentData.title || 'Contenido sin título'}
          </h3>
          {contentData.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 line-clamp-2">
              {contentData.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            {content.assignedAt && (
              <div className="flex items-center gap-1">
                <Calendar size={14} strokeWidth={2} />
                <span>Asignado: {new Date(content.assignedAt?.toDate()).toLocaleDateString()}</span>
              </div>
            )}

            {contentData.metadata?.difficulty && (
              <div className="flex items-center gap-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  contentData.metadata.difficulty === 'beginner'
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : contentData.metadata.difficulty === 'intermediate'
                    ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                    : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                  {contentData.metadata.difficulty === 'beginner' ? 'Principiante' :
                   contentData.metadata.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                </span>
              </div>
            )}
          </div>
        </div>

        {getTypeBadge()}
      </div>
    </div>
  );
}

export default ContentTab;
