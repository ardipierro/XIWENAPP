/**
 * @fileoverview Reaction Picker Component - Quick emoji reactions
 * @module components/ReactionPicker
 */

import './ReactionPicker.css';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

/**
 * Reaction Picker Component
 * @param {Object} props
 * @param {Function} props.onSelect - Callback when reaction is selected
 */
function ReactionPicker({ onSelect }) {
  return (
    <div className="reaction-picker">
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          className="reaction-btn-quick"
          onClick={() => onSelect(emoji)}
          title={`Reaccionar con ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export default ReactionPicker;
