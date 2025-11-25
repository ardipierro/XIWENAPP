/**
 * @fileoverview Simple Homework Modal - Minimalist correction review
 * @module components/homework/SimpleHomeworkModal
 *
 * A clean, minimal modal for reviewing AI-corrected homework.
 * Shows only essential elements: image, corrections, and approve action.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Maximize2,
  Edit3,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Settings2,
  User,
  ArrowRight,
  Lightbulb
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { BaseButton, BaseAlert, BaseLoading } from '../common';
import ImageOverlay from './ImageOverlay';
import ImageLightbox from '../common/ImageLightbox';
import { getStudentsByTeacher } from '../../firebase/users';
import { getAllCorrectionProfiles } from '../../firebase/correctionProfiles';
import {
  approveReview,
  requestReanalysis,
  subscribeToReview,
  assignStudentToReview,
  REVIEW_STATUS
} from '../../firebase/homework_reviews';
import logger from '../../utils/logger';

// Error type styling
const ERROR_STYLES = {
  spelling: { icon: '✏️', label: 'Ortografía', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  grammar: { icon: '📖', label: 'Gramática', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  punctuation: { icon: '❗', label: 'Puntuación', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  vocabulary: { icon: '💬', label: 'Vocabulario', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' }
};

/**
 * Simple correction item
 */
function CorrectionItem({ correction, index }) {
  const [expanded, setExpanded] = useState(false);
  const style = ERROR_STYLES[correction.type] || ERROR_STYLES.spelling;

  return (
    <div className={`rounded-lg border border-zinc-200 dark:border-zinc-700 ${style.bg} overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <span className="text-lg">{style.icon}</span>
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span className="line-through text-zinc-500 dark:text-zinc-400 text-sm">
            {correction.original || correction.errorText}
          </span>
          <ArrowRight className="w-3 h-3 text-zinc-400 flex-shrink-0" />
          <span className={`font-medium text-sm ${style.color}`}>
            {correction.correction || correction.suggestion}
          </span>
        </div>
        {correction.explanation && (
          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        )}
      </button>
      {expanded && correction.explanation && (
        <div className="px-3 pb-3 pt-0">
          <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300 pl-8">
            <Lightbulb className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
            <p>{correction.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple Homework Modal
 */
export default function SimpleHomeworkModal({
  review,
  onClose,
  onApproveSuccess,
  teacherId,
  currentUser
}) {
  // State
  const [currentReview, setCurrentReview] = useState(review);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Student assignment
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(review.studentId || '');
  const [studentName, setStudentName] = useState(review.studentName || 'Sin asignar');
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Profiles for re-analysis
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [showReanalyze, setShowReanalyze] = useState(false);

  // Feedback editing
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  const [editedFeedback, setEditedFeedback] = useState(review.overallFeedback || '');
  const [editedGrade, setEditedGrade] = useState(review.suggestedGrade || 0);

  // Advanced visual settings (collapsed by default)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [visualSettings, setVisualSettings] = useState({
    highlightOpacity: 0.25,
    useWavyUnderline: true,
    showCorrectionText: true
  });

  // Normalized corrections
  const corrections = useMemo(() => {
    const raw = currentReview.aiSuggestions || currentReview.detailedCorrections || [];
    return raw.map((corr, idx) => ({
      ...corr,
      id: corr.id || `corr_${idx}`,
      original: corr.original || corr.errorText || corr.text || '',
      correction: corr.correction || corr.suggestion || corr.correctedText || '',
      type: corr.type || corr.errorType || 'spelling',
      explanation: corr.explanation || ''
    }));
  }, [currentReview]);

  // Load students
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const tid = teacherId || currentReview.teacherId || currentUser?.uid;
        if (tid) {
          const list = await getStudentsByTeacher(tid);
          setStudents(list);
        }
      } catch (err) {
        logger.error('Error loading students', 'SimpleHomeworkModal', err);
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
  }, [teacherId, currentReview.teacherId, currentUser?.uid]);

  // Load profiles
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const list = await getAllCorrectionProfiles();
        setProfiles(list);
        if (list.length > 0) {
          setSelectedProfileId(list[0].id);
        }
      } catch (err) {
        logger.error('Error loading profiles', 'SimpleHomeworkModal', err);
      }
    };
    loadProfiles();
  }, []);

  // Subscribe to review updates when processing
  useEffect(() => {
    const isProcessing = currentReview.status === REVIEW_STATUS.PROCESSING || currentReview.status === 'processing';
    if (!isProcessing) return;

    const unsubscribe = subscribeToReview(currentReview.id, (updated) => {
      setCurrentReview(updated);
      if (updated.overallFeedback) setEditedFeedback(updated.overallFeedback);
      if (updated.suggestedGrade !== undefined) setEditedGrade(updated.suggestedGrade);

      if (updated.status === REVIEW_STATUS.PENDING_REVIEW) {
        setSuccess('✅ ¡Análisis completado!');
        setIsReanalyzing(false);
      }
      if (updated.status === REVIEW_STATUS.FAILED) {
        setError(updated.errorMessage || 'Error al procesar');
        setIsReanalyzing(false);
      }
    });

    return () => unsubscribe();
  }, [currentReview.id, currentReview.status]);

  // Handle student change
  const handleStudentChange = async (e) => {
    const studentId = e.target.value;
    setSelectedStudentId(studentId);

    const student = students.find(s => s.id === studentId);
    const name = student?.name || student?.email || 'Sin asignar';
    setStudentName(name);

    try {
      await assignStudentToReview(currentReview.id, studentId || null, name);
      logger.info(`Assigned student ${studentId} to review`, 'SimpleHomeworkModal');
    } catch (err) {
      logger.error('Error assigning student', 'SimpleHomeworkModal', err);
    }
  };

  // Handle approve
  const handleApprove = async () => {
    try {
      setIsApproving(true);
      setError(null);

      const teacherEdits = {
        overallFeedback: editedFeedback,
        suggestedGrade: parseFloat(editedGrade),
        aiSuggestions: corrections.map(c => ({ ...c, teacherStatus: 'approved' })),
        approvedErrorSummary: {
          spelling: corrections.filter(c => c.type === 'spelling').length,
          grammar: corrections.filter(c => c.type === 'grammar').length,
          punctuation: corrections.filter(c => c.type === 'punctuation').length,
          vocabulary: corrections.filter(c => c.type === 'vocabulary').length,
          total: corrections.length
        }
      };

      const result = await approveReview(currentReview.id, teacherEdits);
      if (result.success) {
        onApproveSuccess();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      logger.error('Error approving', 'SimpleHomeworkModal', err);
      setError('Error al aprobar. Intenta de nuevo.');
    } finally {
      setIsApproving(false);
    }
  };

  // Handle re-analyze
  const handleReanalyze = async () => {
    if (!selectedProfileId) return;

    try {
      setIsReanalyzing(true);
      setError(null);
      setShowReanalyze(false);

      const result = await requestReanalysis(currentReview.id, selectedProfileId);
      if (result.success) {
        setSuccess('Re-análisis solicitado. Procesando...');
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      logger.error('Error re-analyzing', 'SimpleHomeworkModal', err);
      setError('Error al re-analizar.');
      setIsReanalyzing(false);
    }
  };

  // Status checks
  const isProcessing = currentReview.status === REVIEW_STATUS.PROCESSING || currentReview.status === 'processing';
  const isFailed = currentReview.status === REVIEW_STATUS.FAILED || currentReview.status === 'failed';
  const grade = isEditingFeedback ? editedGrade : currentReview.suggestedGrade || 0;
  const gradeColor = grade >= 80 ? 'text-green-600' : grade >= 60 ? 'text-amber-600' : 'text-red-600';

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
      style={{ zIndex: 'var(--z-modal-backdrop)' }}
    >
      <div
        className="rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{
          zIndex: 'var(--z-modal)',
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)'
        }}
      >

        {/* Header - Student name/selector */}
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <User className="w-5 h-5 text-zinc-400 flex-shrink-0" />
            {loadingStudents ? (
              <span className="text-sm text-zinc-500">Cargando...</span>
            ) : (
              <select
                value={selectedStudentId}
                onChange={handleStudentChange}
                className="flex-1 min-w-0 px-2 py-1 text-sm font-medium bg-transparent border-none focus:ring-0 text-zinc-900 dark:text-white cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
              >
                <option value="">Sin asignar</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name || s.email}</option>
                ))}
              </select>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Alerts */}
          {error && (
            <BaseAlert variant="danger" onClose={() => setError(null)}>
              {error}
            </BaseAlert>
          )}
          {success && (
            <BaseAlert variant="success" onClose={() => setSuccess(null)}>
              {success}
            </BaseAlert>
          )}

          {/* Processing indicator */}
          {(isProcessing || isReanalyzing) && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">Analizando tarea...</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">Esto puede tardar unos segundos</p>
              </div>
            </div>
          )}

          {/* Failed indicator */}
          {isFailed && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="font-medium text-red-800 dark:text-red-200">Error al procesar</p>
              <p className="text-sm text-red-600 dark:text-red-400">{currentReview.errorMessage}</p>
            </div>
          )}

          {/* Image with expand button */}
          <div className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
            <div className="max-h-64 overflow-hidden">
              <ImageOverlay
                imageUrl={currentReview.imageUrl}
                words={currentReview.words || []}
                errors={corrections}
                showOverlay={currentReview.words && currentReview.words.length > 0}
                visibleErrorTypes={{ spelling: true, grammar: true, punctuation: true, vocabulary: true }}
                highlightOpacity={visualSettings.highlightOpacity}
                zoom={1}
                pan={{ x: 0, y: 0 }}
                useWavyUnderline={visualSettings.useWavyUnderline}
                showCorrectionText={visualSettings.showCorrectionText}
                className="w-full"
              />
            </div>
            <button
              onClick={() => setShowLightbox(true)}
              className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-black/70 hover:bg-black/80 text-white text-xs font-medium rounded-full transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Expandir
            </button>
          </div>

          {/* Corrections list */}
          {corrections.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Correcciones ({corrections.length})
              </h3>
              <div className="space-y-2">
                {corrections.map((corr, idx) => (
                  <CorrectionItem key={corr.id} correction={corr} index={idx} />
                ))}
              </div>
            </div>
          ) : !isProcessing && !isReanalyzing && (
            <div className="text-center py-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Check className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 dark:text-green-300 font-medium">¡Sin errores!</p>
            </div>
          )}

          {/* Feedback & Grade */}
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Feedback</h3>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${gradeColor}`}>{grade}/100</span>
                {!isEditingFeedback && (
                  <button
                    onClick={() => setIsEditingFeedback(true)}
                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                  >
                    <Edit3 className="w-4 h-4 text-zinc-500" />
                  </button>
                )}
              </div>
            </div>

            {isEditingFeedback ? (
              <div className="space-y-3">
                <textarea
                  value={editedFeedback}
                  onChange={(e) => setEditedFeedback(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Feedback para el estudiante..."
                />
                <div className="flex items-center gap-3">
                  <label className="text-sm text-zinc-600 dark:text-zinc-400">Calificación:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editedGrade}
                    onChange={(e) => setEditedGrade(e.target.value)}
                    className="w-20 px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                  <button
                    onClick={() => setIsEditingFeedback(false)}
                    className="ml-auto text-sm text-blue-600 hover:text-blue-700"
                  >
                    Listo
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                {editedFeedback || currentReview.overallFeedback || 'Sin comentarios'}
              </p>
            )}
          </div>

          {/* Re-analyze option */}
          {!isProcessing && !isReanalyzing && (
            <div className="space-y-2">
              <button
                onClick={() => setShowReanalyze(!showReanalyze)}
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                <RefreshCw className="w-4 h-4" />
                Re-analizar con otro perfil
                <ChevronDown className={`w-4 h-4 transition-transform ${showReanalyze ? 'rotate-180' : ''}`} />
              </button>

              {showReanalyze && (
                <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <select
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                    ))}
                  </select>
                  <BaseButton
                    variant="secondary"
                    size="sm"
                    onClick={handleReanalyze}
                    disabled={!selectedProfileId}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Analizar
                  </BaseButton>
                </div>
              )}
            </div>
          )}

          {/* Advanced visual settings (collapsed) */}
          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Configuración visual
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">Opacidad de resaltado</span>
                  <select
                    value={visualSettings.highlightOpacity}
                    onChange={(e) => setVisualSettings({ ...visualSettings, highlightOpacity: parseFloat(e.target.value) })}
                    className="px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900"
                  >
                    <option value={0.15}>Baja</option>
                    <option value={0.25}>Media</option>
                    <option value={0.4}>Alta</option>
                  </select>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={visualSettings.useWavyUnderline}
                    onChange={(e) => setVisualSettings({ ...visualSettings, useWavyUnderline: e.target.checked })}
                    className="w-3.5 h-3.5"
                  />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">Subrayado ondulado</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={visualSettings.showCorrectionText}
                    onChange={(e) => setVisualSettings({ ...visualSettings, showCorrectionText: e.target.checked })}
                    className="w-3.5 h-3.5"
                  />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">Mostrar correcciones en imagen</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
          <BaseButton
            variant="primary"
            fullWidth
            onClick={handleApprove}
            disabled={isApproving || isProcessing || isReanalyzing || isFailed}
            loading={isApproving}
          >
            <Check className="w-5 h-5" />
            {isApproving ? 'Aprobando...' : 'Aprobar y Publicar'}
          </BaseButton>
        </div>
      </div>

      {/* Lightbox */}
      <ImageLightbox
        isOpen={showLightbox}
        onClose={() => setShowLightbox(false)}
        imageUrl={currentReview.imageUrl}
        alt="Tarea del estudiante"
        words={currentReview.words || []}
        errors={corrections}
        showOverlay={currentReview.words && currentReview.words.length > 0}
        visibleErrorTypes={{ spelling: true, grammar: true, punctuation: true, vocabulary: true }}
        highlightOpacity={visualSettings.highlightOpacity}
        useWavyUnderline={visualSettings.useWavyUnderline}
        showCorrectionText={visualSettings.showCorrectionText}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
}
