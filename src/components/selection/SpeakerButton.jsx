/**
 * SpeakerButton Component
 * Floating button to speak selected text with TTS
 * Mobile-first design with dark mode support
 */

import React, { useCallback } from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Floating button component for text-to-speech
 * Follows XIWENAPP design system with Tailwind CSS
 */
const SpeakerButton = ({ onClick, isGenerating, position }) => {
  /**
   * Calculate button position based on selection
   */
  const getButtonStyle = useCallback(() => {
    if (!position) return {};

    const buttonWidth = 140; // Slightly wider for "Pronunciar 🔊"
    const buttonHeight = 40;
    const offset = 8;

    // Position button below selection by default
    let top = position.bottom + offset;
    let left = position.left + position.width / 2 - buttonWidth / 2;

    // If button would be below viewport, position it above selection
    if (top + buttonHeight > window.innerHeight + window.scrollY - 20) {
      top = position.top - buttonHeight - offset;
    }

    // Keep button within horizontal bounds (mobile-first)
    const horizontalPadding = 10;
    if (left < horizontalPadding) {
      left = horizontalPadding;
    }
    if (left + buttonWidth > window.innerWidth - horizontalPadding) {
      left = window.innerWidth - buttonWidth - horizontalPadding;
    }

    return {
      position: 'fixed',
      top: `${top - window.scrollY}px`,
      left: `${left - window.scrollX}px`,
      zIndex: 'var(--z-popover)' // Using CSS variable for z-index (1060)
    };
  }, [position]);

  return (
    <div
      style={getButtonStyle()}
      className="animate-in fade-in slide-in-from-top-1 duration-150"
    >
      <button
        onClick={onClick}
        disabled={isGenerating}
        className="
          flex items-center gap-2 px-4 py-2
          bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600
          disabled:bg-indigo-400 dark:disabled:bg-indigo-300
          text-white text-sm font-medium
          rounded-lg shadow-lg
          transition-all duration-200
          hover:scale-105 active:scale-95
          disabled:cursor-not-allowed
          min-h-tap-sm
        "
        aria-label="Pronunciar texto seleccionado"
      >
        {isGenerating ? (
          <Loader2 size={16} strokeWidth={2} className="animate-spin" />
        ) : (
          <Volume2 size={16} strokeWidth={2} />
        )}
        <span className="whitespace-nowrap">
          {isGenerating ? 'Generando...' : 'Pronunciar'}
        </span>
        {!isGenerating && (
          <span className="text-base opacity-90">🔊</span>
        )}
      </button>
    </div>
  );
};

SpeakerButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  isGenerating: PropTypes.bool,
  position: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    bottom: PropTypes.number.isRequired
  })
};

SpeakerButton.defaultProps = {
  isGenerating: false,
  position: null
};

export default SpeakerButton;
