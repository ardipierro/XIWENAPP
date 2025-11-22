/**
 * @fileoverview Quick Correction View - Text-based correction display
 * @module components/homework/QuickCorrectionView
 *
 * Displays homework corrections as a structured text list
 * instead of (or in addition to) the image overlay.
 */

import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { BaseCard, BaseBadge, BaseButton } from '../common';
import CategoryBadge from '../common/CategoryBadge';

// Error type configuration
const ERROR_TYPE_CONFIG = {
  spelling: {
    label: 'Ortografía',
    icon: '✏️',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  grammar: {
    label: 'Gramática',
    icon: '📖',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  punctuation: {
    label: 'Puntuación',
    icon: '❗',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800'
  },
  vocabulary: {
    label: 'Vocabulario',
    icon: '💬',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  }
};

/**
 * Single correction item component
 */
function CorrectionItem({ correction, index, expanded, onToggle }) {
  const typeConfig = ERROR_TYPE_CONFIG[correction.type] || ERROR_TYPE_CONFIG.spelling;

  return (
    <div
      className={`
        rounded-lg border transition-all duration-200
        ${typeConfig.borderColor} ${typeConfig.bgColor}
      `}
    >
      {/* Header - always visible */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => onToggle(index)}
      >
        {/* Number badge */}
        <div className={`
          w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
          ${typeConfig.color} bg-white dark:bg-zinc-900
        `}>
          {index + 1}
        </div>

        {/* Type icon */}
        <span className="text-lg">{typeConfig.icon}</span>

        {/* Original → Correction */}
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span className="line-through text-zinc-500 dark:text-zinc-400">
            {correction.original}
          </span>
          <ArrowRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <span className={`font-medium ${typeConfig.color}`}>
            {correction.correction}
          </span>
        </div>

        {/* Type badge */}
        <span className={`
          hidden sm:inline-flex px-2 py-0.5 rounded text-xs font-medium
          ${typeConfig.bgColor} ${typeConfig.color}
        `}>
          {typeConfig.label}
        </span>

        {/* Expand toggle */}
        <button className="p-1 hover:bg-white/50 dark:hover:bg-zinc-800/50 rounded">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && correction.explanation && (
        <div className="px-3 pb-3 pt-0">
          <div className="pl-9 border-l-2 border-zinc-200 dark:border-zinc-700 ml-3">
            <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <Lightbulb className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
              <p>{correction.explanation}</p>
            </div>
            {correction.line && (
              <p className="text-xs text-zinc-400 mt-1 pl-6">
                Línea aproximada: {correction.line}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * QuickCorrectionView Component
 * @param {Object} review - The homework review object with corrections
 * @param {boolean} showSummary - Show summary card at top
 * @param {boolean} showTranscription - Show transcription section
 * @param {string} className - Additional CSS classes
 */
export default function QuickCorrectionView({
  review,
  showSummary = true,
  showTranscription = false,
  className = ''
}) {
  const [expandedItems, setExpandedItems] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);

  // Get corrections from review (support both field names)
  const corrections = review?.detailedCorrections || review?.aiSuggestions || [];
  const errorSummary = review?.errorSummary || review?.aiErrorSummary || {};
  const transcription = review?.transcription || '';
  const overallFeedback = review?.overallFeedback || '';
  const suggestedGrade = review?.suggestedGrade || 0;

  const toggleItem = (index) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedItems({});
    } else {
      const allItems = {};
      corrections.forEach((_, index) => {
        allItems[index] = true;
      });
      setExpandedItems(allItems);
    }
    setAllExpanded(!allExpanded);
  };

  // Group corrections by type
  const correctionsByType = corrections.reduce((acc, corr) => {
    const type = corr.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(corr);
    return acc;
  }, {});

  // Calculate grade color
  const getGradeColor = (grade) => {
    if (grade >= 80) return 'text-green-600 dark:text-green-400';
    if (grade >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (!review) {
    return (
      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
        No hay datos de corrección disponibles
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Card */}
      {showSummary && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Grade */}
            <div className="text-center px-4">
              <div className={`text-4xl font-bold ${getGradeColor(suggestedGrade)}`}>
                {suggestedGrade}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Calificación
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-12 bg-zinc-200 dark:bg-zinc-700" />

            {/* Error counts */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(ERROR_TYPE_CONFIG).map(([type, config]) => {
                const count = errorSummary[type] || 0;
                return (
                  <div
                    key={type}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg
                      ${count > 0 ? config.bgColor : 'bg-zinc-50 dark:bg-zinc-800'}
                    `}
                  >
                    <span>{config.icon}</span>
                    <div>
                      <div className={`font-semibold ${count > 0 ? config.color : 'text-zinc-400'}`}>
                        {count}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {config.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overall feedback */}
          {overallFeedback && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-sm text-zinc-600 dark:text-zinc-300 italic">
                "{overallFeedback}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Transcription (optional) */}
      {showTranscription && transcription && (
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Transcripción
          </h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
            {transcription}
          </p>
        </div>
      )}

      {/* Corrections List */}
      {corrections.length > 0 ? (
        <div className="space-y-3">
          {/* Header with expand all */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Correcciones ({corrections.length})
            </h4>
            <BaseButton
              variant="ghost"
              size="sm"
              onClick={toggleAll}
            >
              {allExpanded ? 'Contraer todo' : 'Expandir todo'}
            </BaseButton>
          </div>

          {/* Correction items */}
          <div className="space-y-2">
            {corrections.map((correction, index) => (
              <CorrectionItem
                key={correction.id || index}
                correction={correction}
                index={index}
                expanded={expandedItems[index] || false}
                onToggle={toggleItem}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-green-50 dark:bg-green-900/20 rounded-xl">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <p className="text-green-700 dark:text-green-300 font-medium">
            ¡Sin errores detectados!
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Excelente trabajo
          </p>
        </div>
      )}
    </div>
  );
}
