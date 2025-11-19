/**
 * @fileoverview Correction Review Panel - Review and approve/reject individual corrections
 * @module components/homework/CorrectionReviewPanel
 */

import { useState } from 'react';
import {
  Check,
  X,
  Edit3,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import {
  BaseButton,
  BaseCard,
  BaseBadge,
  BaseAlert,
  CategoryBadge
} from '../common';

const ERROR_TYPE_CONFIG = {
  spelling: {
    label: 'Ortografía',
    icon: '📝',
    color: 'orange'
  },
  grammar: {
    label: 'Gramática',
    icon: '📚',
    color: 'red'
  },
  punctuation: {
    label: 'Puntuación',
    icon: '❗',
    color: 'yellow'
  },
  vocabulary: {
    label: 'Vocabulario',
    icon: '💬',
    color: 'blue'
  }
};

/**
 * Panel for reviewing individual AI corrections
 */
export default function CorrectionReviewPanel({ review, onCorrectionsUpdate }) {
  // Ensure all corrections have IDs (for backward compatibility with old reviews)
  const correctionsWithIds = (review.aiSuggestions || []).map((corr, idx) => ({
    ...corr,
    id: corr.id || `corr_${idx}_${Date.now()}`
  }));

  const [corrections, setCorrections] = useState(correctionsWithIds);
  const [filterType, setFilterType] = useState(null);
  const [expandedType, setExpandedType] = useState('spelling');

  // Group corrections by type
  const correctionsByType = corrections.reduce((acc, corr) => {
    if (!acc[corr.type]) acc[corr.type] = [];
    acc[corr.type].push(corr);
    return {};
  }, {});

  // Filter corrections
  const filteredCorrections = filterType
    ? corrections.filter(c => c.type === filterType)
    : corrections;

  // Count by status
  const getCounts = () => {
    const counts = {
      total: corrections.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      modified: 0
    };

    corrections.forEach(corr => {
      const status = corr.teacherStatus || 'pending';
      counts[status] = (counts[status] || 0) + 1;
    });

    return counts;
  };

  const counts = getCounts();

  // Handle approval/rejection
  const handleStatusChange = (correctionId, newStatus) => {
    const updatedCorrections = corrections.map(corr => {
      if (corr.id === correctionId) {
        return {
          ...corr,
          teacherStatus: newStatus
        };
      }
      return corr;
    });

    setCorrections(updatedCorrections);
    onCorrectionsUpdate(updatedCorrections);
  };

  // Handle note change
  const handleNoteChange = (correctionId, note) => {
    const updatedCorrections = corrections.map(corr => {
      if (corr.id === correctionId) {
        return {
          ...corr,
          teacherNote: note
        };
      }
      return corr;
    });

    setCorrections(updatedCorrections);
    onCorrectionsUpdate(updatedCorrections);
  };

  // Bulk actions
  const handleApproveAll = () => {
    const updatedCorrections = corrections.map(corr => ({
      ...corr,
      teacherStatus: 'approved'
    }));
    setCorrections(updatedCorrections);
    onCorrectionsUpdate(updatedCorrections);
  };

  const handleRejectAll = () => {
    if (!window.confirm('¿Rechazar todas las correcciones?')) return;

    const updatedCorrections = corrections.map(corr => ({
      ...corr,
      teacherStatus: 'rejected'
    }));
    setCorrections(updatedCorrections);
    onCorrectionsUpdate(updatedCorrections);
  };

  if (corrections.length === 0) {
    return (
      <BaseAlert variant="info">
        <AlertCircle size={16} strokeWidth={2} />
        No hay correcciones sugeridas para revisar
      </BaseAlert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Revisar Correcciones ({counts.total})
          </h3>
          <div className="flex gap-2 mt-2">
            <CategoryBadge type="status" value="draft" size="sm">
              {counts.pending} pendientes
            </CategoryBadge>
            <CategoryBadge type="status" value="published" size="sm">
              {counts.approved} aprobadas
            </CategoryBadge>
            <CategoryBadge type="status" value="archived" size="sm">
              {counts.rejected} rechazadas
            </CategoryBadge>
          </div>
        </div>

        {/* Bulk actions */}
        <div className="flex gap-2">
          <BaseButton
            variant="outline"
            size="sm"
            onClick={handleApproveAll}
            disabled={counts.pending === 0}
          >
            <Check size={14} strokeWidth={2} />
            Aprobar Todo
          </BaseButton>
          <BaseButton
            variant="outline"
            size="sm"
            onClick={handleRejectAll}
            disabled={counts.pending === 0}
          >
            <X size={14} strokeWidth={2} />
            Rechazar Todo
          </BaseButton>
        </div>
      </div>

      {/* Filter by type */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} strokeWidth={2} className="text-zinc-600 dark:text-zinc-400" />
        <BaseButton
          variant={filterType === null ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilterType(null)}
        >
          Todas ({corrections.length})
        </BaseButton>
        {Object.entries(ERROR_TYPE_CONFIG).map(([type, config]) => {
          const count = corrections.filter(c => c.type === type).length;
          if (count === 0) return null;

          return (
            <BaseButton
              key={type}
              variant={filterType === type ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterType(type)}
            >
              {config.icon} {config.label} ({count})
            </BaseButton>
          );
        })}
      </div>

      {/* Corrections list grouped by type */}
      <div className="space-y-3">
        {Object.entries(ERROR_TYPE_CONFIG).map(([type, config]) => {
          const typeCorrections = corrections.filter(c => c.type === type);
          if (typeCorrections.length === 0) return null;

          const isExpanded = expandedType === type;

          return (
            <div key={type} className="border border-zinc-200 dark:border-zinc-700 rounded-lg">
              {/* Type header */}
              <button
                onClick={() => setExpandedType(isExpanded ? null : type)}
                className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{config.icon}</span>
                  <div className="text-left">
                    <h4 className="font-semibold text-zinc-900 dark:text-white">
                      {config.label}
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {typeCorrections.length} correcciones
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="text-zinc-600 dark:text-zinc-400" size={20} strokeWidth={2} />
                ) : (
                  <ChevronDown className="text-zinc-600 dark:text-zinc-400" size={20} strokeWidth={2} />
                )}
              </button>

              {/* Corrections list */}
              {isExpanded && (
                <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
                  {typeCorrections.map((correction, idx) => (
                    <CorrectionItem
                      key={correction.id || `${type}_${idx}`}
                      correction={correction}
                      config={config}
                      onStatusChange={handleStatusChange}
                      onNoteChange={handleNoteChange}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Individual correction item with approve/reject buttons
 */
function CorrectionItem({ correction, config, onStatusChange, onNoteChange }) {
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState(correction.teacherNote || '');

  const status = correction.teacherStatus || 'pending';

  const handleSaveNote = () => {
    onNoteChange(correction.id, note);
    setShowNote(false);
  };

  return (
    <BaseCard className={`${
      status === 'approved' ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10' :
      status === 'rejected' ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' :
      ''
    }`}>
      <div className="space-y-3">
        {/* Error and correction */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-16">Error:</span>
            <span className="text-sm text-red-600 dark:text-red-400 line-through flex-1">
              {correction.original}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-16">Correcto:</span>
            <span className="text-sm text-green-600 dark:text-green-400 font-medium flex-1">
              {correction.correction}
            </span>
          </div>
        </div>

        {/* Explanation */}
        {correction.explanation && (
          <div className="p-2 bg-gray-50 dark:bg-blue-900/10 border border-gray-200 dark:border-gray-700 rounded">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              {correction.explanation}
            </p>
          </div>
        )}

        {/* Teacher note */}
        {showNote ? (
          <div className="space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nota adicional para el alumno..."
              rows={2}
              className="input text-sm"
            />
            <div className="flex gap-2">
              <BaseButton variant="primary" size="sm" onClick={handleSaveNote}>
                Guardar
              </BaseButton>
              <BaseButton variant="ghost" size="sm" onClick={() => setShowNote(false)}>
                Cancelar
              </BaseButton>
            </div>
          </div>
        ) : correction.teacherNote ? (
          <div className="p-2 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded">
            <p className="text-xs text-purple-800 dark:text-purple-200">
              <strong>Nota:</strong> {correction.teacherNote}
            </p>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <BaseButton
            variant={status === 'approved' ? 'success' : 'outline'}
            size="sm"
            onClick={() => onStatusChange(correction.id, 'approved')}
          >
            <Check size={14} strokeWidth={2} />
            {status === 'approved' ? 'Aprobado' : 'Aprobar'}
          </BaseButton>

          <BaseButton
            variant={status === 'rejected' ? 'danger' : 'outline'}
            size="sm"
            onClick={() => onStatusChange(correction.id, 'rejected')}
          >
            <X size={14} strokeWidth={2} />
            {status === 'rejected' ? 'Rechazado' : 'Rechazar'}
          </BaseButton>

          <BaseButton
            variant="ghost"
            size="sm"
            onClick={() => setShowNote(true)}
          >
            <Edit3 size={14} strokeWidth={2} />
            Nota
          </BaseButton>
        </div>
      </div>
    </BaseCard>
  );
}
