import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: '8px',
        borderRadius: '6px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-tertiary)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
      aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDarkMode ? (
        <Sun size={20} style={{ color: '#fbbf24' }} />
      ) : (
        <Moon size={20} style={{ color: 'var(--color-text-secondary)' }} />
      )}
    </button>
  );
}

export default ThemeToggle;
