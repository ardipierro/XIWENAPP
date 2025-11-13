/**
 * @fileoverview Emoji Picker Component
 * @module components/EmojiPicker
 *
 * Refactorizado para usar Design System 3.0 (100% Tailwind, 0 CSS custom)
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
    icon: '⭐',
    emojis: [
      '❤', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '♈', '♉', '♊', '♋', '♌', '♍', '♎',
      '♏', '♐', '♑', '♒', '♓', '⭐', '🌟', '✨',
      '⚡', '🔥', '💥', '💫', '💦', '💨', '🌈', '☀',
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
    <div
      className="w-80 rounded-lg shadow-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)'
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Emojis
        </span>
        <button
          className="p-1 rounded hover:bg-opacity-80 transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-1 p-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
          <button
            key={key}
            className={`
              px-3 py-2 rounded text-xl transition-all duration-150
              hover:scale-110
            `}
            style={{
              backgroundColor: selectedCategory === key
                ? 'var(--color-primary-bg)'
                : 'transparent',
              borderBottom: selectedCategory === key
                ? '2px solid var(--color-primary)'
                : '2px solid transparent'
            }}
            onClick={() => setSelectedCategory(key)}
            title={category.name}
          >
            {category.icon}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="grid grid-cols-8 gap-1 p-3 max-h-64 overflow-y-auto">
        {EMOJI_CATEGORIES[selectedCategory].emojis.map((emoji, index) => (
          <button
            key={index}
            className="
              p-2 text-2xl rounded hover:scale-125
              transition-transform duration-100
            "
            style={{
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
