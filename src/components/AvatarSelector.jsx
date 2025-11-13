import {
  User, GraduationCap, FlaskConical, Palette, Dumbbell,
  BookOpen, Star, Rocket, Trophy, Brain, Medal,
  BookMarked, Crown, Flame, Zap, Smile, Glasses,
  UserCog, Bot
} from 'lucide-react';
import BaseModal from './common/BaseModal';
import BaseButton from './common/BaseButton';

/**
 * AvatarSelector - Modal para seleccionar avatar de usuario
 * Refactorizado para usar Design System 3.0 (BaseModal + Tailwind, 0 CSS custom)
 */

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
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Selecciona tu Avatar"
      size="lg"
    >
      {/* Grid de avatares */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 p-4">
        {Object.entries(AVATARS).map(([id, { icon: Icon, label }]) => {
          const isSelected = currentAvatar === id;

          return (
            <button
              key={id}
              className={`
                relative p-4 rounded-lg flex flex-col items-center justify-center
                transition-all duration-200 hover:scale-105
                ${isSelected ? 'ring-2' : ''}
              `}
              style={{
                backgroundColor: isSelected
                  ? 'var(--color-primary-bg)'
                  : 'var(--color-bg-secondary)',
                border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                ringColor: 'var(--color-primary)'
              }}
              onClick={() => onSelectAvatar(id)}
              title={label}
            >
              <Icon size={32} strokeWidth={2} />
              {isSelected && (
                <div
                  className="absolute top-1 right-1 rounded-full p-0.5"
                  style={{ backgroundColor: 'var(--color-success)' }}
                >
                  <Star size={12} fill="white" color="white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer con botón cerrar */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <BaseButton
          variant="secondary"
          onClick={onClose}
          fullWidth
        >
          Cerrar
        </BaseButton>
      </div>
    </BaseModal>
  );
}

export default AvatarSelector;
