/**
 * SelectionDetector Component
 * Detects text selection and shows translation + speaker buttons
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Languages } from 'lucide-react';
import PropTypes from 'prop-types';
import TranslationPopup from './TranslationPopup';
import SpeakerButton from '../selection/SpeakerButton';
import useTranslator from '../../hooks/useTranslator';
import useSpeaker from '../../hooks/useSpeaker';
import logger from '../../utils/logger';

const SelectionDetector = ({ children, enabled = true, containerRef = null }) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState(null);
  const [showButtons, setShowButtons] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const buttonsRef = useRef(null);
  const selectionTimeoutRef = useRef(null); // ✅ Para debouncing en iOS
  const { translate, isTranslating, error, lastTranslation, clearError } = useTranslator();
  const { speak, isGenerating, error: speakError, clearError: clearSpeakError } = useSpeaker();

  /**
   * Handle text selection
   * ✅ Mejorado para iOS/iPad con debouncing
   */
  const handleSelection = useCallback(() => {
    if (!enabled) return;

    // ✅ Clear previous timeout (debouncing)
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    // ✅ Delay para permitir que iOS complete la selección nativa
    selectionTimeoutRef.current = setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text && text.length > 0 && text.length <= 200) {
        // Only translate reasonable length text
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          // Check if selection is within our container (if provided)
          if (containerRef?.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const isInContainer =
              rect.top >= containerRect.top &&
              rect.bottom <= containerRect.bottom &&
              rect.left >= containerRect.left &&
              rect.right <= containerRect.right;

            if (!isInContainer) {
              setShowButtons(false);
              return;
            }
          }

          setSelectedText(text);
          setSelectionPosition({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            bottom: rect.bottom + window.scrollY
          });
          setShowButtons(true);
          setShowPopup(false); // Hide popup if showing
        } catch (err) {
          // ✅ Manejo de errores si no hay rango (puede pasar en iOS)
          logger.warn('Selection error (expected on iOS):', err);
          setShowButtons(false);
          setShowPopup(false);
        }
      } else {
        setShowButtons(false);
        setShowPopup(false);
      }
    }, 100); // ✅ 100ms delay para iOS
  }, [enabled, containerRef]);

  /**
   * Handle translate button click
   */
  const handleTranslate = useCallback(async () => {
    if (!selectedText) return;

    try {
      await translate(selectedText);
      setShowButtons(false);
      setShowPopup(true);
    } catch (err) {
      logger.error('Translation error:', err, 'SelectionDetector');
      setShowPopup(true); // Show popup with error
    }
  }, [selectedText, translate]);

  /**
   * Handle speak button click
   * Uses configuration from Firebase (ai_config/global/functions/selection_speaker)
   */
  const handleSpeak = useCallback(async () => {
    if (!selectedText) return;

    try {
      logger.info(`🔊 Speaking selected text: "${selectedText.substring(0, 30)}..."`, 'SelectionDetector');

      // Speak with default configuration from Firebase
      // The useSpeaker hook loads config automatically
      await speak(selectedText);

      // Keep buttons visible while speaking
      // They will hide on new selection or click outside
    } catch (err) {
      logger.error('Speaking error:', err, 'SelectionDetector');
      // Error is handled by useSpeaker hook
    }
  }, [selectedText, speak]);

  /**
   * Close popup and reset state
   */
  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    setShowButtons(false);
    setSelectedText('');
    setSelectionPosition(null);
    clearError();
    clearSpeakError();

    // Clear text selection
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
  }, [clearError, clearSpeakError]);

  /**
   * Handle click outside buttons
   */
  const handleClickOutside = useCallback((e) => {
    if (buttonsRef.current && !buttonsRef.current.contains(e.target)) {
      setShowButtons(false);
    }
  }, []);

  // Set up selection listener
  // ✅ Mejorado para iOS/iPad
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);
    document.addEventListener('selectionchange', handleSelection); // ✅ Mejor para iOS
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
      document.removeEventListener('selectionchange', handleSelection);
      document.removeEventListener('mousedown', handleClickOutside);

      // ✅ Limpiar timeout al desmontar
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [enabled, handleSelection, handleClickOutside]);

  /**
   * Calculate buttons container position
   * Displays 2 buttons side by side on desktop, stacked on mobile
   * ✅ Mejorado para iPad con área táctil más grande
   */
  const getButtonsStyle = () => {
    if (!selectionPosition) return {};

    const buttonsWidth = 300; // ✅ Aumentado para mejor toque en iPad
    const buttonsHeight = 48; // ✅ Aumentado a 48px (mínimo recomendado para touch)
    const offset = 12; // ✅ Mayor offset para no cubrir el texto seleccionado

    // Position buttons below selection by default
    let top = selectionPosition.bottom + offset;
    let left = selectionPosition.left + selectionPosition.width / 2 - buttonsWidth / 2;

    // If buttons would be below viewport, position them above selection
    if (top + buttonsHeight > window.innerHeight + window.scrollY - 20) {
      top = selectionPosition.top - buttonsHeight - offset;
    }

    // Keep buttons within horizontal bounds (mobile-first)
    const horizontalPadding = 10;
    if (left < horizontalPadding) {
      left = horizontalPadding;
    }
    if (left + buttonsWidth > window.innerWidth - horizontalPadding) {
      left = window.innerWidth - buttonsWidth - horizontalPadding;
    }

    return {
      position: 'fixed',
      top: `${top - window.scrollY}px`,
      left: `${left - window.scrollX}px`,
      zIndex: 'var(--z-popover)' // Using CSS variable (1060)
    };
  };

  return (
    <>
      {children}

      {/* Action Buttons - Translate + Speak */}
      {showButtons && !showPopup && (
        <div
          ref={buttonsRef}
          style={getButtonsStyle()}
          className="animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="flex gap-2 flex-wrap">
            {/* Translate Button - ✅ Mejorado para iPad */}
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="
                flex items-center justify-center gap-2 px-5 py-3
                bg-blue-600 hover:bg-blue-700 dark:bg-gray-500 dark:hover:bg-blue-600
                disabled:bg-blue-400 dark:disabled:bg-blue-300
                text-white text-sm font-medium
                rounded-lg shadow-lg
                transition-all duration-200
                hover:scale-105 active:scale-95
                disabled:cursor-not-allowed
                min-h-[44px] min-w-[140px]
                touch-manipulation
              "
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Traducir texto seleccionado"
            >
              <Languages size={18} strokeWidth={2} />
              <span className="whitespace-nowrap">Traducir</span>
              <span className="text-xs opacity-90">翻译</span>
            </button>

            {/* Speak Button - ✅ Mejorado para iPad */}
            <button
              onClick={handleSpeak}
              disabled={isGenerating}
              className="
                flex items-center justify-center gap-2 px-5 py-3
                bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600
                disabled:bg-indigo-400 dark:disabled:bg-indigo-300
                text-white text-sm font-medium
                rounded-lg shadow-lg
                transition-all duration-200
                hover:scale-105 active:scale-95
                disabled:cursor-not-allowed
                min-h-[44px] min-w-[140px]
                touch-manipulation
              "
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Pronunciar texto seleccionado"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="whitespace-nowrap">Generando...</span>
                </>
              ) : (
                <>
                  <span className="text-base">🔊</span>
                  <span className="whitespace-nowrap">Pronunciar</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Translation Popup */}
      {showPopup && (
        <TranslationPopup
          translation={lastTranslation}
          position={selectionPosition}
          onClose={handleClosePopup}
          isLoading={isTranslating}
          error={error}
        />
      )}
    </>
  );
};

SelectionDetector.propTypes = {
  children: PropTypes.node.isRequired,
  enabled: PropTypes.bool,
  containerRef: PropTypes.object
};

export default SelectionDetector;
