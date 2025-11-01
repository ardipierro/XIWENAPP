import { useState } from 'react';
import {
  User, GraduationCap, FlaskConical, Palette, Dumbbell,
  BookOpen, Star, Rocket, Trophy, Brain, Medal,
  BookMarked, Crown, Flame, Zap, Smile, Glasses,
  UserCog, Bot
} from 'lucide-react';
import './AvatarSelector.css';

// Avatares disponibles con iconos de lucide-react
export const AVATARS = {
  default: { icon: User, label: 'Usuario' },
  student1: { icon: GraduationCap, label: 'Estudiante' },
  student2: { icon: BookOpen, label: 'Lector' },
  scientist: { icon: FlaskConical, label: 'Científico' },
  artist: { icon: Palette, label: 'Artista' },
  athlete: { icon: Dumbbell, label: 'Atleta' },
  reader: { icon: BookMarked, label: 'Estudioso' },
  star: { icon: Star, label: 'Estrella' },
  rocket: { icon: Rocket, label: 'Cohete' },
  trophy: { icon: Trophy, label: 'Trofeo' },
  brain: { icon: Brain, label: 'Cerebro' },
  medal: { icon: Medal, label: 'Medalla' },
  teacher: { icon: UserCog, label: 'Profesor' },
  admin: { icon: Crown, label: 'Admin' },
  fire: { icon: Flame, label: 'Fuego' },
  lightning: { icon: Zap, label: 'Rayo' },
  smile: { icon: Smile, label: 'Feliz' },
  cool: { icon: Glasses, label: 'Cool' },
  robot: { icon: Bot, label: 'Robot' }
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
          {Object.entries(AVATARS).map(([id, { icon: Icon, label }]) => (
            <button
              key={id}
              className={`avatar-option ${currentAvatar === id ? 'selected' : ''}`}
              onClick={() => onSelectAvatar(id)}
              title={label}
            >
              <Icon size={32} strokeWidth={2} className="avatar-icon" />
              {currentAvatar === id && (
                <div className="selected-indicator">
                  <Star size={12} fill="currentColor" />
                </div>
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
