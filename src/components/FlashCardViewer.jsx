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
    >
      <div className="w-full space-y-6">
        {/* Header Info */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
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
          <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Flashcard Container */}
        <div className="w-full min-h-[400px] flex items-center justify-center perspective-1000">
          <div
            className={`relative w-full max-w-2xl aspect-[3/2] cursor-pointer transition-transform duration-500 transform-style-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            onClick={handleFlip}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            {/* Front (Spanish) */}
            <div
              className="absolute inset-0 backface-hidden rounded-xl shadow-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-900 border-2 border-blue-200 dark:border-blue-700 flex flex-col items-center justify-center p-8"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {currentCard.imageUrl && (
                <div className="w-full max-h-48 mb-6 rounded-lg overflow-hidden">
                  <img
                    src={currentCard.imageUrl}
                    alt={currentCard.spanish}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="text-center flex-1 flex flex-col items-center justify-center">
                <div className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-6">
                  {currentCard.spanish}
                </div>
                <button
                  className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayAudio();
                  }}
                >
                  <Volume2 size={24} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <RotateCw size={16} />
                <span>Click para voltear</span>
              </div>
            </div>

            {/* Back (Translation) */}
            <div
              className="absolute inset-0 backface-hidden rounded-xl shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-zinc-800 dark:to-zinc-900 border-2 border-green-200 dark:border-green-700 flex flex-col items-center justify-center p-8"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <div className="text-center flex-1 flex flex-col items-center justify-center">
                <div className="text-3xl md:text-4xl font-semibold text-zinc-900 dark:text-white mb-4">
                  {currentCard.translation}
                </div>
                {currentCard.context && (
                  <div className="text-sm text-zinc-600 dark:text-zinc-300 max-w-md mt-4 p-4 bg-white/50 dark:bg-zinc-800/50 rounded-lg">
                    <strong className="text-zinc-900 dark:text-white">Contexto:</strong>{' '}
                    {currentCard.context}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <RotateCw size={16} />
                <span>Click para volver</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hint */}
        {showHint && currentCard.hint && (
          <BaseAlert variant="info" className="mt-4">
            <div className="flex items-start gap-2">
              <HelpCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{currentCard.hint}</span>
            </div>
          </BaseAlert>
        )}

        {/* Controls */}
        <div className="space-y-4">
          {/* Spaced Repetition Rating (mostrar cuando está volteada) */}
          {isFlipped && user && (
            <div className="flex flex-wrap gap-2 justify-center">
              <BaseButton
                variant="outline"
                size="sm"
                onClick={() => handleRateCard(0)}
                className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <X size={16} />
                Otra vez
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                onClick={() => handleRateCard(2)}
                className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                Difícil
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                onClick={() => handleRateCard(3)}
                className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Check size={16} />
                Bien
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                onClick={() => handleRateCard(5)}
                className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <Zap size={16} />
                Fácil
              </BaseButton>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <BaseButton
              variant="ghost"
              icon={ChevronLeft}
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              Anterior
            </BaseButton>

            <div className="flex gap-2">
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
                icon={learned.has(currentIndex) ? Check : Star}
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
          <BaseAlert variant="success">
            <div className="flex items-start gap-2">
              <Check size={18} className="flex-shrink-0 mt-0.5" />
              <span>
                ¡Has completado todas las tarjetas! {learnedCount} de {collection.cards.length} marcadas como aprendidas.
              </span>
            </div>
          </BaseAlert>
        )}
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </BaseModal>
  );
}

export default FlashCardViewer;
