/**
 * @fileoverview Reaction Picker Component - Quick emoji reactions
 * @module components/ReactionPicker
 */

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

/**
 * Reaction Picker Component
 * @param {Object} props
 * @param {Function} props.onSelect - Callback when reaction is selected
 */
function ReactionPicker({ onSelect }) {
  return (
    <div className="absolute bottom-full left-0 flex gap-1 p-2 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] z-[100] mb-2 animate-[reactionPickerPop_0.2s_ease]">
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          className="p-1.5 bg-transparent border-none rounded-lg text-xl cursor-pointer transition-all flex items-center justify-center w-9 h-9 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-120 active:scale-110"
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
