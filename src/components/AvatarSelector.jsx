import { useState } from 'react';
import Avatar from 'boring-avatars';
import {
  User, GraduationCap, FlaskConical, Palette, Dumbbell,
  BookOpen, Star, Rocket, Trophy, Brain, Medal,
  BookMarked, Crown, Flame, Zap, Smile, Glasses,
  UserCog, Bot, X, Sparkles
} from 'lucide-react';
import BaseButton from './common/BaseButton';
import {
  AVATAR_PALETTES,
  BORING_AVATAR_VARIANTS,
  createBoringAvatarId,
  getPaletteForTheme
} from '../utils/profileAssets';
import { useTheme } from '../contexts/ThemeContext';

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

// Paletas disponibles para el selector
const PALETTE_OPTIONS = [
  { id: 'blueGray', label: 'Azul gris', colors: AVATAR_PALETTES.blueGray },
  { id: 'neutral', label: 'Neutral', colors: AVATAR_PALETTES.neutral },
  { id: 'earth', label: 'Tierra', colors: AVATAR_PALETTES.earth },
  { id: 'sage', label: 'Verde', colors: AVATAR_PALETTES.sage },
  { id: 'cool', label: 'Frío', colors: AVATAR_PALETTES.cool },
  { id: 'sunset', label: 'Cálido', colors: AVATAR_PALETTES.sunset },
];

function AvatarSelector({ currentAvatar, onSelectAvatar, onClose, userName = '', userEmail = '' }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('icons'); // 'icons' | 'generative'
  const [selectedVariant, setSelectedVariant] = useState('marble');
  const [selectedPalette, setSelectedPalette] = useState('blueGray');

  // Seed para Boring Avatars (nombre o email del usuario)
  const avatarSeed = userName || userEmail || 'usuario';

  // Verificar si el avatar actual es un boring avatar
  const isBoringAvatar = currentAvatar?.startsWith('boring:');

  const handleSelectBoringAvatar = () => {
    const avatarId = createBoringAvatarId(selectedVariant, selectedPalette);
    onSelectAvatar(avatarId);
  };

  return (
    <div className="avatar-selector-overlay" onClick={onClose}>
      <div className="avatar-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="avatar-selector-header">
          <h3 className="avatar-selector-title">Selecciona tu Avatar</h3>
          <button className="avatar-selector-close" onClick={onClose}>
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'icons'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
            onClick={() => setActiveTab('icons')}
          >
            <User size={16} />
            Iconos
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'generative'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
            onClick={() => setActiveTab('generative')}
          >
            <Sparkles size={16} />
            Generativos
          </button>
        </div>

        {/* Tab Content: Iconos */}
        {activeTab === 'icons' && (
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
        )}

        {/* Tab Content: Generativos (Boring Avatars) */}
        {activeTab === 'generative' && (
          <div className="space-y-4">
            {/* Preview del avatar */}
            <div className="flex flex-col items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
              <div className="relative">
                <Avatar
                  size={80}
                  name={avatarSeed}
                  variant={selectedVariant}
                  colors={PALETTE_OPTIONS.find(p => p.id === selectedPalette)?.colors || AVATAR_PALETTES.blueGray}
                />
                {isBoringAvatar && currentAvatar === createBoringAvatarId(selectedVariant, selectedPalette) && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Star size={12} fill="white" className="text-white" />
                  </div>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Vista previa basada en tu nombre
              </p>
            </div>

            {/* Selector de variante */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Estilo
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BORING_AVATAR_VARIANTS.map(({ id, label }) => (
                  <button
                    key={id}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      selectedVariant === id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                    onClick={() => setSelectedVariant(id)}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Avatar
                        size={36}
                        name={avatarSeed}
                        variant={id}
                        colors={PALETTE_OPTIONS.find(p => p.id === selectedPalette)?.colors || AVATAR_PALETTES.blueGray}
                      />
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">{label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de paleta */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Paleta de colores
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PALETTE_OPTIONS.map(({ id, label, colors }) => (
                  <button
                    key={id}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      selectedPalette === id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                    onClick={() => setSelectedPalette(id)}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex gap-0.5">
                        {colors.slice(0, 5).map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">{label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Botón aplicar */}
            <BaseButton
              variant="primary"
              onClick={handleSelectBoringAvatar}
              fullWidth
            >
              <Sparkles size={16} />
              Aplicar avatar generativo
            </BaseButton>
          </div>
        )}

        <div className="mt-4">
          <BaseButton
            variant="secondary"
            onClick={onClose}
            fullWidth
          >
            Cerrar
          </BaseButton>
        </div>
      </div>
    </div>
  );
}

export default AvatarSelector;
