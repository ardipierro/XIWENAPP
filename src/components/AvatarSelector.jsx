/**
 * AvatarSelector - 100% Tailwind CSS (sin archivo CSS)
 * Modal para seleccionar avatar de usuario
 */
import {
  User, GraduationCap, FlaskConical, Palette, Dumbbell,
  BookOpen, Star, Rocket, Trophy, Brain, Medal,
  BookMarked, Crown, Flame, Zap, Smile, Glasses,
  UserCog, Bot, X
} from 'lucide-react';

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
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000]"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 dark:bg-zinc-900 rounded-lg p-6
                   max-w-[500px] w-[90%] sm:w-[95%] max-h-[80vh] overflow-y-auto
                   shadow-2xl border border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-100 m-0">
            Selecciona tu Avatar
          </h3>
          <button
            className="w-8 h-8 rounded border-none bg-transparent
                       text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100
                       cursor-pointer transition-colors
                       flex items-center justify-center p-0"
            onClick={onClose}
          >
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        {/* Avatars Grid - Responsive */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(64px,1fr))]
                        gap-2 mb-5">
          {Object.entries(AVATARS).map(([id, { icon: Icon, label }]) => {
            const isSelected = currentAvatar === id;
            return (
              <button
                key={id}
                className={`relative w-full aspect-square
                           border rounded flex items-center justify-center p-0
                           cursor-pointer transition-colors
                           ${isSelected
                             ? 'border-zinc-600 bg-zinc-800'
                             : 'border-zinc-700 bg-zinc-950 hover:border-zinc-600 hover:bg-zinc-900'
                           }`}
                onClick={() => onSelectAvatar(id)}
                title={label}
              >
                <Icon
                  size={32}
                  strokeWidth={2}
                  className={`${isSelected
                    ? 'text-zinc-100'
                    : 'text-zinc-400 group-hover:text-zinc-300'
                  } w-7 h-7 sm:w-8 sm:h-8`}
                />
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5
                                 w-[18px] h-[18px]
                                 bg-zinc-600 text-zinc-100
                                 rounded-full
                                 flex items-center justify-center
                                 border-2 border-zinc-900">
                    <Star size={12} fill="currentColor" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Close Button */}
        <button
          className="w-full py-2.5 px-4
                     bg-zinc-700 hover:bg-zinc-600
                     text-white text-sm font-medium
                     rounded cursor-pointer transition-colors
                     border-none"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default AvatarSelector;
