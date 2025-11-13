/**
 * @fileoverview Reaction Picker Component - Quick emoji reactions
 * @module components/ReactionPicker
 *
 * Refactorizado para usar Design System 3.0 (100% Tailwind, 0 CSS custom)
 */

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

/**
 * Reaction Picker Component
 * @param {Object} props
 * @param {Function} props.onSelect - Callback when reaction is selected
 */
function ReactionPicker({ onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          className="
            w-10 h-10 flex items-center justify-center rounded-lg text-2xl
            hover:scale-110 active:scale-95 transition-all duration-150
          "
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)'
          }}
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
