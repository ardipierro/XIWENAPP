/**
 * @fileoverview Emoji Picker Component - 100% Tailwind CSS
 * @module components/EmojiPicker
 */

import { useState } from 'react';
import { X } from 'lucide-react';

const EMOJI_CATEGORIES = {
  smileys: {
    name: 'Smileys',
    icon: '😊',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
      '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
      '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜',
      '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
      '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
      '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒'
    ]
  },
  gestures: {
    name: 'Gestures',
    icon: '👍',
    emojis: [
      '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏',
      '✌', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
      '👇', '☝', '👍', '👎', '✊', '👊', '🤛', '🤜',
      '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍', '💪'
    ]
  },
  hearts: {
    name: 'Hearts',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗',
      '💖', '💘', '💝', '💟', '☮', '✝', '☪', '🕉'
    ]
  },
  animals: {
    name: 'Animals',
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
      '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
      '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞'
    ]
  },
  food: {
    name: 'Food',
    icon: '🍕',
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇',
      '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥',
      '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶',
      '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠',
      '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳',
      '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴',
      '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆',
      '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝'
    ]
  },
  activities: {
    name: 'Activities',
    icon: '⚽',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
      '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
      '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿',
      '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌'
    ]
  },
  travel: {
    name: 'Travel',
    icon: '✈️',
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑',
      '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽',
      '🦼', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔',
      '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋',
      '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇',
      '🚊', '🚉', '✈', '🛫', '🛬', '🛩', '💺', '🚁'
    ]
  },
  objects: {
    name: 'Objects',
    icon: '💡',
    emojis: [
      '⌚', '📱', '📲', '💻', '⌨', '🖥', '🖨', '🖱',
      '🖲', '🕹', '🗜', '💽', '💾', '💿', '📀', '📼',
      '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎',
      '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '🧭',
      '⏱', '⏲', '⏰', '🕰', '⌛', '⏳', '📡', '🔋',
      '🔌', '💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💸'
    ]
  },
  symbols: {
    name: 'Symbols',
    icon: '🔣',
    emojis: [
      '❤', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '☮', '✝', '☪', '🕉', '☸',
      '✡', '🔯', '🕎', '☯', '☦', '🛐', '⛎', '♈',
      '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
      '♑', '♒', '♓', '🆔', '⚛', '🉑', '☢', '☣',
      '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷', '✴',
      '🆚', '💮', '🉐', '㊙', '㊗', '🈴', '🈵', '🈹'
    ]
  }
};

/**
 * Emoji Picker Component
 * @param {Object} props
 * @param {Function} props.onSelect - Callback when emoji is selected
 * @param {Function} props.onClose - Callback to close picker
 */
function EmojiPicker({ onSelect, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('smileys');

  const handleEmojiClick = (emoji) => {
    onSelect(emoji);
  };

  return (
    <div className="absolute bottom-full left-0 mb-2
                    w-80 max-w-[320px] md:max-w-full max-h-[400px]
                    bg-white dark:bg-zinc-900
                    border-2 border-gray-200 dark:border-zinc-700
                    rounded-xl shadow-2xl
                    flex flex-col
                    animate-[emojiPickerSlideUp_0.3s_ease]
                    z-[1000]">
      {/* Header */}
      <div className="flex items-center justify-between
                      px-4 py-3
                      border-b border-gray-200 dark:border-zinc-700">
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Emojis
        </span>
        <button
          className="p-1 bg-transparent border-none
                     text-gray-500 dark:text-gray-400
                     hover:bg-gray-100 dark:hover:bg-zinc-800
                     hover:text-gray-900 dark:hover:text-gray-100
                     rounded cursor-pointer
                     flex items-center transition-all duration-200"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-1 px-3 py-2
                      border-b border-gray-200 dark:border-zinc-700
                      overflow-x-auto scrollbar-thin
                      scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-600
                      scrollbar-track-transparent">
        {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
          <button
            key={key}
            className={`p-2 bg-transparent border-none rounded-lg
                       text-xl cursor-pointer
                       flex-shrink-0
                       transition-all duration-200
                       ${selectedCategory === key
                         ? 'bg-indigo-500 dark:bg-indigo-600 scale-115'
                         : 'hover:bg-gray-100 dark:hover:bg-zinc-800 hover:scale-110'
                       }`}
            onClick={() => setSelectedCategory(key)}
            title={category.name}
          >
            {category.icon}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="grid grid-cols-6 md:grid-cols-8 gap-1 p-3
                      overflow-y-auto max-h-[280px]
                      scrollbar-thin
                      scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-600
                      scrollbar-track-transparent">
        {EMOJI_CATEGORIES[selectedCategory].emojis.map((emoji, index) => (
          <button
            key={index}
            className="p-2 bg-transparent border-none rounded-md
                       text-2xl cursor-pointer
                       hover:bg-gray-100 dark:hover:bg-zinc-800
                       hover:scale-120
                       active:scale-110
                       flex items-center justify-center
                       transition-all duration-200"
            onClick={() => handleEmojiClick(emoji)}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export default EmojiPicker;
