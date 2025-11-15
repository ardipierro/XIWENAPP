/**
 * @fileoverview FlashCard Viewer - Visor de flashcards con flip animation
 * @module components/FlashCardViewer
 */

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, Check, X, HelpCircle, Volume2 } from 'lucide-react';
import { BaseButton, BaseModal, BaseBadge, BaseAlert } from './common';
import { getFlashCardCollectionById } from '../firebase/flashcards';
import logger from '../utils/logger';
import './FlashCardViewer.css';

/**
 * FlashCard Viewer
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el visor está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {string} props.collectionId - ID de la colección a mostrar
 */
export function FlashCardViewer({ isOpen, onClose, collectionId }) {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [learned, setLearned] = useState(new Set());
  const [showHint, setShowHint] = useState(false);

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

  const handleShowHint = () => {
    setShowHint(!showHint);
  };

  const handlePlayAudio = () => {
    const card = collection.cards[currentIndex];
    if (card.audioUrl) {
      const audio = new Audio(card.audioUrl);
      audio.play();
    } else {
      // Usar TTS del navegador como fallback
      const utterance = new SpeechSynthesisUtterance(card.spanish);
      utterance.lang = 'es-ES';
      window.speechSynthesis.speak(utterance);
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
            <BaseBadge variant="info" size="sm">
              {collection.level}
            </BaseBadge>
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
