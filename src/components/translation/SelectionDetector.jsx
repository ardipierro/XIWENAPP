/**
 * SelectionDetector Component
 * Detects text selection and shows translation button
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Languages } from 'lucide-react';
import PropTypes from 'prop-types';
import TranslationPopup from './TranslationPopup';
import useTranslator from '../../hooks/useTranslator';

const SelectionDetector = ({ children, enabled = true, containerRef = null }) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState(null);
  const [showButton, setShowButton] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const buttonRef = useRef(null);
  const { translate, isTranslating, error, lastTranslation, clearError } = useTranslator();

  /**
   * Handle text selection
   */
  const handleSelection = useCallback(() => {
    if (!enabled) return;

    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text && text.length > 0 && text.length <= 200) {
      // Only translate reasonable length text
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
          setShowButton(false);
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
      setShowButton(true);
      setShowPopup(false); // Hide popup if showing
    } else {
      setShowButton(false);
      setShowPopup(false);
    }
  }, [enabled, containerRef]);

  /**
   * Handle translate button click
   */
  const handleTranslate = useCallback(async () => {
    if (!selectedText) return;

    try {
      await translate(selectedText);
      setShowButton(false);
      setShowPopup(true);
    } catch (err) {
      console.error('Translation error:', err);
      setShowPopup(true); // Show popup with error
    }
  }, [selectedText, translate]);

  /**
   * Close popup and reset state
   */
  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    setShowButton(false);
    setSelectedText('');
    setSelectionPosition(null);
    clearError();

    // Clear text selection
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
  }, [clearError]);

  /**
   * Handle click outside button
   */
  const handleClickOutside = useCallback((e) => {
    if (buttonRef.current && !buttonRef.current.contains(e.target)) {
      setShowButton(false);
    }
  }, []);

  // Set up selection listener
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [enabled, handleSelection, handleClickOutside]);

  /**
   * Calculate button position
   */
  const getButtonStyle = () => {
    if (!selectionPosition) return {};

    const buttonWidth = 120;
    const buttonHeight = 40;
    const offset = 8;

    // Position button below selection by default
    let top = selectionPosition.bottom + offset;
    let left = selectionPosition.left + selectionPosition.width / 2 - buttonWidth / 2;

    // If button would be below viewport, position it above selection
    if (top + buttonHeight > window.innerHeight + window.scrollY - 20) {
      top = selectionPosition.top - buttonHeight - offset;
    }

    // Keep button within horizontal bounds
    if (left < 10) {
      left = 10;
    }
    if (left + buttonWidth > window.innerWidth - 10) {
      left = window.innerWidth - buttonWidth - 10;
    }

    return {
      position: 'fixed',
      top: `${top - window.scrollY}px`,
      left: `${left - window.scrollX}px`,
      zIndex: 9999
    };
  };

  return (
    <>
      {children}

      {/* Translation Button */}
      {showButton && !showPopup && (
        <div
          ref={buttonRef}
          style={getButtonStyle()}
          className="animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="
              flex items-center gap-2 px-4 py-2
              bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
              text-white text-sm font-medium
              rounded-lg shadow-lg
              transition-all duration-200
              hover:scale-105 active:scale-95
              disabled:cursor-not-allowed
            "
          >
            <Languages size={16} strokeWidth={2} />
            <span>Traducir</span>
            <span className="text-xs opacity-90">翻译</span>
          </button>
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
