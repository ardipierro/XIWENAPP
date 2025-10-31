import { useState } from 'react';
import './AvatarSelector.css';

// Avatares disponibles
export const AVATARS = {
  default: '👤',
  student1: '👨‍🎓',
  student2: '👩‍🎓',
  scientist: '🧑‍🔬',
  artist: '🧑‍🎨',
  athlete: '🏃',
  reader: '📚',
  star: '⭐',
  rocket: '🚀',
  trophy: '🏆',
  brain: '🧠',
  medal: '🥇',
  teacher: '👨‍🏫',
  admin: '👑',
  fire: '🔥',
  lightning: '⚡',
  smile: '😊',
  cool: '😎',
  ninja: '🥷',
  robot: '🤖'
};

function AvatarSelector({ currentAvatar, onSelectAvatar, onClose }) {
  return (
    <div className="avatar-selector-overlay" onClick={onClose}>
      <div className="avatar-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="avatar-selector-header">
          <h3 className="avatar-selector-title">Selecciona tu Avatar</h3>
          <button className="avatar-selector-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="avatars-grid">
          {Object.entries(AVATARS).map(([id, emoji]) => (
            <button
              key={id}
              className={`avatar-option ${currentAvatar === id ? 'selected' : ''}`}
              onClick={() => onSelectAvatar(id)}
            >
              <span className="avatar-emoji">{emoji}</span>
              {currentAvatar === id && (
                <span className="selected-indicator">✓</span>
              )}
            </button>
          ))}
        </div>

        <button
          className="btn btn-secondary avatar-close-btn"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default AvatarSelector;
