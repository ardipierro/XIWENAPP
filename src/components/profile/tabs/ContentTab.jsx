/**
 * @fileoverview Pestaña de contenidos asignados para estudiantes
 * @module components/profile/tabs/ContentTab
 */

import { useState, useEffect } from 'react';
import { FileText, BookOpen, Video, Link as LinkIcon, Trophy, Calendar } from 'lucide-react';
import { getStudentContentAssignments } from '../../../firebase/firestore';
import { CategoryBadge } from '../../common';
import logger from '../../../utils/logger';

/**
 * ContentTab - Contenidos asignados al estudiante
 *
 * @param {Object} user - Usuario actual
 */
function ContentTab({ user }) {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);

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


  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: 'var(--color-text-primary)' }}
        ></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Lista de contenidos */}
      {contents.length > 0 ? (
        <div className="space-y-3">
          {contents.map((content) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      ) : (
        <div
          className="text-center py-12 rounded-lg"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <FileText size={48} strokeWidth={2} className="mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            No hay contenidos asignados
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Aún no tienes contenidos asignados por tus profesores
          </p>
        </div>
      )}
    </div>
  );
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
        return <BookOpen size={18} strokeWidth={2} className="text-gray-600" />;
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

  // Usar CategoryBadge del sistema universal de badges
  const getTypeBadge = () => {
    return <CategoryBadge type="content" value={type} size="sm" />;
  };

  return (
    <div
      className="rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer group"
      style={{
        background: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3
            className="text-base font-bold mb-1 transition-colors"
            style={{ color: 'var(--color-text-primary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
          >
            {contentData.title || 'Contenido sin título'}
          </h3>
          {contentData.description && (
            <p className="text-sm mb-2 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
              {contentData.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {content.assignedAt && (
              <div className="flex items-center gap-1">
                <Calendar size={14} strokeWidth={2} />
                <span>Asignado: {new Date(content.assignedAt?.toDate()).toLocaleDateString()}</span>
              </div>
            )}

            {contentData.metadata?.difficulty && (
              <CategoryBadge type="difficulty" value={contentData.metadata.difficulty} size="sm" />
            )}
          </div>
        </div>

        {getTypeBadge()}
      </div>
    </div>
  );
}

export default ContentTab;
