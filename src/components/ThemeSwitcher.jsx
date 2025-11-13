import { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, THEMES, THEME_INFO } from '../contexts/ThemeContext';
import BaseButton from './common/BaseButton';

/**
 * ThemeSwitcher - Selector de temas con dropdown
 * Refactorizado para usar Design System 3.0 (100% Tailwind, 0 CSS custom)
 */
function ThemeSwitcher() {
  const { currentTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleThemeSelect = (theme) => {
    setTheme(theme);
    setIsOpen(false);
  };

  const currentThemeInfo = THEME_INFO[currentTheme];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <BaseButton
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="sm"
        icon={Palette}
        aria-label="Cambiar tema"
        title={`Tema actual: ${currentThemeInfo.name}`}
      />

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg overflow-hidden z-50"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="py-1">
            {Object.values(THEMES).map((theme) => {
              const info = THEME_INFO[theme];
              const isSelected = currentTheme === theme;

              return (
                <button
                  key={theme}
                  className={`
                    w-full px-4 py-3 flex items-center justify-between gap-3
                    hover:bg-opacity-80 transition-colors duration-150 text-left
                    ${isSelected ? '' : ''}
                  `}
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--color-bg-hover)'
                      : 'transparent',
                    color: 'var(--color-text-primary)'
                  }}
                  onClick={() => handleThemeSelect(theme)}
                >
                  <div className="flex-1">
                    <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {info.name}
                    </div>
                    <div className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {info.description}
                    </div>
                  </div>
                  {isSelected && (
                    <Check
                      size={18}
                      strokeWidth={2}
                      style={{ color: 'var(--color-primary)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeSwitcher;
