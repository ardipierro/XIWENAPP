/**
 * @fileoverview Reaction Picker Component - Quick emoji reactions
 * @module components/ReactionPicker
 *
 * 100% Tailwind CSS (sin archivo CSS)
 */

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

/**
 * Reaction Picker Component
 * @param {Object} props
 * @param {Function} props.onSelect - Callback when reaction is selected
 */
function ReactionPicker({ onSelect }) {
  return (
    <div className="absolute bottom-full left-0 mb-2
                    flex gap-1 p-2
                    bg-white dark:bg-zinc-900
                    border-2 border-gray-200 dark:border-zinc-700
                    rounded-xl shadow-lg
                    animate-[reactionPickerPop_0.2s_ease]
                    z-[100]">
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          className="p-1.5 bg-transparent border-none rounded-lg
                     text-xl cursor-pointer
                     flex items-center justify-center
                     w-9 h-9
                     hover:bg-gray-100 dark:hover:bg-zinc-800
                     hover:scale-110
                     active:scale-105
                     transition-all duration-200"
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
