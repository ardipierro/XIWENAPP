/**
 * @fileoverview FlashCard Viewer - Visor de flashcards con flip animation
 * @module components/FlashCardViewer
 */

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, Check, X, HelpCircle, Volume2, Star, Zap } from 'lucide-react';
import { BaseButton, BaseModal, BaseBadge, BaseAlert, CategoryBadge } from './common';
import { getFlashCardCollectionById } from '../firebase/flashcards';
import { generateFallbackAudio } from '../services/elevenLabsService';
import { saveCardProgress, getCollectionProgress } from '../services/spacedRepetitionService';
import logger from '../utils/logger';

/**
 * FlashCard Viewer
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el visor está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {string} props.collectionId - ID de la colección a mostrar
 * @param {Object} props.user - Usuario actual
 */
export function FlashCardViewer({ isOpen, onClose, collectionId, user }) {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [learned, setLearned] = useState(new Set());
  const [showHint, setShowHint] = useState(false);
  const [cardProgress, setCardProgress] = useState({});
  const [reviewMode, setReviewMode] = useState(false); // Modo repaso espaciado

  useEffect(() => {
    if (isOpen && collectionId) {
      loadCollection();
    }
  }, [isOpen, collectionId]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      const data = await getFlashCardCollectionById(collectionId);
      setCollection(data);
      setCurrentIndex(0);
      setIsFlipped(false);
      setLearned(new Set());
      setShowHint(false);
      logger.info('FlashCard collection loaded:', data);

      // Cargar progreso del usuario si está disponible
      if (user) {
        const progress = await getCollectionProgress(user.uid, collectionId);
        setCardProgress(progress);
        logger.info('User progress loaded:', progress);
      }
    } catch (error) {
      logger.error('Error loading flashcard collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setShowHint(false);
  };

  const handleNext = () => {
    if (currentIndex < collection.cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleMarkLearned = () => {
    const newLearned = new Set(learned);
    if (learned.has(currentIndex)) {
      newLearned.delete(currentIndex);
    } else {
      newLearned.add(currentIndex);
    }
    setLearned(newLearned);
    logger.debug(`Card ${currentIndex} marked as ${learned.has(currentIndex) ? 'not learned' : 'learned'}`);
  };

  /**
   * Guardar calificación de la tarjeta (Spaced Repetition)
   * @param {number} quality - 0=Again, 2=Hard, 3=Good, 5=Easy
   */
  const handleRateCard = async (quality) => {
    if (!user) {
      logger.warn('Cannot save progress without user');
      return;
    }

    const card = collection.cards[currentIndex];

    try {
      // Guardar progreso
      const result = await saveCardProgress(user.uid, collectionId, card.id, quality);

      if (result.success) {
        // Recargar progreso
        const progress = await getCollectionProgress(user.uid, collectionId);
        setCardProgress(progress);

        // Auto-avanzar a siguiente tarjeta
        if (currentIndex < collection.cards.length - 1) {
          setTimeout(() => {
            handleNext();
          }, 300);
        }

        logger.info(`Card rated with quality ${quality}`);
      }
    } catch (error) {
      logger.error('Error rating card:', error);
    }
  };

  const handleShowHint = () => {
    setShowHint(!showHint);
  };

  const handlePlayAudio = async () => {
    const card = collection.cards[currentIndex];

    try {
      if (card.audioUrl) {
        // Usar audio premium de ElevenLabs
        logger.info('Playing premium audio from:', card.audioUrl);
        const audio = new Audio(card.audioUrl);
        await audio.play();
      } else {
        // Fallback a Web Speech API
        logger.info('Using Web Speech API fallback');
        await generateFallbackAudio(card.spanish);
      }
    } catch (error) {
      logger.error('Error playing audio:', error);
      // Último fallback
      try {
        await generateFallbackAudio(card.spanish);
      } catch (fallbackError) {
        logger.error('Fallback audio also failed:', fallbackError);
      }
    }
  };

  const handleClose = () => {
    setCollection(null);
    setCurrentIndex(0);
    setIsFlipped(false);
    setLearned(new Set());
    setShowHint(false);
    onClose();
  };

  if (!collection || loading) {
    return null;
  }

  const currentCard = collection.cards[currentIndex];
  const progress = ((currentIndex + 1) / collection.cards.length) * 100;
  const learnedCount = learned.size;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={collection.name}
      size="large"
      className="flashcard-viewer-modal"
    >
      <div className="flashcard-viewer">
        {/* Header Info */}
        <div className="flashcard-viewer__header">
          <div className="flashcard-viewer__badges">
            <CategoryBadge
              type="cefr"
              value={collection.level}
              size="sm"
            />
            <BaseBadge variant="default" size="sm">
              {currentIndex + 1} / {collection.cards.length}
            </BaseBadge>
            <BaseBadge variant="success" size="sm">
              ✓ {learnedCount} aprendidas
            </BaseBadge>
          </div>

          {/* Progress Bar */}
          <div className="flashcard-viewer__progress-bar">
            <div
              className="flashcard-viewer__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <div className="flashcard-viewer__card-container">
          <div
            className={`flashcard-viewer__card ${isFlipped ? 'flashcard-viewer__card--flipped' : ''}`}
            onClick={handleFlip}
          >
            {/* Front (Spanish) */}
            <div className="flashcard-viewer__card-face flashcard-viewer__card-front">
              {currentCard.imageUrl && (
                <div className="flashcard-viewer__card-image">
                  <img src={currentCard.imageUrl} alt={currentCard.spanish} />
                </div>
              )}
              <div className="flashcard-viewer__card-content">
                <div className="flashcard-viewer__card-text">
                  {currentCard.spanish}
                </div>
                <button
                  className="flashcard-viewer__audio-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayAudio();
                  }}
                >
                  <Volume2 size={20} />
                </button>
              </div>
              <div className="flashcard-viewer__flip-hint">
                <RotateCw size={18} />
                Click para voltear
              </div>
            </div>

            {/* Back (Translation) */}
            <div className="flashcard-viewer__card-face flashcard-viewer__card-back">
              <div className="flashcard-viewer__card-content">
                <div className="flashcard-viewer__card-translation">
                  {currentCard.translation}
                </div>
                {currentCard.context && (
                  <div className="flashcard-viewer__card-context">
                    <strong>Contexto:</strong> {currentCard.context}
                  </div>
                )}
              </div>
              <div className="flashcard-viewer__flip-hint">
                <RotateCw size={18} />
                Click para volver
              </div>
            </div>
          </div>

          {/* Hint */}
          {showHint && currentCard.hint && (
            <BaseAlert variant="info" className="flashcard-viewer__hint">
              <HelpCircle size={18} />
              {currentCard.hint}
            </BaseAlert>
          )}
        </div>

        {/* Controls */}
        <div className="flashcard-viewer__controls">
          {/* Spaced Repetition Rating (mostrar cuando está volteada) */}
          {isFlipped && user && (
            <div className="flashcard-viewer__rating-buttons">
              <BaseButton
                variant="outline"
                size="sm"
                onClick={() => handleRateCard(0)}
                style={{ borderColor: '#ef4444', color: '#ef4444' }}
              >
                <X size={16} />
                Otra vez
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                onClick={() => handleRateCard(2)}
                style={{ borderColor: '#f59e0b', color: '#f59e0b' }}
              >
                Difícil
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                onClick={() => handleRateCard(3)}
                style={{ borderColor: '#3b82f6', color: '#3b82f6' }}
              >
                <Check size={16} />
                Bien
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                onClick={() => handleRateCard(5)}
                style={{ borderColor: '#22c55e', color: '#22c55e' }}
              >
                <Zap size={16} />
                Fácil
              </BaseButton>
            </div>
          )}

          <div className="flashcard-viewer__nav-buttons">
            <BaseButton
              variant="ghost"
              icon={ChevronLeft}
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              Anterior
            </BaseButton>

            <div className="flashcard-viewer__center-buttons">
              {currentCard.hint && (
                <BaseButton
                  variant="outline"
                  icon={HelpCircle}
                  onClick={handleShowHint}
                  size="sm"
                >
                  {showHint ? 'Ocultar' : 'Pista'}
                </BaseButton>
              )}

              <BaseButton
                variant={learned.has(currentIndex) ? 'success' : 'outline'}
                icon={learned.has(currentIndex) ? Check : X}
                onClick={handleMarkLearned}
                size="sm"
              >
                {learned.has(currentIndex) ? 'Aprendida' : 'Marcar'}
              </BaseButton>
            </div>

            <BaseButton
              variant="ghost"
              icon={ChevronRight}
              onClick={handleNext}
              disabled={currentIndex === collection.cards.length - 1}
            >
              Siguiente
            </BaseButton>
          </div>
        </div>

        {/* Summary */}
        {currentIndex === collection.cards.length - 1 && (
          <BaseAlert variant="success" className="mt-4">
            <Check size={18} />
            ¡Has completado todas las tarjetas! {learnedCount} de {collection.cards.length} marcadas como aprendidas.
          </BaseAlert>
        )}
      </div>
    </BaseModal>
  );
}

export default FlashCardViewer;
